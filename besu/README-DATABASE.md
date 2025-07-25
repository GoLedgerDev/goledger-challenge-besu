# Besu + PostgreSQL Infrastructure

Complete blockchain infrastructure with Hyperledger Besu QBFT network and PostgreSQL database for contract data storage.

## Components

### Blockchain Network
- **4 Besu QBFT nodes** (Byzantine fault tolerance)
- **Network ID**: 1337
- **Block time**: 2 seconds

### Database
- **PostgreSQL 15** 
- **PgAdmin 4** (Web interface)
- **Schemas**: `contracts`, `transactions`, `events`

## Access Points

| Service | Port | URL/Endpoint |
|---------|------|--------------|
| **Besu RPC** | 8545 | http://localhost:8545 |
| **Besu Node 1** | 8546 | http://localhost:8546 |
| **Besu Node 2** | 8547 | http://localhost:8547 |
| **Besu Node 3** | 8548 | http://localhost:8548 |
| **PostgreSQL** | 5432 | `postgresql://besu_user:besu_password@localhost:5432/besu_contracts` |
| **PgAdmin** | 8080 | http://localhost:8080 |

## Quick Start

### Start Everything
```bash
./startDev.sh
```

### Manage Database Only
```bash
./database.sh start    # Start database
./database.sh stop     # Stop database
./database.sh connect  # Connect to database
./database.sh status   # Check status
./database.sh logs     # View logs
```

### Check Status
```bash
docker ps
curl -X POST --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' http://localhost:8545
```

## Database Structure

### Tables Created
- `contracts.deployed_contracts` - Deployed contracts
- `transactions.contract_transactions` - Contract transactions
- `events.contract_events` - Contract events
- `contracts.contract_storage` - Contract storage state

### Example Queries
```sql
-- View deployed contracts
SELECT * FROM contracts.active_contracts;

-- View recent transactions
SELECT * FROM transactions.recent_transactions;
```

## Database Access

### PgAdmin Web Interface
1. Go to: http://localhost:8080
2. Login: `admin@besu.local` / `admin123`
3. Add server:
   - Host: `besu-postgres`
   - Port: `5432`
   - Database: `besu_contracts`
   - Username: `besu_user`
   - Password: `besu_password`

### Direct Connection
```bash
./database.sh connect
```

### Application Integration
```javascript
// Node.js example
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://besu_user:besu_password@localhost:5432/besu_contracts'
});

// Insert deployed contract
await pool.query(`
  INSERT INTO contracts.deployed_contracts 
  (contract_name, contract_address, deployer_address, deployment_tx_hash, deployment_block_number)
  VALUES ($1, $2, $3, $4, $5)
`, [name, address, deployer, txHash, blockNumber]);
```

## Configuration

### Environment Variables (.env.database)
```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=besu_contracts
DB_USER=besu_user
DB_PASSWORD=besu_password
DATABASE_URL=postgresql://besu_user:besu_password@localhost:5432/besu_contracts
```

## Maintenance

```bash
./database.sh backup                    # Create backup
./database.sh restore backup_file.sql   # Restore backup
./database.sh reset                     # Reset everything
```

## Security Note

⚠️ **Development only**: Change all default passwords for production use.

---

Ready for DApp development with data persistence!
