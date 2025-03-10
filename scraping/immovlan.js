import puppeteer from 'puppeteer';

export async function runImmoVlanScraper(type) {
  const urls = {
    rent: "https://immovlan.be/fr/immobilier?transactiontypes=a-louer,en-colocation&municipals=bruxelles,charleroi&propertytypes=maison,appartement&maxprice=1300&minbedrooms=1&maxbedrooms=2&noindex=1",
    buy: "https://immovlan.be/fr/immobilier?transactiontypes=a-vendre,en-vente-publique&propertytypes=maison,appartement&municipals=bruxelles&maxprice=400000&noindex=1"
    };

  const url = urls[type];
    if (!url) {
      throw new Error('Type de scraping non supporté. Utilisez "rent" ou "buy".');
    }

  console.log(`Chargement de la page ImmoVlan...`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36');
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

  const ads = await page.evaluate(() => {
    const adElements = document.querySelectorAll('article.list-view-item');
    const ads = [];

    adElements.forEach(ad => {
      const linkElement = ad.querySelector('a');
      const linkPath = linkElement?.getAttribute('href') || '';
      const link = linkPath.startsWith('https') ? linkPath : `https://immovlan.be${linkPath}`;

      const idMatch = link.match(/\/([A-Z0-9]+)$/i);
      const id = idMatch ? idMatch[1] : '';

      const titleElement = ad.querySelector('h2.card-title a');
      const title = titleElement?.textContent.trim() || '';

      const priceElement = ad.querySelector('.list-item-price');
      const priceText = priceElement?.textContent.trim().replace(/[^0-9]/g, '') || '';
      const price = priceText ? parseInt(priceText) : null;

      const postalCodeElement = ad.querySelector('p[itemprop="address"] span[itemprop="postalCode"]');
      const postalCode = postalCodeElement?.textContent.trim() || '';

      const cityElement = ad.querySelector('p[itemprop="address"] span[itemprop="addressLocality"]');
      const city = cityElement?.textContent.trim() || '';

      const surfaceElements = ad.querySelectorAll('.property-highlight strong');
      const surfaceText = surfaceElements.length > 1 ? surfaceElements[1].textContent.trim() : '';
      const surface = surfaceText.match(/\d+/)?.[0] || '';

      const bedroomsElement = ad.querySelector('meta[itemprop="numberOfBedrooms"]');
      const bedrooms = bedroomsElement?.getAttribute('content') || '';

      const imageElement = ad.querySelector('.media-pic img');
      const imageUrl = imageElement?.getAttribute('data-src') || imageElement?.getAttribute('src') || '';

      ads.push({
        id,
        title,
        price,
        bedrooms: bedrooms ? parseInt(bedrooms) : null,
        surface: surface ? parseInt(surface) : null,
        commune: {
          postalCode,
          city
        },
        link,
        imageUrl,
        createdAt: new Date().toISOString()
      });
    });
    return ads;
  });

  console.log(`Scraping terminé : ${ads.length} annonces récupérées.`);
  await browser.close();
  return ads;
}
