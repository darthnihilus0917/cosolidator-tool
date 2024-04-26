const dotenv = require("dotenv");
dotenv.config();

const ExcelJS = require('exceljs');
const fs = require('fs');
const Papa = require('papaparse');
const pdfToExcelGenerator = require('pdf-to-excel');
const { Log } = require('./logs');
const { DataFiles } = require('./files');
const { appLabels } = require('../contants/contants');
const { rawDataDateFormat, mergeArrays, endsWithNumber, 
    removeLastNumber, removePrecedingString, isNumeric } = require('../utils/utils');

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
        log.action = this.action;
        log.logActivity();
    }

    async pdfToExcel() {
        try {            
            const pdfFileManager = new DataFiles();
            pdfFileManager.source = process.env.PDF_MERRYMART;
            const pdfFiles = pdfFileManager.listFiles().filter(f => f !== `${process.env.PROCESSED}` && f.includes(`pdf`));
            if (pdfFiles.length > 0) {
                pdfFiles.forEach((filename) => {                    
                    const pdfFile = `${process.env.PDF_MERRYMART}/${filename}`;
                    // convert to excel/csv
                    const excelFilename = filename.replace('.pdf', '.csv')
                    const excelFile = `${process.env.CONVERTED_MERRYMART}/${excelFilename}`;
                    pdfToExcelGenerator.genXlsx(pdfFile, excelFile);
                });

                return {
                    isProcessed: true,
                    statusMsg: `${this.chain}: ${appLabels.pdfConvertion}`
                }

            } else {
                return {
                    isProcessed: false,
                    statusMsg: `NO PDF DATA FILE(S) FOUND FROM ${chain}!`
                } 
            }            
        } catch(error) {
            console.error(error);
            return false;
        }
    }

    async captureRawData(callback) {
        try {
            const csvFileManager = new DataFiles();
            csvFileManager.source = process.env.CONVERTED_MERRYMART;
            const csvFiles = csvFileManager.listFiles().filter(f => f !== `${process.env.PROCESSED}` && f.includes(`csv`));
            csvFiles.map((file) => {
                const csvFile = `${process.env.CONVERTED_MERRYMART}/${file}`;
                fs.readFile(csvFile, 'utf-8', (err, data) => {
                    if (err) {
                        callback(err);
                        return false;
                    }

                    const result = Papa.parse(data, { header: false });
                    const rowData = result.data;
                    let startingPoint = rowData.map((item, index) => {
                        return (item[0].length > 0 && item[0].includes(`Covering Period`)) ? index : 0;
                    }).filter(d => d !== 0);

                    const csvData = rowData.map((item, index) => {                        
                        if (index > parseInt(startingPoint) && item !== undefined) { return item.filter(val => val !== ''); }
                    }).filter(d => d !== undefined && d.length > 0);

                    // BRANCH
                    let branch = csvData.map((item, index) => { 
                        if (index === 0) {
                            return (csvData[0].length === 1) ? csvData[1][0] : item[1]
                        }
                    }).filter(d => d !== null)[0];
                    branch = branch.toUpperCase();

                    // SKU DATA RANGE
                    const skuDataRange = csvData.map((item, index) => {
                        let rangeIndex = 0;
                        if (item[0].includes('ARTICLE DESCRIPTION')) { rangeIndex = index + 1; }
                        if (item[0].includes('TOTAL')) { rangeIndex = index; }
                        return rangeIndex;
                    }).filter(d => d !== 0);

                    const skuCodes = [];
                    const skuDescriptions = [];
                    let quantities = [];
                    let units = [];
                    const netSales = [];
                    const commRates = [];
                    const netPayables = [];
                    const taxClass = [];

                    const content = csvData.slice(skuDataRange[0], skuDataRange[1]);
                    content.map((item, index) => {
                        let skuCode = null;
                        let skuDesc = null;
                        let qty = null;

                        if (item[0].length >= 8 && item[0].includes('2002')) {
                            skuCode = (item[0].length > 8) ? item[0].split(' ')[0].trim() : (item[0].length === 8) ? item[0] : null;
                            skuCodes.push(parseInt(skuCode));
                        }

                        switch(branch) {
                            case "UMBRIA":
                                if (item[0].length < 3 || item[0].includes('TGM')) {
                                    if (!endsWithNumber(item[0])) {
                                        qty = item[1];
                                        if (typeof(qty) === 'string') {
                                            quantities.push(qty);
                                        }  
                                        units.push(item[2]);
                                        netSales.push(item[3]);
                                        commRates.push(item[5]);
                                        netPayables.push(item[6]);
                                        taxClass.push(item[8]);

                                    } else {
                                        qty = removePrecedingString(item[0]);
                                        if (typeof(qty) !== 'number') {
                                            quantities.push(qty);
                                        } 
                                        units.push(item[1]); 
                                        netSales.push(item[2]); 
                                        commRates.push(item[4]); 
                                        netPayables.push(item[5]);
                                        taxClass.push(item[7]);                                    
                                    }
                                    skuDesc = item[0].replace(/^.*?TGM/, 'TGM');
                                    skuDesc = removeLastNumber(skuDesc).trim();
                                    skuDescriptions.push(skuDesc.trim());
                                }                           
                                break;
                            default:
                                if (item[0].includes('TGM')) {
                                    if (item[0].includes('2002') && endsWithNumber(item[0])) {
                                        skuDesc = item[0].replace(/^.*?TGM/, 'TGM');
                                        skuDesc = removeLastNumber(skuDesc).trim();
                                        skuDescriptions.push(skuDesc.trim());
                                    } else if (item[0].includes('2002') && !endsWithNumber(item[0])) {
                                        skuDesc = item[0].replace(/^.*?TGM/, 'TGM');
                                        skuDescriptions.push(skuDesc.trim());
                                    } else {
                                        if (endsWithNumber(item[0])) {
                                            skuDesc = removeLastNumber(item[0]).trim();
                                        } else {
                                            skuDescriptions.push(item[0].trim());
                                        } 
                                    }                            
                                }

                                if (item[0].length < 3 || item[0].includes('TGM') && endsWithNumber(item[0])) {
                                    if (endsWithNumber(item[0])) {
                                        qty = removePrecedingString(item[0]);
                                        if (typeof(qty) !== 'number') {
                                            quantities.push(qty);
                                        }
                                    }
                                }

                                // QUANTITIES AND UNITS
                                if (item[0].length < 3) {
                                    const numRegex = /\d/;
                                    const letterRegex = /[a-zA-Z]/;
                                    if (letterRegex.test(item[0])) { units.push(item[0]); }
                                    if (numRegex.test(item[0])) { quantities.push(parseInt(item[0])); }
                                }   
                                
                                // NET SALES
                                if (item[1] !== undefined) { netSales.push(item[1]); }
                                // COMM.RATES
                                if (item[3] !== undefined) { commRates.push(item[3]); }
                                // NET PAYABLES
                                if (item[4] !== undefined) { netPayables.push(item[4]); }
                                // TAX CLASS
                                if (item[6] !== undefined) { taxClass.push(item[6]); }                                  
                        }
                    }).filter(d => d !== 0);

                    branch = `MM - ${branch}`;
                    quantities = quantities.filter(u => u !== undefined).filter(s => typeof(s) !== 'number' );
                    units = units.filter(u => u !== undefined).slice(0, quantities.length)

                    const skuData = mergeArrays(branch, skuCodes, skuDescriptions, quantities, units, netSales, commRates, netPayables, taxClass);
                    callback(null, skuData);
                });
            });

        } catch(err) {
            callback(err);
            return false;
        }
    }
    
    async buildRawData() {
        try {
            const chain = this.chain;
            this.captureRawData((err, data) => {
                console.log(data)
            });

            return {
                isProcessed: true,
                statusMsg: `${this.chain}: ${appLabels.rawDataMsg}`
            }

        } catch(e) {
            return {
                isProcessed: false,
                statusMsg: e
            }
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