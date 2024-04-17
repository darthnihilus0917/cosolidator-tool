const ExcelJS = require('exceljs');
const { Log } = require('./logs');

class Puregold {
    constructor() {
        this.chain = null;
        this.action = null;
        this.cutOff = null;
    }

    setChain(chain) { this.chain = chain; }
    getChain() { return this.chain; }

    setAction(action) { this.action = action; }
    getAction() { return this.action; }

    setAction(cutOff) { this.cutOff = cutOff; }
    getAction() { return this.cutOff; }    

    log() {
        const log = new Log();
        log.filePath = `./logs.txt`;
        log.chain = this.chain;
        log.action = this.action;
        log.logActivity();
    }
    
    buildRawData() {
        try {
            return true;

        } catch(e) {
            console.log(e)
            return false;
        }
    }

    generateOutputData() {
        try {
            return true;

        } catch(e) {
            console.log(e);
            return false;
        }
    }

    consolidate() {
        try {
            return true;

        } catch(e) {
            console.log(e);
        }
    }
}

module.exports = { Puregold }