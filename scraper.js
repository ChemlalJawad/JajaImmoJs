import fetch from 'node-fetch';
import { DOMParser } from 'xmldom';
import * as dotenv from 'dotenv';

dotenv.config();

export async function runScraper() {
  try {
    console.log('Démarrage du scraper...');
    
    // En développement, retourner les données mockées
    if (process.env.NODE_ENV === 'development') {
      console.log('Mode développement : Utilisation des données mockées');
      return MOCK_PROPERTIES;
    }

    const url =
      "https://www.immoweb.be/en/search/house-and-apartment/for-rent?countries=BE&maxPrice=1100&minBedroomCount=1&districts=CHARLEROI,NAMUR,BRUSSELS&priceType=MONTHLY_RENTAL_PRICE&minPrice=800&page=1&orderBy=newest";

    console.log("Chargement de la page...");

    // Récupérer le contenu HTML de la page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Erreur de chargement : ${response.statusText}`);
    }

    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // Extraction des annonces
    const ads = [];
    const adElements = doc.getElementsByTagName("article");

    for (let i = 0; i < adElements.length; i++) {
      const ad = adElements[i];
      try {
        const title = getTextContent(ad.getElementsByTagName("a")[0]);
        const link = getAttribute(ad.getElementsByTagName("a")[0], "href");
        const details = getTextContent(ad.getElementsByTagName("p")[0]);
        const price = getTextContent(ad.getElementsByTagName("span")[0]);
        const location = getTextContent(ad.getElementsByTagName("p")[1]);
        const description = getTextContent(ad.getElementsByTagName("div")[0]);
        const imageUrl = getAttribute(ad.getElementsByTagName("img")[0], "src");

        if (title && link) {
          ads.push({
            id: generateExternalId(link),
            title,
            price: cleanData(price),
            location: cleanData(location),
            city: extractCity(location),
            bedrooms: extractBedrooms(details),
            bathrooms: extractBathrooms(details),
            surface: extractSurface(details),
            type: extractType(title),
            imageUrl,
            link,
            description: cleanData(description),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error("Erreur lors de l'extraction d'une annonce :", err.message);
      }
    }

    console.log(`Scraping terminé : ${ads.length} annonces récupérées.`);
    return ads;

  } catch (error) {
    console.error('Erreur de scraping:', error);
    throw new Error(`Erreur lors du scraping: ${error.message}`);
  }
}

// Fonctions utilitaires
function getTextContent(element) {
  return element?.textContent?.trim() || '';
}

function getAttribute(element, attr) {
  return element?.getAttribute(attr) || '';
}

function extractBedrooms(details) {
  const match = details?.match(/(\d+)\s*bdr/);
  return match ? parseInt(match[1], 10) : null;
}

function extractBathrooms(details) {
  const match = details?.match(/(\d+)\s*bath/);
  return match ? parseInt(match[1], 10) : null;
}

function extractSurface(details) {
  const match = details?.match(/(\d+)\s*m²/);
  return match ? parseFloat(match[1]) : null;
}

function cleanData(input) {
  return input
    ?.replace("â‚¬", "€")
    .replace("â€"", "-")
    .replace("â€œ", '"')
    .replace("â€", '"')
    .trim();
}

function generateExternalId(link) {
  return link.split("/").pop();
}

function extractCity(location) {
  const parts = location?.split(" ");
  return parts?.length > 1 ? parts[1] : location;
}

function extractType(title) {
  return title?.toLowerCase().includes("apartment") ? "Apartment" : "House";
}

// Mock data pour le développement
const MOCK_PROPERTIES = [
  {
    id: '1',
    title: 'Appartement lumineux à Bruxelles-Centre',
    price: 950,
    location: 'Rue de la Loi, 1000 Bruxelles',
    city: 'brussels',
    bedrooms: 2,
    bathrooms: 1,
    surface: 75,
    type: 'Apartment',
    imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80',
    link: 'https://www.immoweb.be/fr/annonce/appartement/a-louer/bruxelles/1000/10173263',
    description: 'Bel appartement rénové au cœur de Bruxelles',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Studio moderne près de la Grand Place',
    price: 750,
    location: 'Rue du Marché aux Herbes, 1000 Bruxelles',
    city: 'brussels',
    bedrooms: 1,
    bathrooms: 1,
    surface: 45,
    type: 'Apartment',
    imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80',
    link: 'https://www.immoweb.be/fr/annonce/studio/a-louer/bruxelles/1000/10173264',
    description: 'Studio entièrement équipé en plein centre',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];