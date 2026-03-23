# Google Maps API 故障排查指南

## 常见错误："Google Places API 请求被拒绝"

如果你已经设置了 `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`，但仍然收到"请求被拒绝"的错误，请按照以下步骤排查：

### 1. 确认 API 已启用

访问 [Google Cloud Console - API 库](https://console.cloud.google.com/apis/library)，确保以下 API 已启用：

- ✅ **Places API** (必需)
  - 链接：https://console.cloud.google.com/apis/library/places-backend.googleapis.com
- ✅ **Maps JavaScript API** (必需)
  - 链接：https://console.cloud.google.com/apis/library/maps-javascript-backend.googleapis.com
- ✅ **Geocoding API** (可选，用于地址转坐标)
  - 链接：https://console.cloud.google.com/apis/library/geocoding-backend.googleapis.com

**启用步骤：**
1. 点击上面的链接
2. 选择你的项目
3. 点击"启用"按钮

### 2. 检查 API 密钥限制设置

访问 [Google Cloud Console - 凭据](https://console.cloud.google.com/apis/credentials)

#### 2.1 HTTP referrer 限制

如果你的 API 密钥设置了 **HTTP referrer 限制**，需要添加以下 URL：

**开发环境：**
```
http://localhost:3000/*
http://localhost:3000
http://127.0.0.1:3000/*
```

**生产环境：**
```
https://yourdomain.com/*
https://*.yourdomain.com/*
```

**设置步骤：**
1. 点击你的 API 密钥
2. 在"应用程序限制"中选择"HTTP 引荐来源网址（网站）"
3. 添加上述 URL
4. 点击"保存"

#### 2.2 API 限制

如果你的 API 密钥设置了 **API 限制**，需要确保包含：

- ✅ Places API
- ✅ Maps JavaScript API
- ✅ Geocoding API (如果使用)

**设置步骤：**
1. 点击你的 API 密钥
2. 在"API 限制"中选择"限制密钥"
3. 选择上述 API
4. 点击"保存"

**注意：** 如果选择"不限制密钥"，则不需要设置 API 限制，但安全性较低。

### 3. 启用计费账户

**重要：** Places API 需要启用计费账户才能使用（即使有免费额度）。

**启用步骤：**
1. 访问 [Google Cloud Console - 结算](https://console.cloud.google.com/billing)
2. 创建或关联结算账户
3. 添加付款方式（即使使用免费额度也需要）

**免费额度：**
- Maps JavaScript API: 每月 28,000 次加载免费
- Places API: 每月 $200 免费额度（约 17,000 次请求）

### 4. 验证 API 密钥

在浏览器控制台中运行以下代码，检查 API 密钥是否正确：

```javascript
// 检查 API 密钥是否存在
console.log('API Key:', process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? '已设置' : '未设置');

// 检查 Google Maps 是否加载
console.log('Google Maps:', typeof google !== 'undefined' ? '已加载' : '未加载');

// 检查 Places API 是否可用
if (typeof google !== 'undefined') {
  console.log('Places Service:', google.maps.places ? '可用' : '不可用');
}
```

### 5. 检查网络和防火墙

- 确保网络可以访问 `maps.googleapis.com`
- 检查防火墙或代理设置
- 尝试在无痕模式下访问

### 6. 等待生效

API 设置更改后，可能需要几分钟才能生效。如果刚修改了设置，请：
1. 等待 2-5 分钟
2. 清除浏览器缓存
3. 刷新页面重试

### 7. 查看详细错误信息

在浏览器控制台（F12）中查看详细错误信息：

```javascript
// 查看 Google Maps 加载状态
console.log('Google Maps Status:', {
  scriptLoaded: !!document.getElementById('google-maps-script'),
  googleAvailable: typeof google !== 'undefined',
  placesAvailable: typeof google !== 'undefined' && !!google.maps.places
});
```

### 8. 测试 API 密钥

使用 curl 测试 API 密钥是否有效：

```bash
# 替换 YOUR_API_KEY 为你的实际 API 密钥
curl "https://maps.googleapis.com/maps/api/place/autocomplete/json?input=beijing&key=YOUR_API_KEY"
```

如果返回错误，检查错误信息：
- `REQUEST_DENIED`: API 未启用或限制设置问题
- `OVER_QUERY_LIMIT`: 配额超限
- `INVALID_REQUEST`: API 密钥无效

## 快速检查清单

- [ ] Places API 已启用
- [ ] Maps JavaScript API 已启用
- [ ] API 密钥 HTTP referrer 限制包含 localhost（开发环境）
- [ ] API 密钥 API 限制包含 Places API（如果设置了限制）
- [ ] 已启用计费账户
- [ ] 环境变量 `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` 已设置
- [ ] 已重启开发服务器
- [ ] 等待了几分钟让设置生效

## 仍然无法解决？

1. **检查控制台错误**：打开浏览器开发者工具（F12），查看 Console 标签页的详细错误
2. **检查网络请求**：在 Network 标签页查看对 `maps.googleapis.com` 的请求，查看响应内容
3. **查看 Google Cloud Console 日志**：在 API 和服务 > 使用情况中查看 API 调用日志
4. **联系支持**：如果以上步骤都无法解决，可能是 API 密钥本身的问题，需要重新创建

## 相关链接

- [Google Maps Platform 文档](https://developers.google.com/maps/documentation)
- [Places API 文档](https://developers.google.com/maps/documentation/places/web-service)
- [API 密钥最佳实践](https://developers.google.com/maps/api-security-best-practices)
- [计费和配额](https://developers.google.com/maps/billing-and-pricing/pricing)

