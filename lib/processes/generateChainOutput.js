const dotenv = require("dotenv");
dotenv.config();

const { Robinson } = require('../classes/robinson');
const { Metro } = require('../classes/metro');
const { Puregold } = require('../classes/puregold');
const { MerryMart } = require('../classes/merrymart');
const { WalterMart } = require('../classes/waltermart');
const { WeShop } = require('../classes/weshop');

const generateRobinson = async(store, salesType, action, cutOff) => {    
    const robinson = new Robinson();
    robinson.salesType = salesType;
    robinson.chain = store;
    robinson.action = action;
    robinson.cutOff = cutOff;
    const { isProcessed, statusMsg } = await robinson.generateOutputData();
    if (isProcessed) {
        robinson.log();
        console.log(statusMsg);
    } else {
        console.log(statusMsg);
    }
}

const generateMetro = (msg, store, action) => {
    const metro = new Metro();
    metro.chain = store;
    metro.action = action;
    if (metro.generateOutputData()) {
        metro.log();
        console.log(msg);
    }
}

const generatePuregold = (msg, store, action) => {
    const puregold = new Puregold();
    puregold.chain = store;
    puregold.action = action;
    if (puregold.generateOutputData()) {
        puregold.log();
        console.log(msg);
    } 
}

const generateMerryMart = (msg, store, action) => {
    const merrymart = new MerryMart();
    merrymart.chain = store;
    merrymart.action = action;
    if (merrymart.generateOutputData()) {
        merrymart.log();
        console.log(msg);
    }
}

const generateWalterMart = (msg, store, action) => {
    const waltermart = new WalterMart();
    waltermart.chain = store;
    waltermart.action = action;
    if (waltermart.generateOutputData()) {
        waltermart.log();
        console.log(msg);
    }
}

const generateWeShop = (msg, store, action) => {
    const weshop = new WeShop();
    weshop.chain = store;
    weshop.action = action;
    if (weshop.generateOutputData()) {
        weshop.log();
        console.log(msg);
    }
}

module.exports = {
  generateRobinson,
  generateMetro,
  generatePuregold,
  generateMerryMart,
  generateWalterMart,
  generateWeShop
};