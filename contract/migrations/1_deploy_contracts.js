const EHRmain = artifacts.require("EHRmain");
const EHRFeatures = artifacts.require("EHRFeatures");
const EHRProxy = artifacts.require("EHRProxy");

module.exports = async function (deployer, network, accounts) {
    // Step 1: Deploy the logic contracts
    await deployer.deploy(EHRmain);
    const ehrMain = await EHRmain.deployed();
    console.log("EHRmain (Logic A) deployed to:", ehrMain.address);

    await deployer.deploy(EHRFeatures);
    const ehrFeatures = await EHRFeatures.deployed();
    console.log("EHRFeatures (Logic B) deployed to:", ehrFeatures.address);

    // Step 2: Deploy the Proxy contract
    await deployer.deploy(EHRProxy);
    const proxy = await EHRProxy.deployed();
    console.log("EHRProxy (Main Entry Point) deployed to:", proxy.address);

    // Step 3: Link the proxy to the logic contracts
    console.log("Linking proxy to logic contracts...");

    // Helper function to get function signatures from a contract's ABI
    const getSignatures = (contract) => {
        return contract.abi
            .filter(item => item.type === 'function')
            .map(item => {
                const inputs = item.inputs.map(input => input.type).join(',');
                const signature = `${item.name}(${inputs})`;
                // Use web3 to calculate the 4-byte signature hash
                return web3.utils.sha3(signature).slice(0, 10);
            });
    };

    const ehrMainSignatures = getSignatures(EHRmain);
    const ehrFeaturesSignatures = getSignatures(EHRFeatures);
    
    // Set the logic contracts on the proxy
    await proxy.setLogicContracts(ehrMainSignatures, ehrMain.address, { from: accounts[0] });
    console.log(`Registered ${ehrMainSignatures.length} functions for EHRmain.`);

    await proxy.setLogicContracts(ehrFeaturesSignatures, ehrFeatures.address, { from: accounts[0] });
    console.log(`Registered ${ehrFeaturesSignatures.length} functions for EHRFeatures.`);

    console.log("--- Deployment and linking complete ---");
    console.log("Your DApp should now interact with the EHRProxy address:", proxy.address);
};