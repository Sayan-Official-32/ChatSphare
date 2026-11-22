# Dockerfile for React Vite Frontend
FROM node:18-alpine

WORKDIR /app

# Accept build arg and expose as env var so vite.config.js can read it
ARG VITE_API_TARGET=http://backend:8000
ENV VITE_API_TARGET=${VITE_API_TARGET}

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy frontend source code
COPY . .

# Expose Vite dev port
EXPOSE 5173

# Start Vite dev server bound to 0.0.0.0 so Docker port mapping works
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
