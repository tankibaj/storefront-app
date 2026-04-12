# ── Build stage ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Bake API URLs and tenant at build time (override via docker-compose build.args)
ARG VITE_INVENTORY_API_URL=http://localhost:8000/api/v1
ARG VITE_ORDER_API_URL=http://localhost:8001
ARG VITE_TENANT_ID=00000000-0000-0000-0000-000000000001
ARG VITE_STRIPE_PUBLISHABLE_KEY=pk_test_placeholder

ENV VITE_INVENTORY_API_URL=$VITE_INVENTORY_API_URL
ENV VITE_ORDER_API_URL=$VITE_ORDER_API_URL
ENV VITE_TENANT_ID=$VITE_TENANT_ID
ENV VITE_STRIPE_PUBLISHABLE_KEY=$VITE_STRIPE_PUBLISHABLE_KEY

RUN npm run build

# ── Serve stage ───────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
