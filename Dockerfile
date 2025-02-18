# Étape 1 : Utiliser Node.js slim comme base
FROM node:18-slim

# Étape 2 : Installer les dépendances pour Chromium
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

# Étape 3 : Configurer Puppeteer
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
ENV PUPPETEER_SKIP_DOWNLOAD=false

# Étape 4 : Copier le code source
COPY . .

# Étape 5 : Exposer le port pour Google Cloud Run
EXPOSE 8080

# Étape 6 : Lancer le serveur Node.js
CMD ["node", "server.js"]
