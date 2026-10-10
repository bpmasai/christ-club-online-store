<#
.SYNOPSIS
    Verifies AWS Application Load Balancer traffic distribution across EC2 instances.
.DESCRIPTION
    Sends repeated HTTP requests to the ALB DNS name (or local test endpoint)
    and tallies which EC2 instance handled each request.
.PARAMETER TargetUrl
    The URL of the ALB (e.g., http://christ-club-alb-123456789.us-east-1.elb.amazonaws.com)
.PARAMETER RequestCount
    The number of requests to send (default: 30)
#>
param (
    [string]$TargetUrl = "http://localhost:3000",
    [int]$RequestCount = 30
)

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " CHRIST CLUB ONLINE STORE - ALB TRAFFIC DISTRIBUTION TEST  " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Target Endpoint: $TargetUrl/api/instance"
Write-Host "Total Requests:  $RequestCount"
Write-Host "------------------------------------------------------------"

$instanceCounts = @{}
$azCounts = @{}

for ($i = 1; $i -le $RequestCount; $i++) {
    try {
        $response = Invoke-RestMethod -Uri "$TargetUrl/api/instance" -Method Get -TimeoutSec 5 -Headers @{ "Cache-Control" = "no-cache" }
        $id = $response.instanceId
        $az = $response.availabilityZone

        if (-not $instanceCounts.ContainsKey($id)) {
            $instanceCounts[$id] = 0
            $azCounts[$id] = $az
        }
        $instanceCounts[$id]++

        Write-Host ("Request {0,2} -> {1} ({2})" -f $i, $id, $az) -ForegroundColor Green
    }
    catch {
        Write-Host ("Request {0,2} -> FAILED: {1}" -f $i, $_.Exception.Message) -ForegroundColor Red
    }
    Start-Sleep -Milliseconds 100
}

Write-Host "`n------------------------------------------------------------"
Write-Host " TRAFFIC DISTRIBUTION SUMMARY REPORT" -ForegroundColor Cyan
Write-Host "------------------------------------------------------------"
Write-Host ("{0,-24} {1,-14} {2,-10} {3,-10}" -f "Instance Identifier", "Zone", "Requests", "Percentage")
Write-Host ("{0,-24} {1,-14} {2,-10} {3,-10}" -f "------------------------", "------------", "--------", "----------")

foreach ($key in $instanceCounts.Keys) {
    $count = $instanceCounts[$key]
    $pct = [math]::Round(($count / $RequestCount) * 100, 1)
    $zone = $azCounts[$key]
    Write-Host ("{0,-24} {1,-14} {2,-10} {3,-10}%" -f $key, $zone, $count, $pct) -ForegroundColor Yellow
}
Write-Host "============================================================`n"
