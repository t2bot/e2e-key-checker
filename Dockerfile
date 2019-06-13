FROM node:12-alpine

COPY . /app
WORKDIR /app
RUN cd /app && npm install

VOLUME /app/config/production.yaml
ENV NODE_ENV=production

CMD ["node", "app.js"]
