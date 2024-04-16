const dotenv = require("dotenv");
dotenv.config();

const ExcelJS = require('exceljs');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs')
const { Log } = require('./logs');
const { DataFiles } = require('./files');
const { appLabels } = require('../contants/contants');
const { startsWithZero, removeLeadingZero, convertPath } = require('../utils/utils');

class Robinson {
    constructor() {
        this.salesType = null;
        this.chain = null;
        this.action = null;
    }

    setChain(chain) { this.chain = chain; }
    getChain() { return this.chain; }

    setSalesType(salesType) { this.salesType = salesType; }
    getSalesType() { return this.salesType; }

    setAction(action) { this.action = action; }
    getAction() { return this.action; }

    log() {
        const log = new Log();
        log.filePath = `${process.env.LOG_FILE}`;
        log.chain = this.chain;
        log.salesType = this.salesType;
        log.action = this.action;
        log.logActivity();
    }

    async processGeneration(filename){
        try {
            const currentDate = new Date();

            const sourceFile = (this.salesType === 'RETAIL') ? `${process.env.RAW_DATA_ROBINSON_RETAIL}/${filename}` : `${process.env.RAW_DATA_ROBINSON_ECOMM}/${filename}`
            const sourceSheetName = (this.salesType === 'RETAIL') ? `${process.env.RETAIL_SHEETNAME}` : `${process.env.ECOMM_SHEETNAME}`;        
            const sourceWB = new ExcelJS.Workbook();
            return await sourceWB.xlsx.readFile(sourceFile).then(() => {
                const sourceSheet = sourceWB.getWorksheet(sourceSheetName);

                const destinationWB = new ExcelJS.Workbook();
                destinationWB.xlsx.readFile(`${process.env.OUTPUT_FILE}`).then(async() => {
                    const destinationSheet = destinationWB.getWorksheet('Robinson');

                    const showcaseSheet = destinationWB.getWorksheet('Store_Showcase');
                    const srpSheet = destinationWB.getWorksheet('Store_SRP');
                    const vamSheet = destinationWB.getWorksheet('Store_VAM');
        
                    const consolidatedSheet = destinationWB.getWorksheet('Sku_Consolidated');
                    const commrateSheet = destinationWB.getWorksheet('Sku_CommRate');
                    const ninersSheet = destinationWB.getWorksheet('Sku_99ners');

                    sourceSheet.eachRow({ includeEmpty: false }, (row) => {
                        const rowData = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(col => row.getCell(col).value);   
                            
                        if (startsWithZero(rowData[0])) {
                            const filenameSegments = filename.split(' ');    
                            const packColValue = (rowData[5] === 'KLS') ? parseFloat(0).toFixed(5) : parseFloat(rowData[6]).toFixed(5);
                            const pcsColValue = (rowData[5] === 'KLS') ? parseFloat(0).toFixed(5) : parseFloat(rowData[6]).toFixed(5);
                            const kgColValue = (rowData[5] === 'KLS') ? parseFloat(rowData[6]).toFixed(5) : parseFloat(0).toFixed(5);
    
                            const newRowData = [
                                currentDate.getFullYear(), // YEAR
                                filenameSegments[0].toUpperCase(), // MONTH
                                `${filenameSegments[0]} ${filenameSegments[1]} to ${filenameSegments[3]}`.toUpperCase().replace(",", ""), // CUT-OFF
                                this.chain, // CHAIN
                                parseInt(removeLeadingZero(rowData[3])), // BRANCH CODE
                                rowData[4], // BRANCH
                                parseInt(removeLeadingZero(rowData[0])), // SKU
                                rowData[1], // DESCRIPTION
                                parseFloat(rowData[6]).toFixed(5), // ORIG QTY
                                rowData[5], // UOM
                                packColValue, // PACK
                                kgColValue, // KG
                                pcsColValue, // PCS
                                parseFloat(rowData[9]).toFixed(5), // GROSS SALES
                                parseFloat(0).toFixed(5), // COMM AMOUNT
                                parseFloat(rowData[9]).toFixed(5), // NET SALES
                                "-", // SKU CATEGORY
                                "-", // AREA
                                "-", // KAM
                                "-", // SKU REPORT IDENTIFIER 1
                                parseInt(rowData[2]), // UPC
                                "-", // BANNER
                                "-", // SKU PER BRAND
                                "-", // GENERALIZED SKU
                                "-", // MOTHER SKU
                                this.salesType, // SALES CATEGORY
                                "-", // SKU DEPT.
                                "-", // PLACEMENT
                                "-", // PLACEMENT REMARKS
                                parseFloat(rowData[7]).toFixed(5), // NET TAX
                                parseFloat(rowData[8]).toFixed(5) // TAX
                            ]    
                            destinationSheet.addRow(newRowData);                 
                        }
                    });
                    const fileExist = await destinationWB.xlsx.writeFile(`${process.env.OUTPUT_FILE}`).then(() => {
                        // duplicate output data
                        this.duplicateSheetData(`${process.env.OUTPUT_FILE}`);
                    }).then(async() => {
                        return await true
                    }).catch(async(error) => {
                        console.log(error)
                        return await false;
                    });
                    if (fileExist) {
                        this.checkFileExists(async(err, exists) => {
                            if (err) {
                                console.error('Error:', err.message);
                            } else {
                                console.log('File exists:', exists);
                                const tempoWB = new ExcelJS.Workbook();
                                await tempoWB.xlsx.readFile(`./output/tempo_sheet.xlsx`).then(() => {
                                    const tempoSheet = tempoWB.getWorksheet('Robinson');        
                                    const tempoWBUpdate = XLSX.readFile('./output/tempo_sheet.xlsx');
                                    const tempoWBUpdateSheet = tempoWBUpdate.Sheets['Robinson'];
        
                                    tempoSheet.eachRow({includeEmpty: false }, (row, rowNumber) => {
                                        if (rowNumber !== 1) {
                                            tempoWBUpdateSheet[`R${rowNumber}`] = { t: 'n', f: `VLOOKUP(E${rowNumber},Store_Showcase!B2:H134,7, FALSE)`}
                                            tempoWBUpdateSheet[`S${rowNumber}`] = { t: 'n', f: `VLOOKUP(E${rowNumber},Store_Showcase!B2:I134,8, FALSE)`}
                                        }
                                    })
                                    XLSX.writeFile(tempoWBUpdate, './output/tempo_sheet.xlsx')
                                });                                   
                            }
                        });
                    }
                });
            }).then(async() => {
                return await true;
            }).catch(async(err) => {
                console.log(err)
                return await false;
            }); 
        } catch(err) {
            console.log(err)
            return false;
        }
    }

