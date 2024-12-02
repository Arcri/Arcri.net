class UpgradeManager {
    constructor() {
        this.upgrades = {};
        this.effects = {
            stonesPerClick: 1
        };
    }

    fetchUpgrades(token) {
        return fetch('/api/upgradeDetails', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(upgrades => {
            this.applyUpgrades(upgrades);
        })
        .catch(error => console.error('Error fetching upgrades:', error));
    }

    applyUpgrades(upgrades) {
        if (!upgrades || typeof upgrades !== 'object') {
            console.error('Invalid upgrades data:', upgrades);
            return;
        }
        this.upgrades = upgrades;
        this.calculateEffects();
        this.updateUI();
    }

    

    calculateEffects() {
        this.effects.stonesPerClick = 1;
        this.effects.autoMineCount = 1;
        if (this.upgrades.fortuneUpgrade) {
            this.effects.stonesPerClick += this.upgrades.fortuneUpgrade.count;
        }
        this.effects.luckyPouchChance = this.upgrades.luckyPouchUpgrade ? this.upgrades.luckyPouchUpgrade.count * 0.01 : 0; // 1% chance per pouch

        if (this.upgrades.ordinaryDrillUpgrade) {
            this.effects.autoMineCount += this.upgrades.ordinaryDrillUpgrade.count;
            console.log(`Auto Mine Count Updated to: ${this.effects.autoMineCount}`);
        }
        if (this.upgrades.pearlyDrillUpgrade) {
            this.effects.pearlyChance = this.upgrades.pearlyDrillUpgrade.count * 0.05;
        }
    
        if (this.upgrades.unstableDrillUpgrade) {
            this.effects.autoMiningRate = Math.max(200, 1000 - this.upgrades.unstableDrillUpgrade.count * 100);
        }
    
        if (this.upgrades.draglineExcavatorUpgrade) {
            this.effects.stonesPerAutoMine = 1 + this.upgrades.draglineExcavatorUpgrade.count * 0.001;
        }
    
        if (this.upgrades.bucketWheelExcavatorUpgrade) {
            this.effects.massiveYieldInterval = this.upgrades.bucketWheelExcavatorUpgrade.count;
        }
    }

    activateUnstableStone() {
        const token = localStorage.getItem('token');
        fetch('/api/activateUnstableStone', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            console.log(data.message);
            if (data.climax) {
                alert(`Unstable stone activated! Climax at ${data.climax} stones.`);
            }
        })
        .catch(error => console.error('Error activating unstable stone:', error));
    }

    updateUI() {
        // Update stones per click display
        const stonesPerClickElement = document.getElementById('stonesPerClick');
        if (stonesPerClickElement) {
          stonesPerClickElement.textContent = this.effects.stonesPerClick;
        }
        
        // Update shop items
        Object.entries(this.upgrades).forEach(([upgradeType, details]) => {
          const costElement = document.querySelector(`[data-upgrade-type="${upgradeType}"] .upgrade-cost`);
          const countElement = document.querySelector(`[data-upgrade-type="${upgradeType}"] .upgrade-count`);
          if(costElement && countElement) {
            costElement.textContent = `Cost: ${formatNumber(details.cost)} Stones`;
            countElement.textContent = `Owned: ${details.count}`;
          }
        });
      }
    
    }

window.UpgradeManager = UpgradeManager;