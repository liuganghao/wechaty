"use strict";
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
 * Wechaty bot use a Tuling123.com brain
 *
 * Apply your own tuling123.com API_KEY
 * at: http://www.tuling123.com/html/doc/api.html
 *
 * Enjoy!
 */
/* tslint:disable:no-var-requires */
/* tslint:disable:variable-name */
const qrcodeTerminal = require('qrcode-terminal');
const Tuling123 = require('tuling123-client');
/**
 * Change `import { ... } from '../'`
 * to     `import { ... } from 'wechaty'`
 * when you are runing with Docker or NPM instead of Git Source.
 */
const index_1 = require("./index");
// log.level = 'verbose'
// log.level = 'silly'
/**
 *
 * Apply Your Own Tuling123 Developer API_KEY at:
 * http://www.tuling123.com
 *
 */
const TULING123_API_KEY = '18f25157e0446df58ade098479f74b21';
const tuling = new Tuling123(TULING123_API_KEY);
const bot = index_1.Wechaty.instance({ profile: index_1.config.default.DEFAULT_PROFILE });
console.log(`
Welcome to Tuling Wechaty Bot.
Tuling API: http://www.tuling123.com/html/doc/api.html

Notice: This bot will only active in the room which name contains 'wechaty'.
/* if (/Wechaty/i.test(room.get('name'))) { */

Loading...
`);
bot
    .on('login', user => index_1.log.info('Bot', `bot login: ${user}`))
    .on('logout', e => index_1.log.info('Bot', 'bot logout.'))
    .on('scan', (url, code) => {
    if (!/201|200/.test(String(code))) {
        const loginUrl = url.replace(/\/qrcode\//, '/l/');
        qrcodeTerminal.generate(loginUrl);
    }
    console.log(`${url}\n[${code}] Scan QR Code in above url to login: `);
})
    .on('message', (msg) => __awaiter(this, void 0, void 0, function* () {
    // Skip message from self, or inside a room
    if (msg.self() || msg.room())
        return;
    index_1.log.info('Bot', 'talk: %s', msg);
    try {
        const { text: reply } = yield tuling.ask(msg.content(), { userid: msg.from() });
        index_1.log.info('Tuling123', 'Talker reply:"%s" for "%s" ', reply, msg.content());
        msg.say(reply);
    }
    catch (e) {
        index_1.log.error('Bot', 'on message tuling.ask() exception: %s', e && e.message || e);
    }
}));
bot.start()
    .catch(e => {
    index_1.log.error('Bot', 'start() fail:' + e);
    bot.stop();
    process.exit(-1);
});
//# sourceMappingURL=main.js.map