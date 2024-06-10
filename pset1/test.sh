#!/bin/bash

HOST_FILE="hosts.yaml"
LOCALHOST="127.0.0.1"
# read hosts list from file
# hosts:
#   - name: "host1"
#     port: 24600
#   - name: "host2"
#     port: 24601
#   - name: "host3"
#     port: 24602

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
  fi
    
done < "$HOST_FILE"
