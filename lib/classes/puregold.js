const dotenv = require("dotenv");
dotenv.config();

const ExcelJS = require('exceljs');
const XLSX = require('xlsx');
const fs = require('fs')
const { Log } = require('./logs');
const { DataFiles } = require('./files');
const { appLabels } = require('../contants/contants');
const { startsWithZero, removeLeadingZero } = require('../utils/utils');

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

    async processGeneration(filename) {
        try {
            const currentDate = new Date();

            const sourceFile = `${process.env.RAW_DATA_PUREGOLD}/${filename}`;
            const sourceSheetName = `${process.env.RAW_DATA_PUREGOLD_SHEET}`;
            const sourceWB = new ExcelJS.Workbook();
            
            return await sourceWB.xlsx.readFile(sourceFile).then(() => {
                const sourceSheet = sourceWB.getWorksheet(sourceSheetName);

                const destinationWB = new ExcelJS.Workbook();
                destinationWB.xlsx.readFile(`${process.env.OUTPUT_FILE}`).then(async() => {
                    const destinationSheet = destinationWB.getWorksheet(`${process.env.CON_SHEET_PUREGOLD}`);

                    const showcaseSheet = destinationWB.getWorksheet(`${process.env.STORE_SHEET_SHOWCASE}`);
                    const srpSheet = destinationWB.getWorksheet(`${process.env.STORE_SHEET_SRP}`);
                    const vamSheet = destinationWB.getWorksheet(`${process.env.STORE_SHEET_VAM}`);

                    const consolidatedSheet = destinationWB.getWorksheet(`${process.env.SKU_SHEET_CONSOLIDATED}`);
                    const commrateSheet = destinationWB.getWorksheet(`${process.env.SKU_SHEET_COMMRATE}`);
                    const ninersSheet = destinationWB.getWorksheet(`${process.env.SKU_SHEET_NINERS}`);

                    sourceSheet.eachRow({ includeEmpty: false, firstRow: 2 }, (row, rowNumber) => {
                        const rowData = [1, 2, 3, 4, 5, 6, 7, 8].map(col => row.getCell(col).value);

                        if (rowNumber > 1) {
                            const filenameSegments = this.cutOff.split(' ');
                            const cutOffValue = `${filenameSegments[0]} ${filenameSegments[1]} to ${filenameSegments[3]}`.toUpperCase(); 

                            const newRowData = [
                                currentDate.getFullYear(), // YEAR
                                filenameSegments[0].toUpperCase(), // MONTH
                                cutOffValue, // CUT-OFF
                                this.chain, // CHAIN
                                rowData[1], // BRANCH CODE
                                rowData[2], // BRANCH
                                parseInt(rowData[3]), // SKU
                                rowData[4], // DESCRIPTION
                                parseFloat(rowData[5]).toFixed(5), // ORIG QTY
                                '-', // UOM
                                parseFloat(0).toFixed(5), // PACK
                                parseFloat(0).toFixed(5), // KG
                                parseFloat(0).toFixed(5), // PCS
                                parseFloat(rowData[6]).toFixed(5), // GROSS SALES
                                parseFloat(rowData[7]).toFixed(5), // COMM AMOUNT
                                "-", // NET SALES
                                "-", // SKU CATEGORY
                                "-", // AREA
                                "-", // KAM
                                "-", // SKU REPORT IDENTIFIER 1
                                rowData[0], // UPC
                                "-", // BANNER
                                "-", // SKU PER BRAND
                                "-", // GENERALIZED SKU
                                "-", // MOTHER SKU
                                "RETAIL", // SALES CATEGORY
                                "-", // SKU DEPT.
                                "-", // PLACEMENT
                                "-", // PLACEMENT REMARKS
                                parseFloat(0).toFixed(5), // NET TAX
                                parseFloat(0).toFixed(5) // TAX
                            ]
                            destinationSheet.addRow(newRowData);
                        }
                    });
                    await destinationWB.xlsx.writeFile(`${process.env.OUTPUT_FILE}`);

                    destinationSheet.eachRow({ includeEmpty: false, firstRow: 2}, (row, rowNumber) => {
                        if (rowNumber > 1) {
                            row.getCell(10).value = { formula: `VLOOKUP(G${rowNumber},Sku_Consolidated!A2:C${consolidatedSheet.lastRow.number}, 3, FALSE)`} // UOM
                            row.getCell(11).value = { formula: `IF(J${rowNumber}="PACK", I${rowNumber}, 0)`} // PACK
                            row.getCell(11).numFmt = `###0.00000`; // PACK FORMAT
                            row.getCell(12).value = { formula: `IF(J${rowNumber}="KG", I${rowNumber}, I${rowNumber} * VLOOOKUP(G${rowNumber},Sku_Consolidated!A2:U${consolidatedSheet.lastRow.number},21,FALSE))`} // KG
                            row.getCell(12).numFmt = `###0.00000`; // KG FORMAT
                            row.getCell(13).numFmt = `###0.00000`; // PCS FORMAT
                            row.getCell(15).numFmt = `###0.00000`; // COMM RATE FORMAT
                            row.getCell(16).value = { formula: `N${rowNumber} - O${rowNumber}`} // NET SALES
                            row.getCell(16).numFmt = `###0.00000`; // NET SALES FORMAT
                            row.getCell(17).value = { formula: `VLOOKUP(G${rowNumber},Sku_Consolidated!A2:G${consolidatedSheet.lastRow.number},7, FALSE)`} // SKU CATEGORY
                            row.getCell(18).value = { formula: `IF(IFERROR(VLOOKUP(E${rowNumber},Store_Showcase!B2:H${showcaseSheet.lastRow.number},7, FALSE), TRUE)=TRUE, IF(IFERROR(VLOOKUP(E${rowNumber},Store_SRP!B2:H${srpSheet.lastRow.number},7, FALSE), TRUE)=TRUE,VLOOKUP(E${rowNumber},Store_VAM!B2:H${vamSheet.lastRow.number},7, FALSE),VLOOKUP(E${rowNumber},Store_SRP!B2:H${srpSheet.lastRow.number},7, FALSE)), VLOOKUP(E${rowNumber},Store_Showcase!B2:H${showcaseSheet.lastRow.number},7, FALSE))`} // AREA
                            row.getCell(19).value = { formula: `IF(IFERROR(VLOOKUP(E${rowNumber},Store_Showcase!B2:I${showcaseSheet.lastRow.number},8, FALSE), TRUE)=TRUE, IF(IFERROR(VLOOKUP(E${rowNumber},Store_SRP!B2:I${srpSheet.lastRow.number},8, FALSE), TRUE)=TRUE,VLOOKUP(E${rowNumber},Store_VAM!B2:I${vamSheet.lastRow.number},8, FALSE),VLOOKUP(E${rowNumber},Store_SRP!B2:I${srpSheet.lastRow.number},8, FALSE)), VLOOKUP(E${rowNumber},Store_Showcase!B2:I${showcaseSheet.lastRow.number},8, FALSE))`} // KAM
                            row.getCell(20).value = { formula: `VLOOKUP(G${rowNumber},Sku_Consolidated!A2:R${consolidatedSheet.lastRow.number},18,FALSE)`} // SKU IDENTIFIER 1
                            row.getCell(22).value = { formula: `IF(VLOOKUP(G${rowNumber},Sku_Consolidated!A2:S${consolidatedSheet.lastRow.number},19,FALSE)="SHOWCASE", VLOOKUP(E${rowNumber},Store_Showcase!B2:L${showcaseSheet.lastRow.number},11, FALSE), IF(VLOOKUP(G${rowNumber},Sku_Consolidated!A2:S${consolidatedSheet.lastRow.number},19,FALSE)="VAM",VLOOKUP(E${rowNumber},Store_VAM!B2:L${vamSheet.lastRow.number},11, FALSE),VLOOKUP(E${rowNumber},Store_SRP!B2:L${srpSheet.lastRow.number},11, FALSE)))`} // BANNER
                            row.getCell(23).value = { formula: `VLOOKUP(G${rowNumber},Sku_Consolidated!A2:W${consolidatedSheet.lastRow.number},11,FALSE)`} // SKU PER BRAND
                            row.getCell(24).value = { formula: `VLOOKUP(G${rowNumber},Sku_Consolidated!A2:H${consolidatedSheet.lastRow.number},8,FALSE)`} // GENERALIZED SKU
                            row.getCell(25).value = { formula: `VLOOKUP(G${rowNumber},Sku_Consolidated!A2:I${consolidatedSheet.lastRow.number},9,FALSE)`} // MOTHER SKU
                            row.getCell(27).value = { formula: `VLOOKUP(G${rowNumber},Sku_Consolidated!A2:E${consolidatedSheet.lastRow.number},5,FALSE)`} // SKU DEPT
                            row.getCell(28).value = { formula: `IF(VLOOKUP(G${rowNumber},Sku_Consolidated!A2:S${consolidatedSheet.lastRow.number},19,FALSE)="SHOWCASE", VLOOKUP(E${rowNumber},Store_Showcase!B2:N${showcaseSheet.lastRow.number},13, FALSE), IF(VLOOKUP(G${rowNumber},Sku_Consolidated!A2:S${consolidatedSheet.lastRow.number},19,FALSE)="VAM",VLOOKUP(E${rowNumber},Store_VAM!B2:N${vamSheet.lastRow.number},13, FALSE),VLOOKUP(E${rowNumber},Store_SRP!B2:N${srpSheet.lastRow.number},13, FALSE)))`} // PLACEMENT
                            row.getCell(29).value = { formula: `IF(IFERROR(AB${rowNumber},TRUE)=TRUE, "-","OK")`} // PLACEMENT REMARKS
                        }
                    });

                    destinationWB.xlsx.writeFile(`${process.env.OUTPUT_FILE}`).then(() => {
                        const fileManager = new DataFiles();
                        fileManager.copyFile(`${process.env.OUTPUT_FILE}`,`${process.env.OUTPUT_FILE_PUREGOLD}`);

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
            })

        } catch(err) {
            console.error(error);
            return false;
        }
    }

    clearOutputDataSheet(workbook) {
        workbook.xlsx.readFile(`${process.env.OUTPUT_FILE}`).then(() => {
            const clearsheet = workbook.getWorksheet(`${process.env.CON_SHEET_PUREGOLD}`);
            const rowCount = clearsheet.rowCount;
            for (let i = rowCount; i > 1; i--) { clearsheet.spliceRows(i, 1); }                                
            workbook.xlsx.writeFile(`${process.env.OUTPUT_FILE}`);  
            
            this.removeUnrelatedSheets();
        });
    }

    removeUnrelatedSheets() {
        const workbook = new ExcelJS.Workbook();
        workbook.xlsx.readFile(`${process.env.OUTPUT_FILE_PUREGOLD}`).then(() => {
            workbook.eachSheet(sheet => {
                if (!sheet.name.startsWith('Sku_') && !sheet.name.startsWith('Store_') && sheet.name !== `${process.env.CON_SHEET_PUREGOLD}`) {
                    workbook.removeWorksheet(sheet.id);
                }                        
            });
            return workbook.xlsx.writeFile(`${process.env.OUTPUT_FILE_PUREGOLD}`);
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
            const salesType = this.salesType;
            const fileManager = new DataFiles();
            fileManager.source = process.env.RAW_DATA_PUREGOLD;
            const files = fileManager.listFiles().filter(f => f !== `${process.env.PROCESSED}`);
            if (files.length > 0) {
                let processResult = [];
                const promises = files.map(async(file) => {
                    return await this.processGeneration(file).then((item) => {                        
                        let isCompleted = item;
                        if (isCompleted) {
                            fileManager.destination = `${process.env.RAW_DATA_PUREGOLD}/${process.env.PROCESSED}`;
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
            fs.access(`${process.env.OUTPUT_FILE_PUREGOLD}`, fs.constants.F_OK, (err) => {
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

module.exports = { Puregold }