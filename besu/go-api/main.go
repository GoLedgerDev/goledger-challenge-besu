package main

import (
	"log"
	"net/http"
	"os"

	"besu-go-api/internal/blockchain"
	"besu-go-api/internal/database"
	"besu-go-api/internal/handlers"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

const swaggerSpec = `openapi: 3.0.3
info:
  title: Besu Go API
  description: A REST API for interacting with Hyperledger Besu smart contracts and PostgreSQL database
  version: 1.0.0
  contact:
    name: API Support
    url: http://www.swagger.io/support
    email: support@swagger.io
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT

servers:
  - url: http://localhost:8080
    description: Local development server

paths:
  /:
    get:
      summary: API Information
      description: Get basic information about the API and available endpoints
      responses:
        '200':
          description: API information

  /api/set:
    post:
      summary: Set Value
      description: Set a new value in the smart contract
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - value
              properties:
                value:
                  type: integer
                  format: int64
                  example: 42
      responses:
        '200':
          description: Value set successfully

  /api/get:
    get:
      summary: Get Value
      description: Get the current value from the blockchain
      responses:
        '200':
          description: Current value retrieved

  /api/sync:
    post:
      summary: Sync Value
      description: Synchronize blockchain value to the database
      responses:
        '200':
          description: Synchronization completed

  /api/check:
    get:
      summary: Check Synchronization
      description: Compare database and blockchain values
      responses:
        '200':
          description: Synchronization status

  /api/history:
    get:
      summary: Get History
      description: Get value change history from database
      parameters:
        - name: limit
          in: query
          description: Number of records to return
          required: false
          schema:
            type: integer
            default: 10
        - name: offset
          in: query
          description: Number of records to skip
          required: false
          schema:
            type: integer
            default: 0
      responses:
        '200':
          description: History retrieved

  /api/status:
    get:
      summary: System Status
      description: Get system status including network, database, and contract information
      responses:
        '200':
          description: System status
`

const swaggerUIHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Besu Go API - Swagger UI</title>
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css" />
    <style>
        html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
        *, *:before, *:after { box-sizing: inherit; }
        body { margin:0; background: #fafafa; }
    </style>
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-standalone-preset.js"></script>
    <script>
        window.onload = function() {
            const ui = SwaggerUIBundle({
                url: '/swagger/spec',
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                ],
                plugins: [
                    SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: "StandaloneLayout"
            });
        };
    </script>
</body>
</html>
`

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

	// Swagger documentation
	router.GET("/swagger/index.html", func(c *gin.Context) {
		c.Header("Content-Type", "text/html")
		c.String(200, swaggerUIHTML)
	})
	
	router.GET("/swagger/spec", func(c *gin.Context) {
		c.Header("Content-Type", "application/x-yaml")
		c.String(200, swaggerSpec)
	})

	// Redirect /swagger to /swagger/index.html
	router.GET("/swagger", func(c *gin.Context) {
		c.Redirect(http.StatusMovedPermanently, "/swagger/index.html")
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
			"message":       "Besu Go API",
			"version":       "1.0.0",
			"documentation": "/swagger/index.html",
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
