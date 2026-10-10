<#
.SYNOPSIS
    Automated Deployment Verification Script for Christ Club Online Store.
.DESCRIPTION
    Runs end-to-end tests against either a local deployment (localhost:3000)
    or a deployed AWS Application Load Balancer endpoint.
.PARAMETER BaseUrl
    Base URL of the application (default: http://localhost:3000)
#>
param (
    [string]$BaseUrl = "http://localhost:3000"
)

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " CHRIST CLUB ONLINE STORE - END-TO-END DEPLOYMENT CHECKER   " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Testing Target: $BaseUrl`n"

$allPassed = $true

# Helper function
function Assert-Endpoint {
    param ($Name, $Path, $ExpectedStatus = 200, $Method = "Get", $Body = $null)
    Write-Host -NoNewline ("[CHECK] {0,-35} ... " -f $Name)
    try {
        $params = @{
            Uri = "$BaseUrl$Path"
            Method = $Method
            TimeoutSec = 8
            Headers = @{ "Cache-Control" = "no-cache" }
        }
        if ($Body) {
            $params["Body"] = ($Body | ConvertTo-Json)
            $params["ContentType"] = "application/json"
        }
        $resp = Invoke-RestMethod @params
        Write-Host "PASS" -ForegroundColor Green
        return $resp
    }
    catch {
        Write-Host "FAIL" -ForegroundColor Red
        Write-Host "       Error: $($_.Exception.Message)" -ForegroundColor DarkRed
        $script:allPassed = $false
        return $null
    }
}

# 1. Health check (ALB target group liveness)
$health = Assert-Endpoint -Name "ALB Health Endpoint (/api/health)" -Path "/api/health"
if ($health) {
    Write-Host ("       Status: {0} | Version: {1} | Instance: {2}" -f $health.status, $health.version, $health.instanceId) -ForegroundColor Gray
}

# 2. Database readiness check (/api/ready)
$ready = Assert-Endpoint -Name "Database Readiness (/api/ready)" -Path "/api/ready"
if ($ready) {
    Write-Host ("       DB Provider: {0} | Latency: {1}ms" -f $ready.database.provider, $ready.database.latencyMs) -ForegroundColor Gray
}

# 3. Instance metadata (/api/instance)
$inst = Assert-Endpoint -Name "Instance Identity (/api/instance)" -Path "/api/instance"
if ($inst) {
    Write-Host ("       Instance ID: {0} | AZ: {1} | Hostname: {2}" -f $inst.instanceId, $inst.availabilityZone, $inst.hostname) -ForegroundColor Gray
}

# 4. Storage Diagnostic (/api/storage/status)
$storage = Assert-Endpoint -Name "Storage Status (/api/storage/status)" -Path "/api/storage/status"
if ($storage) {
    Write-Host ("       EBS Mounted: {0} | S3 Bucket: {1}" -f $storage.ebs.isMounted, $storage.s3.bucketName) -ForegroundColor Gray
}

# 5. Create Order (/api/orders POST)
$newOrderPayload = @{
    customerName = "Automated Verification Test"
    amount = 999.00
    status = "paid"
    itemsSummary = "End-to-End Test Merchandise Kit"
}
$created = Assert-Endpoint -Name "Create Order (/api/orders POST)" -Path "/api/orders" -Method "Post" -Body $newOrderPayload

# 6. Query Orders (/api/orders GET)
$ordersList = Assert-Endpoint -Name "Query Orders List (/api/orders GET)" -Path "/api/orders"
if ($ordersList -and $ordersList.orders) {
    Write-Host ("       Retrieved {0} orders from database" -f $ordersList.orders.Count) -ForegroundColor Gray
}

# 7. Write EBS File (/api/storage/ebs POST)
$ebsWrite = Assert-Endpoint -Name "Write EBS File (/api/storage/ebs POST)" -Path "/api/storage/ebs" -Method "Post" -Body @{
    filename = "sample-order-file.txt"
    customNote = "Automated verification test script execution."
}

# 8. Upload S3 File (/api/storage/s3 POST)
$s3Upload = Assert-Endpoint -Name "Upload S3 File (/api/storage/s3 POST)" -Path "/api/storage/s3" -Method "Post" -Body @{
    filename = "sample-s3-file.txt"
    customNote = "Automated verification test script execution."
}

Write-Host "`n------------------------------------------------------------"
if ($allPassed) {
    Write-Host " RESULT: ALL DEPLOYMENT VERIFICATION CHECKS PASSED!" -ForegroundColor Green
} else {
    Write-Host " RESULT: ONE OR MORE CHECKS ENCOUNTERED ISSUES. SEE LOG ABOVE." -ForegroundColor Yellow
}
Write-Host "============================================================`n"
