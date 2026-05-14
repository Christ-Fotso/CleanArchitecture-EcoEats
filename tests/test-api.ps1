$baseUrl = "http://localhost:3001"
$headers = @{ "Content-Type" = "application/json" }

Write-Host "--- 1. Testing Health & Metrics ---"
$health = Invoke-RestMethod -Uri "$baseUrl/health"
Write-Host "Health: $($health.status)"
$metrics = Invoke-WebRequest -Uri "$baseUrl/metrics" -UseBasicParsing
Write-Host "Metrics endpoint is alive (Size: $($metrics.Content.Length) bytes)"

Write-Host "`n--- 2. Testing Auth (Register & Login) ---"
$regBody = @{ email="client@ecoeats.fr"; password="Password123!"; name="Test User"; phone="0102030405"; role="CLIENT" } | ConvertTo-Json
try {
    $login = Invoke-RestMethod -Method Post -Uri "$baseUrl/auth/login/email" -Body (@{ email="client@ecoeats.fr"; password="Password123!" } | ConvertTo-Json) -Headers $headers
    $token = $login.tokens.accessToken
    if (-not $token) { throw "Token not found in login response" }
    Write-Host "Login Successful. Token acquired."
} catch {
    Write-Host "Login failed. Trying register first..."
    try {
        Invoke-RestMethod -Method Post -Uri "$baseUrl/auth/register/email" -Body $regBody -Headers $headers
    } catch { }
    $login = Invoke-RestMethod -Method Post -Uri "$baseUrl/auth/login/email" -Body (@{ email="client@ecoeats.fr"; password="Password123!" } | ConvertTo-Json) -Headers $headers
    $token = $login.tokens.accessToken
    if (-not $token) { throw "Token not found after register/login" }
    Write-Host "Register & Login Successful."
}

$authHeaders = @{ 
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $token"
}

Write-Host "`n--- 3. Testing Menu & Cache ---"
# Get first active restaurant
$restaurants = Invoke-RestMethod -Uri "$baseUrl/restaurants/active"
$resId = $restaurants[0].id
Write-Host "Using Restaurant ID: $resId"

Write-Host "Call 1 (Should hit DB)..."
$start1 = Get-Date
$menu1 = Invoke-RestMethod -Uri "$baseUrl/restaurants/$resId/menu"
$end1 = Get-Date
Write-Host "Duration: $(($end1 - $start1).TotalMilliseconds)ms"

Write-Host "Call 2 (Should hit Cache)..."
$start2 = Get-Date
$menu2 = Invoke-RestMethod -Uri "$baseUrl/restaurants/$resId/menu"
$end2 = Get-Date
Write-Host "Duration: $(($end2 - $start2).TotalMilliseconds)ms"

Write-Host "`n--- 4. Testing Order & Event-Sourcing ---"
# Get payment methods for the user
$pms = Invoke-RestMethod -Method Get -Uri "$baseUrl/payment/methods" -Headers $authHeaders
Write-Host "Payment Methods found: $($pms.Count)"
$pmId = $pms[0].id
Write-Host "Using Payment Method ID: $pmId"

if ($null -eq $pmId) {
    Write-Host "ERROR: No payment method found for this user. Ensure seeding worked."
    exit 1
}

$orderBody = @{
    restaurantId = $resId
    clientLat = 48.866
    clientLng = 2.333
    items = @(
        @{ 
            menuItemId = $menu1[0].items[0].id
            name = $menu1[0].items[0].name
            unitPrice = $menu1[0].items[0].price
            quantity = 1 
        }
    )
    deliveryStreet = "123 Test St"
    deliveryCity = "Test City"
    paymentMethodId = $pmId
    tipAmount = 2
} | ConvertTo-Json

try {
    $orderResult = Invoke-RestMethod -Method Post -Uri "$baseUrl/orders" -Body $orderBody -Headers $authHeaders
    Write-Host "Order Created! ID: $($orderResult.id)"
} catch {
    Write-Host "Order creation failed: $_"
}

Write-Host "`n--- 5. Verifying EventStore ---"
# Check DB directly for DomainEvent
docker exec ecoeats-db psql -U ecoEats -d EcoEats -c 'SELECT event_type, aggregate_id FROM "DomainEvent" ORDER BY created_at DESC LIMIT 1;'

Write-Host "`n--- E2E Tests Completed ---"
