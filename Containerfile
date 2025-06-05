#####################################################################################
# Build Step: build the python package
#####################################################################################
FROM python:3.12-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential && \
    apt clean && \
    rm -rf /var/lib/apt/lists/* && \
    rm -rf /var/cache/apt/archives/*

RUN pip install --upgrade pip build

WORKDIR /tmp
COPY requirements/main.txt /tmp/main.txt
COPY requirements/redis.txt /tmp/redis.txt
COPY requirements/websockets.txt /tmp/websockets.txt
COPY requirements/mqtt.txt /tmp/mqtt.txt
RUN pip install -r /tmp/main.txt && \
    pip install -r /tmp/redis.txt && \
    pip install -r /tmp/websockets.txt && \
    pip install -r /tmp/mqtt.txt && \
    rm -rf /root/.cache/pip /tmp/main.txt /tmp/redis.txt /tmp/websockets.txt /tmp/mqtt.txt

WORKDIR /app
COPY . /app
# let's also make sure the extras have the same version
RUN python scripts/bump_extras.py
RUN python -m build --wheel --outdir dist

#####################################################################################
# Final image
#####################################################################################
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1
ENV DEBIAN_FRONTEND="noninteractive"
ENV DEBCONF_NONINTERACTIVE_SEEN=true

RUN apt update && \
    apt upgrade -y && \
    apt install -y --no-install-recommends \
    build-essential \
    bzip2 \
    ca-certificates \
    zip \
    unzip \
    graphviz && \
    apt clean && \
    rm -rf /var/lib/apt/lists/* && \
    rm -rf /var/cache/apt/archives/*

COPY --from=builder /app/dist/*.whl /tmp/
RUN pip install --upgrade pip && \
    file_name=$(ls /tmp/*.whl) && \
    echo "Installing $file_name" && \
    pip install $file_name[redis,websockets] && \
    rm -rf /root/.cache/pip /tmp/*.whl

WORKDIR /app
ENTRYPOINT [ "python", "-m", "waldiez" ]
