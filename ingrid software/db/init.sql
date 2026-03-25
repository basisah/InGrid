CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,

    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,

    date_of_birth DATE,
    home_address VARCHAR(255),
    phone_number VARCHAR(20),

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
  type ENUM('rental', 'short-term', 'buy') NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  bedrooms INT,
  bathrooms INT,
  size INT,
  description TEXT,
  main_image VARCHAR(500),
  latitude DECIMAL(10,6),
  longitude DECIMAL(10,6),
  is_verified BOOLEAN DEFAULT FALSE,
  landlord_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (landlord_id) REFERENCES users(id) ON DELETE SET NULL
);

INSERT INTO users 
(first_name, last_name, email, password, role, is_verified)
VALUES 
(
'Admin',
'User',
'admin@ingrid.com',
'$2b$10$7QJ6c8C5GqC0qYw7S0qH7eK5l8cNQW5p0kq0Oe6O8vWJQmTq6qM7y',
'admin',
TRUE
);

INSERT INTO properties (title, address, type, price, bedrooms, bathrooms, size, description, main_image, latitude, longitude, is_verified) VALUES
('Cozy Downtown Condo', '123 Main St, Saskatoon', 'rental', 1800, 1, 1, 650, 'A cozy condo close to university.', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267', 52.1332, -106.6700, TRUE),
('Family Home with Yard', '456 Oak Ave, Regina', 'rental', 2200, 3, 2, 1400, 'Spacious family home with a large yard.', 'https://images.unsplash.com/photo-1570129477492-45c003edd2be', 50.4452, -104.6189, TRUE),
('Spacious Modern House', '789 Pine Rd, Prince Albert', 'buy', 350000, 4, 3, 2200, 'Modern house for sale.', 'https://images.unsplash.com/photo-1568605114967-8130f3a36994', 53.2033, -105.7531, FALSE);