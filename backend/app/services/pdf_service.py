"""
Simple PDF text extraction service.
"""
from io import BytesIO

from fastapi import HTTPException
from pypdf import PdfReader


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text from PDF bytes. Raises HTTPException on failure/empty result."""
    try:
        reader = PdfReader(BytesIO(file_bytes))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid or corrupted PDF file.")

    text_parts = []
    for page in reader.pages:
        page_text = page.extract_text() or ""
        text_parts.append(page_text)

    text = "\n".join(text_parts).strip()

    if not text:
        raise HTTPException(
            status_code=422,
            detail="No extractable text found in the PDF (it may be scanned/image-based).",
        )

    return text
