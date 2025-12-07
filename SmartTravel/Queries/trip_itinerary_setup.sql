USE smart_travel_db;

-- Add origin column if it doesn't exist
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'smart_travel_db' AND TABLE_NAME = 'Trip' AND COLUMN_NAME = 'origin');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE Trip ADD COLUMN origin VARCHAR(160)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add destination column if it doesn't exist
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'smart_travel_db' AND TABLE_NAME = 'Trip' AND COLUMN_NAME = 'destination');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE Trip ADD COLUMN destination VARCHAR(160)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add item_count column if it doesn't exist
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'smart_travel_db' AND TABLE_NAME = 'Trip' AND COLUMN_NAME = 'item_count');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE Trip ADD COLUMN item_count INT DEFAULT 0', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- Stored Procedure: CreateTripWithFirstItem
DROP PROCEDURE IF EXISTS CreateTripWithFirstItem;

DELIMITER //

CREATE PROCEDURE CreateTripWithFirstItem(
    IN p_user_id INT,
    IN p_trip_name VARCHAR(200),
    IN p_origin VARCHAR(160),
    IN p_destination VARCHAR(160),
    IN p_start_date DATE,
    IN p_end_date DATE,
    IN p_attraction_id BIGINT,
    IN p_visit_date DATE,
    IN p_start_time TIME,
    IN p_end_time TIME,
    IN p_notes VARCHAR(400),
    OUT p_trip_id INT,
    OUT p_item_id INT
)
BEGIN
    DECLARE v_user_exists INT DEFAULT 0;
    DECLARE v_attraction_exists INT DEFAULT 0;
    DECLARE v_attraction_name VARCHAR(200);
    DECLARE v_destination_from_attraction VARCHAR(160);

    -- Check if user exists
    SELECT COUNT(*) INTO v_user_exists
    FROM UserAccount
    WHERE user_id = p_user_id;

    IF v_user_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User does not exist';
    END IF;

    -- Check attraction exists and get location info
    SELECT a.attraction_id, a.name, l.name INTO v_attraction_exists, v_attraction_name, v_destination_from_attraction
    FROM Attraction a
    JOIN Location l ON a.location_id = l.location_id
    WHERE a.attraction_id = p_attraction_id;

    -- Default destination to attraction's city
    IF p_destination IS NULL OR p_destination = '' THEN
        SET p_destination = v_destination_from_attraction;
    END IF;

    -- Insert trip
    INSERT INTO Trip (user_id, trip_title, origin, destination, start_date, end_date)
    VALUES (p_user_id, p_trip_name, p_origin, p_destination, p_start_date, p_end_date);

    SET p_trip_id = LAST_INSERT_ID();

    -- Insert first itinerary item
    SET p_item_id = 1;

    INSERT INTO ItineraryItem (item_id, trip_id, attraction_id, visit_date, start_time, end_time, notes, sort_order)
    VALUES (p_item_id, p_trip_id, p_attraction_id, p_visit_date, p_start_time, p_end_time, p_notes, 1);

    -- Return created trip
    SELECT
        t.trip_id,
        t.trip_title,
        t.destination,
        t.start_date,
        t.end_date,
        COUNT(i.item_id) AS itinerary_count
    FROM Trip t
    LEFT JOIN ItineraryItem i ON t.trip_id = i.trip_id
    WHERE t.trip_id = p_trip_id
    GROUP BY t.trip_id, t.trip_title, t.destination, t.start_date, t.end_date;

END //

DELIMITER ;


-- Stored Procedure: AddItineraryItem
DROP PROCEDURE IF EXISTS AddItineraryItem;

DELIMITER //

