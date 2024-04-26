const upgradeManager = new window.UpgradeManager();
const mineButton = document.getElementById('mineButton');
const autoMinerToggle = document.getElementById('autoMinerToggle');
const currentStones = document.getElementById('currentStones');
let autoMinerInterval = null;

const shopButton = document.getElementById('shopButton');
const shopWindow = document.getElementById('shopWindow');
const modalOverlay = document.getElementById('modalOverlay');

let currentOnlineUsersArray = [];

function openShop() {
    shopWindow.style.display = 'block';
    modalOverlay.style.display = 'block';
}

document.addEventListener('DOMContentLoaded', () => {
    openTab('MiningGear');

    document.getElementById('MiningGear').addEventListener('click', function(event) {
        if (event.target.classList.contains('purchase-button')) {
            const upgradeType = event.target.getAttribute('data-upgrade-type');
            purchaseUpgrade(upgradeType);
        }
    });

    document.getElementById('Automation').addEventListener('click', function(event) {
        if (event.target.classList.contains('purchase-button')) {
            const upgradeType = event.target.getAttribute('data-upgrade-type');
            purchaseUpgrade(upgradeType);
        }
    });
});

let notificationQueue = [];
let notificationVisible = false;

function showNotification(message) {
    notificationQueue.push(message);
    if (!notificationVisible) {
        displayNextNotification();
    }
}

function displayNextNotification() {
    if (notificationQueue.length === 0) {
        notificationVisible = false;
        return;
    }

    notificationVisible = true;
    const message = notificationQueue.shift();
    const notificationContainer = document.getElementById('notificationContainer');
    const notificationHeader = document.getElementById('notificationHeader');
    const notificationText = document.getElementById('notificationText');

    const headers = ["Hey!", "Wait a sec!", "Hang on..."];
    const randomHeader = headers[Math.floor(Math.random() * headers.length)];

    notificationHeader.textContent = randomHeader;
    notificationText.textContent = message;

    notificationContainer.classList.remove('hidden');
    notificationContainer.style.visibility = 'visible';
    notificationContainer.style.opacity = '1';

    setTimeout(() => {
        hideNotification();
    }, 1500);
}

function hideNotification() {
    const notificationContainer = document.getElementById('notificationContainer');
    notificationContainer.style.opacity = '0';
    setTimeout(() => {
        notificationContainer.classList.add('hidden');
        notificationContainer.style.visibility = 'hidden';
        setTimeout(() => {
            displayNextNotification();
        }, 10);
    }, 10);
}

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


function openTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });

    document.getElementById(tabName).classList.add('active');
    document.querySelector(`.tab-button[onclick="openTab('${tabName}')"]`).classList.add('active');
}

function closeShop() {
    shopWindow.style.display = 'none';
    modalOverlay.style.display = 'none';
}


shopButton.addEventListener('click', openShop);
modalOverlay.addEventListener('click', closeShop);

shopWindow.addEventListener('click', function(event) {
    event.stopPropagation();
});

// Manual mining functionality
mineButton.addEventListener('click', function() {
    mine(false);
});
function renewToken() {
    const token = localStorage.getItem('token');
    
    if (!token || isTokenExpired(token)) {
        alert('Session expired. Please log in again.');
        authSection.style.display = 'block';
        gameSection.style.display = 'none';
        return;
    }
    fetch('/renew_token', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => response.json())
    .then(data => {
        localStorage.setItem('token', data.token);
    })

    .catch(error => console.error('Error renewing token:', error));
}

function updateAutoMineCount() {
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('No authorization token found');
        return;
    }
    fetch('/api/getAutoMineCount', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        const autoMineElement = document.getElementById('autoMineCount');
        if (autoMineElement) {
            autoMineElement.textContent = data.autoMineCount;
        }
    })
    .catch(error => console.error('Failed to fetch autoMineCount:', error));
}

function mine(isAutoMining = false) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('You must be logged in to do that.');
        return;
    }

    if (!isAutoMining && autoMinerToggle.checked) {
        console.error('Manual mining is disabled while auto-mining is active.');
        return;
    }

    fetch('/collect', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isAutoMining: isAutoMining })
    })
    .then(response => response.json())
    .then(data => {
        if (data.stoneCount !== undefined) {
            currentStones.textContent = formatNumber(data.stoneCount);
        }
    })
    .catch(error => {
        console.error('Error during mining:', error);
    });
}

