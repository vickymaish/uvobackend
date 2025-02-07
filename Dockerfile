# Use Puppeteer image
FROM ghcr.io/puppeteer/puppeteer:19.7.2

# Set working directory inside the container
WORKDIR /usr/src/app

# Ensure Puppeteer uses the correct Chrome path
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=$(which google-chrome-stable)

# Copy package.json and install dependencies
COPY backend/package.json backend/package-lock.json ./  
RUN npm ci

EXPOSE 8080
# Copy the entire backend folder into the container
COPY backend/ ./  

# Change working directory to backend (important for running server.cjs)
WORKDIR /usr/src/app/backend

# Set the entry point for the container
CMD ["node", "server.cjs"]
