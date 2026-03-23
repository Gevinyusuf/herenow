# 请求优化说明

## 问题分析

刷新 home 页面时发现：
- `all` 接口被调用了 **3 次**
- `user` 表查询了 **2 次**
- `v_user_entitlements` 查询了 **2-3 次**

## 原因分析

### 1. React StrictMode 导致的重复渲染
在开发环境下，React StrictMode 会故意执行两次 useEffect，导致：
- 组件挂载 → 卸载 → 重新挂载
- 每次挂载都会触发数据请求

### 2. SWR 配置不当
- `revalidateOnFocus: true` 导致窗口聚焦时重新请求
- `dedupingInterval` 设置过短，无法有效去重
- 没有禁用开发环境下的自动重新验证

### 3. 多个组件同时请求
- `useEntitlements` hook 在多个地方使用
- 每个组件实例都会发起独立的请求

## 优化方案

### 1. 优化 SWR 配置

```typescript
// ✅ 优化后的配置
{
  dedupingInterval: 10000, // 10秒去重（关键！）
  revalidateOnFocus: false, // 关闭聚焦时重新验证
  revalidateIfStale: false, // 关闭自动重新验证
  errorRetryCount: 2, // 减少重试次数
}
```

**关键点：**
- `dedupingInterval: 10000` - 10秒内相同请求只执行一次，有效防止 React StrictMode 导致的重复请求
- `revalidateOnFocus: false` - 首页数据不需要在窗口聚焦时刷新
- `revalidateIfStale: false` - 避免不必要的自动刷新

### 2. 优化用户获取逻辑

**之前：**
```typescript
// ❌ 每次都发起网络请求
const { data: { user } } = await supabase.auth.getUser();
```

**优化后：**
```typescript
// ✅ 优先从本地存储读取，减少网络请求
const { data: { session } } = await supabase.auth.getSession();
if (session?.user) {
  setUser(session.user); // 从本地读取，无网络请求
} else {
  const { data: { user } } = await supabase.auth.getUser(); // 只在必要时请求
  setUser(user);
}
```

### 3. 统一缓存 Key

确保所有使用相同数据的组件使用相同的 SWR key：

```typescript
// ✅ 使用全局唯一的 key
useSWR('home-data', getHomeData); // 所有组件共享同一份数据

// ❌ 避免使用动态 key（除非数据真的不同）
useSWR(['home-data', userId], getHomeData); // 如果 userId 相同，应该使用 'home-data'
```

### 4. 优化 useEntitlements Hook

```typescript
// ✅ 优化后的配置
const { data, isLoading, mutate } = useSWR(
  user ? ['entitlements', user.id] : null, 
  fetcher,
  {
    dedupingInterval: 30000, // 30秒去重（权限数据变化频率低）
    revalidateOnFocus: false, // 关闭聚焦时重新验证
    revalidateIfStale: false, // 关闭自动重新验证
  }
);
```

## 优化效果

### 优化前
- `all` 接口：**3 次请求**
- `user` 查询：**2 次请求**
- `v_user_entitlements` 查询：**2-3 次请求**

### 优化后（预期）
- `all` 接口：**1 次请求**（10秒内去重）
- `user` 查询：**1 次请求**（优先使用 getSession）
- `v_user_entitlements` 查询：**1 次请求**（30秒内去重）

## 最佳实践总结

### 1. SWR 配置原则

```typescript
// 根据数据特性选择配置
const config = {
  // 高频变化数据（如实时数据）
  realtime: {
    dedupingInterval: 5000,
    refreshInterval: 30000,
  },
  
  // 低频变化数据（如权限数据）
  entitlements: {
    dedupingInterval: 30000,
    refreshInterval: 0,
  },
  
  // 中等频率数据（如首页数据）
  homeData: {
    dedupingInterval: 10000,
    refreshInterval: 0,
  },
};
```

### 2. 避免重复请求的技巧

1. **使用统一的缓存 Key**
   - 相同数据使用相同的 key
   - 不同数据使用不同的 key

2. **合理设置去重间隔**
   - 高频数据：5-10秒
   - 低频数据：30-60秒

3. **关闭不必要的自动刷新**
   - `revalidateOnFocus: false` - 除非数据需要实时更新
   - `revalidateIfStale: false` - 除非数据会过期

4. **优先使用本地数据**
   - 使用 `getSession()` 而不是 `getUser()`
   - 使用缓存的数据而不是重新请求

### 3. 调试技巧

在浏览器控制台查看：
- SWR 的请求日志
- 网络请求的发起者（Initiator）
- 请求的时间间隔

如果看到相同请求在短时间内多次发起，检查：
1. SWR 的 `dedupingInterval` 是否设置正确
2. 是否有多个组件使用不同的 key
3. 是否有手动触发的 `mutate()` 调用

## 验证方法

1. **打开浏览器开发者工具**
   - Network 标签
   - 筛选 XHR/Fetch 请求

2. **刷新页面**
   - 观察请求数量
   - 检查请求时间间隔

3. **预期结果**
   - 每个接口只请求一次
   - 请求时间间隔 > 去重间隔

## 注意事项

1. **开发环境 vs 生产环境**
   - 开发环境：React StrictMode 会导致重复渲染
   - 生产环境：不会重复渲染，但配置仍然重要

2. **缓存失效**
   - 数据更新后，使用 `mutate()` 手动刷新
   - 不要依赖自动刷新，除非数据真的需要实时更新

3. **错误处理**
   - 设置合理的 `errorRetryCount`
   - 避免无限重试导致请求风暴

