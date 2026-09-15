import React, { useState, useEffect } from "react";
import { SkillBar } from "../components/SkillBar";
import { SkillGraph } from "../components/SkillGraph";
import { SkillRadar, ProgressChart } from "../components/SkillCharts";

const GITHUB_REPO_REGEX = /^(https?:\/\/)?(www\.)?github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+/;

export default function Dashboard({ user: initialUser, onLogout }) {
  const [step, setStep] = useState("submit"); // 'submit' | 'profile' | 'challenge' | 'result'
  const [source, setSource] = useState("");
  const [code, setCode] = useState("");
  const [sourceError, setSourceError] = useState("");
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);

  // Profile Edit State
  const [currentUser, setCurrentUser] = useState(initialUser);
  const [editingProfile, setEditingProfile] = useState(false);
  const [nameDraft, setNameDraft] = useState(initialUser?.fullName || initialUser?.name || "");
  const [collegeDraft, setCollegeDraft] = useState(initialUser?.college || "");
  const [savingProfile, setSavingProfile] = useState(false);

  // Assessment & Challenge State
  const [assessment, setAssessment] = useState(null);
  const [challenge, setChallenge] = useState(null);
  const [solution, setSolution] = useState("");
  const [result, setResult] = useState(null);

  // Persistent History Tracking
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem("skilltwin_history");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("skilltwin_history", JSON.stringify(history));
    } catch {
      // ignore storage error
    }
  }, [history]);

  function pushHistory(label, skills) {
    const overallScore = Math.round(
      skills.reduce((acc, s) => acc + s.score, 0) / (skills.length || 1)
    );
    const point = {
      at: Date.now(),
      label,
      overall: overallScore,
    };
    setHistory((prev) => [...prev, point].slice(-10));
  }

  // Save Inline Profile
  async function handleSaveProfile() {
    setSavingProfile(true);
    setError(null);
    try {
      const token = localStorage.getItem("skilltwin_token");
      const res = await fetch("http://localhost:5000/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          fullName: nameDraft.trim(),
          college: collegeDraft.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");

      setCurrentUser(data.user);
      localStorage.setItem("skilltwin_user", JSON.stringify(data.user));
      setEditingProfile(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingProfile(false);
    }
  }

  // 1. Submit & Analyze GitHub Repo
  async function handleAnalyze() {
    if (!GITHUB_REPO_REGEX.test(source.trim())) {
      setSourceError("Enter a valid GitHub repository URL (e.g. https://github.com/username/repository)");
      return;
    }
    setSourceError("");
    setError(null);
    setBusy("Inspecting repo files, dependencies, and generating skill twin…");

    try {
      const token = localStorage.getItem("skilltwin_token");
      const res = await fetch("http://localhost:5000/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          githubUrl: source.trim(),
          source: source.trim(),
          code,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");

      const enrichedSkills = (data.skills || []).map((s) => {
        let cat = s.category;
        if (!cat) {
          if (/React|Frontend|UI|CSS|HTML/i.test(s.skill)) cat = "Frontend";
          else if (/Mongo|SQL|Database|Postgres|Redis/i.test(s.skill)) cat = "Database";
          else if (/Security|Testing|Quality|Jest/i.test(s.skill)) cat = "Quality";
          else cat = "Backend";
        }
        return {
          skill: s.skill || s.name || "Engineering",
          score: typeof s.score === "number" ? s.score : 50,
          category: cat,
          note: s.note || "",
        };
      });

      const weakestSkill = data.weakest || {
        skill: "Security",
        score: 38,
        reason: "Endpoints accept raw payload without schema validation, passwords not hashed properly, and no rate limiting.",
      };

      const assessmentObj = {
        _id: data._id,
        projectName: data.projectName || source.split("/").filter(Boolean).pop()?.replace(/\.git$/, "") || "Project",
        summary: data.summary || "Full-stack project analyzed successfully.",
        skills: enrichedSkills,
        weakest: weakestSkill,
      };

      setAssessment(assessmentObj);
      setChallenge(null);
      setResult(null);
      setSolution("");
      setStep("profile");

      pushHistory(assessmentObj.projectName, enrichedSkills);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to analyze repository.");
    } finally {
      setBusy(null);
    }
  }

  // 2. Generate Adaptive Challenge
  function handleMakeChallenge() {
    const weakestSkill = assessment?.weakest?.skill || "Testing";
    setBusy(`Generating adaptive ${weakestSkill} challenge…`);

    setTimeout(() => {
      let challengeData;

      if (/Testing/i.test(weakestSkill)) {
        challengeData = {
          skill: weakestSkill,
          title: "Implement Automated Unit & Integration Tests",
          brief: "Your repository currently lacks automated test suites. Write a robust test suite using Jest/Supertest verifying happy paths and 400 error handling.",
          requirements: [
            "Test endpoint returns status 200/201 on valid input",
            "Test invalid payload returns HTTP 400 with descriptive error message",
            "Mock database calls or external dependencies cleanly"
          ],
          starterCode: `// tests/api.test.js\nconst request = require("supertest");\nconst app = require("../server");\n\ndescribe("API Endpoint Validation", () => {\n  it("should fail without test assertions", async () => {\n    // TODO: Write assertions for status code and payload\n  });\n});`,
          hints: [
            "Use expect(res.statusCode).toBe(200)",
            "Assert response body matches expected schema with expect(res.body).toHaveProperty('id')"
          ],
          sampleSolution: `// tests/api.test.js\nconst request = require("supertest");\nconst app = require("../server");\n\ndescribe("POST /api/resource", () => {\n  it("returns 201 and created object when payload is valid", async () => {\n    const res = await request(app)\n      .post("/api/resource")\n      .send({ name: "Production Item", price: 49 });\n    expect(res.statusCode).toBe(201);\n    expect(res.body).toHaveProperty("id");\n    expect(res.body.name).toBe("Production Item");\n  });\n\n  it("returns 400 when required fields are missing", async () => {\n    const res = await request(app)\n      .post("/api/resource")\n      .send({});\n    expect(res.statusCode).toBe(400);\n    expect(res.body).toHaveProperty("error");\n  });\n});`
        };
      } else if (/Security/i.test(weakestSkill)) {
        challengeData = {
          skill: weakestSkill,
          title: "Secure Authentication & Input Sanitization",
          brief: "Your project accepts raw payloads without schema validation. Refactor the route to hash passwords using bcrypt and validate inputs.",
          requirements: [
            "Validate required fields before executing database queries",
            "Hash plaintext passwords using bcrypt with at least 10 salt rounds",
            "Generate a signed JWT token with an expiration time"
          ],
          starterCode: `// routes/auth.js (Insecure route)\napp.post("/signup", async (req, res) => {\n  const user = await User.create(req.body); // Plaintext password vulnerability\n  res.json(user);\n});`,
          hints: ["Use await bcrypt.hash(password, 10)", "Never return user.password in the HTTP response"],
          sampleSolution: `app.post("/signup", async (req, res) => {\n  const { email, password } = req.body;\n  if (!email || !password) return res.status(400).json({ error: "Missing required fields" });\n  const hashedPassword = await bcrypt.hash(password, 10);\n  const user = await User.create({ email, password: hashedPassword });\n  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });\n  res.status(201).json({ token, user: { id: user._id, email } });\n});`
        };
      } else {
        challengeData = {
          skill: weakestSkill,
          title: `Harden & Refactor ${weakestSkill} Architecture`,
          brief: `Analyze and refactor your ${weakestSkill} components to adhere to production standards, modularity, and error handling.`,
          requirements: [
            `Apply standard design patterns for ${weakestSkill}`,
            "Implement resilient try/catch and HTTP error boundaries",
            "Optimize asynchronous execution and payload size"
          ],
          starterCode: `// Refactor this module for ${weakestSkill}\nfunction handleOperation(data) {\n  return data;\n}`,
          hints: ["Validate arguments before processing", "Handle edge cases such as null/undefined gracefully"],
          sampleSolution: `function handleOperation(data) {\n  if (!data || typeof data !== "object") throw new Error("Invalid input data");\n  return Object.freeze({ ...data, processedAt: new Date().toISOString() });\n}`
        };
      }

      setChallenge(challengeData);
      setSolution(challengeData.sampleSolution);
      setStep("challenge");
      setBusy(null);
    }, 600);
  }

  // 3. Submit Solution & Reassess
  async function handleSubmitSolution() {
    if (!solution || solution.trim().length < 5) {
      setError("Please write or paste your solution code before submitting.");
      return;
    }
    setError(null);
    setBusy("AI evaluating code quality, architecture, and score improvement…");

    try {
      const token = localStorage.getItem("skilltwin_token");
      const res = await fetch("http://localhost:5000/api/challenge/solve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          assessmentId: assessment?._id,
          skill: challenge?.skill || assessment?.weakest?.skill,
          previousScore: assessment?.weakest?.score || 35,
          challengeTitle: challenge?.title || "",
          solution: solution.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to evaluate challenge.");

      setResult(data);
      setStep("result");

      // Update skill score dynamically in state
      const targetSkill = challenge?.skill || assessment?.weakest?.skill;
      if (targetSkill) {
        const updatedSkillsList = (assessment.skills || []).map((s) =>
          s.skill === targetSkill ? { ...s, score: data.newScore } : s
        );
        setAssessment((prev) => ({
          ...prev,
          skills: updatedSkillsList,
        }));
        pushHistory(`${targetSkill} reassessed`, updatedSkillsList);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to evaluate challenge.");
    } finally {
      setBusy(null);
    }
  }

  // Metrics
  const activeSkills = assessment?.skills || [];
  const updatedSkills = activeSkills.map((s) =>
    result && s.skill === assessment?.weakest?.skill ? { ...s, score: result.newScore } : s
  );
  const overall = updatedSkills.length
    ? Math.round(updatedSkills.reduce((a, b) => a + b.score, 0) / updatedSkills.length)
    : 0;
  const strongSkills = updatedSkills.filter((s) => s.score >= 70);
  const weakSkills = updatedSkills.filter((s) => s.score < 50);

  return (
    <main className="min-h-screen bg-[#0c0f14] text-white px-4 py-8">
      <div className="mx-auto max-w-5xl">
        {/* Top Navbar with Profile Editor */}
        <header className="mb-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-panelBorder bg-[#18202c] px-3.5 py-1 font-mono text-xs text-brand">
              ✦ SkillTwin MVP
            </span>

            <div className="flex flex-wrap items-center gap-3">
              {editingProfile ? (
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    placeholder="Full name"
                    className="h-8 w-36 rounded-md border border-panelBorder bg-[#0f131a] px-2.5 font-mono text-xs outline-none focus:border-brand"
                  />
                  <input
                    value={collegeDraft}
                    onChange={(e) => setCollegeDraft(e.target.value)}
                    placeholder="College / branch"
                    className="h-8 w-40 rounded-md border border-panelBorder bg-[#0f131a] px-2.5 font-mono text-xs outline-none focus:border-brand"
                  />
                  <button
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    className="h-8 rounded-md bg-brand px-3 font-mono text-xs font-semibold text-[#0c0f14] hover:bg-brand/90 transition-colors"
                  >
                    {savingProfile ? "Saving…" : "Save"}
                  </button>
                  <button
                    onClick={() => {
                      setNameDraft(currentUser?.fullName || currentUser?.name || "");
                      setCollegeDraft(currentUser?.college || "");
                      setEditingProfile(false);
                    }}
                    className="h-8 rounded-md border border-panelBorder bg-[#18202c] px-2.5 font-mono text-xs text-muted hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditingProfile(true)}
                  className="font-mono text-xs text-muted underline hover:text-brand transition-colors"
                  title="Click to edit profile"
                >
                  {currentUser?.fullName || currentUser?.name || "Developer"}
                  {currentUser?.college ? ` · ${currentUser.college}` : " · Add college"}
                </button>
              )}

              <button
                onClick={onLogout}
                className="h-8 rounded-lg border border-panelBorder bg-[#18202c] px-3 font-mono text-xs hover:border-gray-500 transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>

          <h1 className="mt-5 text-4xl font-bold sm:text-5xl tracking-tight">
            Your code, scored — then coached.
          </h1>
          <p className="mt-3 max-w-2xl text-muted text-sm sm:text-base">
            Submit a public GitHub repo. SkillTwin builds a live skill profile, names your biggest gap,
            generates a targeted challenge, and reassesses you once you solve it.
          </p>

          {/* Workflow Steps Indicator */}
          <ol className="mt-6 flex flex-wrap gap-2 font-mono text-xs text-muted">
            {[
              { id: "submit", label: "Submit" },
              { id: "profile", label: "Skill profile" },
              { id: "challenge", label: "Gap + challenge" },
              { id: "result", label: "Reassessment" },
            ].map((s, idx) => {
              const order = ["submit", "profile", "challenge", "result"];
              const active = order.indexOf(step) >= idx;
              return (
                <li
                  key={s.id}
                  className={`rounded-full border px-3 py-1 transition-colors ${
                    active
                      ? "border-brand/60 text-brand bg-brand/10"
                      : "border-panelBorder"
                  }`}
                >
                  {idx + 1}. {s.label}
                </li>
              );
            })}
          </ol>
        </header>

        {error && (
          <div className="mb-6 rounded-lg border border-weak/40 bg-weak/10 p-4 text-xs text-weak flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="font-bold underline ml-4">
              Dismiss
            </button>
          </div>
        )}

        {/* 1. Submit Repository Section */}
        <section className="panel mb-8 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">1. Submit GitHub Project</h2>
            <span className="font-mono text-xs text-muted">Step 1 of 4</span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block font-mono text-xs text-gray-300">
                GitHub Repository URL <span className="text-brand">*Required</span>
              </label>
              <input
                type="url"
                value={source}
                onChange={(e) => {
                  setSource(e.target.value);
                  if (sourceError) setSourceError("");
                }}
                placeholder="https://github.com/your-username/your-repository"
                className={`mt-1.5 w-full rounded-lg border bg-[#0f131a] px-3.5 py-2.5 font-mono text-xs outline-none transition-colors ${
                  sourceError
                    ? "border-weak focus:border-weak"
                    : "border-panelBorder focus:border-brand"
                }`}
              />
              {sourceError && (
                <p className="mt-1 font-mono text-[11px] text-weak">{sourceError}</p>
              )}
            </div>

            <div>
              <label className="block font-mono text-xs text-gray-300">
                Main Source Files <span className="text-muted">(Optional)</span>
              </label>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="// Optional: Paste key controller or route code if you want deeper analysis..."
                rows={4}
                className="mt-1.5 w-full rounded-lg border border-panelBorder bg-[#0f131a] p-3 font-mono text-xs outline-none focus:border-brand"
              />
            </div>

            <button
              onClick={handleAnalyze}
              disabled={busy !== null}
              className="rounded-lg bg-brand px-5 py-2.5 font-mono text-xs font-bold text-[#0c0f14] hover:bg-brand/90 transition-colors disabled:opacity-50"
            >
              {busy ? busy : "✦ Analyze with SkillTwin AI"}
            </button>
          </div>
        </section>

        {/* 2. Skill Profile & Analytics */}
        {assessment && (
          <section className="panel mb-8 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-panelBorder pb-4">
              <div>
                <h2 className="text-lg font-bold">2. Skill Twin Profile</h2>
                <p className="mt-1 font-mono text-xs text-brand font-medium">
                  {assessment.projectName}
                </p>
              </div>
              <div className="rounded-xl border border-panelBorder bg-[#0f131a] px-4 py-2 text-right">
                <div className="font-mono text-[10px] uppercase text-muted">Overall Score</div>
                <div className="font-mono text-2xl font-bold text-brand">{overall}%</div>
              </div>
            </div>

            {/* Top 3 Summary Widgets */}
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-panelBorder bg-[#0f131a] p-4">
                <span className="font-mono text-xs text-strong font-bold">
                  Strongest Skills ({strongSkills.length})
                </span>
                <p className="mt-1 font-mono text-xs text-muted">
                  {strongSkills.map((s) => s.skill).join(", ") || "Developing"}
                </p>
              </div>
              <div className="rounded-xl border border-panelBorder bg-[#0f131a] p-4">
                <span className="font-mono text-xs text-weak font-bold">
                  Critical Gaps ({weakSkills.length})
                </span>
                <p className="mt-1 font-mono text-xs text-muted">
                  {weakSkills.map((s) => s.skill).join(", ") || "None"}
                </p>
              </div>
              <div className="rounded-xl border border-panelBorder bg-[#0f131a] p-4">
                <span className="font-mono text-xs text-brand font-bold">Targeted Challenge</span>
                <p className="mt-1 font-mono text-xs text-muted">
                  {assessment.weakest?.skill} hardening
                </p>
              </div>
            </div>

            {/* Radar & Progress Chart */}
            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-panelBorder bg-[#0f131a] p-4">
                <h3 className="mb-2 font-mono text-xs font-semibold text-muted uppercase">
                  Skill Radar
                </h3>
                <SkillRadar skills={updatedSkills} />
              </div>
              <div className="rounded-xl border border-panelBorder bg-[#0f131a] p-4">
                <h3 className="mb-2 font-mono text-xs font-semibold text-muted uppercase">
                  Progress Over Time
                </h3>
                <ProgressChart history={history} />
              </div>
            </div>

            {/* Skill Bars */}
            <div className="mt-6 space-y-4">
              <h3 className="font-mono text-xs uppercase text-muted tracking-wider">
                Individual Competencies
              </h3>
              {updatedSkills.map((s) => (
                <SkillBar
                  key={s.skill}
                  skill={s.skill}
                  score={s.score}
                  note={s.note}
                  previous={
                    result && s.skill === assessment.weakest.skill
                      ? assessment.weakest.score
                      : undefined
                  }
                />
              ))}
            </div>

            {/* Skill Graph */}
            <div className="mt-8">
              <h3 className="mb-3 font-mono text-xs uppercase text-muted tracking-wider">
                Full-Stack Architecture Graph
              </h3>
              <SkillGraph skills={updatedSkills} weakest={assessment.weakest.skill} />
            </div>

            {/* Gap Callout Box */}
            <div className="mt-8 rounded-xl border border-weak/40 bg-weak/10 p-5">
              <h3 className="flex items-center gap-2 text-base font-semibold text-weak">
                🎯 {assessment.weakest.skill} is your biggest gap ({assessment.weakest.score}%)
              </h3>
              <p className="mt-2 text-xs text-gray-300 leading-relaxed">{assessment.weakest.reason}</p>
              {!challenge && (
                <button
                  onClick={handleMakeChallenge}
                  disabled={busy !== null}
                  className="mt-4 rounded-lg bg-brand px-4 py-2 font-mono text-xs font-bold text-[#0c0f14] hover:bg-brand/90 transition-colors"
                >
                  Generate targeted challenge →
                </button>
              )}
            </div>
          </section>
        )}

        {/* 3. Gap + Challenge Section */}
        {challenge && (
          <section className="panel mb-8 p-6">
            <h2 className="text-lg font-bold">3. Adaptive challenge — {challenge.skill}</h2>
            <h3 className="mt-2 text-xl font-bold text-brand">{challenge.title}</h3>
            <p className="mt-2 text-xs text-muted leading-relaxed">{challenge.brief}</p>

            <ul className="mt-4 space-y-2 text-xs">
              {challenge.requirements.map((r, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-brand">▸</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>

            <pre className="mt-4 overflow-x-auto rounded-lg border border-panelBorder bg-[#0f131a] p-4 font-mono text-xs text-gray-300">
              {challenge.starterCode}
            </pre>

            <div className="mt-4 space-y-1 font-mono text-xs text-muted">
              {challenge.hints.map((h, i) => (
                <p key={i}>hint: {h}</p>
              ))}
            </div>

            <textarea
              value={solution}
              onChange={(e) => setSolution(e.target.value)}
              placeholder="Write your refactored solution code here…"
              rows={8}
              className="mt-5 w-full rounded-lg border border-panelBorder bg-[#0f131a] p-3 font-mono text-xs outline-none focus:border-brand"
            />

            <button
              onClick={handleSubmitSolution}
              disabled={busy !== null}
              className="mt-4 rounded-lg bg-brand px-5 py-2.5 font-mono text-xs font-bold text-[#0c0f14] hover:bg-brand/90 transition-colors"
            >
              {busy ? "Evaluating…" : "✦ Mark solved & reassess"}
            </button>
          </section>
        )}

        {/* 4. Reassessment Section */}
        {result && assessment && (
          <section className="panel glow mb-8 p-6">
            <h2 className="text-lg font-bold">4. Reassessment</h2>
            <div className="mt-4 flex flex-wrap items-center gap-4 font-mono text-3xl font-bold">
              <span className="text-weak">
                {assessment.weakest.skill} {assessment.weakest.score}%
              </span>
              <span className="text-muted">→</span>
              <span className="text-strong">{result.newScore}%</span>
            </div>
            <p className="mt-3 text-xs text-gray-300 leading-relaxed">{result.verdict}</p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-panelBorder bg-[#0f131a] p-4">
                <h3 className="mb-2 font-mono text-xs uppercase text-strong font-bold">
                  What improved
                </h3>
                <ul className="space-y-1.5 text-xs text-muted">
                  {result.strengths.map((s, i) => (
                    <li key={i} className="flex gap-1.5">
                      <span className="text-strong">+</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-panelBorder bg-[#0f131a] p-4">
                <h3 className="mb-2 font-mono text-xs uppercase text-mid font-bold">
                  Still open
                </h3>
                <ul className="space-y-1.5 text-xs text-muted">
                  {result.remaining.map((s, i) => (
                    <li key={i} className="flex gap-1.5">
                      <span className="text-mid">–</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}

        <footer className="pt-6 pb-12 text-center font-mono text-xs text-muted">
          SkillTwin MVP — Real GitHub Extraction · AI Skill Twin · Adaptive Reassessment
        </footer>
      </div>
    </main>
  );
}
