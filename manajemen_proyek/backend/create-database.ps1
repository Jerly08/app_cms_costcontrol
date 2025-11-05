# Script untuk membuat database PostgreSQL
$env:PGPASSWORD = "Moon"

Write-Host "Creating PostgreSQL database..." -ForegroundColor Cyan

$createDb = "CREATE DATABASE unipro_project_management;"

try {
    psql -U postgres -c $createDb
    Write-Host "Database 'unipro_project_management' created successfully!" -ForegroundColor Green
} catch {
    Write-Host "Error: psql command not found." -ForegroundColor Red
    Write-Host "Please create database manually via pgAdmin" -ForegroundColor Yellow
    Write-Host "Database name: unipro_project_management" -ForegroundColor White
}

Remove-Item Env:\PGPASSWORD

