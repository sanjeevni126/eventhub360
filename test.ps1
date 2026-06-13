$body = @{
    email='pranay@isoftzone.com'
    password='123456'
    role='admin'
} | ConvertTo-Json

$res1 = Invoke-RestMethod -Uri 'https://employee-management-api-lf6s.onrender.com/api/auth/login' -Method Post -Body $body -ContentType 'application/json'
$token = $res1.token
$headers = @{ Authorization = "Bearer $token" }

try {
    $res2 = Invoke-RestMethod -Uri 'https://employee-management-api-lf6s.onrender.com/api/assets/1/return' -Method Post -Headers $headers
    $res2 | ConvertTo-Json
} catch {
    Write-Output "STATUS: $($_.Exception.Response.StatusCode.value__)"
    Write-Output "ERROR: $($_.Exception.Response.StatusDescription)"
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $responseBody = $reader.ReadToEnd()
    Write-Output "BODY: $responseBody"
}
