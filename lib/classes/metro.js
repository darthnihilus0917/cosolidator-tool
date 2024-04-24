const dotenv = require("dotenv");
dotenv.config();

const ExcelJS = require('exceljs');
const fs = require('fs');
const Papa = require('papaparse');
const { Log } = require('./logs');
const { DataFiles } = require('./files');
const { appLabels } = require('../contants/contants');
const { rawDataDateFormat } = require('../utils/utils');

class Metro {
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

    async captureRawData(filename, callback) {
        try {
            const csvFile = `${process.env.CSV_METRO}/${filename}`;
            fs.readFile(csvFile, 'utf-8', (err, data) => {
                if (err) {
                    callback(err);
                    return false;
                }

                const result = Papa.parse(data, { header: false });
                const rowData = result.data;
                const csvData = rowData.map((item, index) => {
                    if (item[1] !== undefined && item[1].length !== 0 && item[1] !== "1" && index !== 3) { return item.filter(val => val !== ''); }
                }).filter(d => d !== undefined);

                // STORE CODE
                const storeCode = csvData.map((item) => {
                    return (item[0].includes('Supplier Site:')) ? item[3].split("-")[0] : null;
                }).filter(d => d !== null)[0];

                // SKU DATA RANGE
                const skuDataRange = csvData.map((item, index) => {
                    // console.log(item)
                    let rangeIndex = 0;
                    if (item[0].includes('SKU')) {
                        rangeIndex = index + 1;
                    }
                    
                    if (item[0].includes('Item Summary #')) {
                        rangeIndex = index;
                    };    
                    return rangeIndex;
                }).filter(d => d !== 0);

                // SKU DATA
                const skuData = csvData.slice(skuDataRange[0], skuDataRange[1]).map((item) => {
                    item[0] = parseInt(item[0]);
                    item[2] = rawDataDateFormat(item[2]);
                    item[3] = rawDataDateFormat(item[3]);
                    item[5] = parseInt(item[5]);
                    item[6] = parseInt(item[6]);
                    item[7] = parseFloat(item[7]).toFixed(5);
                    item[8] = parseFloat(item[8]).toFixed(5);
                    item[9] = parseFloat(item[9]).toFixed(5);
                    item[10] = parseFloat(item[10].trim()).toFixed(5);
                    return item.concat(storeCode);
                });
                callback(null, skuData);
            });

        } catch(err) {
            callback(err);
            return false;
        }
    }
    
    async buildRawData() {
        try {
            const chain = this.chain;
            const fileManager = new DataFiles();            
            fileManager.source = process.env.CSV_METRO;
            
            const files = fileManager.listFiles();
            if (files.length > 0) {
                const csvFiles = files.map((file) => { return file; }).filter(f => f.includes('.csv'));
                if (csvFiles.length > 0) {                  

                    const destinationWB = new ExcelJS.Workbook();
                    const destinationFile = `${process.env.RAW_DATA_METRO}/${process.env.RAW_DATA_METRO_FILE}`;
                    await destinationWB.xlsx.readFile(destinationFile);
                    const destinationSheet = destinationWB.getWorksheet(`raw`);

                    const promises = csvFiles.map((file) => {
                        this.captureRawData(file, async(err, data) => {
                            if (err) {
                                console.error(err);
                                process.exit(0);
                            }
                            data.forEach((item) => { destinationSheet.addRow(item) });
                            await destinationWB.xlsx.writeFile(destinationFile);

                            fileManager.destination = `${process.env.CSV_METRO}/${process.env.PROCESSED}`;
                            fileManager.filename = file.trim();
                            fileManager.moveFile();
                        });
                        return true;
                    });

                    return Promise.all(promises).then(function(results) {
                        if (results.includes(true)) {
                            return {
                                isProcessed: true,
                                statusMsg: `${chain}: ${appLabels.rawDataMsg}`
                            }
                        }
                    });

                } else {
                    return {
                        isProcessed: false,
                        statusMsg: `NO CSV RAW DATA FILE(S) FOUND FROM ${chain}!`
                    }                    
                }
            }

        } catch(e) {
            return {
                isProcessed: false,
                statusMsg: e
            }
        }
    }

