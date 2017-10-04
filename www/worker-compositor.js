"use strict";

let cumulatedResult = null;
let size_x;
let size_y;

function compose(workerResultBuffer) {
    console.log("compositor recieved data to compose");
    
    const workerResult = new Uint32Array(workerResultBuffer);

    let max = 0;
    for (let i = 0; i < workerResult.length; i++) {
      const n = cumulatedResult[i] + workerResult[i];
      cumulatedResult[i] = n;
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

    const compositorResultBuffer = new ArrayBuffer(size_x*size_y*4);
    const compositorResult = new Uint8ClampedArray(compositorResultBuffer);
    for (let y = 0; y < size_y; y++) {
        for(let x = 0; x < size_x; x++) {
            const color = intensity2greyscale(cumulatedResult[x*size_y+y], max);
            compositorResult[(y*size_x+x)*4+0] = color[0]; // red
            compositorResult[(y*size_x+x)*4+1] = color[1]; // green
            compositorResult[(y*size_x+x)*4+2] = color[2]; // blue
            compositorResult[(y*size_x+x)*4+3] = 255;      // alpha
        }
    }
    postMessage([compositorResultBuffer, max], [compositorResultBuffer]);

}

function init(s_x, s_y) {
    size_x = s_x;
    size_y = s_y;
	console.log("iniializing compositor with values: "+size_x+"x"+size_y);
	cumulatedResult = new Uint32Array(size_x*size_y);
    cumulatedResult.fill(0);
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