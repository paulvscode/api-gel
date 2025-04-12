const express = require('express');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
    host: 'localhost',
    user: 'your_app_user',
    password: 'your_app_password',
    database: 'gels_avoirs_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function insertPublicationData(publicationData) {
    let connection;
    try {
        connection = await pool.getConnection();

        const [publicationResult] = await connection.execute(
            'INSERT INTO publication (date_publication) VALUES (?)',
            [publicationData.DatePublication]
        );
        const publicationId = publicationResult.insertId;

        for (const personDetail of publicationData.PublicationDetail) {
            const prenomDetail = personDetail.RegistreDetail.find(item => item.TypeChamp === 'PRENOM');
            const prenomValue = prenomDetail && prenomDetail.Valeur && prenomDetail.Valeur[0] && prenomDetail.Valeur[0].Prenom;
            const prenom = prenomValue || null;

            const sexeDetail = personDetail.RegistreDetail.find(item => item.TypeChamp === 'SEXE');
            const sexeValue = sexeDetail && sexeDetail.Valeur && sexeDetail.Valeur[0] && sexeDetail.Valeur[0].Sexe;
            const sexe = sexeValue || null;

            const dateNaissanceObj = personDetail.RegistreDetail.find(item => item.TypeChamp === 'DATE_DE_NAISSANCE')?.Valeur?.[0];
            const dateNaissance = dateNaissanceObj ? `${dateNaissanceObj.Annee}-${String(dateNaissanceObj.Mois).padStart(2, '0')}-${String(dateNaissanceObj.Jour).padStart(2, '0')}` : null;

            const lieuNaissanceDetail = personDetail.RegistreDetail.find(item => item.TypeChamp === 'LIEU_DE_NAISSANCE');
            const lieuNaissanceValue = lieuNaissanceDetail && lieuNaissanceDetail.Valeur && lieuNaissanceDetail.Valeur[0] && lieuNaissanceDetail.Valeur[0].Lieu;
            const lieuNaissance = lieuNaissanceValue || null;
            const paysNaissanceValue = lieuNaissanceDetail && lieuNaissanceDetail.Valeur && lieuNaissanceDetail.Valeur[0] && lieuNaissanceDetail.Valeur[0].Pays;
            const paysNaissance = paysNaissanceValue || null;

            const titreDetail = personDetail.RegistreDetail.find(item => item.TypeChamp === 'TITRE');
            const titreValue = titreDetail && titreDetail.Valeur && titreDetail.Valeur[0] && titreDetail.Valeur[0].Titre;
            const titre = titreValue || null;

            const motifsDetail = personDetail.RegistreDetail.find(item => item.TypeChamp === 'MOTIFS');
            const motifsValue = motifsDetail && motifsDetail.Valeur && motifsDetail.Valeur[0] && motifsDetail.Valeur[0].Motifs;
            const motifs = motifsValue || null;

            const fondementJuridiqueDetail = personDetail.RegistreDetail.find(item => item.TypeChamp === 'FONDEMENT_JURIDIQUE');
            const fondementJuridiqueLabelValue = fondementJuridiqueDetail && fondementJuridiqueDetail.Valeur && fondementJuridiqueDetail.Valeur[0] && fondementJuridiqueDetail.Valeur[0].FondementJuridiqueLabel;
            const fondementJuridiqueLabel = fondementJuridiqueLabelValue || null;

            await connection.execute(
                'INSERT INTO person (publication_id, id_registre, nature, nom, prenom, sexe, date_de_naissance, lieu_de_naissance, pays_naissance, titre, motifs, fondement_juridique_label) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    publicationId,
                    personDetail.IdRegistre,
                    personDetail.Nature,
                    personDetail.Nom,
                    prenom,
                    sexe,
                    dateNaissance,
                    lieuNaissance,
                    paysNaissance,
                    titre,
                    motifs,
                    fondementJuridiqueLabel
                ]
            );
        }
        console.log('Data inserted into the database.');
        return true;
    } catch (error) {
        console.error('Error inserting data:', error);
        return false;
    } finally {
        if (connection) connection.release();
    }
}

app.get('/dernier-fichier-json', async (req, res) => {
    const apiUrl = 'https://gels-avoirs.dgtresor.gouv.fr/ApiPublic/api/v1/publication/derniere-publication-fichier-json';

    try {
        const response = await fetch(apiUrl);
        const jsonData = await response.json();

        if (jsonData && jsonData.Publications) {
            const insertionResult = await insertPublicationData(jsonData.Publications);
            if (insertionResult) {
                res.json({ message: 'JSON data retrieved and stored in the database.' });
            } else {
                res.status(500).json({ error: 'Failed to store JSON data in the database.' });
            }
        } else {
            res.status(404).json({ error: 'No Publications data found in the JSON response.' });
        }

    } catch (err) {
        console.error('Erreur récupération fichier JSON :', err);
        res.status(500).json({ error: 'Erreur serveur proxy (fichier JSON)' });
    }
});

app.get('/data', async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.execute(
            'SELECT nom, prenom, nature, date_de_naissance, motifs, fondement_juridique_label FROM person'
        );
        res.json(rows);
    } catch (error) {
        console.error('Error fetching person data:', error);
        res.status(500).json({ error: 'Failed to fetch data from the database.' });
    } finally {
        if (connection) connection.release();
    }
});

app.get('/dernier-gel', async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.execute(
            'SELECT date_publication FROM publication ORDER BY id DESC LIMIT 1'
        );
        if (rows.length > 0) {
            res.json(rows[0].date_publication); 
        } else {
            res.status(404).json({ error: 'Pas de publications.' });
        }
    } catch (error) {
        console.error('Erreur dans la récupération de la dernière publication', error);
        res.status(500).json({ error: 'Erreur 500.' });
    } finally {
        if (connection) connection.release();
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Proxy lancé sur http://0.0.0.0:${PORT}`);
});