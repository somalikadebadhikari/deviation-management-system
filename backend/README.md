# Deviation Management Backend

Simple FastAPI backend for the AI-powered Deviation Management assignment.

## Stack
FastAPI · PostgreSQL · SQLAlchemy · LangGraph · Groq LLM

## Project structure
```
backend/
├── app/
│   ├── api/routes.py        # all 5 endpoints
│   ├── models/deviation.py  # SQLAlchemy model
│   ├── schemas/deviation.py # Pydantic request/response schemas
│   ├── services/pdf_service.py  # PDF text extraction
│   ├── ai/groq_service.py   # Groq prompts (extract, assess risk)
│   ├── ai/graph.py          # LangGraph: extract -> validate -> assess -> result
│   ├── database/session.py  # engine, session, Base
│   ├── config.py            # settings loaded from .env
│   └── main.py              # FastAPI app
├── requirements.txt
└── .env.example
```

## Setup

1. Create a virtual environment and install dependencies:
   ```
   python -m venv venv
   source venv/bin/activate   # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. Copy `.env.example` to `.env` and fill in your values:
   ```
   GROQ_API_KEY=your_key_here
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/deviation_db
   ```
   Make sure the `deviation_db` database exists in your PostgreSQL instance
   (tables are auto-created on app startup).

3. Run the server:
   ```
   uvicorn app.main:app --reload
   ```
   API docs available at `http://localhost:8000/docs`.

## Endpoints

| Method | Path           | Purpose                                   |
|--------|----------------|--------------------------------------------|
| POST   | /upload        | Upload a PDF, returns extracted raw text   |
| POST   | /extract       | Run AI field extraction on pasted text     |
| POST   | /assess-risk   | Run AI impact/severity assessment          |
| POST   | /deviations    | Save a deviation record                    |
| GET    | /deviations    | List all saved deviations                  |

## LangGraph workflow

`app/ai/graph.py` defines a single linear graph:

```
Extract Information -> Validate Fields -> Assess Risk -> Return Result
```

It reuses the same `extract_fields` / `assess_risk` functions from
`groq_service.py` that the individual `/extract` and `/assess-risk`
endpoints call directly. This keeps the endpoints simple and fast for the
frontend's two-step flow, while `run_deviation_pipeline(text)` in
`graph.py` demonstrates the full LangGraph pipeline end-to-end (useful for
a single combined "analyze this document" call, or for testing/demo
purposes).

## Notes / assumptions
- `date_of_occurrence` is stored as a plain string for simplicity (no
  date parsing/validation), since the AI extraction may return varied
  date formats.
- The Groq model used is `llama-3.3-70b-versatile` with
  `response_format={"type": "json_object"}` to force valid JSON output —
  change `MODEL` in `groq_service.py` if you'd rather use a different one.
- Validation errors (empty text, invalid PDF, empty extraction, invalid
  LLM response, invalid severity) all return clear 4xx/5xx HTTP errors
  with a `detail` message.
