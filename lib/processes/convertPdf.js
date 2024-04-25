const dotenv = require("dotenv");
dotenv.config();

const { MerryMart } = require('../classes/merrymart');

const convertPdfMerryMart = async(store, action) => {
    const merrymart = new MerryMart();
    merrymart.chain = store;
    merrymart.action = action;
    const { isProcessed, statusMsg } = await merrymart.pdfToExcel();
    if (isProcessed) {
        merrymart.log();
        console.log(statusMsg);
    } else {
        console.log(statusMsg);
    }  
}

module.exports = { convertPdfMerryMart }