//Video element selector
const sourceVideo = document.querySelector('video');
const drawCanvas = document.querySelector('canvas');
// let drawCanvas = document.createElement('canvas');


// Canvas setup
const drawCtx = drawCanvas.getContext('2d');

const flipHorizontal = true;
let mask = true;

//for starting events
let isPlaying = false,
    gotMetadata = false;

// check if metadata is ready - we need the sourceVideo size
sourceVideo.onloadedmetadata = () => {
    console.log("video metadata ready");
    gotMetadata = true;
    if (isPlaying)
        load().then((net) => predictLoop(net));
};

// Check if the sourceVideo has started playing
sourceVideo.onplaying = () => {
    console.log("video playing");
    isPlaying = true;
    if (gotMetadata) {
        load()
            .then(net => predictLoop(net))
            .catch(err => console.error(err));
    }
};



async function load() {
    sourceVideo.width = sourceVideo.videoWidth;
    sourceVideo.height = sourceVideo.videoHeight;

    // Canvas results for displaying masks
    drawCanvas.width = sourceVideo.videoWidth;
    drawCanvas.height = sourceVideo.videoHeight;

    //drawCanvas.hidden = false;

    return await bodyPix.load();
}

async function predictLoop(net) {

    if (mask) {
        //sourceVideo.hidden = true;
    }

    drawCanvas.style.display = "block";

    let lastFaceArray = [];
    let faceArray = [], handArray = [];
    let alerts = 0;

    let updateFace = true;
    setInterval(()=>{
        updateFace = !updateFace;
    }, 1000);



    while (isPlaying) {


        // ToDo: some kind of stop function??
        // if (sourceVideo.srcObject.getVideoTracks.length === 0)
        //    return;


        const config = {flipHorizontal: flipHorizontal};
        const segmentation = await net.segmentPersonParts(sourceVideo, config);



        const faceThreshold = 0.9;
        const handThreshold = 0.5;
        const touchThreshold = 0.025;


        // ToDo: bigger problems if this happens
        if (segmentation.allPoses[0] === undefined) {
            console.error("No segmentation data");
            continue;
        }

        draw(segmentation, true, true);

        //console.log(segmentations);
        //let segmentation = segmentations[0];

        // ToDo: I am assuming a consistent array order - bad idea
        let nose = segmentation.allPoses[0].keypoints[0].score > faceThreshold;
        let leftEye = segmentation.allPoses[0].keypoints[1].score > faceThreshold;
        let rightEye = segmentation.allPoses[0].keypoints[2].score > faceThreshold;

        let leftWrist = segmentation.allPoses[0].keypoints[9].score > handThreshold;
        let rightWrist = segmentation.allPoses[0].keypoints[10].score > handThreshold;


        // Check for hands if there is a nose or eyes
        if (nose || leftEye || rightEye) {

            faceArray = segmentation.data.map(val => {
                if (val === 0 || val === 1)
                    return val;
                else
                    return -1;
            });


            // Get the hand array if you see a wrist point
            handArray = segmentation.data.map(val => {
                if (val === 10 || val === 11)
                    return val;
                else
                    return -1;
            });


            // Check for overlap
            //if ((nose || leftEye || rightEye) && (leftWrist || rightWrist)) {

            // ToDo: see if there is a better way to initialize lastFaceArray
            // For the first run
            if (!lastFaceArray.length) {
                console.info("initializing lastFaceArray");
                lastFaceArray = faceArray;
                continue;
            }


            const numPixels = segmentation.width * segmentation.height;
            let facePixels = 0;
            let score = 0;


            for (let x = 0; x < lastFaceArray.length; x++) {
                if (lastFaceArray[x] > -1)
                    facePixels++;

                if (lastFaceArray[x] > -1 && handArray[x] > -1)
                    score++;
            }


            if (score > facePixels * touchThreshold) {
                console.info(` numPixels: ${numPixels} \n facePixels: ${facePixels}\n score: ${score}`);
                console.info(` facePixels: ${facePixels / numPixels}\n touch: ${score / facePixels}`);
                alerts++;
                console.log("alert!!!", alerts);
            }
            // console.log(segmentation);
        }

        if(updateFace)
            lastFaceArray = faceArray;

    }

}

function draw(personSegmentation, drawMask = false, drawPoints = false) {

    if (drawMask) {
        let targetSegmentation = personSegmentation;

        // Draw a mask of the body segments - useful for debugging
        targetSegmentation.data = personSegmentation.data.map(val => {
            if (val !== 0 && val !== 1 && val !== 10 && val !== 11)
                return -1;
            else
                return val;
        });

        const coloredPartImage = bodyPix.toColoredPartMask(targetSegmentation);
        const opacity = 0.7;
        const maskBlurAmount = 0;
        bodyPix.drawMask(
            drawCanvas, sourceVideo, coloredPartImage, opacity, maskBlurAmount,
            flipHorizontal);

    }

    if (drawMask === false && drawPoints === true) {
        // bodyPix.drawMask redraws the canvas. Clear with not
        drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    }

    if (drawPoints) {
        // Show dots
        personSegmentation.allPoses.forEach(pose => {
            if (flipHorizontal) {
                pose = bodyPix.flipPoseHorizontal(pose, personSegmentation.width);
            }
            drawKeypoints(pose.keypoints, 0.5, drawCtx);
        });
    }


}


function drawKeypoints(keypoints, minConfidence, ctx, color = 'aqua', scale = 1) {
    for (let i = 0; i < keypoints.length; i++) {
        const keypoint = keypoints[i];

        if (keypoint.score < minConfidence) {
            continue;
        }

        const {y, x} = keypoint.position;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();

    }
}
