const { Web3 } = require('web3');

async function triggerMining() {
    console.log("🔨 Trying to trigger block mining...");
    
    try {
        const web3 = new Web3('http://localhost:8545');
        
        // Alice's account
        const privateKey = '0x8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63';
        const account = web3.eth.accounts.privateKeyToAccount(privateKey);
        web3.eth.accounts.wallet.add(account);
        
        console.log("From account:", account.address);
        
        // Bob's address (hardcoded for testing)
        const bobAddress = '0x627306090abaB3A6e1400e9345bC60c78a8BEf57';
        
        // Send a simple transaction to trigger mining
        console.log("Sending transaction to trigger mining...");
        
        const tx = await web3.eth.sendTransaction({
            from: account.address,
            to: bobAddress,
            value: web3.utils.toWei('1', 'ether'),
            gas: 21000,
            gasPrice: web3.utils.toWei('20', 'gwei')
        });
        
        console.log("✅ Transaction sent:", tx.transactionHash);
        console.log("Block number:", tx.blockNumber);
        
        // Check if we have a new block
        const blockNumber = await web3.eth.getBlockNumber();
        console.log("Current block number:", blockNumber.toString());
        
        return tx;
        
    } catch (error) {
        console.error("❌ Failed to trigger mining:", error.message);
        throw error;
    }
}

if (require.main === module) {
    triggerMining()
        .then((tx) => {
            console.log("Mining triggered successfully!");
            process.exit(0);
        })
        .catch((error) => {
            console.error("Failed to trigger mining:", error);
            process.exit(1);
        });
}

module.exports = triggerMining;
