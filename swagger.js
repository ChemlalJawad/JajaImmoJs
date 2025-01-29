export default {
  openapi: "3.0.0",
  info: {
    title: "API de Scraping Immobilier",
    version: "1.0.0",
    description: "Documentation pour l'API de scraping des annonces immobilières depuis Immoweb et Zimmo."
  },
  servers: [
    {
      url: "http://localhost:8080",
      description: "Serveur local"
    }
  ],
  paths: {
    "/api/immo": {
      get: {
        summary: "Récupérer les annonces de location depuis Immoweb",
        description: "Retourne une liste de 30 annonces de location depuis Immoweb.",
        responses: {
          "200": {
            description: "Liste des annonces",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      price: { type: "integer" },
                      bedrooms: { type: "integer" },
                      surface: { type: "integer" },
                      commune: {
                        type: "object",
                        properties: {
                          postalCode: { type: "string" },
                          city: { type: "string" }
                        }
                      },
                      link: { type: "string" },
                      imageUrl: { type: "string" },
                      createdAt: { type: "string" }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/zimmo": {
      get: {
        summary: "Récupérer les annonces de location depuis Zimmo",
        description: "Retourne une liste de 30 annonces de location depuis Zimmo.",
        responses: {
          "200": {
            description: "Liste des annonces",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      price: { type: "integer" },
                      bedrooms: { type: "integer" },
                      surface: { type: "integer" },
                      commune: {
                        type: "object",
                        properties: {
                          postalCode: { type: "string" },
                          city: { type: "string" }
                        }
                      },
                      link: { type: "string" },
                      imageUrl: { type: "string" },
                      createdAt: { type: "string" }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
