"use strict";

let name;
let size_x;
let size_y;
let minimumIteration;
let maximumIteration;
let view;

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

	let get_buddhabrot;
	
	if (view.x_min < -1.0 && view.x_max > 0.5 && view.y_min < -0.5 && view.y_max > 0.5) {
		get_buddhabrot = Module.cwrap('get_buddhabrot_color', 'number', ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number']);
		console.log(name + ": asm initialized using standard MCMC");
	} else {
		get_buddhabrot = Module.cwrap('get_buddhabrot_metropolis_color', 'number', ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number']);
		console.log(name + ": asm initialized using Metropolis-Hasting MCMC");
	}
	
	

	let num_sample = 10000;
	const duration_goal = 5000;
	const zoom = 0.005;

	while(true) {
		const t0 = performance.now();
		get_buddhabrot(moduleSharedArray.byteOffset, size_x, size_y, view.x_min, view.x_max, view.y_min, view.y_max, minimumIteration, maximumIteration, minimumIteration/10, maximumIteration/10, minimumIteration/100, maximumIteration/100, num_sample);
		//get_buddhabrot(moduleSharedArray.byteOffset, size_x, size_y, -0.5, 0.4, 0.4, 0.5, 1, 1000, num_sample);
		//get_buddhabrot(moduleSharedArray.byteOffset, size_x, size_y, -0.043-zoom, -0.043+zoom, -0.986-zoom, -0.986+zoom, 1, 1000000, num_sample);

		const t1 = performance.now();
		const duration = t1 - t0;
		console.log("gen_buddhabrot with " + num_sample + " samples took " + duration + "ms");
		console.log("perf: " + (num_sample * 1000 / duration) + " sample/s");
		num_sample = num_sample * duration_goal / duration;
		console.log("adjuting num_sample to " + num_sample);


		const workerResultBuffer = new ArrayBuffer(size_x*size_y*2*3);
		const workerResult = new Uint16Array(workerResultBuffer);
		for (let i = 0; i < moduleSharedArray.length; i++) {
			workerResult[i] = moduleSharedArray[i];
		}

		postMessage([name, workerResultBuffer], [workerResultBuffer]);
	}

	Module._free(moduleSharedArray.byteOffset);
}

onmessage = function(event) {
	[name, size_x, size_y, view, minimumIteration, maximumIteration] = event.data;

	console.log(name + ": size=" + size_x + "x" + size_y + ", min_iter=" + minimumIteration + ", max_iter=" + maximumIteration + ", view=" + view);

	if (typeof WebAssembly === "object") {
        importScripts('rustybrot.wasm.js');
	} else {
		importScripts('rustybrot.asmjs.js');
	}
	
}
