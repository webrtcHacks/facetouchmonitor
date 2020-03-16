'use strict';

function handleSuccess(stream) {
    const video = document.querySelector('video');
    console.log(`Using video device: ${stream.getVideoTracks()[0].label}`);
    video.srcObject = stream;
}

// ToDo: Use these to guide the user on error
function handleError(error) {
    if (error.name === 'ConstraintNotSatisfiedError') {
        const video = constraints.video;
        console.error(`The resolution ${video.width.exact}x${video.height.exact} px is not supported by your device.`);
    } else if (error.name === 'PermissionDeniedError') {
        console.error("User denied access to media devices");
    }
    console.error(`getUserMedia error: ${error.name}`, error);
}


function gum() {
    const constraints = window.constraints = {
        audio: false,
        video: {height: {exact: 480}, width: {exact: 640}}
    };

    navigator.mediaDevices.getUserMedia(constraints)
        .then(stream => handleSuccess(stream))
        .catch(err => handleError(err))
}


