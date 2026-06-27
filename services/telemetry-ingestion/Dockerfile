FROM node:20.18.0-alpine3.20
WORKDIR /app
COPY --chown=node:node package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --chown=node:node src ./src
EXPOSE 3001
USER node
CMD ["node", "src/index.js"]
