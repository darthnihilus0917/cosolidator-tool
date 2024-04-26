const dotenv = require("dotenv");
dotenv.config();

const ExcelJS = require('exceljs');
const XLSX = require('xlsx');
const fs = require('fs')
const { Log } = require('./logs');
const { DataFiles } = require('./files');
const { appLabels } = require('../contants/contants');
const { startsWithZero, removeLeadingZero } = require('../utils/utils');

class WeShop {
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

    async processGeneration(filename) {
        try {
            const currentDate = new Date();

            const sourceFile = `${process.env.RAW_DATA_WESHOP}/${filename}`;
            const sourceSheetName = `${process.env.RAW_DATA_WESHOP_SHEET}`;
            const sourceWB = new ExcelJS.Workbook();

            return await sourceWB.xlsx.readFile(sourceFile).then(() => {
                const sourceSheet = sourceWB.getWorksheet(sourceSheetName);

                const destinationWB = new ExcelJS.Workbook();
                destinationWB.xlsx.readFile(`${process.env.OUTPUT_FILE}`).then(async() => {
                    const destinationSheet = destinationWB.getWorksheet(`${process.env.CON_SHEET_WESHOP}`);

                    const showcaseSheet = destinationWB.getWorksheet(`${process.env.STORE_SHEET_SHOWCASE}`);
                    const srpSheet = destinationWB.getWorksheet(`${process.env.STORE_SHEET_SRP}`);
                    const vamSheet = destinationWB.getWorksheet(`${process.env.STORE_SHEET_VAM}`);

                    const consolidatedSheet = destinationWB.getWorksheet(`${process.env.SKU_SHEET_CONSOLIDATED}`);
                    const commrateSheet = destinationWB.getWorksheet(`${process.env.SKU_SHEET_COMMRATE}`);
                    const ninersSheet = destinationWB.getWorksheet(`${process.env.SKU_SHEET_NINERS}`);

                    sourceSheet.eachRow({ includeEmpty: false, firstRow: 2 }, (row, rowNumber) => {
                        const rowData = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(col => row.getCell(col).value);

                        if (rowNumber > 1) {
                            const cutOffSegments = this.cutOff.split(' ');
                            const chainValue = this.chain;
                            const areaAndBannerValue = "SOUTH GMA";

                            const newRowData = [
                                currentDate.getFullYear(), // YEAR
                                cutOffSegments[0].toUpperCase(), // MONTH
                                rowData[0], // DATE
                                rowData[1], // POS NO.
                                rowData[2], // ITEM NO.
                                rowData[3].trim(), // PRODUCT DESCRIPTION
                                rowData[4], // SRP
                                rowData[5], // UOM
                                rowData[6], // CONVERTER
                                rowData[7], // DISC
                                parseFloat(rowData[8]).toFixed(5), // ORIG QTY
                                rowData[9], // QTY UOM
                                "-", // PACK
                                "-", // KG
                                "-", // PCS
                                rowData[10], // CURRENCY
                                parseFloat(rowData[11]).toFixed(5), // AMOUNT
                                `${rowData[13]}%`, // COMM RATE
                                parseFloat(rowData[14]).toFixed(5), // NET SALES
                                "-", // SKU CATEGORY
                                areaAndBannerValue, // AREA
                                "-", // KAM
                                chainValue, // CHAIN
                                areaAndBannerValue, // BANNER
                                0, // SKU NUMBER
                                "-", // SKU BRAND
                                "-", // GENERALIZED SKU
                                "-", // MOTHER SKU
                                "RETAIL", // SALES CATEGORY
                                "-", // SKU DEPARTMENT
                                "-", // PLACEMENT
                                "-", // PLACEMENT REMARKS
                            ];
                            destinationSheet.addRow(newRowData);
                        }
                    });
                    await destinationWB.xlsx.writeFile(`${process.env.OUTPUT_FILE}`);

                    destinationSheet.eachRow({ includeEmpty: false, firstRow: 2}, (row, rowNumber) => {
                        if (rowNumber > 1) {                            
                            row.getCell(5).alignment = { horizontal: 'right' }; // ITEM NO.
                            row.getCell(7).alignment = { horizontal: 'right' }; // SRP                             
                            row.getCell(11).numFmt = `###0.00000`; // ORIG QTY
                            row.getCell(11).alignment = { horizontal: 'right' };                            
                            row.getCell(13).numFmt = `###0.00000`; // PACK
                            row.getCell(13).alignment = { horizontal: 'right' };
                            row.getCell(13).value = { formula: `IF(L${rowNumber}="PCS",K${rowNumber},0)` };
                            row.getCell(14).numFmt = `###0.00000`; // KG
                            row.getCell(14).alignment = { horizontal: 'right' };
                            const packCheck = `IF(L${rowNumber}="PCS",K${rowNumber}*VLOOKUP(F${rowNumber},Sku_Consolidated!B2:U${consolidatedSheet.lastRow.number}, {20, 2}, FALSE),0)`;
                            row.getCell(14).value = { formula: `IF(L${rowNumber}="Gs",K${rowNumber}*VLOOKUP(F${rowNumber},Sku_Consolidated!B2:U${consolidatedSheet.lastRow.number}, {20, 2}, FALSE),${packCheck})` };
                            row.getCell(15).numFmt = `###0.00000`; // PCS
                            row.getCell(15).alignment = { horizontal: 'right' };                            
                            row.getCell(15).value = { formula: `IF(L${rowNumber}="DZN",K${rowNumber}*VLOOKUP(F${rowNumber},Sku_Consolidated!B2:U${consolidatedSheet.lastRow.number}, {20, 2}, FALSE),0)` };                            
                            row.getCell(17).alignment = { horizontal: 'right' }; // AMOUNT
                            row.getCell(18).alignment = { horizontal: 'center' }; // COMM RATE
                            row.getCell(19).alignment = { horizontal: 'right' }; // NET SALES
                            row.getCell(20).value = { formula: `VLOOKUP(F${rowNumber},Sku_Consolidated!B2:L${consolidatedSheet.lastRow.number}, {6}, FALSE)`}; // SKU CATEGORY
                            row.getCell(22).value = { formula: `VLOOKUP(W${rowNumber},Store_Showcase!C2:I${showcaseSheet.lastRow.number},7, FALSE)`}; // KAM                            
                            row.getCell(26).value = { formula: `VLOOKUP(F${rowNumber},Sku_Consolidated!B2:L${consolidatedSheet.lastRow.number}, {10, 2}, FALSE)`}; // SKU PER BRAND                            
                            row.getCell(27).value = { formula: `VLOOKUP(F${rowNumber},Sku_Consolidated!B2:L${consolidatedSheet.lastRow.number}, {7}, FALSE)`}; // GENERALIZED SKU                            
                            row.getCell(28).value = { formula: `VLOOKUP(F${rowNumber},Sku_Consolidated!B2:L${consolidatedSheet.lastRow.number}, {8}, FALSE)`}; // MOTHER SKU                            
                            row.getCell(30).value = { formula: `VLOOKUP(F${rowNumber},Sku_Consolidated!B2:L${consolidatedSheet.lastRow.number}, {4}, FALSE)`}; // SKU DEPT.
                            // PLACEMENT
                            const srpCheck = `VLOOKUP(W${rowNumber},Store_SRP!C2:N${srpSheet.lastRow.number},{12}, FALSE)`;
                            const vamCheck = `IF(VLOOKUP(F${rowNumber},Sku_Consolidated!B2:S${consolidatedSheet.lastRow.number},{18},FALSE)="VAM",VLOOKUP(W${rowNumber},Store_VAM!C2:N${vamSheet.lastRow.number},12, FALSE),${srpCheck})`;
                            const showcaseCheck = `IF(VLOOKUP(F${rowNumber},Sku_Consolidated!B2:S${consolidatedSheet.lastRow.number},{18},FALSE)="SHOWCASE",VLOOKUP(W${rowNumber},Store_Showcase!C2:N${showcaseSheet.lastRow.number},12, FALSE),${vamCheck})`;
                            const chickenCheck = `IF(VLOOKUP(F${rowNumber},Sku_Consolidated!B2:S${consolidatedSheet.lastRow.number},{18},FALSE)="CHICKEN",VLOOKUP(W${rowNumber},Store_Showcase!C2:N${showcaseSheet.lastRow.number},12, FALSE),${showcaseCheck})`;
                            row.getCell(31).value = { formula: `IF(VLOOKUP(F${rowNumber},Sku_Consolidated!B2:S${consolidatedSheet.lastRow.number},{18},FALSE)="EGG",VLOOKUP(W${rowNumber},Store_Showcase!C2:N${showcaseSheet.lastRow.number},12, FALSE),${chickenCheck})`};
                            row.getCell(32).value = { formula: `IF(IFERROR(AE${rowNumber},TRUE)=TRUE, "-","OK")`}; // PLACEMENT REMARKS
                        }
                    });

                    destinationWB.xlsx.writeFile(`${process.env.OUTPUT_FILE}`).then(() => {
                        const fileManager = new DataFiles();
                        fileManager.copyFile(`${process.env.OUTPUT_FILE}`,`${process.env.OUTPUT_FILE_WESHOP}`);

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
            const clearsheet = workbook.getWorksheet(`${process.env.CON_SHEET_WESHOP}`);
            const rowCount = clearsheet.rowCount;
            for (let i = rowCount; i > 1; i--) { clearsheet.spliceRows(i, 1); }

            const consolidatedSheet = workbook.getWorksheet(`${process.env.SKU_SHEET_CONSOLIDATED}`);
            consolidatedSheet.eachRow({ includeEmpty: false, firstRow: 2}, (row, rowNumber) => { 
                if (rowNumber > 1) { row.getCell(22).value = "" }
            });

            workbook.xlsx.writeFile(`${process.env.OUTPUT_FILE}`);  
            
            this.removeUnrelatedSheets();
        });
    }    

    removeUnrelatedSheets() {
        const workbook = new ExcelJS.Workbook();
        workbook.xlsx.readFile(`${process.env.OUTPUT_FILE_WESHOP}`).then(() => {
            workbook.eachSheet(sheet => {
                if (!sheet.name.startsWith('Sku_') && !sheet.name.startsWith('Store_') && sheet.name !== `${process.env.CON_SHEET_WESHOP}`) {
                    workbook.removeWorksheet(sheet.id);
                }                        
            });
            return workbook.xlsx.writeFile(`${process.env.OUTPUT_FILE_WESHOP}`);
        })
    } 
    
    buildRawData() {
        try {
            return true;

        } catch(e) {
            console.log(e)
            return false;
        }
    }

    async generateOutputData() {
        try {
            const chain = this.chain;
            const fileManager = new DataFiles();
            fileManager.source = process.env.RAW_DATA_WESHOP;
            const files = fileManager.listFiles().filter(f => f !== `${process.env.PROCESSED}`);
            if (files.length > 0) {
                let processResult = [];
                const promises = files.map(async(file) => {
                    return await this.processGeneration(file).then((item) => {                        
                        let isCompleted = item;
                        if (isCompleted) {
                            fileManager.destination = `${process.env.RAW_DATA_WESHOP}/${process.env.PROCESSED}`;
                            fileManager.filename = file.trim();
                            fileManager.moveFile();
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
            fs.access(`${process.env.OUTPUT_FILE_WESHOP}`, fs.constants.F_OK, (err) => {
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

module.exports = { WeShop }