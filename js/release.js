const RELEASES_URL = "/assets/data/releases.json";

function getId() {
    const u = new URL(window.location.href);
    return u.searchParams.get("id");
}

function li(p) {
    const name = String(p.name || "");
    const icon = String(p.icon || "fa-music");
    const url = String(p.url || "#");
    const faPrefix = icon.startsWith("fa-") ? "fa-solid" : "fa-solid";
    const iconClass = icon.includes("fa-") ? icon : "fa-music";
    const isBrand = ["fa-spotify","fa-apple","fa-youtube","fa-amazon","fa-deezer","fa-discord","fa-instagram"].includes(iconClass);
    const prefix = isBrand ? "fa-brands" : "fa-solid";

    return `
        <li class="streaming-item">
            <i class="${prefix} ${iconClass} streaming-icon"></i>
            <span class="streaming-name">${name}</span>
            <a href="${url}" class="streaming-link" target="_blank" rel="noopener">Visit</a>
        </li>
    `;
}

async function load() {
    const res = await fetch(RELEASES_URL, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load releases.json");
    return await res.json();
}

document.addEventListener("DOMContentLoaded", async () => {
    const id = getId();
    const titleEl = document.getElementById("releaseTitle");
    const listEl = document.getElementById("platformList");

    try {
        const releases = await load();
        const r = (Array.isArray(releases) ? releases : []).find(x => x.id === id);

        if (!r) {
            titleEl.textContent = "Release not found";
            listEl.innerHTML = "";
            return;
        }

        titleEl.textContent = `${r.title} · ${r.type || "Release"}`;
        const platforms = Array.isArray(r.platforms) ? r.platforms : [];
        listEl.innerHTML = platforms.map(li).join("");
    } catch (e) {
        titleEl.textContent = "Music temporarily unavailable";
        listEl.innerHTML = "";
    }
});
