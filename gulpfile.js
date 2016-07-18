var gulp = require('gulp');
var gutil = require("gulp-util");
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var ugly = require("gulp-uglify");
var uglycss = require("gulp-uglifycss");
var order = require("gulp-order");
// var gzip = require("gulp-gzip");

//set up directories for css and js files
var config = {
    "css": "./src/client/styles/**/*.css",
    "js" :"./src/client/js/**/*.js",
    "lib": "./src/client/lib/*.js"
};

// Check for '--min' flag (true if present)

var useMinifiedSources = gutil.env.min;

// in the terminal type gulp test

// first param is name, second is the
// function called when you call gulp
// with the name

//gulp task to optimize other third party js libs hosted locally
gulp.task('lib-optimize', function(){
  console.log('gulp is working: concatenating lib files');

  gulp.src([

    "./src/client/lib/jquery1.11.3.js",
    "./src/client/lib/TOC.js",
    "./src/client/lib/bootstrap.js"

  ])

  .pipe(order([
     'jquery1.11.3.js',
     'TOC.js',
     'bootstrap.js',

   ], {base: './src/client/lib/'})
    )
  //concatenate js files and name new file "lib-main.js"
  .pipe(concat("lib.js"))
  //path to build
  .pipe(gulp.dest('./src/client/dist/'))
  //create a copy of main.js called "main.min.js" for minification
  .pipe(rename("lib.min.js"))
  //uglify min file
  .pipe(ugly())

  .pipe(gulp.dest('./src/client/dist/'));

  console.log('gulp is done');
});

//create javascript optimization task
gulp.task('js-optimize', function(){
  // config.js
  console.log('gulp is working: concatenating and minifying js files');

  // explicitly define js files to run gulp task on, this prevents concatenating uncessesary
  // js files
   gulp.src([
       './src/client/js/identify.js',
       './src/client/js/bookmarks.js',
       './src/client/js/swipe.js',
       './src/client/js/draw.js',
       './src/client/js/import.js',
       './src/client/js/print-widget.js',
       './src/client/js/recover.js'

   ])
   //define concatenation order of js files, recover.js must be first!
  .pipe(order([
     'recover.js',
     'identify.js',
     'bookmarks.js',
     'swipe.js',
     'draw.js',
     'import.js',
     'print-widget.js'

   ], {base: './src/client/js/'})
    )
    //concatenate js files and name new file "main.js"
  .pipe(concat("main.js"))
  //path to build
  .pipe(gulp.dest('./src/client/dist/'))
  //create a copy of main.js called "main.min.js" for minification
  .pipe(rename("main.min.js"))
  //uglify min file
  .pipe(ugly())
  //gzip main.min.js
  // .pipe(gzip({
  //   append: true,
  //
  // }))
  .pipe(gulp.dest('./src/client/dist'));

  console.log('gulp is done');
});

//create css optimization task
gulp.task('css-optimize', function(){
  // config.js
  console.log('gulp is working: concatenating and minifying css files');

  gulp.src(config.css)
  //concat files and return as main.js
  .pipe(concat("styles.css"))
  //path to build
  .pipe(gulp.dest('./src/client/dist/'))
  .pipe(rename("styles.min.css"))
  .pipe(uglycss({
    "maxLineLen": 80,
    "uglyComments": true
  }))
  .pipe(gulp.dest('./src/client/dist/'));

  console.log('gulp is done');
});

//set watch on css directory, run css-optimize every time a CSS file changes
gulp.task('watch:css', function(){
  gulp.watch(config.css, ['css-optimize']);
});

//set watch on css directory, run js-optimize every time a JS file changes
gulp.task('watch:js', function(){
  gulp.watch(config.js, ['js-optimize']);
});

//create the default task
gulp.task('default', ['css-optimize','js-optimize','watch:css','watch:js']);
