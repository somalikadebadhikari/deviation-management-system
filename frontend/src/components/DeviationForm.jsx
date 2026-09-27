import { RotateCcw, Save, Search, Calendar } from "lucide-react";

const SITE_OPTIONS = [
  "API Manufacturing Unit",
  "Formulation Plant",
  "Packaging Unit",
  "QC Laboratory",
  "Warehouse",
];

const SOURCE_OPTIONS = [
  "Internal Audit",
  "Customer Complaint",
  "In-process QC",
  "Batch Release Review",
  "Stability Study",
  "Regulatory Inspection",
];

const SEVERITY_OPTIONS = ["LOW", "MEDIUM", "HIGH"];

const DESCRIPTION_MAX_LENGTH = 2000;

function Field({ label, required, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100";

export default function DeviationForm({ formData, onChange, onSubmit, onReset, saving }) {
  const descriptionLength = formData.detailed_description?.length || 0;

  const update = (field) => (e) => onChange(field, e.target.value);

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Log Deviation</h1>
          <p className="mt-1 text-sm text-slate-500">
            Record any unexpected event, out-of-specification result or non-conformance.
          </p>
        </div>
        <span className="whitespace-nowrap rounded-md border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
          Draft
        </span>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto pr-1">
        <section>
          <h2 className="mb-3 text-xs font-semibold tracking-wide text-slate-500">
            1. Deviation Information
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Site / Plant" required>
              <select
                className={inputClass}
                value={formData.site_plant}
                onChange={update("site_plant")}
              >
                <option value="" disabled>
                  Select site
                </option>
                {SITE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Date of Occurrence" required>
              <div className="relative">
                <input
                  type="date"
                  className={`${inputClass} pr-9`}
                  value={formData.date_of_occurrence}
                  onChange={update("date_of_occurrence")}
                />
                <Calendar
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
            </Field>

            <Field label="Title / Short Description" required>
              <input
                type="text"
                placeholder="e.g. OOS result for Assay in Batch ABC-001"
                className={inputClass}
                value={formData.title}
                onChange={update("title")}
              />
            </Field>

            <Field label="Source" required>
              <select
                className={inputClass}
                value={formData.source}
                onChange={update("source")}
              >
                <option value="" disabled>
                  Select source
                </option>
                {SOURCE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Related Product / Material">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search product or material..."
                  className={`${inputClass} pr-9`}
                  value={formData.related_product}
                  onChange={update("related_product")}
                />
                <Search
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
            </Field>

            <Field label="Batch / Lot Number">
              <input
                type="text"
                placeholder="Enter batch / lot no."
                className={inputClass}
                value={formData.batch_number}
                onChange={update("batch_number")}
              />
            </Field>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-xs font-semibold tracking-wide text-slate-500">
            2. Deviation Details
          </h2>
          <div className="space-y-4">
            <Field label="Detailed Description" required>
              <textarea
                rows={4}
                maxLength={DESCRIPTION_MAX_LENGTH}
                placeholder="Describe what happened, where, when and how it was detected..."
                className={`${inputClass} resize-none`}
                value={formData.detailed_description}
                onChange={update("detailed_description")}
              />
              <div className="mt-1 text-right text-xs text-slate-400">
                {descriptionLength}/{DESCRIPTION_MAX_LENGTH}
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Initial Impact" required>
                <input
                  type="text"
                  placeholder="e.g. Potential product quality impact"
                  className={inputClass}
                  value={formData.initial_impact}
                  onChange={update("initial_impact")}
                />
              </Field>

              <Field label="Initial Severity" required>
                <select
                  className={inputClass}
                  value={formData.initial_severity}
                  onChange={update("initial_severity")}
                >
                  <option value="" disabled>
                    Select severity
                  </option>
                  {SEVERITY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <RotateCcw size={16} />
          Reset Form
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save size={16} />
          {saving ? "Saving..." : "Save Deviation"}
        </button>
      </div>
    </div>
  );
}
