"use strict";

const ncore = navigator.hardwareConcurrency;
//const ncore = 1;
console.log("number of core available: " + ncore);

let view = {};

let worker_compositor = null;
const workers = [];
let playing = true;
let selection_rect = document.getElementById('selection-rect');
const canvas = document.getElementById('canvas');
const canvas_ctx = canvas.getContext('2d');
let inputRedMinimumIteration = document.getElementById('input-red-minimum-iteration');
let inputRedMaximumIteration = document.getElementById('input-red-maximum-iteration');
let inputGreenMinimumIteration = document.getElementById('input-green-minimum-iteration');
let inputGreenMaximumIteration = document.getElementById('input-green-maximum-iteration');
let inputBlueMinimumIteration = document.getElementById('input-blue-minimum-iteration');
let inputBlueMaximumIteration = document.getElementById('input-blue-maximum-iteration');
let inputReMin = document.getElementById('input-re-min');
let inputReMax = document.getElementById('input-re-max');
let inputImMin = document.getElementById('input-im-min');
let inputImMax = document.getElementById('input-im-max');
let inputEngine = document.getElementById('input-engine');
let inputAlgo = document.getElementById('input-algo');
let buttonPlayPause = document.getElementById('button-play-pause');
let buttonReset = document.getElementById('button-reset');


let statSamples = document.getElementById('stat-samples');
let statOrbitsTooSmall = document.getElementById('stat-orbits-too-small');
let statOrbitsTooBig = document.getElementById('stat-orbits-too-big');
let statValidOrbits = document.getElementById('stat-valid-orbits');
let statOrbitsPoints = document.getElementById('stat-orbits-points');
let statOrbitsPointsOnScreen = document.getElementById('stat-orbits-points-on-screen');

let statSamplesPerS = document.getElementById('stat-samples-s');
let statOrbitsTooSmallPerS = document.getElementById('stat-orbits-too-small-s');
let statOrbitsTooBigPerS = document.getElementById('stat-orbits-too-big-s');
let statValidOrbitsPerS = document.getElementById('stat-valid-orbits-s');
let statOrbitsPointsPerS = document.getElementById('stat-orbits-points-s');
let statOrbitsPointsOnScreenPerS = document.getElementById('stat-orbits-points-on-screen-s');

let time_since_play;
let time_since_pause;
let duration_pause = 0;

function human_readable(bytes) {
    var sizes = ['', 'K', 'M', 'G', 'T', 'P'];
    if (bytes == 0) return '0';
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1000)));
    return Math.round(bytes / Math.pow(1000, i)*10, 3)/10 + sizes[i];
};

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

var global_stats = {
    samples: 0,
    orbits_too_small: 0,
    orbits_too_big: 0,
    valid_orbits: 0,
    orbits_points: 0,
    orbits_points_on_screen: 0,
};

