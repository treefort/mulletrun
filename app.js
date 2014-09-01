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
	'batman': 		75
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
serialPort.list(function (err, ports) {
  ports.forEach(function(port) {
    //console.log(port.comName);
    //console.log(port.pnpId);
    //console.log(port.manufacturer);
  });
});

var serialPort = new SerialPort("/dev/tty.usbmodem1421", {
	baudrate: 115200,
	parser: serialPort.parsers.readline("\n")
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
			
			var flag_i = 0;

			var callbacks = flag_values.length;
			_.each(flag_values, function(value) {
				flag_i++;

				
				function setdata(flag){
					return function(err, data){
						
						function setmeta(flag){

							return function(err, data){
								data.flagindex = flag;
								allflags[flag] = data;
								callbacks--;
								if (!callbacks){
									checkFlagStatus(allflags);
								}
							}
						}

						client.hgetall('flag' + flag, setmeta('flag' + flag));
						
					};
				}
				

				client.hset('flag' + flag_i, "current", String(value), setdata(flag_i));
			});

			emitDataThrottle(flag_values);

		}
	});
});  

var emitData = function(data){
	io.sockets.emit('flag_values', data);				
}

var emitDataThrottle = _.throttle(emitData, 100);

var emitFlagMeta = function(){
	io.sockets.emit('flag_meta', allflags);
}

var checkFlagStatus = function(data){
	var activeFlags = _.filter(data, function(flag){
		if (flag.low == undefined || flag.high == undefined || flag.id == undefined || flag.current == undefined) {
			return false;
		} else if (flag.id == ''){
			return false;
		} else {
			return true;
		}
	});

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

			allflags[flag.flagindex] = _.merge(allflags[flag.flagindex], flag);
		}
	});

	var score = 0;
	var toofer = false;
	_.each(_.filter(activeFlags, {'status':'c'}), function(flag){
		score += flag_values[flag.id] || 0;
		if (flag.id == 'toofer') toofer = true;
	});
		
	if (toofer && score > 0) score *= 2;

	if (current_score != score || current_score == null){
		console.log('sending score:', score);
		current_score = score;
		io.sockets.emit('score_update', score);
	}
}
/*
client.hset('flag1', "current", "444", redis.print);
client.hset('flag1', "low", "111", redis.print);
client.hset('flag1', "high", "888", redis.print);
client.hgetall('flag1', redis.print);
*/

// socketio controller 

io.on('connection', function (socket) {

	socket.on('setlow', function(data) {
		console.log("setlow:", data);
		client.hset(data.flag, "low", String(data.val), function(){
			emitFlagMeta();
		});
		
	});

	socket.on('sethigh', function(data) {
		console.log("sethigh:", data);
		client.hset(data.flag, "high", String(data.val), function(){
			emitFlagMeta();
		});
	});

	socket.on('setid', function(data) {
		console.log("setid:", data);
		client.hset(data.flag, "id", String(data.val), function(){
			emitFlagMeta();
		});
	});

	current_score = null;
	emitFlagMeta();
});



console.log("and here... we...... go.");






