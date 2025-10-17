# FIXME use alpine
FROM node:25.0.0@sha256:92a8086f817cfaf95bfca41d2f72382ae64e87389fe865f9b2f06335edb34073

RUN mkdir -p /usr/app/src \
	&& mkdir -p /usr/app/media \
	&& mkdir -p /usr/app/scripts

COPY ./docker/core/bootstrap.sh /usr/app/scripts/bootstrap.sh
COPY . /usr/app/src

RUN mkdir /usr/app/src/state \
	&& chown -R node:node /usr/app

WORKDIR /usr/app/src

USER node

ENV NPM_CONFIG_PREFIX=/home/node/.npm-global
ENV PATH="/home/node/.npm-global/bin:${PATH}"

# FIXME remove nodemon for production
RUN npm install -g nodemon@3.1.4 \
 && npm install -g bunyan@1.8.15 \
 && npm cache clean --force \
 && npm ci

CMD sh /usr/app/scripts/bootstrap.sh && nodemon -e "js,json" lib/run.js

EXPOSE 8084
