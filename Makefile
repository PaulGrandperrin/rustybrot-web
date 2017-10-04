SHELL := /bin/bash

www/material-components-web.min.css:
	wget https://unpkg.com/material-components-web@latest/dist/material-components-web.min.css -O www/material-components-web.min.css

www/material-components-web.min.js:
	wget https://unpkg.com/material-components-web@latest/dist/material-components-web.min.js -O www/material-components-web.min.js

debug:
	cargo build --target=wasm32-unknown-emscripten
	cargo build --target=asmjs-unknown-emscripten
	mkdir -p www
	find target/wasm32-unknown-emscripten/debug/deps -type f -name "*.wasm" | xargs -I {} cp {} www/rustybrot.wasm
	find target/wasm32-unknown-emscripten/debug/deps -type f -name "*.js" | xargs -I {} cp {} www/rustybrot.wasm.js
	find target/asmjs-unknown-emscripten/debug/deps -type f -name "*.js" | xargs -I {} cp {} www/rustybrot.asmjs.js

release:
	cargo build --target=wasm32-unknown-emscripten --release
	cargo build --target=asmjs-unknown-emscripten --release
	mkdir -p www
	find target/wasm32-unknown-emscripten/release/deps -type f -name "*.wasm" | xargs -I {} cp {} www/rustybrot.wasm
	find target/wasm32-unknown-emscripten/release/deps -type f -name "*.js" | xargs -I {} cp {} www/rustybrot.wasm.js
	find target/asmjs-unknown-emscripten/release/deps -type f -name "*.js" | xargs -I {} cp {} www/rustybrot.asmjs.js

run-debug: debug www/material-components-web.min.css www/material-components-web.min.js
	cd www && python -m SimpleHTTPServer 8000 

run-release: release www/material-components-web.min.css www/material-components-web.min.js
	cd www && python -m SimpleHTTPServer 8000 

clean:
	cargo clean
	rm -f www/rustybrot.wasm www/rustybrot.wasm.js www/rustybrot.asmjs.js
	rm -f www/material-components-web.min.css www/material-components-web.min.js
