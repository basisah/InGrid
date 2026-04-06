CREATE TABLE property_images (
    id INT PRIMARY KEY AUTO_INCREMENT,
    property_id INT,
    image_url VARCHAR(500),
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

-- Furniture Table (UPDATED with width & depth)
CREATE TABLE furniture (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255),
    category VARCHAR(100),
    price DECIMAL(10,2),
    image_url VARCHAR(500),
    color_theme VARCHAR(100),
    width DECIMAL(5,2),
    depth DECIMAL(5,2)
);

-- Property-Furniture relation
CREATE TABLE property_furniture (
    property_id INT,
    furniture_id INT,
    PRIMARY KEY (property_id, furniture_id),
    FOREIGN KEY (property_id) REFERENCES properties(id),
    FOREIGN KEY (furniture_id) REFERENCES furniture(id)
);

-- Saved listings
CREATE TABLE saved_listings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  property_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (property_id) REFERENCES properties(id)
);

-- View history
CREATE TABLE view_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  property_id INT,
  viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (property_id) REFERENCES properties(id)
);

-- Messages (ONLY ONE VERSION - fixed)
CREATE TABLE messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sender_id INT,
  receiver_id INT,
  property_id INT,
  message TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Properties seed data
INSERT INTO properties (title, address, type, price, bedrooms, bathrooms, size, description, main_image, latitude, longitude, is_verified) VALUES
('Cozy Downtown Condo', '123 Main St, Saskatoon', 'rental', 2180, 1, 1, 650, 'A cozy condo close to university.', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267', 52.1332, -106.6700, TRUE),
('Family Home with Yard', '456 Oak Ave, Regina', 'rental', 4000, 3, 2, 1400, 'Spacious family home with a large yard.', 'https://images.unsplash.com/photo-1570129477492-45c003edd2be', 50.4452, -104.6189, TRUE),
('Spacious Modern House', '789 Pine Rd, Prince Albert', 'buy', 75000, 4, 3, 2200, 'Modern house for sale.', 'https://images.unsplash.com/photo-1568605114967-8130f3a36994', 53.2033, -105.7531, FALSE);

-- Payments table
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

-- Furniture seed data (UPDATED WITH YOUR LINKS)
INSERT INTO furniture (id, name, category, price, image_url, color_theme, width, depth) VALUES
(1, 'Sofa Set', 'Living Room', 899.99, 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc', 'Gray', 6.00, 3.00),

(2, 'Dining Table', 'Dining Room', 499.99, 'https://images.unsplash.com/photo-1572025442348-511bdcae389b?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fGRpbm5pbmclMjB0YWJsZXxlbnwwfHwwfHx8MA%3D%3D', 'Brown', 9.00, 5.00),

(3, 'Queen Bed', 'Bedroom', 799.99, 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85', 'White', 5.00, 7.00),

(4, 'Office Desk', 'Office', 299.99, 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd', 'Black', 4.00, 2.00),

(5, 'Bookshelf', 'Storage', 189.99, 'https://plus.unsplash.com/premium_photo-1677517547407-6a0a6cdb2fb0?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8Ym9va3NlbGZ8ZW58MHx8MHx8fDA%3D', 'Oak', 3.00, 1.00),

(6, 'TV Stand', 'Living Room', 219.99, 'https://images.unsplash.com/photo-1698674388698-f22228a79879?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTZ8fHR2JTIwc3RhbmR8ZW58MHx8MHx8fDA%3D', 'Walnut', 4.00, 1.50),

(7, 'Coffee Table', 'Living Room', 159.99, 'https://plus.unsplash.com/premium_photo-1722843459670-cc2560c22b36?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTd8fGNvZmZlZSUyMHRhYmxlfGVufDB8fDB8fHww', 'Brown', 3.00, 2.00),

(8, 'Nightstand', 'Bedroom', 89.99, 'https://plus.unsplash.com/premium_photo-1686167988299-c05aaf2f5075?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8bmlnaHRzdGFuZHxlbnwwfHwwfHx8MA%3D%3D', 'White', 2.00, 1.50);

-- Link all furniture to property 3
INSERT INTO property_furniture (property_id, furniture_id) VALUES
(3,1),(3,2),(3,3),(3,4),(3,5),(3,6),(3,7),(3,8);