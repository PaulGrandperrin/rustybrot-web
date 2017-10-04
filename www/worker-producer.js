"use strict";

var name;
var size_x;
var size_y;

var Module = {
    'wasmBinaryFile': "rustybrot.wasm",
    'print': function(text) { console.log(name + ' asm stdout: ' + text) },
    'printErr': function(text) { console.log(name + ' asm stderr: ' + text) },
    'onRuntimeInitialized': asmInitialized,
    'noInitialRun': true
};

function asmInitialized() {
	console.log(name + ": asm initialized");
	var pointer = Module._malloc(size_x*size_y*4); // allocate buffer in asm module heap
	var moduleSharedArray = new Uint32Array(Module.HEAPU32.buffer, pointer, size_x*size_y); // create an array from this allocated memory

	let get_buddhabrot = Module.cwrap('get_buddhabrot', 'number', ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number']);
	
	let num_sample = 1000;
	const duration_goal = 4000;
	const zoom = 0.005;

	while(true) {
		const t0 = performance.now();
		get_buddhabrot(moduleSharedArray.byteOffset, size_x, size_y, -1.6, 0.8, -1.2, 1.2, 1, 1000000, num_sample);
		//get_buddhabrot(moduleSharedArray.byteOffset, size_x, size_y, -0.5, 0.4, 0.4, 0.5, 1, 1000, num_sample);
		//get_buddhabrot(moduleSharedArray.byteOffset, size_x, size_y, -0.043-zoom, -0.043+zoom, -0.986-zoom, -0.986+zoom, 1, 1000000, num_sample);

		const t1 = performance.now();
		const duration = t1 - t0;
		console.log("gen_buddhabrot with " + num_sample + " samples took " + duration + "ms");
		console.log("perf: " + (num_sample * 1000 / duration) + " sample/s");
		num_sample = num_sample * duration_goal / duration;
		console.log("adjuting num_sample to " + num_sample);


		const workerResultBuffer = new ArrayBuffer(size_x*size_y*4);
		const workerResult = new Uint32Array(workerResultBuffer);
		for (let i = 0; i < moduleSharedArray.length; i++) {
			workerResult[i] = moduleSharedArray[i];
		}

		postMessage([name, workerResultBuffer], [workerResultBuffer]);
	}

	Module._free(moduleSharedArray.byteOffset);
}

onmessage = function(event) {
	name = event.data[0];
	size_x = event.data[1];
	size_y = event.data[2];
	console.log(name + ": size=" + size_x + "x" + size_y);

	importScripts('rustybrot.wasm.js');
}
