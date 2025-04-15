# Gel des Avoirs - Application de Vérification des Données

## Description

This application provides a web interface to verify and display data related to asset freezes ("gel des avoirs"). It fetches data from a remote API, stores it in a local MySQL database, and presents it to the user. It also includes functionality to shut down the application and its associated Docker environment.

## Table of Contents

1. [Prerequisites](#1-prerequisites)  
2. [Installation and Setup](#2-installation-and-setup)  
3. [Starting the Application](#3-starting-the-application)  
4. [Accessing the Application](#4-accessing-the-application)  
5. [Stopping the Application](#5-stopping-the-application)  
6. [Application Components](#6-application-components)  
7. [API Endpoints](#7-api-endpoints-nodejs-backend)  
8. [Database Schema](#8-database-schema)  
9. [Configuration](#9-configuration)  
10. [Logging](#10-logging)  
11. [Error Handling](#11-error-handling)  
12. [Security Considerations](#12-security-considerations)

---

## 1. Prerequisites

Before you can run this application, you need to have the following installed:

- **Docker:** [https://www.docker.com/get-started](https://www.docker.com/get-started)  
- **Docker Compose:** Usually included with Docker Desktop  
- **Node.js and npm:** [https://nodejs.org/](https://nodejs.org/)

---

## 2. Installation and Setup

1. Clone the repository:

   ```bash
   git clone <repository_url>
   cd <application_directory>
   ```

2. Create a `.env` file (optional):

   ```env
   MYSQL_USER=your_app_user
   MYSQL_PASSWORD=your_app_password
   DATABASE_NAME=gels_avoirs_db
   ```

3. Install Node.js dependencies:

   ```bash
   npm install
   ```

4. Ensure a `docker-compose.yml` file exists at the project root.

5. Create the `public` directory and include frontend files:

   ```
   backend/
     ├─ index.js
     └─ public/
         ├─ app.html
         ├─ data.html
         ├─ 404.html
         └─ (images, CSS, etc.)
   ```

---

## 3. Starting the Application

Use the provided `start_app.sh` script:

```bash
chmod +x start_app.sh
./start_app.sh
```

This will:

- Start the Docker environment
- Set up the MySQL database and tables
- Launch the Node.js server using `pm2`

---

## 4. Accessing the Application

Navigate to:

```
http://localhost:3000/
```

You should see `app.html`, with a link to `data.html`.

---

## 5. Stopping the Application

### A. Stopping Node.js (via pm2)

```bash
pm2 stop my-gels-app      # To stop
pm2 delete my-gels-app    # To remove from pm2 list
```

### B. Stopping Docker

```bash
docker-compose down
```

### C. Via Web Interface

Click the **"Arrêter le Serveur"** button on the web interface. This triggers:

- `pm2 stop`
- `docker-compose down`
- Node.js process exit

---

## 6. Application Components

- **Backend:** Node.js/Express  
- **Database:** MySQL  
- **Frontend:** HTML/JavaScript  
- **Docker Compose:** Manages MySQL  
- **Script:** `start_app.sh` bootstraps everything  

---

## 7. API Endpoints (Node.js Backend)

| Endpoint                | Method | Description                                |
|------------------------|--------|--------------------------------------------|
| `/dernier-fichier-json`| GET    | Fetch latest JSON and store in DB          |
| `/data`                | GET    | Retrieve person data from DB               |
| `/dernier-gel`         | GET    | Get latest publication date                |
| `/bodacc`              | GET    | Get hardcoded BODACC data                  |
| `/shutdown`            | POST   | Shutdown server and Docker environment     |

---

## 8. Database Schema

### `publication` Table

| Column           | Type                  |
|------------------|-----------------------|
| `id`             | INT AUTO_INCREMENT PK |
| `date_publication`| DATETIME             |
| `created_at`     | TIMESTAMP             |

### `person` Table

| Column                  | Type              |
|--------------------------|-------------------|
| `id`                     | INT AUTO_INCREMENT PK |
| `publication_id`         | INT (FK to publication.id) |
| `id_registre`            | INT UNIQUE        |
| `nature`, `nom`, `prenom`| VARCHAR(255)      |
| `sexe`                   | VARCHAR(10)       |
| `date_de_naissance`, etc.| VARCHAR(255) / TEXT |
| `created_at`             | TIMESTAMP         |

**Indexes:** `publication_id`, `nom`, `prenom`

---

## 9. Configuration

Currently stored in `index.js`. For better practice:

- Use a `.env` file
- Use `dotenv` to load it
- Keep `API_BASE_URL` in the frontend JS

---

## 10. Logging

Uses:

```js
console.log()
console.error()
```

For production, consider a logging library (e.g., `winston`).

---

## 11. Error Handling

- API/database error catching
- Error messages shown in console and web
- `/shutdown` includes try-catch blocks for all steps

---

## 12. Security Considerations

- **Credentials:** Avoid hardcoding. Use env vars  
- **Shutdown Endpoint:** Protect with auth in production  
- **Sanitization:** Prevent SQL injection, validate inputs  
- **CORS:** Currently permissive. Restrict in prod