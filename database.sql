-- Run this statement while connected to the postgres database
CREATE DATABASE equipment_tracker;

-- Switch the connection to equipment_tracker before running this statement
CREATE TABLE borrow_records (
    id SERIAL PRIMARY KEY,
    equipment_name VARCHAR(100) NOT NULL,
    borrower_name VARCHAR(100) NOT NULL,
    borrow_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Borrowed',
    CHECK (status IN ('Borrowed', 'Returned'))
);