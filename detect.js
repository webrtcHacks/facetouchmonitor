


//Video element selector
const sourceVideo = document.querySelector('video');
const drawCanvas = document.querySelector('canvas');
// let drawCanvas = document.createElement('canvas');


// Canvas setup
const drawCtx = drawCanvas.getContext('2d');

const flipHorizontal = true;
let mask = false;

//for starting events
let isPlaying = false,
    gotMetadata = false;

// check if metadata is ready - we need the sourceVideo size
sourceVideo.onloadedmetadata = () => {
    console.log("video metadata ready");
    gotMetadata = true;
    if (isPlaying)
        load().then((net)=>predictLoop(net));
};

// Check if the sourceVideo has started playing
sourceVideo.onplaying = () => {
    console.log("video playing");
    isPlaying = true;
    if (gotMetadata) {
        load()
            .then( net => predictLoop(net))
            .catch(err => console.error(err));
    }
};


async function load(){
    sourceVideo.width = sourceVideo.videoWidth;
    sourceVideo.height = sourceVideo.videoHeight;

    // Canvas results for displaying masks
    drawCanvas.width = sourceVideo.videoWidth;
    drawCanvas.height = sourceVideo.videoHeight;

    //drawCanvas.hidden = false;

    return await bodyPix.load();
}

async function predictLoop(net){

    if (mask){
        sourceVideo.hidden = true;
    }

    drawCanvas.style.display = "block";



    // ToDo: some kind of stop function??
    // if (sourceVideo.videoTracks.length === 0)
    //    isPlaying = false;

    while (isPlaying){
        const config = {flipHorizontal: flipHorizontal};
        const segmentation = await net.segmentPersonParts(sourceVideo, config);
        // console.log(segmentation);

        let faceThreshold = 0.9;
        let handThreshold = 0.7;

        let nose = segmentation.allPoses[0].keypoints[0].score > faceThreshold;
        let leftEye = segmentation.allPoses[0].keypoints[1].score > faceThreshold;
        let rightEye = segmentation.allPoses[0].keypoints[2].score > faceThreshold;
        let leftWrist = segmentation.allPoses[0].keypoints[9].score > handThreshold;
        let rightWrist = segmentation.allPoses[0].keypoints[10].score > handThreshold;


        if ( (nose || leftEye || rightEye) && (leftWrist || rightWrist) )
        {
            console.log("alert!!!")
            // console.log(segmentation)


        }

        /*
        console.log(segmentation.allPoses[0].keypoints[1]);
        console.log(segmentation.allPoses[0].keypoints[2]);
        console.log(segmentation.allPoses[0].keypoints[3]);
        console.log(segmentation.allPoses[0].keypoints[9]);
        console.log(segmentation.allPoses[0].keypoints[10]);
         */

        // Draw a mask of the body segments - useful for debugging
        if (mask){
            const coloredPartImage = bodyPix.toColoredPartMask(segmentation);
            const opacity = 0.7;
            const maskBlurAmount = 0;
            bodyPix.drawMask(
                drawCanvas, sourceVideo, coloredPartImage, opacity, maskBlurAmount,
                flipHorizontal);
        }


        // console.log(segmentation);

        // Show dots
        drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
        segmentation.allPoses.forEach(pose=>{
            if (flipHorizontal) {
                pose = bodyPix.flipPoseHorizontal(pose, segmentation.width);
            }
            drawKeypoints(pose.keypoints, handThreshold, drawCtx);
        })


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
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();

    }
}
