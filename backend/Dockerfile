FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
COPY tsconfig.base.json ./
COPY backend/package*.json ./backend/
RUN cd backend && npm ci

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/backend/node_modules ./backend/node_modules
COPY package*.json ./
COPY tsconfig.base.json ./
COPY backend ./backend
RUN cd backend && npm run build && npm prune --omit=dev

FROM node:20-alpine AS runner
WORKDIR /app/backend
ENV NODE_ENV=production
COPY --from=build /app/backend/package*.json ./
COPY --from=build /app/backend/node_modules ./node_modules
COPY --from=build /app/backend/dist ./dist
RUN mkdir -p uploads
EXPOSE 4000
CMD ["node", "dist/index.js"]
