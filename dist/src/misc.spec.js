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
// import * as sinon from 'sinon'
// const sinonTest   = require('sinon-test')(sinon)
const express = require("express");
const misc_1 = require("./misc");
test('stripHtml()', (t) => __awaiter(this, void 0, void 0, function* () {
    const HTML_BEFORE_STRIP = 'Outer<html>Inner</html>';
    const HTML_AFTER_STRIP = 'OuterInner';
    const strippedHtml = misc_1.default.stripHtml(HTML_BEFORE_STRIP);
    t.is(strippedHtml, HTML_AFTER_STRIP, 'should strip html as expected');
}));
test('unescapeHtml()', (t) => __awaiter(this, void 0, void 0, function* () {
    const HTML_BEFORE_UNESCAPE = '&apos;|&quot;|&gt;|&lt;|&amp;';
    const HTML_AFTER_UNESCAPE = `'|"|>|<|&`;
    const unescapedHtml = misc_1.default.unescapeHtml(HTML_BEFORE_UNESCAPE);
    t.is(unescapedHtml, HTML_AFTER_UNESCAPE, 'should unescape html as expected');
}));
test('plainText()', (t) => __awaiter(this, void 0, void 0, function* () {
    const PLAIN_BEFORE = '&amp;<html>&amp;</html>&amp;<img class="emoji emoji1f4a4" text="[流汗]_web" src="/zh_CN/htmledition/v2/images/spacer.gif" />';
    const PLAIN_AFTER = '&&&[流汗]';
    const plainText = misc_1.default.plainText(PLAIN_BEFORE);
    t.is(plainText, PLAIN_AFTER, 'should convert plain text as expected');
}));
test('digestEmoji()', (t) => __awaiter(this, void 0, void 0, function* () {
    const EMOJI_XML = [
        '<img class="emoji emoji1f4a4" text="[流汗]_web" src="/zh_CN/htmledition/v2/images/spacer.gif" />',
        '<img class="qqemoji qqemoji13" text="[呲牙]_web" src="/zh_CN/htmledition/v2/images/spacer.gif" />',
        '<img class="emoji emoji1f44d" text="_web" src="/zh_CN/htmledition/v2/images/spacer.gif" />',
        '<span class="emoji emoji1f334"></span>',
    ];
    const EMOJI_AFTER_DIGEST = [
        '[流汗]',
        '[呲牙]',
        '',
        '[emoji1f334]',
    ];
    for (let i = 0; i < EMOJI_XML.length; i++) {
        const emojiDigest = misc_1.default.digestEmoji(EMOJI_XML[i]);
        t.is(emojiDigest, EMOJI_AFTER_DIGEST[i], 'should digest emoji string ' + i + ' as expected');
    }
}));
test('unifyEmoji()', (t) => __awaiter(this, void 0, void 0, function* () {
    const ORIGNAL_XML_LIST = [
        [
            [
                '<img class="emoji emoji1f602" text="_web" src="/zh_CN/htmledition/v2/images/spacer.gif" />',
                '<span class=\"emoji emoji1f602\"></span>',
            ],
            '<emoji code="emoji1f602"/>',
        ],
    ];
    ORIGNAL_XML_LIST.forEach(([xmlList, expectedEmojiXml]) => {
        xmlList.forEach(xml => {
            const unifiedXml = misc_1.default.unifyEmoji(xml);
            t.is(unifiedXml, expectedEmojiXml, 'should convert the emoji xml to the expected unified xml');
        });
    });
}));
test('stripEmoji()', (t) => __awaiter(this, void 0, void 0, function* () {
    const EMOJI_STR = [
        [
            'ABC<img class="emoji emoji1f4a4" text="[流汗]_web" src="/zh_CN/htmledition/v2/images/spacer.gif" />DEF',
            'ABCDEF',
        ],
        [
            'UVW<span class="emoji emoji1f334"></span>XYZ',
            'UVWXYZ',
        ],
    ];
    EMOJI_STR.forEach(([emojiStr, expectResult]) => {
        const result = misc_1.default.stripEmoji(emojiStr);
        t.is(result, expectResult, 'should strip to the expected str');
    });
    const empty = misc_1.default.stripEmoji(undefined);
    t.is(empty, '', 'should return empty string for `undefined`');
}));
test('downloadStream() for media', (t) => __awaiter(this, void 0, void 0, function* () {
    const app = express();
    app.use(require('cookie-parser')());
    app.get('/ding', function (req, res) {
        // console.log(req.cookies)
        t.ok(req.cookies, 'should has cookies in req');
        t.is(req.cookies.life, '42', 'should has a cookie named life value 42');
        res.end('dong');
    });
    const server = require('http').createServer(app);
    server.on('clientError', (err, socket) => {
        t.fail('server on clientError');
        socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
    });
    server.listen(65534);
    try {
        const s = yield misc_1.default.urlStream('http://127.0.0.1:65534/ding', [{ name: 'life', value: 42 }]);
        yield new Promise((resolve, reject) => {
            s.on('data', (chunk) => {
                // console.log(`BODY: ${chunk}`)
                t.is(chunk.toString(), 'dong', 'should success download dong from downloadStream()');
                server.close();
                resolve();
            });
            s.on('error', reject);
        });
    }
    catch (e) {
        t.fail('downloadStream() exception: ' + e.message);
    }
}));
test('getPort() for an available socket port', (t) => __awaiter(this, void 0, void 0, function* () {
    const PORT = 8788;
    let port = yield misc_1.default.getPort(PORT);
    t.not(port, PORT, 'should not be same port even it is available(to provent conflict between concurrency tests in AVA)');
    let ttl = 17;
    while (ttl-- > 0) {
        try {
            const app = express();
            const server = app.listen(PORT);
            port = yield misc_1.default.getPort(PORT);
            server.close();
        }
        catch (e) {
            t.fail('should not exception: ' + e.message + ', ' + e.stack);
        }
    }
    t.pass('should has no exception after loop test');
}));
//# sourceMappingURL=misc.spec.js.map