# FaceTouchMonitor.com

A website that monitors when you touch your face. 

In addition to washing your hands often, the [CDC](https://www.cdc.gov/coronavirus/2019-ncov/prepare/prevention.html) recommends that you avoid touching your eyes, nose, and mouth with unwashed hands. This can be hard to do without a reminder.

This project uses the [BodyPix](https://github.com/tensorflow/tfjs-models/tree/master/body-pix) project from [tensorflow.js](https://www.tensorflow.org/js/) to detect hands and faces.
When a hand intersects with the face it is considered a touch.
Set beep alerts or get a browser notification when you do. 
The reminders can you train yourself to stop accidental face touching. 

No information is shared externally - no images are transmitted and all ML processing is done locally in the browser.

Try it at https://facetouchmonitor.com.
Read about it at https://webrtchacks.com/

## Demo video
It only takes seconds to [try yourself](https://facetouchmonitor.com).

[![Alt text](https://img.youtube.com/vi/V4ogsQJPu0U/0.jpg)](https://www.youtube.com/watch?v=V4ogsQJPu0U)

## Usage Notes (and to do list)

### Browsers and Devices
* Browser support - tensorflow.js works best on Chrome and has been tested in the new Edge and Firefox. I haven't been able to make it work with Safari. 
* It will work on faster mobile devices, but the page is not responsive

### Detection
* The detection method is relatively crude - it has no depth perception, so a hand in front of your face will set it off. 
* A face is considered anything with one eye and a nose (according to its detection)
* It usually does not detect as well if you are very close to the camera. 
* It is not optimized to handle multiple people

### CPU Utilization
* BodyPix can be CPU intensive on some devices - it will not work well on slower devices
* If the FPS drops below 5 FPS, try using the _Fastest_ setting
* It works best if you can keep the browser tab in the foreground so background throttling is not invoked

### Pull Request ♥ 

The CSS fixes from [dharmadeveloper108](https://github.com/dharmadeveloper108) are much appreciated!
