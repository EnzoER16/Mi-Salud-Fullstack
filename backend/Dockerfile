# Docker de desarrollo/demo para el monorepo NestJS.
FROM node:24-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ENV NODE_ENV=development
# SERVICE_NAME: api-gateway, identity-service, clinical-service
CMD ["sh", "-c", "npx nest start ${SERVICE_NAME}"]
