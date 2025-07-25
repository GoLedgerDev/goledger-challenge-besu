# Besu QBFT Network + PostgreSQL

Local development infrastructure with Hyperledger Besu blockchain and PostgreSQL database.

## Quick Start

```bash
# Start everything (blockchain + database)
./startDev.sh

# Check status
docker ps

# Test blockchain
curl -X POST --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' http://localhost:8545

# Manage database
./database.sh help
```

## What's Included

- **4 Besu QBFT nodes** (ports 8545-8548)
- **PostgreSQL database** (port 5432) 
- **PgAdmin web interface** (port 8080)
- **Smart contract tables** ready to use

## Access Points

| Service | URL | Credentials |
|---------|-----|-------------|
| Besu RPC | http://localhost:8545 | - |
| PgAdmin | http://localhost:8080 | admin@besu.local / admin123 |
| PostgreSQL | localhost:5432 | besu_user / besu_password |

## Database Schema

Ready-to-use tables for:
- Contract deployments
- Transactions 
- Events
- Storage state

## Files

- `startDev.sh` - Start full infrastructure
- `database.sh` - Database management helper
- `README-DATABASE.md` - Detailed database documentation
- `.env.database` - Database configuration

## Development

1. Deploy contracts to Besu network
2. Store contract data in PostgreSQL
3. Query data via PgAdmin or direct connection
4. Build monitoring dashboards

Ready for DApp development!
