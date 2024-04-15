const { Robinson } = require('../classes/robinson');
const { Metro } = require('../classes/metro');
const { Puregold } = require('../classes/puregold');
const { MerryMart } = require('../classes/merrymart');
const { WalterMart } = require('../classes/waltermart');
const { WeShop } = require('../classes/weshop');

const consolidateRobinson = (msg, store, action) => {
    const robinson = new Robinson();
    robinson.chain = store;
    robinson.action = action;
    if (robinson.consolidate()) {
        robinson.log();
        console.log(msg);
    } 
}

const consolidateMetro = (msg, store, action) => {
    const metro = new Metro();
    metro.chain = store;
    metro.action = action;
    if (metro.consolidate()) {
        metro.log();
        console.log(msg);
    } 
}

const consolidatePuregold = (msg, store, action) => {
    const puregold = new Puregold();
    puregold.chain = store;
    puregold.action = action;
    if (puregold.consolidate()) {
        puregold.log();
        console.log(msg);
    }
}


module.exports = { consolidateMetro, consolidateRobinson, consolidatePuregold }