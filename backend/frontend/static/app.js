// -----------------------------
//   HOME PAGE (INDEX) LOGIC
// -----------------------------

// Application State
let appState = {
    currentView: 'landing'
};

// Loading steps (same as original)
const loadingSteps = [
    "Connecting to portfolio...",
    "Scanning case studies...",
    "Extracting project links...",
    "Analyzing portfolio...",
    "Generating insights...",
    "Compiling reports...",
    "Finalizing results..."
];

// Init
document.addEventListener("DOMContentLoaded", () => {
    initializeLoadingSteps();
    document.getElementById("portfolioForm")
        .addEventListener("submit", handleFormSubmit);
    animateDesignerCount();
});

function initializeLoadingSteps() {
    const container = document.getElementById("loadingSteps");
    container.innerHTML = loadingSteps.map((step, index) => `
        <div class="loading-step" data-step="${index}">
            <div class="step-icon">
                <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="10" cy="10" r="8"/>
                </svg>
            </div>
            <span>${step}</span>
        </div>
    `).join('');
}

function animateDesignerCount() {
    const target = 12847;
    const element = document.getElementById("designerCount");
    let current = 0;
    const increment = Math.ceil(target / 100);
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = current.toLocaleString();
    }, 20);
}

async function handleFormSubmit(e) {
    e.preventDefault();

    const formData = new FormData();
    formData.append("portfolioUrl", document.getElementById("portfolioUrl").value);
    formData.append("resume", document.getElementById("resume").files[0]);

    showView("loading");
    await animateLoadingSteps();

    let res = await fetch("/analyze", {
        method: "POST",
        body: formData
    });

    const result = await res.json();

    if (result.error) {
        alert("Error: " + result.error);
        showView("landing");
        return;
    }

    // Redirect to results page
    window.location.href = "/results";
}

function showView(view) {
    document.getElementById("landingPage").classList.toggle("hidden", view !== "landing");
    document.getElementById("loadingScreen").classList.toggle("active", view === "loading");
}

async function animateLoadingSteps() {
    const steps = document.querySelectorAll('.loading-step');
    for (let i = 0; i < steps.length; i++) {
        steps[i].classList.add('active');
        await new Promise(resolve => setTimeout(resolve, 700));
        steps[i].classList.remove('active');
        steps[i].classList.add('completed');
    }
}
