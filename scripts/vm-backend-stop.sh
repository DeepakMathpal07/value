#!/bin/bash
if [ "$(docker ps -q -f name=vmbackend)" ]; then
        cd /home/devops/backend
        docker-compose down
    if [ ! "$(docker ps -aq -f name=vmbackend)" ]; then
        docker rmi valuematrix/vm-backend
    fi
fi
rm -rf /home/devops/backend/docker-compose.yml
