var express         = require('express'),
	bodyParser      = require('body-parser'),
	cookieParser    = require('cookie-parser'),
	session         = require('express-session'),
	colors 			= require('colors'),
	io 				= require('socket.io'),
	favicon 		= require('serve-favicon'),
	morgan          = require('morgan'),
	async           = require('async'),
	mongoose        = require('mongoose'),
	stylus 			= require('stylus'),
	nib 			= require('nib'),
	_               = require('lodash'),
	http 			= require('http'),
	io 				= require('socket.io'),
	SerialPort 		= require('serialport').SerialPort,
	redis 			= require("redis"),
	client 			= redis.createClient(),
	app             = express();

//  start the redis server — 
//# redis-server /usr/local/etc/redis.conf

var server = app.listen(3000);
io = io.listen(server);

app.use(bodyParser.json());
app.use(cookieParser());
app.use(session({ secret: 'foo bar', resave: true, saveUninitialized: true }));
app.use(morgan('combined'))

app.set('views', __dirname + '/src/views')
app.set('view engine', 'jade')

app.use(stylus.middleware({
	src: __dirname + '/src', // .styl files are located in `views/stylesheets`
	dest: __dirname + '/public', // .styl resources are compiled `/stylesheets/*.css`
	force : true,
	debug : true,
	sourcemap : true,
	compile : function(str, path) {
		return stylus(str).set('filename', path).set('compress', true).use(nib());
	}
}));

app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
	res.render('index', { title : 'Home' });
});

// flags controller

var flag_values = 
{
	'sword': 		100,
	'duke': 		25,
	'blue21': 		5,
	'blue22': 		5,
	'shyronnie': 	10,
	'troll': 		5,
	'blue31': 		5,
	'blue32': 		5,
	'red31': 		10,
	'timmy': 		25,
	'blue41': 		5,
	'blue42': 		5,
	'red41': 		10,
	'batman': 		75,
	'toofer': 0
}

app.get('/flags', function (req, res) {
	res.render('flags', { title : 'Set Flags' });
});


// timer controller

app.post('/timer/:action', function(req, res){
	io.sockets.emit('timer_' + req.params.action, allflags);	
	res.status(200).end();
});

// serial controller

var serialPort = require("serialport");

// uncomment this for debugging — lists available serial ports
/*  
serialPort.list(function (err, ports) {
  ports.forEach(function(port) {
	console.log(port.comName);
	console.log(port.pnpId);
	console.log(port.manufacturer);
  });
});
*/

var serialPort = new SerialPort("/dev/tty.usbmodem1421", {
	baudrate: 115200,
	parser: serialPort.parsers.readline("\n")
}, function(err){
	if (err)
		console.log("Error connecting to serial port: ", err);
});


var keys = [];
var flag_count = 15;

while (flag_count--) keys.push('flag' + (keys.length+1));

flag_count = keys.length;


var flag_data = {};
var allflags = {};
var current_score = null;

serialPort.on("open", function () {
	console.log('open');
	serialPort.on('data', function(data) {

		if (data.substr(0,1) == '[' && data.substr(-2,1) == ']'){
			var flag_values = data.substring(1, data.indexOf(']')).split(':');
			
			emitDataThrottle(flag_values);
			
			var flag_i = 0;

			var _callback = _.after(keys.length, function(){
				getAllFlagMeta(keys, checkFlagStatus);
			})

			_.each(keys, function(flag) {
				client.hset(flag, "current", flag_values[flag_i++], _callback); 
			});
		}
	});


});

var getAllFlagMeta = function(flags, callback){

	// flags: array of flag indexes ([flag1, flag2, flag6, etc...] or [2, 4, 5, ...])

	flags = !_.isArray(flags) ? [flags] : flags;
	var flagdata = {};

	var _callback = _.after(flags.length, function(data){
		callback(data);
	}); 

	_.forEach(flags, function(flag){
		
		flag = flag.toString().indexOf('flag') != 0 ? 'flag' + flag : flag;

		function setmeta(flag){
			return function(err, data){
				data.flagindex = flag
				flagdata[flag] = data;
				_callback(flagdata);
			}
		}

		client.hgetall(flag, setmeta(flag));	
	});

}

/*
getAllFlagMeta(['flag1', 'flag2', 'flag3'], function(data) {console.log(data);});
getAllFlagMeta([5, 8, 9, 10], function(data) {console.log(data);});
*/

var emitData = function(data){
	io.sockets.emit('flag_values', data);				
}

var emitDataThrottle = _.throttle(emitData, 100);

var emitFlagMeta = function(data){
	io.sockets.emit('flag_meta', data);
}

var getActiveFlags = function(data){
	return _.filter(data, function(flag){
		if (flag.low == undefined || flag.high == undefined || flag.id == undefined || flag.current == undefined) {
			return false;
		} else if (flag.id == ''){
			return false;
		} else {
			return true;
		}
	});
}

