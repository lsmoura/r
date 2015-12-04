#!/bin/bash

# Delete old version
rm -Rf public/*
mkdir -p public/{css,fonts,js,img}

# R source-code
cp -a src/* public/

# Dependencies
## Dust
cp -a submodules/dust/dist/dust-full.min.js public/js/

## Bootstrap
cp -a submodules/bootstrap/dist/css/bootstrap-theme.min.css public/css/
cp -a submodules/bootstrap/dist/css/bootstrap.min.css public/css/
cp -a submodules/bootstrap/dist/js/bootstrap.min.js public/js/
cp -a submodules/bootstrap/dist/js/npm.js public/js/
cp -a submodules/bootstrap/dist/fonts/* public/fonts/
