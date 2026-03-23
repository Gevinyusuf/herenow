# Google Maps API 配置指南

## 概述

创建活动页面已集成 Google Maps API，提供以下功能：
- 🔍 地点自动完成搜索（Autocomplete）
- 📍 地点详情获取（包括坐标）
- 🗺️ 地图预览显示
- 💾 坐标信息保存

## 配置步骤

### 1. 获取 Google Maps API 密钥

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用以下 API：
   - **Maps JavaScript API**
   - **Places API**
   - **Geocoding API**（可选，用于地址转坐标）
4. 创建 API 密钥：
   - 转到"凭据"页面
   - 点击"创建凭据" > "API 密钥"
   - 复制生成的 API 密钥

### 2. 配置 API 密钥限制（推荐）

为了安全，建议为 API 密钥设置限制：

1. 点击刚创建的 API 密钥进行编辑
2. 设置**应用程序限制**：
   - 选择"HTTP 引荐来源网址（网站）"
   - 添加你的域名（如：`https://yourdomain.com/*`）
   - 开发环境可添加：`http://localhost:3000/*`
3. 设置**API 限制**：
   - 选择"限制密钥"
   - 仅选择需要的 API：
     - Maps JavaScript API
     - Places API
     - Geocoding API（如果使用）

### 3. 配置环境变量

在 `apps/frontend/.env.local` 文件中添加：

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

**注意**：
- 变量名必须以 `NEXT_PUBLIC_` 开头，才能在客户端访问
- 不要将 `.env.local` 文件提交到 Git（已在 `.gitignore` 中）

### 4. 重启开发服务器

配置完成后，重启 Next.js 开发服务器：

```bash
cd apps/frontend
pnpm dev
```

## 功能说明

### 地点搜索

- 输入地点名称时，会自动调用 Google Places Autocomplete API
- 显示地点建议列表
- 支持保存常用地点

### 地点选择

选择地点后，系统会：
1. 获取地点的详细信息（名称、地址）
2. 获取地点的坐标（经纬度）
3. 保存 `place_id` 用于后续查询
4. 保存格式化地址

### 地图预览

- 点击"显示地图"按钮可查看地点在地图上的位置
- 地图会显示标记和信息窗口
- 支持缩放和拖拽

### 坐标信息

选择地点后，坐标信息会保存在 `eventData.locationCoordinates` 中：

```typescript
{
  lat: number;           // 纬度
  lng: number;          // 经度
  placeId?: string;     // Google Place ID
  formattedAddress?: string;  // 格式化地址
}
```

## 错误处理

如果 API 密钥未配置或加载失败，页面会显示友好的错误提示：
- 提示用户配置 API 密钥
- 说明配置位置和步骤
- 地点搜索功能会降级为本地搜索（使用预设地点列表）

## 费用说明

Google Maps API 提供免费额度：
- **Maps JavaScript API**: 每月 28,000 次加载免费
- **Places API**: 每月 $200 免费额度（约 17,000 次请求）

超出免费额度后按使用量收费。建议：
- 设置 API 密钥限制防止滥用
- 监控 API 使用情况
- 考虑实现缓存机制减少 API 调用

## 故障排查

### API 未加载

**症状**：控制台显示 "Google Maps API key not found"

**解决方案**：
1. 检查 `.env.local` 文件是否存在
2. 确认变量名正确：`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
3. 确认 API 密钥有效
4. 重启开发服务器

### 地点搜索不工作

**症状**：输入地点名称没有建议

**解决方案**：
1. 检查浏览器控制台是否有错误
2. 确认 Places API 已启用
3. 检查 API 密钥限制设置
4. 确认 API 密钥有访问 Places API 的权限

### 地图不显示

**症状**：点击"显示地图"后地图区域空白

**解决方案**：
1. 检查 Maps JavaScript API 是否已启用
2. 确认 API 密钥有效
3. 检查浏览器控制台错误信息
4. 确认网络连接正常

## 相关文件

- `apps/frontend/app/(main)/create/event/page.tsx` - 主页面组件
- `apps/frontend/lib/api/client.ts` - API 客户端（包含坐标信息传递）

## 参考资料

- [Google Maps JavaScript API 文档](https://developers.google.com/maps/documentation/javascript)
- [Places API 文档](https://developers.google.com/maps/documentation/places/web-service)
- [Google Cloud Console](https://console.cloud.google.com/)

