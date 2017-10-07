"use strict";

const ncore = navigator.hardwareConcurrency;
//const ncore = 1;
console.log("number of core available: " + ncore);




let focus = {
    x_min: -1.6,
    x_max: 0.8,
    y_min: -1.2,
    y_max: 1.2
};

let view = {};

let worker_compositor = null;
const workers = [];
let playing = true;
let selection_rect = document.getElementById('selection-rect');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

function fit_to_ratio(ratio, i) {
    let view_ratio = (i.x_max - i.x_min) / (i.y_max - i.y_min);
    let o = {};
    if (ratio < view_ratio) {
            let diff_y = (i.y_max - i.y_min) / ratio * view_ratio;
            let center_y = (i.y_max - i.y_min) / 2.0 + i.y_min;
            o.y_min = center_y - diff_y / 2.0;
            o.y_max = center_y + diff_y / 2.0;
            o.x_min = i.x_min;
            o.x_max = i.x_max;
    } else  {
            let diff_x = (i.x_max - i.x_min) * ratio / view_ratio;
            let center_x = (i.x_max - i.x_min) / 2.0 + i.x_min;
            o.x_min = center_x - diff_x / 2.0;
            o.x_max = center_x + diff_x / 2.0;
            o.y_min = i.y_min;
            o.y_max = i.y_max;
    }

    return o;
}

function setupCompositor() {
    console.log("setting up compositor");
    const size_x = canvas.clientWidth;
    const size_y = canvas.clientHeight;
    
    const receivedDataFromCompositor = function(event) {
        console.log("received data from compositor");
        const [compositorResultBuffer, max] = event.data;
        const compositorResult = new Uint8ClampedArray(compositorResultBuffer);

        /*
        const imageData = canvas_ctx.getImageData(0, 0, size_x, size_y);
        const data = imageData.data;
        for (let i = 0; i < data.length; i++) {
          data[i] = result[i];
        }
        canvas_ctx.putImageData(imageData, 0, 0);
        */

        const imageData = new ImageData(compositorResult, size_x, size_y);
        canvas_ctx.putImageData(imageData, 0, 0);

    };
    if (worker_compositor == null) {
        worker_compositor = new Worker("worker-compositor.js");
    }
        worker_compositor.onmessage = receivedDataFromCompositor;
    worker_compositor.postMessage(["init", size_x, size_y]);


}

function setupWorkers(minimumIteratiom, maximumIteration) {
    console.log("setting up workers");
    const size_x = canvas.clientWidth;
    const size_y = canvas.clientHeight;
    
    const receivedDataFromWorker = function(event) {
        const [name, workerResultBuffer] = event.data;
        console.log("received data from " + name);

        worker_compositor.postMessage(['compose', workerResultBuffer], [workerResultBuffer]);
    };

    for (const i in [...Array(ncore).keys()]) {
        workers[i] = new Worker("worker-producer.js");
        workers[i].onmessage = receivedDataFromWorker;
        view = fit_to_ratio(size_y/size_x, focus);
        workers[i].postMessage(["worker"+i, size_y, size_x, view, minimumIteratiom, maximumIteration]);
    }

}


function setupCanvas() {
    const size_x = canvas.clientWidth;
    const size_y = window.innerHeight;

    canvas.width = size_x;
    canvas.height = size_y;

    canvas_ctx.fillStyle = "#000000";
    canvas_ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function terminateCompositor() {
    console.log("terminating compositor");

    worker_compositor.terminate();
    worker_compositor = null;
}

function terminateWorkers() {
    console.log("terminating all workers");

    for (const w of workers) {
        w.terminate();
    }
}






inputMinimumIteration.addEventListener('input', function() {
    setupCanvas();
    terminateWorkers();
    terminateCompositor();
    setupCompositor();
    if (playing) {
        setupWorkers(inputMinimumIteration.value, inputMaximumIteration.value);
    }
});

inputMaximumIteration.addEventListener('input', function() {
    setupCanvas();
    terminateWorkers();
    terminateCompositor();
    setupCompositor();
    if (playing) {
        setupWorkers(inputMinimumIteration.value, inputMaximumIteration.value);
    }
});

buttonPlayPause.addEventListener('click', function() {
    let icon = buttonPlayPause.getElementsByTagName("span")[0];
    if (playing) {
        terminateWorkers();
    } else {
        setupWorkers(inputMinimumIteration.value, inputMaximumIteration.value);
    }
    playing = !playing;
    if (playing) {
        icon.innerText="pause";
    } else {
        icon.innerText="play_arrow";
    }
});


window.onload = function() {
    setupCanvas();
    setupCompositor();
    setupWorkers(inputMinimumIteration.value, inputMaximumIteration.value);

    window.onresize = function(event) {
        console.log("resize event");

        terminateWorkers();
        terminateCompositor();
        setupCanvas();
        setupCompositor();
        if (playing) {
            setupWorkers(inputMinimumIteration.value, inputMaximumIteration.value);
        }
    };

}