autoMinerToggle.addEventListener('change', function() {
    if (this.checked) {
        mineButton.classList.add('locked');
        mineButton.disabled = true;
        autoMine();
    } else {
        mineButton.classList.remove('locked');
        mineButton.disabled = false;
        clearInterval(autoMinerInterval);
    }
});

function autoMine() {
    autoMinerInterval = setInterval(() => {
        mine(true);
    }, 1000);
}

function updateMineButtonState() {
    if (autoMinerToggle.checked) {
        mineButton.innerHTML = '<img src="images/lock.png" class="lock-icon">Locked!';
        mineButton.disabled = true;
    } else {
        mineButton.innerHTML = 'Mine!';
        mineButton.disabled = false;
    }
}

autoMinerToggle.addEventListener('change', updateMineButtonState);

async function purchaseUpgrade(upgradeType) {
    const token = localStorage.getItem('token');
    if (!token) {
        showNotification('You must be logged in to do that.');
        return;
    }

    try {
        const response = await fetch('/purchaseUpgrade', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ upgradeType })
        });
        const data = await response.json();
        if (data.message === 'Upgrade successful') {
            showNotification('Upgrade purchased successfully!');
            fetchUpgrades(localStorage.getItem('token')).then(() => {
                updateUI();
            });
        } else {
            showNotification(data.message);
        }
    } catch (error) {
        console.error('Error purchasing upgrade:', error);
        showNotification('Error purchasing upgrade');
    }
}

document.getElementById('rockTumblerIcon').onclick = function() {
    document.getElementById('rockTumblerModal').style.display = 'block';
};

document.querySelector('.close').onclick = function() {
    document.getElementById('rockTumblerModal').style.display = 'none';
};

function updateSuccessRate() {
    var coins = parseInt(document.getElementById('coinInput').value);
    var rate = Math.min(20, coins / 1000);
    document.getElementById('successRate').innerText = rate + '%';
}

function startTumbling() {
    var stones = parseInt(document.getElementById('stoneInput').value);
    var coins = parseInt(document.getElementById('coinInput').value);
    const token = localStorage.getItem('token');

    if (!token) {
        alert('You must be logged in to do that.');
        return;
    }

    fetch('/startTumbler', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ stones, coins })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.message);
        } else {
            // Start the timer
            startTimer(data.endTime);
        }
    })
    .catch(error => {
        console.error('Failed to start the tumbler:', error);
        alert('Failed to start the tumbler. Please try again.');
    });
}

function periodicallyCheckTumblerStatus() {
    setInterval(checkTumblerStatus, 1000);
}

function checkTumblerStatus() {
    fetch('/tumblerStatus', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    .then(response => response.json())
    .then(data => {
        if (data.message !== "No active tumbler or user not found") {
            const endTime = new Date(data.endTime).getTime();
            const now = new Date().getTime();
            const timeLeft = endTime - now;
            if (timeLeft > 0) {
                startTimer(endTime);
            } else {
                document.getElementById('beltedTimeDisplay').style.display = 'none';
            }
        } else {
            document.getElementById('beltedTimeDisplay').style.display = 'none';
        }
    })
    .catch(error => console.error('Error checking tumbler status:', error));
}


function startTimer(endTime) {
    var timerDisplay = document.getElementById('beltedTimeDisplay');
    var flaps = timerDisplay.querySelector('.flaps');
    
    if (!endTime || isNaN(new Date(endTime).getTime())) {
        console.error('Invalid end time for timer:', endTime);
        return;
    }

    timerDisplay.style.display = 'block';

    var x = setInterval(function() {
        var now = new Date().getTime();
        var distance = endTime - now;
        if (isNaN(distance) || distance < 0) {
            clearInterval(x);
            timerDisplay.style.display = 'none';
            return; 
        }

        var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)).toString().padStart(2, '0');
        var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
        var seconds = Math.floor((distance % (1000 * 60)) / 1000).toString().padStart(2, '0');

        flaps.innerHTML = `<span class="time-part">${hours}h</span><span class="time-part">${minutes}m</span><span class="time-part">${seconds}s</span>`;

    }, 1000);
}



