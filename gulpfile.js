const fs = require('fs');
const gulp = require('gulp');
const del = require('del');
const zip = require('gulp-zip');
const path = require('path');
const merge = require('merge-stream');

var packages = 'src/packages/';

function getFolders(dir) {
    return fs.readdirSync(dir)
    .filter(function(file) {
        return fs.statSync(path.join(dir, file)).isDirectory();
    });
}

gulp.task('default', function() {
    
});

gulp.task('clean', function(cb) {
    return del(['build'], cb);
});

gulp.task('prepare', ['clean'], function() {
    var packagesFolders = getFolders(packages);

    var tasks = packagesFolders.map(function(folder) {
        return gulp.src([path.join(packages, folder, '/**/*')], {base: packages})
            .pipe(zip(folder + ".zip"))
            .pipe(gulp.dest('build/packages/'));
    });

    var xml = gulp.src(['src/*.xml'], {base:'src/'})
        .pipe(gulp.dest('build/'));

    return merge(tasks, xml);
});

gulp.task('preBuild', ['prepare'],  function() {
    return gulp.src(['build/**/*'], {base:"build/"})
        .pipe(zip(path.basename(__dirname) + ".zip"))
        .pipe(gulp.dest('build/'));
});

gulp.task('build', ['preBuild'], function() {
    return del(['build/**/*', '!build/' + path.basename(__dirname) + ".zip"]);
})
