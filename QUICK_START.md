# 快速开始部署

## 最简单的部署方式（Docker）

### 1. 安装 Docker

**Ubuntu:**
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

**macOS:**
```bash
brew install --cask docker
```

### 2. 克隆项目

```bash
git clone <your-repo-url>
cd meme-master-pro
```

### 3. 一键部署

```bash
# 编辑 .env 文件配置数据库密码
nano .env

# 运行部署脚本
chmod +x deploy.sh
./deploy.sh
```

### 4. 访问应用

打开浏览器访问: `http://localhost:5000`

---

## 不使用 Docker 的部署方式

### 1. 安装 Node.js 和 pnpm

```bash
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs
npm install -g pnpm@9.0.0
```

### 2. 安装 PostgreSQL

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 3. 创建数据库

```bash
sudo -u postgres psql
CREATE USER memeuser WITH PASSWORD 'your_password';
CREATE DATABASE mememaster OWNER memeuser;
\q
```

### 4. 配置项目

```bash
cp .env.example .env
nano .env
```

修改 `DATABASE_URL` 为：
```
postgresql://memeuser:your_password@localhost:5432/mememaster
```

### 5. 安装依赖并构建

```bash
pnpm install
pnpm run build
```

### 6. 启动应用

```bash
pnpm run start
```

访问: `http://localhost:5000`

---

## 部署到云平台

### Vercel

1. 连接 GitHub 仓库
2. 配置环境变量
3. 自动部署

### Railway

1. 连接 GitHub 仓库
2. 添加 PostgreSQL
3. 部署

详细说明请参考 [DEPLOYMENT.md](./DEPLOYMENT.md)
