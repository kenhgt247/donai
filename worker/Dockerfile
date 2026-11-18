# Đơn AI — Video Worker: Node 22 + FFmpeg (có libass để vẽ phụ đề) + font Be Vietnam Pro
FROM node:22-bookworm-slim

RUN apt-get update \
 && apt-get install -y --no-install-recommends ffmpeg fonts-dejavu-core ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Font thương hiệu cho phụ đề (giấy phép OFL, tải từ kho Google Fonts)
ADD https://github.com/google/fonts/raw/main/ofl/bevietnampro/BeVietnamPro-ExtraBold.ttf /app/fonts/
ADD https://github.com/google/fonts/raw/main/ofl/bevietnampro/BeVietnamPro-Bold.ttf /app/fonts/

COPY package.json ./
RUN npm install --omit=dev && npm cache clean --force
COPY src ./src

ENV NODE_ENV=production FONTS_DIR=/app/fonts
USER node
CMD ["node", "--experimental-strip-types", "src/index.ts"]
