#!/usr/bin/env ts-node
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
const test = require("blue-tape");
// tslint:disable:no-shadowed-variable
// import * as sinon from 'sinon'
// const sinonTest   = require('sinon-test')(sinon)
const puppeteer_1 = require("puppeteer");
const profile_1 = require("../profile");
const bridge_1 = require("./bridge");
const PUPPETEER_LAUNCH_OPTIONS = {
    headless: true,
    args: [
        '--disable-gpu',
        '--disable-setuid-sandbox',
        '--no-sandbox',
    ],
};
test('PuppetWebBridge', (t) => __awaiter(this, void 0, void 0, function* () {
    const profile = new profile_1.default();
    const bridge = new bridge_1.default({ profile });
    try {
        yield bridge.init();
        yield bridge.quit();
        t.pass('Bridge instnace');
    }
    catch (e) {
        t.fail('Bridge instance: ' + e);
    }
}));
test('preHtmlToXml()', (t) => __awaiter(this, void 0, void 0, function* () {
    const BLOCKED_HTML_ZH = [
        '<pre style="word-wrap: break-word; white-space: pre-wrap;">',
        '&lt;error&gt;',
        '&lt;ret&gt;1203&lt;/ret&gt;',
        '&lt;message&gt;当前登录环境异常。为了你的帐号安全，暂时不能登录web微信。你可以通过Windows微信、Mac微信或者手机客户端微信登录。&lt;/message&gt;',
        '&lt;/error&gt;',
        '</pre>',
    ].join('');
    const BLOCKED_XML_ZH = [
        '<error>',
        '<ret>1203</ret>',
        '<message>当前登录环境异常。为了你的帐号安全，暂时不能登录web微信。你可以通过Windows微信、Mac微信或者手机客户端微信登录。</message>',
        '</error>',
    ].join('');
    const profile = new profile_1.default();
    const bridge = new bridge_1.default({ profile });
    const xml = bridge.preHtmlToXml(BLOCKED_HTML_ZH);
    t.equal(xml, BLOCKED_XML_ZH, 'should parse html to xml');
}));
test('testBlockedMessage()', (t) => __awaiter(this, void 0, void 0, function* () {
    const BLOCKED_HTML_ZH = [
        '<pre style="word-wrap: break-word; white-space: pre-wrap;">',
        '&lt;error&gt;',
        '&lt;ret&gt;1203&lt;/ret&gt;',
        '&lt;message&gt;当前登录环境异常。为了你的帐号安全，暂时不能登录web微信。你可以通过手机客户端或者windows微信登录。&lt;/message&gt;',
        '&lt;/error&gt;',
        '</pre>',
    ].join('');
    const BLOCKED_XML_ZH = `
    <error>
     <ret>1203</ret>
     <message>当前登录环境异常。为了你的帐号安全，暂时不能登录web微信。你可以通过手机客户端或者windows微信登录。</message>
    </error>
  `;
    const BLOCKED_TEXT_ZH = [
        '当前登录环境异常。为了你的帐号安全，暂时不能登录web微信。',
        '你可以通过手机客户端或者windows微信登录。',
    ].join('');
    // tslint:disable:max-line-length
    const BLOCKED_XML_EN = `
    <error>
     <ret>1203</ret>
     <message>For account security, newly registered WeChat accounts are unable to log in to Web WeChat. To use WeChat on a computer, use Windows WeChat or Mac WeChat at http://wechat.com</message>
    </error>
  `;
    const BLOCKED_TEXT_EN = [
        'For account security, newly registered WeChat accounts are unable to log in to Web WeChat.',
        ' To use WeChat on a computer, use Windows WeChat or Mac WeChat at http://wechat.com',
    ].join('');
    test('not blocked', (t) => __awaiter(this, void 0, void 0, function* () {
        const profile = new profile_1.default();
        const bridge = new bridge_1.default({ profile });
        const msg = yield bridge.testBlockedMessage('this is not xml');
        t.equal(msg, false, 'should return false when no block message');
    }));
    test('html', (t) => __awaiter(this, void 0, void 0, function* () {
        const profile = new profile_1.default();
        const bridge = new bridge_1.default({ profile });
        const msg = yield bridge.testBlockedMessage(BLOCKED_HTML_ZH);
        t.equal(msg, BLOCKED_TEXT_ZH, 'should get zh blocked message');
    }));
    test('zh', (t) => __awaiter(this, void 0, void 0, function* () {
        const profile = new profile_1.default();
        const bridge = new bridge_1.default({ profile });
        const msg = yield bridge.testBlockedMessage(BLOCKED_XML_ZH);
        t.equal(msg, BLOCKED_TEXT_ZH, 'should get zh blocked message');
    }));
    test('en', (t) => __awaiter(this, void 0, void 0, function* () {
        const profile = new profile_1.default();
        const bridge = new bridge_1.default({ profile });
        const msg = yield bridge.testBlockedMessage(BLOCKED_XML_EN);
        t.equal(msg, BLOCKED_TEXT_EN, 'should get en blocked message');
    }));
}));
test('clickSwitchAccount()', (t) => __awaiter(this, void 0, void 0, function* () {
    const SWITCH_ACCOUNT_HTML = `
    <div class="association show" ng-class="{show: isAssociationLogin &amp;&amp; !isBrokenNetwork}">
    <img class="img" mm-src="" alt="" src="//res.wx.qq.com/a/wx_fed/webwx/res/static/img/2KriyDK.png">
    <p ng-show="isWaitingAsConfirm" class="waiting_confirm ng-hide">Confirm login on mobile WeChat</p>
    <a href="javascript:;" ng-show="!isWaitingAsConfirm" ng-click="associationLogin()" class="button button_primary">Log in</a>
    <a href="javascript:;" ng-click="qrcodeLogin()" class="button button_default">Switch Account</a>
    </div>
  `;
    const profile = new profile_1.default();
    const bridge = new bridge_1.default({ profile });
    test('switch account needed', (t) => __awaiter(this, void 0, void 0, function* () {
        const browser = yield puppeteer_1.launch(PUPPETEER_LAUNCH_OPTIONS);
        const page = yield browser.newPage();
        yield page.setContent(SWITCH_ACCOUNT_HTML);
        const clicked = yield bridge.clickSwitchAccount(page);
        yield page.close();
        yield browser.close();
        t.equal(clicked, true, 'should click the switch account button');
    }));
    test('switch account not needed', (t) => __awaiter(this, void 0, void 0, function* () {
        const browser = yield puppeteer_1.launch(PUPPETEER_LAUNCH_OPTIONS);
        const page = yield browser.newPage();
        yield page.setContent('<h1>ok</h1>');
        const clicked = yield bridge.clickSwitchAccount(page);
        yield page.close();
        yield browser.close();
        t.equal(clicked, false, 'should no button found');
    }));
}));
//# sourceMappingURL=bridge.spec.js.map