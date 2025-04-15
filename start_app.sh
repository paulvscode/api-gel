#!/bin/bash

# --- Configuration ---
COMPOSE_FILE="docker-compose.yml"
DATABASE_NAME="gels_avoirs_db"
MYSQL_USER="your_app_user"
MYSQL_PASSWORD="your_app_password"
NODE_SCRIPT="index.js"
NODE_PORT="3000"
MYSQL_CONTAINER_NAME="api-gel-db-1" # Set the correct container name
NODE_APP_NAME="my-gels-app"       # Name for your Node.js app in pm2

log() {
  echo "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

check_container_status() {
  container_id=$(docker ps -qf name="$MYSQL_CONTAINER_NAME")
  if [ -z "$container_id" ]; then
    return 1 # Container éteint
  else
    return 0 # Container allumé
  fi
}

install_pm2() {
  if ! command -v pm2 &> /dev/null; then
    log "pm2 n'est pas installé. Installation en cours..."
    npm install -g pm2
    if [ $? -eq 0 ]; then
      log "pm2 installé avec succès."
    else
      log "Erreur lors de l'installation de pm2. Veuillez l'installer manuellement : npm install -g pm2"
      exit 1
    fi
  else
    log "pm2 est déjà installé."
  fi
}

create_database_and_tables() {
  log "Vérification de la connexion à la base de données..."
  # Wait for MySQL to be ready by attempting a simple query with your app user
  until docker exec "$MYSQL_CONTAINER_NAME" mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" -e "SELECT 1;"; do
    log "Attente de la disponibilité de la base de données..."
    sleep 2
  done
  log "Connexion à la base de données établie. Création/vérification de la base de données..."
  # Explicitly create the database if it doesn't exist using your app user
  docker exec "$MYSQL_CONTAINER_NAME" mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS $DATABASE_NAME;"
  log "Création/vérification de la base de données terminée."
  log "Création des tables (embedded SQL)..."
  # Execute the SQL commands directly
  SQL_COMMANDS=$(cat <<'EOF'
USE gels_avoirs_db;

CREATE TABLE IF NOT EXISTS publication (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date_publication DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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

CREATE INDEX idx_publication_id ON person (publication_id);
CREATE INDEX idx_nom ON person (nom);
CREATE INDEX idx_prenom ON person (prenom);
EOF
)
  docker exec "$MYSQL_CONTAINER_NAME" mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" -e "$SQL_COMMANDS"
  local exit_code=$?
  if [ $exit_code -ne 0 ]; then
    log "Erreur lors de l'exécution des commandes SQL embarquées. Code de sortie : $exit_code"
  else
    log "Base de données et tables créées (via SQL embarqué)."
  fi
}

start_docker_compose() {
  log "Démarrage de Docker Compose..."
  docker-compose -f "$COMPOSE_FILE" up -d
  log "Docker Compose démarré."
}

start_node_app() {
  log "Démarrage de l'application Node.js avec pm2..."
  # Start the Node.js application using pm2
  pm2 start "$NODE_SCRIPT" --name "$NODE_APP_NAME"
  log "Application Node.js démarrée avec pm2 (nom: $NODE_APP_NAME)."
}

log "Démarrage de la configuration de l'application..."

# Installation de pm2 si nécessaire
install_pm2

# Démarrage Docker Compose
start_docker_compose

# On vérifie que le container BDD tourne
if check_container_status; then
  log "Le container de la base de données est en cours d'exécution."
  # Création des tables si nécessaires
  create_database_and_tables
else
  log "Erreur : Le démarrage du container de la base de données a échoué."
  exit 1
fi

# Démarrage de node.js avec pm2
start_node_app

log "Configuration de l'application terminée."