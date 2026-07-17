# Sample Hello World Node.js Application
# This Dockerfile intentionally has some security issues for demonstration

FROM node:latest

WORKDIR /app

# Copy application files
COPY package*.json ./
COPY app.js ./

# Install dependencies
RUN npm install

# Expose port
EXPOSE 3000

# Run the application
CMD ["node", "app.js"]
