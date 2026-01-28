#!/bin/bash
# 数据库迁移脚本
# 用于在部署时创建数据库表结构

set -e

echo "开始数据库迁移..."

# 检查环境变量
if [ -z "$PGDATABASE_URL" ]; then
    echo "错误: PGDATABASE_URL 环境变量未设置"
    exit 1
fi

# 使用 Drizzle Kit 推送 Schema
echo "使用 Drizzle Kit 推送数据库 Schema..."
pnpm exec drizzle-kit push:pg --config=drizzle.config.ts

echo "数据库迁移完成！"
