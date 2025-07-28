#!/bin/bash
cd /home/nilson/code/teste/goledger-challenge-besu/besu/go-api
export GOOS=linux
export GOARCH=amd64
go build -o besu-go-api main.go
echo "Starting Besu Go API with Swagger..."
./besu-go-api
