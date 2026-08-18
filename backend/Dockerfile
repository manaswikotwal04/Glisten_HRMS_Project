FROM node:24.13.0-alpine3.23

RUN mkdir /apps
COPY . /apps/

RUN cd /apps && npm install
WORKDIR /apps

ENTRYPOINT /apps/start.sh

EXPOSE 5000
