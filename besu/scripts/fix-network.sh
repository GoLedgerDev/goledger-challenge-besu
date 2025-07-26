#!/bin/bash

echo "🔧 Fixing Besu network connectivity..."

# Get the actual bootnode enode with correct IP
BOOTNODE_IP=$(docker inspect besu-node-0 | jq -r '.[0].NetworkSettings.Networks.besu_network.IPAddress')
echo "📍 Bootnode IP: $BOOTNODE_IP"

# Get bootnode's enode from logs and replace IP
BOOTNODE_ENODE=$(docker logs besu-node-0 2>&1 | grep "Enode URL" | tail -1 | sed 's/.*enode:\/\//enode:\/\//' | sed 's/@127\.0\.0\.1:/@'$BOOTNODE_IP':/')
echo "🔗 Bootnode enode: $BOOTNODE_ENODE"

if [ -z "$BOOTNODE_ENODE" ]; then
    echo "❌ Could not get bootnode enode"
    exit 1
fi

# Create temporary docker-compose with correct enode
cat > docker/docker-compose-nodes-fixed.yaml << EOF
version: '2.1'
services:
  besu-node-1:
    user: root
    container_name: besu-node-1
    volumes:
      - ../node/besu-1/data:/opt/besu/data
      - ../genesis:/opt/besu/genesis
    image: hyperledger/besu:latest
    entrypoint:
      - /bin/bash
      - -c
      - besu --data-path=data --genesis-file=genesis/genesis.json --bootnodes=$BOOTNODE_ENODE --p2p-port=30304 --rpc-http-enabled --rpc-http-api=ETH,NET,QBFT --host-allowlist="*" --rpc-http-cors-origins="all" --rpc-http-port=8546
    ports:
      - "8546:8546"
      - "30304:30304"
    networks:
      besu_network:
    restart: always
  besu-node-2:
    user: root
    container_name: besu-node-2
    volumes:
      - ../node/besu-2/data:/opt/besu/data
      - ../genesis:/opt/besu/genesis
    image: hyperledger/besu:latest
    entrypoint:
      - /bin/bash
      - -c
      - besu --data-path=data --genesis-file=genesis/genesis.json --bootnodes=$BOOTNODE_ENODE --p2p-port=30305 --rpc-http-enabled --rpc-http-api=ETH,NET,QBFT --host-allowlist="*" --rpc-http-cors-origins="all" --rpc-http-port=8547
    ports:
      - "8547:8547"
      - "30305:30305"
    networks:
      besu_network:
    restart: always
  besu-node-3:
    user: root
    container_name: besu-node-3
    volumes:
      - ../node/besu-3/data:/opt/besu/data
      - ../genesis:/opt/besu/genesis
    image: hyperledger/besu:latest
    entrypoint:
      - /bin/bash
      - -c
      - besu --data-path=data --genesis-file=genesis/genesis.json --bootnodes=$BOOTNODE_ENODE --p2p-port=30306 --rpc-http-enabled --rpc-http-api=ETH,NET,QBFT --host-allowlist="*" --rpc-http-cors-origins="all" --rpc-http-port=8548
    ports:
      - "8548:8548"
      - "30306:30306"
    networks:
      besu_network:
    restart: always

networks:
  besu_network:
    external: true
EOF

echo "✅ Created fixed docker-compose file"

# Restart nodes with correct configuration
echo "🔄 Restarting nodes with correct bootnode enode..."
docker compose -f docker/docker-compose-nodes-fixed.yaml up -d

echo "⏳ Waiting for nodes to connect..."
sleep 15

# Check peer count
echo "📊 Checking peer connections..."
PEER_COUNT=$(curl -s -X POST http://localhost:8545 -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}' | jq -r '.result')
echo "🔗 Peer count: $PEER_COUNT"

if [ "$PEER_COUNT" != "0x0" ]; then
    echo "✅ Network fixed! Peers connected: $PEER_COUNT"
else
    echo "⚠️ Still no peers. Checking logs..."
    echo "--- Node 1 logs ---"
    docker logs besu-node-1 --tail 5
fi
