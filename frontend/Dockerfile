# Stage 1: Build Angular Application
FROM node:18-alpine as build

WORKDIR /app

# Accept build arguments
ARG API_URL=http://flowapi_backend:8888
ARG ENVIRONMENT=production

# Install build dependencies
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps
RUN npm install --save-dev sass --legacy-peer-deps

COPY . .

# Build with environment-specific configuration
RUN npm run build -- --configuration ${ENVIRONMENT} --output-path=dist

# Stage 2: Setup Nginx and SSL
FROM nginx:alpine

# Install OpenSSL and gettext (for envsubst)
RUN apk add --no-cache openssl gettext

RUN rm -rf /usr/share/nginx/html/*

COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configs as templates
COPY nginx/nginx.conf /etc/nginx/conf.d/default-https.conf.template
COPY nginx/nginx-http.conf /etc/nginx/conf.d/default-http.conf.template

# Copy entrypoint
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 443

ENTRYPOINT ["/entrypoint.sh"]