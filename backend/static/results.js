// results.js

document.addEventListener("DOMContentLoaded", async () => {
    const root = document.getElementById("resultsRoot");
    if (!root) return;

    root.innerHTML = `<div class="loading">Loading analysis results...</div>`;

    try {
        const res = await fetch("/reports");
        const data = await res.json();
        renderResults(root, data || []);
    } catch (err) {
        console.error(err);
        root.innerHTML = `<div class="error">Failed to load reports</div>`;
    }
});

function renderResults(root, reports) {
    root.innerHTML = "";

    if (!reports.length) {
        root.innerHTML = `<div class="no-results">No reports found</div>`;
        return;
    }

    const portfolio = reports.find(r => r.type === "portfolio");
    const caseStudies = reports.filter(r => r.type === "case_study");

    if (portfolio) {
        root.appendChild(renderPortfolioOverview(portfolio));
    }

    if (caseStudies.length) {
        const header = document.createElement("div");
        header.className = "case-study-header";
        header.innerHTML = `<h1>${caseStudies.length} Case Studies Analyzed</h1>`;
        root.appendChild(header);

        caseStudies.forEach((cs, index) => {
            root.appendChild(renderCaseStudyDropdown(cs, index));
        });
    }
}

/* ==========================
   PORTFOLIO OVERVIEW
   ========================== */

function renderPortfolioOverview(p) {
    const div = document.createElement("div");
    div.className = "portfolio-block";

    const skills = Array.isArray(p.skills) ? p.skills : [];
    const projects = Array.isArray(p.projects) ? p.projects : [];
    const sections = Array.isArray(p.sections) ? p.sections : [];

    div.innerHTML = `
        <h1>Portfolio Overview</h1>

        <div class="portfolio-section">
            <h2>Hero Section</h2>
            <p>${p.hero || "Not Available"}</p>
        </div>

        <div class="portfolio-section">
            <h2>About</h2>
            <p>${p.about || "Not Available"}</p>
        </div>

        <div class="portfolio-section">
            <h2>Skills</h2>
            <div class="tag-grid">
                ${skills.length
            ? skills.map(s => `<span class="tag">${s}</span>`).join("")
            : `<span class="muted">No skills detected</span>`}
            </div>
        </div>

        <div class="portfolio-section">
            <h2>Detected Projects</h2>
            <div class="project-list">
                ${projects.length
            ? projects.map(pr => `
                        <a class="project-item" href="${pr.url}" target="_blank" rel="noopener noreferrer">
                            <span>${pr.name || pr.url}</span>
                        </a>
                      `).join("")
            : `<span class="muted">No projects found</span>`}
            </div>
        </div>

        <div class="portfolio-section">
            <h2>Overall Feedback</h2>
            <p>${p.overall_feedback || "No feedback available"}</p>
        </div>

        <div class="portfolio-section">
            <h2>Design Insights</h2>
            ${sections.length
            ? sections.map(sec => `
                    <div class="portfolio-analysis-card">
                        <h3>${sec.section}</h3>
                        <p><strong>Existing:</strong> ${sec.existing || "Not provided"}</p>
                        <p><strong>Suggestion:</strong> ${sec.suggestion || "Not provided"}</p>
                        <p><strong>Improved Example:</strong> ${sec.improved_example || "Not provided"}</p>
                    </div>
                  `).join("")
            : `<p class="muted">No insights available</p>`}
        </div>
    `;

    return div;
}

/* ==========================
   CASE STUDY DROPDOWN (Option 3)
   ========================== */

