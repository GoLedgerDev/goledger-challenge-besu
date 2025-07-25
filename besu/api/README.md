# Besu Contract REST API

REST API for interacting with smart contracts on Hyperledger Besu network.

## Features

- **Contract Interaction** - Read/Write to SimpleStorage contract
- **Transaction History** - PostgreSQL database integration
- **Health Checks** - Monitor Besu and database connectivity
- **Error Handling** - Comprehensive error responses
- **Validation** - Input validation with Joi

## Quick Start

### 1. Setup Infrastructure
```bash
# Start Besu network + PostgreSQL
./startDev.sh

# Deploy contract and configure API
./setup-api.sh
```

### 2. Start API
```bash
cd api
npm start
```

### 3. Test API
```bash
# Health check
curl http://localhost:3000/api/health

# Get current value
curl http://localhost:3000/api/contracts/simple-storage

# Set new value
curl -X POST http://localhost:3000/api/contracts/simple-storage \
  -H "Content-Type: application/json" \
  -d '{"value": 42}'
```

## API Endpoints

### Health Check
```http
GET /api/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2025-01-25T12:00:00.000Z",
  "services": {
    "besu": {
      "status": "connected",
      "blockNumber": "123",
      "peerCount": "3"
    },
    "database": {
      "status": "connected"
    },
    "contract": {
      "status": "configured",
      "address": "0x..."
    }
  }
}
```

### Get Stored Value
```http
GET /api/contracts/simple-storage
```

Response:
```json
{
  "success": true,
  "data": {
    "value": "42",
    "timestamp": "2025-01-25T12:00:00.000Z"
  }
}
```

### Set Stored Value
```http
POST /api/contracts/simple-storage
Content-Type: application/json

{
  "value": 123
}
```

Response:
```json
{
  "success": true,
  "data": {
    "transactionHash": "0x...",
    "blockNumber": 124,
    "gasUsed": 21000,
    "value": "123"
  }
}
```

### Get Transaction History
```http
GET /api/contracts/simple-storage/history?limit=10&offset=0
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "tx_hash": "0x...",
      "method_name": "set",
      "input_data": "{\"value\": 123}",
      "block_number": 124,
      "gas_used": 21000,
      "status": "success",
      "timestamp": "2025-01-25T12:00:00.000Z"
    }
  ],
  "pagination": {
    "limit": 10,
    "offset": 0
  }
}
```

### Get Contract Info
```http
GET /api/contracts/simple-storage/info
```

Response:
```json
{
  "success": true,
  "data": {
    "address": "0x...",
    "network": {
      "id": "1337",
      "rpcUrl": "http://localhost:8545"
    },
    "account": {
      "address": "0xfe3b557e8fb62b89f4916b721be55ceb828dbd73",
      "balance": "80000.0"
    },
    "currentValue": "123"
  }
}
```

## Configuration

Environment variables in `/api/.env`:

```bash
# Server
PORT=3000
NODE_ENV=development

# Besu Network
BESU_RPC_URL=http://localhost:8545
BESU_NETWORK_ID=1337

# Default Account (Alice)
DEFAULT_PRIVATE_KEY=8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63
DEFAULT_ADDRESS=0xfe3b557e8fb62b89f4916b721be55ceb828dbd73

# PostgreSQL Database
DATABASE_URL=postgresql://besu_user:besu_password@localhost:5432/besu_contracts

# Contract Address (set by setup-api.sh)
SIMPLE_STORAGE_ADDRESS=0x...
```

## Development

### Start in Development Mode
```bash
cd api
npm run dev  # Uses nodemon for auto-restart
```

### Run Tests
```bash
cd api
npm test
```

### Add New Contract

1. Add contract to `/contracts/`
2. Create service in `/api/services/`
3. Add routes in `/api/routes/`
4. Update deployment script

## Database Schema

The API automatically records:
- Contract deployments
- Transaction history
- Method calls
- Gas usage

Tables used:
- `contracts.deployed_contracts`
- `transactions.contract_transactions`

## Error Handling

All endpoints return consistent error format:

```json
{
  "success": false,
  "error": "Error description",
  "details": "Detailed error message"
}
```

Common status codes:
- `200` - Success
- `400` - Bad request/validation error
- `500` - Server error
- `503` - Service unavailable

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   REST API      │    │   Besu Network  │    │   PostgreSQL    │
│   (Express.js)  │───▶│   (4 nodes)     │    │   (Database)    │
│   Port 3000     │    │   Port 8545     │    │   Port 5432     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │  Smart Contract │
                    │ (SimpleStorage) │
                    └─────────────────┘
```

Ready for blockchain API development!
