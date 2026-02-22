# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production=false

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /app

RUN apk add --no-cache dumb-init

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

ENV NODE_ENV=production

EXPOSE 3000

USER node

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
