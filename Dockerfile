FROM node:20-alpine
WORKDIR /app
COPY . .
RUN yarn --pure-lockfile
EXPOSE 9002
CMD yarn main