const express = require('express');
const ws = require('ws');
var List = require("collections/list");
const open = require('open');
const welcome = require("./welcome")

welcome.display();

const app = express();
const socket_sessions = new Map()
const wsServer = new ws.Server({ noServer: true});

wsServer.on('connection', (ws, req) => {
	const remoteAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress
	const session = {id:socket_sessions.size, time: new Date().toLocaleString('zh-CN'), name: remoteAddress, events:new List()}
	socket_sessions.set(ws,  session);
	console.log("new session", session.id);
	ws.on('message', message =>{
		const session = socket_sessions.get(ws);
		console.log("got event on session",session.id, message);
		
		session.events.add(JSON.parse(message))
	})
});

const server = app.listen(process.env.WS_PORT || '1234')

console.log("Remote Logger is starting on port: ", process.env.WS_PORT || '1234');

server.on('upgrade', (request, socket, head) =>{
	wsServer.handleUpgrade(request, socket, head, socket =>{
		wsServer.emit('connection', socket, request);
	});
});

var ip = require("ip");
app.listen(3000, () => console.log('Application started on port 3000 at IP:', ip.address()));
open('http://localhost:3000/');

app.set('view engine', 'pug')
app.get('/', function (req, res) {
	const array = Array.from(socket_sessions.values());
  res.render('index', { title: 'Remote Logger', message: 'Remote Logger Sessions!', data: array })
})

app.get('/:sessionId', function (req, res) {
	const sessionId = req.params.sessionId;
	const array = Array.from(socket_sessions.values());
  const session = array.find(ele => ele.id == sessionId)
  res.render('event', { title: 'Remote Logger', message: 'Remote Logger Session [' + session.id + '] Events!', data: session.events.toArray() })
})
