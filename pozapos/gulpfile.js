var gulp = require('gulp');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var nanofy = require('gulp-cssnano');
var angufy = require('gulp-ng-annotate');
var rimraf = require('gulp-rimraf');

gulp.task('scripts', function () {
    gulp.src(['www/lib/ionic/**/*.js', 'www/lib/sprintf/*.js', 'www/lib/qz/*.js', 'www/js/*.js', 'www/lib/soap/**/*.js'])
            .pipe(angufy())
            .pipe(concat('app.min.js'))
            .pipe(uglify())
            .pipe(gulp.dest('dist/lib/build/'))
});

gulp.task('styles', function () {
    gulp.src(['www/lib/**/*.css', 'www/css/*.css'])
            .pipe(concat('app.min.css'))
            .pipe(gulp.dest('dist/lib/build/'))
            .pipe(nanofy())
            .pipe(gulp.dest('dist/lib/build/'))
});

gulp.task('clear', function () {
    gulp.src('dist/template/', {read: false}) // much faster 
            .pipe(rimraf());
});

gulp.task('copies', function () {
    gulp.src(['www/lib/ionic/fonts/**','www/lib/glyphicons/fonts/**'])
            .pipe(gulp.dest('dist/lib/fonts'));
    gulp.src('www/img/**')
            .pipe(gulp.dest('dist/img/'));
    gulp.src('www/template/**')
            .pipe(gulp.dest('dist/template/'));
});

gulp.task('default', [
    'scripts',
    'styles',
    'copies'
]);

