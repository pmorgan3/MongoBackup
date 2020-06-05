FROM node:14.4.0-buster as builder
RUN  apt-get install gnupg && wget -qO - https://www.mongodb.org/static/pgp/server-4.2.asc | apt-key add -
RUN echo "deb http://repo.mongodb.org/apt/debian buster/mongodb-org/4.2 main" | tee /etc/apt/sources.list.d/mongodb-org-4.2.list
RUN apt-get update && apt-get install -y mongodb-org

FROM node:14.4.0-buster-slim 
COPY --from=builder /usr/bin/mongodump /usr/bin/
RUN apt-get update && apt-get install -y zip
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
CMD [ "npm" , "start" ]