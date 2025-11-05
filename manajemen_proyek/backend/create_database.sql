-- Create Database untuk Unipro Project Management
-- Jalankan di pgAdmin atau psql client

-- Create database (run this as postgres superuser)
CREATE DATABASE unipro_project_management
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.UTF-8'
    LC_CTYPE = 'en_US.UTF-8'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

-- Connect to database
\c unipro_project_management;

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Database siap untuk auto-migration dari Golang