    async processGeneration(filename) {
        try {
            const currentDate = new Date();

            const sourceFile = `${process.env.RAW_DATA_METRO}/${filename}`;
            const sourceSheetName = `${process.env.RAW_DATA_METRO_SHEET}`;
            const sourceWB = new ExcelJS.Workbook();

            return await sourceWB.xlsx.readFile(sourceFile).then(() => {
                const sourceSheet = sourceWB.getWorksheet(sourceSheetName);

                const destinationWB = new ExcelJS.Workbook();
                destinationWB.xlsx.readFile(`${process.env.OUTPUT_FILE}`).then(async() => {
                    const destinationSheet = destinationWB.getWorksheet(`${process.env.CON_SHEET_METRO}`);

                    const showcaseSheet = destinationWB.getWorksheet(`${process.env.STORE_SHEET_SHOWCASE}`);
                    const srpSheet = destinationWB.getWorksheet(`${process.env.STORE_SHEET_SRP}`);
                    const vamSheet = destinationWB.getWorksheet(`${process.env.STORE_SHEET_VAM}`);

                    const consolidatedSheet = destinationWB.getWorksheet(`${process.env.SKU_SHEET_CONSOLIDATED}`);
                    const commrateSheet = destinationWB.getWorksheet(`${process.env.SKU_SHEET_COMMRATE}`);
                    const ninersSheet = destinationWB.getWorksheet(`${process.env.SKU_SHEET_NINERS}`);

                    sourceSheet.eachRow({ includeEmpty: false, firstRow: 2 }, (row, rowNumber) => {
                        const rowData = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(col => row.getCell(col).value);
                        if (rowNumber > 1) {
                            const cutOffSegments = this.cutOff.split(' ');
                            const cutOffValue = this.cutOff;
                            const chainValue = this.chain;

                            const newRowData = [
                                currentDate.getFullYear(), // YEAR
                                cutOffSegments[0].toUpperCase(), // MONTH
                                cutOffValue, // CUT OFF
                                rowData[0], // SKU
                                rowData[1], // DESCRIPTION
                                rowData[2], // TRAN DATE
                                rowData[3], // POST DATE
                                rowData[4], // SELL UOM
                                rowData[5], // QTY
                                "-", // PACK
                                "-", // KG
                                "-", // PCS
                                rowData[6], // CONCESSION RATE
                                rowData[7], // GROSS SALES AMT (INCL OF VAT)
                                rowData[8], // CONCESSION AMT (EXCL OF VAT)
                                rowData[9], // INPUT VAT
                                rowData[10], // CONCESSION AMT (INCL OF VAT)
                                "-", // AREA
                                "-", // CHAIN
                                "-", // BANNER
                                rowData[11], // STORE CODE
                                "-", // BRANCH
                                "-", // SKU CATEGORY
                                "-", // SKU PER BRAND
                                "-", // GENERALIZED SKU
                                "-", // MOTHER SKU
                                "-", // SALES CATEGORY
                                "-", // SKU DEPT.
                                "-", // PLACEMENT
                                "-", // PLACEMENT REMARKS
                            ]
                            destinationSheet.addRow(newRowData);
                        }
                    });
                    await destinationWB.xlsx.writeFile(`${process.env.OUTPUT_FILE}`);

                    destinationSheet.eachRow({ includeEmpty: false, firstRow: 2}, (row, rowNumber) => {
                        if (rowNumber > 1) {
                            row.getCell(6).alignment = { horizontal: 'right' }; // TRAN DATE
                            row.getCell(7).alignment = { horizontal: 'right' }; // POST DATE
                            row.getCell(9).alignment = { horizontal: 'right' }; // QTY
                            row.getCell(9).numFmt = `###0.00000`;
                            row.getCell(14).alignment = { horizontal: 'right' }; // Gross Sales Amt  (Incl of VAT)
                            row.getCell(15).alignment = { horizontal: 'right' }; // Concession Amt  (Excl of VAT)
                            row.getCell(16).alignment = { horizontal: 'right' }; // Input VAT
                            row.getCell(17).alignment = { horizontal: 'right' }; // Concession Amt (Incl of VAT)
                            row.getCell(21).alignment = { horizontal: 'right' }; // STORE CODE
                        }
                    })

                    destinationWB.xlsx.writeFile(`${process.env.OUTPUT_FILE}`).then(() => {
                        const fileManager = new DataFiles();
                        fileManager.copyFile(`${process.env.OUTPUT_FILE}`,`${process.env.OUTPUT_FILE_METRO}`);

                        this.checkFileExists((err, exists) => {
                            if (err) {
                                console.error('Error:', err.message);
                            } else {
                                this.clearOutputDataSheet(destinationWB);
                            }
                        });

                    }).then(() => {
                        return true;
                    }).catch((error) => {
                        console.error(error);
                        return false;
                    }); 
                });

            }).then(async() => {
                return await true;
            }).catch(async(err) => {
                console.error(err);
                return await false;                
            });

        } catch(err) {
            console.error(err);
            return false;
        }
    }

