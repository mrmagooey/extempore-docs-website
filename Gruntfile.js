
module.exports = function(grunt) {
    
    require('load-grunt-tasks')(grunt); 

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            build: {
                src: [
                    "bower_components/lodash/lodash.min.js",
                    "bower_components/react/react.js",
                    'bower_components/modernizr/modernizr.js'
                ],
                dest: 'js/third-party.js'
            }
        },
        
        babel: {
            options: {
                sourceMap: false
            },
            dist: {
                files: {
                    'js/main.js': 'src/jsx/main.jsx'
                }
            }
        },
        
        cssmin: {
            target: {
                files: {
                    'css/main.css': [
                        'bower_components/bootstrap/dist/css/bootstrap.min.css',
                        'src/css/*',
                        'src/less/*',
                    ],
                },
            }
        },
        
        watch: {
            jsx: {
                files: ['src/jsx/*.jsx'],
                tasks: ['babel'],
            },
            css: {
                files: ['bower_components/bootstrap/dist/css/bootstrap.min.css',
                        'src/css/*',
                        'src/less/*'],
                tasks: ['cssmin'],
            }
        },
        
    });


    
    grunt.registerTask('default', ['babel', 
                                   'cssmin',
                                   'uglify']);

};
