document.addEventListener('DOMContentLoaded', function() {
    loadAndDisplayMusic();
});

/**
 * Loads music data from JSON file and displays it in the music grid
 */
async function loadAndDisplayMusic() {
    try {
        const response = await fetch('assets/data/arcri-music.json');
        if (!response.ok) {
            throw new Error('Failed to load music data');
        }
        const musicData = await response.json();
        displayMusic(musicData);
        
    } catch (error) {
        console.error('Error loading music data:', error);
        displayErrorMessage();
    }
}

/**
 * Displays music data in music grid
 * @param {Array} releases - Array of music releases
 */
function displayMusic(releases) {
    const musicGrid = document.querySelector('.music-grid');
    if (!musicGrid) {
        console.error('Music grid element not found');
        return;
    }
    musicGrid.innerHTML = '';
    releases.sort((a, b) => new Date(b.release_date) - new Date(a.release_date));
    releases.forEach(release => {
        const releaseYear = new Date(release.release_date).getFullYear();
        const coverUrl = release.images && release.images[0] ? release.images[0].url : 'assets/images/default-album.jpg';
        const musicCard = document.createElement('div');
        musicCard.className = 'music-card';
        musicCard.innerHTML = `
            <div class="music-card-img">
                <img src="${coverUrl}" alt="${release.name} Cover" style="width:100%;height:100%;object-fit:cover;">
            </div>
            <div class="music-card-content">
                <h3>${release.name}</h3>
                <p>${formatReleaseType(release.album_type)} • ${releaseYear}</p>
                <a href="${release.external_urls.spotify}" class="listen-btn" target="_blank">Listen Now</a>
            </div>
        `;
        musicGrid.appendChild(musicCard);
    });
    updateModal(releases);
}

/**
 * Updates View All modal with all music
 * @param {Array} releases - Array for music releases
 */
function updateModal(releases) {
    const modalGrid = document.querySelector('.modal-music-grid');
    if (!modalGrid) return;
    modalGrid.innerHTML = '';
    releases.forEach(release => {
        const releaseYear = new Date(release.release_date).getFullYear();
        const coverUrl = release.images && release.images[0] ? release.images[0].url : 'assets/images/default-album.jpg';
        
        const musicCard = document.createElement('div');
        musicCard.className = 'music-card';
        
        musicCard.innerHTML = `
            <div class="music-card-img">
                <img src="${coverUrl}" alt="${release.name} Cover" style="width:100%;height:100%;object-fit:cover;">
            </div>
            <div class="music-card-content">
                <h3>${release.name}</h3>
                <p>${formatReleaseType(release.album_type)} • ${releaseYear}</p>
                <a href="${release.external_urls.spotify}" class="listen-btn" target="_blank">Listen Now</a>
            </div>
        `;
        modalGrid.appendChild(musicCard);
    });
}

/**
 * Formats release type
 * @param {string} type - Release type (single, album, EP)
 * @returns {string} Formatted release type
 */
function formatReleaseType(type) {
    if (!type) return '';
    if (type.toLowerCase() === 'ep') return 'EP';
    return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
}

/**
 * Displays an error message when music data cannot be loaded
 */
function displayErrorMessage() {
    const musicGrid = document.querySelector('.music-grid');
    if (!musicGrid) return;
    
    musicGrid.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            <p>Sorry, we couldn't load the music data. Please try again later.</p>
        </div>
    `;
}