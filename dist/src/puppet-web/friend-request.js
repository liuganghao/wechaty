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
 *   @ignore
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
 * request/accept: https://github.com/wechaty/wechaty/issues/33
 *
 * 1. send request
 * 2. receive request(in friend event)
 * 3. confirmation friendship(friend event)
 * @ignore
 */
/* tslint:disable:no-var-requires */
const retryPromise = require('retry-promise').default;
const contact_1 = require("../contact");
const config_1 = require("../config");
const friend_request_1 = require("../friend-request");
/**
 * @alias FriendRequest
 */
class PuppetWebFriendRequest extends friend_request_1.default {
    constructor() {
        config_1.log.verbose('PuppetWebFriendRequest', 'constructor()');
        super();
    }
    receive(info) {
        config_1.log.verbose('PuppetWebFriendRequest', 'receive(%s)', info);
        if (!info || !info.UserName) {
            throw new Error('not valid RecommendInfo: ' + info);
        }
        this.info = info;
        const contact = contact_1.Contact.load(info.UserName);
        if (!contact) {
            config_1.log.warn('PuppetWebFriendRequest', 'receive() no contact found for "%s"', info.UserName);
            throw new Error('no contact');
        }
        this.contact = contact;
        this.hello = info.Content;
        this.ticket = info.Ticket;
        // ??? this.nick = info.NickName
        if (!this.ticket) {
            throw new Error('ticket not found');
        }
        this.type = 'receive';
        return;
    }
    confirm(contact) {
        config_1.log.verbose('PuppetWebFriendRequest', 'confirm(%s)', contact);
        if (!contact) {
            throw new Error('contact not found');
        }
        this.contact = contact;
        this.type = 'confirm';
    }
    /**
     * Send a new friend request
     * @param {Contact} contact
     * @param {string} [hello='Hi']
     * @returns {Promise<boolean>} Return a Promise, true for accept successful, false for failure.
     * @example
     * const from = message.from()
     * const request = new FriendRequest()
     * request.send(from, 'hello~')
     */
    send(contact, hello = 'Hi') {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.log.verbose('PuppetWebFriendRequest', 'send(%s)', contact);
            if (!contact) {
                throw new Error('contact not found');
            }
            this.contact = contact;
            this.type = 'send';
            if (hello) {
                this.hello = hello;
            }
            return config_1.config.puppetInstance()
                .friendRequestSend(contact, hello);
        });
    }
    /**
     * Accept a friend request
     *
     * @returns {Promise<boolean>} Return a Promise, true for accept successful, false for failure.
     */
    accept() {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.log.verbose('FriendRequest', 'accept() %s', this.contact);
            if (this.type !== 'receive') {
                throw new Error('request is not a `receive` type. it is a ' + this.type + ' type');
            }
            const ret = yield config_1.config.puppetInstance()
                .friendRequestAccept(this.contact, this.ticket);
            const max = 20;
            const backoff = 300;
            const timeout = max * (backoff * max) / 2;
            // 20 / 300 => 63,000
            // max = (2*totalTime/backoff) ^ (1/2)
            // timeout = 11,250 for {max: 15, backoff: 100}
            // refresh to wait contact ready
            yield retryPromise({ max: max, backoff: backoff }, (attempt) => __awaiter(this, void 0, void 0, function* () {
                config_1.log.silly('PuppetWebFriendRequest', 'accept() retryPromise() attempt %d with timeout %d', attempt, timeout);
                yield this.contact.ready();
                if (this.contact.isReady()) {
                    config_1.log.verbose('PuppetWebFriendRequest', 'accept() with contact %s ready()', this.contact.name());
                    return;
                }
                throw new Error('FriendRequest.accept() content.ready() not ready');
            })).catch(e => {
                config_1.log.warn('PuppetWebFriendRequest', 'accept() rejected for contact %s because %s', this.contact, e && e.message || e);
            });
            return ret;
        });
    }
}
exports.PuppetWebFriendRequest = PuppetWebFriendRequest;
exports.default = PuppetWebFriendRequest;
//# sourceMappingURL=friend-request.js.map