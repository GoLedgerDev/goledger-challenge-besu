const { Web3 } = require('web3');
const fs = require('fs');
const path = require('path');

// Read the compiled contract
const contractPath = path.join(__dirname, '../artifacts/contracts/SimpleStorage.sol/SimpleStorage.json');
const contractJson = JSON.parse(fs.readFileSync(contractPath, 'utf8'));

async function main() {
    console.log("🚀 Starting SimpleStorage deployment with Web3...");
    
    try {
        // Connect to Besu node
        const web3 = new Web3('http://localhost:8545');
        
        // Check connection
        const blockNumber = await web3.eth.getBlockNumber();
        console.log("📊 Connected to Besu - Block number:", blockNumber);
        
        // Account setup - using Alice's private key
        const privateKey = '0x8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63';
        const account = web3.eth.accounts.privateKeyToAccount(privateKey);
        web3.eth.accounts.wallet.add(account);
        web3.eth.defaultAccount = account.address;
        
        console.log("📝 Deploying with account:", account.address);
        
        // Check balance
        const balance = await web3.eth.getBalance(account.address);
        console.log("💰 Account balance:", web3.utils.fromWei(balance, 'ether'), "ETH");
        
        // Create contract instance
        const contract = new web3.eth.Contract(contractJson.abi);
        
        // Deploy contract
        console.log("⚙️ Deploying contract...");
        
        const deployTx = contract.deploy({
            data: contractJson.bytecode,
            arguments: []
        });
        
        // Estimate gas
        const gasEstimate = await deployTx.estimateGas({ from: account.address });
        console.log("⛽ Estimated gas:", gasEstimate.toString());
        
        // Deploy with manual gas settings
        const deployedContract = await deployTx.send({
            from: account.address,
            gas: Number(gasEstimate) + 50000, // Add buffer
            gasPrice: web3.utils.toWei('20', 'gwei')
        });
        
        const contractAddress = deployedContract.options.address;
        console.log("✅ SimpleStorage deployed to:", contractAddress);
        
        // Test the contract
        console.log("🧪 Testing contract...");
        
        // Get initial value
        const initialValue = await deployedContract.methods.get().call();
        console.log("Initial value:", initialValue);
        
        // Set a test value
        console.log("Setting value to 42...");
        const setTx = await deployedContract.methods.set(42).send({
            from: account.address,
            gas: 100000,
            gasPrice: web3.utils.toWei('20', 'gwei')
        });
        
        console.log("Transaction hash:", setTx.transactionHash);
        
        // Get new value
        const newValue = await deployedContract.methods.get().call();
        console.log("New value after setting 42:", newValue);
        
        // Save deployment info
        const deploymentInfo = {
            address: contractAddress,
            deployer: account.address,
            network: "besu",
            chainId: 1337,
            timestamp: new Date().toISOString(),
            gasUsed: setTx.gasUsed?.toString() || "unknown",
            deploymentTxHash: deployedContract.transactionHash || "unknown"
        };
        
        const deploymentPath = path.join(__dirname, '../api/deployment.json');
        fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
        
        console.log("📄 Deployment info saved to api/deployment.json");
        console.log("🎉 Deployment completed successfully!");
        
        // Update API .env file
        const envPath = path.join(__dirname, '../api/.env');
        let envContent = '';
        
        if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, 'utf8');
        }
        
        // Update or add SIMPLE_STORAGE_ADDRESS
        if (envContent.includes('SIMPLE_STORAGE_ADDRESS=')) {
            envContent = envContent.replace(
                /SIMPLE_STORAGE_ADDRESS=.*/,
                `SIMPLE_STORAGE_ADDRESS=${contractAddress}`
            );
        } else {
            envContent += `\nSIMPLE_STORAGE_ADDRESS=${contractAddress}\n`;
        }
        
        fs.writeFileSync(envPath, envContent);
        console.log("📝 Updated API .env with contract address");
        
        return contractAddress;
        
    } catch (error) {
        console.error("❌ Deployment failed:", error);
        if (error.message) console.error("Error message:", error.message);
        if (error.stack) console.error("Stack trace:", error.stack);
        throw error;
    }
}

// Execute if run directly
if (require.main === module) {
    main()
        .then((address) => {
            console.log(`Contract deployed at: ${address}`);
            process.exit(0);
        })
        .catch((error) => {
            console.error("Deployment script failed:", error);
            process.exit(1);
        });
}

module.exports = main;
