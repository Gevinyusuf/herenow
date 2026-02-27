/**
 * 活动数据转换工具
 * 将前端 EventData 格式转换为符合数据库 events_v1 表结构的 API 请求格式
 */

// 定义与前端 EventData 接口匹配的类型
interface Ticket {
  id: number;
  name: string;
  type: 'free' | 'paid';
  price: string;
  quantity: string;
  requireApproval: boolean;
  saveToTemplate: boolean;
}

interface Question {
  id: string;
  label: string;
  required: boolean;
  fixed: boolean;
  saveToTemplate: boolean;
}

interface Theme {
  id: string;
  name: string;
  category: string;
  bg: string;
  contentBg: string;
  text: string;
  button: string;
  preview: string;
}

export interface EventData {
  eventName: string;
  coverImage: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  location: string;
  description: string;
  tickets: Ticket[];
  questions: Question[];
  host: { id: string; name: string; type: string; icon: any };
  coHosts: any[];
  selectedTheme: Theme;
  selectedEffect: string;
  selectedTimezone: { id: string; city: string; offset: string; currentTime: string };
  visibility: 'public' | 'private';
  isVirtual: boolean;
  meetingLink: string;
  requireApproval: boolean;
  isLocationPublic?: boolean; // 地点是否公开（注册后可见 vs 所有人可见）
}

/**
 * 生成 URL 友好的 slug
 */
function generateSlug(title: string): string {
  // 转换为小写，替换非字母数字字符为连字符
  let slug = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // 移除特殊字符
    .replace(/[\s_-]+/g, '-') // 将空格、下划线、连字符替换为单个连字符
    .replace(/^-+|-+$/g, ''); // 移除开头和结尾的连字符
  
  // 添加时间戳确保唯一性
  const timestamp = Date.now().toString(36);
  slug = `${slug}-${timestamp}`;
  
  return slug;
}

/**
 * 组合日期和时间为 ISO 8601 格式
 */
function combineDateTime(date: string, time: string, timezone: string): string {
  // 创建日期时间字符串: "2025-11-19T20:00:00"
  const dateTimeString = `${date}T${time}:00`;
  
  // 使用本地时间创建 Date 对象
  // 注意：这里假设前端输入的日期时间已经是用户所在时区的时间
  // 如果需要更精确的时区处理，可以使用 date-fns-tz 或类似库
  const localDate = new Date(dateTimeString);
  
  // 返回 ISO 8601 格式字符串
  return localDate.toISOString();
}

/**
 * 转换前端 EventData 为 API 请求格式
 */
export function transformEventDataForAPI(eventData: EventData): any {
  // 生成 slug
  const slug = generateSlug(eventData.eventName);
  
  // 组合时间
  const startAt = combineDateTime(
    eventData.startDate,
    eventData.startTime,
    eventData.selectedTimezone.id
  );
  const endAt = combineDateTime(
    eventData.endDate,
    eventData.endTime,
    eventData.selectedTimezone.id
  );
  
  // 构建地点信息
  const locationInfo = eventData.isVirtual
    ? {
        type: "virtual",
        link: eventData.meetingLink
      }
    : {
        type: "offline",
        name: eventData.location,
        isPublic: eventData.isLocationPublic || false, // 地点是否公开
        // 注意：如果需要存储经纬度，需要从 Google Places API 获取
        // lat: number,
        // lng: number
      };
  
  // 构建主题和特效配置
  const styleConfig = {
    themeId: eventData.selectedTheme.id,
    effect: eventData.selectedEffect,
    colors: {
      bg: eventData.selectedTheme.bg,
      contentBg: eventData.selectedTheme.contentBg,
      text: eventData.selectedTheme.text,
      button: eventData.selectedTheme.button
    },
    preview: eventData.selectedTheme.preview
  };
  
  // 构建报名表单字段
  const registrationFields = eventData.questions.map(q => ({
    id: q.id,
    label: q.label,
    required: q.required,
    fixed: q.fixed
    // saveToTemplate 是前端模板功能，不需要存到数据库
  }));
  
  // 构建票务配置（如果 tickets 需要存储）
  const ticketConfig = {
    tickets: eventData.tickets.map(t => ({
      id: t.id,
      name: t.name,
      type: t.type,
      price: t.type === 'paid' ? parseFloat(t.price) || 0 : 0,
      quantity: t.quantity ? parseInt(t.quantity) : null, // null 表示无限制
      requireApproval: t.requireApproval
    }))
  };
  
  // 构建联合主办方配置（如果 coHosts 需要存储）
  const coHostsConfig = eventData.coHosts.length > 0
    ? {
        coHosts: eventData.coHosts.map(ch => ({
          id: ch.id,
          name: ch.name
        }))
      }
    : null;
  
  // 构建完整的 API 请求体
  const apiPayload: any = {
    // 基础信息
    title: eventData.eventName,
    slug,
    description: eventData.description,
    cover_image_url: eventData.coverImage,
    
    // 时间信息
    start_at: startAt,
    end_at: endAt,
    timezone: eventData.selectedTimezone.id,
    
    // 地点信息
    location_info: locationInfo,
    
    // 可见性和权限
    visibility: eventData.visibility,
    require_approval: eventData.requireApproval,
    host_id: eventData.host.id,
    
    // 主题和特效配置
    style_config: styleConfig,
    
    // 报名表单配置
    registration_fields: registrationFields,
    
    // 票务配置（可选，如果后端支持）
    ticket_config: ticketConfig,
  };
  
  // 如果有联合主办方，添加到请求体中
  if (coHostsConfig) {
    apiPayload.co_hosts = coHostsConfig.coHosts;
  }
  
  return apiPayload;
}

