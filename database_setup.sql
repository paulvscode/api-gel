-- database_setup.sql

-- Switch to your database
USE gels_avoirs_db;

-- Create the publication table if it doesn't exist
CREATE TABLE IF NOT EXISTS publication (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date_publication DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create the person table if it doesn't exist
CREATE TABLE IF NOT EXISTS person (
    id INT AUTO_INCREMENT PRIMARY KEY,
    publication_id INT,
    id_registre INT UNIQUE,
    nature VARCHAR(255),
    nom VARCHAR(255),
    prenom VARCHAR(255),
    sexe VARCHAR(10),
    date_de_naissance VARCHAR(255),
    lieu_de_naissance VARCHAR(255),
    pays_naissance VARCHAR(255),
    titre TEXT,
    motifs TEXT,
    fondement_juridique_label TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (publication_id) REFERENCES publication(id)
);

-- Add indexes for faster lookups (optional but recommended)
CREATE INDEX idx_publication_id ON person (publication_id);
CREATE INDEX idx_nom ON person (nom);
CREATE INDEX idx_prenom ON person (prenom);