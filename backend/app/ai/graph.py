"""
LangGraph workflow for the AI assistant.

Flow:
    Extract Information -> Validate Fields -> Assess Risk -> Return Result

Kept intentionally simple: one linear graph, one state dict, no branching
agents. This graph is built once and reused by the API layer.
"""
from typing import TypedDict

from fastapi import HTTPException
from langgraph.graph import StateGraph, END

from app.ai.groq_service import extract_fields, assess_risk

REQUIRED_FIELDS = ["title", "detailed_description"]


class DeviationState(TypedDict, total=False):
    text: str
    extracted: dict
    risk: dict
    error: str


# ---------- Graph nodes ----------

def node_extract(state: DeviationState) -> DeviationState:
    extracted = extract_fields(state["text"])
    return {"extracted": extracted}


def node_validate(state: DeviationState) -> DeviationState:
    extracted = state.get("extracted", {})
    missing = [f for f in REQUIRED_FIELDS if not extracted.get(f)]
    if missing:
        raise HTTPException(
            status_code=422,
            detail=f"Extraction is missing required field(s): {', '.join(missing)}",
        )
    return {}


def node_assess(state: DeviationState) -> DeviationState:
    risk = assess_risk(state["extracted"])
    return {"risk": risk}


# ---------- Graph build ----------

def build_deviation_graph():
    graph = StateGraph(DeviationState)

    graph.add_node("extract", node_extract)
    graph.add_node("validate", node_validate)
    graph.add_node("assess", node_assess)

    graph.set_entry_point("extract")
    graph.add_edge("extract", "validate")
    graph.add_edge("validate", "assess")
    graph.add_edge("assess", END)

    return graph.compile()


# Built once at import time, reused by the API layer.
deviation_graph = build_deviation_graph()


def run_deviation_pipeline(text: str) -> DeviationState:
    """Convenience wrapper used by the /extract + /assess-risk combined flow if needed."""
    return deviation_graph.invoke({"text": text})
