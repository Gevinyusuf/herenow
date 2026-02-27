# Home 页面数据加载最佳实践

## `isLoading` 的作用

`isLoading` 是一个**UI 状态标志**，用于：

1. **显示加载指示器**：告诉用户数据正在加载中
2. **防止重复操作**：在加载期间禁用某些操作（如刷新按钮）
3. **优化用户体验**：避免在数据未准备好时显示空白或错误内容

### 为什么需要 `isLoading`？

```typescript
// ❌ 不好的做法：没有加载状态
const [data, setData] = useState(null);

useEffect(() => {
  fetchData().then(setData);
}, []);

// 问题：在数据加载完成前，data 是 null，页面可能显示错误或空白
return <div>{data.items.map(...)}</div>; // 如果 data 是 null，会报错

// ✅ 好的做法：使用加载状态
const [data, setData] = useState(null);
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  setIsLoading(true);
  fetchData()
    .then(setData)
    .finally(() => setIsLoading(false));
}, []);

// 根据加载状态显示不同内容
if (isLoading) return <LoadingSpinner />;
if (!data) return <EmptyState />;
return <div>{data.items.map(...)}</div>;
```

## 使用 SWR 的最佳实践

### 为什么使用 SWR？

1. **自动缓存**：相同的数据不会重复请求
2. **自动重新验证**：页面聚焦时自动刷新数据
3. **去重请求**：短时间内相同请求会自动去重
4. **更好的错误处理**：统一的错误处理机制
5. **乐观更新**：可以先更新 UI，再验证数据

### SWR 使用示例

```typescript
import useSWR from 'swr';

// 1. 定义 fetcher 函数
const fetcher = async () => {
  const response = await fetch('/api/data');
  return response.json();
};

// 2. 使用 SWR Hook
const { data, error, isLoading, mutate } = useSWR(
  'data-key', // 缓存 key（唯一标识）
  fetcher,    // fetcher 函数
  {
    revalidateOnFocus: true,    // 窗口聚焦时重新验证
    revalidateOnReconnect: true, // 网络重连时重新验证
    dedupingInterval: 5000,     // 5秒内相同请求去重
    onSuccess: (data) => {
      // 数据加载成功时的回调
      console.log('数据加载成功:', data);
    },
    onError: (error) => {
      // 数据加载失败时的回调
      console.error('数据加载失败:', error);
    }
  }
);

// 3. 使用数据
if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
return <DataDisplay data={data} />;
```

### 手动刷新数据

```typescript
// 使用 mutate 函数手动刷新
const { mutate } = useSWR('data-key', fetcher);

// 刷新数据
await mutate();

// 或者乐观更新（先更新 UI，再验证）
mutate(newData, false); // false 表示不立即重新验证
// ... 执行某些操作
await mutate(); // 重新验证数据
```

## 数据格式说明

### 后端返回格式

```json
{
  "success": true,
  "data": {
    "events": {
      "upcoming": [
        {
          "id": 1,
          "title": "活动名称",
          "date": "NOV 14",
          "time": "7:00 PM",
          "location": "地点",
          "imageColor": "from-blue-400 to-purple-500",
          "category": "this-week",
          "isPinned": false,
          "registrationCount": 10,
          "coverImageUrl": "https://..."
        }
      ],
      "past": [...]
    },
    "communities": {
      "myCommunities": [...],
      "joinedCommunities": [...]
    }
  }
}
```

### 前端处理

`getHomeData()` 函数会自动提取 `data` 字段，所以前端收到的格式是：

```typescript
{
  events: {
    upcoming: [...],
    past: [...]
  },
  communities: {
    myCommunities: [...],
    joinedCommunities: [...]
  }
}
```

## 调试技巧

### 1. 检查数据是否正确返回

在浏览器控制台查看：
- `📊 SWR 获取到的首页数据:` - 查看完整数据
- `📅 活动数据:` - 查看活动数据详情
- `⚠️ 返回数据中没有 events 字段` - 如果看到这个，说明数据格式不对

### 2. 检查网络请求

在浏览器开发者工具的 Network 标签中：
- 查看 `/api/v1/home/all` 请求
- 检查响应状态码（应该是 200）
- 查看响应体格式是否正确

### 3. 常见问题

**问题：数据加载成功但页面不显示**

可能原因：
1. 数据格式不匹配（检查控制台日志）
2. 条件渲染逻辑有问题
3. CSS 样式隐藏了内容

解决方案：
```typescript
// 添加调试日志
console.log('eventsData:', eventsData);
console.log('upcoming count:', eventsData.upcoming?.length);
console.log('past count:', eventsData.past?.length);

// 检查数据是否存在
if (eventsData.upcoming?.length === 0 && eventsData.past?.length === 0) {
  console.warn('数据为空，显示空状态');
}
```

## 性能优化建议

1. **使用 SWR 缓存**：避免重复请求
2. **设置合理的去重间隔**：`dedupingInterval: 5000`
3. **按需重新验证**：只在必要时刷新数据
4. **使用乐观更新**：先更新 UI，再验证数据

## 总结

- ✅ 使用 SWR 管理数据获取
- ✅ 使用 `isLoading` 显示加载状态
- ✅ 添加详细的调试日志
- ✅ 处理错误和空数据状态
- ✅ 使用乐观更新提升用户体验

