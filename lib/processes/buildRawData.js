const { Metro } = require('../classes/metro');
const { MerryMart } = require('../classes/merrymart');

const buildMetro = (msg, store, action) => {
    const metro = new Metro();
    metro.chain = store;
    metro.action = action;
    if (metro.buildRawData()) {
        metro.log();
        console.log(msg);
    }
}

const buildMerryMart = (msg, store, action) => {
    const merrymart = new MerryMart();
    merrymart.chain = store;
    merrymart.action = action;
    if (merrymart.buildRawData()) {
        merrymart.log();
        console.log(msg);
    }   
}

module.exports = { buildMetro, buildMerryMart }