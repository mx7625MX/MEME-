# 使用 Node.js 24
FROM node:24

# 设置工作目录
WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm@9.0.0

# 复制 package.json 和 pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制项目文件
COPY . .

# 构建项目
RUN pnpm run build

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=5000

# 暴露端口
EXPOSE 5000

# 启动应用
CMD ["pnpm", "run", "start"]
