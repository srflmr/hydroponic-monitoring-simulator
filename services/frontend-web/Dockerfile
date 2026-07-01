FROM node:22.14.0-alpine3.20 AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22.14.0-alpine3.20
WORKDIR /app
ENV NODE_ENV=production
COPY --chown=node:node package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --chown=node:node --from=build /app/build ./build
EXPOSE 3000
USER node
CMD ["node", "build"]
