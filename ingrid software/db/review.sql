-- ALTER TABLE payments
--   ADD COLUMN status ENUM('pending','completed','cancelled') NOT NULL DEFAULT 'completed',
--   ADD COLUMN check_in DATE NULL,
--   ADD COLUMN check_out DATE NULL;

CREATE TABLE IF NOT EXISTS reviews (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  booking_id        INT NOT NULL,
  property_id       INT NOT NULL,
  reviewer_user_id  INT NOT NULL,
  review_type       ENUM('PROPERTY', 'LANDLORD', 'AREA') NOT NULL,
  reviewee_user_id  INT NULL,
  area_name         VARCHAR(255) NULL,
  rating            TINYINT NOT NULL,
  description       TEXT NULL,
  is_verified       BOOLEAN NOT NULL DEFAULT FALSE,
  status            ENUM('PUBLISHED', 'FLAGGED') NOT NULL DEFAULT 'PUBLISHED',
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT fk_reviews_booking   FOREIGN KEY (booking_id)       REFERENCES payments(id)   ON DELETE CASCADE,
  CONSTRAINT fk_reviews_property  FOREIGN KEY (property_id)      REFERENCES properties(id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_reviewer  FOREIGN KEY (reviewer_user_id) REFERENCES users(id)      ON DELETE CASCADE,
  CONSTRAINT fk_reviews_reviewee  FOREIGN KEY (reviewee_user_id) REFERENCES users(id)      ON DELETE SET NULL,

  UNIQUE KEY uq_review_per_booking_type (booking_id, reviewer_user_id, review_type)
);

CREATE TABLE IF NOT EXISTS property_ratings (
  property_id    INT PRIMARY KEY,
  avg_rating     DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  total_reviews  INT NOT NULL DEFAULT 0,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_property_ratings_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

DELIMITER $$

CREATE TRIGGER trg_property_ratings_after_insert
AFTER INSERT ON reviews
FOR EACH ROW
BEGIN
  IF NEW.review_type = 'PROPERTY' THEN
    INSERT INTO property_ratings (property_id, avg_rating, total_reviews)
    SELECT
      NEW.property_id,
      COALESCE(AVG(rating), 0),
      COUNT(*)
    FROM reviews
    WHERE property_id = NEW.property_id
      AND review_type = 'PROPERTY'
      AND status = 'PUBLISHED'
    ON DUPLICATE KEY UPDATE
      avg_rating = VALUES(avg_rating),
      total_reviews = VALUES(total_reviews),
      updated_at = NOW();
  END IF;
END$$

CREATE TRIGGER trg_property_ratings_after_update
AFTER UPDATE ON reviews
FOR EACH ROW
BEGIN
  IF OLD.review_type = 'PROPERTY' THEN
    INSERT INTO property_ratings (property_id, avg_rating, total_reviews)
    SELECT
      OLD.property_id,
      COALESCE(AVG(rating), 0),
      COUNT(*)
    FROM reviews
    WHERE property_id = OLD.property_id
      AND review_type = 'PROPERTY'
      AND status = 'PUBLISHED'
    ON DUPLICATE KEY UPDATE
      avg_rating = VALUES(avg_rating),
      total_reviews = VALUES(total_reviews),
      updated_at = NOW();
  END IF;

  IF NEW.review_type = 'PROPERTY' THEN
    INSERT INTO property_ratings (property_id, avg_rating, total_reviews)
    SELECT
      NEW.property_id,
      COALESCE(AVG(rating), 0),
      COUNT(*)
    FROM reviews
    WHERE property_id = NEW.property_id
      AND review_type = 'PROPERTY'
      AND status = 'PUBLISHED'
    ON DUPLICATE KEY UPDATE
      avg_rating = VALUES(avg_rating),
      total_reviews = VALUES(total_reviews),
      updated_at = NOW();
  END IF;
END$$

CREATE TRIGGER trg_property_ratings_after_delete
AFTER DELETE ON reviews
FOR EACH ROW
BEGIN
  IF OLD.review_type = 'PROPERTY' THEN
    INSERT INTO property_ratings (property_id, avg_rating, total_reviews)
    SELECT
      OLD.property_id,
      COALESCE(AVG(rating), 0),
      COUNT(*)
    FROM reviews
    WHERE property_id = OLD.property_id
      AND review_type = 'PROPERTY'
      AND status = 'PUBLISHED'
    ON DUPLICATE KEY UPDATE
      avg_rating = VALUES(avg_rating),
      total_reviews = VALUES(total_reviews),
      updated_at = NOW();
  END IF;
END$$

DELIMITER ;

CREATE OR REPLACE VIEW v_reviews AS
SELECT
  r.id,
  r.booking_id,
  r.property_id,
  r.reviewer_user_id,
  TRIM(CONCAT(COALESCE(ru.first_name, ''), ' ', COALESCE(ru.last_name, ''))) AS reviewer_name,
  r.review_type,
  r.reviewee_user_id,
  TRIM(CONCAT(COALESCE(rev.first_name, ''), ' ', COALESCE(rev.last_name, ''))) AS reviewee_name,
  r.area_name,
  r.rating,
  r.description,
  r.is_verified,
  r.status,
  r.created_at
FROM reviews r
JOIN users ru ON ru.id = r.reviewer_user_id
LEFT JOIN users rev ON rev.id = r.reviewee_user_id
WHERE r.status = 'PUBLISHED';