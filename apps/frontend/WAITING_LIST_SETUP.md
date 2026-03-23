# Waiting List 功能设置说明

## ✅ 已完成的工作

### 1. 前端组件更新
- ✅ 更新了 `components/landing/WaitingListModal.tsx`
- ✅ 添加了真实的 API 调用（替换了模拟的 setTimeout）
- ✅ 添加了错误处理和错误提示显示
- ✅ 添加了加载状态管理

### 2. API 路由
- ✅ API 路由已存在：`app/api/waiting-list/route.ts`
- ✅ 包含以下功能：
  - 邮箱验证
  - 速率限制（使用 Vercel KV）
  - Google Sheets 集成
  - 错误处理

### 3. 依赖安装
- ✅ 已添加 `@vercel/kv` 到 package.json
- ✅ 已添加 `googleapis` 到 package.json
- ⚠️ 需要运行 `npm install` 安装依赖

### 4. 环境变量
- ✅ 已从 `.local.env` 复制到 `.env.local`
- ✅ 包含以下环境变量：
  - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
  - `GOOGLE_PRIVATE_KEY`
  - `GOOGLE_SPREADSHEET_ID`
  - `KV_REST_API_URL`
  - `KV_REST_API_TOKEN`

## 🚀 使用步骤

### 1. 安装依赖
```bash
cd apps/frontend
npm install
```

### 2. 确保环境变量正确
检查 `.env.local` 文件是否包含所有必要的环境变量。

### 3. 配置 Google Sheets
确保：
- Google Service Account 已创建
- Service Account 有权限访问 Google Sheet
- Google Sheet 存在且工作表名为 `HereNow-Wait-List`
- Sheet 有 A 列（Email）和 B 列（Timestamp）

### 4. 测试功能
1. 启动开发服务器：`npm run dev`
2. 访问首页：http://localhost:3000
3. 点击 "Join Waiting List" 按钮
4. 输入邮箱并提交
5. 检查 Google Sheet 是否收到新记录

## 📋 功能特性

### 速率限制
- 每个 IP 地址在 10 秒内最多 2 次请求
- 使用 Vercel KV 进行速率限制
- 如果 KV 不可用，会跳过速率限制（fail open）

### 错误处理
- 邮箱格式验证
- 网络错误处理
- Google API 错误处理
- 用户友好的错误提示

### 数据存储
- 邮箱自动转换为小写并去除空格
- 时间戳使用 ISO 格式
- 数据追加到 Google Sheets 的 `HereNow-Wait-List` 工作表

## 🔧 故障排除

### 问题：依赖安装失败
**解决方案**：确保 Node.js 版本 >= 18，然后重新运行 `npm install`

### 问题：Google Sheets 写入失败
**检查清单**：
1. ✅ `GOOGLE_SERVICE_ACCOUNT_EMAIL` 是否正确
2. ✅ `GOOGLE_PRIVATE_KEY` 格式是否正确（包含 `\n` 换行符）
3. ✅ `GOOGLE_SPREADSHEET_ID` 是否正确
4. ✅ Service Account 是否有权限访问 Sheet
5. ✅ Sheet 中是否存在 `HereNow-Wait-List` 工作表

### 问题：速率限制不工作
**说明**：如果 Vercel KV 环境变量未设置，速率限制会被禁用，但功能仍然正常工作。

### 问题：API 返回 500 错误
**检查**：
1. 查看服务器控制台日志
2. 检查环境变量是否正确设置
3. 检查 Google Service Account 配置

## 📝 API 端点

**POST** `/api/waiting-list`

**请求体**：
```json
{
  "email": "user@example.com"
}
```

**成功响应** (200)：
```json
{
  "success": true,
  "message": "Successfully added to waiting list",
  "rateLimit": {
    "remaining": 1,
    "reset": 1234567890
  }
}
```

**错误响应** (400/429/500)：
```json
{
  "error": "Error message here"
}
```

## 🎯 下一步

1. 测试功能是否正常工作
2. 验证 Google Sheets 是否收到数据
3. 根据需要调整速率限制参数
4. 添加更多验证或功能（如邮箱重复检查）

