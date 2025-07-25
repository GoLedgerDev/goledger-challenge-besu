require('dotenv').config();
const { Web3 } = require('web3');

class ContractService {
  constructor() {
    this.web3 = new Web3(process.env.BESU_RPC_URL);
    this.contractAddress = process.env.SIMPLE_STORAGE_ADDRESS;
    this.privateKey = process.env.DEFAULT_PRIVATE_KEY;
    
    console.log('Private key from env:', this.privateKey ? 'loaded' : 'undefined');
    console.log('Private key type:', typeof this.privateKey);
    
    if (!this.privateKey) {
      throw new Error('DEFAULT_PRIVATE_KEY not found in environment variables');
    }
    
    // Remove 0x prefix if present for consistency
    const cleanPrivateKey = this.privateKey.startsWith('0x') ? this.privateKey.slice(2) : this.privateKey;
    this.account = this.web3.eth.accounts.privateKeyToAccount('0x' + cleanPrivateKey);
    
    // SimpleStorage ABI
    this.contractABI = [
      {
        "inputs": [],
        "name": "get",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [{"internalType": "uint256", "name": "x", "type": "uint256"}],
        "name": "set",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ];
    
    if (this.contractAddress) {
      this.contract = new this.web3.eth.Contract(this.contractABI, this.contractAddress);
    }
  }

  async getStoredValue() {
    if (!this.contract) {
      throw new Error('Contract address not configured');
    }
    
    const value = await this.contract.methods.get().call();
    return value;
  }

  async setStoredValue(value) {
    if (!this.contract) {
      throw new Error('Contract address not configured');
    }

    const data = this.contract.methods.set(value).encodeABI();
    
    const gasEstimate = await this.web3.eth.estimateGas({
      to: this.contractAddress,
      data: data,
      from: this.account.address
    });

    const tx = {
      to: this.contractAddress,
      data: data,
      gas: gasEstimate,
      gasPrice: await this.web3.eth.getGasPrice(),
      from: this.account.address
    };

    const signedTx = await this.web3.eth.accounts.signTransaction(tx, this.privateKey);
    const receipt = await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    
    return {
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed,
      status: receipt.status
    };
  }

  async getContractInfo() {
    const info = {
      address: this.contractAddress,
      network: {
        id: process.env.BESU_NETWORK_ID,
        rpcUrl: process.env.BESU_RPC_URL
      },
      account: {
        address: this.account.address,
        balance: null
      }
    };

    try {
      const balance = await this.web3.eth.getBalance(this.account.address);
      info.account.balance = this.web3.utils.fromWei(balance, 'ether');
    } catch (error) {
      info.account.balance = 'Error fetching balance';
    }

    if (this.contract) {
      try {
        const currentValue = await this.getStoredValue();
        info.currentValue = currentValue.toString();
      } catch (error) {
        info.currentValue = 'Error fetching value';
      }
    }

    return info;
  }
}

module.exports = new ContractService();