function setupWorkers() {
    console.log("setting up workers");
    const size_x = canvas.clientWidth;
    const size_y = canvas.clientHeight;
    
    const receivedDataFromWorker = function(event) {
        const [name, workerResultBuffer, stats] = event.data;
        console.log("received data from " + name);
        console.log("STATS: ", stats);
        global_stats.samples += stats.samples;
        global_stats.orbits_too_small += stats.orbits_too_small;
        global_stats.orbits_too_big += stats.orbits_too_big;
        global_stats.valid_orbits += stats.valid_orbits;
        global_stats.orbits_points += stats.orbits_points;
        global_stats.orbits_points_on_screen += stats.orbits_points_on_screen;

        statSamples.innerText = human_readable(global_stats.samples);
        statOrbitsTooSmall.innerText = human_readable(global_stats.orbits_too_small);
        statOrbitsTooBig.innerText = human_readable(global_stats.orbits_too_big);
        statValidOrbits.innerText = human_readable(global_stats.valid_orbits);
        statOrbitsPoints.innerText = human_readable(global_stats.orbits_points);
        statOrbitsPointsOnScreen.innerText = human_readable(global_stats.orbits_points_on_screen);

        let duration = performance.now() - time_since_play - duration_pause;

        statSamplesPerS.innerText = human_readable(global_stats.samples / duration) + '/s';
        statOrbitsTooSmallPerS.innerText = human_readable(global_stats.orbits_too_small / duration) + '/s';
        statOrbitsTooBigPerS.innerText = human_readable(global_stats.orbits_too_big / duration) + '/s';
        statValidOrbitsPerS.innerText = human_readable(global_stats.valid_orbits / duration) + '/s';
        statOrbitsPointsPerS.innerText = human_readable(global_stats.orbits_points / duration) + '/s';
        statOrbitsPointsOnScreenPerS.innerText = human_readable(global_stats.orbits_points_on_screen / duration) + '/s';

        worker_compositor.postMessage(['compose', workerResultBuffer], [workerResultBuffer]);
    };

    for (const i in [...Array(ncore).keys()]) {
        workers[i] = new Worker("worker-producer.js");
        workers[i].onmessage = receivedDataFromWorker;
        view = fit_to_ratio(size_y/size_x, {x_min:parseFloat(inputReMin.value), x_max:parseFloat(inputReMax.value), y_min:parseFloat(inputImMin.value), y_max:parseFloat(inputImMax.value)});
        workers[i].postMessage(["worker"+i, size_y, size_x, view, 
            parseFloat(inputRedMinimumIteration.value),
            parseFloat(inputRedMaximumIteration.value),
            parseFloat(inputGreenMinimumIteration.value),
            parseFloat(inputGreenMaximumIteration.value),
            parseFloat(inputBlueMinimumIteration.value),
            parseFloat(inputBlueMaximumIteration.value),
            inputEngine.checked,
            inputAlgo.checked
            ]);
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

    if (worker_compositor != null) {
        worker_compositor.terminate();
        worker_compositor = null;
    }
}

function terminateWorkers() {
    console.log("terminating all workers");

    for (const w of workers) {
        w.terminate();
    }
}


function updateParametersAndAlgo(changeHistory = true) {
    if (Math.min(inputReMax.value - inputReMin.value, inputImMax.value - inputImMin.value) < 0.6 ) {
        inputAlgo.checked = true;
    } else {
        inputAlgo.checked = false;
    }
    updateParameters(changeHistory);
}

function updateParameters(changeHistory = true) {
    statSamples.innerText = 0;
    statOrbitsTooSmall.innerText = 0;
    statOrbitsTooBig.innerText = 0;
    statValidOrbits.innerText = 0;
    statOrbitsPoints.innerText = 0;
    statOrbitsPointsOnScreen.innerText = 0;
    statSamplesPerS.innerText = '0/s';
    statOrbitsTooSmallPerS.innerText = '0/s';
    statOrbitsTooBigPerS.innerText = '0/s';
    statValidOrbitsPerS.innerText = '0/s';
    statOrbitsPointsPerS.innerText = '0/s';
    statOrbitsPointsOnScreenPerS.innerText = '0/s';
    global_stats = {
        samples: 0,
        orbits_too_small: 0,
        orbits_too_big: 0,
        valid_orbits: 0,
        orbits_points: 0,
        orbits_points_on_screen: 0,
    };

    if (changeHistory) {
        history.pushState({}, "", `?red.min=${inputRedMinimumIteration.value}&red.max=${inputRedMaximumIteration.value}&green.min=${inputGreenMinimumIteration.value}&green.max=${inputGreenMaximumIteration.value}&blue.min=${inputBlueMinimumIteration.value}&blue.max=${inputBlueMaximumIteration.value}&re.min=${inputReMin.value}&re.max=${inputReMax.value}&im.min=${inputImMin.value}&im.max=${inputImMax.value}`);
    }

    setupCanvas();
    terminateWorkers();
    terminateCompositor();
    setupCompositor();
    if (playing) {
        setupWorkers();
    }

    time_since_play = performance.now();
    duration_pause = 0;

} 


inputRedMinimumIteration.addEventListener('input', updateParameters);
inputRedMaximumIteration.addEventListener('input', updateParameters);
inputGreenMinimumIteration.addEventListener('input', updateParameters);
inputGreenMaximumIteration.addEventListener('input', updateParameters);
inputBlueMinimumIteration.addEventListener('input', updateParameters);
inputBlueMaximumIteration.addEventListener('input', updateParameters);
inputReMin.addEventListener('input', updateParametersAndAlgo);
inputReMax.addEventListener('input', updateParametersAndAlgo);
inputImMin.addEventListener('input', updateParametersAndAlgo);
inputImMax.addEventListener('input', updateParametersAndAlgo);
inputEngine.addEventListener('change', updateParameters);
inputAlgo.addEventListener('change', updateParameters);


buttonPlayPause.addEventListener('click', function() {
    let icon = buttonPlayPause.getElementsByTagName("span")[0];
    if (playing) {
        terminateWorkers();
        time_since_pause = performance.now();
    } else {
        setupWorkers();
        duration_pause += performance.now() - time_since_pause;
    }
    playing = !playing;
    if (playing) {
        icon.innerText="pause";
    } else {
        icon.innerText="play_arrow";
    }
});

buttonReset.addEventListener('click', function() {
    history.pushState({}, "", "/");
    inputReMin.value = -1.6;
    inputReMax.value = 0.8;
    inputImMin.value = -1.2;
    inputImMax.value = 1.2;

    inputRedMinimumIteration.value =  200;
    inputRedMaximumIteration.value =  5000;
    inputGreenMinimumIteration.value =  50;
    inputGreenMaximumIteration.value =  500;
    inputBlueMinimumIteration.value =  1;
    inputBlueMaximumIteration.value =  100;
    updateParametersAndAlgo(false);
});


function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top
    };
}

