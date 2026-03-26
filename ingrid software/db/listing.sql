-- CREATE TABLE properties (
--     id INT PRIMARY KEY AUTO_INCREMENT,
--     title VARCHAR(255),
--     description TEXT,
--     type ENUM('rental','short-term','buy'),
--     price DECIMAL(12,2),
--     bedrooms INT,
--     bathrooms INT,
--     size INT,
--     address VARCHAR(255),
--     latitude DECIMAL(10,8),
--     longitude DECIMAL(11,8),
--     seller_id INT,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     FOREIGN KEY (seller_id) REFERENCES users(id)
-- );

-- nelson - i commented out the above code because i moved the properties table to init.sql and i added more columns to it so i will just keep the new version of the properties table in init.sql and delete this one
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

-- CREATE TABLE favorites (
--     user_id INT,
--     property_id INT,
--     PRIMARY KEY (user_id, property_id),
--     FOREIGN KEY (user_id) REFERENCES users(id),
--     FOREIGN KEY (property_id) REFERENCES properties(id)
-- );
CREATE TABLE saved_listings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  property_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (property_id) REFERENCES properties(id)
);

CREATE TABLE view_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  property_id INT,
  viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (property_id) REFERENCES properties(id)
);


CREATE TABLE messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sender_id INT,
  receiver_id INT,
  property_id INT,
  message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO properties (title, address, type, price, bedrooms, bathrooms, size, description, main_image, latitude, longitude, is_verified) VALUES
('Cozy Downtown Condo', '123 Main St, Saskatoon', 'rental', 1800, 1, 1, 650, 'A cozy condo close to university.', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267', 52.1332, -106.6700, TRUE),
('Family Home with Yard', '456 Oak Ave, Regina', 'rental', 2200, 3, 2, 1400, 'Spacious family home with a large yard.', 'https://images.unsplash.com/photo-1570129477492-45c003edd2be', 50.4452, -104.6189, TRUE),
('Spacious Modern House', '789 Pine Rd, Prince Albert', 'buy', 350000, 4, 3, 2200, 'Modern house for sale.', 'https://images.unsplash.com/photo-1568605114967-8130f3a36994', 53.2033, -105.7531, FALSE);

CREATE TABLE payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  property_id INT NOT NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guests INT DEFAULT 1,
  amount DECIMAL(10,2) NOT NULL,
  status ENUM('pending', 'completed', 'refunded') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (property_id) REFERENCES properties(id)
);