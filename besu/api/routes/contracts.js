const express = require('express');
const router = express.Router();
const contractService = require('../services/contractService');
const dbService = require('../services/dbService');
const { validateSetValue } = require('../middleware/validation');

/**
 * @swagger
 * /api/contracts/simple-storage:
 *   get:
 *     tags: [SimpleStorage]
 *     summary: Get stored value
 *     description: Retrieve the current value stored in the SimpleStorage contract
 *     responses:
 *       200:
 *         description: Current stored value
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StorageValue'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/simple-storage', async (req, res) => {
  try {
    const value = await contractService.getStoredValue();
    
    res.json({
      success: true,
      data: {
        value: value.toString(),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting stored value:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get stored value',
      details: error.message
    });
  }
});

/**
 * @swagger
 * /api/contracts/simple-storage:
 *   post:
 *     tags: [SimpleStorage]
 *     summary: Set stored value
 *     description: Set a new value in the SimpleStorage contract
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SetValueRequest'
 *     responses:
 *       200:
 *         description: Transaction successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TransactionResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/simple-storage', validateSetValue, async (req, res) => {
  try {
    const { value } = req.body;
    
    const result = await contractService.setStoredValue(value);
    
    // Store transaction in database
    await dbService.recordTransaction({
      txHash: result.transactionHash,
      contractAddress: process.env.SIMPLE_STORAGE_ADDRESS,
      methodName: 'set',
      inputValue: value,
      blockNumber: result.blockNumber,
      gasUsed: result.gasUsed
    });
    
    res.json({
      success: true,
      data: {
        transactionHash: result.transactionHash,
        blockNumber: result.blockNumber,
        gasUsed: result.gasUsed,
        value: value.toString()
      }
    });
  } catch (error) {
    console.error('Error setting value:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to set value',
      details: error.message
    });
  }
});

/**
 * @swagger
 * /api/contracts/simple-storage/history:
 *   get:
 *     tags: [SimpleStorage]
 *     summary: Get transaction history
 *     description: Retrieve transaction history for the SimpleStorage contract
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100
 *         description: Number of transactions to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *           minimum: 0
 *         description: Number of transactions to skip
 *     responses:
 *       200:
 *         description: Transaction history
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TransactionHistory'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/simple-storage/history', async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;
    
    const history = await dbService.getTransactionHistory(
      process.env.SIMPLE_STORAGE_ADDRESS,
      parseInt(limit),
      parseInt(offset)
    );
    
    res.json({
      success: true,
      data: history,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Error getting history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get transaction history',
      details: error.message
    });
  }
});

/**
 * @swagger
 * /api/contracts/simple-storage/info:
 *   get:
 *     tags: [SimpleStorage]
 *     summary: Get contract information
 *     description: Retrieve contract deployment information and network details
 *     responses:
 *       200:
 *         description: Contract information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ContractInfo'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/simple-storage/info', async (req, res) => {
  try {
    const info = await contractService.getContractInfo();
    
    res.json({
      success: true,
      data: info
    });
  } catch (error) {
    console.error('Error getting contract info:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get contract info',
      details: error.message
    });
  }
});

module.exports = router;