let selecting = false;
let selection_first_pos = [0, 0];

canvas.addEventListener('mousedown', function(evt) {
    var mousePos = getMousePos(canvas, evt);
    selecting = true;
    selection_rect.style.display = "block";
    selection_rect.style.left = mousePos.x+"px";
    selection_rect.style.top = mousePos.y+"px";
    selection_rect.style.width = "0px";
    selection_rect.style.height = "0px";
    selection_first_pos = {x:mousePos.x, y:mousePos.y};
    selection_rect.style.cursor = "crosshair";
    canvas.style.cursor = "crosshair";

}, false);

document.addEventListener('mousemove', function(evt) {
    if (selecting) {
        var mousePos = getMousePos(canvas, evt);
        selection_rect.style.left = Math.min(mousePos.x, selection_first_pos.x)+"px";
        selection_rect.style.top = Math.min(mousePos.y, selection_first_pos.y)+"px";
        selection_rect.style.width = Math.min(Math.max(mousePos.x, selection_first_pos.x), canvas.width)-Math.min(mousePos.x, selection_first_pos.x)+"px";
        selection_rect.style.height = Math.min(Math.max(mousePos.y, selection_first_pos.y), canvas.height)-Math.min(mousePos.y, selection_first_pos.y)+"px";
    }
}, false);

document.addEventListener('mouseup', function(evt) { 
    if (selecting) {
        selection_rect.style.display = "none";
        var mousePos = getMousePos(canvas, evt);
        view = fit_to_ratio(canvas.height/canvas.width, {x_min:parseFloat(inputReMin.value), x_max:parseFloat(inputReMax.value), y_min:parseFloat(inputImMin.value), y_max:parseFloat(inputImMax.value)});

        if (mousePos.x == selection_first_pos.x && mousePos.y == selection_first_pos.y) {
            const mx = (mousePos.y / canvas.height) * (view.x_max - view.x_min) + view.x_min;
            const my = (mousePos.x / canvas.width) * (view.y_max - view.y_min) + view.y_min;
            [inputReMin.value, inputReMax.value, inputImMin.value, inputImMax.value] = {
                x_min: mx - (parseFloat(inputReMax.value) - parseFloat(inputReMin.value))/4.0,
                x_max: mx + (parseFloat(inputReMax.value) - parseFloat(inputReMin.value))/4.0,
                y_min: my - (parseFloat(inputImMax.value) - parseFloat(inputImMin.value))/4.0,
                y_max: my + (parseFloat(inputImMax.value) - parseFloat(inputImMin.value))/4.0
            }

        } else {
            const sy_min = Math.min(mousePos.x, selection_first_pos.x);
            const sy_max = Math.min(Math.max(mousePos.x, selection_first_pos.x), canvas.width);
            const sx_min = Math.min(mousePos.y, selection_first_pos.y);
            const sx_max = Math.min(Math.max(mousePos.y, selection_first_pos.y), canvas.height);

            const nx_min = (sx_min / canvas.height) * (view.x_max - view.x_min) + view.x_min;
            const nx_max = (sx_max / canvas.height) * (view.x_max - view.x_min) + view.x_min;

            const ny_min = (sy_min / canvas.width) * (view.y_max - view.y_min) + view.y_min;
            const ny_max = (sy_max / canvas.width) * (view.y_max - view.y_min) + view.y_min;
            
            inputReMin.value = nx_min.toString();
            inputReMax.value = nx_max.toString();
            inputImMin.value = ny_min.toString();
            inputImMax.value = ny_max.toString();
        }

        selecting = false;
        selection_rect.style.cursor = "zoom-in";
        canvas.style.cursor = "zoom-in";

        updateParametersAndAlgo();
    }
    
}, false);


