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
                            const packColValue = (rowData[5] === 'PCK') ? parseFloat(rowData[6]).toFixed(5) : parseFloat(0).toFixed(5);
                            const pcsColValue = (rowData[5] === 'PCS') ? parseFloat(rowData[6]).toFixed(5) : parseFloat(0).toFixed(5);
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
                    const duplicated = await destinationWB.xlsx.writeFile(`${process.env.OUTPUT_FILE}`).then(() => {
                        // duplicate output data
                        this.duplicateSheetData(`${process.env.OUTPUT_FILE}`);
                    }).then(async() => {
                        return await true
                    }).catch(async(error) => {
                        console.log(error)
                        return await false;
                    });
                    if (duplicated) {
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
                                            tempoWBUpdateSheet[`L${rowNumber}`] = { z: '#,##0.00000', t: 'n', f: `IF(J${rowNumber}="KLS", I${rowNumber}, IF(J${rowNumber}="PCK", I${rowNumber}*VLOOKUP(G${rowNumber},Sku_Consolidated!A2:U${consolidatedSheet.lastRow.number},21, FALSE),I${rowNumber}*VLOOKUP(G${rowNumber},Sku_Consolidated!A2:U${consolidatedSheet.lastRow.number},21, FALSE)))`}
                                            tempoWBUpdateSheet[`Q${rowNumber}`] = { t: 'n', f: `VLOOKUP(G${rowNumber},Sku_Consolidated!A2:G${consolidatedSheet.lastRow.number},7, FALSE)`}
                                            tempoWBUpdateSheet[`R${rowNumber}`] = { t: 'n', f: `IF(IFERROR(VLOOKUP(E${rowNumber},Store_Showcase!B2:H${showcaseSheet.lastRow.number},7, FALSE), TRUE)=TRUE, IF(IFERROR(VLOOKUP(E${rowNumber},Store_SRP!B2:H${srpSheet.lastRow.number},7, FALSE), TRUE)=TRUE,VLOOKUP(E${rowNumber},Store_VAM!B2:H${vamSheet.lastRow.number},7, FALSE),VLOOKUP(E${rowNumber},Store_SRP!B2:H${srpSheet.lastRow.number},7, FALSE)), VLOOKUP(E${rowNumber},Store_Showcase!B2:H${showcaseSheet.lastRow.number},7, FALSE))`}
                                            tempoWBUpdateSheet[`S${rowNumber}`] = { t: 'n', f: `IF(IFERROR(VLOOKUP(E${rowNumber},Store_Showcase!B2:I${showcaseSheet.lastRow.number},8, FALSE), TRUE)=TRUE, IF(IFERROR(VLOOKUP(E${rowNumber},Store_SRP!B2:I${srpSheet.lastRow.number},8, FALSE), TRUE)=TRUE,VLOOKUP(E${rowNumber},Store_VAM!B2:I${vamSheet.lastRow.number},8, FALSE),VLOOKUP(E${rowNumber},Store_SRP!B2:I${srpSheet.lastRow.number},8, FALSE)), VLOOKUP(E${rowNumber},Store_Showcase!B2:I${showcaseSheet.lastRow.number},8, FALSE))`}
                                            tempoWBUpdateSheet[`T${rowNumber}`] = { t: 'n', f: `VLOOKUP(G${rowNumber},Sku_Consolidated!A2:R${consolidatedSheet.lastRow.number},18, FALSE)`}
                                            tempoWBUpdateSheet[`V${rowNumber}`] = { t: 'n', f: `IF(IFERROR(VLOOKUP(E${rowNumber},Store_Showcase!B2:L${showcaseSheet.lastRow.number},11, FALSE), TRUE)=TRUE, IF(IFERROR(VLOOKUP(E${rowNumber},Store_SRP!B2:K${srpSheet.lastRow.number},10, FALSE), TRUE)=TRUE,VLOOKUP(E${rowNumber},Store_VAM!B2:K${vamSheet.lastRow.number},10, FALSE),VLOOKUP(E${rowNumber},Store_SRP!B2:K${srpSheet.lastRow.number},10, FALSE)), VLOOKUP(E${rowNumber},Store_Showcase!B2:L${showcaseSheet.lastRow.number},11, FALSE))`}
                                            tempoWBUpdateSheet[`W${rowNumber}`] = { t: 'n', f: `VLOOKUP(G${rowNumber},Sku_Consolidated!A2:K${consolidatedSheet.lastRow.number},11, FALSE)`}
                                            tempoWBUpdateSheet[`X${rowNumber}`] = { t: 'n', f: `VLOOKUP(G${rowNumber},Sku_Consolidated!A2:H${consolidatedSheet.lastRow.number},8, FALSE)`}
                                            tempoWBUpdateSheet[`Y${rowNumber}`] = { t: 'n', f: `VLOOKUP(G${rowNumber},Sku_Consolidated!A2:I${consolidatedSheet.lastRow.number},9, FALSE)`}
                                            tempoWBUpdateSheet[`AA${rowNumber}`] = { t: 'n', f: `VLOOKUP(G${rowNumber},Sku_Consolidated!A2:E${consolidatedSheet.lastRow.number},5, FALSE)`}
                                            tempoWBUpdateSheet[`AB${rowNumber}`] = { t: 'n', f: `IF(IFERROR(VLOOKUP(E${rowNumber},Store_Showcase!B2:N${showcaseSheet.lastRow.number},13, FALSE), TRUE)=TRUE, IF(IFERROR(VLOOKUP(E${rowNumber},Store_SRP!B2:M${srpSheet.lastRow.number},12, FALSE), TRUE)=TRUE,VLOOKUP(E${rowNumber},Store_VAM!B2:M${vamSheet.lastRow.number},12, FALSE),VLOOKUP(E${rowNumber},Store_SRP!B2:M${srpSheet.lastRow.number},12, FALSE)), VLOOKUP(E${rowNumber},Store_Showcase!B2:N${showcaseSheet.lastRow.number},13, FALSE))`}
                                            tempoWBUpdateSheet[`AC${rowNumber}`] = { t: 'n', f: `IF(IFERROR(AB${rowNumber}, TRUE)=TRUE, "-", "OK")`}
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
        const srpSheet = destinationWBUpdate.Sheets['Store_SRP'];
        const vamSheet = destinationWBUpdate.Sheets['Store_VAM'];
        const consolidatedSheet = destinationWBUpdate.Sheets['Sku_Consolidated'];
        const commrateSheet = destinationWBUpdate.Sheets['Sku_CommRate'];
        const ninersSheet = destinationWBUpdate.Sheets['Sku_99ners'];

        const robinsonData = XLSX.utils.sheet_to_json(robinsonSheet, { raw: true});
        const showcaseData = XLSX.utils.sheet_to_json(showcaseSheet, { raw: true});
        const srpData = XLSX.utils.sheet_to_json(srpSheet, { raw: true});
        const vamData = XLSX.utils.sheet_to_json(vamSheet, { raw: true});
        const consolidatedData = XLSX.utils.sheet_to_json(consolidatedSheet, { raw: true});
        const commrateData = XLSX.utils.sheet_to_json(commrateSheet, { raw: true});
        const ninersData = XLSX.utils.sheet_to_json(ninersSheet, { raw: true});

        const newWB = XLSX.utils.book_new();
        const newRobinsonSheet = XLSX.utils.json_to_sheet(robinsonData);
        const newShowcaseSheet = XLSX.utils.json_to_sheet(showcaseData);
        const newSrpSheet = XLSX.utils.json_to_sheet(srpData);
        const newVamSheet = XLSX.utils.json_to_sheet(vamData);
        const newConsolidatedSheet = XLSX.utils.json_to_sheet(consolidatedData);
        const newCommRateSheet = XLSX.utils.json_to_sheet(commrateData);
        const newNinersSheet = XLSX.utils.json_to_sheet(ninersData);

        XLSX.utils.book_append_sheet(newWB, newShowcaseSheet, 'Store_Showcase');
        XLSX.utils.book_append_sheet(newWB, newSrpSheet, 'Store_SRP');
        XLSX.utils.book_append_sheet(newWB, newVamSheet, 'Store_VAM');
        XLSX.utils.book_append_sheet(newWB, newConsolidatedSheet, 'Sku_Consolidated');
        XLSX.utils.book_append_sheet(newWB, newCommRateSheet, 'Sku_CommRate');
        XLSX.utils.book_append_sheet(newWB, newNinersSheet, 'Sku_99ners');
        XLSX.utils.book_append_sheet(newWB, newRobinsonSheet, 'Robinson');
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