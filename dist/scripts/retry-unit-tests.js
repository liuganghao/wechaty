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
const child_process_1 = require("child_process");
const MAX_RETRY_NUM = 3;
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Safe Test: starting...');
        let round = 0;
        let succ = false;
        do {
            console.log(`Safe Test: running for round #${round}`);
            succ = yield unitTest();
            if (succ) {
                console.log(`Safe Test: successed at round #${round}!`);
                return 0;
            }
        } while (round++ < MAX_RETRY_NUM);
        return 1; // fail finally :(
    });
}
function unitTest() {
    return __awaiter(this, void 0, void 0, function* () {
        const child = child_process_1.spawn('npm', [
            'run',
            'test:unit',
        ], {
            stdio: 'inherit',
            shell: true,
        });
        return new Promise((resolve, reject) => {
            child.once('exit', code => code === 0 ? resolve(true) : resolve(false));
            child.once('error', reject);
        });
    });
}
main()
    .then(process.exit)
    .catch(e => {
    console.error(e);
    process.exit(1);
});
//# sourceMappingURL=retry-unit-tests.js.map