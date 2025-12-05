#!/bin/bash

# ==============================================================================
# Trading Agent Engine - D1 Database Setup Script
# ==============================================================================
# This script automates the setup of the Cloudflare D1 database for the
# Trading Agent Engine. It will:
# 1. Create the D1 database if it doesn't exist
# 2. Extract the database ID
# 3. Update wrangler.toml automatically
# 4. Run database migrations
# ==============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
DATABASE_NAME="trading-platform"
WRANGLER_CONFIG="wrangler.toml"

echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║          Trading Agent Engine - D1 Database Setup             ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}Error: Wrangler CLI is not installed.${NC}"
    echo "Please install it with: npm install -g wrangler"
    echo "Or run: npx wrangler --help to use the local version"
    exit 1
fi

# Check if we're in the backend directory
if [ ! -f "$WRANGLER_CONFIG" ]; then
    echo -e "${YELLOW}Warning: wrangler.toml not found in current directory.${NC}"
    echo "Attempting to navigate to backend directory..."
    
    if [ -f "../backend/$WRANGLER_CONFIG" ]; then
        cd ../backend
    elif [ -f "backend/$WRANGLER_CONFIG" ]; then
        cd backend
    else
        echo -e "${RED}Error: Cannot find wrangler.toml. Please run this script from the backend directory.${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✓${NC} Found wrangler.toml in $(pwd)"
echo ""

# Check if user is authenticated
echo -e "${CYAN}Checking Wrangler authentication...${NC}"
if ! wrangler whoami &> /dev/null; then
    echo -e "${YELLOW}You need to authenticate with Cloudflare.${NC}"
    echo "Running: wrangler login"
    wrangler login
fi
echo -e "${GREEN}✓${NC} Authenticated with Cloudflare"
echo ""

# Check if database already exists
echo -e "${CYAN}Checking for existing D1 database...${NC}"
EXISTING_DB=$(wrangler d1 list 2>/dev/null | grep "$DATABASE_NAME" || true)

if [ -n "$EXISTING_DB" ]; then
    echo -e "${YELLOW}Database '$DATABASE_NAME' already exists.${NC}"
    # Extract the database ID from the existing database
    DATABASE_ID=$(echo "$EXISTING_DB" | awk '{print $1}')
    echo -e "${GREEN}✓${NC} Found existing database with ID: $DATABASE_ID"
else
    # Create the D1 database
    echo -e "${CYAN}Creating D1 database '$DATABASE_NAME'...${NC}"
    CREATE_OUTPUT=$(wrangler d1 create "$DATABASE_NAME" 2>&1)
    echo "$CREATE_OUTPUT"
    
    # Extract the database ID from the output
    DATABASE_ID=$(echo "$CREATE_OUTPUT" | grep -oP 'database_id\s*=\s*"\K[^"]+' || echo "$CREATE_OUTPUT" | grep -oP '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' | head -1)
    
    if [ -z "$DATABASE_ID" ]; then
        echo -e "${RED}Error: Failed to extract database ID from output.${NC}"
        echo "Please manually copy the database_id from the output above and update wrangler.toml"
        exit 1
    fi
    
    echo -e "${GREEN}✓${NC} Created database with ID: $DATABASE_ID"
fi

echo ""

# Update wrangler.toml with the database ID
echo -e "${CYAN}Updating wrangler.toml with database ID...${NC}"

# Check if we need to update the file
if grep -q "YOUR_D1_DATABASE_ID_HERE\|preview-database-id" "$WRANGLER_CONFIG"; then
    # Use sed to replace the placeholder
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/database_id = \"YOUR_D1_DATABASE_ID_HERE\"/database_id = \"$DATABASE_ID\"/" "$WRANGLER_CONFIG"
        sed -i '' "s/database_id = \"preview-database-id\"/database_id = \"$DATABASE_ID\"/" "$WRANGLER_CONFIG"
    else
        # Linux
        sed -i "s/database_id = \"YOUR_D1_DATABASE_ID_HERE\"/database_id = \"$DATABASE_ID\"/" "$WRANGLER_CONFIG"
        sed -i "s/database_id = \"preview-database-id\"/database_id = \"$DATABASE_ID\"/" "$WRANGLER_CONFIG"
    fi
    echo -e "${GREEN}✓${NC} Updated wrangler.toml"
else
    echo -e "${YELLOW}Note: wrangler.toml already contains a database ID${NC}"
fi

echo ""

# Run migrations
echo -e "${CYAN}Running database migrations...${NC}"
if [ -d "migrations" ]; then
    MIGRATION_FILES=$(ls migrations/*.sql 2>/dev/null || true)
    if [ -n "$MIGRATION_FILES" ]; then
        for migration in migrations/*.sql; do
            echo "  Applying: $migration"
            wrangler d1 execute "$DATABASE_NAME" --file="$migration" --remote 2>&1 || {
                echo -e "${YELLOW}Note: Migration may have already been applied or there was an issue.${NC}"
            }
        done
        echo -e "${GREEN}✓${NC} Migrations complete"
    else
        echo -e "${YELLOW}No migration files found in migrations/ directory${NC}"
    fi
else
    echo -e "${YELLOW}No migrations/ directory found${NC}"
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    Setup Complete!                             ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Database Name: ${CYAN}$DATABASE_NAME${NC}"
echo -e "Database ID:   ${CYAN}$DATABASE_ID${NC}"
echo ""
echo -e "Next steps:"
echo -e "  1. Run ${CYAN}npm run dev${NC} to start the development server"
echo -e "  2. Run ${CYAN}npm run deploy${NC} to deploy to Cloudflare Workers"
echo ""
