#!/bin/bash

# Deploy contract and start API

set -e

echo "🚀 Starting Besu Contract API Setup..."

# Check if infrastructure is running
echo "📋 Checking infrastructure..."
if ! docker ps | grep -q "besu-node-0"; then
    echo "❌ Besu network not running. Please run ./startDev.sh first"
    exit 1
fi

if ! docker ps | grep -q "besu-postgres"; then
    echo "❌ PostgreSQL not running. Please run ./database.sh start first"
    exit 1
fi

# Deploy contract if not already deployed
echo "📦 Deploying SimpleStorage contract..."
cd contracts
npx hardhat compile

# Deploy and capture address
DEPLOY_OUTPUT=$(npx hardhat ignition deploy ../ignition/modules/deploy.js --network besu --reset 2>&1)
echo "$DEPLOY_OUTPUT"

# Extract contract address from output
CONTRACT_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep -o "0x[a-fA-F0-9]\{40\}" | head -1)

if [ -z "$CONTRACT_ADDRESS" ]; then
    echo "❌ Failed to deploy contract or extract address"
    exit 1
fi

echo "✅ Contract deployed at: $CONTRACT_ADDRESS"

# Update API environment
cd ../api
echo "📝 Updating API configuration..."
sed -i "s/SIMPLE_STORAGE_ADDRESS=.*/SIMPLE_STORAGE_ADDRESS=$CONTRACT_ADDRESS/" .env

# Install API dependencies
echo "📦 Installing API dependencies..."
npm install

# Record contract deployment in database
echo "💾 Recording contract deployment..."
node -e "
const dbService = require('./services/dbService');
(async () => {
  try {
    await dbService.recordContractDeployment({
      contractName: 'SimpleStorage',
      contractAddress: '$CONTRACT_ADDRESS',
      deployerAddress: '0xfe3b557e8fb62b89f4916b721be55ceb828dbd73',
      deploymentTxHash: 'manual_deployment',
      deploymentBlockNumber: 1,
      abi: $(cat ../artifacts/contracts/SimpleStorage.sol/SimpleStorage.json | jq .abi),
      bytecode: '$(cat ../artifacts/contracts/SimpleStorage.sol/SimpleStorage.json | jq -r .bytecode)'
    });
    console.log('✅ Contract recorded in database');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error recording contract:', error.message);
    process.exit(1);
  }
})();
"

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Start the API: cd api && npm start"
echo "2. Test API: curl http://localhost:3000/api/health"
echo "3. View contract: curl http://localhost:3000/api/contracts/simple-storage"
echo ""
echo "📊 Endpoints:"
echo "- Health: http://localhost:3000/api/health"
echo "- Get value: GET http://localhost:3000/api/contracts/simple-storage"
echo "- Set value: POST http://localhost:3000/api/contracts/simple-storage"
echo "- History: GET http://localhost:3000/api/contracts/simple-storage/history"
echo ""
echo "💡 Contract Address: $CONTRACT_ADDRESS"
