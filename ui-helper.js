// element selectors
const sourceVideo = document.querySelector('video');
const drawCanvas = document.querySelector('canvas');

// Stats panel
const userMessage = document.querySelector('#userMessage');
const showStats = document.querySelector('#statsDiv');

// controls
const showMaskToggle = document.querySelector('#showMask');
const showPointsToggle = document.querySelector('#showPoints');
const beepToggle = document.querySelector('#beepToggle');
const notifyToggle = document.querySelector('#notifyToggle');
const alertTimeoutEntry = document.querySelector('#alertTimeOut');
const resetButton = document.querySelector('button#reset');

// Model control buttons
const fastButton = document.querySelector('button#highSpeed');
const normalButton = document.querySelector('button#normalSpeed');
const slowerButton = document.querySelector('button#lowerSpeed');
const slowButton = document.querySelector('button#lowSpeed');


// Get video camera
function handleSuccess(stream) {
    const video = document.querySelector('video');
    console.log(`Using video device: ${stream.getVideoTracks()[0].label}`);
    video.srcObject = stream;
}

function handleError(error) {
    if (error.name === 'ConstraintNotSatisfiedError') {
        console.error(`The resolution requested is not supported by your device.`);
    } else if (error.name === 'PermissionDeniedError') {
        console.error("User denied access to media devices");
    }
    console.error(`getUserMedia error: ${error.name}`, error);
}

document.querySelector('#main').addEventListener('click', e => {
    document.querySelector('#content').hidden = true;
    resetButton.style.display = "block";
    document.querySelector("div#usageNoteSide").innerHTML = document.querySelector('#usageNoteMain').innerHTML;
    navigator.mediaDevices.getUserMedia({video: { width: 640, height: 480}})
        .then(handleSuccess)
        .catch(handleError)
});


// Refresh page
resetButton.addEventListener('click', e => window.location.reload());


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


// Beep tone
function beep(tone, duration) {
    let audioCtx = new AudioContext;
    let oscillator = audioCtx.createOscillator();
    oscillator.frequency.value = tone;
    oscillator.connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration / 1000);
}

function enableDashboard(){

    drawCanvas.style.display = "block";
    userMessage.innerText = "Monitor running";
    showStats.hidden = false;

    fastButton.disabled = false;
    normalButton.disabled = true;
    slowerButton.disabled = false;
    slowButton.disabled = false;

}

// Adjust BodyPix model settings

fastButton.addEventListener('click', e => {
    fastButton.disabled = true;
    normalButton.disabled = false;
    slowerButton.disabled = false;
    slowButton.disabled = false;
    stopPrediction = true;
    load(0.5, 16);
});

normalButton.addEventListener('click', e => {
    fastButton.disabled = false;
    normalButton.disabled = true;
    slowerButton.disabled = false;
    slowButton.disabled = false;
    stopPrediction = true;
    load(0.75, 16);
});

slowerButton.addEventListener('click', e => {
    fastButton.disabled = false;
    normalButton.disabled = false;
    slowerButton.disabled = true;
    slowButton.disabled = false;
    stopPrediction = true;
    load(.75, 8);
});

slowButton.addEventListener('click', e => {
    fastButton.disabled = false;
    normalButton.disabled = false;
    slowerButton.disabled = false;
    slowButton.disabled = true;
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