    clearOutputDataSheet(workbook) {
        workbook.xlsx.readFile(`${process.env.OUTPUT_FILE}`).then(() => {
            const clearsheet = workbook.getWorksheet(`${process.env.CON_SHEET_METRO}`);
            const rowCount = clearsheet.rowCount;
            for (let i = rowCount; i > 1; i--) { clearsheet.spliceRows(i, 1); }                                
            workbook.xlsx.writeFile(`${process.env.OUTPUT_FILE}`);  
            
            this.removeUnrelatedSheets();
        });
    }

    removeUnrelatedSheets() {
        const workbook = new ExcelJS.Workbook();
        workbook.xlsx.readFile(`${process.env.OUTPUT_FILE_METRO}`).then(() => {
            workbook.eachSheet(sheet => {
                if (!sheet.name.startsWith('Sku_') && !sheet.name.startsWith('Store_') && sheet.name !== `${process.env.CON_SHEET_METRO}`) {
                    workbook.removeWorksheet(sheet.id);
                }
            });
            return workbook.xlsx.writeFile(`${process.env.OUTPUT_FILE_METRO}`);
        })
    }    

    generateOutputData() {
        try {
            const chain = this.chain;
            const fileManager = new DataFiles();
            fileManager.source = process.env.RAW_DATA_METRO;
            const files = fileManager.listFiles().filter(f => f !== `${process.env.PROCESSED}` && f !== `csv`);
            if (files.length > 0) {
                let processResult = [];
                const promises = files.map(async(file) => {
                    return await this.processGeneration(file).then((item) => {                        
                        let isCompleted = item;
                        if (isCompleted) {
                            // fileManager.destination = `${process.env.RAW_DATA_METRO}/${process.env.PROCESSED}`;
                            // fileManager.filename = file.trim();
                            // fileManager.moveFile();
                        }
                        return item;

                    }).then((res) => {
                        processResult.push(res);
                        return res;

                    }).catch((error) => {
                        console.log(error)
                        return false;
                    });
                });
                return Promise.all(promises).then(function(results) {
                    // console.log(results)
                    if (results.includes(true)) {
                        return {
                            isProcessed: true,
                            statusMsg: `${chain} - ${appLabels.chainMsg}`
                        }
                    }
                });

            } else {
                return {
                    isProcessed: false,
                    statusMsg: `NO DATA FILE(S) FOUND FROM ${chain}!`
                }
            }  

        } catch(e) {
            return {
                isProcessed: false,
                statusMsg: e
            }
        }
    }

    consolidate() {
        try {
            return true;

        } catch(e) {
            console.log(e);
        }
    }

    checkFileExists(callback) {
        let attempts = 0;
        const maxAttempts = 3;
        const delay = 1000; // Delay in milliseconds between each attempt
    
        function check() {
            fs.access(`${process.env.OUTPUT_FILE_METRO}`, fs.constants.F_OK, (err) => {
                if (!err) {
                    // File exists
                    callback(null, true);
                } else {
                    // File does not exist
                    attempts++;
                    if (attempts < maxAttempts) {
                        // Retry after delay
                        setTimeout(check, delay);
                    } else {
                        // Max attempts reached
                        callback(new Error('File does not exist after multiple attempts'), false);
                    }
                }
            });
        }    
        check(); // Start checking
    }     
}

module.exports = { Metro }