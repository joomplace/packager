const fs = require('fs');
const gulp = require('gulp-param')(require('gulp'), process.argv);
const del = require('del');
const zip = require('gulp-zip');
const path = require('path');
const merge = require('merge-stream');
const xml2js = require('xml2js');
const runSequence = require('run-sequence');
const prompt = require('gulp-prompt');

var xmls = [];
var packages = '';
var pack = '';
var i = 0;

function getFolders(dir) {
    return fs.readdirSync(dir)
    .filter(function(file) {
        return fs.statSync(path.join(dir, file)).isDirectory();
    });
}

function getXmls(dir) {
    return fs.readdirSync(dir)
    .filter(function(file) {
        return file.match(/.*\.xml/);
    });
}

function getPackagesListFromXml(xml_object){
	var fileslist = [];
	xml2js.parseString(xml_object, function (err, result) {
		fileslist = xml_object.extension.files[0].file.map(function(file){return file._.replace('.zip','');});
	});
	return fileslist;
}

function getXml(file){
	var xml_file = fs.readFileSync(file);
	xml2js.parseString(xml_file, function (err, result) {
		xml_file = JSON.parse(JSON.stringify(result));
	});
	return xml_file;
}

function getProjects() {
    return fs.readdirSync('../')
    .filter(function(file) {
        return fs.statSync(path.join('../', file)).isDirectory();
    });
}

gulp.task('default', function() {
    gulp.src('')
    .pipe(prompt.prompt({
        type: 'list',
        name: 'fold',
        message: 'Project to build:',
        choices: getProjects()
    }, function(res){
        build(res.fold);
    }));
});

gulp.task('clean', function(cb) {
    return del(['build/'+pack,'build/'+pack+'.zip'], cb);
});

gulp.task('prepare', function() {
	var xml_object = getXml(packages+'/' + pack + '.xml');
    var packagesFolders = getPackagesListFromXml(xml_object);

    var tasks = packagesFolders.map(function(folder) {
        return gulp.src([path.join(packages, folder, '/**/*')], {base: packages})
            .pipe(zip(folder + ".zip"))
            .pipe(gulp.dest('build/'+pack+'/packages/'));
    });

    var xml = gulp.src([packages+'/'+pack+'.xml'], {base:packages})
        .pipe(gulp.dest('build/'+pack));

    return merge(tasks, xml);
});

gulp.task('preBuild', ['prepare'],  function() {
    return gulp.src(['build/'+pack+'/**/*'], {base:"build/"+pack})
        .pipe(zip( pack + ".zip"))
        .pipe(gulp.dest('build/'));
});

gulp.task('buildup', ['preBuild'], function() {
    return del(['build/'+pack]);
})

function processPack(){
	pack = xmls[i];
	i++;
	runSequence(
	'buildup',
	function (error) {
		console.log(pack+' done');
		if(xmls.length > i){
			processPack();
		}
	});
}

function build(fold) {
    packages = '../'+fold;
	xmls = getXmls(packages);
	xmls = xmls.map(function(xml_file){return xml_file.split('.')[0]; });
	processPack();
}

gulp.task('build', function(fold) {
    build(fold);
})
