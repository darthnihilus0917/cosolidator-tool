const readline = require("readline");
const dotenv = require("dotenv");
dotenv.config();

const { chains, processes, salesType, cutOffMonths } = require('./lib/options/options');
const { loadTitle, cutOffFormat } = require('./lib/utils/utils');
const { appLabels } = require('./lib/contants/contants');

const { buildMetro, buildMerryMart } = require('./lib/processes/buildRawData');
const { consolidateRobinson, consolidateMetro, consolidatePuregold } = require('./lib/processes/consolidate');
const { generateRobinson, generateMerryMart, generateMetro, generatePuregold, generateWalterMart, generateWeShop } = require("./lib/processes/generateChainOutput");

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

        if (store === "ROBINSON" || store === "PUREGOLD" || store === "WESHOP") {
            actions = actions.filter((action) => action !== "BUILD RAW DATA");
        }

        let cutOff = "";
        while(true) {
            cutOff = await askCutOff('\nPlease provide a cut-off date');
            if (cutOffFormat(cutOff) && cutOffMonths.includes(cutOff.split(" ")[0])) {
                console.log(`\nYou entered:`, cutOff);
                break;
            } else {
                console.log(`${appLabels.invalidCutOff}`);
            }
        }

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
                switch(store) {
                    case "ROBINSON":
                        consolidateRobinson(`${store} - ${appLabels.consolidationMsg}`, store, action);
                        break;
                    case "PUREGOLD":
                        consolidatePuregold(`${store} - ${appLabels.consolidationMsg}`, store, action);
                        break;
                    case "METRO":
                        consolidateMetro(`${store} - ${appLabels.consolidationMsg}`, store, action);
                        break;                        
                    default:
                        console.log(`${appLabels.processNotAvailable} ${store}.`);
                }                
                break;
            }

            if (action === "BUILD RAW DATA") {                
                switch(store) {
                    case "METRO":
                        buildMetro(`${store} - ${appLabels.rawDataMsg}`, store, action);
                        break;
                    case "MERRYMART":
                        buildMerryMart(`${store} - ${appLabels.rawDataMsg}`, store, action);
                        break;
                    default:
                        console.log(`${appLabels.processNotAvailable} ${store}.`);
                }
                const continueProcessing = await askQuestion(`\n${appLabels.confirmProcessing}`, ['Yes', 'No']);
                if (continueProcessing === 'YES') {
                    break;
                } else {
                    console.log(appLabels.closingApp);
                    rl.close();
                    return;
                }
            }

            if (action === "GENERATE CHAIN OUTPUT DATA" && store !== "ROBINSON") {

                switch(store) {
                    case "WESHOP":
                        generateWeShop(`${store} - ${appLabels.chainMsg}`,store, action, cutOff);
                        break;                    
                    case "WALTERMART":
                        generateWalterMart(`${store} - ${appLabels.chainMsg}`, store, action, cutOff);
                        break;
                    case "PUREGOLD":
                        generatePuregold(`${store} - ${appLabels.chainMsg}`, store, action, cutOff);
                        break;                    
                    case "METRO":
                        generateMetro(`${store} - ${appLabels.chainMsg}`, store, action, cutOff);
                        break;
                    case "MERRYMART":
                        generateMerryMart(`${store} - ${appLabels.chainMsg}`, store, action, cutOff);
                        break
                    default:
                        console.log(`${appLabels.processNotAvailable} ${store}.`);
                }
            }

            if (action === "GENERATE CHAIN OUTPUT DATA" && store === "ROBINSON") {
                const salesTypeOptions = salesType;
                const salesTypeOutput = await askQuestion("\nSelect Sales Type:", salesTypeOptions);
                if (salesTypeOutput === "RETAIL" || salesTypeOutput === "E-COMM") {
                    console.log("\nYou selected:", salesTypeOutput);
                    await generateRobinson(store, salesTypeOutput, action, cutOff);
                    break;

                } else if (salesType === "CANCEL") {
                    console.log("You selected:", salesType);
                    break;
                }                
            }

            if (action === "CLEAR CHAIN OUTPUT DATA") {
                console.log(`${store}: Output Data Sheet Cleared!`);
                continue;
            }
      }
    }
  } catch (err) {
    console.error(err.message);

  } finally {
    rl.close();
  }
}

main();
