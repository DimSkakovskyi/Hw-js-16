import { src, dest, task, watch, series, parallel } from 'gulp'
import gulpSass from 'gulp-sass'
import sass from 'sass'
import browserSync from 'browser-sync'
import cssnano from 'cssnano'
import rename from 'gulp-rename'
import postcss from 'gulp-postcss'
import csscomb from 'gulp-csscomb'
import autoprefixer from 'autoprefixer'
import mqpacker from 'css-mqpacker'
import { deleteAsync } from 'del'

const sassCompiler = gulpSass(sass)
const browserSyncInstance = browserSync.create()

const { default: sortCSSmq } = await import('sort-css-media-queries')

const PATH = {
  scssFolder: './src/scss',
  scssRoot: './src/scss/style.scss',
  scssAllFiles: './src/scss/**/*.scss',
  cssFolder: './assets/css',
  htmlAllFiles: ['./**/*.html', '!./node_modules/**/*.*', '!./dist/**/*.*'],
  jsAllFiles: './src/js/**/*.js',
  buildFolder: './dist'
}

const PLUGINS = [autoprefixer({ overrideBrowserslist: ['last 5 versions', '> 1%'] }), mqpacker({ sort: sortCSSmq })]

function scssBase() {
  return src(PATH.scssRoot)
    .pipe(sassCompiler().on('error', sassCompiler.logError))
    .pipe(postcss(PLUGINS))
    .pipe(dest(PATH.cssFolder))
    .pipe(browserSyncInstance.stream())
}

function scssDev() {
  const pluginsForDevMode = [...PLUGINS]
  pluginsForDevMode.slice(0, 1)
  return src(PATH.scssRoot, { sourcemaps: true })
    .pipe(sassCompiler().on('error', sassCompiler.logError))
    .pipe(postcss(pluginsForDevMode))
    .pipe(dest(PATH.cssFolder, { sourcemaps: true }))
    .pipe(browserSyncInstance.stream())
}

function scssMin() {
  const pluginsForMinified = [...PLUGINS, cssnano()]
  return src(PATH.scssRoot)
    .pipe(sassCompiler().on('error', sassCompiler.logError))
    .pipe(postcss(pluginsForMinified))
    .pipe(rename({ suffix: '.min' }))
    .pipe(dest(PATH.cssFolder))
    .pipe(browserSyncInstance.stream())
}

function scssComb() {
  return src(PATH.scssAllFiles).pipe(csscomb()).pipe(dest(PATH.scssFolder))
}

function syncInit() {
  browserSyncInstance.init({
    server: {
      baseDir: './'
    }
  })
}

async function reload() {
  browserSyncInstance.reload()
}

function watchTask() {
  syncInit()
  watch(PATH.scssAllFiles, series(scssBase, scssMin))
  watch(PATH.htmlAllFiles, reload)
}

function bulidHTML() {
  return src(PATH.htmlAllFiles).pipe(dest(PATH.buildFolder + '/templates'))
}

function buildJS() {
  return src(PATH.jsAllFiles).pipe(dest(PATH.buildFolder + '/js'))
}

function buildCSS() {
  return src(PATH.cssFolder + '/*.css').pipe(dest(PATH.buildFolder + '/css'))
}

async function cleanFolder() {
  return await deleteAsync([PATH.buildFolder])
}

task('watch', watchTask)
task('scss', series(scssBase, scssMin))
task('comb', scssComb)
task('dev', scssDev)
task('build', series(cleanFolder, parallel(bulidHTML, buildJS, buildCSS)))

export const scss = series(scssBase, scssMin)
export const dev = series(scssDev, watchTask)
export const comb = scssComb

export default watchTask
