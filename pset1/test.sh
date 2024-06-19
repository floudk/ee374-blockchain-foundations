#!/bin/bash

HOST_FILE="hosts.yaml"
LOCALHOST="127.0.0.1"
INDEX_FILE="src/index.js"
# read hosts list from file
# hosts:
#   - name: "host1"
#     port: 24600
#   - name: "host2"
#     port: 24601
#   - name: "host3"
#     port: 24602

LOG_DIR="logs"
# create log directory if not exists
if [ ! -d "$LOG_DIR" ]; then
  mkdir $LOG_DIR
fi
# clear log files if exists
rm -f $LOG_DIR/*

# DIST="dist"
# rm -r $DIST/*
# npm run build

# kill all running processes
pkill -f $INDEX_FILE

# read hosts list from file
while IFS= read -r line
do
  if [[ $line == *"name"* ]]; then
    host=$(echo $line | cut -d'"' -f2)
    # read port in next line
    read -r line
    # echo $line
    port=$(echo $line | grep -o '[0-9]\+')
    echo "Host: $host, Port: $port"
    # if port is occupied, kill the process and echo the message
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
      echo "Process" $(lsof -t -i:$port) "is running on port" $port
      kill -9 $(lsof -t -i:$port)
    fi

    npx tsx $INDEX_FILE $host $LOCALHOST $port &
  fi
    
done < "$HOST_FILE"
