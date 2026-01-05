#!/bin/bash

# Source .env.figma if it exists
if [ -f "$(dirname "$0")/../.env.figma" ]; then
  source "$(dirname "$0")/../.env.figma"
fi

# Check if FIGMA_API_KEY or FIGMA_ACCESS_TOKEN is set
if [ -z "$FIGMA_API_KEY" ] && [ -z "$FIGMA_ACCESS_TOKEN" ]; then
  echo "Error: Neither FIGMA_API_KEY nor FIGMA_ACCESS_TOKEN is set."
  echo "Please set the FIGMA_API_KEY environment variable or create a .env.figma file in the root."
  echo "You can generate a Personal Access Token in Figma under Settings > Account > Personal Access Tokens."
  exit 1
fi

# Ensure FIGMA_API_KEY is set for tools that expect it
if [ -z "$FIGMA_API_KEY" ]; then
  export FIGMA_API_KEY="$FIGMA_ACCESS_TOKEN"
fi

# Run the Figma MCP server using npx
# We use -y to automatically install/run the package
npx -y figma-mcp