function checkTumblerOutcome() {
    fetch('/checkTumblerOutcome')
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        document.getElementById('rockTumblerModal').style.display = 'none';
    });
}

function checkAdminCommand(input) {
    if (input.startsWith('admin_cancel:')) {
        const details = input.split(':')[1];
        stopTumblerForUser(details);
    }
}

function stopTumblerForUser(details) {
    console.log(`Stopping tumbler for details: ${details}`);
}

function updateTimerDisplay(timerElement, timeLeft) {

    if (!timerElement) {
        console.error('Timer element not found in the document.');
        return;
    }

    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
    timerElement.innerHTML = `${hours}h ${minutes}m ${seconds}s`;
}

function checkTumblerStatus() {
    fetch('/tumblerStatus', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    .then(response => response.json())
    .then(data => {
        if (data.message !== "No active tumbler or user not found") {
            const endTime = new Date(data.endTime).getTime();
            if (!isNaN(endTime)) {
                const now = new Date().getTime();
                const timeLeft = endTime - now;
                if (timeLeft > 0) {
                    startTimer(endTime);
                } else {
                    document.getElementById('beltedTimeDisplay').style.display = 'none';
                }
            } else {
                console.error('Invalid end time received:', data.endTime);
            }
        } else {
            document.getElementById('beltedTimeDisplay').style.display = 'none';
        }
    })
    .catch(error => console.error('Error checking tumbler status:', error));
}


function openSellWindow() {
    loadStoneDetails();
    const sellWindow = document.getElementById('sellWindow');
    const modalOverlay = document.getElementById('modalOverlay');
    sellWindow.style.display = 'block';
    modalOverlay.style.display = 'block';
    openTab('RoughStones');
}

document.getElementById('sellButton').addEventListener('click', function() {
    if (document.getElementById('RoughStones').classList.contains('active')) {
        loadStoneDetails();
    }

    calculateAndUpdateProfit('roughStone');
    calculateAndUpdateProfit('pearlyStone');
});

function closeSellWindow() {
    const sellWindow = document.getElementById('sellWindow');
    const modalOverlay = document.getElementById('modalOverlay');
    sellWindow.style.display = 'none';
    modalOverlay.style.display = 'none';
}

modalOverlay.addEventListener('click', closeSellWindow);

document.getElementById('sellWindow').addEventListener('click', function(event) {
    event.stopPropagation();
});



function loadStoneDetails() {
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('No token found');
        return;
    }

    fetch('/api/stoneDetails', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        document.getElementById('roughStoneCount').textContent = formatNumber(data.roughStone.count);
        document.getElementById('roughStoneProfit').textContent = `₲${Math.round(data.roughStone.profit)}`;
        document.getElementById('roughStoneRate').textContent = `₲${Math.round(data.roughStone.marketRate)}`;
        calculateAndUpdateProfit('roughStone');

        document.getElementById('pearlyStoneCount').textContent = formatNumber(data.pearlyStone.count);
        document.getElementById('pearlyStoneProfit').textContent = `₲${Math.round(data.pearlyStone.profit)}`;
        document.getElementById('pearlyStoneRate').textContent = `₲${Math.round(data.pearlyStone.marketRate)}`;
        calculateAndUpdateProfit('pearlyStone');
    })
    .catch(error => console.error('Failed to load stone details:', error));
}


document.getElementById('sellButton').addEventListener('click', () => {
    openSellWindow();
    loadSellingItems();
});

