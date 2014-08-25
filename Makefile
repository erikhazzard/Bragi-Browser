all: build-bragi minify-bragi

build-bragi:
	@./node_modules/browserify/bin/cmd.js -t brfs lib/bragi.js -o dist/bragi.js

minify-bragi:
	@./node_modules/uglify-js/bin/uglifyjs dist/bragi.js -o dist/bragi.min.js
