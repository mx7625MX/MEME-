# Meme Master Pro - 部署说明

## 📦 快速部署

### 方式一：Docker 部署（推荐）

```bash
# 1. 克隆项目
git clone <your-repo-url>
cd meme-master-pro

# 2. 配置环境变量
cp .env.example .env
nano .env

# 3. 一键部署
chmod +x deploy.sh
./deploy.sh

# 4. 访问应用
# http://localhost:5000
```

### 方式二：手动部署

详细步骤请参考 [DEPLOYMENT.md](./DEPLOYMENT.md)

### 方式三：云平台部署

- **Vercel**: 连接 GitHub 仓库，配置环境变量，自动部署
- **Railway**: 连接 GitHub 仓库，添加 PostgreSQL，部署
- **AWS ECS**: 使用 Docker 镜像部署到 ECS

---

## 📝 环境变量配置

必须配置的环境变量：

```bash
# 数据库连接
DATABASE_URL=postgresql://memeuser:password@localhost:5432/mememaster

# 钱包加密密钥（重要！）
WALLET_ENCRYPTION_KEY=your-secure-random-key
```

可选的环境变量：

```bash
# S3 对象存储
S3_ENDPOINT=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_BUCKET_NAME=

# RPC 配置
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
ETHEREUM_RPC_URL=https://eth.llamarpc.com
BSC_RPC_URL=https://bsc-dataseed.binance.org
```

---

## 🔧 常用命令

### Docker 部署

```bash
# 查看日志
docker-compose logs -f app

# 重启应用
docker-compose restart app

# 停止服务
docker-compose down

# 更新代码
git pull
docker-compose up -d --build
```

### 手动部署

```bash
# 开发模式
pnpm run dev

# 生产模式
pnpm run build
pnpm run start

# 使用 PM2
pm2 start "pnpm run start" --name meme-master
pm2 logs meme-master
```

### 维护脚本

```bash
# 健康检查
./health-check.sh

# 数据库备份
./backup.sh

# 部署
./deploy.sh
```

---

## 📚 文档

- [完整部署指南](./DEPLOYMENT.md)
- [快速开始](./QUICK_START.md)
- [项目 README](./README.md)

---

## 🚀 生产环境优化

### 1. 使用 Nginx 反向代理

配置文件：`nginx.conf`

### 2. 启用 HTTPS

使用 Let's Encrypt 免费证书

### 3. 配置防火墙

只开放必要的端口

### 4. 定期备份

使用 `backup.sh` 脚本自动备份

### 5. 监控和日志

使用健康检查脚本监控系统状态

---

## 🐛 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查 DATABASE_URL 配置
   - 确认 PostgreSQL 正在运行

2. **端口被占用**
   - 修改 PORT 环境变量
   - 或停止占用端口的进程

3. **容器无法启动**
   - 查看日志: `docker-compose logs app`
   - 检查磁盘空间

详细问题排查请参考 [DEPLOYMENT.md](./DEPLOYMENT.md#常见问题)

---

## 📞 技术支持

如有问题，请：
1. 查看 [DEPLOYMENT.md](./DEPLOYMENT.md)
2. 提交 GitHub Issue
3. 联系技术支持团队

---

## ⚠️ 安全提醒

1. **永远不要**将 `.env` 文件提交到 Git
2. **务必修改**默认的数据库密码
3. **生成并配置**安全的加密密钥
4. **定期更新**依赖和系统
5. **配置防火墙**限制访问
6. **使用 HTTPS** 加密传输

---

## 🎉 部署成功后

1. 访问应用并创建管理员账户
2. 配置钱包和 RPC 节点
3. 创建做市值策略
4. 开始使用！

祝您使用愉快！
