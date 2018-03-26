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
const config_1 = require("./config");
test('important variables', (t) => __awaiter(this, void 0, void 0, function* () {
    t.true('puppet' in config_1.config, 'should exist `puppet` in Config');
    t.true('apihost' in config_1.config, 'should exist `apihost` in Config');
    t.true('profile' in config_1.config, 'should exist `profile` in Config');
    t.true('token' in config_1.config, 'should exist `token` in Config');
    t.ok(config_1.config.default.DEFAULT_PUPPET, 'should export DEFAULT_PUPPET');
    t.ok(config_1.config.default.DEFAULT_PROFILE, 'should export DEFAULT_PROFILE');
    t.ok(config_1.config.default.DEFAULT_PROTOCOL, 'should export DEFAULT_PROTOCOL');
    t.ok(config_1.config.default.DEFAULT_APIHOST, 'should export DEFAULT_APIHOST');
}));
test('validApiHost()', (t) => __awaiter(this, void 0, void 0, function* () {
    const OK_APIHOSTS = [
        'api.chatie.io',
        'chatie.io:8080',
    ];
    const ERR_APIHOSTS = [
        'https://api.chatie.io',
        'chatie.io/',
    ];
    OK_APIHOSTS.forEach(apihost => {
        t.doesNotThrow(() => {
            config_1.config.validApiHost(apihost);
        });
    }, 'should not row for right apihost');
    ERR_APIHOSTS.forEach(apihost => {
        t.throws(() => {
            config_1.config.validApiHost(apihost);
        });
    }, 'should throw for error apihost');
}));
test('puppetInstance()', (t) => __awaiter(this, void 0, void 0, function* () {
    // BUG Compitable with Win32 CI
    // global instance infected across unit tests... :(
    const bak = config_1.config.puppetInstance();
    config_1.config.puppetInstance(null);
    t.throws(() => {
        config_1.config.puppetInstance();
    }, Error, 'should throw when not initialized');
    config_1.config.puppetInstance(bak);
    const EXPECTED = { userId: 'test' };
    const mockPuppet = EXPECTED;
    config_1.config.puppetInstance(mockPuppet);
    const instance = config_1.config.puppetInstance();
    t.deepEqual(instance, EXPECTED, 'should equal with initialized data');
    config_1.config.puppetInstance(null);
    t.throws(() => {
        config_1.config.puppetInstance();
    }, Error, 'should throw after set to null');
    config_1.config.puppetInstance(bak);
}));
//# sourceMappingURL=config.spec.js.map