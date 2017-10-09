"use strict";

let cumulatedResult = null;
let compositedResult = null;
let size_x;
let size_y;
let rust_compose;

var Module = {
    'wasmBinaryFile': "rustybrot.wasm",
    'asmjsCodeFile': "rustybrot.asmjs.js",
    'print': function(text) { console.log('conpositor asm stdout: ' + text) },
    'printErr': function(text) { console.log('conpositor asm stderr: ' + text) },
    'onRuntimeInitialized': asmInitialized,
    'noInitialRun': true
};

function asmInitialized() {
    console.log("compositor asm initialized");
    let pointer = Module._malloc(size_x*size_y*2*3);
    cumulatedResult = new Uint16Array(Module.HEAPU16.buffer, pointer, size_x*size_y*3);
    cumulatedResult.fill(0);

    pointer = Module._malloc(size_x*size_y*4);
    compositedResult = new Uint8Array(Module.HEAPU16.buffer, pointer, size_x*size_y*4);


    rust_compose = Module.cwrap('get_compose', null, ['number', 'number', 'number']);


}

function compose(workerResultBuffer) {
    console.log("compositor received data to compose");
    const workerResult = new Uint16Array(workerResultBuffer);
    for (let i = 0; i < workerResult.length; i++) {
        cumulatedResult[i] += workerResult[i];
    }

    rust_compose(workerResult.length/3, cumulatedResult.byteOffset, compositedResult.byteOffset);

    const finalResultBuffer = new ArrayBuffer(size_x*size_y*4);
        const finalResult = new Uint8Array(finalResultBuffer);
        for (let i = 0; i < compositedResult.length; i++) {
            finalResult[i] = compositedResult[i];
        }

    postMessage([finalResultBuffer], [finalResultBuffer]);

    //dataHeap.set(new Uint8Array(data.buffer));
}

function init(s_x, s_y) {
    size_x = s_x;
    size_y = s_y;
    console.log("initializing compositor with values: "+size_x+"x"+size_y);
    if (typeof WebAssembly === "object") {
        importScripts('rustybrot.wasm.js');
    } else {
        importScripts('rustybrot.asmjs.js');
    }

}


onmessage = function(event) {
    const [action, ...args] = event.data;
    switch (action) {
        case 'init':
            init.apply(null,args);
            break;
        case 'compose':
            compose.apply(null,args);
            break;
    }
}