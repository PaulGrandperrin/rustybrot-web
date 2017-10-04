"use strict";

const ncore = navigator.hardwareConcurrency;
//const ncore = 1;
console.log("number of core available: " + ncore);

let worker_compositor = null;
const workers = [];
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');


function setupCompositor() {
    console.log("setting up compositor");
    const size_x = canvas.clientWidth;
    const size_y = canvas.clientHeight;
    
    const receivedDataFromCompositor = function(event) {
        console.log("received data from compositor");
        const [compositorResultBuffer, max] = event.data;
        const compositorResult = new Uint8ClampedArray(compositorResultBuffer);

        /*
        const imageData = ctx.getImageData(0, 0, size_x, size_y);
        const data = imageData.data;
        for (let i = 0; i < data.length; i++) {
          data[i] = result[i];
        }
        ctx.putImageData(imageData, 0, 0);
        */

        var imageData = new ImageData(compositorResult, size_x, size_y);
        ctx.putImageData(imageData, 0, 0);

    };

    worker_compositor = new Worker("worker-compositor.js");
    worker_compositor.onmessage = receivedDataFromCompositor;
    worker_compositor.postMessage(["init", size_x, size_y]);


}

function setupWorkers() {
    console.log("setting up workers");
    const size_x = canvas.clientWidth;
    const size_y = canvas.clientHeight;
    
    const receivedDataFromWorker = function(event) {
        const [name, workerResultBuffer] = event.data;
        console.log("received data from " + name);

        worker_compositor.postMessage(['compose', workerResultBuffer]);
    };

    for (const i in [...Array(ncore).keys()]) {
        workers[i] = new Worker("worker-producer.js");
        workers[i].onmessage = receivedDataFromWorker;
        workers[i].postMessage(["worker"+i, size_y, size_x]);
    }

}


function setupCanvas() {
    const size_x = canvas.clientWidth;
    const size_y = canvas.clientHeight;
    canvas.width = size_x;
    canvas.height = size_y;

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function terminateCompositor() {
    console.log("terminating compositor");

    worker_compositor.terminate();
}

function terminateWorkers() {
    console.log("terminating all workers");

    for (const w of workers) {
        w.terminate();
    }
}


let playing = true;

window.onload = function() {
    setupCanvas();
    setupCompositor();
    setupWorkers();

    window.onresize = function(event) {
        console.log("resize event");

        terminateWorkers();
        terminateCompositor();
        setupCanvas();
        if (playing) {
            setupCompositor();
            setupWorkers();
        }
    };

}


let buttonPlayPause = document.getElementById('button-play-pause');
buttonPlayPause.addEventListener('click', function() {
    let icon = buttonPlayPause.getElementsByTagName("span")[0];
    if (playing) {
        terminateWorkers();
        terminateCompositor();
    } else {
        setupCompositor();
        setupWorkers();
    }
    playing = !playing;
    if (playing) {
        icon.innerText="pause";
    } else {
        icon.innerText="play_arrow";
    }
});
