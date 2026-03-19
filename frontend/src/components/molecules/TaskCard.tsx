import { CalendarClock, UserCircle } from "lucide-react";

import { cn } from "@/lib/utils";

type TaskStatus = "inbox" | "in_progress" | "review" | "done";

const agentConfig: Record<string, { emoji: string; color: string; bg: string }> = {
  "Jarvis": { emoji: "🦞", color: "text-orange-700", bg: "bg-orange-100 border-orange-200" },
  "Ace": { emoji: "📊", color: "text-blue-700", bg: "bg-blue-100 border-blue-200" },
  "Tex": { emoji: "🛠️", color: "text-emerald-700", bg: "bg-emerald-100 border-emerald-200" },
  "Max": { emoji: "🎯", color: "text-purple-700", bg: "bg-purple-100 border-purple-200" },
};

interface TaskCardProps {
  title: string;
  status?: TaskStatus;
  priority?: string;
  assignee?: string;
  due?: string;
  isOverdue?: boolean;
  approvalsPendingCount?: number;
  tags?: Array<{ id: string; name: string; color: string }>;
  isBlocked?: boolean;
  blockedByCount?: number;
  onClick?: () => void;
  draggable?: boolean;
  isDragging?: boolean;
  onDragStart?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd?: (event: React.DragEvent<HTMLDivElement>) => void;
}

export function TaskCard({
  title,
  status,
  priority,
  assignee,
  due,
  isOverdue = false,
  approvalsPendingCount = 0,
  tags = [],
  isBlocked = false,
  blockedByCount = 0,
  onClick,
  draggable = false,
  isDragging = false,
  onDragStart,
  onDragEnd,
}: TaskCardProps) {
  const hasPendingApproval = approvalsPendingCount > 0;
  const needsLeadReview =
    status === "review" && !isBlocked && !hasPendingApproval;
  const leftBarClassName = isBlocked
    ? "bg-rose-400"
    : hasPendingApproval
      ? "bg-amber-400"
      : needsLeadReview
        ? "bg-indigo-400"
        : null;
  const priorityBadge = (value?: string) => {
    if (!value) return null;
    const normalized = value.toLowerCase();
    if (normalized === "high") return "bg-rose-100 text-rose-700";
    if (normalized === "medium") return "bg-amber-100 text-amber-700";
    if (normalized === "low") return "bg-emerald-100 text-emerald-700";
    return "bg-slate-100 text-slate-600";
  };

  const priorityLabel = priority ? priority.toUpperCase() : "MEDIUM";
  const visibleTags = tags.slice(0, 3);

  // Resolve agent display
  const agent = assignee ? agentConfig[assignee] || null : null;

  return (
    <div
      className={cn(
        "group relative cursor-pointer rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md",
        isDragging && "opacity-60 shadow-none",
        hasPendingApproval && "border-amber-200 bg-amber-50/40",
        isBlocked && "border-rose-200 bg-rose-50/50",
        needsLeadReview && "border-indigo-200 bg-indigo-50/30",
      )}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick?.();
        }
      }}
    >
      {leftBarClassName ? (
        <span
          className={cn(
            "absolute left-0 top-0 h-full w-1 rounded-l-lg",
            leftBarClassName,
          )}
        />
      ) : null}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <p className="text-sm font-medium text-slate-900 line-clamp-2 break-words">
            {title}
          </p>
          {isBlocked ? (
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-rose-700">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              Blocked{blockedByCount > 0 ? ` · ${blockedByCount}` : ""}
            </div>
          ) : null}
          {hasPendingApproval ? (
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              Approval needed · {approvalsPendingCount}
            </div>
          ) : null}
          {needsLeadReview ? (
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-indigo-700">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
              Waiting for lead review
            </div>
          ) : null}
          {/* Tags - more prominent */}
          {visibleTags.length ? (
            <div className="flex flex-wrap items-center gap-1.5">
              {visibleTags.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider"
                  style={{
                    backgroundColor: `#${tag.color}20`,
                    borderColor: `#${tag.color}40`,
                    color: `#${tag.color}`,
                  }}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: `#${tag.color}` }}
                  />
                  {tag.name}
                </span>
              ))}
              {tags.length > visibleTags.length ? (
                <span className="text-[10px] font-semibold text-slate-500">
                  +{tags.length - visibleTags.length}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="flex flex-shrink-0 flex-col items-end gap-2">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide",
              priorityBadge(priority) ?? "bg-slate-100 text-slate-600",
            )}
          >
            {priorityLabel}
          </span>
        </div>
      </div>
      {/* Agent - prominent colored badge */}
      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        {agent && assignee ? (
          <div className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold",
            agent.bg, agent.color,
          )}>
            <span className="text-sm">{agent.emoji}</span>
            <span>{assignee}</span>
          </div>
        ) : assignee ? (
          <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
            <UserCircle className="h-4 w-4" />
            <span>{assignee}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-slate-400">
            <UserCircle className="h-4 w-4" />
            <span className="italic">Unassigned</span>
          </div>
        )}
        {due ? (
          <div
            className={cn(
              "flex items-center gap-2",
              isOverdue && "font-semibold text-rose-600",
            )}
          >
            <CalendarClock
              className={cn(
                "h-4 w-4",
                isOverdue ? "text-rose-500" : "text-slate-400",
              )}
            />
            <span>{due}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
