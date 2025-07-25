const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 Starting SimpleStorage deployment...");
    
    try {
        // Get the deployer account
        const [deployer] = await ethers.getSigners();
        console.log("📝 Deploying with account:", deployer.address);
        
        // Check balance
        const balance = await deployer.provider.getBalance(deployer.address);
        console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");
        
        // Get the contract factory
        const SimpleStorage = await ethers.getContractFactory("SimpleStorage");
        
        // Deploy with explicit gas settings for Besu
        console.log("⚙️ Deploying contract...");
        const simpleStorage = await SimpleStorage.deploy({
            gasLimit: 500000,
            gasPrice: ethers.parseUnits("20", "gwei")
        });
        
        // Wait for deployment
        await simpleStorage.waitForDeployment();
        const address = await simpleStorage.getAddress();
        
        console.log("✅ SimpleStorage deployed to:", address);
        
        // Test the contract
        console.log("🧪 Testing contract...");
        const initialValue = await simpleStorage.get();
        console.log("Initial value:", initialValue.toString());
        
        // Set a test value
        const tx = await simpleStorage.set(42, {
            gasLimit: 100000,
            gasPrice: ethers.parseUnits("20", "gwei")
        });
        await tx.wait();
        
        const newValue = await simpleStorage.get();
        console.log("New value after setting 42:", newValue.toString());
        
        // Save deployment info
        const deploymentInfo = {
            address: address,
            deployer: deployer.address,
            network: "besu",
            chainId: 1337,
            timestamp: new Date().toISOString(),
            gasUsed: tx.gasUsed?.toString() || "unknown"
        };
        
        const fs = require('fs');
        fs.writeFileSync(
            './api/deployment.json', 
            JSON.stringify(deploymentInfo, null, 2)
        );
        
        console.log("📄 Deployment info saved to api/deployment.json");
        console.log("🎉 Deployment completed successfully!");
        
        return address;
        
    } catch (error) {
        console.error("❌ Deployment failed:", error.message);
        throw error;
    }
}

// Execute if run directly
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = main;
