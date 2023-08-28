var stonesAmount = 0;
var bonusStonesAmount = 0;

const mineStones = document.getElementById('mineStone');

mineStones.addEventListener('click', function(mineStone) {
    stonesAmount += 1 + bonusStonesAmount;

    document.getElementById('stonesAmountText').innerText = stonesAmount
    console.log(stonesAmount);
})

const upgradeStones = document.getElementById("upgradeBonus");

upgradeStones.addEventListener('click', function(upgradeBonus) {
    bonusStonesAmount += 1;

    document.getElementById('bonusStonesAmountText').innerText = bonusStonesAmount
    console.log(bonusStonesAmount);
 })