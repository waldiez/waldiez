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

LABEL maintainer="waldiez <development@waldiez.io>"
LABEL org.opencontainers.image.source="https://github.com/waldiez/waldiez"
LABEL org.opencontainers.image.description="Make AG2 Agents Collaborate: Drag, Drop, and Orchestrate with Waldiez."
LABEL org.opencontainers.image.title="waldiez/waldiez"
LABEL org.opencontainers.image.licenses="Apache-2.0"

ENV PYTHONUNBUFFERED=1
ENV DEBIAN_FRONTEND="noninteractive"
ENV DEBCONF_NONINTERACTIVE_SEEN=true

RUN apt update && \
    apt upgrade -y && \
    apt install -y --no-install-recommends \
    build-essential \
    bzip2 \
    curl \
    ca-certificates \
    zip \
    unzip \
    git \
    jq \
    graphviz \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    libgdk-pixbuf2.0-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    xvfb \
    firefox-esr \
    chromium && \
    curl -fsSL https://deb.nodesource.com/setup_22.x -o nodesource_setup.sh && \
    bash nodesource_setup.sh && \
    rm nodesource_setup.sh && \
    apt install -y nodejs && \
    npm install -g corepack && \
    corepack enable && \
    yarn set version stable && \
    npx playwright install-deps && \
    apt clean && \
    rm -rf /var/lib/apt/lists/* && \
    rm -rf /var/cache/apt/archives/*

# Add ChromeDriver
RUN CHROME_VERSION=$(chromium --version | grep -oP '\d+\.\d+\.\d+') && \
    echo "Chrome version: $CHROME_VERSION" && \
    DRIVER_VERSION=$(curl -s "https://googlechromelabs.github.io/chrome-for-testing/last-known-good-versions-with-downloads.json" | \
    jq -r --arg ver "$CHROME_VERSION" '.channels.Stable.version') && \
    echo "Driver version: $DRIVER_VERSION" && \
    curl -Lo /tmp/chromedriver.zip "https://edgedl.me.gvt1.com/edgedl/chrome/chrome-for-testing/${DRIVER_VERSION}/linux64/chromedriver-linux64.zip" && \
    unzip /tmp/chromedriver.zip -d /usr/local/bin && \
    mv /usr/local/bin/chromedriver-linux64/chromedriver /usr/local/bin/chromedriver && \
    chmod +x /usr/local/bin/chromedriver && \
    rm -rf /tmp/chromedriver.zip /usr/local/bin/chromedriver-linux64

# Add GeckoDriver (for Firefox)
RUN GECKO_VERSION=$(curl -s https://api.github.com/repos/mozilla/geckodriver/releases/latest | jq -r '.tag_name') && \
    curl -Lo /tmp/geckodriver.tar.gz "https://github.com/mozilla/geckodriver/releases/download/${GECKO_VERSION}/geckodriver-${GECKO_VERSION}-linux64.tar.gz" && \
    tar -xzf /tmp/geckodriver.tar.gz -C /usr/local/bin && \
    chmod +x /usr/local/bin/geckodriver && \
    rm /tmp/geckodriver.tar.gz

# Add a non-root user
RUN useradd -m -s /bin/bash waldiez && \
    mkdir -p /home/waldiez/workspace /home/waldiez/.local && \
    chown -R waldiez:waldiez /home/waldiez
USER waldiez

RUN npx playwright install chromium firefox

ENV PATH="/home/waldiez/.local/bin:${PATH}"

# make pip always install as user
ENV PIP_USER=1
ENV PIP_BREAK_SYSTEM_PACKAGES=1

# Set display for headless operations if needed
ENV DISPLAY=:99

COPY --from=builder --chown=waldiez:waldiez /app/dist/*.whl /home/waldiez/tmp/
RUN pip install --upgrade pip && \
    file_name=$(ls /home/waldiez/tmp/*.whl) && \
    echo "Installing $file_name" && \
    pip install $file_name[redis,websockets,mqtt] && \
    rm -rf /home/waldiez/.cache/pip /home/waldiez/tmp/*.whl


WORKDIR /home/waldiez/workspace
ENTRYPOINT [ "python", "-m", "waldiez" ]
