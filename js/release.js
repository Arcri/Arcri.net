const RELEASES_URL = "assets/data/releases.json";

function getReleaseId() {
    const url = new URL(window.location.href);
    return url.searchParams.get("id");
}

function iconClass(icon) {
    const i = String(icon || "fa-music");

    const brands = new Set([
        "fa-spotify",
        "fa-apple",
        "fa-youtube",
        "fa-deezer",
        "fa-soundcloud",
        "fa-discord",
        "fa-instagram"
    ]);

    const prefix = brands.has(i) ? "fa-brands" : "fa-solid";
    return `${prefix} ${i}`;
}

function platformRow(p) {
    const name = String(p.name || "");
    const url = String(p.url || "#");
    const icon = iconClass(p.icon);

    return `
        <li class="streaming-item">
            <i class="${icon} streaming-icon"></i>
            <span class="streaming-name">${name}</span>
            <a href="${url}" class="streaming-link" target="_blank" rel="noopener">Visit</a>
        </li>
    `;
}

async function loadReleases() {
    const res = await fetch(RELEASES_URL, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load releases");
    return await res.json();
}

document.addEventListener("DOMContentLoaded", async () => {
    const id = getReleaseId();

    const titleEl = document.getElementById("releaseTitle");
    const subEl = document.getElementById("releaseSubtitle");
    const listEl = document.getElementById("platformList");

    try {
        const releases = await loadReleases();
        const r = (Array.isArray(releases) ? releases : []).find(x => x.id === id);

        if (!r) {
            titleEl.textContent = "Release not found";
            subEl.textContent = "";
            listEl.innerHTML = "";
            return;
        }

        titleEl.textContent = r.title || "Release";
        subEl.textContent = r.type ? `${r.type} · Stream / Download` : "Stream / Download";

        const platforms = Array.isArray(r.platforms) ? r.platforms : [];
        listEl.innerHTML = platforms.map(platformRow).join("");
    } catch (e) {
        titleEl.textContent = "Sorry — we couldn't load this release";
        subEl.textContent = "Please try again later.";
        listEl.innerHTML = "";
    }
});
