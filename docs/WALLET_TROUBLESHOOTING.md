# 钱包创建问题诊断指南

## 问题描述
在应用中创建新钱包时没有反应，或者没有看到成功提示。

## 诊断步骤

### 1. 打开浏览器开发者工具

按 `F12` 或右键点击页面选择"检查"打开开发者工具。

### 2. 切换到 Console（控制台）标签

查看是否有 JavaScript 错误信息。

### 3. 切换到 Network（网络）标签

点击"创建新钱包"按钮，查看是否有请求发出：

- 应该看到 `/api/wallets/create` 的 POST 请求
- 查看请求的 Status Code：
  - `200` - 成功
  - `500` - 服务器错误
  - `404` - 路由不存在

### 4. 查看请求和响应

点击 `/api/wallets/create` 请求，查看：
- **Request Payload**: 应该包含 `{ "name": "...", "chain": "..." }`
- **Response**: 应该包含 `{ "success": true, "data": { ... } }`

## 常见问题和解决方案

### 问题 1：没有输入钱包名称

**症状**：点击按钮后没有任何反应

**原因**：代码中检查了 `if (!newWalletName) return;`，但没有提示

**解决方案**：
1. 在"钱包名称"输入框中输入名称
2. 确保名称不为空

### 问题 2：没有选择区块链

**症状**：点击按钮后没有任何反应

**解决方案**：
1. 点击"选择链"下方的按钮（Solana / BSC / ETH）
2. 确保至少选择了一个链

### 问题 3：数据库连接失败

**症状**：
- 按钮显示"创建中..."状态持续很久
- 最终显示错误提示："创建失败：..."
- Console 中显示数据库连接错误

**解决方案**：
1. 检查数据库是否正在运行
2. 检查环境变量 `DATABASE_URL` 是否正确配置
3. 查看服务器日志：`tail -n 30 /app/work/logs/bypass/app.log`

### 问题 4：网络请求超时

**症状**：
- 按钮显示"创建中..."状态持续超过 10 秒
- 最终显示"网络错误，请重试"

**解决方案**：
1. 检查网络连接
2. 刷新页面重试
3. 如果问题持续，重启开发服务器

### 问题 5：钱包创建成功但列表未更新

**症状**：
- 显示"钱包创建成功！"提示
- 但钱包列表中没有新创建的钱包

**原因**：`loadWallets()` 函数可能失败

**解决方案**：
1. 刷新页面查看钱包是否出现
2. 查看 Console 是否有错误信息
3. 检查数据库中是否有新记录

## 验证 API 是否正常工作

### 方法 1：使用浏览器控制台

在 Console 中运行以下代码：

```javascript
fetch('/api/wallets/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'test-wallet', chain: 'solana' })
})
.then(res => res.json())
.then(data => console.log(data))
.catch(err => console.error(err));
```

如果返回 `{ "success": true, "data": { ... } }`，说明 API 正常。

### 方法 2：使用 curl 命令

在终端运行：

```bash
curl -X POST http://localhost:5000/api/wallets/create \
  -H "Content-Type: application/json" \
  -d '{"name":"test","chain":"solana"}'
```

应该返回创建成功的 JSON 数据。

## 查看钱包列表

在 Console 中运行：

```javascript
fetch('/api/wallets')
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error(err));
```

应该返回钱包列表数组。

## 获取帮助

如果以上方法都无法解决问题，请提供以下信息：

1. **浏览器控制台的错误信息**（Console 标签）
2. **网络请求的响应**（Network 标签）
3. **服务器日志**：
   ```bash
   tail -n 50 /app/work/logs/bypass/app.log
   tail -n 50 /app/work/logs/bypass/console.log
   ```

## 预期的成功流程

1. ✅ 在"钱包名称"输入框中输入名称
2. ✅ 点击选择链（Solana / BSC / ETH）
3. ✅ 点击"创建新钱包"按钮
4. ✅ 按钮显示"创建中..."和加载动画
5. ✅ 1-3 秒后，显示成功提示："钱包创建成功！\n\n地址: ..."
6. ✅ 钱包列表自动刷新，显示新创建的钱包
7. ✅ 统计数据自动更新（总钱包数增加）
