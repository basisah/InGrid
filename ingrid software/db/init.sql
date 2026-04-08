CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,

    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,

    date_of_birth DATE,
    home_address VARCHAR(255),
    phone_number VARCHAR(20),
    profile_picture LONGTEXT,

    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,

    is_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    reset_token VARCHAR(255),
    
    role ENUM('user', 'admin', 'landlord') DEFAULT 'user',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE password_resets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_reset_user ON password_resets(user_id);

CREATE TABLE account_verification (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
  verified_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE properties (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  address VARCHAR(255) NOT NULL,
  -- city VARCHAR(100) NOT NULL,
  -- province VARCHAR(100) NOT NULL,
  type ENUM('rental', 'short-term', 'buy') NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  bedrooms INT,
  bathrooms INT,
  size INT,
  description TEXT,
  main_image LONGTEXT,
  latitude DECIMAL(10,6),
  longitude DECIMAL(10,6),
  is_verified BOOLEAN DEFAULT FALSE,
  landlord_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (landlord_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS property_rooms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  property_id INT NOT NULL,
  name VARCHAR(255),
  type VARCHAR(100),
  size_category ENUM('small', 'medium', 'large') DEFAULT 'medium',
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

INSERT INTO users 
(first_name, last_name, email, password, role, is_verified)
VALUES 
(
'Admin',
'User',
'admin@ingrid.com',
'$2b$10$u1s1uW8z5Fz5QK0x7Zrj7u9g5z9p6vOeJ7FQz9qZCw8Q2c3z6F6bW',
'admin',
TRUE
);
