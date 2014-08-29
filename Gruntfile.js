module.exports = function(grunt) {

	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		concat: {
	      options: {
	        separator: ';',
	        sourceMap: false
	      },
	      dist: {
	        src: ['src/public/js/ender.min.js', 'src/public/js/mulletrun.js'],
	        dest: 'src/public/js/dist/mulletrun.js'
	      },
	      dev: {
	      	src: ['src/public/js/ender.min.js', 'src/public/js/mulletrun.js'],
	        dest: 'public/js/mulletrun.js'
	      }
	    },
		uglify: {
			options: {
				banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
			},
			build: {
				src: ['src/public/js/dist/mulletrun.js'],
				dest: 'public/js/mulletrun.js'
			}
		},
		ender: {
			options: {
				output: "src/public/js/ender.js",
				dependencies: ['lodash', 'jeesh', 'backbone']
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-ender');
	// Default task(s).
	//grunt.registerTask('default', ['uglify']);
	grunt.registerTask('build', ['enderman', 'concat', 'uglify']);
	grunt.registerTask('default', ['concat:dev']);
	grunt.registerTask('enderman', ['ender']);

};