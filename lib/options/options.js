const chains = [
    'ROBINSON',
    'PUREGOLD',
    'METRO',
    'WESHOP',
    'WALTERMART',
    'MERRYMART',
    'EXIT'
];

const processes = [
    'BUILD RAW DATA',
    'GENERATE CHAIN OUTPUT DATA',
    'CONSOLIDATE',
    // 'CLEAR CHAIN OUTPUT DATA',
    'CANCEL',
    'EXIT'
];

const salesType = [
    'RETAIL',
    'E-COMM',
    'CANCEL',
    'EXIT'
];

const cutOffMonths = [
    'JAN',
    'FEB',
    'MAR',
    'APRIL',
    'MAY',
    'JUNE',
    'JULY',
    'AUG',
    'SEPT',
    'OCT',
    'NOV',
    'DEC'
]

module.exports = { chains, processes, salesType, cutOffMonths };