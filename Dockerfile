FROM node:alpine as build
WORKDIR /app
COPY package.json package-lock.json tsconfig.json ./
RUN npm i --omit-dev
COPY . ./
RUN npm run build

FROM node:alpine
WORKDIR /app
COPY --from=build /app/dist/ ./
COPY --from=build /app/node_modules ./node_modules
# In production, the example file should be copied into a new .env file
# with custom values
COPY .env.example ./.env
CMD ["node", "./index.js"]
