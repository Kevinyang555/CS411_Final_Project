CREATE TABLE Location (
  location_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(160) NOT NULL,
  country VARCHAR(80) NOT NULL,
  lat DECIMAL(9,6) NOT NULL,
  lon DECIMAL(9,6) NOT NULL,
  tz VARCHAR(40) NOT NULL
);

CREATE TABLE WeatherDaily (
  weather_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  location_id BIGINT NOT NULL,
  on_date DATE NOT NULL,
  min_temp_c DECIMAL(5,2),
  max_temp_c DECIMAL(5,2),
  precip_mm DECIMAL(6,2),
  conditions VARCHAR(64),
  source VARCHAR(40),
  CONSTRAINT weather_loc
    FOREIGN KEY (location_id) REFERENCES Location(location_id)
      ON DELETE CASCADE
);

USE smart_travel_db;
CREATE TABLE Attraction (
    attraction_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    location_id BIGINT,
    name VARCHAR(200),
    category VARCHAR(40),
    rating DECIMAL(2,1) NULL,
    lat DECIMAL(9,6),
    lon DECIMAL(9,6),
    source VARCHAR(40),
    FOREIGN KEY (location_id) REFERENCES Location(location_id) on DELETE CASCADE
);
CREATE TABLE ItineraryItem (
    item_id INT,
    trip_id INT,
    attraction_id BIGINT,
    visit_date DATE,
    start_time TIME,
    end_time TIME,
    notes VARCHAR(400),
    sort_order INT,
    PRIMARY KEY (item_id, trip_id),
    FOREIGN KEY (trip_id) REFERENCES Trip(trip_id) ON DELETE CASCADE,
    FOREIGN KEY (attraction_id) REFERENCES Attraction(attraction_id) ON DELETE SET NULL
);

