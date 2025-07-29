# Besu Go API

A REST API written in Go for interacting with Hyperledger Besu smart contracts and PostgreSQL database.

## 🎯 Features

- **SET**: Set new values in the smart contract
- **GET**: Retrieve current values from the blockchain  
- **SYNC**: Synchronize blockchain values to the database
- **CHECK**: Compare database vs blockchain values
- Complete PostgreSQL integration
- Comprehensive error handling
- RESTful API design
- **Swagger UI Documentation**: Interactive API documentation at `/swagger/index.html`

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Go REST API   │    │  Hyperledger     │    │   PostgreSQL    │
│                 │────│     Besu         │    │    Database     │
│  - SET/GET      │    │  Smart Contract  │    │  Value Storage  │
│  - SYNC/CHECK   │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Go 1.23+
- PostgreSQL database running
- Hyperledger Besu network running
- SimpleStorage contract deployed

### Installation

```bash
# Clone and setup
cd go-api
make setup

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Deploy contract (if not already deployed)
make deploy-contract

# Run the API
make run
```

## 📋 API Endpoints

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/set` | Set new value in smart contract |
| `GET` | `/api/get` | Get current value from blockchain |
| `POST` | `/api/sync` | Sync blockchain value to database |
| `GET` | `/api/check` | Compare database vs blockchain values |

### Additional Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/history` | Get value change history |
| `GET` | `/api/status` | Get system status |
| `GET` | `/` | API information |
| `GET` | `/swagger/index.html` | **Swagger UI Documentation** |
| `GET` | `/swagger/spec` | OpenAPI 3.0 specification (YAML) |

## 🔧 Usage Examples

### Set Value
```bash
curl -X POST http://localhost:8080/api/set \
  -H "Content-Type: application/json" \
  -d '{"value": 42}'
```

### Get Value
```bash
curl http://localhost:8080/api/get
```

### Sync to Database
```bash
curl -X POST http://localhost:8080/api/sync
```

### Check Synchronization
```bash
curl http://localhost:8080/api/check
```

### Get History
```bash
curl "http://localhost:8080/api/history?limit=5&offset=0"
```

### Get Status
```bash
curl http://localhost:8080/api/status
```

### Access Swagger Documentation
```bash
# Open in browser
http://localhost:8080/swagger/index.html

# Get OpenAPI spec
curl http://localhost:8080/swagger/spec
```

## 📊 Response Examples

### Set Value Response
```json
{
  "success": true,
  "message": "Value set successfully",
  "data": {
    "value": "42",
    "tx_hash": "0xabc123..."
  }
}
```

### Get Value Response
```json
{
  "success": true,
  "data": {
    "value": "42",
    "source": "blockchain",
    "timestamp": "2025-07-26T14:30:00Z"
  }
}
```

### Check Response
```json
{
  "success": true,
  "data": {
    "database_value": "42",
    "blockchain_value": "42",
    "in_sync": true,
    "last_sync_time": "2025-07-26T14:25:00Z"
  }
}
```

## ⚙️ Configuration

Environment variables in `.env`:

```env
# Besu Configuration
BESU_RPC_URL=http://localhost:8545
BESU_NETWORK_ID=1337
CONTRACT_ADDRESS=0x...

# Database Configuration  
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=admin123
DB_NAME=besu_contracts

# API Configuration
API_PORT=8080
PRIVATE_KEY=your_private_key_here
```

## 🛠️ Development Commands

```bash
# Setup environment
make setup

# Run with hot reload
make dev

# Build application
make build

# Run tests
make test

# Format code
make fmt

# Check contract deployment
make check-contract

# Start full stack
make start-stack
```

## 📁 Project Structure

```
go-api/
├── cmd/                    # Application entrypoints
├── internal/              # Private application code
│   ├── blockchain/        # Blockchain client
│   ├── database/         # Database operations
│   ├── handlers/         # HTTP handlers
│   └── models/           # Data models
├── contracts/            # Contract ABIs
├── bin/                  # Built binaries
├── main.go              # Main application
├── Makefile             # Development commands
└── .env                 # Environment configuration
```

## 🔒 Security

- Private keys stored in environment variables
- Input validation on all endpoints
- Proper error handling and logging
- CORS headers configured

## 🧪 Testing

```bash
# Run all tests
make test

# Run with coverage
make test-coverage

# Lint code
make lint
```

## 🐳 Docker Support

```bash
# Build Docker image
make docker-build

# Run in container
make docker-run
```

## 📈 Monitoring

The `/api/status` endpoint provides:
- Network information
- Database connection status
- Contract deployment status
- Latest stored values

## 🤝 Integration

This Go API works alongside the existing Node.js API:
- **Node.js API**: Port 3001 (with Swagger docs)
- **Go API**: Port 8080 (focused on the 4 core operations)

## 🚨 Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Description of what went wrong"
}
```

## 📚 Dependencies

- **Gin**: HTTP web framework
- **go-ethereum**: Ethereum client library
- **lib/pq**: PostgreSQL driver
- **godotenv**: Environment variable loading

## 📖 Documentation

The API includes comprehensive Swagger UI documentation available at:
- **Interactive Docs**: http://localhost:8080/swagger/index.html
- **OpenAPI Spec**: http://localhost:8080/swagger/spec

The documentation provides:
- Complete endpoint descriptions
- Request/response schemas
- Example payloads
- Error response formats
- Interactive testing interface

---

## 🎉 Ready to Use!

The Go API provides all four required operations (SET, GET, SYNC, CHECK) with proper blockchain integration and database persistence.
