const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying SimpleStorage contract...");
  
  try {
    // Get the signer (Alice account)
    const [deployer] = await ethers.getSigners();
    console.log("📦 Deploying with account:", deployer.address);
    
    // Check balance
    const balance = await deployer.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");
    
    // Get the contract factory
    const SimpleStorage = await ethers.getContractFactory("SimpleStorage");
    
    // Deploy with explicit gas parameters
    const simpleStorage = await SimpleStorage.deploy({
      gasLimit: 2000000,
      gasPrice: ethers.parseUnits("1", "gwei")
    });
    
    console.log("⏳ Waiting for deployment...");
    await simpleStorage.waitForDeployment();
    
    const contractAddress = await simpleStorage.getAddress();
    console.log("✅ SimpleStorage deployed to:", contractAddress);
    
    // Test the contract
    console.log("🧪 Testing contract...");
    await simpleStorage.set(42);
    const value = await simpleStorage.get();
    console.log("📊 Initial value:", value.toString());
    
    return contractAddress;
  } catch (error) {
    console.error("❌ Error deploying contract:", error.message);
    throw error;
  }
}

main()
  .then((address) => {
    console.log("🎉 Deployment completed successfully!");
    console.log("📋 Contract address:", address);
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
