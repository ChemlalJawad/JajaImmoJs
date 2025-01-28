import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { specs } from './swagger.js';
import open from 'open';
import { runScraper } from './scraper.js'; // Module de scraping externe

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Route de santé
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Route générique pour le scraping
app.get('/api/scrape', async (req, res) => {
  const { type } = req.query;

  if (!type || !['rent', 'buy'].includes(type)) {
    return res.status(400).json({ success: false, message: 'Type de scraping invalide. Utilisez "rent" ou "buy".' });
  }

  try {
    const data = await runScraper(type);
    res.json({ success: true, data });
  } catch (err) {
    console.error('Erreur lors du scraping:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/immo', async (req, res) => {
  try {
    const ads = await runScraper('rent');
    res.json(ads);
  } catch (error) {
    console.error('Erreur lors du scraping:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Une erreur est survenue',
    error: err.message 
  });
});

// Démarrage du serveur
app.listen(PORT, async () => {
  console.log(`Serveur API démarré sur http://localhost:${PORT}`);
  console.log(`Documentation Swagger disponible sur http://localhost:${PORT}/api-docs`);
  
  try {
    await open(`http://localhost:${PORT}/api-docs`);
  } catch (err) {
    console.error('Impossible d\'ouvrir automatiquement le navigateur:', err);
  }
});
