# Use the Node alpine official image
# https://hub.docker.com/_/node
FROM node:lts-alpine AS build

# Set config
ENV NPM_CONFIG_UPDATE_NOTIFIER=false
ENV NPM_CONFIG_FUND=false

# Create and change to the app directory.
WORKDIR /app

# Copy the files to the container image
COPY package*.json ./

ARG VITE_API_BASE_URL

# 2. Îl setăm ca variabilă de mediu pentru ca procesul Node să îl vadă
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Install packages
RUN npm ci

# Copy local code to the container image.
COPY . ./

# Build the app.
RUN npm run build

# Use the Caddy image
FROM caddy

# Create and change to the app directory.
WORKDIR /app

# Copy Caddyfile to the container image.
COPY Caddyfile /etc/caddy/Caddyfile

# Copy local code to the container image.
RUN caddy fmt /etc/caddy/Caddyfile --overwrite
# Copy files to the container image.
COPY --from=build /app/dist /app/dist
# Use Caddy to run/serve the app
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]