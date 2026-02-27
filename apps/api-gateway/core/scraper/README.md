# Luma 活动爬虫模块

## 概述

这个模块提供了从 Luma 活动平台爬取活动数据的功能，支持将爬取的数据自动映射并保存到 `events_v1` 表中。

## 功能特性

- ✅ 支持 `https://luma.com/xxx` 和 `https://lu.ma/xxx` 两种 URL 格式
- ✅ 使用 Playwright 进行浏览器自动化爬取
- ✅ 多种数据提取策略（JSON-LD、meta 标签、JavaScript 变量、DOM 元素）
- ✅ 自动重试机制（最多 3 次）
- ✅ 完整的数据映射到 `events_v1` 表结构
- ✅ 错误处理和超时控制

## 安装依赖

### 1. 安装 Python 依赖

```bash
pip install -r requirements.txt
```

### 2. 安装 Playwright 浏览器

Playwright 需要单独安装浏览器二进制文件：

```bash
playwright install chromium
```

或者安装所有浏览器：

```bash
playwright install
```

## API 使用

### 端点

`POST /api/v1/ai/import-from-link`

### 请求格式

```json
{
  "url": "https://luma.com/e61fd7lx",
  "host_id": "optional-uuid"  // 可选，默认使用当前用户
}
```

### 响应格式

```json
{
  "success": true,
  "data": {
    "id": "event-uuid",
    "slug": "event-slug",
    "title": "活动标题",
    "source_url": "https://luma.com/e61fd7lx"
  },
  "message": "活动导入成功"
}
```

### 错误响应

- `400 Bad Request`: URL 格式无效或不在允许列表中
- `401 Unauthorized`: 用户未登录
- `422 Unprocessable Entity`: 数据解析失败或必填字段缺失
- `502 Bad Gateway`: 无法访问活动页面
- `504 Gateway Timeout`: 爬取超时
- `500 Internal Server Error`: 服务器内部错误

## 数据映射

### Luma 数据 → events_v1 字段

| events_v1 字段 | Luma 数据源 | 说明 |
|---------------|------------|------|
| title | name | 活动名称 |
| slug | name (自动生成) | URL 友好的标识符 |
| description | description | 活动描述 |
| cover_image_url | cover_url | 封面图片 URL |
| start_at | start_at | 开始时间（ISO 格式） |
| end_at | end_at | 结束时间（ISO 格式） |
| timezone | timezone | 时区 |
| location_info | location_type + geo_address_info | 地点信息（虚拟/线下） |
| ticket_config | ticket_types | 票务配置 |
| co_hosts | hosts | 联合主办方 |
| visibility | visibility | 可见性（public/private） |
| require_approval | require_approval | 是否需要审批 |

## 配置

可以通过环境变量配置（可选）：

```env
LUMA_SCRAPER_TIMEOUT=30000  # 超时时间（毫秒），默认 30 秒
LUMA_SCRAPER_RETRY_COUNT=3  # 最大重试次数，默认 3 次
```

## 安全特性

1. **URL 白名单验证**: 只允许 `luma.com` 和 `lu.ma` 域名
2. **配额验证**: 需要消耗 "import" 类型的 AI 配额
3. **超时控制**: 防止长时间占用资源
4. **输入验证**: 严格验证 URL 格式和内容

## 数据提取策略

爬虫按以下优先级提取数据：

1. **JSON-LD 结构化数据**（如果页面包含）
2. **页面 meta 标签**（og:title, og:description 等）
3. **JavaScript 全局变量**（window.__INITIAL_STATE__ 等）
4. **DOM 元素**（CSS 选择器）

## 注意事项

1. **首次使用**: 需要先运行 `playwright install chromium` 安装浏览器
2. **性能**: 爬取过程可能需要几秒到几十秒，取决于网络和页面复杂度
3. **配额**: 每次导入会消耗一次 "import" 类型的 AI 配额
4. **错误处理**: 如果爬取失败，配额不会退回（这是预期行为）

## 开发调试

### 测试爬虫

```python
from core.scraper import LumaScraper

async def test_scraper():
    scraper = LumaScraper()
    try:
        data = await scraper.scrape("https://lu.ma/test-event")
        print(data)
    finally:
        await scraper.close()
```

### 测试数据映射

```python
from core.scraper import LumaDataMapper

mapper = LumaDataMapper()
event_data = mapper.map_to_events_v1(luma_data, host_id="user-uuid")
print(event_data)
```

## 故障排除

### 问题：Playwright 浏览器未安装

**错误**: `Executable doesn't exist`

**解决**: 运行 `playwright install chromium`

### 问题：页面加载超时

**错误**: `TimeoutError`

**解决**: 
- 检查网络连接
- 增加超时时间（修改 `LUMA_SCRAPER_TIMEOUT`）
- 检查 URL 是否可访问

### 问题：无法解析数据

**错误**: `ParseError`

**解决**: 
- 检查 Luma 页面结构是否变化
- 查看日志了解具体错误
- 可能需要更新选择器或提取逻辑

## 未来优化

- [ ] 缓存机制：相同 URL 的爬取结果缓存
- [ ] 异步任务队列：对于耗时较长的爬取，使用后台任务
- [ ] 增量更新：支持更新已存在的活动数据
- [ ] 多平台支持：扩展到其他活动平台（Eventbrite、Meetup 等）
