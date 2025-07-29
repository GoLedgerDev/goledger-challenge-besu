const { Web3 } = require('web3');
const fs = require('fs');

// Conectar ao Besu
const web3 = new Web3('http://localhost:8545');

async function quickDeploy() {
    try {
        console.log('🚀 Quick contract deployment...');
        
        // Ler contrato compilado
        const contractPath = './contracts/SimpleStorage.sol';
        const contractSource = fs.readFileSync(contractPath, 'utf8');
        
        // ABI e Bytecode simples para SimpleStorage
        const abi = [
            {
                "inputs": [{"internalType": "uint256", "name": "_value", "type": "uint256"}],
                "name": "set",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "get",
                "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "storedData",
                "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
                "stateMutability": "view",
                "type": "function"
            }
        ];

        // Bytecode compilado do SimpleStorage
        const bytecode = "0x608060405234801561001057600080fd5b50610150806100206000396000f3fe608060405234801561001057600080fd5b50600436106100415760003560e01c80632a1afcd914610046578063552410771461006457806360fe47b114610082575b600080fd5b61004e61009e565b60405161005b91906100d1565b60405180910390f35b61006c6100a4565b60405161007991906100d1565b60405180910390f35b61009c600480360381019061009791906100fb565b6100aa565b005b60005481565b60005490565b8060008190555050565b6000819050919050565b6100cb816100b4565b82525050565b60006020820190506100e660008301846100c2565b92915050565b6100f5816100b4565b811461010057600080fd5b50565b600081359050610112816100ec565b92915050565b60006020828403121561012e5761012d61012d565b5b600061013c84828501610103565b9150509291505056fea2646970667358221220c4c5398a54e5b50e4f287d7f85c6e7db2f8e3b9c5c5b5a7b4e3c5d5e5a5b5c5d64736f6c63430008110033";

        // Conta para deploy
        const account = '0xFE3B557E8Fb62b89F4916B721be55cEb828dBd73';
        const privateKey = '0x8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63';
        
        console.log('📊 Account:', account);
        
        // Criar contrato
        const contract = new web3.eth.Contract(abi);
        
        // Preparar deploy
        const deployTx = contract.deploy({
            data: bytecode,
        });
        
        const gas = await deployTx.estimateGas({ from: account });
        console.log('⛽ Estimated gas:', gas);
        
        // Assinar e enviar transação
        const txData = {
            data: deployTx.encodeABI(),
            gas: gas,
            gasPrice: '0',
            from: account,
        };
        
        console.log('📝 Signing transaction...');
        const signedTx = await web3.eth.accounts.signTransaction(txData, privateKey);
        
        console.log('🚀 Sending transaction...');
        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
        
        console.log('✅ Contract deployed!');
        console.log('📍 Address:', receipt.contractAddress);
        console.log('🧾 Transaction hash:', receipt.transactionHash);
        console.log('⛽ Gas used:', receipt.gasUsed);
        
        // Salvar endereço do contrato
        fs.writeFileSync('.env.contract', `CONTRACT_ADDRESS=${receipt.contractAddress}\n`);
        console.log('💾 Contract address saved to .env.contract');
        
        return receipt.contractAddress;
        
    } catch (error) {
        console.error('❌ Deployment failed:', error.message);
        throw error;
    }
}

// Executar
quickDeploy()
    .then(address => {
        console.log(`\n🎉 Deployment successful!\n📍 Contract address: ${address}`);
        process.exit(0);
    })
    .catch(error => {
        console.error('\n💥 Deployment failed:', error);
        process.exit(1);
    });
