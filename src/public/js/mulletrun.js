var _ 		= require("lodash");

io = io.connect();

io.on('timer_start', function (data) {
	console.log("timer_start!");
	mulletrun.timer.start();
});

io.on('timer_pause', function (data) {
	console.log("timer_pause!");
	mulletrun.timer.pause();
});

io.on('timer_reset', function (data) {
	console.log("timer_reset!");
	mulletrun.timer.reset();
});


var setScore = function(score){
	console.log('setScore', score);
	$("#score_display")[0].innerText = "Score: " + score;
};

io.on('score_update', setScore);

var mulletrun = {};

mulletrun.timer = {};
mulletrun.timer.startTime = null;
mulletrun.timer.interval = null;
mulletrun.timer.paused = true;
mulletrun.timer.totalMS = 180000;

mulletrun.timer.updateTime = function(){

	if (mulletrun.timer.startTime == null) return;

    var elapsed = new Date().getTime() - mulletrun.timer.startTime;
    elapsed = (mulletrun.timer.totalMS - elapsed) / 1000;
    if (elapsed >= 0){
	    var min = Number(elapsed / 60);
	    var sec = elapsed - (Math.floor(min) * 60);
	    var ms = sec % 1;
	    min = pad(min.toString().split('.').shift(), 1);
	    sec = pad(sec.toString().split('.').shift(), 2);
	    ms = ms.toFixed(2).toString().split('.').pop();
	} else {
		min = "0";
		sec = ms = "00";
		mulletrun.timer.pause();
		io.emit('timer_expired');
	}

	    $("#timer").html(min + ":" + sec + "." + ms);

}

mulletrun.timer.start = function(){
	mulletrun.timer.reset();
	mulletrun.timer.startTime = new Date().getTime();
	mulletrun.timer.interval = setInterval(mulletrun.timer.updateTime, 25);
	mulletrun.timer.paused = false;
	io.emit('timer_start');
}

mulletrun.timer.reset = function(){
	clearInterval(mulletrun.timer.interval);
	$("#timer").html("3:00");
	mulletrun.timer.totalMS = 180000;
	mulletrun.timer.paused = true;
	io.emit('timer_reset');
}

mulletrun.timer.pause = function(){
	if (mulletrun.timer.paused){
		mulletrun.timer.startTime = new Date().getTime();
		mulletrun.timer.interval = setInterval(mulletrun.timer.updateTime, 25);
		io.emit('timer_unpaused');
	} else {
		mulletrun.timer.totalMS -= new Date().getTime() - mulletrun.timer.startTime;
		clearInterval(mulletrun.timer.interval);
		io.emit('timer_paused');
	}

	mulletrun.timer.paused = !mulletrun.timer.paused;
}

var pad = function(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

mulletrun.timer.reset();


////////

var video = $("#videoElement")[0];
 
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia || navigator.oGetUserMedia;
 
if (navigator.getUserMedia) {       
    navigator.getUserMedia({video: true}, handleVideo, videoError);
}
 
function handleVideo(stream) {
    video.src = window.URL.createObjectURL(stream);
}
 
function videoError(e) {
    // do something
}
