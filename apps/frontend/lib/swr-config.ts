/**
 * SWR 全局配置
 * 用于统一管理所有 SWR 请求的默认配置
 */
import { SWRConfiguration } from 'swr';

// 判断是否为开发环境
const isDev = process.env.NODE_ENV === 'development';

/**
 * SWR 全局默认配置
 * 
 * 最佳实践：
 * 1. dedupingInterval: 请求去重间隔，避免短时间内重复请求
 * 2. revalidateOnFocus: 开发环境关闭，生产环境开启（提升用户体验）
 * 3. revalidateOnReconnect: 网络重连时重新验证
 * 4. errorRetryCount: 错误重试次数
 * 5. errorRetryInterval: 错误重试间隔
 */
export const swrConfig: SWRConfiguration = {
  // 请求去重间隔：10秒内相同请求只执行一次
  dedupingInterval: 10000,
  
  // 窗口聚焦时重新验证（开发环境关闭，避免干扰调试）
  revalidateOnFocus: !isDev,
  
  // 网络重连时重新验证
  revalidateOnReconnect: true,
  
  // 页面可见性变化时重新验证（开发环境关闭）
  revalidateIfStale: !isDev,
  
  // 错误重试配置
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  
  // 保持数据新鲜度（5分钟）
  refreshInterval: 0, // 默认不自动刷新，按需开启
  
  // 错误处理
  onError: (error, key) => {
    // 只在生产环境或重要错误时上报
    if (!isDev) {
      console.error(`SWR Error [${key}]:`, error);
    }
  },
  
  // 成功回调（可选，用于调试）
  onSuccess: isDev ? (data, key) => {
    console.log(`✅ SWR Success [${key}]:`, data);
  } : undefined,
};

/**
 * 获取特定场景的 SWR 配置
 */
export const getSWRConfig = {
  // 首页数据配置（需要频繁更新）
  homeData: (): SWRConfiguration => ({
    ...swrConfig,
    dedupingInterval: 10000, // 10秒去重
    revalidateOnFocus: false, // 首页数据不需要在聚焦时刷新
  }),
  
  // 用户权限数据配置（变化频率低）
  entitlements: (): SWRConfiguration => ({
    ...swrConfig,
    dedupingInterval: 30000, // 30秒去重（权限数据变化少）
    revalidateOnFocus: false, // 权限数据不需要在聚焦时刷新
    refreshInterval: 0, // 不自动刷新
  }),
  
  // 实时数据配置（需要频繁更新）
  realtime: (): SWRConfiguration => ({
    ...swrConfig,
    dedupingInterval: 5000, // 5秒去重
    refreshInterval: 30000, // 30秒自动刷新
  }),
};

