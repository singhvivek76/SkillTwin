import React from "react";

export default function Landing({ onGetStarted }) {
  return (
    <div className="min-h-screen bg-[#0c0f14] text-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 border-b border-[#1f2937]">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2dd4bf] font-bold text-[#0c0f14]">
            ✦
          </span>
          <span className="font-mono text-lg font-bold tracking-tight">SkillTwin</span>
        </div>
        <button
          onClick={onGetStarted}
          className="rounded-lg bg-[#2dd4bf] px-4 py-2 font-mono text-xs font-semibold text-[#0c0f14] hover:bg-[#2dd4bf]/90 transition-colors"
        >
          Sign in / Sign up
        </button>
      </header>

      <main className="mx-auto max-w-4xl px-6 pt-20 pb-24 text-center">
        <span className="inline-block rounded-full border border-[#2dd4bf]/40 bg-[#2dd4bf]/10 px-4 py-1.5 font-mono text-xs font-medium text-[#2dd4bf]">
          Live AI Technical Evaluation
        </span>
        <h1 className="mt-6 text-4xl sm:text-6xl font-bold tracking-tight leading-tight">
          Your code, scored. <br />
          <span className="text-[#2dd4bf]">Then coached in real time.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-muted text-base sm:text-lg">
          Paste your public GitHub repository URL. SkillTwin fetches your code, builds your
          live skill profile, isolates your biggest vulnerability, and reassesses you once you solve it.
        </p>

        <div className="mt-10 flex justify-center gap-4">
          <button
            onClick={onGetStarted}
            className="rounded-lg bg-[#2dd4bf] px-6 py-3 font-mono text-sm font-bold text-[#0c0f14] hover:bg-[#2dd4bf]/90 transition-colors"
          >
            Start Assessment →
          </button>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3 text-left">
          <div className="panel p-5">
            <h3 className="font-mono text-sm font-semibold text-[#2dd4bf]">1. Real Repo Extraction</h3>
            <p className="mt-2 text-xs text-muted leading-relaxed">
              Fetches package dependencies, file structures, and language distribution via GitHub REST API.
            </p>
          </div>
          <div className="panel p-5">
            <h3 className="font-mono text-sm font-semibold text-[#2dd4bf]">2. Skill Twin Profile</h3>
            <p className="mt-2 text-xs text-muted leading-relaxed">
              Generates full-stack skill trees, radar dimensions, and identifies your critical gaps.
            </p>
          </div>
          <div className="panel p-5">
            <h3 className="font-mono text-sm font-semibold text-[#2dd4bf]">3. Adaptive Challenge</h3>
            <p className="mt-2 text-xs text-muted leading-relaxed">
              Fix the vulnerability in your code and watch your security score jump from 38% to 61%.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
