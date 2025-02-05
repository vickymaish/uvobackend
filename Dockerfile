FROM ghcr.io/puppeteer/puppeteer:23.11.1
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser\
    PUPPETEER_DOWNLOAD_BASE_URL=https://storage.googleapis.com/chrome-for-testing-public
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY backend/ .
CMD [ "node", "interval_scraping.cjs" ]
