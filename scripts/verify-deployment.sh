#!/usr/bin/env bash
# ==============================================================================
# CHRIST CLUB ONLINE STORE - DEPLOYMENT VERIFICATION (BASH)
# ==============================================================================
set -euo pipefail

BASE_URL="${1:-http://localhost:3000}"

echo "============================================================"
echo " CHRIST CLUB ONLINE STORE - END-TO-END DEPLOYMENT CHECKER   "
echo "============================================================"
echo "Testing Target: ${BASE_URL}"
echo "------------------------------------------------------------"

check_endpoint() {
    local name="$1"
    local path="$2"
    local method="${3:-GET}"
    local data="${4:-}"

    printf "[CHECK] %-36s ... " "$name"
    if [ "$method" = "POST" ]; then
        status=$(curl -s -o /tmp/resp.json -w "%{http_code}" -X POST "${BASE_URL}${path}" \
            -H "Content-Type: application/json" -d "$data" || echo "000")
    else
        status=$(curl -s -o /tmp/resp.json -w "%{http_code}" "${BASE_URL}${path}" || echo "000")
    fi

    if [[ "$status" =~ ^20[0-9]$ ]]; then
        echo "PASS ($status)"
    else
        echo "FAIL ($status)"
        cat /tmp/resp.json || true
        echo ""
    fi
}

check_endpoint "ALB Health Endpoint (/api/health)" "/api/health" "GET"
check_endpoint "Database Readiness (/api/ready)" "/api/ready" "GET"
check_endpoint "Instance Metadata (/api/instance)" "/api/instance" "GET"
check_endpoint "Storage Diagnostic (/api/storage/status)" "/api/storage/status" "GET"
check_endpoint "Create Order (/api/orders POST)" "/api/orders" "POST" '{"customerName":"Verification Test","amount":850,"status":"paid","itemsSummary":"Bash Test Kit"}'
check_endpoint "Query Orders List (/api/orders GET)" "/api/orders" "GET"
check_endpoint "Write EBS File (/api/storage/ebs POST)" "/api/storage/ebs" "POST" '{"filename":"sample-order-file.txt","customNote":"Bash verification check"}'
check_endpoint "Upload S3 File (/api/storage/s3 POST)" "/api/storage/s3" "POST" '{"filename":"sample-s3-file.txt","customNote":"Bash verification check"}'

echo "------------------------------------------------------------"
echo " Verification checks finished."
echo "============================================================"
