import { useEffect, useMemo, useState } from "react";
import FeedbackForm from "./components/FeedbackForm";
import FeedbackList from "./components/FeedbackList";
import { createFeedback, deleteFeedback, getApiErrorMessage, listFeedback, updateFeedbackStatus } from "./api/client";
import { logger } from "./utils/logger";

const tabs = ["all", "open", "in-progress", "resolved"];

export default function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [globalError, setGlobalError] = useState("");
  const [deletingIds, setDeletingIds] = useState(new Set());

  useEffect(() => {
    (async () => {
      try {
        const data = await listFeedback();
        setItems(data);
      } catch (error) {
        logger.error("Failed to load feedback", { error });
        setGlobalError(getApiErrorMessage(error, "Failed to load feedback from API."));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredItems = useMemo(() => {
    if (activeTab === "all") return items;
    return items.filter((item) => item.status === activeTab);
  }, [items, activeTab]);

  const counts = useMemo(
    () => ({
      all: items.length,
      open: items.filter((item) => item.status === "open").length,
      "in-progress": items.filter((item) => item.status === "in-progress").length,
      resolved: items.filter((item) => item.status === "resolved").length,
    }),
    [items]
  );

  const handleSubmit = async (text) => {
    setSubmitting(true);
    setGlobalError("");
    try {
      const created = await createFeedback(text);
      setItems((prev) => [created, ...prev]);
      return true;
    } catch (error) {
      logger.error("Failed to submit feedback", { error, textLength: text.length });
      setGlobalError(getApiErrorMessage(error, "Failed to submit feedback. Please try again."));
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id, nextStatus) => {
    const previous = items;
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status: nextStatus } : item)));

    try {
      const updated = await updateFeedbackStatus(id, nextStatus);
      setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
    } catch (error) {
      logger.error("Failed to update feedback status", { error, id, nextStatus });
      setItems(previous);
      setGlobalError(getApiErrorMessage(error, "Failed to update status."));
    }
  };

  const handleDelete = async (id) => {
    setDeletingIds((prev) => new Set(prev).add(id));

    await new Promise((resolve) => setTimeout(resolve, 180));

    const previous = items;
    setItems((prev) => prev.filter((item) => item.id !== id));

    try {
      await deleteFeedback(id);
    } catch (error) {
      logger.error("Failed to delete feedback", { error, id });
      setItems(previous);
      setGlobalError(getApiErrorMessage(error, "Failed to delete feedback."));
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-cyan-50 via-slate-100 to-slate-200 px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Feedback Tracker</h1>
          <p className="mt-1 text-sm text-slate-600">AI-powered triage for product feedback with Gemini enrichment.</p>
        </header>

        <FeedbackForm onSubmit={handleSubmit} isSubmitting={submitting} />

        {globalError ? (
          <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {globalError}
          </div>
        ) : null}

        <section className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs text-slate-500">Total</p>
            <p className="text-xl font-bold text-slate-900">{counts.all}</p>
          </div>
          <div className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs text-slate-500">In progress</p>
            <p className="text-xl font-bold text-amber-700">{counts["in-progress"]}</p>
          </div>
          <div className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs text-slate-500">Resolved</p>
            <p className="text-xl font-bold text-emerald-700">{counts.resolved}</p>
          </div>
        </section>

        <nav className="mt-5 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                activeTab === tab
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
              }`}
            >
              {tab} ({counts[tab] || 0})
            </button>
          ))}
        </nav>

        <section className="mt-4">
          <FeedbackList
            items={filteredItems}
            isLoading={loading}
            deletingIds={deletingIds}
            onToggleStatus={handleToggleStatus}
            onDelete={handleDelete}
          />
        </section>
      </div>
    </main>
  );
}
