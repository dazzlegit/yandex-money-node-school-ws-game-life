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

const INIT = 'INITIALIZE';
const UPDATE = 'UPDATE_STATE';
const ADD = 'ADD_POINT';

const WebSocketWrapper = {
  _ws: null,
  _protocol: 'ws://',
  _url: 'ws.rudenko.tech/life/api',
  
  connect(token) {
    if (!this._ws) {
      this._ws = new WebSocket(`${this._protocol}${this._url}?token=${token}`);
      
      this._ws.onopen = () => {
        console.log('Connection is opened');
      };
      
      this._ws.onmessage = (event) => {
        const { type, data } = JSON.parse(event.data);
        LifeGameWrapper[type](data);
      };
      
      this._ws.onerror = () => {
        console.log('WebSocket error');
      };
      
      this._ws.onclose = () => {
        console.log('Connection is closed');
        this._ws = null;
      }
    }
  },
  
  send(message) {
    if (this._ws) this._ws.send(message);
  }
};

const LifeGameWrapper = {
  _game: null,
  
  [INIT]({ user, settings, state }) {
    if (!this._game) {
      this._game = new LifeGame(user, settings);
      this._game.init();
      this._game.setState(state);
      this._game.send = data => WebSocketWrapper.send(JSON.stringify({ type: ADD, data }));
    }
  },
  
  [UPDATE](state) {
    if (this._game) this._game.setState(state);
  }
};

App.onToken = token => WebSocketWrapper.connect(token);
