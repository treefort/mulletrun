var express         = require('express'),
	bodyParser      = require('body-parser'),
	cookieParser    = require('cookie-parser'),
	session         = require('express-session'),
	io 				= require('socket.io'),
	favicon 		= require('serve-favicon'),
	morgan          = require('morgan'),
	async           = require('async'),
	mongoose        = require('mongoose'),
	camera        	= require('camera'),
	stylus 			= require('stylus'),
	nib 			= require('nib'),
	_               = require('lodash'),
	app             = express(),
	server 			= require('http').Server(app),
	io 				= require('socket.io')(server),
	frameData;

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

/*
io.on('connection', function (socket) {

	setInterval(function(socket){
		socket.emit('frame', {data: frameData});		
	}, 10, socket);
  
});
*/

/*
var webcam = camera.createStream();
webcam.on('data', function(buffer){
	//console.log('we are getting data');
	//frameData = "data:image/png;base64," + buffer.toString('base64');

});
*/

server.listen(3000);


console.log("and here... we...... go.");






