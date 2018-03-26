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
const index_1 = require("./index");
test('PuppetWeb Module Exports', (t) => __awaiter(this, void 0, void 0, function* () {
    t.ok(index_1.PuppetWeb, 'should export PuppetWeb');
    t.ok(index_1.Event, 'should export Event');
    t.ok(index_1.Bridge, 'should export Bridge');
}));
//# sourceMappingURL=index.spec.js.map