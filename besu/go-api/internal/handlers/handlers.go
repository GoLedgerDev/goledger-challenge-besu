package handlers

import (
	"fmt"
	"math/big"
	"net/http"
	"strconv"
	"time"

	"besu-go-api/internal/blockchain"
	"besu-go-api/internal/database"
	"besu-go-api/internal/models"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	db               *database.Database
	blockchainClient *blockchain.Client
	contractAddress  string
}

func NewHandler(db *database.Database, client *blockchain.Client, contractAddress string) *Handler {
	return &Handler{
		db:               db,
		blockchainClient: client,
		contractAddress:  contractAddress,
	}
}

func (h *Handler) SetValue(c *gin.Context) {
	var req models.SetValueRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Error:   "Invalid request body: " + err.Error(),
		})
		return
	}

	value := big.NewInt(req.Value)

	tx, err := h.blockchainClient.SetStoredValue(h.contractAddress, value)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Failed to set value on blockchain: " + err.Error(),
		})
		return
	}

	err = h.db.StoreValue(value.String(), tx.Hash().Hex(), "blockchain")
	if err != nil {
		c.JSON(http.StatusPartialContent, models.APIResponse{
			Success: false,
			Error:   "Value set on blockchain but failed to store in database: " + err.Error(),
			Data: map[string]interface{}{
				"tx_hash": tx.Hash().Hex(),
				"value":   value.String(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Value set successfully",
		Data: map[string]interface{}{
			"value":   value.String(),
			"tx_hash": tx.Hash().Hex(),
		},
	})
}

func (h *Handler) GetValue(c *gin.Context) {
	value, err := h.blockchainClient.GetStoredValue(h.contractAddress)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Failed to get value from blockchain: " + err.Error(),
		})
		return
	}

	response := models.GetValueResponse{
		Value:     value.String(),
		Source:    "blockchain",
		Timestamp: time.Now(),
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data:    response,
	})
}

func (h *Handler) SyncValue(c *gin.Context) {
	var previousValue string
	dbValue, err := h.db.GetLatestValue()
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Failed to get value from database: " + err.Error(),
		})
		return
	}
	if dbValue != nil {
		previousValue = dbValue.Value
	}

	blockchainValue, err := h.blockchainClient.GetStoredValue(h.contractAddress)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Failed to get value from blockchain: " + err.Error(),
		})
		return
	}

	currentValue := blockchainValue.String()
	updated := previousValue != currentValue

	if updated {
		err = h.db.StoreValue(currentValue, "", "sync")
		if err != nil {
			c.JSON(http.StatusInternalServerError, models.APIResponse{
				Success: false,
				Error:   "Failed to store synced value in database: " + err.Error(),
			})
			return
		}
	}

	response := models.SyncResponse{
		PreviousValue: previousValue,
		CurrentValue:  currentValue,
		Updated:       updated,
		Timestamp:     time.Now(),
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: fmt.Sprintf("Sync completed. Updated: %v", updated),
		Data:    response,
	})
}

func (h *Handler) CheckValue(c *gin.Context) {
	dbValue, err := h.db.GetLatestValue()
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Failed to get value from database: " + err.Error(),
		})
		return
	}

	var databaseValue string
	var lastSyncTime string
	if dbValue != nil {
		databaseValue = dbValue.Value
		lastSyncTime = dbValue.Timestamp.Format(time.RFC3339)
	}

	blockchainValueBig, err := h.blockchainClient.GetStoredValue(h.contractAddress)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Failed to get value from blockchain: " + err.Error(),
		})
		return
	}

	blockchainValue := blockchainValueBig.String()
	inSync := databaseValue == blockchainValue

	response := models.CheckResponse{
		DatabaseValue:   databaseValue,
		BlockchainValue: blockchainValue,
		InSync:          inSync,
		LastSyncTime:    lastSyncTime,
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data:    response,
	})
}

func (h *Handler) GetHistory(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "10")
	offsetStr := c.DefaultQuery("offset", "0")

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit < 1 || limit > 100 {
		limit = 10
	}

	offset, err := strconv.Atoi(offsetStr)
	if err != nil || offset < 0 {
		offset = 0
	}

	history, err := h.db.GetValueHistory(limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Failed to get history from database: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data: map[string]interface{}{
			"history": history,
			"pagination": map[string]int{
				"limit":  limit,
				"offset": offset,
			},
		},
	})
}

func (h *Handler) GetStatus(c *gin.Context) {
	networkInfo, err := h.blockchainClient.GetNetworkInfo()
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Failed to get network info: " + err.Error(),
		})
		return
	}

	dbValue, err := h.db.GetLatestValue()
	var dbInfo map[string]interface{}
	if err != nil {
		dbInfo = map[string]interface{}{
			"status": "error",
			"error":  err.Error(),
		}
	} else if dbValue == nil {
		dbInfo = map[string]interface{}{
			"status":       "connected",
			"latest_value": nil,
			"last_updated": nil,
		}
	} else {
		dbInfo = map[string]interface{}{
			"status":       "connected",
			"latest_value": dbValue.Value,
			"last_updated": dbValue.Timestamp.Format(time.RFC3339),
		}
	}

	var contractInfo map[string]interface{}
	if h.contractAddress == "" {
		contractInfo = map[string]interface{}{
			"status":  "not_configured",
			"address": "",
		}
	} else {
		contractInfo = map[string]interface{}{
			"status":  "configured",
			"address": h.contractAddress,
		}
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data: map[string]interface{}{
			"timestamp": time.Now().Format(time.RFC3339),
			"network":   networkInfo,
			"database":  dbInfo,
			"contract":  contractInfo,
		},
	})
}
