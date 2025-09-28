#!/bin/bash

# Script to run commands with only local .env file to avoid conflicts

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Export variables from local .env file only
if [ -f "$SCRIPT_DIR/.env" ]; then
    export $(grep -v '^#' "$SCRIPT_DIR/.env" | grep -v '^$' | xargs)
fi

# Unset any DATABASE_URL that might come from parent directories
# This ensures we use only our local configuration
export DATABASE_URL="postgresql://receiptly:12345678@localhost:5432/receiptly"

# Activate virtual environment
source "$SCRIPT_DIR/venv/bin/activate"

# Run the command passed as arguments
exec "$@"