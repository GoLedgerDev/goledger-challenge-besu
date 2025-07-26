# Besu Go API Makefile

.PHONY: build run test clean deps fmt vet lint

# Variables
BINARY_NAME=besu-go-api
MAIN_PACKAGE=.

# Build the application
build:
	@echo "🔨 Building $(BINARY_NAME)..."
	go build -o bin/$(BINARY_NAME) $(MAIN_PACKAGE)

# Run the application
run:
	@echo "🚀 Running $(BINARY_NAME)..."
	go run $(MAIN_PACKAGE)

# Run with hot reload (requires air: go install github.com/cosmtrek/air@latest)
dev:
	@echo "🔥 Starting development server with hot reload..."
	air

# Install dependencies
deps:
	@echo "📦 Installing dependencies..."
	go mod download
	go mod tidy

# Format code
fmt:
	@echo "🎨 Formatting code..."
	go fmt ./...

# Vet code
vet:
	@echo "🔍 Vetting code..."
	go vet ./...

# Run tests
test:
	@echo "🧪 Running tests..."
	go test -v ./...

# Run tests with coverage
test-coverage:
	@echo "🧪 Running tests with coverage..."
	go test -v -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out -o coverage.html

# Lint code (requires golangci-lint)
lint:
	@echo "🔎 Linting code..."
	golangci-lint run

# Clean build artifacts
clean:
	@echo "🧹 Cleaning build artifacts..."
	rm -rf bin/
	rm -f coverage.out coverage.html

# Setup development environment
setup:
	@echo "⚙️ Setting up development environment..."
	go mod download
	go mod tidy
	@echo "✅ Development environment ready!"

# Check if contract is deployed and set address
check-contract:
	@echo "🔍 Checking contract deployment..."
	@if [ -f "../.env.contract" ]; then \
		CONTRACT_ADDR=$$(grep CONTRACT_ADDRESS ../.env.contract | cut -d'=' -f2); \
		if [ ! -z "$$CONTRACT_ADDR" ]; then \
			echo "📍 Found contract address: $$CONTRACT_ADDR"; \
			sed -i "s/CONTRACT_ADDRESS=.*/CONTRACT_ADDRESS=$$CONTRACT_ADDR/" .env; \
			echo "✅ Contract address updated in .env"; \
		else \
			echo "⚠️ Contract address not found in ../.env.contract"; \
		fi \
	else \
		echo "⚠️ Contract not deployed yet. Run: make deploy-contract"; \
	fi

# Deploy contract using Node.js script
deploy-contract:
	@echo "📝 Deploying SimpleStorage contract..."
	cd .. && node scripts/quick-deploy.js
	@make check-contract

# Start the full stack (database + blockchain + api)
start-stack:
	@echo "🚀 Starting full stack..."
	cd .. && ./startDev.sh
	@sleep 5
	@make check-contract
	@make run

# Docker commands
docker-build:
	@echo "🐳 Building Docker image..."
	docker build -t $(BINARY_NAME) .

docker-run:
	@echo "🐳 Running Docker container..."
	docker run --rm -p 8080:8080 --env-file .env $(BINARY_NAME)

# Help
help:
	@echo "📚 Available commands:"
	@echo "  build           - Build the application"
	@echo "  run             - Run the application"
	@echo "  dev             - Run with hot reload"
	@echo "  deps            - Install dependencies"
	@echo "  fmt             - Format code"
	@echo "  vet             - Vet code"
	@echo "  test            - Run tests"
	@echo "  test-coverage   - Run tests with coverage"
	@echo "  lint            - Lint code"
	@echo "  clean           - Clean build artifacts"
	@echo "  setup           - Setup development environment"
	@echo "  check-contract  - Check if contract is deployed"
	@echo "  deploy-contract - Deploy SimpleStorage contract"
	@echo "  start-stack     - Start full stack (DB + Blockchain + API)"
	@echo "  docker-build    - Build Docker image"
	@echo "  docker-run      - Run Docker container"
	@echo "  help            - Show this help message"
