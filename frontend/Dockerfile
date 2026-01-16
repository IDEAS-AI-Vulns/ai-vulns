# Stage 1: Build Angular Application
FROM node:18-alpine as build

# Add build arguments
ARG ENVIRONMENT=production
ARG API_URL=http://flowapi_backend:8888

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package.json and package-lock.json
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Force install latest dart-sass if not installed already
RUN npm install --save-dev sass --legacy-peer-deps

# Copy Angular application code
COPY . .

# Create environment file for Angular (if needed)
RUN echo "export const environment = { production: true, apiUrl: '$API_URL' };" > src/environments/environment.prod.ts

# Build the Angular application with the specified environment
RUN npm run build -- --configuration ${ENVIRONMENT} --output-path=dist

# Stage 2: Setup Nginx and SSL
FROM nginx:alpine

# Install OpenSSL
RUN apk add --no-cache openssl

RUN rm -rf /usr/share/nginx/html/*

# Copy the build output to the Nginx web directory
COPY --from=build /app/dist /usr/share/nginx/html

# Copy a custom Nginx configuration file
COPY nginx/nginx.conf /etc/nginx/conf.d/default-https.conf
COPY nginx/nginx-http.conf /etc/nginx/conf.d/default-http.conf

# Entry point script to handle SSL key generation and verification
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Expose port 443 for HTTPS
EXPOSE 443

# Run the entrypoint script
ENTRYPOINT ["/entrypoint.sh"]