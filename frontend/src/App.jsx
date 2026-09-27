import { useState } from "react";
import DeviationForm from "./components/DeviationForm";
import AIAssistantPanel from "./components/AIAssistantPanel";
import { saveDeviation } from "./lib/api";

const EMPTY_FORM = {
  site_plant: "",
  date_of_occurrence: "",
  title: "",
  source: "",
  related_product: "",
  batch_number: "",
  detailed_description: "",
  initial_impact: "",
  initial_severity: "",
};

export default function App() {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null); // { type: "success" | "error", message }

  function updateField(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  // Called by the AI panel once extraction + risk assessment finish.
  // Only fills in fields the user hasn't already typed something into,
  // so it never clobbers manual edits.
  function handleExtractionComplete(aiFields) {
    setFormData((prev) => {
      const next = { ...prev };
      for (const [key, value] of Object.entries(aiFields)) {
        if (!next[key] && value) next[key] = value;
      }
      return next;
    });
  }

  function handleReset() {
    setFormData(EMPTY_FORM);
    setToast(null);
  }

  async function handleSave() {
    setSaving(true);
    setToast(null);
    try {
      await saveDeviation(formData);
      setToast({ type: "success", message: "Deviation saved." });
      setFormData(EMPTY_FORM);
    } catch (err) {
      setToast({ type: "error", message: err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {toast && (
        <div
          className={`mx-auto mb-4 max-w-6xl rounded-lg px-4 py-2 text-sm ${
            toast.type === "success"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {toast.message}
        </div>
      )}
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-[1.3fr_1fr]">
        <DeviationForm
          formData={formData}
          onChange={updateField}
          onSubmit={handleSave}
          onReset={handleReset}
          saving={saving}
        />
        <AIAssistantPanel onExtractionComplete={handleExtractionComplete} />
      </div>
    </div>
  );
}
