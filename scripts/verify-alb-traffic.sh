#!/usr/bin/env bash
# ==============================================================================
# CHRIST CLUB ONLINE STORE - ALB TRAFFIC DISTRIBUTION VERIFICATION (BASH)
# ==============================================================================
# Demonstrates Requirement 2:
# "Configure an AWS Application Load Balancer (ALB) and demonstrate traffic
#  distribution across both instances."
# ==============================================================================

TARGET_URL="${1:-http://localhost:3000}"
REQUEST_COUNT="${2:-30}"

echo "============================================================"
echo " CHRIST CLUB ONLINE STORE - ALB TRAFFIC VERIFICATION"
echo "============================================================"
echo "Target URL:     ${TARGET_URL}/api/instance"
echo "Request Count:  ${REQUEST_COUNT}"
echo "------------------------------------------------------------"

declare -A INSTANCE_COUNTS
declare -A AZ_MAPPING

for ((i=1; i<=REQUEST_COUNT; i++)); do
    RESPONSE=$(curl -s --max-time 5 "${TARGET_URL}/api/instance" -H "Cache-Control: no-cache")
    INSTANCE_ID=$(echo "$RESPONSE" | grep -o '"instanceId":"[^"]*' | cut -d'"' -f4)
    AZ=$(echo "$RESPONSE" | grep -o '"availabilityZone":"[^"]*' | cut -d'"' -f4)

    if [ -z "$INSTANCE_ID" ]; then
        INSTANCE_ID="UNKNOWN_OR_ERROR"
        AZ="N/A"
    fi

    INSTANCE_COUNTS["$INSTANCE_ID"]=$((${INSTANCE_COUNTS["$INSTANCE_ID"]} + 1))
    AZ_MAPPING["$INSTANCE_ID"]="$AZ"

    printf "Request %2d -> %-24s (%s)\n" "$i" "$INSTANCE_ID" "$AZ"
    sleep 0.1
done

echo ""
echo "------------------------------------------------------------"
echo " TRAFFIC DISTRIBUTION SUMMARY"
echo "------------------------------------------------------------"
printf "%-26s %-16s %-10s %-10s\n" "Instance Identifier" "Availability Zone" "Hits" "Percentage"
printf "%-26s %-16s %-10s %-10s\n" "--------------------------" "----------------" "----" "----------"

for ID in "${!INSTANCE_COUNTS[@]}"; do
    HITS="${INSTANCE_COUNTS[$ID]}"
    PERCENTAGE=$((HITS * 100 / REQUEST_COUNT))
    ZONE="${AZ_MAPPING[$ID]}"
    printf "%-26s %-16s %-10s %d%%\n" "$ID" "$ZONE" "$HITS" "$PERCENTAGE"
done

echo "============================================================"
