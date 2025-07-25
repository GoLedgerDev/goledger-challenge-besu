#!/bin/bash

# Helper script to manage PostgreSQL database for Besu contracts

set -e

DB_CONTAINER="besu-postgres"
DB_USER="besu_user"
DB_NAME="besu_contracts"

# Show help function
show_help() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Available commands:"
    echo "  start       - Start database services"
    echo "  stop        - Stop database services"
    echo "  restart     - Restart database services"
    echo "  status      - Show container status"
    echo "  logs        - Show PostgreSQL logs"
    echo "  connect     - Connect to database via psql"
    echo "  backup      - Create database backup"
    echo "  restore     - Restore database backup"
    echo "  reset       - Remove all data and start fresh"
    echo "  help        - Show this help"
}

# Check if container is running
check_container() {
    if ! docker ps | grep -q "$DB_CONTAINER"; then
        echo "❌ Container $DB_CONTAINER is not running!"
        return 1
    fi
    return 0
}

# Commands
case "$1" in
    "start")
        echo "🚀 Starting database services..."
        docker compose -f docker/docker-compose-database.yaml up -d
        echo "✅ Services started!"
        echo "📊 PgAdmin: http://localhost:8080"
        echo "🔗 Database: postgresql://besu_user:besu_password@localhost:5432/besu_contracts"
        ;;
    
    "stop")
        echo "🛑 Stopping database services..."
        docker compose -f docker/docker-compose-database.yaml down
        echo "✅ Services stopped!"
        ;;
    
    "restart")
        echo "🔄 Restarting database services..."
        docker compose -f docker/docker-compose-database.yaml restart
        echo "✅ Services restarted!"
        ;;
    
    "status")
        echo "📊 Container status:"
        docker compose -f docker/docker-compose-database.yaml ps
        ;;
    
    "logs")
        echo "📋 PostgreSQL logs:"
        docker logs "$DB_CONTAINER" --tail 50 -f
        ;;
    
    "connect")
        if check_container; then
            echo "🔗 Connecting to database..."
            docker exec -it "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME"
        fi
        ;;
    
    "backup")
        if check_container; then
            BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
            echo "💾 Creating backup to $BACKUP_FILE..."
            docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" > "$BACKUP_FILE"
            echo "✅ Backup saved to $BACKUP_FILE"
        fi
        ;;
    
    "restore")
        if [ -z "$2" ]; then
            echo "❌ Usage: $0 restore <backup_file.sql>"
            exit 1
        fi
        if check_container && [ -f "$2" ]; then
            echo "🔄 Restoring backup from $2..."
            cat "$2" | docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME"
            echo "✅ Backup restored!"
        else
            echo "❌ File $2 not found or container not running!"
        fi
        ;;
    
    "reset")
        echo "⚠️  WARNING: This will remove ALL database data!"
        read -p "Are you sure? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "🗑️  Removing data and containers..."
            docker compose -f docker/docker-compose-database.yaml down -v
            echo "🚀 Recreating services..."
            docker compose -f docker/docker-compose-database.yaml up -d
            echo "✅ Database reset successfully!"
        else
            echo "❌ Operation cancelled."
        fi
        ;;
    
    "help"|"")
        show_help
        ;;
    
    *)
        echo "❌ Command '$1' not recognized."
        show_help
        exit 1
        ;;
esac