function syncParamsFromURL() {
    const searchParams = new URLSearchParams(window.location.search);
    inputReMin.value = searchParams.get("re.min") || -1.6;
    inputReMax.value = searchParams.get("re.max") || 0.8;
    inputImMin.value = searchParams.get("im.min") || -1.2;
    inputImMax.value = searchParams.get("im.max") || 1.2;

    inputRedMinimumIteration.value = searchParams.get("red.min") || 200;
    inputRedMaximumIteration.value = searchParams.get("red.max") || 5000;
    inputGreenMinimumIteration.value = searchParams.get("green.min") || 50;
    inputGreenMaximumIteration.value = searchParams.get("green.max") || 500;
    inputBlueMinimumIteration.value = searchParams.get("blue.min") || 1;
    inputBlueMaximumIteration.value = searchParams.get("blue.max") || 100;
    updateParametersAndAlgo(false);
}

var touch_timeout;
var last_tap = 0;
canvas.addEventListener('touchend', function(event) {
    var currentTime = new Date().getTime();
    var tapLength = currentTime - last_tap;
    clearTimeout(touch_timeout);
    if (tapLength < 500 && tapLength > 0) {
        view = fit_to_ratio(canvas.height/canvas.width, {x_min:parseFloat(inputReMin.value), x_max:parseFloat(inputReMax.value), y_min:parseFloat(inputImMin.value), y_max:parseFloat(inputImMax.value)});
        let mousePos = {x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY};

        const mx = (mousePos.y / canvas.height) * (view.x_max - view.x_min) + view.x_min;
        const my = (mousePos.x / canvas.width) * (view.y_max - view.y_min) + view.y_min;
            inputReMin.value = mx - (parseFloat(inputReMax.value) - parseFloat(inputReMin.value))/4.0;
            inputReMax.value = mx + (parseFloat(inputReMax.value) - parseFloat(inputReMin.value))/4.0;
            inputImMin.value = my - (parseFloat(inputImMax.value) - parseFloat(inputImMin.value))/4.0;
            inputImMax.value = my + (parseFloat(inputImMax.value) - parseFloat(inputImMin.value))/4.0;
        updateParametersAndAlgo();


        event.preventDefault();
    } else {
        touch_timeout = setTimeout(function() {
            clearTimeout(touch_timeout);
        }, 500);
    }
    last_tap = currentTime;
});


window.onload = function() {
    if (typeof WebAssembly !== "object") {
        inputEngine.disabled = true;
        document.getElementById("webassembly").style.textDecoration= "line-through";
    } else {
        inputEngine.checked = true;
    }

    syncParamsFromURL();
    document.getElementById("nb-web-workers").innerText = ncore;

    window.onresize = function(event) {
        console.log("resize event");

        updateParameters(false);
    };


    var MDCSnackbar = window.mdc.snackbar.MDCSnackbar;
    const snackbar = new MDCSnackbar(document.querySelector('.mdc-snackbar'));
    const dataObj = 
        {
          message: !inputEngine.disabled ? "WebAssembly supported 😄" : "WebAssembly not supported, fallbacking to ASM.js",
          actionText: 'Ok',
          actionHandler: function () {},
          timeout: 5000
        };

    snackbar.show(dataObj);

}

window.onpopstate = function(event) {
    syncParamsFromURL();
};

if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js').then(function(registration) {
      // Registration was successful
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
    }, function(err) {
      // registration failed :(
      console.log('ServiceWorker registration failed: ', err);
    });
  });
}