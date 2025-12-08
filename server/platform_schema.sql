CREATE DATABASE IF NOT EXISTS platform_db;
USE platform_db;

CREATE TABLE IF NOT EXISTS super_admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS agencies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    database_name VARCHAR(255) NOT NULL,
    db_host VARCHAR(255) DEFAULT 'localhost',
    db_user VARCHAR(255) NOT NULL,
    db_password VARCHAR(255), -- In production, this should be encrypted
    owner_admin_id INT, -- Reference to the main admin in the agency DB (logical link)
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS agency_performance_summary (
    agency_id INT PRIMARY KEY,
    total_properties INT DEFAULT 0,
    avg_price DECIMAL(15, 2) DEFAULT 0,
    avg_area DECIMAL(10, 2) DEFAULT 0,
    properties_by_type JSON,
    leads_count INT DEFAULT 0,
    last_sync_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE
);

-- Seed a default super admin (password: admin123)
-- INSERT INTO super_admin_users (name, email, password_hash) VALUES ('Super Admin', 'super@platform.com', '$2b$10$EpOoT.w.w.w.w.w.w.w.w.w.w.w.w.w.w.w.w.w.w.w.w.w.w.w');
