const RELEASES_URL = "assets/data/releases.json";

function releaseCard(r) {
    const safeTitle = String(r.title || "");
    const safeTagline = String(r.tagline || "");
    const cover = String(r.cover || "");
    const link = String(r.primaryUrl || "#");

    return `
        <div class="music-card">
            <a href="${link}" class="music-card-img" aria-label="${safeTitle}">
                <img src="${cover}" alt="${safeTitle} cover">
            </a>
            <div class="music-card-content">
                <h3>${safeTitle}</h3>
                <p>${safeTagline}</p>
                <a class="listen-btn" href="${link}">Stream / Download</a>
            </div>
        </div>
    `;
}

async function loadReleases() {
    const res = await fetch(RELEASES_URL, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load releases.json");
    return await res.json();
}

function setGrid(el, releases, limit) {
    const items = Array.isArray(releases) ? releases : [];
    const sliced = typeof limit === "number" ? items.slice(0, limit) : items;
    el.innerHTML = sliced.map(releaseCard).join("") || `<div class="error-message">No releases found.</div>`;
}

function setError(el) {
    el.innerHTML = `
        <div class="error-message">
            <i class="fas fa-triangle-exclamation"></i>
            <p>Music is temporarily unavailable. Please refresh.</p>
        </div>
    `;
}

document.addEventListener("DOMContentLoaded", async () => {
    const grid = document.querySelector(".music-grid");
    const modalGrid = document.querySelector(".modal-music-grid");
    const viewAllBtn = document.getElementById("viewAllBtn");
    const modal = document.getElementById("musicModal");
    const closeBtn = document.querySelector(".close-modal");

    try {
        const releases = await loadReleases();

        setGrid(grid, releases, 6);
        setGrid(modalGrid, releases);

        viewAllBtn?.addEventListener("click", () => {
            modal.style.display = "block";
            document.body.style.overflow = "hidden";
        });

        closeBtn?.addEventListener("click", () => {
            modal.style.display = "none";
            document.body.style.overflow = "";
        });

        window.addEventListener("click", (e) => {
            if (e.target === modal) {
                modal.style.display = "none";
                document.body.style.overflow = "";
            }
        });
    } catch (e) {
        setError(grid);
        if (modalGrid) modalGrid.innerHTML = "";
    }
});
