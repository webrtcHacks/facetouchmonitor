// Canvas setup
const drawCtx = drawCanvas.getContext('2d');

const flipHorizontal = true;

let stop = false;

//for starting events
let isPlaying = false,
    gotMetadata = false;

// check if metadata is ready - we need the sourceVideo size
sourceVideo.onloadedmetadata = () => {
    console.log("video metadata ready");
    gotMetadata = true;
    if (isPlaying)
        load()
            .then(net => predictLoop(net))
            .catch(err => console.error(err));
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

    // drawCanvas.hidden = false;

    userMessage.innerText = "Waiting for Machine Learning model to load...";
    return await bodyPix.load({multiplier: 0.50});
}

async function predictLoop(net) {

    drawCanvas.style.display = "block";

    let lastFaceArray = new Int32Array(sourceVideo.width * sourceVideo.height);
    let faceArray = [], handArray = [];
    let alerts = 0;
    let alertTimeout = false;

    let updateFace = true;
    setInterval(() => {
        updateFace = !updateFace;
    }, 1000);

    while (isPlaying && !stop) {

        // ToDo: some kind of stop function??
        // if (sourceVideo.srcObject.getVideoTracks.length === 0)
        //    return;


        const segmentPersonConfig = {
            flipHorizontal: flipHorizontal,     // Flip for webcam
            maxDetections: 1,                    // only look at one person in this model
            scoreThreshold: 0.5,                //0.4
            segmentationThreshold: 0.6,     // 0.3 default 0.7 //changed to default for 0.5 multiplier
            //nmsRadius: 10
        };
        const segmentation = await net.segmentPersonParts(sourceVideo, segmentPersonConfig);

        userMessage.innerText = "Monitoring running";
        showStats.hidden = false;


        const faceThreshold = 0.9;
        // const handThreshold = 0.5;
        const touchThreshold = 0.01;
        const numPixels = segmentation.width * segmentation.height;


        // ToDo: bigger problems if this happens
        if (segmentation.allPoses[0] === undefined) {
            console.info("No segmentation data");
            continue;
        }

        draw(segmentation);

        // Verify there is a good quality face before doing anything
        // I am assuming a consistent array order
        let nose = segmentation.allPoses[0].keypoints[0].score > faceThreshold;
        let leftEye = segmentation.allPoses[0].keypoints[1].score > faceThreshold;
        let rightEye = segmentation.allPoses[0].keypoints[2].score > faceThreshold;


        // Check for hands if there is a nose or eyes
        if (nose && (leftEye || rightEye)) {

            // Look for overlaps where the hand is and hte face used to be

            // Create an array of just face values
            faceArray = segmentation.data.map(val => {
                if (val === 0 || val === 1) return val;
                else return -1;
            });

            // Get the hand array
            handArray = segmentation.data.map(val => {
                if (val === 10 || val === 11) return val;
                else return -1;
            });

            let facePixels = 0;
            let score = 0;


            for (let x = 0; x < lastFaceArray.length; x++) {
                if (lastFaceArray[x] > -1)
                    facePixels++;

                // If the hand is overlapping where the face used to be
                if (lastFaceArray[x] > -1 && handArray[x] > -1)
                    score++;
            }

            let multiFaceArray = arrayToMatrix(faceArray, segmentation.width);
            let multiHandArray = arrayToMatrix(handArray, segmentation.width);
            let touchScore = touchingCheck(multiFaceArray, multiHandArray, 10);
            score += touchScore;


            // Update the old face according to the timer
            if (updateFace)
                lastFaceArray = faceArray;

            if (score > facePixels * touchThreshold && !alertTimeout) {
                console.info(` numPixels: ${numPixels} \n facePixels: ${facePixels}\n score: ${score}, touchScore: ${touchScore}\n` +
                    ` facePixels%: ${facePixels / numPixels}\n touch%: ${score / facePixels}`);
                alerts++;
                console.log("alert!!!", alerts);
                beep(350, 150, 0);
                alertTimeout = true;
                setTimeout(() => {
                    console.log("resuming alerts");
                    alertTimeout = false;
                }, 1000)
            }

            updateStats(alertTimeout);

        }

    }

}

function touchingCheck(matrix1, matrix2, padding) {
    let count = 0;
    for (let y = padding; y < matrix1.length - padding; y++)
        for (let x = padding; x < matrix1[0].length - padding; x++) {
            if (matrix1[y][x] > -1) {
                for (let p = 0; p < padding; p++) {
                    // if the hand is left or right, above or below the current face segment
                    if (matrix2[y][x - p] > -1 || matrix2[y][x + p] > -1 ||
                        matrix2[y - p][x] > -1 || matrix2[y + p][x] > -1) {
                        count++;
                    }
                }
            }
        }
    return count
}


function draw(personSegmentation) {

    if (showMaskToggle.checked) {
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

    if (showMaskToggle.checked === false) {
        // bodyPix.drawMask redraws the canvas. Clear with not
        drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    }

    if (showPointsToggle.checked) {
        // Show dots
        personSegmentation.allPoses.forEach(pose => {
            if (flipHorizontal) {
                pose = bodyPix.flipPoseHorizontal(pose, personSegmentation.width);
            }
            drawKeypoints(pose.keypoints, 0.5, drawCtx);
        });
    }


}

function drawKeypoints(keypoints, minConfidence, ctx, color = 'aqua') {
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

// Helper function to convert an arrow into a matrix for easier image functions
function arrayToMatrix(arr, rowLength) {
    let newArray = [];

    // Check
    if (arr.length % rowLength > 0 || rowLength < 1) {
        console.log("array not divisible by rowLength ", arr, rowLength);
        return
    }

    let rows = arr.length / rowLength;
    for (let x = 0; x < rows; x++) {
        let b = arr.slice(x * rowLength, x * rowLength + rowLength);
        newArray.push(b);
    }
    return newArray;
}
