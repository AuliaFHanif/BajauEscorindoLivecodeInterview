import FeedbackCard from "./FeedbackCard";

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="h-4 w-3/4 rounded bg-slate-200" />
      <div className="mt-2 h-3 w-1/2 rounded bg-slate-200" />
      <div className="mt-4 h-3 w-full rounded bg-slate-200" />
      <div className="mt-2 h-3 w-5/6 rounded bg-slate-200" />
    </div>
  );
}

export default function FeedbackList({ items, isLoading, deletingIds, onToggleStatus, onDelete }) {
  if (isLoading) {
    return (
      <div className="grid gap-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="rounded-xl bg-white p-8 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
        No feedback yet. Add your first item above.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <FeedbackCard
          key={item.id}
          item={item}
          onToggleStatus={onToggleStatus}
          onDelete={onDelete}
          deleting={deletingIds.has(item.id)}
        />
      ))}
    </div>
  );
}
