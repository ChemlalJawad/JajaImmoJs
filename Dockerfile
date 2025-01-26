# Étape 1 : Utiliser une image Node.js légère
FROM node:16-alpine

# Étape 2 : Définir le répertoire de travail dans le conteneur
WORKDIR /usr/src/app

# Étape 3 : Copier les fichiers nécessaires
COPY package*.json ./

# Étape 4 : Installer les dépendances
RUN npm install

# Étape 5 : Copier tout le projet dans le conteneur
COPY . .

# Étape 6 : Exposer le port 3000
EXPOSE 3000

# Étape 7 : Démarrer l'application
CMD ["npm", "start"]