CREATE PROCEDURE AddItineraryItem(
    IN p_trip_id INT,
    IN p_attraction_id BIGINT,
    IN p_visit_date DATE,
    IN p_start_time TIME,
    IN p_end_time TIME,
    IN p_notes VARCHAR(400),
    OUT p_item_id INT
)
BEGIN
    DECLARE v_trip_exists INT DEFAULT 0;
    DECLARE v_next_sort_order INT;
    DECLARE v_already_added INT DEFAULT 0;

    -- Check trip exists
    SELECT COUNT(*) INTO v_trip_exists FROM Trip WHERE trip_id = p_trip_id;

    IF v_trip_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Trip does not exist';
    END IF;

    -- Check if attraction already added
    SELECT COUNT(*) INTO v_already_added
    FROM ItineraryItem
    WHERE trip_id = p_trip_id AND attraction_id = p_attraction_id;

    IF v_already_added > 0 THEN
        SIGNAL SQLSTATE '45001' SET MESSAGE_TEXT = 'Attraction already in itinerary';
    END IF;

    -- Get next item_id
    SELECT COALESCE(MAX(item_id), 0) + 1 INTO p_item_id
    FROM ItineraryItem
    WHERE trip_id = p_trip_id;

    -- Get next sort_order
    SELECT COALESCE(MAX(sort_order), 0) + 1 INTO v_next_sort_order
    FROM ItineraryItem
    WHERE trip_id = p_trip_id;

    -- Insert item
    INSERT INTO ItineraryItem (item_id, trip_id, attraction_id, visit_date, start_time, end_time, notes, sort_order)
    VALUES (p_item_id, p_trip_id, p_attraction_id, p_visit_date, p_start_time, p_end_time, p_notes, v_next_sort_order);

    -- Return item with attraction details
    SELECT
        i.item_id,
        i.trip_id,
        a.name AS attraction_name,
        a.category,
        i.visit_date,
        i.start_time,
        i.end_time,
        i.notes
    FROM ItineraryItem i
    JOIN Attraction a ON i.attraction_id = a.attraction_id
    WHERE i.trip_id = p_trip_id AND i.item_id = p_item_id;

END //

DELIMITER ;


-- Stored Procedure: GetUserTripsWithStats
DROP PROCEDURE IF EXISTS GetUserTripsWithStats;

DELIMITER //

CREATE PROCEDURE GetUserTripsWithStats(
    IN p_user_id INT
)
BEGIN
    SELECT
        t.trip_id,
        t.trip_title,
        t.origin,
        t.destination,
        t.start_date,
        t.end_date,
        t.item_count,
        COUNT(i.item_id) AS itinerary_count,
        (
            SELECT GROUP_CONCAT(DISTINCT a.category SEPARATOR ', ')
            FROM ItineraryItem i2
            JOIN Attraction a ON i2.attraction_id = a.attraction_id
            WHERE i2.trip_id = t.trip_id
        ) AS categories
    FROM Trip t
    LEFT JOIN ItineraryItem i ON t.trip_id = i.trip_id
    WHERE t.user_id = p_user_id
    GROUP BY t.trip_id, t.trip_title, t.origin, t.destination,
             t.start_date, t.end_date, t.item_count
    ORDER BY t.trip_id DESC;

END //

DELIMITER ;


-- Trigger: Increment item_count on insert
DROP TRIGGER IF EXISTS after_itinerary_insert;

DELIMITER //

CREATE TRIGGER after_itinerary_insert
AFTER INSERT ON ItineraryItem
FOR EACH ROW
BEGIN
    IF NEW.trip_id IS NOT NULL THEN
        UPDATE Trip
        SET item_count = item_count + 1
        WHERE trip_id = NEW.trip_id;
    END IF;
END //

DELIMITER ;


-- Trigger: Decrement item_count on delete
DROP TRIGGER IF EXISTS after_itinerary_delete;

DELIMITER //

CREATE TRIGGER after_itinerary_delete
AFTER DELETE ON ItineraryItem
FOR EACH ROW
BEGIN
    IF OLD.trip_id IS NOT NULL THEN
        UPDATE Trip
        SET item_count = GREATEST(item_count - 1, 0)
        WHERE trip_id = OLD.trip_id;
    END IF;
END //

DELIMITER ;


-- Initialize item_count for existing trips
SET SQL_SAFE_UPDATES = 0;

UPDATE Trip t
SET item_count = (
    SELECT COUNT(*)
    FROM ItineraryItem i
    WHERE i.trip_id = t.trip_id
);

SET SQL_SAFE_UPDATES = 1;


-- Verification queries (uncomment to run)
-- DESCRIBE Trip;
-- SHOW PROCEDURE STATUS WHERE Db = 'smart_travel_db';
-- SHOW TRIGGERS FROM smart_travel_db;
