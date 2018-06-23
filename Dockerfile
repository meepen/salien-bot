FROM node:10-alpine

RUN apk add --no-cache curl unzip

WORKDIR /tmp
RUN curl -L -o ./salien.zip https://github.com/meepen/salien-bot/archive/master.zip && \
	unzip salien.zip && \
	rm salien.zip

WORKDIR /app
RUN cp -R /tmp/salien-bot-master/* ./

RUN yarn install

ENTRYPOINT ["node", "headless.js"]
