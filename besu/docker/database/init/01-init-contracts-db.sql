-- Script de inicialização do banco para contratos Besu
-- Este script será executado automaticamente na primeira inicialização

-- Criação do schema principal
CREATE SCHEMA IF NOT EXISTS contracts;
CREATE SCHEMA IF NOT EXISTS transactions;
CREATE SCHEMA IF NOT EXISTS events;

-- Tabela para registrar contratos deployados
CREATE TABLE IF NOT EXISTS contracts.deployed_contracts (
    id SERIAL PRIMARY KEY,
    contract_name VARCHAR(255) NOT NULL,
    contract_address VARCHAR(42) NOT NULL UNIQUE,
    deployer_address VARCHAR(42) NOT NULL,
    deployment_tx_hash VARCHAR(66) NOT NULL,
    deployment_block_number BIGINT NOT NULL,
    deployment_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    abi JSONB,
    bytecode TEXT,
    source_code TEXT,
    compiler_version VARCHAR(50),
    optimization_enabled BOOLEAN DEFAULT FALSE,
    network_id INTEGER DEFAULT 1337,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para transações relacionadas aos contratos
CREATE TABLE IF NOT EXISTS transactions.contract_transactions (
    id SERIAL PRIMARY KEY,
    tx_hash VARCHAR(66) NOT NULL UNIQUE,
    contract_address VARCHAR(42) NOT NULL,
    from_address VARCHAR(42) NOT NULL,
    to_address VARCHAR(42),
    method_name VARCHAR(255),
    method_signature VARCHAR(10),
    input_data TEXT,
    output_data TEXT,
    value NUMERIC(78, 0) DEFAULT 0,
    gas_limit BIGINT,
    gas_used BIGINT,
    gas_price NUMERIC(78, 0),
    block_number BIGINT NOT NULL,
    block_hash VARCHAR(66),
    transaction_index INTEGER,
    status VARCHAR(20) DEFAULT 'pending',
    error_message TEXT,
    timestamp TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para eventos dos contratos
CREATE TABLE IF NOT EXISTS events.contract_events (
    id SERIAL PRIMARY KEY,
    contract_address VARCHAR(42) NOT NULL,
    event_name VARCHAR(255) NOT NULL,
    event_signature VARCHAR(66),
    tx_hash VARCHAR(66) NOT NULL,
    block_number BIGINT NOT NULL,
    block_hash VARCHAR(66),
    log_index INTEGER NOT NULL,
    removed BOOLEAN DEFAULT FALSE,
    raw_data TEXT,
    decoded_data JSONB,
    topics TEXT[],
    timestamp TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para armazenar estado dos contratos (storage)
CREATE TABLE IF NOT EXISTS contracts.contract_storage (
    id SERIAL PRIMARY KEY,
    contract_address VARCHAR(42) NOT NULL,
    storage_key VARCHAR(66) NOT NULL,
    storage_value VARCHAR(66) NOT NULL,
    variable_name VARCHAR(255),
    variable_type VARCHAR(100),
    block_number BIGINT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(contract_address, storage_key, block_number)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_deployed_contracts_address ON contracts.deployed_contracts(contract_address);
CREATE INDEX IF NOT EXISTS idx_deployed_contracts_deployer ON contracts.deployed_contracts(deployer_address);
CREATE INDEX IF NOT EXISTS idx_deployed_contracts_timestamp ON contracts.deployed_contracts(deployment_timestamp);

CREATE INDEX IF NOT EXISTS idx_contract_transactions_hash ON transactions.contract_transactions(tx_hash);
CREATE INDEX IF NOT EXISTS idx_contract_transactions_contract ON transactions.contract_transactions(contract_address);
CREATE INDEX IF NOT EXISTS idx_contract_transactions_from ON transactions.contract_transactions(from_address);
CREATE INDEX IF NOT EXISTS idx_contract_transactions_block ON transactions.contract_transactions(block_number);

CREATE INDEX IF NOT EXISTS idx_contract_events_contract ON events.contract_events(contract_address);
CREATE INDEX IF NOT EXISTS idx_contract_events_name ON events.contract_events(event_name);
CREATE INDEX IF NOT EXISTS idx_contract_events_tx ON events.contract_events(tx_hash);
CREATE INDEX IF NOT EXISTS idx_contract_events_block ON events.contract_events(block_number);

CREATE INDEX IF NOT EXISTS idx_contract_storage_address ON contracts.contract_storage(contract_address);
CREATE INDEX IF NOT EXISTS idx_contract_storage_key ON contracts.contract_storage(storage_key);
CREATE INDEX IF NOT EXISTS idx_contract_storage_block ON contracts.contract_storage(block_number);

-- Views úteis
CREATE OR REPLACE VIEW contracts.active_contracts AS
SELECT 
    contract_name,
    contract_address,
    deployer_address,
    deployment_timestamp,
    network_id
FROM contracts.deployed_contracts 
WHERE status = 'active'
ORDER BY deployment_timestamp DESC;

CREATE OR REPLACE VIEW transactions.recent_transactions AS
SELECT 
    ct.tx_hash,
    ct.contract_address,
    dc.contract_name,
    ct.method_name,
    ct.from_address,
    ct.value,
    ct.gas_used,
    ct.status,
    ct.timestamp
FROM transactions.contract_transactions ct
JOIN contracts.deployed_contracts dc ON ct.contract_address = dc.contract_address
ORDER BY ct.timestamp DESC
LIMIT 100;

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at na tabela de contratos
CREATE TRIGGER update_deployed_contracts_updated_at 
    BEFORE UPDATE ON contracts.deployed_contracts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir dados de exemplo (opcional, comentado por padrão)
/*
INSERT INTO contracts.deployed_contracts (
    contract_name, 
    contract_address, 
    deployer_address, 
    deployment_tx_hash, 
    deployment_block_number,
    network_id
) VALUES (
    'SimpleStorage',
    '0x1234567890123456789012345678901234567890',
    '0xfe3b557e8fb62b89f4916b721be55ceb828dbd73',
    '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    1,
    1337
);
*/

-- Concluir inicialização
SELECT 'Database initialized successfully for Besu contracts!' as message;
