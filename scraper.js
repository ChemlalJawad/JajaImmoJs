import puppeteer from 'puppeteer';

export async function runScraper(type) {
  const urls = {
    rent: "https://www.immoweb.be/fr/recherche/maison-et-appartement/a-louer/bruxelles/arrondissement?countries=BE&maxPrice=1250&maxConstructionYear=2025&minBedroomCount=1&propertySubtypes=PENTHOUSE,TRIPLEX,GROUND_FLOOR,TOWN_HOUSE,APARTMENT_BLOCK,COUNTRY_COTTAGE,CASTLE,CHALET,FARMHOUSE,EXCEPTIONAL_PROPERTY,MIXED_USE_BUILDING,MANSION,PAVILION,DUPLEX,LOFT,SERVICE_FLAT,MANOR_HOUSE,VILLA,OTHER_PROPERTY&page=1&orderBy=newest",
    buy: "https://www.immoweb.be/fr/recherche/maison-et-appartement/a-vendre/bruxelles/arrondissement?countries=BE&maxPrice=350000&maxConstructionYear=2025&priceType=SALE_PRICE&page=1&orderBy=newest"
  };

  const url = urls[type];
  if (!url) {
    throw new Error('Type de scraping non supporté. Utilisez "rent" ou "buy".');
  }

  console.log(`Chargement de la page pour ${type}...`);

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: puppeteer.executablePath(), // Utilise le Chromium de Puppeteer
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-accelerated-2d-canvas',
      '--window-size=1280x800'
    ],
    defaultViewport: null
  });
 
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36');
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  // Log HTML content of the page
  const pageContent = await page.content();
  console.log("Contenu de la page chargée:", pageContent);

  const ads = await page.evaluate(() => {
    const adElements = document.querySelectorAll('article');
    const ads = [];

    adElements.forEach(ad => {
      if (ads.length >= 60) return;

      const id = ad.id?.replace('classified_', '') || '';
      const titleLink = ad.querySelector('.card__title-link');
      const title = titleLink?.getAttribute('aria-label') || '';
      const link = titleLink?.getAttribute('href') || '';

      const priceElement = ad.querySelector('.card--result__price span.sr-only');
      const priceText = priceElement?.textContent?.trim() || '';
      const priceMatch = priceText.match(/(\d+[\s]?\d*)€/g);
      const price = priceMatch ? parseInt(priceMatch[0].replace(/\D/g, '')) : null;
      const charges = priceMatch && priceMatch.length > 1 ? parseInt(priceMatch[1].replace(/\D/g, '')) : null;

      const bedroomElement = ad.querySelector('.card__information--property .abbreviation span[aria-hidden="true"]');
      const bedrooms = bedroomElement?.textContent?.match(/\d+/)?.[0] || '';

      const surfaceElement = ad.querySelector('.card__information--property');
      const surfaceMatch = surfaceElement?.textContent.match(/(?<=·\s*)\d+/);
      const surface = surfaceMatch ? parseInt(surfaceMatch[0]) : null;

      const localityElement = ad.querySelector('.card__information.card--results__information--locality');
      const localityText = localityElement?.textContent?.trim() || '';
      let postalCode = '', city = '';
      if (localityText) {
        const localityParts = localityText.split(' ');
        postalCode = localityParts.shift() || '';
        city = localityParts.join(' ') || '';
      }

      const imageElement = ad.querySelector('.card__media-picture');
      const imageUrl = imageElement?.getAttribute('src') || '';

      const descriptionElement = ad.querySelector('.card__description');
      const description = descriptionElement?.textContent?.trim() || '';

      const habitatType = title.split(' à ')[0] || '';

      ads.push({
        id,
        title: title.replace(/\s+/g, ' ').trim(),
        price,
        charges,
        bedrooms: bedrooms ? parseInt(bedrooms) : null,
        surface,
        commune: {
          postalCode,
          city
        },
        habitatType,
        link,
        imageUrl,
        description,
        createdAt: new Date().toISOString()
      });
    });

    return ads;
  });

  console.log(`Scraping terminé : ${ads.length} annonces récupérées.`);
  await browser.close();
  return ads;
}
