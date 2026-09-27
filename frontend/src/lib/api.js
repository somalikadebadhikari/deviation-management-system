// Thin wrapper around the Deviation Management backend endpoints.
// Set VITE_API_BASE_URL in your .env if the API isn't on localhost:8000.

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

async function handle(response) {
  if (!response.ok) {
    let detail = response.statusText;
    try {
      const body = await response.json();
      detail = body.detail || detail;
    } catch {
      // response wasn't JSON, fall back to statusText
    }
    throw new Error(detail);
  }
  return response.json();
}

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${BASE_URL}/upload`, {
    method: "POST",
    body: formData,
  });
  return handle(res); // { text }
}

export async function extractFields(text) {
  const res = await fetch(`${BASE_URL}/extract`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  return handle(res); // { site_plant, date_of_occurrence, title, source, related_product, batch_number, detailed_description }
}

export async function assessRisk(extractedData) {
  const res = await fetch(`${BASE_URL}/assess-risk`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(extractedData),
  });
  return handle(res); // { initial_impact, initial_severity, reasoning }
}

export async function saveDeviation(deviation) {
  const res = await fetch(`${BASE_URL}/deviations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(deviation),
  });
  return handle(res);
}

export async function listDeviations() {
  const res = await fetch(`${BASE_URL}/deviations`);
  return handle(res);
}
