import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Scraping Immobilier',
      version: '1.0.0',
      description: 'API permettant de récupérer des annonces immobilières via scraping',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Serveur de développement',
      },
    ],
  },
  apis: ['./server.js'], // fichiers contenant les annotations
};

export const specs = swaggerJsdoc(options);