const dotenv = require("dotenv");
dotenv.config();

const ExcelJS = require('exceljs');
const XLSX = require('xlsx');
const fs = require('fs')
const { Log } = require('./logs');
const { DataFiles } = require('./files');
const { appLabels } = require('../contants/contants');
const { startsWithZero, removeLeadingZero } = require('../utils/utils');

class MerryMart {
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
        log.filePath = `${process.env.LOG_FILE}`;
        log.chain = this.chain;
        log.salesType = this.salesType;
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

module.exports = { MerryMart }