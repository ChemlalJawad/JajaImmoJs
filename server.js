import express from 'express';
import fetch from 'node-fetch';
import { DOMParser } from 'xmldom';
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
  return element?.getElementsByTagName(selector)?.[0]?.textContent?.trim() || '';
}

function extractAttribute(element, selector, attribute) {
  return element?.getElementsByTagName(selector)?.[0]?.getAttribute(attribute) || '';
}

function findElementByClass(element, className) {
  const elements = element.getElementsByTagName('*');
  for (let i = 0; i < elements.length; i++) {
    const classAttr = elements[i].getAttribute('class');
    if (classAttr && classAttr.includes(className)) {
      return elements[i];
    }
  }
  return null;
}

app.get("/api/immo", async (req, res) => {
  const url = "https://www.immoweb.be/en/search/house-and-apartment/for-rent?countries=BE&maxPrice=1100&minBedroomCount=1&districts=CHARLEROI,NAMUR,BRUSSELS&priceType=MONTHLY_RENTAL_PRICE&minPrice=800&page=1&orderBy=newest";

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
    
    const parser = new DOMParser({
      errorHandler: { warning: () => {}, error: () => {}, fatalError: () => {} }
    });

    const doc = parser.parseFromString(cleanHtml, "text/html");
    const ads = [];
    const adElements = doc.getElementsByTagName("article");
    console.log(`Nombre d'articles trouvés : ${adElements.length}`);

    for (let i = 0; i < adElements.length; i++) {
      const ad = adElements[i];
      try {
        console.log(`\n=== Article ${i + 1}/${adElements.length} ===`);
        console.log('HTML brut:', ad.toString().trim().replace(/\s+/g, ' '));

        // Extraction des données de base
        const id = ad.getAttribute('id')?.replace('classifieds_recommendation_result_list_', '') || '';
        const title = extractTextContent(ad, 'h3');
        const link = extractAttribute(ad.getElementsByTagName('h3')[0], 'a', 'href') || '';
        const surface = extractTextContent(ad, 'p')?.match(/\d+/)?.[0] || '';
        const location = ad.getElementsByTagName('p')[2]?.textContent?.trim() || '';
        
        // Extraction de l'image avec la nouvelle méthode
        const mediaContainer = findElementByClass(ad, 'card__media-container');
        const backgroundStyle = mediaContainer?.getAttribute("style") || '';
        const imageUrl = backgroundStyle.match(/url\((.*?)\)/)?.[1] || '';
        
        // Extraction du logo de l'agence
        const agencyLogo = ad.getElementsByTagName('img')[0]?.getAttribute('src') || '';
        const agencyName = ad.getElementsByTagName('img')[0]?.getAttribute('alt') || '';

        const property = {
          id,
          title: title.replace(/\s+/g, ' ').trim(),
          surface: surface ? parseInt(surface) : null,
          location: location.trim(),
          media: {
            mainImage: imageUrl
          },
          agency: {
            name: agencyName,
            logo: agencyLogo
          },
          link,
          createdAt: new Date().toISOString()
        };

        ads.push(property);
        console.log('\nAnnonce extraite avec succès:', property);
        console.log('=====================================');
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