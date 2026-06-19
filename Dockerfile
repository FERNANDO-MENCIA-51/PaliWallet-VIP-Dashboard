# Build stage
FROM node:20-alpine as build-stage

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

COPY --from=build-stage /app/dist ./dist
COPY server/ ./server/
COPY data/ ./data/

RUN npm install --omit=dev

RUN addgroup -S appgroup && adduser -S appuser -G appgroup && \
    chown -R appuser:appgroup /app/data

VOLUME /app/data

EXPOSE 3001

ENV NODE_ENV=production

USER appuser

CMD ["node", "server/index.js"]
