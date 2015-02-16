var express = require('express');
var app = express();
var server = require('http').createServer(app);
var session = require('express-session');
var crypto = require('crypto');
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
var sys = require('sys')
var exec = require('child_process').exec;
var cookie = require('cookie')


var sessionSecret = crypto.randomBytes(10).toString();
var io = require('socket.io')(server);
//http://stackoverflow.com/questions/10110411/node-js-socket-io-how-to-emit-to-a-particular-client

var parseUrlencoded = bodyParser.urlencoded({extended:false});


//net socket server for a python app server
var net = require('net');

var HOST = '127.0.0.1';
var PORT = 8008;

var sock_server = net.createServer();

sock_server.listen(PORT, HOST, function(socket){
	console.log("net socket server info." + JSON.stringify(sock_server.address()));
	console.log("connected....");
});



var valid_session = new validSession(); //Globally only one session exists. should avoid global var


function validSession(){
	this.sessionID  = null;
	this.createValidSession = function(id, callback){
		if(this.sessionID === null){
			this.sessionID = id;
			console.log("createing a new valid session.\n")
		} else {
			console.log("Only one valid session can exist");
		}
		callback();
 	}

 	this.resetValidSession = function(){
 		this.sessionID = null;
 	}

}

var childProc = new pythonWrapper(); //Globally only one child proc exists. should avoid global var


function pythonWrapper(){
	this.child = null;

	this.setCmd = function(keyword){
		this.cmd = "python MachineLearningServer.py "+ PORT + " "+keyword;

		console.log("Got the search keyword "+keyword);	
	}
	
	this.runProc = function(){
		try{
			if(this.child === null){
				this.child = exec(this.cmd, function(error, stdout, stderr){
					if(error) console.log(error);
				});
				console.log("executing '"+ this.cmd +"'");
			} else {
				console.log("child process already exists")
			}
			
		} catch(err) {
			console.log("can't run")
			console.log(err);
		} 

	}

	this.terminateProc = function(){
		try{
			this.child.kill(signal='SIGTERM');
			this.child = null;
			console.log("end child process")
		} catch(err){
			console.log("no child process")
		} 

	}
}


var validSessionCheck = function(request, response, next){
	
	valid_session.createValidSession(request.sessionID, function(){
		console.log("request.sessionID:"+request.sessionID)
		console.log("valid_session.sessionID:"+valid_session.sessionID)
		if(request.sessionID === valid_session.sessionID){
			response.cookie('user', request.sessionID);
			return next();
		} else {
			console.log("invalid session. all valid sessions are occupied.\n")
			return response.render(__dirname +'/public/index.ejs', {"message": "number of session limited, please wait until the session is available", "no_session":1})
		}
	});
}





/*var sessions = session({
	cookie: {maxAge: null, secure: false},
	secret: sessionSecret, name: "express.sid"
});*/

function errorHandler(err, request, response, next) {
  res.status(500);
  res.render('error', { error: err });
}


app.use('/static', express.static(__dirname + '/public'));
app.use(cookieParser(sessionSecret));
app.use(bodyParser());
app.use(errorHandler);

app.use(session({
	cookie: {maxAge: null, secure: false},
	secret: sessionSecret, name: "express.sid"
}));


app.get('/', validSessionCheck, function(request, response){
//app.get('/', sessions, validSessionCheck, function(request, response){

	request.session.connection = true

	console.log("sessionID: ", request.sessionID)
	console.log("connection success.\n")
	
	setTimeout(function() {
		valid_session.resetValidSession();
		childProc.terminateProc();
	}, 1000*150); // auto

	return response.render(__dirname +'/public/index.ejs', {"message": "connection success", "no_session":1})

});





io.use(function(socket, next){
	var handshakeData = socket.request;
	var parsedCookie = cookie.parse(cookieParser.signedCookie(handshakeData.headers.cookie, sessionSecret))


	if(handshakeData.headers.cookie){
		if(parsedCookie.user === "expired")
		{
			console.log("io.socket invalid")
			return next('Cookie is invalid.', false);
		}
	} else {
		console.log("io.socket invalid")
		return next('No cookie transmitted.', false);
	}
 	next();
})



io.sockets.on('connection', function(socket){
	console.log('io sockets are connected, id of sockets: ' + socket.id);
});


app.post('/', parseUrlencoded, validSessionCheck, function(request, response){
//app.post('/', parseUrlencoded, sessions, validSessionCheck, function(request, response){

	if(request.session.connection === true){
		var keyword = request.body.keyword;
		request.session.keyword = keyword;
		
		childProc.terminateProc();
		childProc.setCmd(keyword);
		childProc.runProc();

		response.redirect('/result/'+request.sessionID)
	}
	else{
		return response.render(__dirname +'/public/index.ejs', {"message": "number of session limited, please wait until the session is available", "no_session":1})
	}


});

app.get('/result/:sessionID', validSessionCheck, function(request, response){
//app.get('/result/:sessionID', sessions, validSessionCheck, function(request, response){
	var browserID = request.param('sessionID').trim();
	if(browserID === request.sessionID){
		return response.render(__dirname +'/public/result.ejs', {"keyword": request.session.keyword})
		//return response.sendfile(__dirname +'/public/result.html');
	}
	else {
		return response.redirect('/');
	}
})


app.get('*', function(request, response){
	
	return response.status(404).send("404 not found");

})

app.post('/session_closed', parseUrlencoded, function(request, response){
//app.post('/session_closed', parseUrlencoded, sessions, function(request, response){

	console.log('session destroy request received');
	valid_session.resetValidSession();

	request.session.connection = false;
	response.cookie('user', "expired");
	request.session.destroy(function(err){
		console.log("session_destroyed")
		if(err){
			console.log(err);
		}

	});

	setTimeout(function(){
		childProc.terminateProc();
		console.log("end child process")
	}, 1000);

	response.send("session destroyed");
});






///////////TCP socket///////////

sock_server.on('connection', function(sock) {

	console.log("python client connected");
	setTimeout(function(){
		var pairSessionKeyword =  "start" +", "+"rain"
		sock.write(pairSessionKeyword)
	}	, 10);


	sock.on('data', function(data) {

		try{
			var decoded = JSON.parse(data)

			if(decoded.head === "_data_"){
				io.sockets.emit('result_', data);
				console.log("we got data from python.");
			}

			if(decoded.head === "_end_"){
				io.sockets.emit('end_', data);

				setTimeout(function(){
					sock.write("close" +", "+"____")
					console.log("we send an end message to a python app.");
				}	, 10);


				setTimeout(function(){
					childProc.terminateProc();
					
				}, 1000);//in case a python app does not close by itself.
			}
		} catch (e){
			console.log("Node.js error:");
			console.log(e);
		}
	})

	sock.on('close', function() {
		console.log('Connection from python closed');
		io.sockets.emit('end_', "data");
	});

});


//backend server listen
server.listen(8080);
