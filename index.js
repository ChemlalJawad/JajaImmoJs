import express from 'express';
import cors from 'cors';
import { runScraper } from './scraper.js';
import * as dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { specs } from './swagger.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Vérifier l'état de l'API
 *     description: Retourne le statut de l'API et un timestamp
 *     responses:
 *       200:
 *         description: API fonctionnelle
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: OK
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

/**
 * @swagger
 * /api/properties:
 *   get:
 *     summary: Récupérer les annonces immobilières
 *     description: Retourne une liste d'annonces immobilières obtenues par scraping
 *     responses:
 *       200:
 *         description: Liste des propriétés
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: '1'
 *                   title:
 *                     type: string
 *                     example: 'Appartement lumineux à Bruxelles-Centre'
 *                   price:
 *                     type: number
 *                     example: 950
 *                   location:
 *                     type: string
 *                     example: 'Rue de la Loi, 1000 Bruxelles'
 *                   city:
 *                     type: string
 *                     example: 'brussels'
 *                   bedrooms:
 *                     type: number
 *                     example: 2
 *                   bathrooms:
 *                     type: number
 *                     example: 1
 *                   surface:
 *                     type: number
 *                     example: 75
 *                   type:
 *                     type: string
 *                     example: 'apartment'
 *                   imageUrl:
 *                     type: string
 *                     format: uri
 *                   link:
 *                     type: string
 *                     format: uri
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: 'Internal Server Error'
 *                 message:
 *                   type: string
 */
app.get('/api/properties', async (req, res) => {
  try {
    const properties = await runScraper();
    res.json(properties);
  } catch (error) {
    console.error('Error in /api/properties:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: error.message 
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something broke!',
    message: err.message 
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Swagger documentation available at http://localhost:${port}/api-docs`);
});