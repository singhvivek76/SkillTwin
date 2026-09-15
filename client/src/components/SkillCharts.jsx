import React from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

export function SkillRadar({ skills = [] }) {
  const radarData = skills.map((s) => ({
    subject: s.skill,
    score: s.score,
    fullMark: 100,
  }));

  if (radarData.length < 3) return null;

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
          <PolarGrid stroke="#263344" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: "#94a3b8", fontSize: 11, fontFamily: "JetBrains Mono" }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            stroke="#263344"
            tick={{ fill: "#64748b", fontSize: 9 }}
          />
          <Radar
            name="Skills"
            dataKey="score"
            stroke="#2dd4bf"
            fill="#2dd4bf"
            fillOpacity={0.35}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ProgressChart({ history = [] }) {
  if (!history || history.length < 2) {
    return (
      <div className="flex h-48 items-center justify-center font-mono text-xs text-muted">
        Complete challenges or analyze more repos to view progress timeline.
      </div>
    );
  }

  const chartData = history.map((item, idx) => ({
    name: `#${idx + 1}`,
    score: item.overall,
    label: item.label,
  }));

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <XAxis dataKey="name" stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 10 }} />
          <YAxis domain={[0, 100]} stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 10 }} />
          <Tooltip
            contentStyle={{ backgroundColor: "#0f131a", borderColor: "#263344", borderRadius: 8 }}
            labelStyle={{ color: "#2dd4bf", fontSize: 11 }}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#2dd4bf"
            strokeWidth={2.5}
            dot={{ r: 4, fill: "#2dd4bf" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
