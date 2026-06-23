FROM node:20.18.0-alpine3.20
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY src ./src
EXPOSE 3001
CMD ["node", "src/index.js"]
