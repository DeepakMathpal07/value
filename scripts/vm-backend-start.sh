#!/bin/bash
if [ ! "$(docker ps -q -f name=vmbackend)" ]; then
        cd /home/devops/backend
        docker-compose up -d
fi