"use strict";

let cumulatedResult = null;
let size_x;
let size_y;

function compose(workerResultBuffer) {
    console.log("compositor recieved data to compose");
    
    const workerResult = new Uint16Array(workerResultBuffer);

    let min = Number.MAX_SAFE_INTEGER;
    let max = 0;
    for (let i = 0; i < workerResult.length; i++) {
        const n = cumulatedResult[i] + workerResult[i];
        cumulatedResult[i] = n;
        if (n > max) {max = n}
        if (n < min) {min = n}
    }
    max = Math.sqrt(max);
    min = Math.sqrt(min);
    const dyn_range = max - min; 
    const nmax = max - dyn_range * 0.4;
    const nmin = min + dyn_range * 0.01;
    const ndyn_range = nmax - nmin;

    //max = Math.sqrt(max);
    console.log("max value: " + max)


    function intensity2rainbow(intensity, max) {
        const norm = Math.min(1, intensity * 3 / max) * 2 * Math.PI;
        const red = (Math.sin(norm)+1)/2*256;
        const green = (Math.sin(norm+2*Math.PI/3)+1)/2*256;
        const blue = (Math.sin(norm+4*Math.PI/3)+1)/2*256;
        return [red, green, blue]
    }

    function intensityRegularization(intensity, max) {
        // compress
        intensity = Math.sqrt(intensity);

        // saturate
        intensity = Math.max(Math.min(intensity, nmax), nmin);

        // calibrate
        intensity = intensity - nmin;

        // scale
        intensity = intensity / ndyn_range;

        // smoothstep
        //intensity = intensity*intensity*(3-intensity*2);

        // smootherstep
        intensity = intensity*intensity*intensity*(intensity*(intensity*6-15)+10);


        return intensity*256;
    }

    const compositorResultBuffer = new ArrayBuffer(size_x*size_y*4);
    const compositorResult = new Uint8ClampedArray(compositorResultBuffer);
    for (let y = 0; y < size_y; y++) {
        for(let x = 0; x < size_x; x++) {
            compositorResult[(y*size_x+x)*4+0] = intensityRegularization(cumulatedResult[(x*size_y+y)*3+0]); // red
            compositorResult[(y*size_x+x)*4+1] = intensityRegularization(cumulatedResult[(x*size_y+y)*3+1]); // green
            compositorResult[(y*size_x+x)*4+2] = intensityRegularization(cumulatedResult[(x*size_y+y)*3+2]); // blue
            compositorResult[(y*size_x+x)*4+3] = 255;      // alpha
        }
    }
    postMessage([compositorResultBuffer, max], [compositorResultBuffer]);

}

function init(s_x, s_y) {
    size_x = s_x;
    size_y = s_y;
	console.log("initializing compositor with values: "+size_x+"x"+size_y);
	cumulatedResult = new Uint16Array(size_x*size_y*3);
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