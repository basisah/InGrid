FROM node:18

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy app source
COPY . .

# Expose port for Docker
EXPOSE 80

# Start server
CMD ["node", "server.js"]
