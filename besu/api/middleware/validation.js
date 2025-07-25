const Joi = require('joi');

const setValueSchema = Joi.object({
  value: Joi.number().integer().min(0).required()
});

const validateSetValue = (req, res, next) => {
  const { error } = setValueSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: error.details[0].message
    });
  }
  
  next();
};

module.exports = {
  validateSetValue
};
