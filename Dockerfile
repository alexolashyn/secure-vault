# ---------- Base ----------
FROM node:20-alpine AS base
RUN apk add --no-interactive dumb-init
WORKDIR /usr/src/app
COPY package*.json ./

# ---------- Development stage ----------
FROM base AS development
RUN npm ci
COPY . .
USER node

# ---------- Build stage ----------
FROM base AS build
RUN npm ci
COPY . .
RUN npm run build
RUN npm prune --production

# ---------- Production stage ----------
FROM node:20-alpine AS production
ENV NODE_ENV=production
WORKDIR /usr/src/app
COPY --from=base /usr/bin/dumb-init /usr/bin/dumb-init
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist

USER node

EXPOSE 3000
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]