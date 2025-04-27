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
COPY requirements/main.txt /tmp/requirements.txt
RUN pip install -r /tmp/requirements.txt && \
    rm -rf /root/.cache/pip /tmp/requirements.txt

WORKDIR /app
COPY . /app
# let's also make sure the extras have the same version
RUN python scripts/bump_extras.py
RUN python -m build --wheel --outdir dist

#####################################################################################
# Final image
#####################################################################################
FROM python:3.12-slim

LABEL maintainer="waldiez <development@waldiez.io>"
LABEL org.opencontainers.image.source="quay.io/waldiez/waldiez"
LABEL org.opencontainers.image.title="waldiez/waldiez"
LABEL org.opencontainers.image.description="Python 3.12-slim image with waldiez"

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
RUN pip install /tmp/*.whl && \
    rm -rf /root/.cache/pip /tmp/*.whl

WORKDIR /app
ENTRYPOINT [ "python", "-m", "waldiez" ]
