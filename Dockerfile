# Étape 1 : Utiliser une image Node.js officielle avec Debian
FROM node:18-slim

# Étape 2 : Installer les dépendances pour Puppeteer/Chromium
RUN apt-get update && apt-get install -y \
    wget \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libglib2.0-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    --no-install-recommends && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Étape 3 : Installer les dépendances du projet
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --omit=dev

# Étape 4 : Copier le code source
COPY . .

# Étape 5 : Configurer la variable d'environnement pour Puppeteer
ENV PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome

# Étape 6 : Exposer le port requis par Cloud Run
EXPOSE 8080

# Étape 7 : Lancer le serveur Node.js
CMD ["node", "server.js"]
