import puppeteer from 'puppeteer';

export async function runZimmoScraper(type) {
  const urls = {
    rent: "https://www.zimmo.be/fr/rechercher/?search=eyJmaWx0ZXIiOnsic3RhdHVzIjp7ImluIjpbIlRPX1JFTlQiXX0sInBsYWNlSWQiOnsiaW4iOls3Ml19LCJjYXRlZ29yeSI6eyJpbiI6WyJIT1VTRSIsIkFQQVJUTUVOVCJdfSwicHJpY2UiOnsidW5rbm93biI6dHJ1ZSwicmFuZ2UiOnsibWF4IjoxMzAwfX0sImJlZHJvb21zIjp7InVua25vd24iOnRydWUsInJhbmdlIjp7Im1pbiI6MSwibWF4IjoyfX0sImhpZGUiOlsiTk9fQUREUkVTUyIsIk9MRCIsIlNUQUxFIl19LCJzb3J0aW5nIjpbeyJ0eXBlIjoiUkFOS0lOR19TQ09SRSIsIm9yZGVyIjoiREVTQyJ9XSwicGFnaW5nIjp7ImZyb20iOjAsInNpemUiOjIxfX0%3D&p=1#gallery",
    buy: "https://www.zimmo.be/fr/rechercher/?search=eyJmaWx0ZXIiOnsic3RhdHVzIjp7ImluIjpbIkZPUl9TQUxFIiwiVEFLRV9PVkVSIl19LCJoaWRlIjpbIk9MRCIsIlNUQUxFIl0sImNhdGVnb3J5Ijp7ImluIjpbIkhPVVNFIiwiQVBBUlRNRU5UIl19LCJwcmljZSI6eyJ1bmtub3duIjp0cnVlLCJyYW5nZSI6eyJtYXgiOjQwMDAwMH19LCJwbGFjZUlkIjp7ImluIjpbNzJdfX19#gallery"
  };

  const url = urls[type];
  if (!url) {
    throw new Error('Type de scraping non supporté.');
  }

  console.log(`Chargement de la page Zimmo pour ${type}...`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36');
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

  const ads = await page.evaluate(() => {
    const adElements = document.querySelectorAll('.property-item');
    const ads = [];

    adElements.forEach(ad => {
      const titleElement = ad.querySelector('.property-item_title a');
      const title = titleElement?.textContent.trim() || '';
      const link = `https://www.zimmo.be${titleElement?.getAttribute('href') || ''}`;

      const idMatch = link.match(/\/([A-Z0-9]+)\//);
      const id = idMatch ? idMatch[1] : '';

      const priceElement = ad.querySelector('.property-item_price');
      const priceText = priceElement?.textContent.trim().replace(/[^0-9]/g, '') || '';
      const price = priceText ? parseInt(priceText) : null;

      const bedroomsElement = ad.querySelector('.bedroom-icon');
      const bedrooms = bedroomsElement?.textContent.match(/\d+/)?.[0] || '';

      const surfaceElement = ad.querySelector('.opp-icon');
      const surface = surfaceElement?.textContent.match(/\d+/)?.[0] || '';

      const localityElement = ad.querySelector('.property-item_address');
      const localityText = localityElement?.textContent.trim() || '';
      let postalCode = '', city = '';
      if (localityText) {
        const localityParts = localityText.split('\n').map(part => part.trim());
        postalCode = localityParts.pop() || '';
        city = localityParts.join(' ') || '';
      }

      const imageElement = ad.querySelector('.property-item-slider img');
      const imageUrl = imageElement?.getAttribute('src') || '';

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
