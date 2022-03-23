#!/bin/bash

podman run --rm -it \
    -v $(pwd):/app \
    -w /app \
    -p 3000:3000 \
    --name rapid-fire \
    node-dev yarn start
