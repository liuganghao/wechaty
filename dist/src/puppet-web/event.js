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
const config_1 = require("../config");
const contact_1 = require("../contact");
const message_1 = require("../message");
const firer_1 = require("./firer");
const schema_1 = require("./schema");
/* tslint:disable:variable-name */
exports.Event = {
    onDing,
    onLog,
    onLogin,
    onLogout,
    onMessage,
    onScan,
    onUnload,
};
function onDing(data) {
    config_1.log.silly('PuppetWebEvent', 'onDing(%s)', data);
    this.emit('watchdog', { data });
}
function onScan(data) {
    return __awaiter(this, void 0, void 0, function* () {
        config_1.log.verbose('PuppetWebEvent', 'onScan({code: %d, url: %s})', data.code, data.url);
        if (this.state.off()) {
            config_1.log.verbose('PuppetWebEvent', 'onScan(%s) state.off()=%s, NOOP', data, this.state.off());
            return;
        }
        this.scanInfo = data;
        /**
         * When wx.qq.com push a new QRCode to Scan, there will be cookie updates(?)
         */
        yield this.saveCookie();
        if (this.user) {
            config_1.log.verbose('PuppetWebEvent', 'onScan() there has user when got a scan event. emit logout and set it to null');
            const bak = this.user || this.userId || '';
            this.user = this.userId = null;
            this.emit('logout', bak);
        }
        // feed watchDog a `scan` type of food
        const food = {
            data,
            type: 'scan',
        };
        this.emit('watchdog', food);
        this.emit('scan', data.url, data.code);
    });
}
function onLog(data) {
    config_1.log.silly('PuppetWebEvent', 'onLog(%s)', data);
}
function onLogin(memo, ttl = 30) {
    return __awaiter(this, void 0, void 0, function* () {
        config_1.log.verbose('PuppetWebEvent', 'onLogin(%s, %d)', memo, ttl);
        const TTL_WAIT_MILLISECONDS = 1 * 1000;
        if (ttl <= 0) {
            config_1.log.verbose('PuppetWebEvent', 'onLogin(%s) TTL expired');
            this.emit('error', new Error('TTL expired.'));
            return;
        }
        if (this.state.off()) {
            config_1.log.verbose('PuppetWebEvent', 'onLogin(%s, %d) state.off()=%s, NOOP', memo, ttl, this.state.off());
            return;
        }
        this.scanInfo = null;
        if (this.userId) {
            config_1.log.warn('PuppetWebEvent', 'onLogin(%s) userId had already set: "%s"', memo, this.userId);
        }
        try {
            /**
             * save login user id to this.userId
             *
             * issue #772: this.bridge might not inited if the 'login' event fired too fast(because of auto login)
             */
            this.userId = yield this.bridge.getUserName();
            if (!this.userId) {
                config_1.log.verbose('PuppetWebEvent', 'onLogin() browser not fully loaded(ttl=%d), retry later', ttl);
                const html = yield this.bridge.innerHTML();
                config_1.log.silly('PuppetWebEvent', 'onLogin() innerHTML: %s', html.substr(0, 500));
                setTimeout(onLogin.bind(this, memo, ttl - 1), TTL_WAIT_MILLISECONDS);
                return;
            }
            config_1.log.silly('PuppetWebEvent', 'bridge.getUserName: %s', this.userId);
            this.user = contact_1.default.load(this.userId);
            yield this.user.ready();
            config_1.log.silly('PuppetWebEvent', `onLogin() user ${this.user.name()} logined`);
            try {
                if (this.state.on() === true) {
                    yield this.saveCookie();
                }
            }
            catch (e) {
                config_1.log.verbose('PuppetWebEvent', 'onLogin() this.saveCookie() exception: %s', e.message);
            }
            // fix issue #668
            try {
                yield this.readyStable();
            }
            catch (e) {
                config_1.log.warn('PuppetWebEvent', 'readyStable() exception: %s', e && e.message || e);
            }
            this.emit('login', this.user);
        }
        catch (e) {
            config_1.log.error('PuppetWebEvent', 'onLogin() exception: %s', e);
            throw e;
        }
        return;
    });
}
function onLogout(data) {
    config_1.log.verbose('PuppetWebEvent', 'onLogout(%s)', data);
    if (!this.user && !this.userId) {
        config_1.log.warn('PuppetWebEvent', 'onLogout() without this.user or userId initialized');
    }
    const bak = this.user || this.userId || '';
    this.userId = this.user = null;
    this.emit('logout', bak);
}
function onMessage(obj) {
    return __awaiter(this, void 0, void 0, function* () {
        let m = new message_1.Message(obj);
        try {
            yield m.ready();
            /**
             * Fire Events if match message type & content
             */
            switch (m.type()) {
                case schema_1.MsgType.VERIFYMSG:
                    firer_1.default.checkFriendRequest.call(this, m);
                    break;
                case schema_1.MsgType.SYS:
                    if (m.room()) {
                        const joinResult = yield firer_1.default.checkRoomJoin.call(this, m);
                        const leaveResult = yield firer_1.default.checkRoomLeave.call(this, m);
                        const topicRestul = yield firer_1.default.checkRoomTopic.call(this, m);
                        if (!joinResult && !leaveResult && !topicRestul) {
                            config_1.log.warn('PuppetWebEvent', `checkRoomSystem message: <${m.content()}> not found`);
                        }
                    }
                    else {
                        firer_1.default.checkFriendConfirm.call(this, m);
                    }
                    break;
            }
            /**
             * Check Type for special Message
             * reload if needed
             */
            switch (m.type()) {
                case schema_1.MsgType.EMOTICON:
                case schema_1.MsgType.IMAGE:
                case schema_1.MsgType.VIDEO:
                case schema_1.MsgType.VOICE:
                case schema_1.MsgType.MICROVIDEO:
                case schema_1.MsgType.APP:
                    config_1.log.verbose('PuppetWebEvent', 'onMessage() EMOTICON/IMAGE/VIDEO/VOICE/MICROVIDEO message');
                    m = new message_1.MediaMessage(obj);
                    break;
                case schema_1.MsgType.TEXT:
                    if (m.typeSub() === schema_1.MsgType.LOCATION) {
                        config_1.log.verbose('PuppetWebEvent', 'onMessage() (TEXT&LOCATION) message');
                        m = new message_1.MediaMessage(obj);
                    }
                    break;
            }
            yield m.ready();
            yield m.from().ready();
            const to = m.to();
            const room = m.room();
            if (to) {
                yield to.ready();
            }
            if (room) {
                yield room.ready();
            }
            this.emit('message', m);
        }
        catch (e) {
            config_1.log.error('PuppetWebEvent', 'onMessage() exception: %s', e.stack);
            throw e;
        }
        return;
    });
}
function onUnload() {
    return __awaiter(this, void 0, void 0, function* () {
        config_1.log.silly('PuppetWebEvent', 'onUnload()');
        /*
        try {
          await this.quit()
          await this.init()
        } catch (e) {
          log.error('PuppetWebEvent', 'onUnload() exception: %s', e)
          this.emit('error', e)
          throw e
        }
        */
    });
}
exports.default = exports.Event;
//# sourceMappingURL=event.js.map