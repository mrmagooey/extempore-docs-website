# Extempore Docs Website

## Introduction

This is the documentation website for the extempore programming system.

This documentation is only as up to date as the xtmdoc.json file that is included in this repository.

## Development

### Dependencies

Unless you are developing this package further you don't need the dependencies, the repository keeps the website in a working state.

Install npm dependencies with:

    npm install
    
You need the following npm packages globally installed, (i.e. installed with -g flag):

    bower
    grunt-cli
    live-server

Install bower dependencies with:

    bower install

### Grunt

The default grunt task will generate the necessary js and css files from source.

The `watch` task will do this as files change, but not for third party libraries. 

### Updating xtmdoc.json

Start an extempore session and run:

    (xtmdoc-export-caches-to-json "/whatever/directory/you/want/xtmdoc.json")

This will generate a new `xtmdoc.json` file. Without preceeding directory it will generate in the extempore install directory.
