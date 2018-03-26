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
 *  @ignore
 */
const events_1 = require("events");
const os = require("os");
const state_switch_1 = require("state-switch");
const hot_import_1 = require("hot-import");
const config_1 = require("./config");
const profile_1 = require("./profile");
const _1 = require("./puppet-web/");
const misc_1 = require("./misc");
/**
 * Main bot class.
 *
 * [The World's Shortest ChatBot Code: 6 lines of JavaScript]{@link #wechatyinstance}
 *
 * [Wechaty Starter Project]{@link https://github.com/lijiarui/wechaty-getting-started}
 * @example
 * import { Wechaty } from 'wechaty'
 *
 */
class Wechaty extends events_1.EventEmitter {
    /**
     * @private
     */
    constructor(options = {}) {
        super();
        this.options = options;
        /**
         * the state
         * @private
         */
        this.state = new state_switch_1.default('Wechaty', config_1.log);
        config_1.log.verbose('Wechaty', 'contructor()');
        options.puppet = options.puppet || config_1.config.puppet;
        this.profile = new profile_1.default(options.profile);
        this.uuid = misc_1.default.guid();
    }
    /**
     * get the singleton instance of Wechaty
     *
     * @example <caption>The World's Shortest ChatBot Code: 6 lines of JavaScript</caption>
     * const { Wechaty } = require('wechaty')
     *
     * Wechaty.instance() // Singleton
     * .on('scan', (url, code) => console.log(`Scan QR Code to login: ${code}\n${url}`))
     * .on('login',       user => console.log(`User ${user} logined`))
     * .on('message',  message => console.log(`Message: ${message}`))
     * .init()
     */
    static instance(options) {
        if (options && this._instance) {
            throw new Error('there has already a instance. no params will be allowed any more');
        }
        if (!this._instance) {
            this._instance = new Wechaty(options);
        }
        return this._instance;
    }
    /**
     * @private
     */
    toString() { return `Wechaty<${this.options.puppet}, ${this.profile.name}>`; }
    /**
     * @private
     */
    static version(forceNpm = false) {
        if (!forceNpm) {
            const revision = config_1.config.gitRevision();
            if (revision) {
                return `#git[${revision}]`;
            }
        }
        return config_1.VERSION;
    }
    /**
     * Return version of Wechaty
     *
     * @param {boolean} [forceNpm=false]  - if set to true, will only return the version in package.json.
     *                                      otherwise will return git commit hash if .git exists.
     * @returns {string}                  - the version number
     * @example
     * console.log(Wechaty.instance().version())       // return '#git[af39df]'
     * console.log(Wechaty.instance().version(true))   // return '0.7.9'
     */
    version(forceNpm) {
        return Wechaty.version(forceNpm);
    }
    /**
     * Initialize the bot, return Promise.
     *
     * @deprecated
     * @returns {Promise<void>}
     * @example
     * await bot.init()
     * // do other stuff with bot here
     */
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.log.warn('Wechaty', 'init() DEPRECATED and will be removed after Jun 2018. Use start() instead.');
            yield this.start();
        });
    }
    /**
     * Start the bot, return Promise.
     *
     * @returns {Promise<void>}
     * @example
     * await bot.start()
     * // do other stuff with bot here
     */
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.log.info('Wechaty', 'v%s starting...', this.version());
            config_1.log.verbose('Wechaty', 'puppet: %s', this.options.puppet);
            config_1.log.verbose('Wechaty', 'profile: %s', this.options.profile);
            config_1.log.verbose('Wechaty', 'uuid: %s', this.uuid);
            if (this.state.on() === true) {
                config_1.log.error('Wechaty', 'start() already started. return and do nothing.');
                return;
            }
            else if (this.state.on() === 'pending') {
                config_1.log.error('Wechaty', 'start() another task is starting. return and do nothing.');
                return;
            }
            this.state.on('pending');
            try {
                this.profile.load();
                this.puppet = yield this.initPuppet();
            }
            catch (e) {
                config_1.log.error('Wechaty', 'start() exception: %s', e && e.message);
                config_1.Raven.captureException(e);
                throw e;
            }
            this.on('heartbeat', () => this.memoryCheck());
            this.state.on(true);
            this.emit('start');
            return;
        });
    }
    /**
     * @desc       Wechaty Class Event Type
     * @typedef    WechatyEventName
     * @property   {string}  error      - When the bot get error, there will be a Wechaty error event fired.
     * @property   {string}  login      - After the bot login full successful, the event login will be emitted, with a Contact of current logined user.
     * @property   {string}  logout     - Logout will be emitted when bot detected log out, with a Contact of the current login user.
     * @property   {string}  heartbeat  - Get bot's heartbeat.
     * @property   {string}  friend     - When someone sends you a friend request, there will be a Wechaty friend event fired.
     * @property   {string}  message    - Emit when there's a new message.
     * @property   {string}  room-join  - Emit when anyone join any room.
     * @property   {string}  room-topic - Get topic event, emitted when someone change room topic.
     * @property   {string}  room-leave - Emit when anyone leave the room.<br>
     *                                    If someone leaves the room by themselves, wechat will not notice other people in the room, so the bot will never get the "leave" event.
     * @property   {string}  scan       - A scan event will be emitted when the bot needs to show you a QR Code for scanning.
     */
    /**
     * @desc       Wechaty Class Event Function
     * @typedef    WechatyEventFunction
     * @property   {Function} error           -(this: Wechaty, error: Error) => void callback function
     * @property   {Function} login           -(this: Wechaty, user: Contact)=> void
     * @property   {Function} logout          -(this: Wechaty, user: Contact) => void
     * @property   {Function} scan            -(this: Wechaty, url: string, code: number) => void <br>
     * <ol>
     * <li>URL: {String} the QR code image URL</li>
     * <li>code: {Number} the scan status code. some known status of the code list here is:</li>
     * </ol>
     * <ul>
     * <li>0 initial_</li>
     * <li>200 login confirmed</li>
     * <li>201 scaned, wait for confirm</li>
     * <li>408 waits for scan</li>
     * </ul>
     * @property   {Function} heartbeat       -(this: Wechaty, data: any) => void
     * @property   {Function} friend          -(this: Wechaty, friend: Contact, request?: FriendRequest) => void
     * @property   {Function} message         -(this: Wechaty, message: Message) => void
     * @property   {Function} room-join       -(this: Wechaty, room: Room, inviteeList: Contact[],  inviter: Contact) => void
     * @property   {Function} room-topic      -(this: Wechaty, room: Room, topic: string, oldTopic: string, changer: Contact) => void
     * @property   {Function} room-leave      -(this: Wechaty, room: Room, leaverList: Contact[]) => void
     */
    /**
     * @listens Wechaty
     * @param   {WechatyEvent}      event      - Emit WechatyEvent
     * @param   {WechatyEventFunction}  listener   - Depends on the WechatyEvent
     * @return  {Wechaty}                          - this for chain
     *
     * More Example Gist: [Examples/Friend-Bot]{@link https://github.com/wechaty/wechaty/blob/master/examples/friend-bot.ts}
     *
     * @example <caption>Event:scan </caption>
     * wechaty.on('scan', (url: string, code: number) => {
     *   console.log(`[${code}] Scan ${url} to login.` )
     * })
     *
     * @example <caption>Event:login </caption>
     * bot.on('login', (user: Contact) => {
     *   console.log(`user ${user} login`)
     * })
     *
     * @example <caption>Event:logout </caption>
     * bot.on('logout', (user: Contact) => {
     *   console.log(`user ${user} logout`)
     * })
     *
     * @example <caption>Event:message </caption>
     * wechaty.on('message', (message: Message) => {
     *   console.log(`message ${message} received`)
     * })
     *
     * @example <caption>Event:friend </caption>
     * bot.on('friend', (contact: Contact, request: FriendRequest) => {
     *   if(request){ // 1. request to be friend from new contact
     *     let result = await request.accept()
     *       if(result){
     *         console.log(`Request from ${contact.name()} is accept succesfully!`)
     *       } else{
     *         console.log(`Request from ${contact.name()} failed to accept!`)
     *       }
     * 	  } else { // 2. confirm friend ship
     *       console.log(`new friendship confirmed with ${contact.name()}`)
     *    }
     *  })
     *
     * @example <caption>Event:room-join </caption>
     * bot.on('room-join', (room: Room, inviteeList: Contact[], inviter: Contact) => {
     *   const nameList = inviteeList.map(c => c.name()).join(',')
     *   console.log(`Room ${room.topic()} got new member ${nameList}, invited by ${inviter}`)
     * })
     *
     * @example <caption>Event:room-leave </caption>
     * bot.on('room-leave', (room: Room, leaverList: Contact[]) => {
     *   const nameList = leaverList.map(c => c.name()).join(',')
     *   console.log(`Room ${room.topic()} lost member ${nameList}`)
     * })
     *
     * @example <caption>Event:room-topic </caption>
     * bot.on('room-topic', (room: Room, topic: string, oldTopic: string, changer: Contact) => {
     *   console.log(`Room ${room.topic()} topic changed from ${oldTopic} to ${topic} by ${changer.name()}`)
     * })
     */
    on(event, listener) {
        config_1.log.verbose('Wechaty', 'on(%s, %s) registered', event, typeof listener === 'string'
            ? listener
            : typeof listener);
        if (typeof listener === 'function') {
            this.onFunction(event, listener);
        }
        else {
            this.onModulePath(event, listener);
        }
        return this;
    }
    onModulePath(event, modulePath) {
        const absoluteFilename = hot_import_1.callerResolve(modulePath, __filename);
        config_1.log.verbose('Wechaty', 'onModulePath() hotImpor(%s)', absoluteFilename);
        hot_import_1.hotImport(absoluteFilename)
            .then((func) => super.on(event, (...args) => {
            try {
                func.apply(this, args);
            }
            catch (e) {
                config_1.log.error('Wechaty', 'onModulePath(%s, %s) listener exception: %s', event, modulePath, e);
                this.emit('error', e);
            }
        }))
            .catch(e => {
            config_1.log.error('Wechaty', 'onModulePath(%s, %s) hotImport() exception: %s', event, modulePath, e);
            this.emit('error', e);
        });
    }
    onFunction(event, listener) {
        config_1.log.verbose('Wechaty', 'onFunction(%s)', event);
        super.on(event, (...args) => {
            try {
                listener.apply(this, args);
            }
            catch (e) {
                config_1.log.error('Wechaty', 'onFunction(%s) listener exception: %s', event, e);
                this.emit('error', e);
            }
        });
    }
    /**
     * @private
     */
    initPuppet() {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.log.verbose('Wechaty', 'initPuppet()');
            let puppet;
            switch (this.options.puppet) {
                case 'web':
                    puppet = new _1.default({
                        profile: this.profile,
                    });
                    break;
                default:
                    throw new Error('Puppet unsupport(yet?): ' + this.options.puppet);
            }
            const eventList = [
                'error',
                'friend',
                'heartbeat',
                'login',
                'logout',
                'message',
                'room-join',
                'room-leave',
                'room-topic',
                'scan',
            ];
            for (const event of eventList) {
                config_1.log.verbose('Wechaty', 'initPuppet() puppet.on(%s) registered', event);
                /// e as any ??? Maybe this is a bug of TypeScript v2.5.3
                puppet.on(event, (...args) => {
                    this.emit(event, ...args);
                });
            }
            // set puppet instance to Wechaty Static variable, for using by Contact/Room/Message/FriendRequest etc.
            config_1.config.puppetInstance(puppet);
            yield puppet.init();
            return puppet;
        });
    }
    /**
     * Quit the bot
     *
     * @deprecated use stop() instead
     * @returns {Promise<void>}
     * @example
     * await bot.quit()
     */
    quit() {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.log.warn('Wechaty', 'quit() DEPRECATED and will be removed after Jun 2018. Use stop() instead.');
            yield this.stop();
        });
    }
    /**
     * Stop the bot
     *
     * @returns {Promise<void>}
     * @example
     * await bot.stop()
     */
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.log.verbose('Wechaty', 'stop()');
            if (this.state.off()) {
                if (this.state.off() === 'pending') {
                    const err = new Error(`stop() on a pending stop instance.`);
                    config_1.log.error('Wechaty', err.message);
                    this.emit('error', err);
                }
                else {
                    config_1.log.warn('Wechaty', 'stop() on an already stopped instance.');
                }
                return;
            }
            this.state.off('pending');
            if (!this.puppet) {
                config_1.log.warn('Wechaty', 'stop() without this.puppet');
                return;
            }
            const puppet = this.puppet;
            this.puppet = null;
            config_1.config.puppetInstance(null);
            try {
                yield puppet.quit();
            }
            catch (e) {
                config_1.log.error('Wechaty', 'stop() exception: %s', e.message);
                config_1.Raven.captureException(e);
                throw e;
            }
            finally {
                this.state.off(true);
                this.emit('stop');
                // MUST use setImmediate at here(the end of this function),
                // because we need to run the micro task registered by the `emit` method
                setImmediate(() => puppet.removeAllListeners());
            }
            return;
        });
    }
    /**
     * Logout the bot
     *
     * @returns {Promise<void>}
     * @example
     * await bot.logout()
     */
    logout() {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.log.verbose('Wechaty', 'logout()');
            if (!this.puppet) {
                throw new Error('no puppet');
            }
            try {
                yield this.puppet.logout();
            }
            catch (e) {
                config_1.log.error('Wechaty', 'logout() exception: %s', e.message);
                config_1.Raven.captureException(e);
                throw e;
            }
            return;
        });
    }
    /**
     * Get the logon / logoff state
     *
     * @returns {boolean}
     * @example
     * if (bot.logonoff()) {
     *   console.log('Bot logined')
     * } else {
     *   console.log('Bot not logined')
     * }
     */
    logonoff() {
        if (!this.puppet) {
            return false;
        }
        return this.puppet.logonoff();
    }
    /**
     * Get current user
     *
     * @returns {Contact}
     * @example
     * const contact = bot.self()
     * console.log(`Bot is ${contact.name()}`)
     */
    self() {
        if (!this.puppet) {
            throw new Error('Wechaty.self() no puppet');
        }
        return this.puppet.self();
    }
    /**
     * @private
     */
    send(message) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.puppet) {
                throw new Error('no puppet');
            }
            try {
                return yield this.puppet.send(message);
            }
            catch (e) {
                config_1.log.error('Wechaty', 'send() exception: %s', e.message);
                config_1.Raven.captureException(e);
                throw e;
            }
        });
    }
    /**
     * Send message to filehelper
     *
     * @param {string} content
     * @returns {Promise<boolean>}
     */
    say(content) {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.log.verbose('Wechaty', 'say(%s)', content);
            if (!this.puppet) {
                throw new Error('no puppet');
            }
            return yield this.puppet.say(content);
        });
    }
    /**
     * @private
     */
    static sleep(millisecond) {
        return __awaiter(this, void 0, void 0, function* () {
            yield new Promise(resolve => {
                setTimeout(resolve, millisecond);
            });
        });
    }
    /**
     * @private
     */
    ding() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.puppet) {
                return Promise.reject(new Error('wechaty cant ding coz no puppet'));
            }
            try {
                return yield this.puppet.ding(); // should return 'dong'
            }
            catch (e) {
                config_1.log.error('Wechaty', 'ding() exception: %s', e.message);
                config_1.Raven.captureException(e);
                throw e;
            }
        });
    }
    /**
     * @private
     */
    memoryCheck(minMegabyte = 4) {
        const freeMegabyte = Math.floor(os.freemem() / 1024 / 1024);
        config_1.log.silly('Wechaty', 'memoryCheck() free: %d MB, require: %d MB', freeMegabyte, minMegabyte);
        if (freeMegabyte < minMegabyte) {
            const e = new Error(`memory not enough: free ${freeMegabyte} < require ${minMegabyte} MB`);
            config_1.log.warn('Wechaty', 'memoryCheck() %s', e.message);
            this.emit('error', e);
        }
    }
    /**
     * @private
     */
    reset(reason) {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.log.verbose('Wechaty', 'reset() because %s', reason);
            if (!this.puppet) {
                throw new Error('no puppet');
            }
            yield this.puppet.reset(reason);
            return;
        });
    }
}
exports.Wechaty = Wechaty;
exports.default = Wechaty;
//# sourceMappingURL=wechaty.js.map