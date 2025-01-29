import puppeteer from 'puppeteer';

export async function runImmoAbitaScraper(type) {
    const urls = {
    rent: "https://www.immoabita.be/maison-a-louer-woluwe-saint-lambert/",
    buy: "https://www.immoabita.be/maison-a-vendre-woluwe-saint-lambert/"
  };

  const url = urls[type];
  if (!url) {
    throw new Error('Type de scraping non supporté. Utilisez "rent" ou "buy".');
  }

  console.log(`Chargement de la page pour ${type}...`);
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36');
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

  const ads = await page.evaluate(() => {
    const adElements = document.querySelectorAll('.list-estate-card__item');
    const ads = [];

    adElements.forEach(ad => {
      const linkElement = ad.querySelector('.card-estate');
      const link = linkElement?.getAttribute('href') || '';

      const titleElement = ad.querySelector('.card-estate__type');
      const title = titleElement?.textContent.trim() || '';

      const priceElement = ad.querySelector('.card-estate__price');
      const priceText = priceElement?.textContent.trim().replace(/[^0-9]/g, '') || '';
      const price = priceText ? parseInt(priceText) : null;

      const localityElement = ad.querySelector('.card-estate__town');
      const localityText = localityElement?.textContent.trim() || '';
      let postalCode = '', city = '';
      if (localityText) {
        const localityParts = localityText.split(' ');
        postalCode = localityParts.shift() || '';
        city = localityParts.join(' ') || '';
      }

      const surfaceElement = ad.querySelector('.estate-facts__item i.fa-expand-arrows');
      const surface = surfaceElement?.parentNode?.textContent.match(/\d+/)?.[0] || '';
      
      const bedroomsElement = ad.querySelector('.estate-facts__item i.fa-bed');
      const bedrooms = bedroomsElement?.parentNode?.textContent.match(/\d+/)?.[0] || '';

      const imageElement = ad.querySelector('.slider-mini-container img');
      const imageUrl = imageElement?.getAttribute('src') || '';

      ads.push({
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