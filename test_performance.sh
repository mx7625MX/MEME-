#!/bin/bash

# 性能测试脚本：发币 -> 买入 -> 卖出

API_BASE="http://localhost:5000/api"
WALLET_ID="28d60621-57cd-4924-8d31-dae8f1986392"  # Solana钱包

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================="
echo "Meme Master Pro 性能测试"
echo "========================================="
echo ""

# 测试1：发币API
echo -e "${YELLOW}[测试1] 发币API (包含捆绑买入)${NC}"
START_TIME=$(date +%s.%N)

LAUNCH_RESPONSE=$(curl -s -X POST "${API_BASE}/tokens/launch" \
  -H "Content-Type: application/json" \
  -d "{
    \"walletId\": \"${WALLET_ID}\",
    \"chain\": \"solana\",
    \"platform\": \"raydium\",
    \"tokenName\": \"TestToken$(date +%s)\",
    \"tokenSymbol\": \"TEST$(date +%s | tail -c 4)\",
    \"totalSupply\": \"1000000000\",
    \"liquidity\": \"10\",
    \"imageUrl\": \"\",
    \"imageKey\": \"\",
    \"bundleBuyEnabled\": true,
    \"useSpecifiedTokenForBundleBuy\": false,
    \"bundleBuyAmount\": \"0.1\",
    \"bundleBuyTokenSymbol\": \"\",
    \"website\": \"\",
    \"twitter\": \"\",
    \"telegram\": \"\",
    \"discord\": \"\",
    \"addLiquidity\": true,
    \"liquidityTokenPercent\": \"50\",
    \"pairTokenSymbol\": \"auto\",
    \"pairTokenAmount\": \"1\",
    \"lockLiquidity\": true,
    \"lockDuration\": \"7\"
  }")

LAUNCH_END_TIME=$(date +%s.%N)
LAUNCH_TIME=$(echo "$LAUNCH_END_TIME - $START_TIME" | bc)

LAUNCH_SUCCESS=$(echo $LAUNCH_RESPONSE | grep -o '"success":[^,]*' | cut -d':' -f2)
if [ "$LAUNCH_SUCCESS" = "true" ]; then
  echo -e "${GREEN}✓ 发币成功${NC}"
  echo "响应时间: ${LAUNCH_TIME} 秒"
  
  # 提取代币地址
  TOKEN_ADDRESS=$(echo $LAUNCH_RESPONSE | grep -o '"address":"[^"]*"' | cut -d'"' -f4)
  TOKEN_SYMBOL=$(echo $LAUNCH_RESPONSE | grep -o '"symbol":"[^"]*"' | cut -d'"' -f4 | head -1)
  
  echo "代币地址: $TOKEN_ADDRESS"
  echo "代币符号: $TOKEN_SYMBOL"
else
  echo -e "${RED}✗ 发币失败${NC}"
  echo $LAUNCH_RESPONSE
  exit 1
fi

echo ""

# 测试2：闪电卖出API
echo -e "${YELLOW}[测试2] 闪电卖出API${NC}"
SELL_START_TIME=$(date +%s.%N)

SELL_RESPONSE=$(curl -s -X POST "${API_BASE}/portfolios/sell" \
  -H "Content-Type: application/json" \
  -d "{
    \"walletId\": \"${WALLET_ID}\",
    \"tokenAddress\": \"${TOKEN_ADDRESS}\",
    \"tokenSymbol\": \"${TOKEN_SYMBOL}\",
    \"amount\": \"500000000\",
    \"slippage\": \"5\"
  }")

SELL_END_TIME=$(date +%s.%N)
SELL_TIME=$(echo "$SELL_END_TIME - $SELL_START_TIME" | bc)

SELL_SUCCESS=$(echo $SELL_RESPONSE | grep -o '"success":[^,]*' | cut -d':' -f2)
if [ "$SELL_SUCCESS" = "true" ]; then
  echo -e "${GREEN}✓ 卖出成功${NC}"
  echo "响应时间: ${SELL_TIME} 秒"
else
  echo -e "${RED}✗ 卖出失败${NC}"
  echo $SELL_RESPONSE
fi

echo ""

# 计算总时间
TOTAL_TIME=$(echo "$LAUNCH_TIME + $SELL_TIME" | bc)

# 汇总结果
echo "========================================="
echo -e "${YELLOW}测试结果汇总${NC}"
echo "========================================="
echo "发币时间: ${LAUNCH_TIME} 秒"
echo "卖出时间: ${SELL_TIME} 秒"
echo -e "${GREEN}总时间: ${TOTAL_TIME} 秒${NC}"
echo ""
echo "平均每步耗时:"
AVG_TIME=$(echo "scale=3; $TOTAL_TIME / 2" | bc)
echo "  - 平均: ${AVG_TIME} 秒/步"
echo ""
