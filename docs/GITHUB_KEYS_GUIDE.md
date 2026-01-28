# 如何查看 GitHub 密钥

## GitHub 密钥类型

GitHub 有多种密钥，查看方法各不相同：

### 1. SSH 密钥
用于 Git 操作（push、pull）

### 2. Personal Access Token (PAT)
用于 API 访问或 Git 认证

### 3. GPG 密钥
用于签名提交

### 4. 部署密钥
用于访问特定仓库

---

## 方法 1：查看 SSH 密钥 ⭐

### 在本地电脑上查看

#### macOS / Linux

```bash
# 查看所有 SSH 公钥
ls -la ~/.ssh/

# 查看公钥内容（推荐）
cat ~/.ssh/id_ed25519.pub
# 或
cat ~/.ssh/id_rsa.pub

# 查看私钥内容（谨慎！）
cat ~/.ssh/id_ed25519
# 或
cat ~/.ssh/id_rsa
```

#### Windows (PowerShell)

```powershell
# 查看 SSH 公钥
cat $env:USERPROFILE\.ssh\id_ed25519.pub
# 或
cat $env:USERPROFILE\.ssh\id_rsa.pub

# 查看私钥（谨慎！）
cat $env:USERPROFILE\.ssh\id_ed25519
# 或
cat $env:USERPROFILE\.ssh\id_rsa
```

#### Windows (Git Bash)

```bash
# 与 macOS/Linux 相同
cat ~/.ssh/id_ed25519.pub
```

---

### 在沙箱环境中查看

```bash
# 检查 SSH 目录是否存在
ls -la ~/.ssh/

# 如果存在，查看公钥
cat ~/.ssh/id_ed25519.pub
cat ~/.ssh/id_rsa.pub
```

**⚠️ 注意**：沙箱环境通常没有 SSH 密钥！

---

### 在 GitHub 上查看

1. **访问 SSH 设置页面**：
   - 网址：https://github.com/settings/keys

2. **查看已添加的 SSH 密钥**：
   - 在 "SSH and GPG keys" 页面
   - 可以看到所有已添加的 SSH 公钥
   - 可以看到密钥的添加时间和使用情况

3. **查看密钥详情**：
   - 点击 "Delete" 按钮可以删除密钥
   - 但无法查看完整的公钥内容（安全考虑）

---

## 方法 2：查看 Personal Access Token ⭐

### ⚠️ 重要提示

**Personal Access Token 只在创建时显示一次！**

创建后，你无法在 GitHub 上再次查看完整的 Token。只能：

- ✅ 查看名称、过期时间、权限
- ✅ 查看最后使用时间
- ❌ 无法查看完整的 Token 内容

---

### 在 GitHub 上查看 Token 列表

1. **访问 Token 设置页面**：
   - 网址：https://github.com/settings/tokens

2. **查看所有 Token**：
   - 点击 "Personal access tokens"
   - 选择 "Tokens (classic)" 或 "Fine-grained tokens"

3. **查看 Token 信息**：
   - **Note（备注）**: 创建时设置的名称
   - **Expiration（过期时间）**: 过期日期
   - **Created（创建时间）**: 创建日期
   - **Last used（最后使用）**: 最后使用时间
   - **Scopes（权限）**: 拥有的权限范围

4. **管理 Token**：
   - 点击 "Delete" 删除 Token
   - 点击 "Regenerate" 重新生成 Token（仅限 Fine-grained tokens）

---

### 如何重新获取 Token

如果你忘记了 Token，需要：

1. **删除旧 Token**：
   - 在 https://github.com/settings/tokens
   - 找到对应的 Token
   - 点击 "Delete"

2. **创建新 Token**：
   - 点击 "Generate new token"
   - 选择 "Generate new token (classic)"
   - 配置权限和过期时间
   - 点击 "Generate token"

3. **立即复制新 Token**：
   - ⚠️ 只显示一次！
   - 立即复制并保存到安全的地方

---

## 方法 3：查看 GPG 密钥

### 在本地电脑上查看

```bash
# 列出所有 GPG 密钥
gpg --list-keys

# 查看私钥（谨慎！）
gpg --list-secret-keys

# 查看公钥详情
gpg --armor --export [key-id]

# 查看私钥详情（谨慎！）
gpg --armor --export-secret-keys [key-id]
```

### 在 GitHub 上查看

1. **访问 GPG 设置页面**：
   - 网址：https://github.com/settings/keys

2. **切换到 "GPG keys" 标签**：
   - 可以看到所有已添加的 GPG 公钥
   - 可以查看密钥 ID、创建时间、过期时间

---

## 方法 4：查看部署密钥（Deploy Keys）

### 在 GitHub 上查看

1. **访问仓库设置页面**：
   - 网址：https://github.com/mx7625MX/MEME-/settings/keys

2. **查看 Deploy Keys**：
   - 可以看到该仓库的部署密钥
   - 可以查看密钥的添加时间
   - 可以查看密钥是否有写入权限

---

## 方法 5：查看已连接的应用

