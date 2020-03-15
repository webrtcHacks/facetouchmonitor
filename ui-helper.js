//Video element selector
const sourceVideo = document.querySelector('video');
const drawCanvas = document.querySelector('canvas');
const showMaskToggle = document.querySelector('#showMask');
const showPointsToggle = document.querySelector('#showPoints');
const showStats = document.querySelector('#statsDiv');
const userMessage = document.querySelector('#userMessage');
const exitButton = document.querySelector('button#exit');


exitButton.addEventListener('click', e => window.location.reload());
document.querySelector('#main').addEventListener('click', e => {
    document.querySelector('#content').hidden = true;
    exitButton.style.display = "block";
    document.querySelector("div#usageNoteSide").innerHTML = document.querySelector('#usageNoteMain').innerHTML;
    init().catch(e => console.error(e));
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
        lastTouchDisplay.innerHTML = ((now - lastTouchTime)/1000).toFixed(0);
    else
        lastTouchDisplay.innerHTML = "0";


}


function beep(tone, duration) {
    let audioCtx = new AudioContext;
    let oscillator = audioCtx.createOscillator();
    oscillator.frequency.value = tone;
    oscillator.connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration / 1000);
}
