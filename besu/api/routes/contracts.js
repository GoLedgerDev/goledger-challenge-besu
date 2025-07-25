const express = require('express');
const router = express.Router();
const contractService = require('../services/contractService');
const dbService = require('../services/dbService');
const { validateSetValue } = require('../middleware/validation');

// GET /api/contracts/simple-storage
// Get current stored value
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

// POST /api/contracts/simple-storage
// Set new value
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

// GET /api/contracts/simple-storage/history
// Get transaction history
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

// GET /api/contracts/simple-storage/info
// Get contract information
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
