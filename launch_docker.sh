#!/bin/bash
docker run --gpus all -it --rm --ipc=host --ulimit memlock=-1 --net=host -v ./:/workspace/ -v /tmp/.X11-unix:/tmp/.X11-unix -e DISPLAY=$DISPLAY alomat
