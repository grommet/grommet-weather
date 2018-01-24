# This is the production version of Dockerfile.

FROM node:7.10-alpine as builder

ENV YARN_CACHE_FOLDER /nodejs/yarncache
ENV JOBS max
ENV workspace /build
COPY . $workspace
WORKDIR $workspace

RUN yarn cache clean
RUN yarn
RUN npm run build


FROM nginx:1.13.6-alpine
ENV workspace /build
COPY --from=builder $workspace/dist/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf
