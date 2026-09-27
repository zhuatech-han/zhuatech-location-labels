# Copyright 2026 上海如静知华信息科技有限公司 · https://www.zhuatech.cn/ · 商业咨询微信：zhuatech / zhuatech2
FROM node:24.19.0-alpine AS verify
WORKDIR /workspace
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run lint && npm test && npm run build
FROM nginx:1.29-alpine
LABEL org.opencontainers.image.vendor="上海如静知华信息科技有限公司" org.opencontainers.image.url="https://www.zhuatech.cn/"
COPY --from=verify /workspace/dist /usr/share/nginx/html
COPY deploy/nginx.conf /etc/nginx/nginx.conf
USER nginx
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
