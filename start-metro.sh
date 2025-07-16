#!/bin/bash

# React Native Port Manager
# Helps manage Metro bundler ports

PORT=${1:-8082}  # Default to 8082 if no port specified

echo "🚀 React Native Port Manager"
echo "=========================="

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to kill process on port
kill_port() {
    local port=$1
    echo "🔪 Killing process on port $port..."
    local pid=$(lsof -ti:$port)
    if [ ! -z "$pid" ]; then
        kill -9 $pid
        echo "✅ Process $pid killed"
    else
        echo "ℹ️  No process found on port $port"
    fi
}

# Function to start Metro on specified port
start_metro() {
    local port=$1
    echo "📱 Starting Metro bundler on port $port..."
    cd MirrorCollectiveApp
    npx react-native start --port $port
}

# Main logic
echo "📡 Checking port $PORT..."

if check_port $PORT; then
    echo "⚠️  Port $PORT is already in use!"
    echo "Process using port $PORT:"
    lsof -i :$PORT
    echo ""
    read -p "Do you want to kill the process and start Metro? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        kill_port $PORT
        echo "⏳ Waiting 2 seconds..."
        sleep 2
        start_metro $PORT
    else
        echo "❌ Cancelled. Try a different port:"
        echo "   ./start-metro.sh 8083"
    fi
else
    echo "✅ Port $PORT is free!"
    start_metro $PORT
fi