function renderCaseStudyDropdown(cs, index) {
    const card = document.createElement("div");
    card.className = "case-study-block";

    const id = `cs-details-${index}`;
    const score = typeof cs.overallScore === "number" ? cs.overallScore : (cs.analysis?.overall_score ?? 0);
    const title = cs.title || cs.projectDetails?.title || "Untitled Project";

    const phaseScores = Array.isArray(cs.phaseScores || cs.analysis?.phase_scores)
        ? (cs.phaseScores || cs.analysis?.phase_scores)
        : [];
    const improvements = Array.isArray(cs.improvements || cs.analysis?.improvements)
        ? (cs.improvements || cs.analysis?.improvements)
        : [];
    const keywords = Array.isArray(cs.ux_keywords || cs.analysis?.ux_keywords)
        ? (cs.ux_keywords || cs.analysis?.ux_keywords)
        : [];

    const summary = cs.summary || cs.analysis?.summary || "";
    const verdict = cs.verdict || cs.analysis?.verdict || "";

    // screenshot path from normalized object OR raw analysis
    // FIX: Always point screenshot to the Flask route
    let screenshot = null;

if (cs.screenshot) {
    const clean = cs.screenshot.split("/").pop();
    screenshot = `/reports/screenshots/${clean}`;
}




    card.innerHTML = `
        <div class="cs-header-row">
            <div class="cs-header-text">
                <div class="cs-project-title">${title}</div>
                <div class="cs-project-meta">
                    ${cs.url ? `<a href="${cs.url}" target="_blank" rel="noopener noreferrer">View Project ↗</a>` : ""}
                </div>
            </div>

            <div class="cs-score-pill">
                <span class="cs-score-value">${score}</span>
                <span class="cs-score-label">/100</span>
            </div>

            <button class="cs-toggle-btn" data-target="${id}">
                View Details
            </button>
        </div>

        <div id="${id}" class="cs-details-panel">
            <div class="cs-details-inner">

                ${screenshot ? `
                <div class="cs-screenshot-wrap">
                    <img src="${screenshot}" alt="Case study screenshot" class="cs-screenshot">
                </div>
                ` : ""}

                <section class="summary-box">
                    <h3>Summary</h3>
                    <p>${summary || "No summary available."}</p>
                </section>

                <section class="phase-section">
                    <h3>Phase Scores</h3>
                    <div class="phase-list">
                        ${phaseScores.map(phase => `
                            <div class="phase-card">
                                <div class="phase-header">
                                    <span class="phase-title">${phase.phase}</span>
                                    <span class="phase-score">${phase.score}/${phase.max_score}</span>
                                </div>
                                <div class="phase-reason">${phase.reasoning || ""}</div>
                                ${renderSubsections(phase.subsections)}
                            </div>
                        `).join("")}
                    </div>
                </section>

                <section class="keyword-section">
                    <h3>UX Keywords</h3>
                    <div class="tag-grid">
                        ${keywords.length
            ? keywords.map(k => `<span class="tag ux-keyword">${k}</span>`).join("")
            : `<span class="muted">No keywords detected.</span>`}
                    </div>
                </section>

                <section class="improvement-section">
                    <h3>Recommended Improvements</h3>
                    ${improvements.length
            ? improvements.map(imp => `
                            <div class="improvement-card">
                                <div class="improvement-phase">${imp.phase}</div>
                                <div class="improvement-issue">${imp.issue}</div>
                                <div class="improvement-rec">${imp.recommendation}</div>
                            </div>
                        `).join("")
            : `<p class="muted">No improvements listed.</p>`}
                </section>

                <section class="verdict-box">
                    <h3>Final Verdict</h3>
                    <p>${verdict || "No verdict provided."}</p>
                </section>

            </div>
        </div>
    `;

    return card;
}

function renderSubsections(subsections) {
    if (!Array.isArray(subsections) || !subsections.length) return "";

    return `
        <div class="subsection-list">
            ${subsections.map(sub => `
                <div class="sub-item">
                    <div class="sub-item-title">${sub.name}</div>
                    <div class="sub-item-score">${sub.score}/${sub.max_score}</div>
                    <div class="sub-item-reason">${sub.reasoning || ""}</div>
                </div>
            `).join("")}
        </div>
    `;
}

/* ==========================
   TOGGLE HANDLER (GLOBAL)
   ========================== */

document.addEventListener("click", (e) => {
    const btn = e.target.closest(".cs-toggle-btn");
    if (!btn) return;

    const targetId = btn.getAttribute("data-target");
    const panel = document.getElementById(targetId);
    if (!panel) return;

    const isOpen = panel.classList.contains("cs-open");
    if (isOpen) {
        panel.classList.remove("cs-open");
        btn.textContent = "View Details";
    } else {
        panel.classList.add("cs-open");
        btn.textContent = "Hide Details";
    }
});
