const sentimentStyles = {
  positive: "bg-emerald-100 text-emerald-800",
  negative: "bg-rose-100 text-rose-800",
  neutral: "bg-slate-100 text-slate-700",
};

const statusCycle = {
  open: "in-progress",
  "in-progress": "resolved",
  resolved: "open",
};

export default function FeedbackCard({ item, onToggleStatus, onDelete, deleting }) {
  const aiUnavailable = !item.sentiment || !item.category || !item.action_summary;

  return (
    <article
      className={`group relative rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition ${deleting ? "scale-95 opacity-0" : "opacity-100"}`}
    >
      <button
        onClick={() => onDelete(item.id)}
        className="absolute right-3 top-3 rounded-md border border-rose-200 px-2 py-1 text-xs text-rose-700 opacity-0 transition hover:bg-rose-50 group-hover:opacity-100"
      >
        Delete
      </button>

      <p className="pr-16 text-sm text-slate-700">{item.text}</p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">{item.status}</span>
        {item.sentiment ? (
          <span className={`rounded-full px-2 py-1 text-xs font-medium ${sentimentStyles[item.sentiment] || sentimentStyles.neutral}`}>
            {item.sentiment}
          </span>
        ) : null}
        {item.category ? (
          <span className="rounded-full bg-cyan-100 px-2 py-1 text-xs font-medium text-cyan-800">{item.category}</span>
        ) : null}
      </div>

      {item.action_summary ? (
        <blockquote className="mt-3 border-l-2 border-teal-300 pl-3 text-sm italic text-slate-600">
          {item.action_summary}
        </blockquote>
      ) : null}

      {aiUnavailable ? (
        <p className="mt-3 text-xs text-amber-700">AI enrichment unavailable for this item.</p>
      ) : null}

      <button
        onClick={() => onToggleStatus(item.id, statusCycle[item.status] || "open")}
        className="mt-4 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
      >
        Cycle status
      </button>
    </article>
  );
}
