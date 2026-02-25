CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255),
    role ENUM('buyer','seller','agent','admin'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE properties (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255),
    description TEXT,
    type ENUM('rental','short-term','buy'),
    price DECIMAL(12,2),
    bedrooms INT,
    bathrooms INT,
    size INT,
    address VARCHAR(255),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    seller_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (seller_id) REFERENCES users(id)
);

CREATE TABLE property_images (
    id INT PRIMARY KEY AUTO_INCREMENT,
    property_id INT,
    image_url VARCHAR(500),
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

CREATE TABLE furniture (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255),
    category VARCHAR(100),
    price DECIMAL(10,2),
    image_url VARCHAR(500),
    color_theme VARCHAR(100)
);

CREATE TABLE property_furniture (
    property_id INT,
    furniture_id INT,
    PRIMARY KEY (property_id, furniture_id),
    FOREIGN KEY (property_id) REFERENCES properties(id),
    FOREIGN KEY (furniture_id) REFERENCES furniture(id)
);

CREATE TABLE favorites (
    user_id INT,
    property_id INT,
    PRIMARY KEY (user_id, property_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (property_id) REFERENCES properties(id)
);