    duplicateSheetData(targetFile) {
        const destinationWBUpdate = XLSX.readFile(targetFile);
        const robinsonSheet = destinationWBUpdate.Sheets['Robinson'];
        const showcaseSheet = destinationWBUpdate.Sheets['Store_Showcase'];
        const robinsonData = XLSX.utils.sheet_to_json(robinsonSheet);
        const showcaseData = XLSX.utils.sheet_to_json(showcaseSheet);

        const newWB = XLSX.utils.book_new();
        const newRobinsonSheet = XLSX.utils.json_to_sheet(robinsonData);
        const newShowcaseSheet = XLSX.utils.json_to_sheet(showcaseData);
        XLSX.utils.book_append_sheet(newWB, newRobinsonSheet, 'Robinson');
        XLSX.utils.book_append_sheet(newWB, newShowcaseSheet, 'Store_Showcase');
        XLSX.writeFile(newWB, './output/tempo_sheet.xlsx');
    }
    
    async generateOutputData() {
        try {
            const chain = this.chain;
            const salesType = this.salesType;
            const fileManager = new DataFiles();
            fileManager.source = (this.salesType === 'RETAIL') ? process.env.RAW_DATA_ROBINSON_RETAIL : process.env.RAW_DATA_ROBINSON_ECOMM;
            const files = fileManager.listFiles().filter(f => f !== `${process.env.PROCESSED}`);
            if (files.length > 0) {
                // console.log(`${files.length} FILE(S) FOUND.`);
                let processResult = [];
                const promises = files.map(async(file) => {
                    return await this.processGeneration(file).then((item) => {                        
                        let isCompleted = item;
                        if (isCompleted) {
                            // fileManager.destination = (this.salesType === 'RETAIL') 
                            //     ? `${process.env.RAW_DATA_ROBINSON_RETAIL}/${process.env.PROCESSED}` 
                            //     : `${process.env.RAW_DATA_ROBINSON_ECOMM}/${process.env.PROCESSED}`;                                
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
                            statusMsg: `${chain}: ${salesType} - ${appLabels.chainMsg}`
                        }
                    }
                });

            } else {
                return {
                    isProcessed: false,
                    statusMsg: `NO DATA FILE(S) FOUND FROM ${chain}: ${salesType}!`
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
            fs.access(`./output/tempo_sheet.xlsx`, fs.constants.F_OK, (err) => {
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

module.exports = { Robinson }