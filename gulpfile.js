var gulp = require('gulp');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var ugly = require("gulp-uglify");
var uglycss = require("gulp-uglifycss");
var order = require("gulp-order");


var config = {
    "css": "./src/client/styles/**/*.css",
    "js" :"./src/client/js/**/*.js"
};

// in the terminal type gulp test

// first param is name, second is the
// function called when you call gulp
// with the name
gulp.task('js-optimize', function(){
    // config.js
    console.log('gulp is working: concatenating and minifying js files');
    //gulp.src(config.js)
    //concat files and return as main.js
     gulp.src([
         './src/client/js/identify.js',
         './src/client/js/bookmarks.js',
         './src/client/js/swipe.js',
         './src/client/js/draw.js',
         './src/client/js/import.js',
         './src/client/js/print-widget.js',
         './src/client/js/recover.js'

     ])
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
    .pipe(concat("main.js"))
    //path to build
    .pipe(gulp.dest('./src/client/dist/'))
    .pipe(rename("main.min.js"))
    .pipe(ugly())
    .pipe(gulp.dest('./src/client/dist'));

    console.log('gulp is done');
});

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
