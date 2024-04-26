function isValidUsername(username) {
    const usernameRegex = /^[a-zA-Z0-9]{6,}$/;
    return usernameRegex.test(username);
}

function isValidPassword(password) {
    return password.length >= 6;
}

const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const registerBtn = document.getElementById('registerBtn');
const loginBtn = document.getElementById('loginBtn');
const profileDiv = document.getElementById('profile');
const authSection = document.getElementById('auth');
const gameSection = document.getElementById('game');
const showProfileBtn = document.getElementById('profileButton');

registerBtn.addEventListener('click', function() {
    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!isValidUsername(username)) {
        alert('Invalid username. Must be at least 5 characters, alphanumeric, no bad words.');
        return;
    }
    if (!isValidPassword(password)) {
        alert('Password must be at least 6 characters long.');
        return;
    }
    registerUser(username, password);
});

loginBtn.addEventListener('click', function() {
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    performLogin(username, password);
});

function registerUser(username, password) {
    fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        if (data.message === 'Registration successful') {
            performLogin(username, password);
        }
    })
    .catch(error => console.error('Error:', error));
}

function performLogin(username, password) {
    if (!username || !password) {
        alert('Please enter both username and password.');
        return;
    }
    fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Login failed. Please check your username and password and try again.');
        }
        return response.json();
    })
    .then(data => {
        if (data.token) {
            localStorage.setItem('token', data.token);

            updateAuthDisplay(); 

            fetchUserStats(data.token).then(() => {
                showGame();
            });
        } else {
            alert(data.message || 'Login failed, please try again.');
            return Promise.reject('Login failed');
        }
    })
    .catch(error => alert(error.message));
}

function showProfile() {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('No session found. Please log in.');
        return;
    }
    fetch('/profile', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => response.json())
    .then(data => {
        profileDiv.innerHTML = `
            <div class="profile-menu">
                <h3>${data.username}'s Profile</h3>
                <p>Stones: ${data.stoneCount}</p>
                <p>Coins: ${data.coins}</p>
                <p>Join Date: ${data.accountCreated}</p>
                <button id="closeProfileBtn">Close</button>
            </div>
        `;
        profileDiv.style.display = 'block';
        document.getElementById('closeProfileBtn').addEventListener('click', function() {
            profileDiv.style.display = 'none';
        });
    })
    .catch(error => console.error('Error:', error));

    console.log(data.coins)
}

function logOut() {
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('No token found, likely already logged out.');
        return;
    }
    fetch('/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => response.json())
    .then(data => {
        localStorage.removeItem('token');
        alert(data.message);
        updateAuthDisplay(); 
        authSection.style.display = 'block';
        profileDiv.style.display = 'none';
        gameSection.style.display = 'none';
    })
    .catch(error => console.error('Error:', error));
}

function isTokenExpired(token) {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return Date.now() >= payload.exp * 1000;
}

function updateAuthDisplay() {
    const authContainer = document.getElementById('auth-container');
    const gameContainer = document.getElementById('game');
    const token = localStorage.getItem('token');

    if (token && !isTokenExpired(token)) {
        authContainer.style.display = 'none';
        gameContainer.style.display = 'block';
    } else {
        authContainer.style.display = 'block';
        gameContainer.style.display = 'none';
    }
}

function showGame() {
    const token = localStorage.getItem('token');
    if (!token || isTokenExpired(token)) {
        alert('Session expired. Please log in again.');
        authSection.style.display = 'block';
        gameSection.style.display = 'none';
        return;
    }
    fetchUpgradeDetails().then(() => {
        authSection.style.display = 'none';
        gameSection.style.display = 'block';
        showProfileBtn.style.display = 'inline-block';
    });
}


window.onload = function() {
    const statsElements = document.querySelectorAll('.value');
    statsElements.forEach(element => {
        element.textContent = 'Loading...';
    });

    const token = localStorage.getItem('token');
    if (token) {
        fetchUserStats(token);
        fetchUpgradeDetails();
        updateAuthDisplay();
        showGame();
    } else {
        authSection.style.display = 'block';
    }
};

function formatNumber(num) {
    if (num < 1000) {
        return num.toString();
    }
    let si = [
        { v: 1E3, s: "K" },
        { v: 1E6, s: "M" },
        { v: 1E9, s: "B" },
        { v: 1E12, s: "T" },
        { v: 1E15, s: "Qa" },
        { v: 1E18, s: "Qi" }
    ];
    let i;
    for (i = si.length - 1; i > 0; i--) {
        if (num >= si[i].v) {
            break;
        }
    }
    return (num / si[i].v).toFixed(1).replace(/\.0+$|(\.[0-9]*[1-9])0+$/, "$1") + si[i].s;
}

function fetchUserStats(token) {
    console.log('Fetching user stats...');
    return fetch('/profile', { 
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Failed to fetch user stats: ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Data fetched:', data);
        if (typeof data.stoneCount === 'number') {
            document.getElementById('currentStones').textContent = formatNumber(data.stoneCount);
        } else {
            document.getElementById('currentStones').textContent = '0';
        }
        if (typeof data.coins === 'number') {
            document.getElementById('currentCoins').textContent = formatNumber(data.coins);
        } else {
            document.getElementById('currentCoins').textContent = '0';
        }
    })
    .catch(error => {
        console.error('Error fetching user stats:', error);
        document.getElementById('currentStones').textContent = 'Unavailable';
        document.getElementById('currentCoins').textContent = 'Unavailable';
    });
}




async function fetchUpgradeDetails() {
    const token = localStorage.getItem('token');
    if (!token) {
        console.error("User must be logged in to do that.");
        return Promise.reject("You must be logged in to do that.");
    }

    try {
        const response = await fetch('/api/upgradeDetails', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error(`Server responded with status code: ${response.status}`);
        }
        const upgrades = await response.json();
        Object.entries(upgrades).forEach(([upgradeType, upgradeDetails]) => {
            const upgradeElement = document.querySelector(`[data-upgrade-type="${upgradeType}"]`);
            if (!upgradeElement) {
                console.error(`Cannot find element with upgrade type: ${upgradeType}`);
                return;
            }
            const costElement = upgradeElement.querySelector('.upgrade-cost');
            const countElement = upgradeElement.querySelector('.upgrade-count');
            if (costElement && countElement) {
                costElement.textContent = `Cost: ${upgradeDetails.cost} Stones`;
                countElement.textContent = `Owned: ${upgradeDetails.count}`;
            }
        });
    } catch (error) {
        console.error('Error fetching upgrades:', error);
    }
}

window.onbeforeunload = function() {
   // logOut();
};
