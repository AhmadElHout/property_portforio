CREATE DATABASE IF NOT EXISTS property_portforio;
USE property_portforio;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('owner', 'agent', 'curator') NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS properties (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agent_id INT NOT NULL,
    property_type VARCHAR(50) NOT NULL,
    purpose ENUM('sale', 'rent', 'both') NOT NULL,
    furnished ENUM('yes', 'no', 'partially') NOT NULL,
    city VARCHAR(100) NOT NULL,
    area VARCHAR(100) NOT NULL,
    ownership_type VARCHAR(100) NOT NULL,
    ownership_notes TEXT,
    built_up_area DECIMAL(10, 2),
    land_area DECIMAL(10, 2),
    bedrooms INT,
    bathrooms INT,
    floor_level INT,
    has_24_7_electricity BOOLEAN DEFAULT FALSE,
    has_generator BOOLEAN DEFAULT FALSE,
    has_elevator BOOLEAN DEFAULT FALSE,
    has_parking BOOLEAN DEFAULT FALSE,
    price_usd DECIMAL(15, 2) NOT NULL,
    notes TEXT,
    
    -- Optional Fields
    maid_room BOOLEAN DEFAULT FALSE,
    balcony BOOLEAN DEFAULT FALSE,
    terrace BOOLEAN DEFAULT FALSE,
    heating_system VARCHAR(100),
    ac_system VARCHAR(100),
    water_tank BOOLEAN DEFAULT FALSE,
    concierge BOOLEAN DEFAULT FALSE,
    security BOOLEAN DEFAULT FALSE,
    gym BOOLEAN DEFAULT FALSE,
    pool BOOLEAN DEFAULT FALSE,
    zoning VARCHAR(100),
    occupancy_status VARCHAR(100),
    payment_method VARCHAR(100),
    commission VARCHAR(100),

    status ENUM('active', 'on_hold', 'archived') DEFAULT 'active',
    content_status ENUM('new', 'in_review', 'ready', 'needs_fix') DEFAULT 'new',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (agent_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS property_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    property_id INT NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS clients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agent_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    type ENUM('owner', 'lead') NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    whatsapp VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (agent_id) REFERENCES users(id)
);

-- Curator feedback table
CREATE TABLE IF NOT EXISTS curator_feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    property_id INT NOT NULL,
    curator_id INT NOT NULL,
    comments TEXT,
    requested_changes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (curator_id) REFERENCES users(id)
);

-- Internal notes table (agent-only)
CREATE TABLE IF NOT EXISTS property_internal_notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    property_id INT NOT NULL,
    agent_id INT NOT NULL,
    note TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (agent_id) REFERENCES users(id)
);

-- Status change history (for audit trail)
CREATE TABLE IF NOT EXISTS property_status_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    property_id INT NOT NULL,
    user_id INT NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    status_type ENUM('operational', 'content') NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Optional: Seed initial admin user (password: admin123 - hashed version to be generated)
-- INSERT INTO users (name, email, password_hash, role) VALUES ('Admin', 'admin@example.com', '$2b$10$EpOoT.w.w.w.w.w.w.w.w.w.w.w.w.w.w.w.w.w.w.w.w.w.w.w', 'admin');
