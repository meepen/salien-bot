FROM node:10-alpine

WORKDIR /app

COPY package.json /app

RUN yarn install

COPY . /app

CMD ["node", "headless.js"]