var getNamedFlags = function(data){
	return _.filter(data, function(flag){
		if (flag.id == undefined) {
			return false;
		} else {
			return true;
		}
	});
}

var checkFlagStatus = function(data){

	var activeFlags = getActiveFlags(data);

	_.each(activeFlags, function(flag){
		if (flag.low != undefined && flag.high != undefined && flag.current != undefined){

			var captured;
			if (flag.current < Number(flag.low) + ((Number(flag.high)-Number(flag.low))/2)){
				captured = false;
			} else {
				captured = true;
			}

			flag.status = flag.status == undefined ? 'q' : flag.status;
			
			if (captured && (flag.status == 'q' || flag.status == '')){
				console.log('captured:', flag.flagindex);
				flag.status = 'c';
				client.hset(flag.flagindex, "status", "c");
				io.sockets.emit('flag_status', flag);
			} else if (!captured && (flag.status == 'q' || flag.status == 'c')) {
				console.log('uncaptured:', flag.flagindex);
				flag.status = '';
				client.hset(flag.flagindex, "status", "");
				io.sockets.emit('flag_status', flag);
			}

			allflags[flag.flagindex] = _.merge(data[flag.flagindex], flag);
		}
	});

	var score = 0;
	var toofer = false;
	_.each(_.filter(activeFlags, {'status':'c'}), function(flag){
		score += flag_values[flag.id];
		if (flag.id == 'toofer') toofer = true;
	});
		
	if (toofer && score > 0) score *= 2;

	if (current_score != score || current_score == null){
		console.log('sending score:', score);
		current_score = score;
		io.sockets.emit('score_update', score);
	}
}

var setAllLows = function(data){

	var namedFlags = getNamedFlags(data); // only set for active flags
	console.log('active:', namedFlags);
	_.each(namedFlags, function(flag){
		flag.low = flag.current;
		setLow({'flag': flag.flagindex, 'val': flag.low});
	});
};

var setAllHighs = function(data){
	var namedFlags = getNamedFlags(data); // only set for active flags
	
	_.each(namedFlags, function(flag){
		flag.high = flag.current;
		setHigh({'flag': flag.flagindex, 'val': flag.high});
	});
};

var resetAllLows = function(data){
	
	var namedFlags = getNamedFlags(data); // only set for active flags
	console.log('active:', namedFlags);
	_.each(namedFlags, function(flag){
		flag.low = '';
		setLow({'flag': flag.flagindex, 'val': flag.low});
	});
};

var resetAllHighs = function(data){
	var namedFlags = getNamedFlags(data); // only set for active flags
	
	_.each(namedFlags, function(flag){
		flag.high = '';
		setHigh({'flag': flag.flagindex, 'val': flag.high});
	});
};

var setLow = function(data){
	console.log("setlow:", data);
	if (data.val != ''){
		client.hset(data.flag, "low", String(data.val), function(){
			getAllFlagMeta(data.flag, emitFlagMeta);
		});
	} else {
		client.hdel(data.flag, "low", function(){
			getAllFlagMeta(data.flag, emitFlagMeta);
		});
	}
};

var setHigh = function(data){
	console.log("sethigh:", data);
	if (data.val != ''){
		client.hset(data.flag, "high", String(data.val), function(){
			getAllFlagMeta(data.flag, emitFlagMeta);
		});
	} else {
		client.hdel(data.flag, "high", function(){
			getAllFlagMeta(data.flag, emitFlagMeta);
		});
	}
}

var setID = function(data){
	console.log("setid:", data);
	if (data.val != ''){
		client.hset(data.flag, "id", String(data.val), function(){
			getAllFlagMeta(data.flag, emitFlagMeta);
		});
	} else {
		client.hdel(data.flag, "id", function(){
			getAllFlagMeta(data.flag, emitFlagMeta);
		});
	}
}

// socketio controller 

io.on('connection', function (socket) {

	socket.on('setlow', setLow);

	socket.on('sethigh', setHigh);

	socket.on('setid', setID);

	socket.on('setAllLows', function(data){
		console.log('set all lows');
		getAllFlagMeta(keys, setAllLows);
	});

	socket.on('setAllHighs', function(data){
		console.log('set all highs');
		getAllFlagMeta(keys, setAllHighs);
	});

	socket.on('resetAllLows', function(data){
		console.log('reset all lows');
		getAllFlagMeta(keys, resetAllLows);
	});

	socket.on('resetAllHighs', function(data){
		console.log('reset all highs');
		getAllFlagMeta(keys, resetAllHighs);
	});

	current_score = null;

	// send all flag data to new client
	getAllFlagMeta(keys, emitFlagMeta);

});



console.log("and here... we...... go.");






