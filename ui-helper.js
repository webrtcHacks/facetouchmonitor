// element selectors
const sourceVideo = document.querySelector('video');
const drawCanvas = document.querySelector('canvas');
const loader = document.getElementById('loader');

// Stats panel
const userMessage = document.querySelector('#userMessage');
const showStats = document.querySelector('#statsDiv');

const touchesDisplay = document.querySelector('#touches');
const lastTouchDisplay = document.querySelector('#lastTouch');
const perHourDisplay = document.querySelector('#perHour');
const fpsDisplay = document.querySelector('#fps');


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

document.querySelector('#start').addEventListener('click', () => {
    document.querySelector('#content').hidden = true;
    resetButton.style.display = "block";

    // ToDo: learn proper CSS
    loader.style.display = "block";

    document.querySelector("div#usageNoteSide").innerHTML = document.querySelector('#usageNoteMain').innerHTML;
    // Fix constraints to 640 px width; higher resolutions are more accurate but slower
    navigator.mediaDevices.getUserMedia({video: {width: 640}, audio: false})
        .then(handleSuccess)
        .catch(handleError)


});


// Refresh page
resetButton.addEventListener('click', () => window.location.reload());

// Initialize the dashboard
function enableDashboard(initial=false) {

    drawCanvas.style.display = "block";
    userMessage.innerText = "Monitor running";
    showStats.hidden = false;
    loader.style.display = "none";

    startTime = new Date().getTime();

    if(initial){
        fastButton.disabled = false;
        normalButton.disabled = false;
        slowerButton.disabled = false;
        slowButton.disabled = false;
    }

    firstRun = false;
}


// Update stats

let touches = 0;
let lastFrameTime = new Date().getTime();
let lastTouchTime = false;
let lastTouchStatus = false;
let startTime;

function updateStats(touched) {

    // FPS display
    let now = new Date().getTime();
    let fps = 1000 / (now - lastFrameTime);

    lastFrameTime = now;
    fpsDisplay.innerText = fps.toFixed(1);

    // Touch counter
    if (touched && lastTouchStatus === false)
        touches++;

    lastTouchStatus = touched;
    touchesDisplay.innerText = touches;

    // Last Touch timer
    if (touched)
        lastTouchTime = now;
    if (lastTouchTime) {
        lastTouchDisplay.innerHTML = ((now - lastTouchTime) / 1000).toFixed(0) + " sec ago";

        // 1 / ((new Date().getTime() - startTime)/(60*1000*60))
        perHourDisplay.innerHTML = (touches / ((now - startTime) / (60 * 60 * 1000))).toFixed(2);
    } else {
        lastTouchDisplay.innerHTML = "None yet";
    }
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


// Adjust BodyPix model settings

fastButton.addEventListener('click', () => {
    fastButton.disabled = true;
    normalButton.disabled = false;
    slowerButton.disabled = false;
    slowButton.disabled = false;
    stopPrediction = true;
    load(0.5, 16);
});

normalButton.addEventListener('click', () => {
    fastButton.disabled = false;
    normalButton.disabled = true;
    slowerButton.disabled = false;
    slowButton.disabled = false;
    stopPrediction = true;
    load(0.75, 16);
});

slowerButton.addEventListener('click', () => {
    fastButton.disabled = false;
    normalButton.disabled = false;
    slowerButton.disabled = true;
    slowButton.disabled = false;
    stopPrediction = true;
    load(.75, 8);
});

slowButton.addEventListener('click', () => {
    fastButton.disabled = false;
    normalButton.disabled = false;
    slowerButton.disabled = false;
    slowButton.disabled = true;
    stopPrediction = true;
    load(1, 8);
});


// Notification functions

function checkNotificationPermission() {

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
notifyToggle.addEventListener('click', () => checkNotificationPermission());

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
        Notification.requestPermission().then(permission => {
            // If the user accepts, let's create a notification
            if (permission === "granted")
                new Notification(message);
            else
                notifyToggle.disabled = true;
        });
    } else
        console.log("notifications rejected")

}

