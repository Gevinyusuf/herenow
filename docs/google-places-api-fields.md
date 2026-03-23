# Google Places API 返回字段说明

## 概述
Google Places API (PlacesService.getDetails) 可以返回以下字段。在请求时需要明确指定要获取的字段（使用 `fields` 参数）。

## 基础字段 (Basic Fields)

### 1. **address_components** (地址组件)
```typescript
Array<{
  long_name: string;      // 完整名称，如 "北京市"
  short_name: string;      // 简短名称，如 "北京"
  types: string[];         // 类型数组，如 ["locality", "political"]
}>
```
**常用类型：**
- `street_number` - 街道号码
- `route` - 街道名称
- `locality` - 城市/地区
- `administrative_area_level_1` - 省/州
- `administrative_area_level_2` - 市/县
- `country` - 国家
- `postal_code` - 邮政编码
- `neighborhood` - 社区
- `sublocality` - 子区域

### 2. **adr_address** (结构化地址)
- 类型: `string`
- 说明: HTML 格式的结构化地址

### 3. **business_status** (营业状态)
- 类型: `string`
- 可能值: `OPERATIONAL`, `CLOSED_TEMPORARILY`, `CLOSED_PERMANENTLY`

### 4. **formatted_address** (格式化地址)
- 类型: `string`
- 说明: 完整格式化的地址，如 "北京市朝阳区xxx路123号"
- **当前代码使用**: ✅

### 5. **geometry** (几何信息)
```typescript
{
  location: {
    lat(): number;  // 纬度
    lng(): number;  // 经度
  },
  viewport: {
    getNorthEast(): { lat(): number; lng(): number; },
    getSouthWest(): { lat(): number; lng(): number; }
  },
  location_type?: string  // 位置类型
}
```
- **当前代码使用**: ✅ (获取 lat/lng)

### 6. **icon** (图标 URL)
- 类型: `string`
- 说明: 地点类型的图标 URL

### 7. **icon_background_color** (图标背景色)
- 类型: `string`
- 说明: 十六进制颜色代码

### 8. **icon_mask_base_uri** (图标遮罩 URI)
- 类型: `string`

### 9. **name** (名称)
- 类型: `string`
- 说明: 地点名称，如 "北京会议中心"
- **当前代码使用**: ✅

### 10. **place_id** (地点 ID)
- 类型: `string`
- 说明: 唯一的地点标识符
- **当前代码使用**: ✅

### 11. **plus_code** (Plus Code)
```typescript
{
  compound_code: string;  // 如 "8Q7X+2P 北京"
  global_code: string;    // 如 "8Q7X+2P"
}
```

### 12. **types** (类型数组)
- 类型: `string[]`
- 说明: 地点类型列表，如 `["establishment", "point_of_interest", "restaurant"]`
- **当前代码使用**: ✅

### 13. **url** (Google Maps URL)
- 类型: `string`
- 说明: 在 Google Maps 上查看该地点的 URL

### 14. **vicinity** (附近区域)
- 类型: `string`
- 说明: 附近区域描述
- **当前代码使用**: ✅

## 联系信息字段 (Contact Fields)

### 15. **formatted_phone_number** (格式化电话号码)
- 类型: `string`
- 说明: 格式化的电话号码，如 "+86 10 1234 5678"

### 16. **international_phone_number** (国际电话号码)
- 类型: `string`
- 说明: 国际格式的电话号码

### 17. **opening_hours** (营业时间)
```typescript
{
  open_now: boolean;           // 当前是否营业
  periods: Array<{
    open: { day: number; time: string; },
    close: { day: number; time: string; }
  }>;
  weekday_text: string[];      // 工作日文本描述
}
```

### 18. **secondary_opening_hours** (次要营业时间)
- 类型: 同 `opening_hours`

### 19. **website** (网站)
- 类型: `string`
- 说明: 官方网站 URL

## 氛围字段 (Atmosphere Fields)

### 20. **current_opening_hours** (当前营业时间)
- 类型: 同 `opening_hours`

### 21. **price_level** (价格等级)
- 类型: `number`
- 说明: 0-4，表示价格等级（通常用于餐厅等）

### 22. **rating** (评分)
- 类型: `number`
- 说明: 0-5 的评分

### 23. **user_ratings_total** (用户评分总数)
- 类型: `number`
- 说明: 总评分数量

### 24. **reviews** (评论)
```typescript
Array<{
  author_name: string;
  author_url?: string;
  language: string;
  profile_photo_url?: string;
  rating: number;
  relative_time_description: string;
  text: string;
  time: number;
}>
```

## 其他字段

### 25. **editorial_summary** (编辑摘要)
- 类型: `string`
- 说明: 地点的简短描述

### 26. **photos** (照片)
```typescript
Array<{
  height: number;
  html_attributions: string[];
  photo_reference: string;
  width: number;
  getUrl(options?: { maxWidth?: number; maxHeight?: number }): string;
}>
```

### 27. **wheelchair_accessible_entrance** (轮椅无障碍入口)
- 类型: `boolean`

### 28. **utc_offset** (UTC 偏移)
- 类型: `number`
- 说明: 分钟数，如 480 表示 UTC+8

## 当前代码使用的字段

在 `LocationMap.tsx` 中，当前请求的字段：
```typescript
fields: [
  'name',                    // ✅ 地点名称
  'formatted_address',        // ✅ 格式化地址
  'geometry',                // ✅ 坐标信息
  'place_id',                // ✅ 地点ID
  'address_components',       // ✅ 地址组件
  'types',                   // ✅ 类型
  'vicinity'                 // ✅ 附近区域
]
```

## 建议扩展的字段

如果需要更丰富的信息，可以考虑添加：

```typescript
fields: [
  // 基础字段
  'name',
  'formatted_address',
  'geometry',
  'place_id',
  'address_components',
  'types',
  'vicinity',
  
  // 联系信息
  'formatted_phone_number',
  'website',
  
  // 营业信息
  'opening_hours',
  'business_status',
  
  // 评价信息
  'rating',
  'user_ratings_total',
  'reviews',
  
  // 其他
  'photos',
  'url',
  'plus_code'
]
```

## 注意事项

1. **字段限制**: 每次请求最多可以指定多个字段，但建议只请求需要的字段以减少 API 调用成本
2. **计费**: 某些字段可能影响计费，详细查看 Google 文档
3. **可用性**: 不是所有地点都有所有字段，某些字段可能为 `null` 或 `undefined`
4. **类型安全**: 建议在使用时进行类型检查和空值处理

## 示例：完整的返回对象结构

```typescript
{
  address_components: [...],
  adr_address: "...",
  business_status: "OPERATIONAL",
  formatted_address: "北京市朝阳区xxx路123号",
  geometry: {
    location: { lat(): 39.9042, lng(): 116.4074 },
    viewport: {...}
  },
  icon: "https://maps.gstatic.com/mapfiles/place_api/icons/...",
  name: "北京会议中心",
  place_id: "ChIJ...",
  plus_code: {...},
  types: ["establishment", "point_of_interest"],
  url: "https://maps.google.com/?cid=...",
  vicinity: "朝阳区",
  formatted_phone_number: "+86 10 1234 5678",
  website: "https://example.com",
  opening_hours: {...},
  rating: 4.5,
  user_ratings_total: 1234,
  reviews: [...],
  photos: [...]
}
```

