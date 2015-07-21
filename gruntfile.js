module.exports = function(grunt) {

    // measures the time each task takes
    require('time-grunt')(grunt);

    // load time-grunt and all grunt plugins found in the package.json
    require('jit-grunt')(grunt);

    // grunt config
    grunt.initConfig({


        // Compile sass files
        sass: {
            options: {
                outputStyle: 'compressed'
            },
            dist: {
                files: {
                    'css/styles.css': 'scss/styles.scss'
                }
            }
        },


        // Browser Sync
        browserSync: {
            dev: {
                bsFiles: {
                    src : [
                        "css/*.*",
                        "js/*.*",
                        "index.html"
                    ]
                },
                options: {
                    port: 1234,
                    open: true,
                    notify: false,
                    watchTask: true,
                    injectChanges: false,
                    server: {
                        baseDir: './'
                    }
                }
            }
        },


        // Uglify
        uglify: {
            options: {
                soureMap: true
            },
            build: {
                files: {
                    'js/off-canvas-menu.min.js': [
                        'scripts/off-canvas-menu.js'
                    ]
                }
            }
        },


        // Autoprefixer
        autoprefixer: {
            options: {
                browsers: ['> 5%', 'last 2 versions', 'ie 11', 'ie 10', 'ie 9']
            },
            files: {
                expand: true,
                flatten: true,
                src: 'css/*.css',
                dest: 'css/'
            }
        },


        // Shell commands
        shell: {
            updateCanIUse: {
                command: 'npm update caniuse-db'
            },
            bower: {
                command: 'bower update && bower install'
            }
        },


        // Watch files
        watch: {
            sass: {
                files: [
                    'scss/*.scss'
                ],
                tasks: ['sass', 'autoprefixer'],
                options: {
                    interrupt: true,
                    atBegin: true
                }
            },
            uglify: {
                files: [
                    'scripts/*.js'
                ],
                tasks: ['uglify'],
                options: {
                    interrupt: true,
                    atBegin: false
                }
            }
        }


    });

    // The dev task will be used during development
    grunt.registerTask('default', ['shell', 'browserSync', 'watch']);

};