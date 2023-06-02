FROM node:alpine
WORKDIR /app
COPY . .
RUN npm i \
&& npm run build \
&& rm -rf node_modules \
&& npm i --omit-dev
CMD ["npm", "run", "serve"] 
