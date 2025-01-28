export const specs = {
  openapi: '3.0.0',
  info: {
    title: 'API Immoweb Scraper',
    version: '1.0.0',
    description: 'API pour extraire des annonces immobilières depuis Immoweb',
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Serveur local',
    },
  ],
  paths: {
    '/api/health': {
      get: {
        summary: 'Vérifier l\'état de l\'API',
        responses: {
          200: {
            description: 'API fonctionnelle',
          },
        },
      },
    },
    '/api/scrape': {
      get: {
        summary: 'Extraire des annonces immobilières',
        parameters: [
          {
            name: 'type',
            in: 'query',
            required: true,
            schema: {
              type: 'string',
              enum: ['rent', 'buy'],
            },
            description: 'Type d\'annonces à extraire (location ou vente)',
          },
        ],
        responses: {
          200: {
            description: 'Liste des annonces extraites',
          },
          400: {
            description: 'Type de scraping invalide',
          },
          500: {
            description: 'Erreur lors du scraping',
          },
        },
      },
    },
  },
};