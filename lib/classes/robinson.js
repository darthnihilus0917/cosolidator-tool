const dotenv = require("dotenv");
dotenv.config();

const ExcelJS = require('exceljs');
const path = require('path');
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

                const destinationFile = `${process.env.OUTPUT_FILE_ROBINSON}`;
                const destinationSheetName = `${process.env.OUTPUT_SHEETNAME}`;
                const destinationWB = new ExcelJS.Workbook();
                destinationWB.xlsx.readFile('./output/output_data.xlsx').then(() => {
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
                                null, // COMM AMOUNT
                                parseFloat(rowData[9]).toFixed(5), // NET SALES
                                null, // SKU CATEGORY
                                null, // AREA
                                null, // KAM
                                null, // SKU REPORT IDENTIFIER 1
                                parseInt(rowData[2]), // UPC
                                null, // BANNER
                                null, // SKU PER BRAND
                                null, // GENERALIZED SKU
                                null, // MOTHER SKU
                                this.salesType, // SALES CATEGORY
                                null, // SKU DEPT.
                                null, // PLACEMENT
                                null, // PLACEMENT REMARKS
                                parseFloat(rowData[7]).toFixed(5), // NET TAX
                                parseFloat(rowData[8]).toFixed(5) // TAX
                            ]    
                            destinationSheet.addRow(newRowData);                 
                        }
                    });
                    destinationWB.xlsx.writeFile('./output/output_data.xlsx');

                    destinationSheet.eachRow({ includeEmpty: false, firstRow: 2}, (row, rowNumber) => {
                        if (rowNumber !== 1) {
                            row.getCell(17).value = { formula: `VLOOKUP(G${rowNumber},'Sku_Consolidated'!A${rowNumber}:G${consolidatedSheet.lastRow.number},7,FALSE)`}                            
                            row.getCell(18).value = { formula: `VLOOKUP(E${rowNumber},'Store_Showcase'!B${rowNumber}:H${showcaseSheet.lastRow.number},7,FALSE)`}
                            row.getCell(19).value = { formula: `VLOOKUP(E${rowNumber},'Store_Showcase'!B${rowNumber}:I${showcaseSheet.lastRow.number},8,FALSE)`}
                            row.getCell(20).value = { formula: `VLOOKUP(G${rowNumber},'Sku_Consolidated'!A${rowNumber}:R${consolidatedSheet.lastRow.number},18,FALSE)`}
                            row.getCell(22).value = { formula: `VLOOKUP(E${rowNumber},'Store_Showcase'!B${rowNumber}:L${showcaseSheet.lastRow.number},11,FALSE)`}
                            row.getCell(23).value = { formula: `VLOOKUP(G${rowNumber},'Sku_Consolidated'!A${rowNumber}:W${consolidatedSheet.lastRow.number},11,FALSE)`}
                            row.getCell(24).value = { formula: `VLOOKUP(G${rowNumber},'Sku_Consolidated'!A${rowNumber}:H${consolidatedSheet.lastRow.number},8,FALSE)`}
                            row.getCell(25).value = { formula: `VLOOKUP(G${rowNumber},'Sku_Consolidated'!A${rowNumber}:I${consolidatedSheet.lastRow.number},9,FALSE)`}                            
                            row.getCell(27).value = { formula: `VLOOKUP(G${rowNumber},'Sku_Consolidated'!A${rowNumber}:E${consolidatedSheet.lastRow.number},5,FALSE)`} // SKU DEPT
                            row.getCell(28).value = { formula: `VLOOKUP(E${rowNumber},'Store_Showcase'!B${rowNumber}:N${consolidatedSheet.lastRow.number},13,FALSE)`} // PLACEMENT
                            row.getCell(29).value = { formula: `IFNA(AB${rowNumber},"-")`} // PLACEMENT REMARKS
                        }
                    });
                    destinationWB.xlsx.writeFile('./output/output_data.xlsx');
                });                
            }).then(async() => {
                // console.log(`sheet initially updated`)
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

    async generateOutputData() {
        try {;
            const chain = this.chain;
            const salesType = this.salesType;
            const fileManager = new DataFiles();
            fileManager.source = (this.salesType === 'RETAIL') ? process.env.RAW_DATA_ROBINSON_RETAIL : process.env.RAW_DATA_ROBINSON_ECOMM;
            const files = fileManager.listFiles().filter(f => f !== `${process.env.PROCESSED}`);
            if (files.length > 0) {
                console.log(`${files.length} FILE(S) FOUND.`)
                let processResult = [];
                const promises = files.map(async(file) => {
                    return await this.processGeneration(file).then((item) => {                        
                        let isCompleted = item;
                        if (isCompleted) {
                            fileManager.destination = (this.salesType === 'RETAIL') 
                                ? `${process.env.RAW_DATA_ROBINSON_RETAIL}/${process.env.PROCESSED}` 
                                : `${process.env.RAW_DATA_ROBINSON_ECOMM}/${process.env.PROCESSED}`;                                
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
}

module.exports = { Robinson }