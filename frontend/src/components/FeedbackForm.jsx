import { useMemo, useState } from "react";

const MAX_LEN = 2000;

export default function FeedbackForm({ onSubmit, isSubmitting }) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  const remaining = useMemo(() => MAX_LEN - text.length, [text]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmed = text.trim();

    if (!trimmed) {
      setError("Feedback text is required.");
      return;
    }

    if (trimmed.length > MAX_LEN) {
      setError("Feedback cannot exceed 2000 characters.");
      return;
    }

    setError("");
    const ok = await onSubmit(trimmed);
    if (ok) {
      setText("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <label htmlFor="feedback-text" className="mb-2 block text-sm font-semibold text-slate-700">
        Share your product feedback
      </label>
      <textarea
        id="feedback-text"
        value={text}
        onChange={(event) => setText(event.target.value)}
        className="h-32 w-full resize-none rounded-lg border border-slate-300 p-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
        placeholder="Example: The dashboard takes forever to load on mobile."
        maxLength={MAX_LEN}
        disabled={isSubmitting}
      />
      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
        <span>{remaining} characters remaining</span>
        {error ? <span className="font-medium text-rose-600">{error}</span> : null}
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-3 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {isSubmitting ? "Submitting with AI..." : "Submit feedback"}
      </button>
    </form>
  );
}
