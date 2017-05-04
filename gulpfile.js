const gulp = require('gulp');
const babel = require('gulp-babel');
const stylus = require('gulp-stylus');

gulp.task('default', () => {
    gulp.src('app/**/*.js')
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(gulp.dest('dist'));

    gulp.src('app/styles/**/*.styl')
        .pipe(stylus())
        .pipe(gulp.dest('dist/styles'));
});

gulp.task('watch',['default'], () => {
    gulp.watch('app/**/*', ['default']);
});

