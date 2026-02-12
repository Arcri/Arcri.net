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

function normalizeType(t) {
    return String(t || "Other").trim().toLowerCase();
}

function titleCase(t) {
    const s = String(t || "");
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : "Other";
}

function getUniqueTypes(releases) {
    const set = new Set((releases || []).map(r => normalizeType(r.type)));
    const types = Array.from(set).filter(Boolean);

    const preferredOrder = ["single", "ep", "album", "playlist", "other"];
    types.sort((a, b) => {
        const ai = preferredOrder.indexOf(a);
        const bi = preferredOrder.indexOf(b);
        if (ai === -1 && bi === -1) return a.localeCompare(b);
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
    });

    return types;
}

document.addEventListener("DOMContentLoaded", async () => {
    const grid = document.querySelector(".music-grid");
    const modalGrid = document.querySelector(".modal-music-grid");
    const filtersEl = document.getElementById("modalFilters");

    const viewAllBtn = document.getElementById("viewAllBtn");
    const modal = document.getElementById("musicModal");
    const closeBtn = document.querySelector(".close-modal");

    if (!grid || !modalGrid || !modal) return;

    let allReleases = [];
    let activeType = "all";

    function renderModalGrid() {
        const filtered = activeType === "all"
            ? allReleases
            : allReleases.filter(r => normalizeType(r.type) === activeType);

        setGrid(modalGrid, filtered);
    }

    function renderFilters() {
        if (!filtersEl) return;

        const types = getUniqueTypes(allReleases);

        const buttons = [
            { key: "all", label: "All" },
            ...types.map(t => ({ key: t, label: titleCase(t) }))
        ];

        filtersEl.innerHTML = buttons.map(b => `
            <button class="modal-filter-btn ${b.key === activeType ? "active" : ""}" data-type="${b.key}">
                ${b.label}
            </button>
        `).join("");

        filtersEl.querySelectorAll("button").forEach(btn => {
            btn.addEventListener("click", () => {
                activeType = btn.dataset.type || "all";

                filtersEl.querySelectorAll(".modal-filter-btn").forEach(x => x.classList.remove("active"));
                btn.classList.add("active");

                renderModalGrid();
            });
        });
    }

    try {
        const releases = await loadReleases();
        allReleases = Array.isArray(releases) ? releases : [];

        setGrid(grid, allReleases, 6);

        renderFilters();
        renderModalGrid();

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
        modalGrid.innerHTML = "";
        if (filtersEl) filtersEl.innerHTML = "";
    }
});
