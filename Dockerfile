# syntax=docker/dockerfile:1

FROM node:22-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Les variables EXPO_PUBLIC_* sont inlinées dans le bundle à la compilation
ARG EXPO_PUBLIC_POCKETBASE_URL
ARG EXPO_PUBLIC_APP_URL
ENV EXPO_PUBLIC_POCKETBASE_URL=$EXPO_PUBLIC_POCKETBASE_URL \
    EXPO_PUBLIC_APP_URL=$EXPO_PUBLIC_APP_URL

RUN test -n "$EXPO_PUBLIC_POCKETBASE_URL" || (echo "EXPO_PUBLIC_POCKETBASE_URL manquant" && exit 1)
RUN npx expo export --platform web --output-dir dist

# --- Service statique ---------------------------------------------------------
FROM nginx:1.27-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
