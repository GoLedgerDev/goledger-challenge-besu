const { Pool } = require('pg');

class DatabaseService {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
  }

  async recordTransaction(transactionData) {
    const {
      txHash,
      contractAddress,
      methodName,
      inputValue,
      blockNumber,
      gasUsed
    } = transactionData;

    const query = `
      INSERT INTO transactions.contract_transactions 
      (tx_hash, contract_address, method_name, input_data, block_number, gas_used, status, timestamp)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING id
    `;

    const values = [
      txHash,
      contractAddress,
      methodName,
      JSON.stringify({ value: inputValue }),
      blockNumber,
      gasUsed,
      'success'
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async getTransactionHistory(contractAddress, limit = 10, offset = 0) {
    const query = `
      SELECT 
        tx_hash,
        method_name,
        input_data,
        block_number,
        gas_used,
        status,
        timestamp
      FROM transactions.contract_transactions
      WHERE contract_address = $1
      ORDER BY timestamp DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await this.pool.query(query, [contractAddress, limit, offset]);
    return result.rows;
  }

  async getTransactionCount(contractAddress) {
    const query = `
      SELECT COUNT(*) as total
      FROM transactions.contract_transactions
      WHERE contract_address = $1
    `;

    const result = await this.pool.query(query, [contractAddress]);
    return parseInt(result.rows[0].total);
  }

  async recordContractDeployment(contractData) {
    const {
      contractName,
      contractAddress,
      deployerAddress,
      deploymentTxHash,
      deploymentBlockNumber,
      abi,
      bytecode
    } = contractData;

    const query = `
      INSERT INTO contracts.deployed_contracts 
      (contract_name, contract_address, deployer_address, deployment_tx_hash, deployment_block_number, abi, bytecode, network_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `;

    const values = [
      contractName,
      contractAddress,
      deployerAddress,
      deploymentTxHash,
      deploymentBlockNumber,
      JSON.stringify(abi),
      bytecode,
      parseInt(process.env.BESU_NETWORK_ID)
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async getDeployedContracts() {
    const query = `
      SELECT 
        contract_name,
        contract_address,
        deployer_address,
        deployment_timestamp,
        network_id
      FROM contracts.deployed_contracts
      WHERE status = 'active'
      ORDER BY deployment_timestamp DESC
    `;

    const result = await this.pool.query(query);
    return result.rows;
  }

  async close() {
    await this.pool.end();
  }
}

module.exports = new DatabaseService();
