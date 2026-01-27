#!/bin/bash

echo "=== Meme Master Pro 部署脚本 ==="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}错误: 未找到 $1 命令${NC}"
        exit 1
    fi
}

# 检查必要的命令
echo "检查环境..."
check_command docker
check_command docker-compose
echo -e "${GREEN}✓ 环境检查通过${NC}"
echo ""

# 创建 .env 文件
if [ ! -f .env ]; then
    echo "创建 .env 文件..."
    cp .env.example .env
    echo -e "${YELLOW}⚠ 请编辑 .env 文件，配置你的环境变量${NC}"
    echo "特别是："
    echo "  - DATABASE_URL"
    echo "  - WALLET_ENCRYPTION_KEY"
    echo ""
    read -p "按回车键继续..."
fi

# 构建并启动
echo "开始构建和部署..."
docker-compose down
docker-compose build
docker-compose up -d

echo ""
echo "等待服务启动..."
sleep 10

# 检查服务状态
echo ""
echo "检查服务状态..."
docker-compose ps

# 检查应用是否正常启动
echo ""
echo "检查应用健康状态..."
if curl -f http://localhost:5000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 应用启动成功！${NC}"
    echo ""
    echo "应用地址: http://localhost:5000"
else
    echo -e "${RED}✗ 应用启动失败，请检查日志${NC}"
    echo ""
    echo "查看日志: docker-compose logs app"
    exit 1
fi

echo ""
echo -e "${GREEN}=== 部署完成 ===${NC}"
echo ""
echo "常用命令："
echo "  查看日志: docker-compose logs -f app"
echo "  停止服务: docker-compose down"
echo "  重启服务: docker-compose restart app"
echo "  进入容器: docker-compose exec app bash"
