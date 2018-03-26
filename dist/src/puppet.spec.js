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
const profile_1 = require("./profile");
const puppet_web_1 = require("./puppet-web");
test('Puppet smoke testing', (t) => __awaiter(this, void 0, void 0, function* () {
    const profile = new profile_1.default(Math.random().toString(36).substr(2, 5));
    const p = new puppet_web_1.default({ profile });
    t.ok(p.state.off(), 'should be OFF state after instanciate');
    p.state.on('pending');
    t.ok(p.state.on(), 'should be ON state after set');
    t.ok(p.state.pending(), 'should be pending state after set');
}));
//# sourceMappingURL=puppet.spec.js.map