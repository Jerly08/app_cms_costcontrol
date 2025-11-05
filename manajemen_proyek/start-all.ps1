# Start Both Frontend and Backend
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Cost Control CMS Full Stack" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if port is in use
function Test-Port {
    param([int]$Port)
    $connection = Test-NetConnection -ComputerName localhost -Port $Port -InformationLevel Quiet -WarningAction SilentlyContinue
    return $connection
}

# Check if backend port (8080) is already in use
if (Test-Port -Port 8080) {
    Write-Host "⚠️  Port 8080 sudah digunakan. Backend mungkin sudah berjalan." -ForegroundColor Yellow
    $continueBackend = Read-Host "Lanjutkan tanpa start backend? (Y/N)"
    if ($continueBackend -ne "Y" -and $continueBackend -ne "y") {
        Write-Host "❌ Dibatalkan" -ForegroundColor Red
        exit 1
    }
    $skipBackend = $true
} else {
    $skipBackend = $false
}

# Check if frontend port (3000) is already in use
if (Test-Port -Port 3000) {
    Write-Host "⚠️  Port 3000 sudah digunakan. Frontend mungkin sudah berjalan." -ForegroundColor Yellow
    $continueFrontend = Read-Host "Lanjutkan tanpa start frontend? (Y/N)"
    if ($continueFrontend -ne "Y" -and $continueFrontend -ne "y") {
        Write-Host "❌ Dibatalkan" -ForegroundColor Red
        exit 1
    }
    $skipFrontend = $true
} else {
    $skipFrontend = $false
}

Write-Host ""

# Start Backend (Golang)
if (-not $skipBackend) {
    Write-Host "🚀 Starting Backend (Golang - Port 8080)..." -ForegroundColor Green
    Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; Write-Host '═══════════════════════════════════════' -ForegroundColor Cyan; Write-Host '  BACKEND (Golang) - Port 8080' -ForegroundColor Green; Write-Host '═══════════════════════════════════════' -ForegroundColor Cyan; Write-Host ''; go run cmd/main.go"
    Start-Sleep -Seconds 3
    Write-Host "✅ Backend started!" -ForegroundColor Green
} else {
    Write-Host "⏭️  Skipping Backend..." -ForegroundColor Yellow
}

Write-Host ""

# Start Frontend (Next.js/React)
if (-not $skipFrontend) {
    Write-Host "🚀 Starting Frontend (React/Next.js - Port 3000)..." -ForegroundColor Green
    Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; Write-Host '═══════════════════════════════════════' -ForegroundColor Cyan; Write-Host '  FRONTEND (React/Next.js) - Port 3000' -ForegroundColor Blue; Write-Host '═══════════════════════════════════════' -ForegroundColor Cyan; Write-Host ''; npm run dev"
    Start-Sleep -Seconds 3
    Write-Host "✅ Frontend started!" -ForegroundColor Green
} else {
    Write-Host "⏭️  Skipping Frontend..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Application Started Successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 URLs:" -ForegroundColor White
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "   Backend:  http://localhost:8080" -ForegroundColor Cyan
Write-Host "   API:      http://localhost:8080/api/v1" -ForegroundColor Cyan
Write-Host ""
Write-Host "👉 Tekan Ctrl+C di terminal masing-masing untuk stop server" -ForegroundColor Yellow
Write-Host ""

