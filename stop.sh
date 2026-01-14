#!/bin/bash

echo "🛑 Stopping Driver App..."
echo ""

docker-compose down

echo ""
echo "✅ All services stopped!"
echo ""
echo "💡 To start again: ./start.sh"
echo "🗑️  To remove data: docker-compose down -v"
echo ""


