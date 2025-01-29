import express from 'express';
import { runScraper } from './scraper.js';

const app = express();
const PORT = 8080;

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // Autorise tous les domaines
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Endpoint direct pour récupérer uniquement les locations
app.get('/api/immo', async (req, res) => {
  try {
    console.log('Lancement du scraping des locations...');
    const ads = await runScraper('rent');
    res.json(ads);
  } catch (error) {
    console.error('Erreur lors du scraping:', error);
    res.status(500).json({ error: error.message || 'Erreur interne du serveur' });
  }
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
