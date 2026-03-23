# 活动地址显示最佳实践（欧美优化版）

## 概述

针对活动举办场景，我们设计了一套智能的地址显示策略，优化支持欧美地址格式，确保用户能够快速识别活动地点，同时提供完整的地址信息。

## 欧美地址格式特点

- **格式**: `Street Number + Street Name, City, State, Postal Code, Country`
- **示例**: `123 Main Street, New York, NY 10001, United States`
- **优先级**: 门牌号在前，然后是街道名，最后是城市和州

## 设计原则

1. **场所名称优先** - 活动参与者最关心的是"在哪里举办"，而不是详细的街道地址
2. **信息层次化** - 主显示文本简洁，详细信息可展开查看
3. **智能格式化** - 根据可用信息自动选择最佳显示方式
4. **用户友好** - 去除冗余信息（如邮编），突出关键信息

## 显示策略

### 策略 1: 有场所名称 + 街道地址（最佳情况）
**场景**: 搜索到具体的活动场所（如会议中心、酒店）

**显示格式（欧美）**: `Venue Name, Street Address, City, State`

**示例**:
- `Convention Center, 123 Main Street, New York, NY`
- `Marriott Hotel, 399 Broadway, San Francisco, CA`
- `The Shard, 32 London Bridge Street, London, England`

**适用场景**: 
- 会议中心
- 酒店
- 餐厅/咖啡厅
- 其他具体场所

---

### 策略 2: 有场所名称 + 无街道地址，但有区域信息
**场景**: 有场所名称，但没有具体街道号

**显示格式（欧美）**: `Venue Name, City, State`

**示例**:
- `Times Square, New York, NY`
- `Golden Gate Park, San Francisco, CA`
- `Hyde Park, London, England`

**适用场景**:
- 地标建筑
- 公园
- 广场

---

### 策略 3: 有场所名称，但无详细地址信息
**场景**: 只有场所名称，地址信息不完整

**显示格式**: `场所名称, 附近区域` 或 `场所名称`

**示例**:
- `星巴克咖啡, 三里屯`
- `某活动场地`

**适用场景**:
- 知名连锁店
- 地址信息不完整的地点

---

### 策略 4: 无场所名称，但有街道地址
**场景**: 只有街道地址，没有具体场所名称

**显示格式（欧美）**: `Street Address, City, State`

**示例**:
- `123 Main Street, New York, NY`
- `399 Broadway, San Francisco, CA`
- `32 London Bridge Street, London, England`

**适用场景**:
- 普通地址
- 临时活动场地

---

### 策略 5: 使用格式化地址（去除邮编）
**场景**: 只有 Google 返回的完整格式化地址

**显示格式**: 格式化地址（自动去除邮编）

**支持的邮编格式**:
- **美国**: `12345` 或 `12345-6789`
- **英国**: `SW1A 1AA` 格式
- **加拿大**: `A1A 1A1` 格式
- **通用**: 4-6位数字邮编

**示例**:
- `123 Main Street, New York, NY`（邮编已去除）
- `32 London Bridge Street, London, England`（邮编已去除）

**适用场景**:
- 地址信息不完整的情况
- 兜底方案

---

### 策略 6: 使用附近区域
**场景**: 只有附近区域描述

**显示格式**: `附近区域`

**示例**:
- `三里屯`
- `中关村`

---

### 策略 7: 使用名称（最后备选）
**场景**: 只有名称信息

**显示格式**: `名称`

---

## 数据结构

### LocationCoordinates 接口

```typescript
interface LocationCoordinates {
  lat: number;                    // 纬度
  lng: number;                    // 经度
  placeId?: string;               // Google Place ID
  formattedAddress?: string;      // 完整格式化地址
  displayText?: string;           // 显示文本（格式化后的活动地址）
  subtitle?: string;              // 副标题（如"New York, NY"）
  venueName?: string;             // 场所名称
  streetAddress?: string;          // 街道地址
  city?: string;                   // 城市
  state?: string;                  // 州/省（欧美）
  country?: string;                // 国家
  postalCode?: string;             // 邮编
}
```

## 使用示例

### 在 LocationMap 组件中使用

```typescript
import { formatEventLocation } from './locationFormatter';

const formattedLocation = formatEventLocation({
  name: result.name,
  formatted_address: result.formatted_address,
  address_components: result.address_components,
  types: result.types,
  vicinity: result.vicinity
});

// 使用格式化后的显示文本
const locationText = formattedLocation.displayText;
```

### 在 UI 中显示

```tsx
{/* 主显示文本 */}
<div className="font-semibold">
  {locationCoordinates.displayText || location}
</div>

{/* 副标题（如果有） */}
{locationCoordinates.subtitle && (
  <div className="text-sm text-slate-500">
    {locationCoordinates.subtitle}
  </div>
)}

{/* 详细信息 */}
{locationCoordinates.venueName && (
  <div>场所: {locationCoordinates.venueName}</div>
)}
{locationCoordinates.streetAddress && (
  <div>地址: {locationCoordinates.streetAddress}</div>
)}
```

## 地址组件类型说明

Google Places API 返回的地址组件类型：

| 类型 | 说明 | 示例 |
|------|------|------|
| `street_number` | 街道号码 | "123" |
| `route` | 街道名称 | "朝阳路" |
| `sublocality` | 子区域/区 | "朝阳区" |
| `locality` | 城市 | "北京市" |
| `administrative_area_level_1` | 省/州 | "北京市" |
| `administrative_area_level_2` | 市/县 | "朝阳区" |
| `country` | 国家 | "中国" |
| `postal_code` | 邮政编码 | "100000" |

## 场所类型识别

系统会自动识别以下活动场所类型：

- **会议中心**: `convention_center`, `conference_center`
- **酒店**: `hotel`
- **餐厅**: `restaurant`, `cafe`, `bar`
- **娱乐场所**: `night_club`, `theater`, `auditorium`
- **体育场所**: `stadium`
- **公园**: `park`
- **博物馆**: `museum`

## 最佳实践建议

### 1. 主显示区域
- 使用 `displayText` 作为主要显示文本
- 保持简洁，不超过 2-3 行
- 突出场所名称

### 2. 详细信息区域
- 使用 `subtitle` 显示位置提示
- 使用 `venueName`、`streetAddress`、`city` 显示详细信息
- 在详情页或展开区域显示 `formattedAddress`

### 3. 搜索和匹配
- 使用 `extractLocationKeyInfo` 提取关键信息用于搜索
- 支持按场所名称、街道地址、城市进行搜索

### 4. 数据存储
- 保存完整的 `LocationCoordinates` 对象
- 包含所有字段以便后续使用和显示

## 调试

在浏览器控制台中，你可以看到：

1. **完整的 Google Places API 返回数据**
2. **格式化后的活动地址信息**:
   - 显示文本
   - 副标题
   - 完整地址
   - 关键信息（场所名称、街道地址、城市等）

## 未来扩展

可以考虑添加：

1. **多语言支持** - 根据用户语言偏好格式化地址
2. **地区习惯** - 不同地区的地址格式习惯（如中国、美国、欧洲）
3. **地址验证** - 验证地址是否适合举办活动
4. **交通信息** - 显示附近的交通信息（地铁、公交等）
5. **活动类型匹配** - 根据活动类型推荐合适的场所

