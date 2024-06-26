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

const generateMetro = async(store, action, cutOff) => {
    const metro = new Metro();
    metro.chain = store;
    metro.action = action;
    metro.cutOff = cutOff;
    const { isProcessed, statusMsg } = await metro.generateOutputData();
    if (isProcessed) {
        metro.log();
        console.log(statusMsg);
    } else {
        console.log(statusMsg);
    }
}

const generatePuregold = async(store, action, cutOff) => {
    const puregold = new Puregold();
    puregold.chain = store;
    puregold.action = action;
    puregold.cutOff = cutOff;
    const { isProcessed, statusMsg } = await puregold.generateOutputData();
    if (isProcessed) {
        puregold.log();
        console.log(statusMsg);
    } else {
        console.log(statusMsg);
    }
}

const generateMerryMart = async(store, action, cutOff) => {
    const merrymart = new MerryMart();
    merrymart.chain = store;
    merrymart.action = action;
    merrymart.cutOff = cutOff;
    const { isProcessed, statusMsg } = await merrymart.generateOutputData();
    if (isProcessed) {
        merrymart.log();
        console.log(statusMsg);
    } else {
        console.log(statusMsg);
    }
}

const generateWalterMart = async(store, action, cutOff) => {
    const waltermart = new WalterMart();
    waltermart.chain = store;
    waltermart.action = action;
    waltermart.cutOff = cutOff;
    const { isProcessed, statusMsg } = await waltermart.generateOutputData();
    if (isProcessed) {
        waltermart.log();
        console.log(statusMsg);
    } else {
        console.log(statusMsg);
    }
}

const generateWeShop = async(store, action, cutOff) => {
    const weshop = new WeShop();
    weshop.chain = store;
    weshop.action = action;
    weshop.cutOff = cutOff;
    const { isProcessed, statusMsg } = await weshop.generateOutputData();
    if (isProcessed) {
        weshop.log();
        console.log(statusMsg);
    } else {
        console.log(statusMsg);
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