### 在 GitHub 上查看

1. **访问应用设置页面**：
   - 网址：https://github.com/settings/apps

2. **查看已授权的应用**：
   - 可以看到所有已授权的 OAuth 应用
   - 可以查看授权范围
   - 可以撤销授权

---

## 🎯 快速检查清单

### 检查本地是否有 SSH 密钥

```bash
# macOS / Linux / Git Bash
ls -la ~/.ssh/

# Windows PowerShell
ls $env:USERPROFILE\.ssh\
```

**应该看到**：
```
id_ed25519         # 私钥
id_ed25519.pub     # 公钥
id_rsa             # 私钥（如果使用 RSA）
id_rsa.pub         # 公钥（如果使用 RSA）
known_hosts        # 已知主机
config             # SSH 配置（可选）
```

### 检查本地是否有 GPG 密钥

```bash
gpg --list-keys
```

### 检查 GitHub 上有哪些密钥

1. **SSH 密钥**：
   - https://github.com/settings/keys

2. **Personal Access Tokens**：
   - https://github.com/settings/tokens

3. **GPG 密钥**：
   - https://github.com/settings/keys（切换到 GPG keys 标签）

---

## 🔐 安全提示

### ⚠️ 不要分享的密钥

**私钥**（绝对不要分享）：
- ❌ `~/.ssh/id_ed25519` - SSH 私钥
- ❌ `~/.ssh/id_rsa` - SSH 私钥
- ❌ GPG 私钥

**Token**（绝对不要分享）：
- ❌ Personal Access Token

**可以分享的密钥**：
- ✅ `~/.ssh/id_ed25519.pub` - SSH 公钥
- ✅ `~/.ssh/id_rsa.pub` - SSH 公钥
- ✅ GPG 公钥

---

## 📝 常见问题

### Q: 我忘记了我的 Personal Access Token，怎么办？

**A**:
1. 访问：https://github.com/settings/tokens
2. 找到旧的 Token
3. 点击 "Delete"
4. 创建新的 Token
5. 立即复制并保存

**⚠️ 无法查看旧 Token 的完整内容！**

### Q: 如何生成新的 SSH 密钥？

**A**:
```bash
# 生成 ED25519 密钥（推荐）
ssh-keygen -t ed25519 -C "your_email@example.com"

# 生成 RSA 密钥
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"

# 查看公钥
cat ~/.ssh/id_ed25519.pub
```

### Q: 如何将 SSH 密钥添加到 GitHub？

**A**:
1. 复制公钥：`cat ~/.ssh/id_ed25519.pub`
2. 访问：https://github.com/settings/keys
3. 点击 "New SSH key"
4. 粘贴公钥内容
5. 点击 "Add SSH key"

### Q: 如何测试 SSH 密钥是否有效？

**A**:
```bash
ssh -T git@github.com
```

成功会看到：
```
Hi your-username! You've successfully authenticated, but GitHub does not provide shell access.
```

### Q: 如何查看 Git 使用的哪个密钥？

**A**:
```bash
# 查看 SSH 配置
cat ~/.ssh/config

# 测试 SSH 连接（详细模式）
ssh -vT git@github.com

# 查看当前 Git 配置
git config --list | grep user
```

---

## 🎯 实际操作示例

### 示例 1：查看当前环境是否有 SSH 密钥

```bash
# 检查 SSH 目录
ls -la ~/.ssh/

# 如果没有目录或目录为空
# 生成新的密钥
ssh-keygen -t ed25519 -C "your_email@example.com"

# 查看公钥
cat ~/.ssh/id_ed25519.pub
```

### 示例 2：查看 GitHub 上的密钥

1. **SSH 密钥**：
   ```
   https://github.com/settings/keys
   ```

2. **Personal Access Tokens**：
   ```
   https://github.com/settings/tokens
   ```

### 示例 3：测试密钥是否可用

```bash
# 测试 SSH 密钥
ssh -T git@github.com

# 测试 Git 推送
cd /path/to/your/repo
git push origin main
```

---

## ✅ 总结

| 密钥类型 | 查看位置 | 是否可查看完整内容 |
|----------|----------|-------------------|
| **SSH 公钥** | 本地 ~/.ssh/*.pub | ✅ 可查看 |
| **SSH 私钥** | 本地 ~/.ssh/id_* | ⚠️ 谨慎查看 |
| **Personal Access Token** | GitHub（列表） | ❌ 不可查看完整内容 |
| **GPG 公钥** | 本地 `gpg --list-keys` | ✅ 可查看 |
| **GPG 私钥** | 本地 `gpg --list-secret-keys` | ⚠️ 谨慎查看 |

---

## 📚 相关资源

- [GitHub SSH 密钥文档](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)
- [GitHub Personal Access Token 文档](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)
- [GitHub GPG 密钥文档](https://docs.github.com/en/authentication/managing-commit-signature-verification/about-commit-signature-verification)

---

**希望这些信息能帮助你查看和管理你的 GitHub 密钥！** 🔐
