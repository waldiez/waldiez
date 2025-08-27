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
RUN python scripts/pin_extras.py
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
    ffmpeg \
    graphviz \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    libgdk-pixbuf-xlib-2.0-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    tzdata \
    locales \
    xdg-utils \
    xvfb && \
    sed -i -e 's/# en_US.UTF-8 UTF-8/en_US.UTF-8 UTF-8/' /etc/locale.gen && \
    locale-gen en_US.UTF-8 && \
    curl -fsSL https://deb.nodesource.com/setup_22.x -o nodesource_setup.sh && \
    bash nodesource_setup.sh && \
    rm nodesource_setup.sh && \
    apt install -y nodejs && \
    npm install -g corepack && \
    corepack enable && \
    yarn set version stable && \
    apt clean && \
    rm -rf /var/lib/apt/lists/* && \
    rm -rf /var/cache/apt/archives/*

# Add ChromeDriver and Chrome
RUN ARCH=$(uname -m) && \
    if [ "$ARCH" = "x86_64" ]; then \
    CHROME_ARCH="linux64"; \
    elif [ "$ARCH" = "aarch64" ]; then \
    CHROME_ARCH="linux64"; \
    else \
    echo "Unsupported architecture: $ARCH" && exit 1; \
    fi && \
    LATEST_VERSION=$(curl -s "https://googlechromelabs.github.io/chrome-for-testing/last-known-good-versions-with-downloads.json" | \
    jq -r '.channels.Stable.version') && \
    echo "Installing Chrome and ChromeDriver version: $LATEST_VERSION for $CHROME_ARCH" && \
    curl -Lo /tmp/chrome.zip "https://edgedl.me.gvt1.com/edgedl/chrome/chrome-for-testing/${LATEST_VERSION}/${CHROME_ARCH}/chrome-linux64.zip" && \
    unzip /tmp/chrome.zip -d /opt && \
    ln -sf /opt/chrome-linux64/chrome /usr/bin/google-chrome && \
    curl -Lo /tmp/chromedriver.zip "https://edgedl.me.gvt1.com/edgedl/chrome/chrome-for-testing/${LATEST_VERSION}/${CHROME_ARCH}/chromedriver-linux64.zip" && \
    unzip /tmp/chromedriver.zip -d /usr/local/bin && \
    mv /usr/local/bin/chromedriver-linux64/chromedriver /usr/local/bin/chromedriver && \
    chmod +x /usr/local/bin/chromedriver && \
    rm -rf /tmp/chrome.zip /tmp/chromedriver.zip /usr/local/bin/chromedriver-linux64

# Add GeckoDriver (for Firefox)
RUN ARCH=$(uname -m) && \
    if [ "$ARCH" = "x86_64" ]; then \
    GECKO_ARCH="linux64"; \
    elif [ "$ARCH" = "aarch64" ]; then \
    GECKO_ARCH="linux-aarch64"; \
    else \
    echo "Unsupported architecture: $ARCH" && exit 1; \
    fi && \
    curl -fsSL https://packages.mozilla.org/apt/repo-signing-key.gpg | \
    gpg --dearmor -o /etc/apt/trusted.gpg.d/mozilla.gpg && \
    echo "deb https://packages.mozilla.org/apt mozilla main" > /etc/apt/sources.list.d/mozilla.list && \
    apt-get update && \
    apt-get install -y firefox && \
    FIREFOX_VERSION=$(firefox --version | grep -oP '\d+\.\d+') && \
    echo "Firefox version: $FIREFOX_VERSION" && \
    GECKO_VERSION=""; \
    for i in 1 2 3; do \
    GECKO_VERSION=$(curl -s https://api.github.com/repos/mozilla/geckodriver/releases/latest | jq -r '.tag_name'); \
    if [ "$GECKO_VERSION" != "null" ] && [ -n "$GECKO_VERSION" ]; then break; fi; \
    echo "Retrying fetch of GeckoDriver version... ($i)"; \
    sleep 2; \
    done && \
    if [ -z "$GECKO_VERSION" ] || [ "$GECKO_VERSION" = "null" ]; then \
    echo "Failed to fetch GeckoDriver version" >&2; exit 1; \
    fi && \
    echo "GeckoDriver version: $GECKO_VERSION for $GECKO_ARCH" && \
    curl -Lo /tmp/geckodriver.tar.gz "https://github.com/mozilla/geckodriver/releases/download/${GECKO_VERSION}/geckodriver-${GECKO_VERSION}-${GECKO_ARCH}.tar.gz" && \
    tar -xzf /tmp/geckodriver.tar.gz -C /usr/local/bin && \
    chmod +x /usr/local/bin/geckodriver && \
    rm /tmp/geckodriver.tar.gz && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Ensure /usr/local/bin is in the PATH
ENV PATH="/usr/local/bin:${PATH}"

# Set locale and timezone
ENV LANG=en_US.UTF-8 \
    LANGUAGE=en_US.UTF-8 \
    LC_ALL=en_US.UTF-8 \
    LC_CTYPE=en_US.UTF-8 \
    TZ=Etc/UTC

# Add a non-root user
RUN useradd -m -s /bin/bash waldiez && \
    mkdir -p /home/waldiez/workspace /home/waldiez/output /home/waldiez/.local && \
    chown -R waldiez:waldiez /home/waldiez
USER waldiez

ENV PATH="/home/waldiez/.local/bin:${PATH}"
RUN echo "export PATH=\"/home/waldiez/.local/bin:\$PATH\"" >> /home/waldiez/.bashrc

# set pip environment variables
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
