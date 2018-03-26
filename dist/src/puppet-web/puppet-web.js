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
const watchdog_1 = require("watchdog");
const rx_queue_1 = require("rx-queue");
const config_1 = require("../config");
const contact_1 = require("../contact");
const message_1 = require("../message");
const puppet_1 = require("../puppet");
const room_1 = require("../room");
const misc_1 = require("../misc");
const bridge_1 = require("./bridge");
const event_1 = require("./event");
const request = require("request");
const bl = require("bl");
class PuppetWeb extends puppet_1.Puppet {
    constructor(options) {
        super(options);
        this.options = options;
        this.fileId = 0;
        const PUPPET_TIMEOUT = 1 * 60 * 1000; // 1 minute
        this.puppetWatchdog = new watchdog_1.Watchdog(PUPPET_TIMEOUT, 'PuppetWeb');
        const SCAN_TIMEOUT = 2 * 60 * 1000; // 2 minutes
        this.scanWatchdog = new watchdog_1.Watchdog(SCAN_TIMEOUT, 'Scan');
    }
    toString() {
        return `PuppetWeb<${this.options.profile.name}>`;
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.log.verbose('PuppetWeb', `init() with ${this.options.profile}`);
            this.state.on('pending');
            try {
                this.initWatchdogForPuppet();
                this.initWatchdogForScan();
                this.bridge = yield this.initBridge(this.options.profile);
                config_1.log.verbose('PuppetWeb', 'initBridge() done');
                /**
                 *  state must set to `live`
                 *  before feed Watchdog
                 */
                this.state.on(true);
                const food = {
                    data: 'inited',
                    timeout: 2 * 60 * 1000,
                };
                this.emit('watchdog', food);
                const throttleQueue = new rx_queue_1.ThrottleQueue(5 * 60 * 1000);
                this.on('heartbeat', data => throttleQueue.next(data));
                throttleQueue.subscribe((data) => __awaiter(this, void 0, void 0, function* () {
                    config_1.log.verbose('Wechaty', 'init() throttleQueue.subscribe() new item: %s', data);
                    yield this.saveCookie();
                }));
                config_1.log.verbose('PuppetWeb', 'init() done');
                return;
            }
            catch (e) {
                config_1.log.error('PuppetWeb', 'init() exception: %s', e);
                this.state.off(true);
                this.emit('error', e);
                yield this.quit();
                config_1.Raven.captureException(e);
                throw e;
            }
        });
    }
    initWatchdogForPuppet() {
        config_1.log.verbose('PuppetWeb', 'initWatchdogForPuppet()');
        const puppet = this;
        const dog = this.puppetWatchdog;
        // clean the dog because this could be re-inited
        dog.removeAllListeners();
        puppet.on('watchdog', food => dog.feed(food));
        dog.on('feed', food => {
            config_1.log.silly('PuppetWeb', 'initWatchdogForPuppet() dog.on(feed, food={type=%s, data=%s})', food.type, food.data);
            // feed the dog, heartbeat the puppet.
            puppet.emit('heartbeat', food.data);
        });
        dog.on('reset', (food, timeout) => __awaiter(this, void 0, void 0, function* () {
            config_1.log.warn('PuppetWeb', 'initWatchdogForPuppet() dog.on(reset) last food:%s, timeout:%s', food.data, timeout);
            try {
                yield this.quit();
                yield this.init();
            }
            catch (e) {
                puppet.emit('error', e);
            }
        }));
    }
    /**
     * Deal with SCAN events
     *
     * if web browser stay at login qrcode page long time,
     * sometimes the qrcode will not refresh, leave there expired.
     * so we need to refresh the page after a while
     */
    initWatchdogForScan() {
        config_1.log.verbose('PuppetWeb', 'initWatchdogForScan()');
        const puppet = this;
        const dog = this.scanWatchdog;
        // clean the dog because this could be re-inited
        dog.removeAllListeners();
        puppet.on('scan', info => dog.feed({
            data: info,
            type: 'scan',
        }));
        puppet.on('login', user => {
            dog.feed({
                data: user,
                type: 'login',
            });
            // do not monitor `scan` event anymore
            // after user login
            dog.sleep();
        });
        // active monitor again for `scan` event
        puppet.on('logout', user => dog.feed({
            data: user,
            type: 'logout',
        }));
        dog.on('reset', (food, timePast) => __awaiter(this, void 0, void 0, function* () {
            config_1.log.warn('PuppetWeb', 'initScanWatchdog() on(reset) lastFood: %s, timePast: %s', food.data, timePast);
            try {
                yield this.bridge.reload();
            }
            catch (e) {
                config_1.log.error('PuppetWeb', 'initScanWatchdog() on(reset) exception: %s', e);
                try {
                    config_1.log.error('PuppetWeb', 'initScanWatchdog() on(reset) try to recover by bridge.{quit,init}()', e);
                    yield this.bridge.quit();
                    yield this.bridge.init();
                    config_1.log.error('PuppetWeb', 'initScanWatchdog() on(reset) recover successful');
                }
                catch (e) {
                    config_1.log.error('PuppetWeb', 'initScanWatchdog() on(reset) recover FAIL: %s', e);
                    this.emit('error', e);
                }
            }
        }));
    }
    quit() {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.log.verbose('PuppetWeb', 'quit()');
            const off = this.state.off();
            if (off === 'pending') {
                const e = new Error('quit() is called on a PENDING OFF PuppetWeb');
                config_1.log.warn('PuppetWeb', e.message);
                this.emit('error', e);
                return;
            }
            else if (off === true) {
                config_1.log.warn('PuppetWeb', 'quit() is called on a OFF puppet. return directly.');
                return;
            }
            config_1.log.verbose('PuppetWeb', 'quit() make watchdog sleep before do quit');
            this.puppetWatchdog.sleep();
            this.scanWatchdog.sleep();
            this.state.off('pending');
            try {
                yield this.bridge.quit();
                // register the removeListeners micro task at then end of the task queue
                setImmediate(() => this.bridge.removeAllListeners());
            }
            catch (e) {
                config_1.log.error('PuppetWeb', 'quit() exception: %s', e.message);
                config_1.Raven.captureException(e);
                throw e;
            }
            finally {
                this.state.off(true);
            }
        });
    }
    initBridge(profile) {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.log.verbose('PuppetWeb', 'initBridge()');
            if (this.state.off()) {
                const e = new Error('initBridge() found targetState != live, no init anymore');
                config_1.log.warn('PuppetWeb', e.message);
                throw e;
            }
            const head = config_1.config.head;
            // we have to set this.bridge right now,
            // because the Event.onXXX might arrive while we are initializing.
            this.bridge = new bridge_1.Bridge({
                head,
                profile,
            });
            this.bridge.on('ding', event_1.default.onDing.bind(this));
            this.bridge.on('error', e => this.emit('error', e));
            this.bridge.on('log', event_1.default.onLog.bind(this));
            this.bridge.on('login', event_1.default.onLogin.bind(this));
            this.bridge.on('logout', event_1.default.onLogout.bind(this));
            this.bridge.on('message', event_1.default.onMessage.bind(this));
            this.bridge.on('scan', event_1.default.onScan.bind(this));
            this.bridge.on('unload', event_1.default.onUnload.bind(this));
            try {
                yield this.bridge.init();
            }
            catch (e) {
                config_1.log.error('PuppetWeb', 'initBridge() exception: %s', e.message);
                yield this.bridge.quit().catch(console.error);
                this.emit('error', e);
                config_1.Raven.captureException(e);
                throw e;
            }
            return this.bridge;
        });
    }
    reset(reason) {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.log.verbose('PuppetWeb', 'reset(%s)', reason);
            try {
                yield this.bridge.quit();
                yield this.bridge.init();
                config_1.log.silly('PuppetWeb', 'reset() done');
            }
            catch (err) {
                config_1.log.error('PuppetWeb', 'reset(%s) bridge.{quit,init}() exception: %s', reason, err);
                this.emit('error', err);
            }
        });
    }
    logined() {
        config_1.log.warn('PuppetWeb', 'logined() DEPRECATED. use logonoff() instead.');
        return this.logonoff();
    }
    logonoff() {
        return !!(this.user);
    }
    /**
     * get self contact
     */
    self() {
        config_1.log.verbose('PuppetWeb', 'self()');
        if (this.user) {
            return this.user;
        }
        throw new Error('PuppetWeb.self() no this.user');
    }
    getBaseRequest() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const json = yield this.bridge.getBaseRequest();
                const obj = JSON.parse(json);
                return obj.BaseRequest;
            }
            catch (e) {
                config_1.log.error('PuppetWeb', 'send() exception: %s', e.message);
                config_1.Raven.captureException(e);
                throw e;
            }
        });
    }
    uploadMedia(mediaMessage, toUserName) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mediaMessage)
                throw new Error('require mediaMessage');
            const filename = mediaMessage.filename();
            const ext = mediaMessage.ext();
            // const contentType = Misc.mime(ext)
            // const contentType = mime.getType(ext)
            const contentType = mediaMessage.mimeType();
            if (!contentType) {
                throw new Error('no MIME Type found on mediaMessage: ' + mediaMessage.filename());
            }
            let mediatype;
            switch (ext) {
                case 'bmp':
                case 'jpeg':
                case 'jpg':
                case 'png':
                case 'gif':
                    mediatype = 1 /* IMAGE */;
                    break;
                case 'mp4':
                    mediatype = 2 /* VIDEO */;
                    break;
                default:
                    mediatype = 4 /* ATTACHMENT */;
            }
            const readStream = yield mediaMessage.readyStream();
            const buffer = yield new Promise((resolve, reject) => {
                readStream.pipe(bl((err, data) => {
                    if (err)
                        reject(err);
                    else
                        resolve(data);
                }));
            });
            // Sending video files is not allowed to exceed 20MB
            // https://github.com/Chatie/webwx-app-tracker/blob/7c59d35c6ea0cff38426a4c5c912a086c4c512b2/formatted/webwxApp.js#L1115
            const MAX_FILE_SIZE = 100 * 1024 * 1024;
            const LARGE_FILE_SIZE = 25 * 1024 * 1024;
            const MAX_VIDEO_SIZE = 20 * 1024 * 1024;
            if (mediatype === 2 /* VIDEO */ && buffer.length > MAX_VIDEO_SIZE)
                throw new Error(`Sending video files is not allowed to exceed ${MAX_VIDEO_SIZE / 1024 / 1024}MB`);
            if (buffer.length > MAX_FILE_SIZE) {
                throw new Error(`Sending files is not allowed to exceed ${MAX_FILE_SIZE / 1024 / 1024}MB`);
            }
            const md5 = misc_1.default.md5(buffer);
            const baseRequest = yield this.getBaseRequest();
            const passTicket = yield this.bridge.getPassticket();
            const uploadMediaUrl = yield this.bridge.getUploadMediaUrl();
            const checkUploadUrl = yield this.bridge.getCheckUploadUrl();
            const cookie = yield this.bridge.cookies();
            const first = cookie.find(c => c.name === 'webwx_data_ticket');
            const webwxDataTicket = first && first.value;
            const size = buffer.length;
            const fromUserName = this.self().id;
            const id = 'WU_FILE_' + this.fileId;
            this.fileId++;
            const hostname = yield this.bridge.hostname();
            const headers = {
                Referer: `https://${hostname}`,
                'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.102 Safari/537.36',
                Cookie: cookie.map(c => c.name + '=' + c.value).join('; '),
            };
            config_1.log.silly('PuppetWeb', 'uploadMedia() headers:%s', JSON.stringify(headers));
            const uploadMediaRequest = {
                BaseRequest: baseRequest,
                FileMd5: md5,
                FromUserName: fromUserName,
                ToUserName: toUserName,
                UploadType: 2,
                ClientMediaId: +new Date,
                MediaType: 4 /* ATTACHMENT */,
                StartPos: 0,
                DataLen: size,
                TotalLen: size,
                Signature: '',
                AESKey: '',
            };
            const checkData = {
                BaseRequest: baseRequest,
                FromUserName: fromUserName,
                ToUserName: toUserName,
                FileName: filename,
                FileSize: size,
                FileMd5: md5,
                FileType: 7,
            };
            const mediaData = {
                ToUserName: toUserName,
                MediaId: '',
                FileName: filename,
                FileSize: size,
                FileMd5: md5,
                MMFileExt: ext,
            };
            // If file size > 25M, must first call checkUpload to get Signature and AESKey, otherwise it will fail to upload
            // https://github.com/Chatie/webwx-app-tracker/blob/7c59d35c6ea0cff38426a4c5c912a086c4c512b2/formatted/webwxApp.js#L1132 #1182
            if (size > LARGE_FILE_SIZE) {
                let ret;
                try {
                    ret = (yield new Promise((resolve, reject) => {
                        const r = {
                            url: `https://${hostname}${checkUploadUrl}`,
                            headers,
                            json: checkData,
                        };
                        request.post(r, function (err, res, body) {
                            try {
                                if (err) {
                                    reject(err);
                                }
                                else {
                                    let obj = body;
                                    if (typeof body !== 'object') {
                                        config_1.log.silly('PuppetWeb', 'updateMedia() typeof body = %s', typeof body);
                                        try {
                                            obj = JSON.parse(body);
                                        }
                                        catch (e) {
                                            config_1.log.error('PuppetWeb', 'updateMedia() body = %s', body);
                                            config_1.log.error('PuppetWeb', 'updateMedia() exception: %s', e);
                                            this.emit('error', e);
                                        }
                                    }
                                    if (typeof obj !== 'object' || obj.BaseResponse.Ret !== 0) {
                                        const errMsg = obj.BaseResponse || 'api return err';
                                        config_1.log.silly('PuppetWeb', 'uploadMedia() checkUpload err:%s \nreq:%s\nret:%s', JSON.stringify(errMsg), JSON.stringify(r), body);
                                        reject(new Error('chackUpload err:' + JSON.stringify(errMsg)));
                                    }
                                    resolve({
                                        Signature: obj.Signature,
                                        AESKey: obj.AESKey,
                                    });
                                }
                            }
                            catch (e) {
                                reject(e);
                            }
                        });
                    }));
                }
                catch (e) {
                    config_1.log.error('PuppetWeb', 'uploadMedia() checkUpload exception: %s', e.message);
                    throw e;
                }
                if (!ret.Signature) {
                    config_1.log.error('PuppetWeb', 'uploadMedia(): chackUpload failed to get Signature');
                    throw new Error('chackUpload failed to get Signature');
                }
                uploadMediaRequest.Signature = ret.Signature;
                uploadMediaRequest.AESKey = ret.AESKey;
                mediaData.Signature = ret.Signature;
            }
            else {
                delete uploadMediaRequest.Signature;
                delete uploadMediaRequest.AESKey;
            }
            config_1.log.verbose('PuppetWeb', 'uploadMedia() webwx_data_ticket: %s', webwxDataTicket);
            config_1.log.verbose('PuppetWeb', 'uploadMedia() pass_ticket: %s', passTicket);
            const formData = {
                id,
                name: filename,
                type: contentType,
                lastModifiedDate: Date().toString(),
                size,
                mediatype,
                uploadmediarequest: JSON.stringify(uploadMediaRequest),
                webwx_data_ticket: webwxDataTicket,
                pass_ticket: passTicket || '',
                filename: {
                    value: buffer,
                    options: {
                        filename,
                        contentType,
                        size,
                    },
                },
            };
            let mediaId;
            try {
                mediaId = (yield new Promise((resolve, reject) => {
                    try {
                        request.post({
                            url: uploadMediaUrl + '?f=json',
                            headers,
                            formData,
                        }, function (err, res, body) {
                            if (err) {
                                reject(err);
                            }
                            else {
                                let obj = body;
                                if (typeof body !== 'object') {
                                    obj = JSON.parse(body);
                                }
                                resolve(obj.MediaId || '');
                            }
                        });
                    }
                    catch (e) {
                        reject(e);
                    }
                }));
            }
            catch (e) {
                config_1.log.error('PuppetWeb', 'uploadMedia() uploadMedia exception: %s', e.message);
                throw new Error('uploadMedia err: ' + e.message);
            }
            if (!mediaId) {
                config_1.log.error('PuppetWeb', 'uploadMedia(): upload fail');
                throw new Error('PuppetWeb.uploadMedia(): upload fail');
            }
            return Object.assign(mediaData, { MediaId: mediaId });
        });
    }
    sendMedia(message) {
        return __awaiter(this, void 0, void 0, function* () {
            const to = message.to();
            const room = message.room();
            let destinationId;
            if (room) {
                destinationId = room.id;
            }
            else {
                if (!to) {
                    throw new Error('PuppetWeb.sendMedia(): message with neither room nor to?');
                }
                destinationId = to.id;
            }
            let mediaData;
            const rawObj = message.rawObj;
            if (!rawObj.MediaId) {
                try {
                    mediaData = yield this.uploadMedia(message, destinationId);
                    message.rawObj = Object.assign(rawObj, mediaData);
                    config_1.log.silly('PuppetWeb', 'Upload completed, new rawObj:%s', JSON.stringify(message.rawObj));
                }
                catch (e) {
                    config_1.log.error('PuppetWeb', 'sendMedia() exception: %s', e.message);
                    return false;
                }
            }
            else {
                // To support forward file
                config_1.log.silly('PuppetWeb', 'skip upload file, rawObj:%s', JSON.stringify(rawObj));
                mediaData = {
                    ToUserName: destinationId,
                    MediaId: rawObj.MediaId,
                    MsgType: rawObj.MsgType,
                    FileName: rawObj.FileName,
                    FileSize: rawObj.FileSize,
                    MMFileExt: rawObj.MMFileExt,
                };
                if (rawObj.Signature) {
                    mediaData.Signature = rawObj.Signature;
                }
            }
            // console.log('mediaData.MsgType', mediaData.MsgType)
            // console.log('rawObj.MsgType', message.rawObj && message.rawObj.MsgType)
            mediaData.MsgType = misc_1.default.msgType(message.ext());
            config_1.log.silly('PuppetWeb', 'sendMedia() destination: %s, mediaId: %s, MsgType; %s)', destinationId, mediaData.MediaId, mediaData.MsgType);
            let ret = false;
            try {
                ret = yield this.bridge.sendMedia(mediaData);
            }
            catch (e) {
                config_1.log.error('PuppetWeb', 'sendMedia() exception: %s', e.message);
                config_1.Raven.captureException(e);
                return false;
            }
            return ret;
        });
    }
    /**
     * TODO: Test this function if it could work...
     */
    // public async forward(baseData: MsgRawObj, patchData: MsgRawObj): Promise<boolean> {
    forward(message, sendTo) {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.log.silly('PuppetWeb', 'forward() to: %s, message: %s)', sendTo, message.filename());
            if (!message.rawObj) {
                throw new Error('no rawObj');
            }
            let m = Object.assign({}, message.rawObj);
            const newMsg = {};
            const largeFileSize = 25 * 1024 * 1024;
            // let ret = false
            // if you know roomId or userId, you can use `Room.load(roomId)` or `Contact.load(userId)`
            // let sendToList: Contact[] = [].concat(sendTo as any || [])
            // sendToList = sendToList.filter(s => {
            //   if ((s instanceof Room || s instanceof Contact) && s.id) {
            //     return true
            //   }
            //   return false
            // }) as Contact[]
            // if (sendToList.length < 1) {
            //   throw new Error('param must be Room or Contact and array')
            // }
            if (m.FileSize >= largeFileSize && !m.Signature) {
                // if has RawObj.Signature, can forward the 25Mb+ file
                config_1.log.warn('MediaMessage', 'forward() Due to webWx restrictions, more than 25MB of files can not be downloaded and can not be forwarded.');
                return false;
            }
            newMsg.FromUserName = this.userId || '';
            newMsg.isTranspond = true;
            newMsg.MsgIdBeforeTranspond = m.MsgIdBeforeTranspond || m.MsgId;
            newMsg.MMSourceMsgId = m.MsgId;
            // In room msg, the content prefix sender:, need to be removed, otherwise the forwarded sender will display the source message sender, causing self () to determine the error
            newMsg.Content = misc_1.default.unescapeHtml(m.Content.replace(/^@\w+:<br\/>/, '')).replace(/^[\w\-]+:<br\/>/, '');
            newMsg.MMIsChatRoom = sendTo instanceof room_1.default ? true : false;
            // The following parameters need to be overridden after calling createMessage()
            m = Object.assign(m, newMsg);
            // for (let i = 0; i < sendToList.length; i++) {
            // newMsg.ToUserName = sendToList[i].id
            // // all call success return true
            // ret = (i === 0 ? true : ret) && await config.puppetInstance().forward(m, newMsg)
            // }
            newMsg.ToUserName = sendTo.id;
            // ret = await config.puppetInstance().forward(m, newMsg)
            // return ret
            const baseData = m;
            const patchData = newMsg;
            let ret = false;
            try {
                ret = yield this.bridge.forward(baseData, patchData);
            }
            catch (e) {
                config_1.log.error('PuppetWeb', 'forward() exception: %s', e.message);
                config_1.Raven.captureException(e);
                throw e;
            }
            return ret;
        });
    }
    send(message) {
        return __awaiter(this, void 0, void 0, function* () {
            const to = message.to();
            const room = message.room();
            let destinationId;
            if (room) {
                destinationId = room.id;
            }
            else {
                if (!to) {
                    throw new Error('PuppetWeb.send(): message with neither room nor to?');
                }
                destinationId = to.id;
            }
            let ret = false;
            if (message instanceof message_1.MediaMessage) {
                ret = yield this.sendMedia(message);
            }
            else {
                const content = message.content();
                config_1.log.silly('PuppetWeb', 'send() destination: %s, content: %s)', destinationId, content);
                try {
                    ret = yield this.bridge.send(destinationId, content);
                }
                catch (e) {
                    config_1.log.error('PuppetWeb', 'send() exception: %s', e.message);
                    config_1.Raven.captureException(e);
                    throw e;
                }
            }
            return ret;
        });
    }
    /**
     * Bot say...
     * send to `self` for notice / log
     */
    say(content) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.logonoff()) {
                throw new Error('can not say before login');
            }
            if (!content) {
                config_1.log.warn('PuppetWeb', 'say(%s) can not say nothing', content);
                return false;
            }
            if (!this.user) {
                config_1.log.warn('PuppetWeb', 'say(%s) can not say because no user', content);
                this.emit('error', new Error('no this.user for PuppetWeb'));
                return false;
            }
            // const m = new Message()
            // m.to('filehelper')
            // m.content(content)
            // return await this.send(m)
            return yield this.user.say(content);
        });
    }
    /**
     * logout from browser, then server will emit `logout` event
     */
    logout() {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.log.verbose('PuppetWeb', 'logout()');
            const data = this.user || this.userId || '';
            this.userId = this.user = null;
            try {
                yield this.bridge.logout();
                this.emit('logout', data);
            }
            catch (e) {
                config_1.log.error('PuppetWeb', 'logout() exception: %s', e.message);
                config_1.Raven.captureException(e);
                throw e;
            }
        });
    }
    getContact(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.bridge.getContact(id);
            }
            catch (e) {
                config_1.log.error('PuppetWeb', 'getContact(%d) exception: %s', id, e.message);
                config_1.Raven.captureException(e);
                throw e;
            }
        });
    }
    ding(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.bridge.ding(data);
            }
            catch (e) {
                config_1.log.warn('PuppetWeb', 'ding(%s) rejected: %s', data, e.message);
                config_1.Raven.captureException(e);
                throw e;
            }
        });
    }
    contactAlias(contact, remark) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const ret = yield this.bridge.contactRemark(contact.id, remark);
                if (!ret) {
                    config_1.log.warn('PuppetWeb', 'contactRemark(%s, %s) bridge.contactRemark() return false', contact.id, remark);
                }
                return ret;
            }
            catch (e) {
                config_1.log.warn('PuppetWeb', 'contactRemark(%s, %s) rejected: %s', contact.id, remark, e.message);
                config_1.Raven.captureException(e);
                throw e;
            }
        });
    }
    contactFind(filterFunc) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const idList = yield this.bridge.contactFind(filterFunc);
                return idList.map(id => contact_1.default.load(id));
            }
            catch (e) {
                config_1.log.warn('PuppetWeb', 'contactFind(%s) rejected: %s', filterFunc, e.message);
                config_1.Raven.captureException(e);
                throw e;
            }
        });
    }
    roomFind(filterFunc) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const idList = yield this.bridge.roomFind(filterFunc);
                return idList.map(id => room_1.default.load(id));
            }
            catch (e) {
                config_1.log.warn('PuppetWeb', 'roomFind(%s) rejected: %s', filterFunc, e.message);
                config_1.Raven.captureException(e);
                throw e;
            }
        });
    }
    roomDel(room, contact) {
        return __awaiter(this, void 0, void 0, function* () {
            const roomId = room.id;
            const contactId = contact.id;
            try {
                return yield this.bridge.roomDelMember(roomId, contactId);
            }
            catch (e) {
                config_1.log.warn('PuppetWeb', 'roomDelMember(%s, %d) rejected: %s', roomId, contactId, e.message);
                config_1.Raven.captureException(e);
                throw e;
            }
        });
    }
    roomAdd(room, contact) {
        return __awaiter(this, void 0, void 0, function* () {
            const roomId = room.id;
            const contactId = contact.id;
            try {
                return yield this.bridge.roomAddMember(roomId, contactId);
            }
            catch (e) {
                config_1.log.warn('PuppetWeb', 'roomAddMember(%s) rejected: %s', contact, e.message);
                config_1.Raven.captureException(e);
                throw e;
            }
        });
    }
    roomTopic(room, topic) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!room || typeof topic === 'undefined') {
                return Promise.reject(new Error('room or topic not found'));
            }
            const roomId = room.id;
            try {
                return yield this.bridge.roomModTopic(roomId, topic);
            }
            catch (e) {
                config_1.log.warn('PuppetWeb', 'roomTopic(%s) rejected: %s', topic, e.message);
                config_1.Raven.captureException(e);
                throw e;
            }
        });
    }
    roomCreate(contactList, topic) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!contactList || !contactList.map) {
                throw new Error('contactList not found');
            }
            const contactIdList = contactList.map(c => c.id);
            try {
                const roomId = yield this.bridge.roomCreate(contactIdList, topic);
                if (!roomId) {
                    throw new Error('PuppetWeb.roomCreate() roomId "' + roomId + '" not found');
                }
                return room_1.default.load(roomId);
            }
            catch (e) {
                config_1.log.warn('PuppetWeb', 'roomCreate(%s, %s) rejected: %s', contactIdList.join(','), topic, e.message);
                config_1.Raven.captureException(e);
                throw e;
            }
        });
    }
    /**
     * FriendRequest
     */
    friendRequestSend(contact, hello) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!contact) {
                throw new Error('contact not found');
            }
            try {
                return yield this.bridge.verifyUserRequest(contact.id, hello);
            }
            catch (e) {
                config_1.log.warn('PuppetWeb', 'bridge.verifyUserRequest(%s, %s) rejected: %s', contact.id, hello, e.message);
                config_1.Raven.captureException(e);
                throw e;
            }
        });
    }
    friendRequestAccept(contact, ticket) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!contact || !ticket) {
                throw new Error('contact or ticket not found');
            }
            try {
                return yield this.bridge.verifyUserOk(contact.id, ticket);
            }
            catch (e) {
                config_1.log.warn('PuppetWeb', 'bridge.verifyUserOk(%s, %s) rejected: %s', contact.id, ticket, e.message);
                config_1.Raven.captureException(e);
                throw e;
            }
        });
    }
    /**
     * @private
     * For issue #668
     */
    readyStable() {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.log.verbose('PuppetWeb', 'readyStable()');
            let counter = -1;
            function stable(done) {
                return __awaiter(this, void 0, void 0, function* () {
                    config_1.log.silly('PuppetWeb', 'readyStable() stable() counter=%d', counter);
                    const contactList = yield contact_1.default.findAll();
                    if (counter === contactList.length) {
                        config_1.log.verbose('PuppetWeb', 'readyStable() stable() READY counter=%d', counter);
                        return done();
                    }
                    counter = contactList.length;
                    setTimeout(() => stable(done), 1000)
                        .unref();
                });
            }
            return new Promise((resolve, reject) => {
                const timer = setTimeout(() => {
                    config_1.log.warn('PuppetWeb', 'readyStable() stable() reject at counter=%d', counter);
                    return reject(new Error('timeout after 60 seconds'));
                }, 60 * 1000);
                timer.unref();
                const done = () => {
                    clearTimeout(timer);
                    return resolve();
                };
                return stable(done);
            });
        });
    }
    hostname() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const name = yield this.bridge.hostname();
                if (!name) {
                    throw new Error('no hostname found');
                }
                return name;
            }
            catch (e) {
                config_1.log.error('PuppetWeb', 'hostname() exception:%s', e);
                this.emit('error', e);
                throw e;
            }
        });
    }
    cookies() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.bridge.cookies();
        });
    }
    saveCookie() {
        return __awaiter(this, void 0, void 0, function* () {
            const cookieList = yield this.bridge.cookies();
            this.options.profile.set('cookies', cookieList);
            this.options.profile.save();
        });
    }
}
exports.PuppetWeb = PuppetWeb;
exports.default = PuppetWeb;
//# sourceMappingURL=puppet-web.js.map