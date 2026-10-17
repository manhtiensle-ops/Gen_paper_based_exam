FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    locales \
    fonts-noto-core \
    fonts-noto-cjk \
    fonts-dejavu-core \
    pandoc \
    libreoffice-writer \
    curl \
    && rm -rf /var/lib/apt/lists/*

RUN echo "vi_VN.UTF-8 UTF-8" > /etc/locale.gen && locale-gen vi_VN.UTF-8
ENV LANG=vi_VN.UTF-8
ENV LANGUAGE=vi_VN:vi
ENV LC_ALL=vi_VN.UTF-8

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8001

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
