#!/bin/bash
docker-compose up -d postgres redis
sleep 5
docker-compose run backend npm run migrate
docker-compose run backend npm run seed
echo "Setup complete"