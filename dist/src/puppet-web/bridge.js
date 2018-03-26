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
const events_1 = require("events");
const fs = require("fs");
const path = require("path");
const puppeteer_1 = require("puppeteer");
const state_switch_1 = require("state-switch");
const xml2js_1 = require("xml2js");
/* tslint:disable:no-var-requires */
const retryPromise = require('retry-promise').default;
const config_1 = require("../config");
const misc_1 = require("../misc");
class Bridge extends events_1.EventEmitter {
    constructor(options) {
        super();
        this.options = options;
        config_1.log.verbose('PuppetWebBridge', 'constructor()');
        this.state = new state_switch_1.default('PuppetWebBridge', config_1.log);
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.log.verbose('PuppetWebBridge', 'init()');
            this.state.on('pending');
            try {
                this.browser = yield this.initBrowser();
                config_1.log.verbose('PuppetWebBridge', 'init() initBrowser() done');
                this.on('load', this.onLoad.bind(this));
                const ready = new Promise(resolve => this.once('ready', resolve));
                this.page = yield this.initPage(this.browser);
                yield ready;
                this.state.on(true);
                config_1.log.verbose('PuppetWebBridge', 'init() initPage() done');
            }
            catch (e) {
                config_1.log.error('PuppetWebBridge', 'init() exception: %s', e);
                this.state.off(true);
                try {
                    if (this.page) {
                        yield this.page.close();
                    }
                    if (this.browser) {
                        yield this.browser.close();
                    }
                }
                catch (e2) {
                    config_1.log.error('PuppetWebBridge', 'init() exception %s, close page/browser exception %s', e, e2);
                }
                this.emit('error', e);
                throw e;
            }
        });
    }
    initBrowser() {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.log.verbose('PuppetWebBridge', 'initBrowser()');
            let opt = {};
            if (this.options.profile.obj.browser) {
                opt.headless = this.options.profile.obj.browser.headless ? this.options.profile.obj.browser.headless : false;
                if (this.options.profile.obj.browser.args)
                    opt.args = this.options.profile.obj.browser.args;
            }
            else {
                opt.headless = true;
            }
            if (opt.headless && !opt.args)
                opt.args = [
                    '--audio-output-channels=0',
                    '--disable-default-apps',
                    '--disable-extensions',
                    '--disable-translate',
                    '--disable-gpu',
                    '--disable-setuid-sandbox',
                    '--disable-sync',
                    '--hide-scrollbars',
                    '--mute-audio',
                    '--no-sandbox',
                ];
            const browser = yield puppeteer_1.launch(opt);
            const version = yield browser.version();
            config_1.log.verbose('PUppetWebBridge', 'initBrowser() version: %s', version);
            return browser;
        });
    }
    onDialog(dialog) {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.log.warn('PuppetWebBridge', 'init() page.on(dialog) type:%s message:%s', dialog.type, dialog.message());
            try {
                // XXX: Which ONE is better?
                yield dialog.accept();
                // await dialog.dismiss()
            }
            catch (e) {
                config_1.log.error('PuppetWebBridge', 'init() dialog.dismiss() reject: %s', e);
            }
            this.emit('error', new Error(`${dialog.type}(${dialog.message()})`));
        });
    }
    onLoad(page) {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.log.verbose('PuppetWebBridge', 'initPage() on(load) %s', page.url());
            if (this.state.off()) {
                config_1.log.verbose('PuppetWebBridge', 'initPage() onLoad() OFF state detected. NOP');
                return; // reject(new Error('onLoad() OFF state detected'))
            }
            try {
                const emitExist = yield page.evaluate(() => {
                    return typeof window['emit'] === 'function';
                });
                if (!emitExist) {
                    yield page.exposeFunction('emit', this.emit.bind(this));
                }
                yield this.readyAngular(page);
                yield this.inject(page);
                yield this.clickSwitchAccount(page);
                this.emit('ready');
            }
            catch (e) {
                config_1.log.error('PuppetWebBridge', 'init() initPage() onLoad() exception: %s', e);
                yield page.close();
                this.emit('error', e);
            }
        });
    }
    initPage(browser) {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.log.verbose('PuppetWebBridge', 'initPage()');
            // set this in time because the following callbacks
            // might be called before initPage() return.
            const page = this.page = yield browser.newPage();
            if (this.options.profile.obj.browser && this.options.profile.obj.browser.viewpoint)
                yield page.setViewport(this.options.profile.obj.browser.viewpoint);
            page.on('error', e => this.emit('error', e));
            page.on('dialog', this.onDialog.bind(this));
            const cookieList = this.options.profile.get('cookies');
            const url = this.entryUrl(cookieList);
            config_1.log.verbose('PuppetWebBridge', 'initPage() before page.goto(url)');
            yield page.goto(url); // Does this related to(?) the CI Error: exception: Navigation Timeout Exceeded: 30000ms exceeded
            config_1.log.verbose('PuppetWebBridge', 'initPage() after page.goto(url)');
            if (cookieList && cookieList.length) {
                yield page.setCookie(...cookieList);
                config_1.log.silly('PuppetWebBridge', 'initPage() page.setCookie() %s cookies set back', cookieList.length);
            }
            page.on('load', () => this.emit('load', page));
            yield page.reload(); // reload page to make effect of the new cookie.
            return page;
        });
    }
    readyAngular(page) {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.log.verbose('PuppetWebBridge', 'readyAngular()');
            try {
                yield page.waitForFunction(`typeof window.angular !== 'undefined'`);
            }
            catch (e) {
                config_1.log.verbose('PuppetWebBridge', 'readyAngular() exception: %s', e);
                const blockedMessage = yield this.testBlockedMessage();
                if (blockedMessage) {
                    throw new Error(blockedMessage);
                }
                else {
                    throw e;
                }
            }
        });
    }
    inject(page) {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.log.verbose('PuppetWebBridge', 'inject()');
            const WECHATY_BRO_JS_FILE = path.join(__dirname, 'wechaty-bro.js');
            try {
                const sourceCode = fs.readFileSync(WECHATY_BRO_JS_FILE)
                    .toString();
                let retObj = yield page.evaluate(sourceCode);
                if (retObj && /^(2|3)/.test(retObj.code.toString())) {
                    // HTTP Code 2XX & 3XX
                    config_1.log.silly('PuppetWebBridge', 'inject() eval(Wechaty) return code[%d] message[%s]', retObj.code, retObj.message);
                }
                else {
                    throw new Error('execute injectio error: ' + retObj.code + ', ' + retObj.message);
                }
                retObj = yield this.proxyWechaty('init');
                if (retObj && /^(2|3)/.test(retObj.code.toString())) {
                    // HTTP Code 2XX & 3XX
                    config_1.log.silly('PuppetWebBridge', 'inject() Wechaty.init() return code[%d] message[%s]', retObj.code, retObj.message);
                }
                else {
                    throw new Error('execute proxyWechaty(init) error: ' + retObj.code + ', ' + retObj.message);
                }
                const SUCCESS_CIPHER = 'ding() OK!';
                const r = yield this.ding(SUCCESS_CIPHER);
                if (r !== SUCCESS_CIPHER) {
                    throw new Error('fail to get right return from call ding()');
                }
                config_1.log.silly('PuppetWebBridge', 'inject() ding success');
            }
            catch (e) {
                config_1.log.verbose('PuppetWebBridge', 'inject() exception: %s. stack: %s', e.message, e.stack);
                throw e;
            }
        });
    }
    logout() {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.log.verbose('PuppetWebBridge', 'logout()');
            try {
                return yield this.proxyWechaty('logout');
            }
            catch (e) {
                config_1.log.error('PuppetWebBridge', 'logout() exception: %s', e.message);
                throw e;
            }
        });
    }
    quit() {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.log.verbose('PuppetWebBridge', 'quit()');
            this.state.off('pending');
            try {
                yield this.page.close();
                config_1.log.silly('PuppetWebBridge', 'quit() page.close()-ed');
            }
            catch (e) {
                config_1.log.warn('PuppetWebBridge', 'quit() page.close() exception: %s', e);
            }
            try {
                yield this.browser.close();
                config_1.log.silly('PuppetWebBridge', 'quit() browser.close()-ed');
            }
            catch (e) {
                config_1.log.warn('PuppetWebBridge', 'quit() browser.close() exception: %s', e);
            }
            this.state.off(true);
        });
    }
    getUserName() {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.log.verbose('PuppetWebBridge', 'getUserName()');
            try {
                const userName = yield this.proxyWechaty('getUserName');
                return userName;
            }
            catch (e) {
                config_1.log.error('PuppetWebBridge', 'getUserName() exception: %s', e.message);
                throw e;
            }
        });
    }
    contactRemark(contactId, remark) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.proxyWechaty('contactRemark', contactId, remark);
            }
            catch (e) {
                config_1.log.verbose('PuppetWebBridge', 'contactRemark() exception: %s', e.message);
                // Issue #509 return false instead of throw when contact is not a friend.
                // throw e
                config_1.log.warn('PuppetWebBridge', 'contactRemark() does not work on contact is not a friend');
                return false;
            }
        });
    }
    contactFind(filterFunc) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.proxyWechaty('contactFind', filterFunc);
            }
            catch (e) {
                config_1.log.error('PuppetWebBridge', 'contactFind() exception: %s', e.message);
                throw e;
            }
        });
    }
    roomFind(filterFunc) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.proxyWechaty('roomFind', filterFunc);
            }
            catch (e) {
                config_1.log.error('PuppetWebBridge', 'roomFind() exception: %s', e.message);
                throw e;
            }
        });
    }
    roomDelMember(roomId, contactId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!roomId || !contactId) {
                throw new Error('no roomId or contactId');
            }
            try {
                return yield this.proxyWechaty('roomDelMember', roomId, contactId);
            }
            catch (e) {
                config_1.log.error('PuppetWebBridge', 'roomDelMember(%s, %s) exception: %s', roomId, contactId, e.message);
                throw e;
            }
        });
    }
    roomAddMember(roomId, contactId) {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.log.verbose('PuppetWebBridge', 'roomAddMember(%s, %s)', roomId, contactId);
            if (!roomId || !contactId) {
                throw new Error('no roomId or contactId');
            }
            try {
                return yield this.proxyWechaty('roomAddMember', roomId, contactId);
            }
            catch (e) {
                config_1.log.error('PuppetWebBridge', 'roomAddMember(%s, %s) exception: %s', roomId, contactId, e.message);
                throw e;
            }
        });
    }
    roomModTopic(roomId, topic) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!roomId) {
                throw new Error('no roomId');
            }
            try {
                yield this.proxyWechaty('roomModTopic', roomId, topic);
                return topic;
            }
            catch (e) {
                config_1.log.error('PuppetWebBridge', 'roomModTopic(%s, %s) exception: %s', roomId, topic, e.message);
                throw e;
            }
        });
    }
    roomCreate(contactIdList, topic) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!contactIdList || !Array.isArray(contactIdList)) {
                throw new Error('no valid contactIdList');
            }
            try {
                const roomId = yield this.proxyWechaty('roomCreate', contactIdList, topic);
                if (typeof roomId === 'object') {
                    // It is a Error Object send back by callback in browser(WechatyBro)
                    throw roomId;
                }
                return roomId;
            }
            catch (e) {
                config_1.log.error('PuppetWebBridge', 'roomCreate(%s) exception: %s', contactIdList, e.message);
                throw e;
            }
        });
    }
    verifyUserRequest(contactId, hello) {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.log.verbose('PuppetWebBridge', 'verifyUserRequest(%s, %s)', contactId, hello);
            if (!contactId) {
                throw new Error('no valid contactId');
            }
            try {
                return yield this.proxyWechaty('verifyUserRequest', contactId, hello);
            }
            catch (e) {
                config_1.log.error('PuppetWebBridge', 'verifyUserRequest(%s, %s) exception: %s', contactId, hello, e.message);
                throw e;
            }
        });
    }
    verifyUserOk(contactId, ticket) {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.log.verbose('PuppetWebBridge', 'verifyUserOk(%s, %s)', contactId, ticket);
            if (!contactId || !ticket) {
                throw new Error('no valid contactId or ticket');
            }
            try {
                return yield this.proxyWechaty('verifyUserOk', contactId, ticket);
            }
            catch (e) {
                config_1.log.error('PuppetWebBridge', 'verifyUserOk(%s, %s) exception: %s', contactId, ticket, e.message);
                throw e;
            }
        });
    }
    send(toUserName, content) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!toUserName) {
                throw new Error('UserName not found');
            }
            if (!content) {
                throw new Error('cannot say nothing');
            }
            try {
                return yield this.proxyWechaty('send', toUserName, content);
            }
            catch (e) {
                config_1.log.error('PuppetWebBridge', 'send() exception: %s', e.message);
                throw e;
            }
        });
    }
    getMsgImg(id) {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.log.verbose('PuppetWebBridge', 'getMsgImg(%s)', id);
            try {
                return yield this.proxyWechaty('getMsgImg', id);
            }
            catch (e) {
                config_1.log.silly('PuppetWebBridge', 'proxyWechaty(getMsgImg, %d) exception: %s', id, e.message);
                throw e;
            }
        });
    }
    getMsgEmoticon(id) {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.log.verbose('PuppetWebBridge', 'getMsgEmoticon(%s)', id);
            try {
                return yield this.proxyWechaty('getMsgEmoticon', id);
            }
            catch (e) {
                config_1.log.silly('PuppetWebBridge', 'proxyWechaty(getMsgEmoticon, %d) exception: %s', id, e.message);
                throw e;
            }
        });
    }
    getMsgVideo(id) {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.log.verbose('PuppetWebBridge', 'getMsgVideo(%s)', id);
            try {
                return yield this.proxyWechaty('getMsgVideo', id);
            }
            catch (e) {
                config_1.log.silly('PuppetWebBridge', 'proxyWechaty(getMsgVideo, %d) exception: %s', id, e.message);
                throw e;
            }
        });
    }
    getMsgVoice(id) {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.log.verbose('PuppetWebBridge', 'getMsgVoice(%s)', id);
            try {
                return yield this.proxyWechaty('getMsgVoice', id);
            }
            catch (e) {
                config_1.log.silly('PuppetWebBridge', 'proxyWechaty(getMsgVoice, %d) exception: %s', id, e.message);
                throw e;
            }
        });
    }
    getMsgPublicLinkImg(id) {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.log.verbose('PuppetWebBridge', 'getMsgPublicLinkImg(%s)', id);
            try {
                return yield this.proxyWechaty('getMsgPublicLinkImg', id);
            }
            catch (e) {
                config_1.log.silly('PuppetWebBridge', 'proxyWechaty(getMsgPublicLinkImg, %d) exception: %s', id, e.message);
                throw e;
            }
        });
    }
    getContact(id) {
        return __awaiter(this, void 0, void 0, function* () {
            if (id !== id) {
                const err = new Error('NaN! where does it come from?');
                config_1.log.error('PuppetWebBridge', 'getContact(NaN): %s', err);
                throw err;
            }
            const max = 35;
            const backoff = 500;
            // max = (2*totalTime/backoff) ^ (1/2)
            // timeout = 11,250 for {max: 15, backoff: 100}
            // timeout = 45,000 for {max: 30, backoff: 100}
            // timeout = 30,6250 for {max: 35, backoff: 500}
            const timeout = max * (backoff * max) / 2;
            try {
                return yield retryPromise({ max: max, backoff: backoff }, (attempt) => __awaiter(this, void 0, void 0, function* () {
                    config_1.log.silly('PuppetWebBridge', 'getContact() retryPromise: attampt %s/%s time for timeout %s', attempt, max, timeout);
                    try {
                        const r = yield this.proxyWechaty('getContact', id);
                        if (r) {
                            return r;
                        }
                        throw new Error('got empty return value at attempt: ' + attempt);
                    }
                    catch (e) {
                        config_1.log.silly('PuppetWebBridge', 'proxyWechaty(getContact, %s) exception: %s', id, e.message);
                        throw e;
                    }
                }));
            }
            catch (e) {
                config_1.log.warn('PuppetWebBridge', 'retryPromise() getContact() finally FAIL: %s', e.message);
                throw e;
            }
            /////////////////////////////////
        });
    }
    getBaseRequest() {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.log.verbose('PuppetWebBridge', 'getBaseRequest()');
            try {
                return yield this.proxyWechaty('getBaseRequest');
            }
            catch (e) {
                config_1.log.silly('PuppetWebBridge', 'proxyWechaty(getBaseRequest) exception: %s', e.message);
                throw e;
            }
        });
    }
    getPassticket() {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.log.verbose('PuppetWebBridge', 'getPassticket()');
            try {
                return yield this.proxyWechaty('getPassticket');
            }
            catch (e) {
                config_1.log.silly('PuppetWebBridge', 'proxyWechaty(getPassticket) exception: %s', e.message);
                throw e;
            }
        });
    }
    getCheckUploadUrl() {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.log.verbose('PuppetWebBridge', 'getCheckUploadUrl()');
            try {
                return yield this.proxyWechaty('getCheckUploadUrl');
            }
            catch (e) {
                config_1.log.silly('PuppetWebBridge', 'proxyWechaty(getCheckUploadUrl) exception: %s', e.message);
                throw e;
            }
        });
    }
    getUploadMediaUrl() {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.log.verbose('PuppetWebBridge', 'getUploadMediaUrl()');
            try {
                return yield this.proxyWechaty('getUploadMediaUrl');
            }
            catch (e) {
                config_1.log.silly('PuppetWebBridge', 'proxyWechaty(getUploadMediaUrl) exception: %s', e.message);
                throw e;
            }
        });
    }
    sendMedia(mediaData) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mediaData.ToUserName) {
                throw new Error('UserName not found');
            }
            if (!mediaData.MediaId) {
                throw new Error('cannot say nothing');
            }
            try {
                return yield this.proxyWechaty('sendMedia', mediaData);
            }
            catch (e) {
                config_1.log.error('PuppetWebBridge', 'sendMedia() exception: %s', e.message);
                throw e;
            }
        });
    }
    forward(baseData, patchData) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!baseData.ToUserName) {
                throw new Error('UserName not found');
            }
            if (!patchData.MMActualContent && !patchData.MMSendContent && !patchData.Content) {
                throw new Error('cannot say nothing');
            }
            try {
                return yield this.proxyWechaty('forward', baseData, patchData);
            }
            catch (e) {
                config_1.log.error('PuppetWebBridge', 'forward() exception: %s', e.message);
                throw e;
            }
        });
    }
    /**
     * Proxy Call to Wechaty in Bridge
     */
    proxyWechaty(wechatyFunc, ...args) {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.log.silly('PuppetWebBridge', 'proxyWechaty(%s%s)', wechatyFunc, args.length
                ? ' , ' + args.join(', ')
                : '');
            try {
                const noWechaty = yield this.page.evaluate(() => {
                    return typeof WechatyBro === 'undefined';
                });
                if (noWechaty) {
                    const e = new Error('there is no WechatyBro in browser(yet)');
                    throw e;
                }
            }
            catch (e) {
                config_1.log.warn('PuppetWebBridge', 'proxyWechaty() noWechaty exception: %s', e);
                throw e;
            }
            const argsEncoded = new Buffer(encodeURIComponent(JSON.stringify(args))).toString('base64');
            // see: http://blog.sqrtthree.com/2015/08/29/utf8-to-b64/
            const argsDecoded = `JSON.parse(decodeURIComponent(window.atob('${argsEncoded}')))`;
            const wechatyScript = `
      WechatyBro
        .${wechatyFunc}
        .apply(
          undefined,
          ${argsDecoded},
        )
    `.replace(/[\n\s]+/, ' ');
            // log.silly('PuppetWebBridge', 'proxyWechaty(%s, ...args) %s', wechatyFunc, wechatyScript)
            // console.log('proxyWechaty wechatyFunc args[0]: ')
            // console.log(args[0])
            try {
                const ret = yield this.page.evaluate(wechatyScript);
                return ret;
            }
            catch (e) {
                config_1.log.verbose('PuppetWebBridge', 'proxyWechaty(%s, %s) ', wechatyFunc, args.join(', '));
                config_1.log.warn('PuppetWebBridge', 'proxyWechaty() exception: %s', e.message);
                throw e;
            }
        });
    }
    ding(data) {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.log.verbose('PuppetWebBridge', 'ding(%s)', data);
            try {
                return yield this.proxyWechaty('ding', data);
            }
            catch (e) {
                config_1.log.error('PuppetWebBridge', 'ding(%s) exception: %s', data, e.message);
                throw e;
            }
        });
    }
    preHtmlToXml(text) {
        config_1.log.verbose('PuppetWebBridge', 'preHtmlToXml()');
        const preRegex = /^<pre[^>]*>([^<]+)<\/pre>$/i;
        const matches = text.match(preRegex);
        if (!matches) {
            return text;
        }
        return misc_1.default.unescapeHtml(matches[1]);
    }
    innerHTML() {
        return __awaiter(this, void 0, void 0, function* () {
            const html = yield this.evaluate(() => {
                return document.body.innerHTML;
            });
            return html;
        });
    }
    /**
     * Throw if there's a blocked message
     */
    testBlockedMessage(text) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!text) {
                text = yield this.innerHTML();
            }
            if (!text) {
                throw new Error('testBlockedMessage() no text found!');
            }
            const textSnip = text.substr(0, 50).replace(/\n/, '');
            config_1.log.verbose('PuppetWebBridge', 'testBlockedMessage(%s)', textSnip);
            // see unit test for detail
            const tryXmlText = this.preHtmlToXml(text);
            return new Promise((resolve, reject) => {
                xml2js_1.parseString(tryXmlText, { explicitArray: false }, (err, obj) => {
                    if (err) {
                        return resolve(false);
                    }
                    if (!obj) {
                        // FIXME: when will this happen?
                        config_1.log.warn('PuppetWebBridge', 'testBlockedMessage() parseString(%s) return empty obj', textSnip);
                        return resolve(false);
                    }
                    if (!obj.error) {
                        return resolve(false);
                    }
                    const ret = +obj.error.ret;
                    const message = obj.error.message;
                    config_1.log.warn('PuppetWebBridge', 'testBlockedMessage() error.ret=%s', ret);
                    if (ret === 1203) {
                        // <error>
                        // <ret>1203</ret>
                        // <message>当前登录环境异常。为了你的帐号安全，暂时不能登录web微信。你可以通过手机客户端或者windows微信登录。</message>
                        // </error>
                        return resolve(message);
                    }
                    return resolve(message); // other error message
                });
            });
        });
    }
    clickSwitchAccount(page) {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.log.verbose('PuppetWebBridge', 'clickSwitchAccount()');
            // TODO: use page.$x() (with puppeteer v1.1 or above) to replace DIY version of listXpath() instead.
            // See: https://github.com/GoogleChrome/puppeteer/blob/v1.1.0/docs/api.md#pagexexpression
            // https://github.com/GoogleChrome/puppeteer/issues/537#issuecomment-334918553
            function listXpath(thePage, xpath) {
                return __awaiter(this, void 0, void 0, function* () {
                    config_1.log.verbose('PuppetWebBridge', 'clickSwitchAccount() listXpath()');
                    try {
                        const nodeHandleList = yield thePage.evaluateHandle(xpathInner => {
                            const nodeList = [];
                            const query = document.evaluate(xpathInner, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                            for (let i = 0, length = query.snapshotLength; i < length; ++i) {
                                nodeList.push(query.snapshotItem(i));
                            }
                            return nodeList;
                        }, xpath);
                        const properties = yield nodeHandleList.getProperties();
                        const elementHandleList = [];
                        const releasePromises = [];
                        for (const property of properties.values()) {
                            const element = property.asElement();
                            if (element)
                                elementHandleList.push(element);
                            else
                                releasePromises.push(property.dispose());
                        }
                        yield Promise.all(releasePromises);
                        return elementHandleList;
                    }
                    catch (e) {
                        config_1.log.verbose('PuppetWebBridge', 'clickSwitchAccount() listXpath() exception: %s', e);
                        return [];
                    }
                });
            }
            const XPATH_SELECTOR = `//div[contains(@class,'association') and contains(@class,'show')]/a[@ng-click='qrcodeLogin()']`;
            try {
                const [button] = yield listXpath(page, XPATH_SELECTOR);
                if (button) {
                    yield button.click();
                    config_1.log.silly('PuppetWebBridge', 'clickSwitchAccount() clicked!');
                    return true;
                }
                else {
                    // log.silly('PuppetWebBridge', 'clickSwitchAccount() button not found')
                    return false;
                }
            }
            catch (e) {
                config_1.log.silly('PuppetWebBridge', 'clickSwitchAccount() exception: %s', e);
                throw e;
            }
        });
    }
    hostname() {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.log.verbose('PuppetWebBridge', 'hostname()');
            try {
                const hostname = yield this.page.evaluate(() => location.hostname);
                config_1.log.silly('PuppetWebBridge', 'hostname() got %s', hostname);
                return hostname;
            }
            catch (e) {
                config_1.log.error('PuppetWebBridge', 'hostname() exception: %s', e);
                this.emit('error', e);
                return null;
            }
        });
    }
    cookies(cookieList) {
        return __awaiter(this, void 0, void 0, function* () {
            if (cookieList) {
                try {
                    yield this.page.setCookie(...cookieList);
                }
                catch (e) {
                    config_1.log.error('PuppetWebBridge', 'cookies(%s) reject: %s', cookieList, e);
                    this.emit('error', e);
                }
                return;
            }
            else {
                // FIXME: puppeteer typing bug
                cookieList = (yield this.page.cookies());
                return cookieList;
            }
        });
    }
    /**
     * name
     */
    entryUrl(cookieList) {
        config_1.log.verbose('PuppetWebBridge', 'cookieDomain(%s)', cookieList);
        const DEFAULT_URL = 'https://wx.qq.com';
        if (!cookieList || cookieList.length === 0) {
            config_1.log.silly('PuppetWebBridge', 'cookieDomain() no cookie, return default %s', DEFAULT_URL);
            return DEFAULT_URL;
        }
        const wxCookieList = cookieList.filter(c => /^webwx_auth_ticket|webwxuvid$/.test(c.name));
        if (!wxCookieList.length) {
            config_1.log.silly('PuppetWebBridge', 'cookieDomain() no valid cookie, return default hostname');
            return DEFAULT_URL;
        }
        let domain = wxCookieList[0].domain;
        if (!domain) {
            config_1.log.silly('PuppetWebBridge', 'cookieDomain() no valid domain in cookies, return default hostname');
            return DEFAULT_URL;
        }
        domain = domain.slice(1);
        if (domain === 'wechat.com') {
            domain = 'web.wechat.com';
        }
        let url;
        if (/^http/.test(url)) {
            url = domain;
        }
        else {
            // Protocol error (Page.navigate): Cannot navigate to invalid URL undefined
            url = `https://${domain}`;
        }
        config_1.log.silly('PuppetWebBridge', 'cookieDomain() got %s', url);
        return url;
    }
    reload() {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.log.verbose('PuppetWebBridge', 'reload()');
            yield this.page.reload();
            return;
        });
    }
    evaluate(fn, ...args) {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.log.silly('PuppetWebBridge', 'evaluate()');
            try {
                return yield this.page.evaluate(fn, ...args);
            }
            catch (e) {
                config_1.log.error('PuppetWebBridge', 'evaluate() exception: %s', e);
                this.emit('error', e);
                return null;
            }
        });
    }
}
exports.Bridge = Bridge;
exports.default = Bridge;
//# sourceMappingURL=bridge.js.map