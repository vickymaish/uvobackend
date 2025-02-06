FROM ghcr.io/puppeteer/puppeteer:19.7.2

# Set environment variables for Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Set working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and install dependencies
COPY backend/package*.json ./  
RUN npm ci

# Copy the entire backend folder into the container
COPY backend/ ./  

# Set the entry point for the container
CMD ["node", "server.cjs"]
