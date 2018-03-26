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
const LICENSE = `/**
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
 */`;
const fs_1 = require("fs");
const stream_1 = require("stream");
const util_1 = require("util");
const globCallback = require("glob");
class LicenseTransformer extends stream_1.Transform {
    constructor(options) {
        super(options);
        this.lineBuf = '';
        this.lineNum = 0;
        this.updating = false;
        this.updated = false;
    }
    _transform(chunk, encoding, done) {
        if (this.updated) {
            this.push(chunk);
        }
        else {
            const updatedChunk = this.updateChunk(chunk);
            this.push(updatedChunk);
        }
        done();
    }
    updateChunk(chunk) {
        const buffer = this.lineBuf + chunk.toString();
        this.lineBuf = '';
        if (!buffer) {
            console.error('no data');
            return '';
        }
        const updatedLineList = [];
        buffer
            .split(/\n/)
            .forEach(line => {
            if (this.lineNum === 0 && line.startsWith('#!')) {
                updatedLineList.push(line);
            }
            else if (this.updated) {
                updatedLineList.push(line);
            }
            else if (this.updating) {
                if (/\*\//.test(line)) {
                    updatedLineList.push(line.replace(/.*\*\//, LICENSE));
                    this.updating = false;
                    this.updated = true;
                }
                else {
                    // drop the old comments
                }
            }
            else {
                if (!line) {
                    updatedLineList.push(line);
                }
                else if (/\s*\/\*\*/.test(line)) {
                    if (/\*\//.test(line)) {
                        updatedLineList.push(line.replace(/\/\*\*.*\*\//, LICENSE));
                        this.updated = true;
                    }
                    else {
                        this.updating = true;
                    }
                }
                else {
                    updatedLineList.push(LICENSE);
                    updatedLineList.push(line);
                    this.updated = true;
                }
            }
            this.lineBuf = line;
            this.lineNum++;
        });
        return updatedLineList.join('\n');
    }
    _flush(done) {
        if (this.lineBuf) {
            this.push(this.lineBuf);
            this.lineBuf = '';
        }
        done();
    }
}
function updateLicense(file) {
    return __awaiter(this, void 0, void 0, function* () {
        const tmpFile = file + `.${process.pid}.tmp`;
        const readStream = fs_1.createReadStream(file);
        const writeStream = fs_1.createWriteStream(tmpFile);
        const tranStream = new LicenseTransformer();
        console.log(`Updating LICENSE for file ${file}...`);
        yield new Promise((resolve, reject) => {
            readStream
                .pipe(tranStream)
                .pipe(writeStream)
                .on('close', resolve);
        });
        yield util_1.promisify(fs_1.unlink)(file);
        yield util_1.promisify(fs_1.link)(tmpFile, file);
        yield util_1.promisify(fs_1.unlink)(tmpFile);
    });
}
function glob(pattern) {
    return __awaiter(this, void 0, void 0, function* () {
        return util_1.promisify(globCallback)(pattern);
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const pattern = '{bin/**/*.ts,examples/**/*.{js,ts},scripts/**/*.{ts,js},src/**/*.{ts,js},tests/**/*.ts}';
        // const pattern = 't.ts'
        const srcFileList = yield glob(pattern);
        const promiseList = srcFileList.map(updateLicense);
        yield Promise.all(promiseList);
    });
}
main();
//# sourceMappingURL=update-license.js.map