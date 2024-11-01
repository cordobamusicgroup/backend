#!/bin/bash
# Archivo: start_containers.sh

if [[ "$1" != "production" && "$1" != "staging" ]]; then
  echo "[Start Containers Script] Environment must be 'production' or 'staging'."
  exit 1
fi

ENV=$1
make deploy ENV=$ENV
make clean
