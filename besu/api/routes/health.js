const express = require('express');
const router = express.Router();
const { Web3 } = require('web3');
const { Pool } = require('pg');

/**
 * @swagger
 * /api/health:
 *   get:
 *     tags: [Health]
 *     summary: System health check
 *     description: Check the status of all system components including Besu network, database, and contracts
 *     responses:
 *       200:
 *         description: System health status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {}
  };

  try {
    // Check Besu connection
    const web3 = new Web3(process.env.BESU_RPC_URL);
    const blockNumber = await web3.eth.getBlockNumber();
    const peerCount = await web3.eth.net.getPeerCount();
    
    health.services.besu = {
      status: 'connected',
      blockNumber: blockNumber.toString(),
      peerCount: peerCount.toString(),
      networkId: process.env.BESU_NETWORK_ID
    };
  } catch (error) {
    health.services.besu = {
      status: 'error',
      error: error.message
    };
    health.status = 'degraded';
  }

  try {
    // Check PostgreSQL connection
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
    
    const result = await pool.query('SELECT NOW()');
    await pool.end();
    
    health.services.database = {
      status: 'connected',
      timestamp: result.rows[0].now
    };
  } catch (error) {
    health.services.database = {
      status: 'error',
      error: error.message
    };
    health.status = 'degraded';
  }

  // Check if contract address is configured
  if (process.env.SIMPLE_STORAGE_ADDRESS) {
    health.services.contract = {
      status: 'configured',
      address: process.env.SIMPLE_STORAGE_ADDRESS
    };
  } else {
    health.services.contract = {
      status: 'not_configured',
      message: 'Contract address not set in environment'
    };
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

module.exports = router;
