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
    console.log("CHAIN CONSOLIDATOR TOOL v1.0.0");
    console.log("===============================");
}

module.exports = { 
    loader, 
    loadTitle,
    startsWithZero,
    removeLeadingZero,
    convertPath,
    cutOffFormat
}