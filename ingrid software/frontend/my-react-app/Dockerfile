FROM node:18

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the source code
COPY . .

# Set React dev server to listen on all interfaces
ENV HOST 0.0.0.0
ENV PORT 3000

# Expose port
EXPOSE 3000

# Start the dev server
CMD ["npm", "start"]
