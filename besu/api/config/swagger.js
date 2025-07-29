const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Besu Contract API',
      version: '1.0.0',
      description: `
        REST API for interacting with Hyperledger Besu blockchain network.
        
        This API provides endpoints for:
        - Health monitoring of Besu network and database
        - Smart contract interaction (SimpleStorage)
        - Transaction management and history
        - Network information
        
        ## Architecture
        - **Hyperledger Besu**: 4-node QBFT private network
        - **PostgreSQL**: Contract data persistence
        - **Web3.js**: Blockchain interaction
        - **Express.js**: REST API framework
      `,
      contact: {
        name: 'Besu Contract API',
        url: 'http://localhost:3001'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server'
      }
    ],
    tags: [
      {
        name: 'Health',
        description: 'System health and monitoring endpoints'
      },
      {
        name: 'Contracts',
        description: 'Smart contract interaction endpoints'
      },
      {
        name: 'SimpleStorage',
        description: 'SimpleStorage contract specific operations'
      }
    ],
    components: {
      schemas: {
        HealthResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'ok',
              description: 'Overall system status'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2025-07-26T14:03:11.064Z'
            },
            services: {
              type: 'object',
              properties: {
                besu: {
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                      example: 'connected'
                    },
                    blockNumber: {
                      type: 'string',
                      example: '0'
                    },
                    peerCount: {
                      type: 'string',
                      example: '3'
                    },
                    networkId: {
                      type: 'string',
                      example: '1337'
                    }
                  }
                },
                database: {
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                      example: 'connected'
                    },
                    timestamp: {
                      type: 'string',
                      format: 'date-time'
                    }
                  }
                },
                contract: {
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                      example: 'not_configured'
                    },
                    message: {
                      type: 'string',
                      example: 'Contract address not set in environment'
                    }
                  }
                }
              }
            }
          }
        },
        ContractInfo: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object',
              properties: {
                address: {
                  type: 'string',
                  example: '0x1234567890123456789012345678901234567890'
                },
                network: {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'string',
                      example: '1337'
                    },
                    rpcUrl: {
                      type: 'string',
                      example: 'http://localhost:8545'
                    }
                  }
                },
                account: {
                  type: 'object',
                  properties: {
                    address: {
                      type: 'string',
                      example: '0xFE3B557E8Fb62b89F4916B721be55cEb828dBd73'
                    },
                    balance: {
                      type: 'string',
                      example: '80000'
                    }
                  }
                }
              }
            }
          }
        },
        StorageValue: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object',
              properties: {
                value: {
                  type: 'string',
                  example: '42'
                },
                timestamp: {
                  type: 'string',
                  format: 'date-time'
                }
              }
            }
          }
        },
        SetValueRequest: {
          type: 'object',
          required: ['value'],
          properties: {
            value: {
              type: 'integer',
              minimum: 0,
              example: 42,
              description: 'Value to store in the contract'
            }
          }
        },
        TransactionResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object',
              properties: {
                transactionHash: {
                  type: 'string',
                  example: '0xabc123...'
                },
                blockNumber: {
                  type: 'string',
                  example: '1'
                },
                gasUsed: {
                  type: 'string',
                  example: '21000'
                },
                value: {
                  type: 'string',
                  example: '42'
                }
              }
            }
          }
        },
        TransactionHistory: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: {
                    type: 'integer',
                    example: 1
                  },
                  transaction_hash: {
                    type: 'string',
                    example: '0xabc123...'
                  },
                  block_number: {
                    type: 'string',
                    example: '1'
                  },
                  value: {
                    type: 'string',
                    example: '42'
                  },
                  gas_used: {
                    type: 'string',
                    example: '21000'
                  },
                  timestamp: {
                    type: 'string',
                    format: 'date-time'
                  }
                }
              }
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'string',
              example: 'Error message'
            },
            details: {
              type: 'string',
              example: 'Detailed error information'
            }
          }
        }
      },
      responses: {
        BadRequest: {
          description: 'Bad Request',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        InternalError: {
          description: 'Internal Server Error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        ServiceUnavailable: {
          description: 'Service Unavailable',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        }
      }
    }
  },
  apis: ['./routes/*.js', './index.js'], // paths to files containing OpenAPI definitions
};

const specs = swaggerJsdoc(options);

module.exports = specs;
