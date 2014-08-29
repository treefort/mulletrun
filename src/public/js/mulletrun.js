var _ 		= require("lodash");

io = io.connect();

io.on('frame', function (data) {
	$("#camera").attr("src", data.data);
});

var mulletrun = {};

mulletrun.test = function(){
	console.log("mulletrun::test()");
	console.log(_);
	_.each([1,2,3], function(w){ console.log(w);});
}


mulletrun.test();