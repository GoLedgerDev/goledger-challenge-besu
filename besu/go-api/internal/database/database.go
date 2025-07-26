package database

import (
	"database/sql"
	"fmt"
	"time"

	"besu-go-api/internal/models"

	_ "github.com/lib/pq"
)

type Database struct {
	conn *sql.DB
}

func NewDatabase(host, port, user, password, dbname string) (*Database, error) {
	psqlInfo := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		host, port, user, password, dbname)

	db, err := sql.Open("postgres", psqlInfo)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	if err = db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	database := &Database{conn: db}

	if err = database.createTables(); err != nil {
		return nil, fmt.Errorf("failed to create tables: %w", err)
	}

	return database, nil
}

func (db *Database) createTables() error {
	query := `
	CREATE TABLE IF NOT EXISTS contract_values (
		id SERIAL PRIMARY KEY,
		value TEXT NOT NULL,
		timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		tx_hash TEXT,
		source TEXT NOT NULL DEFAULT 'sync'
	);
	
	CREATE INDEX IF NOT EXISTS idx_contract_values_timestamp ON contract_values(timestamp DESC);
	`

	_, err := db.conn.Exec(query)
	return err
}

func (db *Database) StoreValue(value, txHash, source string) error {
	query := `
		INSERT INTO contract_values (value, tx_hash, source)
		VALUES ($1, $2, $3)
	`

	_, err := db.conn.Exec(query, value, txHash, source)
	if err != nil {
		return fmt.Errorf("failed to store value: %w", err)
	}

	return nil
}

func (db *Database) GetLatestValue() (*models.ContractValue, error) {
	query := `
		SELECT id, value, timestamp, COALESCE(tx_hash, ''), source
		FROM contract_values
		ORDER BY timestamp DESC
		LIMIT 1
	`

	var cv models.ContractValue
	err := db.conn.QueryRow(query).Scan(&cv.ID, &cv.Value, &cv.Timestamp, &cv.TxHash, &cv.Source)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil // No records found
		}
		return nil, fmt.Errorf("failed to get latest value: %w", err)
	}

	return &cv, nil
}

func (db *Database) GetValueHistory(limit, offset int) ([]models.ContractValue, error) {
	query := `
		SELECT id, value, timestamp, COALESCE(tx_hash, ''), source
		FROM contract_values
		ORDER BY timestamp DESC
		LIMIT $1 OFFSET $2
	`

	rows, err := db.conn.Query(query, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to get value history: %w", err)
	}
	defer rows.Close()

	var values []models.ContractValue
	for rows.Next() {
		var cv models.ContractValue
		err := rows.Scan(&cv.ID, &cv.Value, &cv.Timestamp, &cv.TxHash, &cv.Source)
		if err != nil {
			return nil, fmt.Errorf("failed to scan row: %w", err)
		}
		values = append(values, cv)
	}

	return values, nil
}

func (db *Database) UpdateValue(value, source string) error {
	return db.StoreValue(value, "", source)
}

func (db *Database) GetLastSyncTime() (*time.Time, error) {
	query := `
		SELECT timestamp
		FROM contract_values
		WHERE source = 'sync'
		ORDER BY timestamp DESC
		LIMIT 1
	`

	var timestamp time.Time
	err := db.conn.QueryRow(query).Scan(&timestamp)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil // No sync records found
		}
		return nil, fmt.Errorf("failed to get last sync time: %w", err)
	}

	return &timestamp, nil
}

func (db *Database) Close() error {
	return db.conn.Close()
}
