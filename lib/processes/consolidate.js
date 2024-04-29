const { Robinson } = require('../classes/robinson');
const { Metro } = require('../classes/metro');
const { Puregold } = require('../classes/puregold');
const { MerryMart } = require('../classes/merrymart');
const { WalterMart } = require('../classes/waltermart');
const { WeShop } = require('../classes/weshop');

const consolidateRobinson = async(store, action, cutOff, salesType) => {
    const robinson = new Robinson();
    robinson.chain = store;
    robinson.action = action;
    robinson.cutOff = cutOff;
    robinson.salesType = salesType;
    const { isProcessed, statusMsg } = await robinson.consolidate();
    if (isProcessed) {
        robinson.log();
        console.log(statusMsg);
    } else {
        console.log(statusMsg);
    }
}

const consolidateMetro = (store, action, cutOff) => {
    const metro = new Metro();
    metro.chain = store;
    metro.action = action;
    metro.cutOff = cutOff;
    if (metro.consolidate()) {
        metro.log();
        console.log(msg);
    } 
}

const consolidatePuregold = (store, action, cutOff) => {
    const puregold = new Puregold();
    puregold.chain = store;
    puregold.action = action;
    puregold.cutOff = cutOff;
    if (puregold.consolidate()) {
        puregold.log();
        console.log(msg);
    }
}

const consolidateWeShop = (store, action, cutOff) => {
    const weshop = new WeShop();
    weshop.chain = store;
    weshop.action = action;
    weshop.cutOff = cutOff;
    if (puregold.consolidate()) {
        puregold.log();
        console.log(msg);
    }
}

const consolidateMerrymart = (store, action, cutOff) => {
    const merrymart = new MerryMart();
    merrymart.chain = store;
    merrymart.action = action;
    merrymart.cutOff = cutOff;
    if (merrymart.consolidate()) {
        merrymart.log();
        console.log(msg);
    }
}

const consolidateWaltermart = (store, action, cutOff) => {
    const waltermart = new WalterMart();
    waltermart.chain = store;
    waltermart.action = action;
    waltermart.cutOff = cutOff;
    if (waltermart.consolidate()) {
        waltermart.log();
        console.log(msg);
    }
}

module.exports = { 
    consolidateMetro, 
    consolidateRobinson, 
    consolidatePuregold,
    consolidateWeShop,
    consolidateMerrymart,
    consolidateWaltermart
}