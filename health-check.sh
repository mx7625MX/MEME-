#!/bin/bash

echo "=== 健康检查脚本 ==="

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 检查应用是否运行
echo "检查应用状态..."
if curl -f http://localhost:5000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 应用正常运行${NC}"
else
    echo -e "${RED}✗ 应用未运行${NC}"
    exit 1
fi

# 检查数据库连接
echo "检查数据库连接..."
docker-compose exec postgres pg_isready -U memeuser > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 数据库连接正常${NC}"
else
    echo -e "${RED}✗ 数据库连接失败${NC}"
    exit 1
fi

# 检查磁盘空间
echo "检查磁盘空间..."
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -lt 80 ]; then
    echo -e "${GREEN}✓ 磁盘空间充足 (${DISK_USAGE}%)${NC}"
else
    echo -e "${YELLOW}⚠ 磁盘空间不足 (${DISK_USAGE}%)${NC}"
fi

# 检查内存使用
echo "检查内存使用..."
MEM_USAGE=$(free | awk '/Mem/{printf("%.0f"), $3/$2*100}')
if [ $MEM_USAGE -lt 80 ]; then
    echo -e "${GREEN}✓ 内存使用正常 (${MEM_USAGE}%)${NC}"
else
    echo -e "${YELLOW}⚠ 内存使用较高 (${MEM_USAGE}%)${NC}"
fi

echo ""
echo -e "${GREEN}=== 健康检查完成 ===${NC}"
