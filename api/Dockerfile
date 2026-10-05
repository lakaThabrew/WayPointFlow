FROM node:20-alpine AS build
WORKDIR /app
# Prisma's query engine needs libssl/libc at runtime on alpine images.
RUN apk add --no-cache openssl libc6-compat
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src
ENV PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
RUN npx prisma generate && npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
# The compose entrypoint runs `prisma migrate deploy` in this stage, and the CLI
# ships in the image's production dependencies — nothing is fetched at boot.
RUN apk add --no-cache openssl libc6-compat
COPY package*.json ./
# Schema is copied before install so @prisma/client's postinstall can generate
# against it; the generated client is then replaced by the build-stage output.
COPY prisma ./prisma
RUN npm ci --omit=dev
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/dist ./dist
EXPOSE 4000
CMD ["node", "dist/src/index.js"]
