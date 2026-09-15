// server/services/ai.js

// 1. Analyze GitHub repository evidence using Groq AI
async function analyzeWithAI(evidence) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not defined in .env");
  }

  const prompt = `You are a principal engineer assessing a candidate's GitHub repository.
Analyze the repository evidence and return an accurate skill assessment.

Repository info:
- Repo: ${evidence.owner}/${evidence.repo}
- Languages: ${JSON.stringify(evidence.languages)}
- Top-level files: ${JSON.stringify(evidence.fileNames)}
- package.json:
${(evidence.packageJson || "None found").slice(0, 3000)}

Return ONLY valid JSON matching this structure:
{
  "projectName": "${evidence.repo}",
  "summary": "Two sentences summarizing what this project does and architectural health.",
  "skills": [
    {
      "skill": "React",
      "score": 82,
      "category": "Frontend",
      "note": "Component breakdown and hook usage"
    }
  ],
  "weakest": {
    "skill": "Security",
    "score": 38,
    "reason": "Specific risk, missing practice, or vulnerability detected."
  }
}

Constraints:
- Return 5 to 7 skills reflecting the actual detected tech stack (e.g., Python/Django for Python, React/Node/Express for MERN, etc.).
- Categories must be one of: "Frontend", "Backend", "Database", or "Quality".
- Scores between 25 and 95 based on evidence (e.g. 0 tests found = low Testing score).
- Weakest skill must be the lowest scoring item in the skills array.`;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "openai/gpt-oss-20b",
      messages: [
        {
          role: "system",
          content: "You are an automated code evaluation engine that outputs only valid raw JSON.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const rawText = data.choices[0]?.message?.content;
  return JSON.parse(rawText);
}

// 2. Dynamically evaluate the candidate's challenge solution
async function evaluateChallengeSolution({ skill, previousScore, challengeTitle, solution }) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is missing in .env");
  }

  const prompt = `You are a senior technical interviewer reviewing a student's solution code for an engineering challenge.

Skill being tested: ${skill}
Previous baseline score: ${previousScore}%
Challenge title: ${challengeTitle}

Student's submitted solution:
\`\`\`
${solution.slice(0, 3000)}
\`\`\`

Evaluate this code. If it genuinely addresses the challenge requirements (e.g. valid assertions/mocks for Testing, or validation/hashing for Security), award a realistic higher score between ${Math.min(previousScore + 15, 60)} and ${Math.min(previousScore + 35, 92)}. If the code is low-effort or incomplete, award a modest improvement.

Return ONLY a valid JSON object matching this schema:
{
  "newScore": number,
  "verdict": "2 sentences explaining specifically how the student's code improved this skill and what was verified.",
  "strengths": [
    "Specific technique implemented 1",
    "Specific technique implemented 2",
    "Specific technique implemented 3"
  ],
  "remaining": [
    "One remaining edge case or advanced practice to explore",
    "Another optional improvement"
  ]
}`;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are an automated code evaluation engine that outputs only valid raw JSON.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Groq API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  return JSON.parse(data.choices[0]?.message?.content);
}

module.exports = { analyzeWithAI, evaluateChallengeSolution };
