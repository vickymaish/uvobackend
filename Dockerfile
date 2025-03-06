# Use Node.js 19.5.0 Alpine base image
FROM node:19.5.0-alpine

# Set environment variables for Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Add the community repository and install Puppeteer dependencies
RUN echo "https://dl-cdn.alpinelinux.org/alpine/v3.17/community" >> /etc/apk/repositories \
    && apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    libxkbcommon \
    libxml2 \
    libxslt

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json first
COPY package*.json ./

# Increase npm timeout and retry logic to avoid network issues
RUN npm config set fetch-timeout 600000 \
    && npm config set fetch-retries 5 \
    && npm config set registry https://registry.npmmirror.com

# Install dependencies
RUN npm ci \
    && npm install pm2 --save

# Copy the rest of the application files
COPY . .

# Copy the cookies.json file
COPY cookies.json /usr/src/app/cookies.json

# Expose the necessary port
EXPOSE 8080

# Start the application using PM2
CMD ["npx", "pm2-runtime", "server.cjs"]
