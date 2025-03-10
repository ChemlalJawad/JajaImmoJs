import express from 'express';
import NodeCache from 'node-cache';
import { runScraper as runImmoweb } from './scraping/immoweb.js';
import { runZimmoScraper as runZimmo } from './scraping/zimmo.js';
import { runImmoVlanScraper as runImmoVlan } from './scraping/immovlan.js';

const app = express();
const PORT = 8080;
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 }); // Cache pendant 5 minutes

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Fonction pour exécuter les scrapers de manière dynamique
async function scrapeAllSources(type) {
  console.log(`Lancement du scraping pour ${type}...`);

  // Exécute tous les scrapers en parallèle
  const [immoweb, zimmo, immovlan] = await Promise.all([
    runImmoweb(type),
    runZimmo(type),
    runImmoVlan(type),
  ]);

  // Fusionner les résultats et limiter à 30 annonces
  return [...immoweb, ...zimmo, ...immovlan];
}

// Endpoint générique : /api/all/rent ou /api/all/buy
app.get('/api/:type', async (req, res) => {
  const type = req.params.type;
  if (!['rent'].includes(type)) {
    return res.status(400).json({ error: "Type invalide. Utilisez 'rent' ou 'buy'." });
  }

  // Vérifier si les données sont en cache
  const cachedData = cache.get(`all_${type}`);
  if (cachedData) {
    console.log(`Données servies depuis le cache pour ${type}.`);
    return res.json(cachedData);
  }

  console.log(`Cache vide, exécution du scraping pour ${type}...`);
  try {
    const ads = await scrapeAllSources(type);
    cache.set(`all_${type}`, ads); // Stocker dans le cache
    res.json(ads);
  } catch (error) {
    console.error(`Erreur lors du scraping pour ${type}:`, error);
    res.status(500).json({ error: error.message || 'Erreur interne du serveur' });
  }
});

// Rafraîchir le cache automatiquement toutes les 5 minutes
setInterval(async () => {
  console.log('Mise à jour automatique du cache...');
  await scrapeAllSources('rent').then(data => cache.set('all_rent', data));
}, 300000);

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
  scrapeAllSources('rent').then(data => cache.set('all_rent', data));
});
