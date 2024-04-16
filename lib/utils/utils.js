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

const loadTitle = () => {
    console.log("\n=============================");
    console.log("CHAIN CONSOLIDATOR TOOL");
    console.log("=============================");
}

module.exports = { 
    loader, 
    loadTitle,
    startsWithZero,
    removeLeadingZero,
    convertPath
}