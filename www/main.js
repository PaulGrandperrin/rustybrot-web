"use strict";
window.mdc.autoInit();

const ncore = navigator.hardwareConcurrency;
//const ncore = 1;
console.log("number of core available: " + ncore);

let workers = [];

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let rawData = null;

function setupWorkers() {
    console.log("setting up workers");
    const size_x = canvas.clientWidth;
    const size_y = canvas.clientHeight;
    
    const receivedDataFromWorker = function(event) {
        const name = event.data[0];
        const result = event.data[1];

        console.log("received data from " + name);

        const imageData = ctx.getImageData(0, 0, size_x, size_y);
        const data = imageData.data;
        let max = 0;
        for (let i = 0; i < data.length; i++) {
          const n = rawData[i] + result[i];
          rawData[i] = n;
          if (n > max) {max = n}
        }

        //max = Math.sqrt(max);
        console.log("max value: " + max)

        function intensity2rainbow(intensity, max) {
            const norm = Math.min(1, intensity * 3 / max) * 2 * Math.PI;
            const red = (Math.sin(norm)+1)/2*256;
            const green = (Math.sin(norm+2*Math.PI/3)+1)/2*256;
            const blue = (Math.sin(norm+4*Math.PI/3)+1)/2*256;
            return [red, green, blue]
        }

        function intensity2greyscale(intensity, max) {
            // use square or cubic and smoothstep
            const grey = Math.min(255,(3*intensity/max*256));
            return [grey, grey, grey]
        }

        for (let y = 0; y < size_y; y++) {
            for(let x = 0; x < size_x; x++) {
                const color = intensity2greyscale(rawData[x*size_y+y], max);
                data[(y*size_x+x)*4+0] = color[0]; // red
                data[(y*size_x+x)*4+1] = color[1]; // green
                data[(y*size_x+x)*4+2] = color[2]; // blue
                // /*
            }
        }
        ctx.putImageData(imageData, 0, 0);

    };

    for (const i in [...Array(ncore).keys()]) {
        workers[i] = new Worker("worker.js");
        workers[i].postMessage(["worker"+i, size_y, size_x]);
        workers[i].onmessage = receivedDataFromWorker;
    }
}

function setupCanvas() {
    const size_x = canvas.clientWidth;
    const size_y = canvas.clientHeight;
    canvas.width = size_x;
    canvas.height = size_y;

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    rawData = new Uint32Array(size_x*size_y);
    rawData.fill(0);

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
    setupWorkers();

    window.onresize = function(event) {
        console.log("resize event");

        terminateWorkers();
        setupCanvas();
        if (playing) {
            setupWorkers();
        }
    };

}


let buttonPlayPause = document.getElementById('button-play-pause');
buttonPlayPause.addEventListener('click', function() {
    let icon = buttonPlayPause.getElementsByTagName("span")[0];
    if (playing) {
        terminateWorkers();
    } else {
        setupWorkers();
    }
    playing = !playing;
    if (playing) {
        icon.innerText="pause";
    } else {
        icon.innerText="play_arrow";
    }
});
