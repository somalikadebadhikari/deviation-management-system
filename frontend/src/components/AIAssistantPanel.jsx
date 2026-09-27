import { useRef, useState } from "react";
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  Bot,
  Send,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { uploadDocument, extractFields, assessRisk } from "../lib/api";

const SUPPORTED_FORMATS = "PDF, DOCX, TXT, XLS, JPG, PNG";
const MAX_FILE_SIZE_MB = 10;

const INITIAL_MESSAGE = {
  role: "assistant",
  text: "Upload a deviation report, lab result, or paste text above. I will automatically extract the relevant details and populate the form for you.",
};

export default function AIAssistantPanel({ onExtractionComplete }) {
  const [dragActive, setDragActive] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

  function addMessage(role, text) {
    setMessages((prev) => [...prev, { role, text }]);
  }

  // Shared pipeline: raw text -> /extract -> /assess-risk -> hand results to parent form.
  async function runExtractionPipeline(text, { fromUpload } = {}) {
    if (!text || !text.trim()) {
      addMessage("assistant", "That document/text doesn't seem to contain anything I can read.");
      return;
    }

    setIsProcessing(true);
    try {
      if (!fromUpload) {
        setProgress(20);
        setStatusText("Analyzing document content and extracting key details...");
      }

      const extracted = await extractFields(text);
      setProgress(65);
      setStatusText("Assessing initial impact and severity...");

      const risk = await assessRisk(extracted);
      setProgress(100);
      setStatusText("Done");

      onExtractionComplete({ ...extracted, ...risk });
      addMessage(
        "assistant",
        `I've extracted the deviation details and populated the form, including a suggested "${risk.initial_severity}" severity. Please review and edit anything before saving.`
      );
    } catch (err) {
      addMessage("assistant", `I ran into a problem: ${err.message}`);
    } finally {
      setIsProcessing(false);
      setTimeout(() => {
        setProgress(0);
        setStatusText("");
      }, 1200);
    }
  }

  async function handleFile(file) {
    if (!file) return;
    if (file.type !== "application/pdf") {
      addMessage("assistant", "I can currently only read PDF uploads — try pasting the text instead.");
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      addMessage("assistant", `That file is over the ${MAX_FILE_SIZE_MB}MB limit.`);
      return;
    }

    setIsProcessing(true);
    setProgress(15);
    setStatusText("Uploading document...");
    try {
      const { text } = await uploadDocument(file);
      setProgress(35);
      setStatusText("Analyzing document content and extracting key details...");
      await runExtractionPipeline(text, { fromUpload: true });
    } catch (err) {
      addMessage("assistant", `Couldn't read that file: ${err.message}`);
      setIsProcessing(false);
      setProgress(0);
      setStatusText("");
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  }

  function handlePasteSubmit() {
    if (!pasteText.trim() || isProcessing) return;
    addMessage("user", pasteText.trim());
    runExtractionPipeline(pasteText.trim());
    setPasteText("");
  }

  function handleChatSubmit() {
    const text = chatInput.trim();
    if (!text) return;
    addMessage("user", text);
    setChatInput("");
    // No general Q&A endpoint on the backend yet — nudge toward the supported flow.
    addMessage(
      "assistant",
      "I can help by extracting details from a pasted note or uploaded document — try that above."
    );
  }

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-blue-600" />
          <h2 className="text-base font-semibold text-slate-900">AI Deviation Assistant</h2>
        </div>
        <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-600">
          BETA
        </span>
      </div>

      {/* Drag & drop zone */}
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors ${
          dragActive ? "border-blue-400 bg-blue-50" : "border-slate-300 bg-slate-50"
        }`}
      >
        <FileText size={22} className="text-slate-400" />
        <p className="text-sm text-slate-600">
          Drag & drop supporting document here
          <br />
          or{" "}
          <span className="font-medium text-blue-600 underline underline-offset-2">
            click to browse
          </span>
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </label>

      <div className="my-3 flex items-center gap-3 text-xs text-slate-400">
        <div className="h-px flex-1 bg-slate-200" />
        OR
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      {/* Paste text box */}
      <div className="flex items-start gap-2 rounded-lg border border-slate-300 px-3 py-2">
        <FileText size={16} className="mt-0.5 shrink-0 text-slate-400" />
        <textarea
          rows={1}
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handlePasteSubmit();
            }
          }}
          placeholder="Paste deviation details / notes"
          className="max-h-24 flex-1 resize-none border-none text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
        />
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5">
        <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-green-600" />
        <p className="text-xs text-green-700">
          Supported formats: {SUPPORTED_FORMATS}
          <br />
          Max file size: {MAX_FILE_SIZE_MB}MB
        </p>
      </div>

      {/* Extraction progress */}
      {isProcessing && (
        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between text-xs font-medium text-slate-600">
            <span>EXTRACTION PROGRESS</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-slate-500">{statusText || "Please wait, this may take a few moments."}</p>
        </div>
      )}

      {/* Conversation */}
      <div className="mt-4 flex-1 space-y-3 overflow-y-auto">
        <h3 className="text-xs font-semibold tracking-wide text-slate-500">AI ASSISTANT</h3>
        {messages.map((m, i) =>
          m.role === "assistant" ? (
            <div key={i} className="flex items-start gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600">
                <Bot size={14} className="text-white" />
              </div>
              <div className="rounded-lg rounded-tl-none bg-blue-50 px-3 py-2 text-sm text-slate-700">
                {m.text}
              </div>
            </div>
          ) : (
            <div key={i} className="flex justify-end">
              <div className="max-w-[85%] rounded-lg rounded-tr-none bg-slate-100 px-3 py-2 text-sm text-slate-700">
                {m.text}
              </div>
            </div>
          )
        )}
      </div>

      {/* Chat input */}
      <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3">
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleChatSubmit()}
          placeholder="Ask me anything about deviations..."
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
        <button
          type="button"
          onClick={handleChatSubmit}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700"
        >
          <Send size={15} />
        </button>
      </div>
      <p className="mt-2 flex items-center justify-center gap-1 text-center text-[11px] text-slate-400">
        <AlertCircle size={11} />
        AI responses may contain errors. Please verify information.
      </p>
    </div>
  );
}
