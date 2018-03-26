"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 *   Wechaty - https://github.com/chatie/wechaty
 *
 *   @copyright 2016-2018 Huan LI <zixia@zixia.net>
 *
 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 *
 */
const WebSocket = require("ws");
const state_switch_1 = require("state-switch");
const _1 = require("./puppet-web/");
const config_1 = require("./config");
class Io {
    constructor(options) {
        this.options = options;
        this.eventBuffer = [];
        this.state = new state_switch_1.default('Io', config_1.log);
        options.apihost = options.apihost || config_1.config.apihost;
        options.protocol = options.protocol || config_1.config.default.DEFAULT_PROTOCOL;
        this.uuid = options.wechaty.uuid;
        this.protocol = options.protocol + '|' + options.wechaty.uuid;
        config_1.log.verbose('Io', 'instantiated with apihost[%s], token[%s], protocol[%s], uuid[%s]', options.apihost, options.token, options.protocol, this.uuid);
    }
    toString() {
        return `Io<${this.options.token}>`;
    }
    connected() {
        return this.ws && this.ws.readyState === WebSocket.OPEN;
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.log.verbose('Io', 'init()');
            this.state.on('pending');
            try {
                yield this.initEventHook();
                this.ws = this.initWebSocket();
                this.state.on(true);
                return;
            }
            catch (e) {
                config_1.log.warn('Io', 'init() exception: %s', e.message);
                this.state.off(true);
                throw e;
            }
        });
    }
    initEventHook() {
        config_1.log.verbose('Io', 'initEventHook()');
        const wechaty = this.options.wechaty;
        wechaty.on('error', error => this.send({ name: 'error', payload: error }));
        wechaty.on('heartbeat', data => this.send({ name: 'heartbeat', payload: { uuid: this.uuid, data } }));
        wechaty.on('login', user => this.send({ name: 'login', payload: user }));
        wechaty.on('logout', user => this.send({ name: 'logout', payload: user }));
        wechaty.on('message', message => this.ioMessage(message));
        wechaty.on('scan', (url, code) => this.send({ name: 'scan', payload: { url, code } }));
        // const hookEvents: WechatyEventName[] = [
        //   'scan'
        //   , 'login'
        //   , 'logout'
        //   , 'heartbeat'
        //   , 'error'
        // ]
        // hookEvents.map(event => {
        //   wechaty.on(event, (data) => {
        //     const ioEvent: IoEvent = {
        //       name:       event
        //       , payload:  data
        //     }
        //     switch (event) {
        //       case 'login':
        //       case 'logout':
        //         if (data instanceof Contact) {
        //           // ioEvent.payload = data.obj
        //           ioEvent.payload = data
        //         }
        //         break
        //       case 'error':
        //         ioEvent.payload = data.toString()
        //         break
        //   case 'heartbeat':
        //     ioEvent.payload = {
        //       uuid: this.uuid
        //       , data: data
        //     }
        //     break
        //   default:
        //     break
        // }
        //     this.send(ioEvent)
        //   })
        // })
        // wechaty.on('message', m => {
        //   const text = (m.room() ? '[' + m.room().topic() + ']' : '')
        //               + '<' + m.from().name() + '>'
        //               + ':' + m.toStringDigest()
        //   this.send({ name: 'message', payload:  text })
        // })
        return;
    }
    initWebSocket() {
        config_1.log.verbose('Io', 'initWebSocket()');
        // this.state.current('on', false)
        // const auth = 'Basic ' + new Buffer(this.setting.token + ':X').toString('base64')
        const auth = 'Token ' + this.options.token;
        const headers = { 'Authorization': auth };
        if (!this.options.apihost) {
            throw new Error('no apihost');
        }
        let endpoint = 'wss://' + this.options.apihost + '/v0/websocket';
        // XXX quick and dirty: use no ssl for APIHOST other than official
        // FIXME: use a configuarable VARIABLE for the domain name at here:
        if (!/api\.chatie\.io/.test(this.options.apihost)) {
            endpoint = 'ws://' + this.options.apihost + '/v0/websocket';
        }
        const ws = this.ws = new WebSocket(endpoint, this.protocol, { headers });
        ws.on('open', () => this.wsOnOpen(ws));
        ws.on('message', data => this.wsOnMessage(data));
        ws.on('error', e => this.wsOnError(e));
        ws.on('close', (code, reason) => this.wsOnClose(ws, code, reason));
        return ws;
    }
    wsOnOpen(ws) {
        if (this.protocol !== ws.protocol) {
            config_1.log.error('Io', 'initWebSocket() require protocol[%s] failed', this.protocol);
            // XXX deal with error?
        }
        config_1.log.verbose('Io', 'initWebSocket() connected with protocol [%s]', ws.protocol);
        // this.currentState('connected')
        // this.state.current('on')
        // FIXME: how to keep alive???
        // ws._socket.setKeepAlive(true, 100)
        this.reconnectTimeout = null;
        const name = 'sys';
        const payload = 'Wechaty version ' + this.options.wechaty.version() + ` with UUID: ${this.uuid}`;
        const initEvent = {
            name,
            payload,
        };
        this.send(initEvent);
    }
    wsOnMessage(data) {
        config_1.log.silly('Io', 'initWebSocket() ws.on(message): %s', data);
        // flags.binary will be set if a binary data is received.
        // flags.masked will be set if the data was masked.
        if (typeof data !== 'string') {
            throw new Error('data should be string...');
        }
        const ioEvent = {
            name: 'raw',
            payload: data,
        };
        try {
            const obj = JSON.parse(data);
            ioEvent.name = obj.name;
            ioEvent.payload = obj.payload;
        }
        catch (e) {
            config_1.log.verbose('Io', 'on(message) recv a non IoEvent data[%s]', data);
        }
        switch (ioEvent.name) {
            case 'botie':
                const payload = ioEvent.payload;
                if (payload.onMessage) {
                    const script = payload.script;
                    try {
                        /* tslint:disable:no-eval */
                        const fn = eval(script);
                        if (typeof fn === 'function') {
                            this.onMessage = fn;
                        }
                        else {
                            config_1.log.warn('Io', 'server pushed function is invalid');
                        }
                    }
                    catch (e) {
                        config_1.log.warn('Io', 'server pushed function exception: %s', e);
                        this.options.wechaty.emit('error', e);
                    }
                }
                break;
            case 'reset':
                config_1.log.verbose('Io', 'on(reset): %s', ioEvent.payload);
                this.options.wechaty.reset(ioEvent.payload);
                break;
            case 'shutdown':
                config_1.log.info('Io', 'on(shutdown): %s', ioEvent.payload);
                process.exit(0);
                break;
            case 'update':
                config_1.log.verbose('Io', 'on(report): %s', ioEvent.payload);
                const user = this.options.wechaty.puppet ? this.options.wechaty.puppet.user : null;
                if (user) {
                    const loginEvent = {
                        name: 'login',
                        payload: user.obj,
                    };
                    this.send(loginEvent);
                }
                const puppet = this.options.wechaty.puppet;
                if (puppet instanceof _1.default) {
                    const scanInfo = puppet.scanInfo;
                    if (scanInfo) {
                        const scanEvent = {
                            name: 'scan',
                            payload: scanInfo,
                        };
                        this.send(scanEvent);
                    }
                }
                break;
            case 'sys':
                // do nothing
                break;
            case 'logout':
                config_1.log.info('Io', 'on(logout): %s', ioEvent.payload);
                this.options.wechaty.logout();
                break;
            default:
                config_1.log.warn('Io', 'UNKNOWN on(%s): %s', ioEvent.name, ioEvent.payload);
                break;
        }
    }
    // FIXME: it seems the parameter `e` might be `undefined`.
    // @types/ws might has bug for `ws.on('error',    e => this.wsOnError(e))`
    wsOnError(e) {
        config_1.log.warn('Io', 'initWebSocket() error event[%s]', e && e.message);
        this.options.wechaty.emit('error', e);
        // when `error`, there must have already a `close` event
        // we should not call this.reconnect() again
        //
        // this.close()
        // this.reconnect()
    }
    wsOnClose(ws, code, message) {
        config_1.log.warn('Io', 'initWebSocket() close event[%d: %s]', code, message);
        ws.close();
        this.reconnect();
    }
    reconnect() {
        config_1.log.verbose('Io', 'reconnect()');
        if (this.state.off()) {
            config_1.log.warn('Io', 'reconnect() canceled because state.target() === offline');
            return;
        }
        if (this.connected()) {
            config_1.log.warn('Io', 'reconnect() on a already connected io');
            return;
        }
        if (this.reconnectTimer) {
            config_1.log.warn('Io', 'reconnect() on a already re-connecting io');
            return;
        }
        if (!this.reconnectTimeout) {
            this.reconnectTimeout = 1;
        }
        else if (this.reconnectTimeout < 10 * 1000) {
            this.reconnectTimeout *= 3;
        }
        config_1.log.warn('Io', 'reconnect() will reconnect after %d s', Math.floor(this.reconnectTimeout / 1000));
        this.reconnectTimer = setTimeout(_ => {
            this.reconnectTimer = null;
            this.initWebSocket();
        }, this.reconnectTimeout); // as any as NodeJS.Timer
    }
    send(ioEvent) {
        return __awaiter(this, void 0, void 0, function* () {
            if (ioEvent) {
                config_1.log.silly('Io', 'send(%s: %s)', ioEvent.name, ioEvent.payload);
                this.eventBuffer.push(ioEvent);
            }
            else {
                config_1.log.silly('Io', 'send()');
            }
            if (!this.connected()) {
                config_1.log.verbose('Io', 'send() without a connected websocket, eventBuffer.length = %d', this.eventBuffer.length);
                return;
            }
            const list = [];
            while (this.eventBuffer.length) {
                const p = new Promise((resolve, reject) => this.ws.send(JSON.stringify(this.eventBuffer.shift()), (err) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve();
                    }
                }));
                list.push(p);
            }
            try {
                yield Promise.all(list);
            }
            catch (e) {
                config_1.log.error('Io', 'send() exceptio: %s', e.stack);
                throw e;
            }
        });
    }
    quit() {
        return __awaiter(this, void 0, void 0, function* () {
            this.state.off('pending');
            // try to send IoEvents in buffer
            yield this.send();
            this.eventBuffer = [];
            if (this.reconnectTimer) {
                clearTimeout(this.reconnectTimer);
                this.reconnectTimer = null;
            }
            this.ws.close();
            this.state.off(true);
            return;
        });
    }
    /**
     *
     * Prepare to be overwriten by server setting
     *
     */
    ioMessage(m) {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.log.silly('Io', 'ioMessage() is a nop function before be overwriten from cloud');
            if (typeof this.onMessage === 'function') {
                yield this.onMessage(m);
            }
        });
    }
}
exports.Io = Io;
exports.default = Io;
//# sourceMappingURL=io.js.map