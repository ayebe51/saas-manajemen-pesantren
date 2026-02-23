# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
COPY tsconfig.build.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npx prisma generate
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install openssl for prisma
RUN apk add --no-cache openssl

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

ENV NODE_ENV=production

# Start the server
CMD ["npm", "run", "start:prod"]
