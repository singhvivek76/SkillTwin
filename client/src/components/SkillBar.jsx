import React from "react";

export function SkillBar({ skill, score, note, previous }) {
  const isImproved = previous !== undefined && score > previous;

  const getScoreColor = (val) => {
    if (val >= 70) return "text-[#34d399]";
    if (val >= 50) return "text-[#f59e0b]";
    return "text-[#ef4444]";
  };

  const getProgressBg = (val) => {
    if (val >= 70) return "bg-[#34d399]";
    if (val >= 50) return "bg-[#f59e0b]";
    return "bg-[#ef4444]";
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="font-medium text-white">{skill}</span>
          {note && <span className="text-muted text-[11px]">· {note}</span>}
        </div>
        <div className="flex items-center gap-1.5 font-mono">
          {isImproved && (
            <span className="text-muted line-through">{previous}%</span>
          )}
          <span className={`font-bold ${getScoreColor(score)}`}>
            {score}%
          </span>
          {isImproved && (
            <span className="text-[10px] text-[#34d399] font-bold">▲ +{score - previous}%</span>
          )}
        </div>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[#1c2431]">
        <div
          className={`h-full rounded-full transition-all duration-700 ${getProgressBg(score)}`}
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
    </div>
  );
}
