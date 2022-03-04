#!/bin/bash

set -e

. ./bin/buildah-funcs

FROM node:lts

buildah config --workingdir /app $ctr1
RUN npm install -g typescript typescript-language-server
RUN bash -c "echo 'y' | npx browserslist@latest --update-db"
RUN apt-get update
RUN apt-get install -y inotify-tools

buildah commit $ctr1 node-dev

trap "buildah rm $ctr1" EXIT

