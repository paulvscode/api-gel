const express = require('express');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());

app.get('/dernier-gel', async (req, res) => {
  const apiUrl = 'https://gels-avoirs.dgtresor.gouv.fr/ApiPublic/api/v1/publication/derniere-publication-date';

  try {
    const response = await fetch(apiUrl);
    const data = await response.text();

    res.json(data);
  } catch (err) {
    console.error('Erreur lors de la récupération des données :', err);
    res.status(500).json({ error: 'Erreur serveur proxy' });
  }
});

app.get('/dernier-fichier-json', async (req, res) => {
    const apiUrl = 'https://gels-avoirs.dgtresor.gouv.fr/ApiPublic/api/v1/publication/derniere-publication-fichier-json';
  
    try {
      const response = await fetch(apiUrl);
      const json = await response.json(); 
      res.json(json);
    } catch (err) {
      console.error('Erreur récupération fichier JSON :', err);
      res.status(500).json({ error: 'Erreur serveur proxy (fichier JSON)' });
    }
  });

app.listen(PORT, () => {
  console.log(`Proxy lancé sur http://localhost:${PORT}/dernier-gel`);
});
