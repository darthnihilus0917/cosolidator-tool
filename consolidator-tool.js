const readline = require("readline");
const dotenv = require("dotenv");
dotenv.config();

const { chains, processes, salesType, cutOffMonths } = require('./lib/options/options');
const { loadTitle, cutOffFormat } = require('./lib/utils/utils');
const { appLabels } = require('./lib/contants/contants');

const { buildMetro, buildMerryMart } = require('./lib/processes/buildRawData');
const { consolidateRobinson, consolidateMetro, consolidatePuregold,
    consolidateWeShop, consolidateMerrymart, consolidateWaltermart} = require('./lib/processes/consolidate');

const { generateRobinson, generateMerryMart, generateMetro, 
    generatePuregold, generateWalterMart, generateWeShop } = require("./lib/processes/generateChainOutput");
const { convertPdfMerryMart } = require("./lib/processes/convertPdf");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(question, options) {
  return new Promise((resolve, reject) => {
    const numberedOptions = options.map((option, index) => `[${index + 1}] ${option}`);
    rl.question(question + "\n" + numberedOptions.join("\n") + "\n", (answer) => {
            const selectedOption = options[parseInt(answer) - 1];
            if (selectedOption) {
                resolve(selectedOption.toUpperCase());
            } else {
                console.log(appLabels.invalidAnswer);
                askQuestion(question, options).then(resolve).catch(reject);
            }
        }
    );
  });
}

function askCutOff(question) {
    return new Promise((resolve, reject) => {
        rl.question(question + ': ', (answer) => {
            if (typeof answer === 'string' && answer.trim() !== '') {
                resolve(answer.trim());
            } else {
                reject(new Error(`${appLabels.invalidCutOff}`));
            }
        });
    });
}

async function main() {
  try {
    let store = "";

    while (store !== "EXIT") {
        const storeOptions = chains;

        loadTitle();
        
        store = await askQuestion("Select A Concessionaire:", storeOptions);

        if (store === "EXIT") {
            const confirmation = await askQuestion(appLabels.confirmExit,["Yes", "No"]);
            if (confirmation === "NO") {
                store = ""; // Reset store to continue the loop
                continue;
            }
            console.log(appLabels.closingApp);
            rl.close();
            return;
        }

        console.log('\nYou selected:', store);

        let actions = processes;

        if (store === "ROBINSON" || store === "PUREGOLD" || store === "WESHOP" || store === "WALTERMART") {
            actions = actions.filter((action) => action !== "BUILD RAW DATA");
        }

        if (store === "ROBINSON" || store === "PUREGOLD" || store === "WESHOP" 
            || store === "METRO" || store === "WALTERMART") {
            actions = actions.filter((action) => action !== "CONVERT PDF TO EXCEL");
        }

        // let cutOff = "";
        // while(true) {
        //     cutOff = await askCutOff('\nPlease provide a cut-off date');
        //     console.log(`\nYou entered:`, cutOff);
        //     break;            
        //     // if (cutOffFormat(cutOff) && cutOffMonths.includes(cutOff.split(" ")[0])) {
        //     //     console.log(`\nYou entered:`, cutOff);
        //     //     break;
        //     // } else {
        //     //     console.log(`${appLabels.invalidCutOff}`);
        //     // }
        // }

        let action = "";
        while (action !== "EXIT") {
            action = await askQuestion("\nWhat do you want to do?", actions);

            if (action === "EXIT") {
                const confirmation = await askQuestion(appLabels.confirmExit, ["Yes", "No"]);
                if (confirmation === "NO") {
                    action = ""; // Reset action to continue the loop
                    continue;
                }
                console.log(appLabels.closingApp);
                rl.close();
                return;
            }
            console.log('\nYou selected:', action);

            if (action === "CANCEL") {
                break; // break to go back to store selection
            }

            if (action === "CONSOLIDATE") {
                console.log(`Consolidating ${store} data. Please wait...`);
                switch(store) {
                    case "ROBINSON":
                        await consolidateRobinson(store, action, cutOff, salesType);
                        break;                    
                    case "PUREGOLD":
                        await consolidatePuregold(store, action, cutOff);
                        break;
                    case "METRO":
                        await consolidateMetro(store, action, cutOff);
                        break;
                    case "WESHOP":
                        await consolidateWeShop(store, action, cutOff);
                        break;
                    case "MERRYMART":
                        await consolidateMerrymart(store, action, cutOff);
                        break;
                    case "WALTERMART":
                        await consolidateWaltermart(store, action, cutOff);
                        break;                        
                    default:
                        console.log(`${appLabels.processNotAvailable} ${store}.`);
                }
            }

            if (action === "CONVERT PDF TO EXCEL") {
                switch(store) {
                    case "MERRYMART":
                        await convertPdfMerryMart(store, action);
                        break;
                    default:
                        console.log(`${appLabels.processNotAvailable} ${store}.`);
                }
            }

            if (action === "BUILD RAW DATA") {
                switch(store) {
                    case "METRO":
                        await buildMetro(store, action);
                        break;
                    case "MERRYMART":
                        await buildMerryMart(store, action);
                        break;
                    default:
                        console.log(`${appLabels.processNotAvailable} ${store}.`);
                }
                // const continueProcessing = await askQuestion(`\n${appLabels.confirmProcessing}`, ['Yes', 'No']);
                // if (continueProcessing === 'YES') {
                //     break;
                // } else {
                //     console.log(appLabels.closingApp);
                //     rl.close();
                //     return;
                // }
            }

            if (action === "GENERATE CHAIN OUTPUT DATA" && store !== "ROBINSON") {

                let cutOff = "";
                while(true) {
                    cutOff = await askCutOff('\nPlease provide a cut-off date');
                    console.log(`\nYou entered:`, cutOff);
                    break;
                }

                switch(store) {
                    case "WESHOP":
                        await generateWeShop(store, action, cutOff);
                        break;                    
                    case "WALTERMART":
                        await generateWalterMart(store, action, cutOff);
                        break;
                    case "PUREGOLD":
                        await generatePuregold(store, action, cutOff);
                        break;                    
                    case "METRO":
                        await generateMetro(store, action, cutOff);
                        break;
                    case "MERRYMART":
                        await generateMerryMart(store, action, cutOff);
                        break
                    default:
                        console.log(`${appLabels.processNotAvailable} ${store}.`);
                }
            }

            if (action === "GENERATE CHAIN OUTPUT DATA" && store === "ROBINSON") {

                let cutOff = "";
                while(true) {
                    cutOff = await askCutOff('\nPlease provide a cut-off date');
                    console.log(`\nYou entered:`, cutOff);
                    break;
                }

                const salesTypeOptions = salesType;
                const salesTypeOutput = await askQuestion("\nSelect Sales Type:", salesTypeOptions);
                if (salesTypeOutput === "RETAIL" || salesTypeOutput === "E-COMM") {
                    console.log("\nYou selected:", salesTypeOutput);
                    await generateRobinson(store, salesTypeOutput, action, cutOff);
                    // break;

                } else if (salesType === "CANCEL") {
                    console.log("You selected:", salesType);
                    break;
                }                
            }

            // if (action === "CLEAR CHAIN OUTPUT DATA") {
            //     console.log(`${store}: Output Data Sheet Cleared!`);
            //     continue;
            // }
      }
    }
  } catch (err) {
    console.error(err.message);

  } finally {
    rl.close();
  }
}

main();
