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

app.get('/flags', function (req, res) {
	res.render('flags', { title : 'Set Flags' });
});

app.post('/timer/:action', function(req, res){
	io.sockets.emit('timer_' + req.params.action, allflags);	
	res.status(200).end();
});

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
serialPort.on("open", function () {
	console.log('open');
	serialPort.on('data', function(data) {

		if (data.substr(0,1) == '[' && data.substr(-2,1) == ']'){
			var flag_values = data.substring(1, data.indexOf(']')).split(':');
			//console.log(flag_values);
			//flag_data = _.zipObject(keys, flag_values);
			var flag_i = 0;
			_.each(flag_values, function(value) {
				flag_i++;

				function setdata(flag){
					return function(err, data){
						allflags[flag] = data;
					};
				}
				
				client.hset('flag' + flag_i, "current", String(value));
				client.hgetall('flag' + flag_i, setdata('flag' + flag_i));
			});	

			io.sockets.emit('flag_data', allflags);			
		}
	});
});  


/*
client.hset('flag1', "current", "444", redis.print);
client.hset('flag1', "low", "111", redis.print);
client.hset('flag1', "high", "888", redis.print);
client.hgetall('flag1', redis.print);
*/

io.on('connection', function (socket) {

	socket.on('setlow', function(data) {
		console.log("setlow:", data);
		client.hset(data.flag, "low", String(data.val));
	});

	socket.on('sethigh', function(data) {
		console.log("sethigh:", data);
		client.hset(data.flag, "high", String(data.val));
	});
});



console.log("and here... we...... go.");






