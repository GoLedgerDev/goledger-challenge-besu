package models

import "time"

type ContractValue struct {
	ID        int       `json:"id" db:"id"`
	Value     string    `json:"value" db:"value"`
	Timestamp time.Time `json:"timestamp" db:"timestamp"`
	TxHash    string    `json:"tx_hash" db:"tx_hash"`
	Source    string    `json:"source" db:"source"`
}

type APIResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
	Message string      `json:"message,omitempty"`
}

type SetValueRequest struct {
	Value int64 `json:"value" binding:"required"`
}

type GetValueResponse struct {
	Value     string    `json:"value"`
	Source    string    `json:"source"`
	Timestamp time.Time `json:"timestamp"`
	TxHash    string    `json:"tx_hash,omitempty"`
}

type SyncResponse struct {
	PreviousValue string    `json:"previous_value"`
	CurrentValue  string    `json:"current_value"`
	Updated       bool      `json:"updated"`
	Timestamp     time.Time `json:"timestamp"`
}

type CheckResponse struct {
	DatabaseValue   string `json:"database_value"`
	BlockchainValue string `json:"blockchain_value"`
	InSync          bool   `json:"in_sync"`
	LastSyncTime    string `json:"last_sync_time"`
}
