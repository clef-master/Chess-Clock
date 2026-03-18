const buttons = document.querySelectorAll(".player"); 
const resetButton = document.getElementById("reset");
const pause = document.getElementById("pause")
const methodSelect = document.getElementById("method");
const delayInput = document.getElementById("delay");
const modeSelect = document.getElementById("time");
const playerNameInputs = document.querySelectorAll("#player-names input");
const menuButton = document.getElementById("themes");
const popUpMenu = document.querySelector(".pop-up-menu");
const themeButtons = popUpMenu.querySelectorAll(".pop-up-menu button");

let times = [300,300];
let delay;
let active = null; // 0 for White, 1 for Black, null for paused
let lastTick = performance.now();
let moveStartTime = null;
let prevActive = null;

const modes = {
    "Bullet": 60,
    "Blitz-1": 180,
    "Blitz-2": 300,
    "Rapid-1": 600,
    "Rapid-2": 900,
    "Rapid-3": 1800,
    "Classical": 3600
};

const themes = {
    "light": "light-theme",
    "dark": "dark-theme"
};

const toggleTheme = (theme) => {
    document.body.className = theme;
};

const updateDisplay = () => {
    buttons[0].textContent = `${playerNameInputs[0].value || "White"}: ${formatTime(times[0])}`;
    buttons[1].textContent = `${playerNameInputs[1].value || "Black"}: ${formatTime(times[1])}`;
};

const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = (time % 60).toFixed(1).padStart(4, "0");
    return `${minutes}:${seconds}`;
}

const selectMode = () => {
    if (modeSelect.value in modes) {
        return modes[modeSelect.value];
    } else {
        let floatValue = parseFloat(modeSelect.value.trim());
        if (isNaN(floatValue) || floatValue <= 0) return modes["Blitz-2"];
        else return floatValue;
    }
}

setInterval(() => {
    if (active === null) return; // Don't update time if paused
    const startTime = performance.now();
    let elapsed = (startTime - lastTick) / 1000;
    times[active] -= elapsed;
    const pct = times[active]/selectMode();
    lastTick = startTime;
    
    buttons[active].classList.toggle("warning", pct <= 0.2 && pct > 0.1);
    buttons[active].classList.toggle("alert", pct <= 0.1 && pct > 0.05);
    buttons[active].classList.toggle("critical", pct <= 0.05);
        
    if (times[active] <= 0) {
        times[active] = 0;
        active = null;
    }
        updateDisplay();
    }, 100);

const switchPlayer = () => {
    let now = performance.now();
    prevActive = active; // Store the player who currently moves
    delay = parseFloat(delayInput.value.trim());
    if (isNaN(delay) || delay < 0) delay = 2;

    if (methodSelect.value === "fischer") {
        times[active] += delay; // Add increment to the player
        active = 1 - active;
    } else if (methodSelect.value === "delay") {
        active = null; // Create delay by pausing the clock
        setTimeout(() => {
            lastTick = performance.now(); // Reset lastTick to prevent time loss during delay
            active = 1 - prevActive;
        }, delay * 1000); // Switch player after delay
    } else if (methodSelect.value === "bronstein") {
        times[active] += Math.min(delay, (now -  moveStartTime)/1000); // Add Bronstein delay
        times[active] = Math.min(times[active], 300); // Cap time at initial time if there is drift
        active = 1 - active;
    } else if (methodSelect.value === "sd") {
        active = 1 - active; // Just switch player without adding time
    }
    updateDisplay();

    lastTick = moveStartTime = now;
}

document.addEventListener("keydown", (e) => {
    if (e.code !== "Space") return;
    if (active === null) {
        if (prevActive === null) {// Start with White if it's the first move
            active = 0;
            moveStartTime = performance.now();
        } else return; // Don't switch player if paused
    } else switchPlayer();

    lastTick = performance.now();
    e.preventDefault();
}); 

pause.addEventListener("click", () => {
    if (active !== null) {
        prevActive = active;   
        active = null;
        pause.textContent = "play_arrow";
    } else {
        active = prevActive;
        lastTick = performance.now();
        pause.textContent = "pause";
    }
})

resetButton.addEventListener("click", () => {
    times[0] = times[1] = modes["Blitz-2"];
    active = null;
    prevActive = null;
    lastTick = performance.now();

    pause.textContent = "play_arrow";
    methodSelect.value = "fischer";
    delayInput.value = "2";
    modeSelect.value = "Blitz-2";

    updateDisplay();
});

modeSelect.addEventListener("change", () => {
    times[0] = times[1] = selectMode();
    updateDisplay();
});

menuButton.addEventListener("click", (e) => {
    popUpMenu.style.display = popUpMenu.style.display === "block" ? "none" : "block";
    e.stopPropagation();
});

themeButtons.forEach(button => {
    button.addEventListener("click", () => {
        toggleTheme(themes[button.textContent.toLowerCase()]);
        popUpMenu.style.display = "none";
    });
});