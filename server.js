import express from 'express';
import { runScraper } from './scraping/immoweb.js';
import { runZimmoScraper } from './scraping/zimmo.js';
import { runImmoAbitaScraper } from './scraping/agence/immoabita.js';
import swaggerUi from 'swagger-ui-express';
import * as swaggerDocument from './swagger.js';
import { runImmoVlanScraper } from './scraping/immovlan.js';

const app = express();
const PORT = 8080;

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // Autorise tous les domaines
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Documentation Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Endpoint pour récupérer les locations depuis Immoweb
app.get('/api/immo', async (req, res) => {
  try {
    console.log('Lancement du scraping des locations Immoweb...');
    const ads = await runScraper('rent');
    res.json(ads);
  } catch (error) {
    console.error('Erreur lors du scraping:', error);
    res.status(500).json({ error: error.message || 'Erreur interne du serveur' });
  }
});

app.get('/api/immobuy', async (req, res) => {
  try {
    console.log('Lancement du scraping des locations Immoweb...');
    const ads = await runScraper('buy');
    res.json(ads);
  } catch (error) {
    console.error('Erreur lors du scraping:', error);
    res.status(500).json({ error: error.message || 'Erreur interne du serveur' });
  }
});
// Endpoint pour récupérer les locations depuis Zimmo
app.get('/api/zimmo', async (req, res) => {
  try {
    console.log('Lancement du scraping des locations Zimmo...');
    const ads = await runZimmoScraper('rent');
    res.json(ads);
  } catch (error) {
    console.error('Erreur lors du scraping Zimmo:', error);
    res.status(500).json({ error: error.message || 'Erreur interne du serveur' });
  }
});

// Endpoint pour récupérer les locations depuis Zimmo
app.get('/api/zimmobuy', async (req, res) => {
  try {
    console.log('Lancement du scraping des locations Zimmo...');
    const ads = await runZimmoScraper('buy');
    res.json(ads);
  } catch (error) {
    console.error('Erreur lors du scraping Zimmo:', error);
    res.status(500).json({ error: error.message || 'Erreur interne du serveur' });
  }
});

// Endpoint pour récupérer les locations depuis Immoabita
app.get('/api/immoabita', async (req, res) => {
  try {
    console.log('Lancement du scraping des locations Immoabita...');
    const ads = await runImmoAbitaScraper('rent');
    res.json(ads);
  } catch (error) {
    console.error('Erreur lors du scraping Immoabita:', error);
    res.status(500).json({ error: error.message || 'Erreur interne du serveur' });
  }
});

// Endpoint pour récupérer les locations depuis Immoabita
app.get('/api/immoabitabuy', async (req, res) => {
  try {
    console.log('Lancement du scraping des ventes Immoabita...');
    const ads = await runImmoAbitaScraper('buy');
    res.json(ads);
  } catch (error) {
    console.error('Erreur lors du scraping Immoabita:', error);
    res.status(500).json({ error: error.message || 'Erreur interne du serveur' });
  }
});

// Endpoint pour récupérer les locations depuis Immovlan
app.get('/api/immovlan', async (req, res) => {
  try {
    console.log('Lancement du scraping des locations Immovlan...');
    const ads = await runImmoVlanScraper('rent');
    res.json(ads);
  } catch (error) {
    console.error('Erreur lors du scraping Immovlan:', error);
    res.status(500).json({ error: error.message || 'Erreur interne du serveur' });
  }
});

// Endpoint pour récupérer les locations depuis Immovlan
app.get('/api/immovlanbuy', async (req, res) => {
  try {
    console.log('Lancement du scraping des locations Immovlan...');
    const ads = await runImmoVlanScraper('buy');
    res.json(ads);
  } catch (error) {
    console.error('Erreur lors du scraping Immovlan:', error);
    res.status(500).json({ error: error.message || 'Erreur interne du serveur' });
  }
});

app.get('/api/rent', async (req, res) => {
  try {
    console.log('Lancement du scraping pour toutes les plateformes...');

    // Exécute les 3 scrapers en parallèle
    const [immovlan, immoweb, zimmo] = await Promise.all([
      runImmoVlanScraper('rent'),
      runScraper('rent'),
      runZimmoScraper('rent')
    ]);

    // Regroupe les résultats
    const allAds = [...immovlan, ...immoweb, ...zimmo];

    res.json(allAds);
  } catch (error) {
    console.error('Erreur lors du scraping global:', error);
    res.status(500).json({ error: error.message || 'Erreur interne du serveur' });
  }
});

app.get('/api/buy', async (req, res) => {
  try {
    console.log('Lancement du scraping pour toutes les plateformes...');

    // Exécute les 3 scrapers en parallèle
    const [immovlan, immoweb, zimmo] = await Promise.all([
      runImmoVlanScraper('buy'),
      runScraper('buy'),
      runZimmoScraper('buy')
    ]);

    // Regroupe les résultats
    const allAds = [...immovlan, ...immoweb, ...zimmo];

    res.json(allAds);
  } catch (error) {
    console.error('Erreur lors du scraping global:', error);
    res.status(500).json({ error: error.message || 'Erreur interne du serveur' });
  }
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
