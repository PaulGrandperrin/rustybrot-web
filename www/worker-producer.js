"use strict";

let name;
let size_x;
let size_y;
let redMinimumIteration;
let redMaximumIteration;
let greenMinimumIteration;
let greenMaximumIteration;
let blueMinimumIteration;
let blueMaximumIteration;
let view;
let algo;

var Module = {
    'wasmBinaryFile': "rustybrot.wasm",
    'asmjsCodeFile': "rustybrot.asmjs.js",
    'locateFile': myLocateFile,
    'print': function(text) { console.log(name + ' asm stdout: ' + text) },
    'printErr': function(text) { console.log(name + ' asm stderr: ' + text) },
    'onRuntimeInitialized': asmInitialized,
    'noInitialRun': true
};


function myLocateFile(url) {
	console.log('emscripten loading: ', url);
	return url;
}

function asmInitialized() {
	let pointer = Module._malloc(size_x*size_y*2*3); // allocate buffer in asm module heap
	let moduleSharedArray = new Uint16Array(Module.HEAPU16.buffer, pointer, size_x*size_y*3); // create an array from this allocated memory
	pointer = Module._malloc(6*8); // allocate buffer in asm module heap
	let statsArray = new Float64Array(Module.HEAPF64.buffer, pointer, 6); // create an array from this allocated memory

	let get_buddhabrot;
	if (algo) {
		get_buddhabrot = Module.cwrap('get_buddhabrot_metropolis_color', null, ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number']);
		console.log(name + ": asm initialized using Metropolis-Hasting MCMC");
	} else {
		get_buddhabrot = Module.cwrap('get_buddhabrot_color', null, ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number']);
		console.log(name + ": asm initialized using standard MCMC");
	}


	let num_sample = 100000;
	const duration_goal = 5000;
	const zoom = 0.005;

	while(true) {
		const t0 = performance.now();
		get_buddhabrot(moduleSharedArray.byteOffset, size_x, size_y, view.x_min, view.x_max, view.y_min, view.y_max,
			redMinimumIteration, redMaximumIteration,
			greenMinimumIteration, greenMaximumIteration,
			blueMinimumIteration, blueMaximumIteration,
			num_sample, statsArray.byteOffset);
		//get_buddhabrot(moduleSharedArray.byteOffset, size_x, size_y, -0.5, 0.4, 0.4, 0.5, 1, 1000, num_sample);
		//get_buddhabrot(moduleSharedArray.byteOffset, size_x, size_y, -0.043-zoom, -0.043+zoom, -0.986-zoom, -0.986+zoom, 1, 1000000, num_sample);

		const t1 = performance.now();
		const duration = t1 - t0;
		console.log("gen_buddhabrot with " + num_sample + " samples took " + duration + "ms");
		console.log("perf: " + (num_sample * 1000 / duration) + " sample/s");
		num_sample = num_sample * duration_goal / duration;
		console.log("adjuting num_sample to " + num_sample);

		let stats = {
			samples: statsArray[0],
        	orbits_too_small: statsArray[1],
        	orbits_too_big: statsArray[2],
        	valid_orbits: statsArray[3],
        	orbits_points: statsArray[4],
        	orbits_points_on_screen:statsArray[5],
		};

		const workerResultBuffer = new ArrayBuffer(size_x*size_y*2*3);
		const workerResult = new Uint16Array(workerResultBuffer);
		for (let i = 0; i < moduleSharedArray.length; i++) {
			workerResult[i] = moduleSharedArray[i];
		}

		postMessage([name, workerResultBuffer, stats], [workerResultBuffer]);
	}

	Module._free(moduleSharedArray.byteOffset);
}

onmessage = function(event) {
	let wasm;
	[name, size_x, size_y, view,
			redMinimumIteration, redMaximumIteration,
			greenMinimumIteration, greenMaximumIteration,
			blueMinimumIteration, blueMaximumIteration, wasm, algo] = event.data;

	console.log(name + ": size=" + size_x + "x" + size_y + ", view=" + view);

	if (wasm) {
        importScripts('rustybrot.wasm.js');
	} else {
		importScripts('rustybrot.asmjs.js');
	}
	
}
