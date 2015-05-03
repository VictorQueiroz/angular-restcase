var pkg = require('./package.json');
var gulp = require('gulp');
var uglify = require('gulp-uglify');
var header = require('gulp-header');
var concat = require('gulp-concat');
var wrapper = require('gulp-wrapper');
var ngAnnotate = require('gulp-ng-annotate');

var paths = {
  scripts: ['src/**/*.js']
};

var banner = ['/**',
' * <%= pkg.name %> - <%= pkg.description %>',
' * @version v<%= pkg.version %>',
' * @link <%= pkg.homepage %>',
' * @license <%= pkg.license %>',
' */',
''].join('\n');

gulp.task('build', function () {
  var h = `(function () {
  if (typeof module !== "undefined" &&
    typeof exports !== "undefined" &&
    module.exports === exports) {
    module.exports = 'victorqueiroz.ngRestcase';
  };
})();

(function (angular) {\n`;

  var footer = '\n})(angular);';

  gulp.src(paths.scripts)
    .pipe(ngAnnotate())
    .pipe(concat('angular-restcase.js'))
    .pipe(wrapper({
      header: h,
      footer: footer
    }))
    .pipe(header(banner, { pkg: pkg }))
    .pipe(gulp.dest('dist'));

  gulp.src(paths.scripts)
    .pipe(ngAnnotate())
    .pipe(concat('angular-restcase.min.js'))
    .pipe(wrapper({
      header: h,
      footer: footer
    }))
    .pipe(uglify())
    .pipe(header(banner, { pkg: pkg }))
    .pipe(gulp.dest('dist'));
});
