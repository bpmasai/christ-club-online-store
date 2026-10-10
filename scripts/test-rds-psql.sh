#!/usr/bin/env bash
# ==============================================================================
# CHRIST CLUB ONLINE STORE - RDS POSTGRESQL QUERY EXECUTION SCRIPT
# ==============================================================================
# Demonstrates Requirement 3:
# "Create an Amazon RDS database, connect to it from EC2,
#  insert sample order records, and execute SQL queries."
# ==============================================================================
set -euo pipefail

RDS_HOST="${1:-${DATABASE_HOST:-}}"
DB_USER="${2:-postgres}"
DB_NAME="${3:-christclub}"

if [ -z "${RDS_HOST}" ]; then
    echo "Usage: bash scripts/test-rds-psql.sh <RDS_ENDPOINT> [DB_USER] [DB_NAME]"
    echo "Example: bash scripts/test-rds-psql.sh christ-club-db.c12345.us-east-1.rds.amazonaws.com postgres christclub"
    exit 1
fi

echo "============================================================"
echo " STEP 1: CHECKING POSTGRESQL CLIENT INSTALLATION"
echo "============================================================"
if ! command -v psql &> /dev/null; then
    echo "psql not found. Installing postgresql client on Amazon Linux 2023..."
    sudo dnf install -y postgresql15
fi

echo "============================================================"
echo " STEP 2: CONNECTING TO RDS & EXECUTING DEMONSTRATION QUERIES"
echo "============================================================"
echo "Target Host: ${RDS_HOST}"
echo "Database:    ${DB_NAME}"
echo "User:        ${DB_USER}"
echo "------------------------------------------------------------"

QUERY_FILE="$(dirname "$0")/sample-queries.sql"

if [ ! -f "${QUERY_FILE}" ]; then
    echo "ERROR: Query file ${QUERY_FILE} not found."
    exit 1
fi

echo "Executing SQL queries from ${QUERY_FILE}..."
psql -h "${RDS_HOST}" -U "${DB_USER}" -d "${DB_NAME}" -f "${QUERY_FILE}"

echo "============================================================"
echo "SUCCESS: RDS queries executed successfully!"
echo "============================================================"
