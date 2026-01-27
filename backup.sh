#!/bin/bash

# 备份脚本

BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${DATE}.sql"

# 创建备份目录
mkdir -p $BACKUP_DIR

echo "开始备份数据库..."

# 备份数据库
docker-compose exec -T postgres pg_dump -U memeuser mememaster > $BACKUP_DIR/$BACKUP_FILE

if [ $? -eq 0 ]; then
    echo "✓ 备份成功: $BACKUP_DIR/$BACKUP_FILE"

    # 压缩备份文件
    gzip $BACKUP_DIR/$BACKUP_FILE
    echo "✓ 备份已压缩: $BACKUP_DIR/${BACKUP_FILE}.gz"

    # 删除7天前的备份
    find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete
    echo "✓ 已清理7天前的旧备份"
else
    echo "✗ 备份失败"
    exit 1
fi
