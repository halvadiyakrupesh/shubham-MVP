// Copyright (c) 2019 ml5
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

/* ===
ml5 Example
PoseNet using p5.js
=== */
/* eslint-disable */

// Grab elements, create settings, etc.
var video = document.getElementById('video');
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');

// The detected positions will be inside an array
let poses = [];
let poseStream = []

// let downloadButton = document.getElementById("downloadButton");

function startRecording(){
  // switch button's behavior
  const btn = this;
  btn.textContent = 'stop recording';
  btn.onclick = stopRecording;
  
  const chunks = []; // here we will save all video data
  const rec = new MediaRecorder(video.srcObject);
  // this event contains our data
  rec.ondataavailable = e => chunks.push(e.data);
  // when done, concatenate our chunks in a single Blob
  rec.onstop = e => download(new Blob(chunks));
  rec.start();
  function stopRecording(){
    rec.stop();
    // switch button's behavior
    btn.textContent = 'start recording';
    btn.onclick = startRecording;
  }
}
function download(blob){
  // uses the <a download> to download a Blob
  let a = document.createElement('a'); 
  a.href = URL.createObjectURL(blob);
  a.download = 'recorded.webm';
  document.body.appendChild(a);
  a.click();
}


// Create a webcam capture
if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
  navigator.mediaDevices.getUserMedia({ video: true }).then(function(stream) {
    video.srcObject=stream;
    // downloadButton.srcObject = stream
    video.play();
  }).then(()=>{ // enable the button
    const btn = document.getElementById('downloadButton');
    btn.disabled = false;
    btn.onclick = startRecording;
  });
}

// A function to draw the video and poses into the canvas.
// This function is independent of the result of posenet
// This way the video will not seem slow if poseNet 
// is not detecting a position
function drawCameraIntoCanvas() {
  // console.log("Hello")
  // Draw the video element into the canvas
  ctx.drawImage(video, 0, 0, 640, 480);
  // We can call both functions to draw all keypoints and the skeletons
  drawKeypoints();
  drawSkeleton();
  window.requestAnimationFrame(drawCameraIntoCanvas);
}
// Loop over the drawCameraIntoCanvas function
drawCameraIntoCanvas();

let poseparams =   {
  architecture: 'MobileNetV1',
  imageScaleFactor: 0.3,
  outputStride: 16,
  flipHorizontal: false,
  minConfidence: 0.5,
  maxPoseDetections: 1,
  scoreThreshold: 0.5,
  nmsRadius: 20,
  detectionType: 'multiple',
  inputResolution: 513,
  multiplier: 0.75,
  quantBytes: 2
}

function saveText(text, filename){
  var a = document.createElement('a');
  a.setAttribute('href', 'data:text/plain;charset=utf-u,'+encodeURIComponent(text));
  a.setAttribute('download', filename);
  a.click()
}

// Create a new poseNet method with a single detection
const poseNet = ml5.poseNet(video, poseparams, modelReady);
poseNet.on('pose', gotPoses);

// A function that gets called every time there's an update from the model
function gotPoses(results) {
  var socket = io();
  poses = results;
  console.log(poses)
  if(poses.length > 0){
     socket.emit('chat message', poses[0].pose);
    poseStream.push(poses[0].pose)

  }

  if(poseStream.length == 1000){
    saveText(JSON.stringify(poseStream), "poseStream.json" );
  }
}

function modelReady() {
  console.log("model ready")
  // poseNet.singlePose(video)
}

// A function to draw ellipses over the detected keypoints
function drawKeypoints()  {
  // Loop through all the poses detected
  for (let i = 0; i < poses.length; i++) {
    // For each pose detected, loop through all the keypoints
    for (let j = 0; j < poses[i].pose.keypoints.length; j++) {
      let keypoint = poses[i].pose.keypoints[j];
      // console.log(keypoint)
      // Only draw an ellipse is the pose probability is bigger than 0.2
      if (keypoint.score > 0.2) {
        ctx.beginPath();
        ctx.arc(keypoint.position.x, keypoint.position.y, 10, 0, 2 * Math.PI);
        ctx.fillStyle = "#c82124";
        ctx.fill();
        ctx.stroke();
      }
    }
  }
}

// A function to draw the skeletons
function drawSkeleton() {
  // Loop through all the skeletons detected
  for (let i = 0; i < poses.length; i++) {
    // For every skeleton, loop through all body connections
    for (let j = 0; j < poses[i].skeleton.length; j++) {
      let partA = poses[i].skeleton[j][0];
      let partB = poses[i].skeleton[j][1];
      ctx.beginPath();
      ctx.moveTo(partA.position.x, partA.position.y);
      ctx.lineTo(partB.position.x, partB.position.y);
      ctx.stroke();
    }
  }
}