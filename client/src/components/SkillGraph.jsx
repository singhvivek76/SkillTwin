import React from "react";

export function SkillGraph({ skills = [], weakest = "" }) {
  const domains = [
    { name: "Frontend", key: "Frontend" },
    { name: "Backend", key: "Backend" },
    { name: "Database", key: "Database" },
    { name: "Quality", key: "Quality" },
  ];

  return (
    <div className="rounded-xl border border-panelBorder bg-[#0f131a] p-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {domains.map((dom) => {
          const matchedSkills = skills.filter(
            (s) => s.category?.toLowerCase() === dom.key.toLowerCase()
          );

          return (
            <div
              key={dom.name}
              className="flex flex-col rounded-lg border border-[#1e293b] bg-[#161d28] p-3.5"
            >
              <div className="mb-3 flex items-center justify-between border-b border-[#263344] pb-2">
                <span className="font-mono text-xs font-semibold text-[#2dd4bf]">
                  {dom.name}
                </span>
                <span className="font-mono text-[11px] text-muted">
                  {matchedSkills.length} skills
                </span>
              </div>

              <div className="space-y-2.5">
                {matchedSkills.length > 0 ? (
                  matchedSkills.map((s) => {
                    const isWeak = s.skill === weakest;
                    return (
                      <div
                        key={s.skill}
                        className={`flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs ${
                          isWeak
                            ? "border border-[#ef4444]/40 bg-[#ef4444]/10"
                            : "bg-[#0f131a]"
                        }`}
                      >
                        <span className="text-gray-200">
                          {s.skill} {isWeak && "⚠️"}
                        </span>
                        <span
                          className={`font-mono font-bold ${
                            s.score >= 70
                              ? "text-[#34d399]"
                              : s.score >= 50
                              ? "text-[#f59e0b]"
                              : "text-[#ef4444]"
                          }`}
                        >
                          {s.score}%
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <span className="font-mono text-[11px] text-muted italic">
                    No components found
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
