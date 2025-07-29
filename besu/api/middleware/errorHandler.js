const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let error = {
    success: false,
    error: 'Internal server error',
    details: err.message
  };

  // Web3 errors
  if (err.message && err.message.includes('revert')) {
    error.error = 'Transaction reverted';
    error.details = err.message;
    return res.status(400).json(error);
  }

  // Database errors
  if (err.code && err.code.startsWith('23')) {
    error.error = 'Database constraint violation';
    error.details = err.detail || err.message;
    return res.status(400).json(error);
  }

  // Network errors
  if (err.code === 'ECONNREFUSED') {
    error.error = 'Service unavailable';
    error.details = 'Cannot connect to external service';
    return res.status(503).json(error);
  }

  // Default to 500 server error
  res.status(500).json(error);
};

module.exports = errorHandler;
