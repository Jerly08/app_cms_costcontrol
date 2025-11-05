# Quick Start Script untuk Backend API
# Unipro Project Management

Write-Host "================================" -ForegroundColor Cyan
Write-Host "  Unipro Backend API Starter" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if Go is installed
Write-Host "Checking prerequisites..." -ForegroundColor Yellow
try {
    $goVersion = go version 2>$null
    Write-Host "✓ Go installed: $goVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Go is not installed!" -ForegroundColor Red
    Write-Host "Please install Go from: https://go.dev/dl/" -ForegroundColor Yellow
    Write-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

# Check if .env exists
if (-Not (Test-Path ".env")) {
    Write-Host "✗ .env file not found!" -ForegroundColor Red
    Write-Host "Creating .env from template..." -ForegroundColor Yellow
    Copy-Item ".env.example" -Destination ".env"
    Write-Host "✓ .env file created" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  IMPORTANT: Please edit .env and set your MySQL password!" -ForegroundColor Red
    Write-Host "Then run this script again." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 0
}

Write-Host ""
Write-Host "Starting backend server..." -ForegroundColor Yellow
Write-Host ""

# Run the server
go run cmd/main.go

