import express from 'express';
import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { specs } from './swagger.js';
import open from 'open';
import DOMPurify from 'isomorphic-dompurify';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

function formatHtml(html) {
  if (!html) return '';
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
}

function extractTextContent(element, selector) {
  return element?.querySelector(selector)?.textContent?.trim() || '';
}

function extractAttribute(element, selector, attribute) {
  return element?.querySelector(selector)?.getAttribute(attribute) || '';
}

function extractImageUrl(element) {
  const mediaContainer = element.querySelector('.card__media-container');
  if (!mediaContainer) return '';
  
  const style = mediaContainer.getAttribute('style');
  if (!style) return '';
  
  const match = style.match(/background-image:\s*url\((.*?)\)/);
  return match ? match[1].replace(/['"]/g, '') : '';
}

function extractPrice(element, title) {
  // D'abord essayer d'extraire du titre
  if (title) {
    const priceMatch = title.match(/\((\d+)\s*€\)/);
    if (priceMatch) {
      return parseInt(priceMatch[1]);
    }
  }

  // Sinon, chercher dans l'élément de prix
  const priceElement = element.querySelector('.card__price');
  if (priceElement) {
    const priceText = priceElement.textContent.trim();
    const priceMatch = priceText.match(/\d+/);
    return priceMatch ? parseInt(priceMatch[0]) : null;
  }

  return null;
}

function logElementDetails(element) {
  console.log('\n=== Détails de l\'élément ===');
  console.log('ID:', element.id);
  console.log('Classes:', element.className);
  console.log('Attributs:', Array.from(element.attributes).map(attr => `${attr.name}="${attr.value}"`).join(', '));
  
  const mediaContainer = element.querySelector('.card__media-container');
  if (mediaContainer) {
    console.log('\n=== Détails du conteneur média ===');
    console.log('Style:', mediaContainer.getAttribute('style'));
    console.log('URL extraite:', extractImageUrl(element));
  }
  
  console.log('\n=== Données spécifiques ===');
  const titleLink = element.querySelector('.card__title-link');
  const priceElement = element.querySelector('.card__price');
  console.log('Titre (aria-label):', titleLink?.getAttribute('aria-label'));
  console.log('Lien (href):', titleLink?.getAttribute('href'));
  console.log('Prix:', priceElement?.textContent?.trim());
  console.log('=====================================\n');
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get("/api/immo", async (req, res) => {
  const url = "https://www.immoweb.be/fr/recherche/maison-et-appartement/a-louer/bruxelles/arrondissement?countries=BE&maxPrice=1200&maxConstructionYear=2025&minBedroomCount=1&page=1&orderBy=newest";

  console.log("Chargement de la page...");

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Erreur de chargement : ${response.statusText}`);
    }

    const html = await response.text();
    const cleanHtml = DOMPurify.sanitize(html);
    
    // Log du HTML nettoyé
    console.log('\n=== HTML nettoyé ===');
    console.log(cleanHtml);
    console.log('===================\n');
    
    const dom = new JSDOM(cleanHtml);
    const document = dom.window.document;
    
    const ads = [];
    const adElements = document.querySelectorAll("article");
    console.log(`Nombre d'articles trouvés : ${adElements.length}`);

    for (let i = 0; i < adElements.length; i++) {
      const ad = adElements[i];
      try {
        console.log(`\n=== Article ${i + 1}/${adElements.length} ===`);
        
        // Log tous les détails de l'élément
        logElementDetails(ad);

        const id = ad.id?.replace('classifieds_recommendation_result_list_', '') || '';
        const titleLink = ad.querySelector('.card__title-link');
        const title = titleLink?.getAttribute('aria-label') || '';
        const link = titleLink?.getAttribute('href') || '';
        const surface = ad.querySelector('p')?.textContent?.match(/\d+/)?.[0] || '';
        const location = ad.querySelectorAll('p')[2]?.textContent?.trim() || '';
        const price = extractPrice(ad, title);
        const imageUrl = extractImageUrl(ad);

        const property = {
          id,
          title: title.replace(/\s+/g, ' ').trim(),
          price,
          surface: surface ? parseInt(surface) : null,
          location: location.trim(),
          imageUrl,
          link,
          createdAt: new Date().toISOString()
        };

        ads.push(property);
        console.log('\nAnnonce extraite avec succès:', property);
      } catch (err) {
        console.error(`\nErreur lors de l'extraction de l'annonce ${i + 1}:`, err.message);
        console.error(err.stack);
      }
    }

    console.log(`\nScraping terminé : ${ads.length} annonces récupérées sur ${adElements.length} articles trouvés`);
    res.json({ success: true, data: ads });
  } catch (err) {
    console.error("Erreur principale :", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});
app.get("/api/buy", async (req, res) => {
  const url = "https://www.immoweb.be/fr/recherche/maison-et-appartement/a-vendre/bruxelles/arrondissement?countries=BE&maxPrice=350000&maxConstructionYear=2025&priceType=SALE_PRICE&page=1&orderBy=newest";

  console.log("Chargement de la page...");

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Erreur de chargement : ${response.statusText}`);
    }

    const html = await response.text();
    const cleanHtml = DOMPurify.sanitize(html);
    
    // Log du HTML nettoyé
    console.log('\n=== HTML nettoyé ===');
    console.log(cleanHtml);
    console.log('===================\n');
    
    const dom = new JSDOM(cleanHtml);
    const document = dom.window.document;
    
    const ads = [];
    const adElements = document.querySelectorAll("article");
    console.log(`Nombre d'articles trouvés : ${adElements.length}`);

    for (let i = 0; i < adElements.length; i++) {
      const ad = adElements[i];
      try {
        console.log(`\n=== Article ${i + 1}/${adElements.length} ===`);
        
        // Log tous les détails de l'élément
        logElementDetails(ad);

        const id = ad.id?.replace('classifieds_recommendation_result_list_', '') || '';
        const titleLink = ad.querySelector('.card__title-link');
        const title = titleLink?.getAttribute('aria-label') || '';
        const link = titleLink?.getAttribute('href') || '';
        const surface = ad.querySelector('p')?.textContent?.match(/\d+/)?.[0] || '';
        const location = ad.querySelectorAll('p')[2]?.textContent?.trim() || '';
        const price = extractPrice(ad, title);
        const imageUrl = extractImageUrl(ad);

        const property = {
          id,
          title: title.replace(/\s+/g, ' ').trim(),
          price,
          surface: surface ? parseInt(surface) : null,
          location: location.trim(),
          imageUrl,
          link,
          createdAt: new Date().toISOString()
        };

        ads.push(property);
        console.log('\nAnnonce extraite avec succès:', property);
      } catch (err) {
        console.error(`\nErreur lors de l'extraction de l'annonce ${i + 1}:`, err.message);
        console.error(err.stack);
      }
    }

    console.log(`\nScraping terminé : ${ads.length} annonces récupérées sur ${adElements.length} articles trouvés`);
    res.json({ success: true, data: ads });
  } catch (err) {
    console.error("Erreur principale :", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Une erreur est survenue',
    error: err.message 
  });
});

app.listen(PORT, async () => {
  console.log(`Serveur API démarré sur http://localhost:${PORT}`);
  console.log(`Documentation Swagger disponible sur http://localhost:${PORT}/api-docs`);
  
  try {
    await open(`http://localhost:${PORT}/api-docs`);
  } catch (err) {
    console.error('Impossible d\'ouvrir automatiquement le navigateur:', err);
  }
});