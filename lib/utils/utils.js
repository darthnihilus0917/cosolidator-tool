const fs = require('fs');

const loader = () => {
    const frames = ['-', '\\', '|', '/'];
    let currentFrameIndex = 0;

    function updateLoader() {
        process.stdout.write(`\rProcessing ${frames[currentFrameIndex]}`);
        currentFrameIndex = (currentFrameIndex + 1) % frames.length;
    }

    const intervalId = setInterval(updateLoader, 100);

    return function stopLoader() {
        clearInterval(intervalId);
        process.stdout.write('\r');
    };
}

const startsWithZero = (value) => {
    return value.startsWith('0');
}

const removeLeadingZero = (value) => {
    return value.replace(/^0+/, '');
}

const convertPath = (path) => {
    path = path.replace(/\\/g, '/');
    return path;
}

const cutOffFormat = (value) => {
    const regex = /^([A-Za-z]{1,5}|[A-Za-z]{5}\s\d{1,2})\s\d{1,2}\s(TO|-)\s\d{1,2}$/i;
    return regex.test(value);
}

const loadTitle = () => {
    console.log("\n===============================");
    console.log("CHAIN CONSOLIDATOR TOOL v0.0.6");
    console.log("===============================");
}

const rawDataDateFormat = (dateValue) => {
    const day = new Date(dateValue).getDate().toLocaleString();
    const month = new Date(dateValue).getMonth() + 1;
    const year = new Date(dateValue).getFullYear();
    return `${month}/${day}/${year}`;
}

const mergeArrays = (branch, ...arrays) => {
    const length = arrays.reduce((minLength, arr) => Math.min(minLength, arr.length), Infinity);
    const merged = [];

    for (let i = 0; i < length; i++) {
        const newArray = arrays.map(arr => arr[i]);
        newArray.push(branch);
        merged.push(newArray);
    }    
    return merged;
}

const endsWithNumber = (str) => {
    const regex = /\d$/;
    return regex.test(str);
}

const removeLastNumber = (str) => {
    return str.replace(/\d$/, '');
}

const removePrecedingString = (str) => {
    const match = str.match(/\d+$/);
    return match ? match[0] : '';
}

const isNumeric = (str) => {
    const numRegex = /\d/;
    return numRegex.test(str);
}

const clearDataSheet = (sourceFile, sheetname, workbook) => {
    workbook.xlsx.readFile(sourceFile).then(() => {
        const clearsheet = workbook.getWorksheet(`${sheetname}`);
        const rowCount = clearsheet.rowCount;
        for (let i = rowCount; i > 1; i--) { clearsheet.spliceRows(i, 1); }                                
        workbook.xlsx.writeFile(sourceFile);  
    });
}

const checkFileExists = (sourceFile, callback) => {
    let attempts = 0;
    const maxAttempts = 3;
    const delay = 1000; // Delay in milliseconds between each attempt

    function check() {
        fs.access(`${sourceFile}`, fs.constants.F_OK, (err) => {
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

const removeUnrelatedSheets = (sourceFile, sheetname) => {
    const workbook = new ExcelJS.Workbook();
    workbook.xlsx.readFile(`${sourceFile}`).then(() => {
        workbook.eachSheet(sheet => {
            if (!sheet.name.startsWith('Sku_') && !sheet.name.startsWith('Store_') && sheet.name !== `${sheetname}`) {
                workbook.removeWorksheet(sheet.id);
            }
        });
        return workbook.xlsx.writeFile(`${sourceFile}`);
    })
}

module.exports = { 
    loader, 
    loadTitle,
    startsWithZero,
    removeLeadingZero,
    convertPath,
    cutOffFormat,
    rawDataDateFormat,
    mergeArrays,
    endsWithNumber,
    removeLastNumber,
    removePrecedingString,
    isNumeric
}