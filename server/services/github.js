async function fetchRepoEvidence(githubUrl) {
  const match = githubUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) throw new Error("Invalid GitHub repository URL");

  const owner = match[1];
  const repo = match[2].replace(/\.git$/, "");

  const headers = {
    Accept: "application/vnd.github+json",
    ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {})
  };

  // 1. Language byte distribution
  let languages = {};
  try {
    const langRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/languages`, { headers });
    if (langRes.ok) languages = await langRes.json();
  } catch (err) {
    console.warn("Language fetch warning:", err.message);
  }

  // 2. package.json for JS/Node dependencies
  let packageJson = null;
  try {
    const pkgRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/package.json`, { headers });
    if (pkgRes.ok) {
      const pkgData = await pkgRes.json();
      packageJson = Buffer.from(pkgData.content, "base64").toString("utf-8");
    }
  } catch (err) {
    console.warn("package.json fetch warning:", err.message);
  }

  // 3. Top-level directory files
  let fileNames = [];
  try {
    const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents`, { headers });
    if (treeRes.ok) {
      const treeData = await treeRes.json();
      if (Array.isArray(treeData)) {
        fileNames = treeData.map((f) => f.name);
      }
    }
  } catch (err) {
    console.warn("Tree fetch warning:", err.message);
  }

  return { owner, repo, languages, packageJson, fileNames };
}

module.exports = { fetchRepoEvidence };