function loadSellingItems() {
    fetchCurrentPrices().then(prices => {
        const stoneTypes = ['RoughStones', 'LustrousStones', 'MegaStones'];
        const token = localStorage.getItem('token');

        stoneTypes.forEach(type => {
            fetch(`/inventory/${type.toLowerCase()}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(data => {
                const tabContent = document.getElementById(type);
                tabContent.innerHTML = '';
                data.forEach(item => {
                    const stoneCountId = `${item.name.toLowerCase()}Count`;
                    const projectedProfitId = `${item.name.toLowerCase()}ProjectedProfit`;
                    const inputQuantityId = `sell${item.name}Amount`;

                    const currentCount = item.count;
                    const currentPrice = prices[`${item.name.toLowerCase()}Price`];
                    const projectedProfit = currentCount * currentPrice;

                    const div = document.createElement('div');
                    div.className = 'shop-item';
                    div.innerHTML = `
                        <img src="images/${item.image}" alt="${item.name}">
                        <span class="shop-item-details">
                            <h3>${item.name}</h3>
                            <p>Current Count: <span id="${stoneCountId}">${currentCount}</span></p>
                            <p>Projected Coin Profit: <span id="${projectedProfitId}">$${projectedProfit}</span></p>
                            <input type="number" id="${inputQuantityId}" placeholder="Enter quantity" oninput="calculateAndUpdateProfit('${item.name.toLowerCase()}')"/>
                            <button class="shopbutton" onclick="sellStones('${item.name.toLowerCase()}', document.getElementById('${inputQuantityId}').value)">Sell</button>
                        </span>
                    `;

                    tabContent.appendChild(div);
                });

                tabContent.addEventListener('input', function(event) {
                    if (event.target.type === 'number' && event.target.id.includes('sell')) {
                        const stoneType = event.target.id.replace('sell', '').replace('Amount', '');
                        updateProjectedProfit(stoneType, event.target.id, `${stoneType.toLowerCase()}ProjectedProfit`);
                    }
                });
            })
            .catch(error => console.error('Error loading inventory:', error));
        });
    }).catch(error => console.error('Error fetching prices:', error));
}

function updateProjectedProfit(stoneType, inputQuantityElementId, projectedProfitElementId) {
    const quantity = parseInt(document.getElementById(inputQuantityElementId).value, 10) || 0;
    fetchCurrentPrices()
    .then(prices => {
        if (Object.keys(prices).length === 0) {
            throw new Error('Price data is not available');
        }
        const currentPrice = prices[`${stoneType.toLowerCase()}Price`];
        if (typeof currentPrice === 'undefined') {
            console.error('Price for this stone type is not defined');
            return;
        }
        const projectedProfit = quantity * currentPrice;
        document.getElementById(projectedProfitElementId).textContent = `$${projectedProfit.toFixed(2)}`;
    })
    .catch(error => {
        console.error('Error updating projected profit:', error);
    });
}


function fetchCurrentPrices() {
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('No authorization token found');
        return Promise.reject('No authorization token found');
    }
    return fetch('/api/prices', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 401) {
                console.error('Error fetching stone prices: Unauthorized access');
            }
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(pricesArray => {
        let prices = {};
        pricesArray.forEach(priceInfo => {
            prices[`${priceInfo.stoneType.toLowerCase()}Price`] = priceInfo.price;
        });
        return prices;
    })
    .catch(error => {
        console.error('Error fetching stone prices:', error);
        return {};
    });
}


function sellStones(type, quantity) {
    fetch('/api/sellStones', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ type, quantity })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification(`Successfully sold ${quantity} ${type}. You earned ${formatNumber(data.earnedCoins)} coins!`);
            loadStoneDetails();
            document.getElementById('currentStones').textContent = formatNumber(data.newStoneCount);
            document.getElementById('currentCoins').textContent = formatNumber(data.newCoinCount);


        } else {
            showNotification(data.message);
        }
    })
    .catch(error => console.error('Error selling stones:', error));
}


document.getElementById('quickSellAll').addEventListener('click', function() {
    sellStones('all', 'all');
});


function updateUpgradeDisplay(upgradeType, data) {
    const upgradeElement = document.querySelector(`[data-upgrade-type="${upgradeType}"]`).closest('.shop-item');
    const costElement = upgradeElement.querySelector('.upgrade-cost');
    const countElement = upgradeElement.querySelector('.upgrade-count');

    if (!data.newPrice || !data[`${upgradeType}Count`]) {
        console.error('Incomplete data from server for upgrade:', data);
        return;
    }

    costElement.textContent = `Cost: ${formatNumber(data.newPrice)} Stones`;
    countElement.textContent = `Owned: ${data[`${upgradeType}Count`]}`;
}

function formatDateTime(date) {
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedTime = `${hours % 12 || 12}:${minutes} ${ampm}`;
    return formattedTime;
}

function appendMessage(username, message, timestamp) {
    const chatMessages = document.getElementById('chatMessages');
    const time = formatDateTime(new Date(timestamp));

    const messageElement = document.createElement('div');
    messageElement.innerHTML = `
        <strong>${time} - </strong>
        <span class="username" onclick="viewUserProfile('${username}')">${username}</span>: 
        ${message}`;
    chatMessages.appendChild(messageElement);

    chatMessages.scrollTop = chatMessages.scrollHeight;
}




/*ocument.getElementById('cosmeticsButton').addEventListener('click', function() {
    document.getElementById('cosmeticsShop').style.display = 'block';
    document.getElementById('modalOverlay').style.display = 'block';
    
    loadCosmetics('Hats');
    loadCosmetics('Accessories');
    loadCosmetics('Pickaxes');
});*/

function openCosmeticTab(tabName) {
    //tab switch wip
}

function loadCosmetics(category) {
    //cosmetics wip
}



















function formatPlaytime(seconds) {
    const years = Math.floor(seconds / (3600 * 24 * 365));
    seconds %= 3600 * 24 * 365;
    const months = Math.floor(seconds / (3600 * 24 * 30));
    seconds %= 3600 * 24 * 30;
    const days = Math.floor(seconds / (3600 * 24));
    seconds %= 3600 * 24;
    const hours = Math.floor(seconds / 3600);
    seconds %= 3600;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);

    let formattedString = '';
    if (years > 0) {
        formattedString += `${years} year(s), `;
    }
    if (months > 0 || formattedString.length > 0) {
        formattedString += `${months} month(s), `;
    }
    if (days > 0 || formattedString.length > 0) {
        formattedString += `${days} day(s), `;
    }
    if (hours > 0 || formattedString.length > 0) {
        formattedString += `${hours} hour(s), `;
    }
    if (minutes > 0 || formattedString.length > 0) {
        formattedString += `${minutes} minute(s), `;
    }
    formattedString += `${remainingSeconds} second(s)`;

    return formattedString.trim();
}

function getUsernameFromToken() {
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('No token found');
        return null;
    }
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    return payload.username;
}

document.getElementById('profileButton').addEventListener('click', function() {
    const username = getUsernameFromToken();
    if (username) {
        viewUserProfile(username);
    } else {
        console.error('Username could not be retrieved from the token');
    }
});

function viewUserProfile(username) {
    const token = localStorage.getItem('token');
    fetch(`/user/${username}/profile`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Profile fetch failed');
        }
        return response.json();
    })
    .then(profileData => {
        const playtimeFormatted = formatPlaytime(profileData.playtimeInSeconds);
        showUserProfile(profileData, false, playtimeFormatted);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function showUserProfile(data, isOwnProfile = false, playtimeFormatted) {
    const profileDiv = document.getElementById('profile');
    const overlay = document.getElementById('modalOverlay');
    const settingsIcon = isOwnProfile ? '<img src="images/logo2.png" id="settingsIcon" class="settings-icon" />' : '';

    profileDiv.innerHTML = `
        <div id="profile-menu" class="profile-menu">
            ${settingsIcon}
            <div class="profile-avatar-section">
                <img src="images/avatar/pickaxe/1.png" alt="Profile Avatar" class="profile-avatar"/>
                <div class="profile-details">
                    <h3>${data.username}</h3>
                    <div class="user-stats">
                        <p><strong>Join Date:</strong> ${data.accountCreated}</p>
                        <p><strong>Last Online:</strong> ${data.lastOnline}</p>
                        <p><strong>Playtime:</strong> ${data.playtime}</p>
                        <p><strong>Friends:</strong> 6</p>
                    </div>
                </div>
            </div>
            <div class="profile-stats">
                <div class="stats-left">
                    <p><strong>Stones:</strong> ${formatNumber(data.stoneCount)}</p>
                    <p><strong>Coins:</strong> ${formatNumber(data.coins)}</p>
                    <p><strong>Stones per Click:</strong> ${formatNumber(data.stonesPerClick)}</p>
                    <p><strong>Automation Stones per Click:</strong> ${formatNumber(data.autoStonesPerClick)}</p>
                </div>
                <div class="stats-right">
                    <!-- Additional stats here, like playtime and friends -->
                </div>
            </div>
            <button id="closeProfileBtn" class="profile-close-button">Close</button>
        </div>
    `;

    profileDiv.style.display = 'block';
    overlay.style.display = 'block';

    if (isOwnProfile) {
        document.getElementById('settingsIcon').addEventListener('click', openSettings);
    }

    document.getElementById('closeProfileBtn').addEventListener('click', closeProfile);
    overlay.addEventListener('click', closeProfile);
}

function closeProfile() {
    document.getElementById('profile').style.display = 'none';
    document.getElementById('modalOverlay').style.display = 'none';
}

function loadChatHistory() {
    const token = localStorage.getItem('token');
    fetch('/chat/messages', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(messages => {
        messages.forEach(message => {
            appendMessage(message.username, message.message, message.timestamp);
        });
    })
    .catch(error => {
        console.error('Error loading chat history:', error);
    });
}



const socket = io('/', {
    auth: {
        token: localStorage.getItem('token'),
    }
});

socket.on('chat message', function(data) {
    appendMessage(data.username, data.message, new Date(data.timestamp));
});

socket.on('token renewal', (newToken) => {
    localStorage.setItem('token', newToken);
    socket.auth.token = newToken;
});

function sendMessage() {
    const chatInput = document.getElementById('chatInput');
    const message = chatInput.value.trim();

    if (message && !checkAdminCommand(message)) {
        socket.emit('chat message', message);
    }
    chatInput.value = '';
}


const sendButton = document.getElementById('sendChat');
sendButton.addEventListener('click', () => {
    console.log('Send button clicked');
    sendMessage();
});

document.getElementById('chatInput').addEventListener('keypress', function(event) {
    console.log('Key pressed:', event.key);
    if (event.key === 'Enter') {
        console.log('Enter key pressed');
        sendMessage();
    }
});

socket.on('online users', function(onlineUsers) {
    currentOnlineUsersArray = onlineUsers;
    updateOnlineUsers(onlineUsers);
});

function loadLeaderboard(sortField = 'stoneCount') {
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('No token found, redirecting to login...');
        return;
    }

    console.log('Making request to:', `/leaderboard/${sortField}`);

    return fetch(`/leaderboard/${sortField}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Failed to load leaderboard: ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Received data:', data);
        return data;
    })
    .catch(error => {
        console.error('Error loading leaderboard:', error);
    });
}

document.getElementById('leaderboardSort').addEventListener('change', event => {
    loadLeaderboard(event.target.value);
});

function updateOnlineUsers(onlineUsers) {
    const leaderboardEntries = document.querySelectorAll('.leaderboard-entry .leaderboard-username');

    leaderboardEntries.forEach(entry => {
        entry.classList.remove('online');
    });

    onlineUsers.forEach(username => {
        const userEntry = document.querySelector(`.leaderboard-entry[data-username="${username}"] .leaderboard-username`);
        if (userEntry) {
            userEntry.classList.add('online');
        }
    });
}


document.getElementById('leaderboardSort').addEventListener('change', (event) => {
    const sortType = event.target.value;
    updateLeaderboardDisplay(sortType);
});

function getIconForRank(index) {
    switch(index) {
        case 0: return '<img src="images/gold_trophy.png" class="trophy-icon" alt="Gold Trophy" />';
        case 1: return '<img src="images/silver_trophy.png" class="trophy-icon" alt="Silver Trophy" />';
        case 2: return '<img src="images/bronze_trophy.png" class="trophy-icon" alt="Bronze Trophy" />';
        default: return '';
    }
}

function updateLeaderboardDisplay(sortType) {
    loadLeaderboard(sortType).then(leaderboardData => {
        if (!Array.isArray(leaderboardData)) {
            console.error('Received data is not an array:', leaderboardData);
            return;
        }

        const leaderboardList = document.getElementById('leaderboardList');
        leaderboardList.textContent = '';  // Clears the existing content safely

        leaderboardData.slice(0, 100).forEach((user, index) => {
            const userElement = document.createElement('div');
            userElement.className = 'leaderboard-entry';
            userElement.setAttribute('data-username', user.username);

            const rankSpan = document.createElement('span');
            rankSpan.className = 'leaderboard-rank';
            rankSpan.textContent = `#${index + 1} `;
            
            const usernameSpan = document.createElement('span');
            usernameSpan.className = 'leaderboard-username clickable';
            usernameSpan.textContent = user.username;
            usernameSpan.addEventListener('click', () => viewUserProfile(user.username));  // Attaching event listener directly

            userElement.appendChild(rankSpan);
            userElement.appendChild(usernameSpan);

            // Safely adding trophy icon using innerHTML
            userElement.innerHTML += getIconForRank(index);

            if (user.stoneCount !== undefined && user.stoneCount !== null) {
                const stoneSpan = document.createElement('span');
                stoneSpan.className = 'leaderboard-stones';
                stoneSpan.textContent = `${formatNumber(user.stoneCount)} Stones`;
                userElement.appendChild(stoneSpan);
            }

            if (user.coins !== undefined && user.coins !== null) {
                const coinSpan = document.createElement('span');
                coinSpan.className = 'leaderboard-coins';
                coinSpan.textContent = `${formatNumber(user.coins)} Coins`;
                userElement.appendChild(coinSpan);
            }

            leaderboardList.appendChild(userElement);
        });

        updateOnlineUsers(currentOnlineUsersArray);

    }).catch(error => {
        console.error('Error updating leaderboard:', error);
    });
}

updateLeaderboardDisplay('stones');


function calculateAndUpdateProfit(stoneType) {
    const inputQuantityId = `sell${stoneType.charAt(0).toUpperCase() + stoneType.slice(1)}Amount`;
    const currentCountElementId = `${stoneType}Count`;
    const projectedProfitId = `${stoneType}Profit`;

    console.log(`Input Quantity ID: ${inputQuantityId}`);
    console.log(`Projected Profit ID: ${projectedProfitId}`);

    const inputElement = document.getElementById(inputQuantityId);
    const currentRateElement = document.getElementById(`${stoneType}Rate`);
    const projectedProfitElement = document.getElementById(projectedProfitId);
    const currentCountElement = document.getElementById(currentCountElementId);

    console.log('Input Element:', inputElement);
    console.log('Current Rate Element:', currentRateElement);
    console.log('Projected Profit Element:', projectedProfitElement);
    console.log('Current Count Element:', currentCountElement);

    if (inputElement && currentRateElement && projectedProfitElement && currentCountElement) {
        const inputQuantity = parseInt(inputElement.value, 10) || 0;
        const currentRate = parseFloat(currentRateElement.textContent.replace('₲', '')) || 0;
        const currentCount = parseInt(currentCountElement.textContent.replace(/[^\d]/g, ''), 10) || 0;

        const quantity = Math.min(inputQuantity, currentCount);
        const projectedProfit = quantity * currentRate;

        projectedProfitElement.textContent = `₲${formatNumber(projectedProfit)}`;
    } else {
        console.error('One or more elements could not be found');
    }
}

async function fetchUpgrades(token) {
    try {
        await upgradeManager.fetchUpgrades(token);
    } catch (error) {
        console.error('Error fetching upgrades:', error);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    fetchCurrentPrices();
    loadSellingItems();
    loadLeaderboard(); 
    checkTumblerStatus();
    periodicallyCheckTumblerStatus();
    loadChatHistory();
    loadLeaderboard();
    updateAutoMineCount();
    updateLeaderboardDisplay('stoneCount');

    const token = localStorage.getItem('token');
    if (token) {
        fetchUpgrades(token);
    }

    setInterval(function() {
        const selectedSortType = document.getElementById('leaderboardSort').value;
        updateLeaderboardDisplay(selectedSortType);
    }, 1000);

    const socket = io('https://Arcri.net/mining', {
        transports: ['websocket'],
        upgrade: false,
    });

    socket.on('online users', function(onlineUsers) {
        updateOnlineUsers(onlineUsers);
    });

    socket.on('update leaderboard', function() {
        const selectedSortType = document.getElementById('leaderboardSort').value;
        updateLeaderboardDisplay(selectedSortType);
    });

    socket.on('connect', function() {
        console.log('Connected to the server!');
    });

    socket.emit('request history');

    socket.on('disconnect', function(reason) {
        console.log('Disconnected: ', reason);
    });

    socket.on('error', function(error) {
        console.error('Connection Error: ', error);
    });


});

function fetchAndUpdateCounts() {
    const token = localStorage.getItem('token');
    if (token) {
        fetch('/api/updateCounts', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load counts: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.stoneCount !== undefined) {
                currentStones.textContent = formatNumber(data.stoneCount);

            }
            if (data.coins !== undefined) {
                 currentCoins.textContent = formatNumber(data.coins);
             }
        })
        .catch(error => {
            console.error('Error loading counts:', error);
        });
    }
}