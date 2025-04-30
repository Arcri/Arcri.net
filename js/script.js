// JavaScript to handle the modal
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('musicModal');
    const btn = document.getElementById('viewAllBtn');
    const closeBtn = document.querySelector('.close-modal');
    
    // Open modal when View All button is clicked
    btn.onclick = function() {
        modal.style.display = "block";
        
        // Clone music cards to modal if it's empty
        const modalGrid = document.querySelector('.modal-music-grid');
        if (modalGrid.children.length === 0) {
            const cards = document.querySelectorAll('.music-grid .music-card');
            cards.forEach(card => {
                const clone = card.cloneNode(true);
                modalGrid.appendChild(clone);
            });
            
            // Add more cards
            for (let i = 0; i < 8; i++) {
                const clone = cards[i % cards.length].cloneNode(true);
                modalGrid.appendChild(clone);
            }
        }
    }
    
    // Close modal when X is clicked
    closeBtn.onclick = function() {
        modal.style.display = "none";
    }
    
    // Close modal when clicking outside of it
    window.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    }
});