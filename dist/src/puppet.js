"use strict";
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
const state_switch_1 = require("state-switch");
const config_1 = require("./config");
/**
 * Abstract Puppet Class
 */
class Puppet extends events_1.EventEmitter {
    constructor(options) {
        super();
        this.options = options;
        this.state = new state_switch_1.StateSwitch('Puppet', config_1.log);
    }
    emit(event, ...args) {
        return super.emit(event, ...args);
    }
    on(event, listener) {
        super.on(event, listener);
        return this;
    }
}
exports.Puppet = Puppet;
/**
 * <error>
 *  <ret>1203</ret>
 *  <message>当前登录环境异常。为了你的帐号安全，暂时不能登录web微信。你可以通过手机客户端或者windows微信登录。</message>
 * </error>
 */
// export enum WechatErrorCode {
//   WebBlock = 1203,
// }
// export class WechatError extends Error {
//   public code: WechatErrorCode
// }
exports.default = Puppet;
//# sourceMappingURL=puppet.js.map