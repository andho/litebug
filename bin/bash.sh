#!/bin/bash

podman run --rm -it \
    -v $HOME/.dockercache/yarn:/home/node/.yarn \
    -v $(pwd):/app \
    -w /app \
    node-dev bash
