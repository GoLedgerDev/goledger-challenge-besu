package main

import (
	"log"
	"os"

	"besu-go-api/internal/blockchain"
	"besu-go-api/internal/database"
	"besu-go-api/internal/handlers"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: .env file not found")
	}

	config := getConfig()

	db, err := database.NewDatabase(
		config.DBHost,
		config.DBPort,
		config.DBUser,
		config.DBPassword,
		config.DBName,
	)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	blockchainClient, err := blockchain.NewClient(config.BesuRPCURL, config.PrivateKey)
	if err != nil {
		log.Fatalf("Failed to create blockchain client: %v", err)
	}
	defer blockchainClient.Close()

	handler := handlers.NewHandler(db, blockchainClient, config.ContractAddress)

	router := setupRouter(handler)

	log.Printf("🚀 Besu Go API starting on port %s", config.APIPort)
	log.Printf("📍 Endpoints available:")
	log.Printf("   POST /api/set     - Set new value in smart contract")
	log.Printf("   GET  /api/get     - Get current value from blockchain")
	log.Printf("   POST /api/sync    - Sync blockchain value to database")
	log.Printf("   GET  /api/check   - Compare database vs blockchain values")
	log.Printf("   GET  /api/history - Get value change history")
	log.Printf("   GET  /api/status  - Get system status")

	if err := router.Run(":" + config.APIPort); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

type Config struct {
	BesuRPCURL      string
	BesuNetworkID   string
	ContractAddress string
	DBHost          string
	DBPort          string
	DBUser          string
	DBPassword      string
	DBName          string
	APIPort         string
	PrivateKey      string
}

func getConfig() Config {
	return Config{
		BesuRPCURL:      getEnv("BESU_RPC_URL", "http://localhost:8545"),
		BesuNetworkID:   getEnv("BESU_NETWORK_ID", "1337"),
		ContractAddress: getEnv("CONTRACT_ADDRESS", ""),
		DBHost:          getEnv("DB_HOST", "localhost"),
		DBPort:          getEnv("DB_PORT", "5432"),
		DBUser:          getEnv("DB_USER", "postgres"),
		DBPassword:      getEnv("DB_PASSWORD", "admin123"),
		DBName:          getEnv("DB_NAME", "besu_contracts"),
		APIPort:         getEnv("API_PORT", "8080"),
		PrivateKey:      getEnv("PRIVATE_KEY", ""),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func setupRouter(handler *handlers.Handler) *gin.Engine {
	gin.SetMode(gin.ReleaseMode)

	router := gin.New()
	router.Use(gin.Logger())
	router.Use(gin.Recovery())

	router.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	api := router.Group("/api")
	{
		api.POST("/set", handler.SetValue)
		api.GET("/get", handler.GetValue)
		api.POST("/sync", handler.SyncValue)
		api.GET("/check", handler.CheckValue)
		api.GET("/history", handler.GetHistory)
		api.GET("/status", handler.GetStatus)
	}

	router.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "Besu Go API",
			"version": "1.0.0",
			"endpoints": gin.H{
				"set":     "POST /api/set - Set new value in smart contract",
				"get":     "GET /api/get - Get current value from blockchain",
				"sync":    "POST /api/sync - Sync blockchain value to database",
				"check":   "GET /api/check - Compare database vs blockchain values",
				"history": "GET /api/history - Get value change history",
				"status":  "GET /api/status - Get system status",
			},
		})
	})

	return router
}
