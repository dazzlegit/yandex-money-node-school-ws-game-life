'use strict';

// ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
// ░░░░░░░░░░▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄░░░░░░░░░░░
// ░░░░░░░░▄▀░░░░░░░░░░░░▄░░░░░░░▀▄░░░░░░░░
// ░░░░░░░░█░░▄░░░░▄░░░░░░░░░░░░░░█░░░░░░░░
// ░░░░░░░░█░░░░░░░░░░░░▄█▄▄░░▄░░░█░▄▄▄░░░░
// ░▄▄▄▄▄░░█░░░░░░▀░░░░▀█░░▀▄░░░░░█▀▀░██░░░
// ░██▄▀██▄█░░░▄░░░░░░░██░░░░▀▀▀▀▀░░░░██░░░
// ░░▀██▄▀██░░░░░░░░▀░██▀░░░░░░░░░░░░░▀██░░
// ░░░░▀████░▀░░░░▄░░░██░░░▄█░░░░▄░▄█░░██░░
// ░░░░░░░▀█░░░░▄░░░░░██░░░░▄░░░▄░░▄░░░██░░
// ░░░░░░░▄█▄░░░░░░░░░░░▀▄░░▀▀▀▀▀▀▀▀░░▄▀░░░
// ░░░░░░█▀▀█████████▀▀▀▀████████████▀░░░░░░
// ░░░░░░████▀░░███▀░░░░░░▀███░░▀██▀░░░░░░░
// ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░

const fs = require('fs');
const http = require('http');
const querystring = require('querystring');
const WebSocketServer = require('ws').Server;
const LifeGameVirtualDom = require('../lib/LifeGameVirtualDom');


const port = 8080;


const INIT = 'INITIALIZE';
const UPDATE = 'UPDATE_STATE';
const ADD = 'ADD_POINT';


class Player {
  
  constructor(socket, req) {
    this._token = Player._readToken(req);
    this._color = Player._generateColor();
    this._socket = socket;
    this._socket.on('close', this._handleClose.bind(this));
    this._socket.on('message', this._handleMessage.bind(this));
  }
  
  toString() {
    return `${this._token} with color ${this._color}`;
  }
  
  isCheater() {
    return !this._token;
  }
  
  send(message) {
    if (this._socket) this._socket.send(message);
  }
  
  disconnect() {
    if (this._socket) this._socket.close();
  }
  
  _handleClose() {
    Playground.remove(this);
    this._socket = null;
  }
  
  _handleMessage(json) {
    GameWrapper.applyMessage(this, json);
  }
  
  static _readToken(req) {
    return querystring.parse(req.url.replace(/^.*\?/, '')).token;
  }
  
  static _generateColor() {
    const num = Math.floor(Math.random() * 16 ** 3);
    return `#${num.toString(16).padStart(3,'0')}`;
  }
  
}


const Playground = {
  
  _players: [],
  
  welcome(player) {
    if (player.isCheater()) {
      player.disconnect();
    } else {
      player.send(GameWrapper.buildInitMessage(player));
      this.add(player);
    }
  },
  
  notify(message) {
    this._players.forEach(player => player.send(message));
  },
  
  add(player) {
    this._players.push(player);
    console.log(`Player was added: ${player}, ${this._players.length} players are in game`);
  },
  
  remove(player) {
    const index = this._players.findIndex(_player => _player._socket === player._socket);
    if (index !== -1) {
      this._players.splice(index, 1);
      console.log(`Player was removed: ${player}, ${this._players.length} players are in game`);
    }
  },

};


const GameWrapper = {
  
  _game: null,
  
  init() {
    this._game = new LifeGameVirtualDom();
    this._game.sendUpdates = data => Playground.notify(this._buildUpdateMessage(data));
  },
  
  applyMessage(player, messageJSON) {
    try {
      const { type, data } = JSON.parse(messageJSON);
      if (type === ADD) {
        this._game.applyUpdates(data);
      } else {
        player.disconnect();
      }
    } catch (err) {
      player.disconnect();
    }
  },
  
  buildInitMessage(player) {
    return JSON.stringify({
      type: INIT,
      data: {
        user: {
          token: player._token,
          color: player._color,
        },
        state: this._game.state,
        settings: this._game.settings,
      },
    });
  },
  
  _buildUpdateMessage(data) {
    return JSON.stringify({
      type: UPDATE,
      data,
    });
  },
  
};


GameWrapper.init();


const httpServer = http.createServer((req, res) => {
  fs.createReadStream(`./dist${req.url === '/' ? '/index.html' : req.url}`)
    .on('error', () => {
      res.statusCode = 404;
      res.end('Not found');
    })
    .pipe(res);
}).listen(port);


new WebSocketServer({ server: httpServer }).on('connection', (socket, req) => Playground.welcome(new Player(socket, req)));
