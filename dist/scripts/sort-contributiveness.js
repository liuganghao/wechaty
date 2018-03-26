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
const readline = require("readline");
const contributeMap = {};
function parseLine(line) {
    // [\#264](https://github.com/Chatie/wechaty/pull/264) ([lijiarui](https://github.com/lijiarui))
    // const regex = /(\[\\#\d+\]\([^\)]+\))\s+(\(\[[^]]+\]\([^)]+\)))/i
    const regex = /(\[\\#\d+\])(\([^\)]+\))\s+\((\[[^\]]+\]\([^\)]+\))/;
    const matches = regex.exec(line);
    if (!matches) {
        return null;
    }
    // console.log('match!')
    // console.log(matches[1])  // [\#264]
    // console.log(matches[2])  // (https://github.com/Chatie/wechaty/pull/264)
    // console.log(matches[3])  // ([lijiarui](https://github.com/lijiarui)
    return matches;
}
function processLine(line) {
    const matches = parseLine(line);
    if (matches) {
        // console.log('match:', line)
        // console.log(matches)
        const link = matches[1] + matches[2];
        const contributor = matches[3];
        // console.log('link:', link)
        // console.log('contributor:', contributor)
        if (!(contributor in contributeMap)) {
            contributeMap[contributor] = [];
        }
        contributeMap[contributor].push(link);
        // console.log(contributiveness)
    }
    else {
        console.error('NO match:', line);
    }
}
function outputContributorMd() {
    const MIN_MAINTAINER_COMMIT_NUM = 2;
    function isMaintainer(committer) {
        return contributeMap[committer].length >= MIN_MAINTAINER_COMMIT_NUM;
    }
    const activeContributorList = Object.keys(contributeMap)
        .filter(isMaintainer)
        .sort(desc);
    function desc(committerA, committerB) {
        return contributeMap[committerB].length - contributeMap[committerA].length;
    }
    console.log([
        '',
        'WECHATY CONTRIBUTORS',
        '--------------------',
        '',
        '### Active Contributors',
        '',
    ].join('\n'));
    for (const contributor of activeContributorList) {
        console.log(`1. @${contributor}: ${contributeMap[contributor].join(',')}`);
    }
    console.log([
        '',
        '### Contributors',
        '',
    ].join('\n'));
    const SKIP_NAME_LIST = [
        'snyk-bot',
        'gitter-badger',
    ];
    const SKIP_REGEX = new RegExp(SKIP_NAME_LIST.join('|'), 'i');
    for (const contributor of Object.keys(contributeMap).sort(desc)) {
        if (SKIP_REGEX.test(contributor)) {
            continue;
        }
        if (!activeContributorList.includes(contributor)) {
            console.log(`1. @${contributor}: ${contributeMap[contributor].join(',')}`);
        }
    }
    console.log();
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        // https://stackoverflow.com/a/20087094/1123955
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: false,
        });
        rl.on('line', processLine);
        yield new Promise(r => rl.on('close', r));
        outputContributorMd();
        return 0;
    });
}
main()
    .then(process.exit);
//# sourceMappingURL=sort-contributiveness.js.map