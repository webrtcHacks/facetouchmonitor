//Video element selector
const sourceVideo = document.querySelector('video');
const drawCanvas = document.querySelector('canvas');
const showMaskToggle = document.querySelector('#showMask');
const showPointsToggle = document.querySelector('#showPoints');
const showStats = document.querySelector('#statsDiv');
const userMessage = document.querySelector('#userMessage');
const exitButton = document.querySelector('button#exit');

const beepToggle = document.querySelector('#beepToggle');
const notifyToggle = document.querySelector('#notifyToggle');
const alertTimeoutEntry = document.querySelector('#alertTimeOut');



exitButton.addEventListener('click', e => window.location.reload());
document.querySelector('#main').addEventListener('click', e => {
    document.querySelector('#content').hidden = true;
    exitButton.style.display = "block";
    document.querySelector("div#usageNoteSide").innerHTML = document.querySelector('#usageNoteMain').innerHTML;
    gum();
});


// Update stats


let touches = 0;
let lastFrameTime = new Date().getTime();
let lastTouchTime = false;
let lastTouchStatus = false;

const touchesDisplay = document.querySelector('#touches');
const lastTouchDisplay = document.querySelector('#lastTouch');
const fpsDisplay = document.querySelector('#fps');

function updateStats(touched){

    // FPS display
    let now = new Date().getTime();
    let fps = 1000/(now-lastFrameTime);
    lastFrameTime = now;
    fpsDisplay.innerText = fps.toFixed(2);

    // Touch counter
    if(touched && lastTouchStatus === false)
        touches++;

    lastTouchStatus = touched;
    touchesDisplay.innerText = touches;

    // Last Touch timer
    if(touched)
        lastTouchTime = now;
    if(lastTouchTime)
        lastTouchDisplay.innerHTML = ((now - lastTouchTime)/1000).toFixed(0) + " sec ago";
    else
        lastTouchDisplay.innerHTML = "None yet";
}


function beep(tone, duration) {
    let audioCtx = new AudioContext;
    let oscillator = audioCtx.createOscillator();
    oscillator.frequency.value = tone;
    oscillator.connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration / 1000);
}


// Model controls
const fastButton = document.querySelector('button#highSpeed');
const normalButton = document.querySelector('button#normalSpeed');
const slowerButton = document.querySelector('button#lowerSpeed');
const slowButton = document.querySelector('button#lowSpeed');

// Adjust BodyPix model settings

fastButton.addEventListener('click', e => {
    slowButton.disabled = false;
    slowerButton.disabled = false;
    normalButton.disabled = false;
    fastButton.disabled = true;
    stopPrediction = true;
    load(0.5, 16);
});

normalButton.addEventListener('click', e => {
    slowButton.disabled = false;
    slowerButton.disabled = false;
    normalButton.disabled = true;
    fastButton.disabled = false;
    stopPrediction = true;
    load(0.75, 16);
});

slowerButton.addEventListener('click', e => {
    slowButton.disabled = false;
    slowerButton.disabled = true;
    normalButton.disabled = false;
    fastButton.disabled = false;
    stopPrediction = true;
    load(.75, 8);
});

slowButton.addEventListener('click', e => {
    slowButton.disabled = true;
    slowerButton.disabled = false;
    normalButton.disabled = false;
    fastButton.disabled = false;
    stopPrediction = true;
    load(1, 8);
});


// Notification functions

function checkNotificationPermission(){

    if (Notification.permission !== "granted")
        Notification.requestPermission().then(permission => {
            if (permission !== "granted") {
                notifyToggle.checked = false;
                notifyToggle.disabled = true;
            } else {
                notifyToggle.removeEventListener('click', checkNotificationPermission)
            }
        });
}

// Prompt the user to allow notifications the first time they click
notifyToggle.addEventListener('click', e => checkNotificationPermission()
);

// Browser notifications on touches
function notify(message) {
    // Let's check if the browser supports notifications
    if (!("Notification" in window)) {
        alert("Sorry, browser notifications not supported");
        notifyToggle.disabled = true;
    }

    // Check if notification permissions have  been granted
    else if (Notification.permission === "granted")
        new Notification(message);

    // Ask the user for permission first
    else if (Notification.permission !== "denied") {
        Notification.requestPermission().then( permission=> {
            // If the user accepts, let's create a notification
            if (permission === "granted")
                new Notification(message);
            else
                notifyToggle.disabled = true;
        });
    }
    else
        console.log("notifications rejected")

}

