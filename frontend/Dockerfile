FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/frontend/node_modules ./frontend/node_modules
COPY package*.json ./
COPY frontend ./frontend
WORKDIR /app/frontend
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app/frontend
ENV NODE_ENV=production
COPY --from=build /app/frontend/package*.json ./
COPY --from=build /app/frontend/node_modules ./node_modules
COPY --from=build /app/frontend/.next ./.next
COPY --from=build /app/frontend/next.config.js ./next.config.js
EXPOSE 3000
CMD ["npm", "run", "start"]
