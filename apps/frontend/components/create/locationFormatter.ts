/**
 * 活动场景地址格式化工具
 * 针对活动举办场景，智能格式化地址显示
 * 优化支持欧美地址格式
 */

export interface AddressComponents {
  long_name: string;
  short_name: string;
  types: string[];
}

export interface PlaceResult {
  name?: string;
  formatted_address?: string;
  address_components?: AddressComponents[];
  types?: string[];
  vicinity?: string;
}

/**
 * 检测地址所在国家/地区
 */
function detectCountry(components: AddressComponents[]): {
  country: string | null;
  isUS: boolean;
  isUK: boolean;
  isEU: boolean;
} {
  const country = getAddressComponent(components, 'country');
  const countryCode = components.find(c => c.types.includes('country'))?.short_name || '';
  
  const isUS = countryCode === 'US' || country === 'United States';
  const isUK = countryCode === 'GB' || country === 'United Kingdom';
  const isEU = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 
                 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 
                 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'].includes(countryCode);
  
  return {
    country: country || null,
    isUS,
    isUK,
    isEU
  };
}

/**
 * 从地址组件中提取特定类型的值
 */
function getAddressComponent(
  components: AddressComponents[],
  type: string
): string | null {
  if (!components) return null;
  const component = components.find(c => c.types.includes(type));
  return component ? component.long_name : null;
}

/**
 * 判断是否为活动场所类型
 */
function isVenueType(types: string[] = []): boolean {
  const venueTypes = [
    'establishment',        // 机构
    'point_of_interest',    // 兴趣点
    'premise',              // 场所
    'subpremise',           // 子场所
  ];
  return venueTypes.some(type => types.includes(type));
}

/**
 * 判断是否为具体活动场所（会议中心、酒店等）
 */
function isSpecificVenue(types: string[] = []): boolean {
  const specificTypes = [
    'convention_center',    // 会议中心
    'conference_center',    // 会议中心
    'hotel',                // 酒店
    'restaurant',            // 餐厅
    'cafe',                  // 咖啡厅
    'bar',                   // 酒吧
    'night_club',            // 夜总会
    'stadium',               // 体育场
    'park',                  // 公园
    'museum',                // 博物馆
    'theater',               // 剧院
    'auditorium',            // 礼堂
  ];
  return specificTypes.some(type => types.includes(type));
}

/**
 * 构建街道地址（欧美格式：门牌号 + 街道名）
 */
function buildStreetAddress(components: AddressComponents[], isUS: boolean = false): string {
  const streetNumber = getAddressComponent(components, 'street_number');
  const route = getAddressComponent(components, 'route');
  
  if (streetNumber && route) {
    // 欧美格式：门牌号在前，如 "123 Main Street"
    return `${streetNumber} ${route}`;
  } else if (route) {
    return route;
  } else if (streetNumber) {
    return streetNumber;
  }
  return '';
}

/**
 * 构建区域信息（欧美格式：城市 + 州/省）
 */
function buildAreaInfo(components: AddressComponents[], isUS: boolean = false): string {
  const parts: string[] = [];
  
  // 城市
  const locality = getAddressComponent(components, 'locality');
  if (locality) {
    parts.push(locality);
  }
  
  // 州/省（美国用州，其他国家用省）
  const state = getAddressComponent(components, 'administrative_area_level_1');
  if (state && !parts.includes(state)) {
    parts.push(state);
  }
  
  // 对于非美国地址，可能还需要区/县信息
  if (!isUS) {
    const sublocality = getAddressComponent(components, 'sublocality');
    const administrativeAreaLevel2 = getAddressComponent(components, 'administrative_area_level_2');
    
    if (sublocality && !parts.includes(sublocality)) {
      parts.push(sublocality);
    } else if (administrativeAreaLevel2 && !parts.includes(administrativeAreaLevel2)) {
      parts.push(administrativeAreaLevel2);
    }
  }
  
  return parts.join(', ');
}

/**
 * 格式化活动地址显示（优化欧美格式）
 * 
 * 欧美地址显示策略（优先级从高到低）：
 * 1. 有场所名称 + 街道地址 → "Venue Name, Street Address, City, State"
 * 2. 有场所名称 + 无街道地址 → "Venue Name, City, State"
 * 3. 无场所名称 + 有街道地址 → "Street Address, City, State"
 * 4. 只有格式化地址 → 使用格式化地址（去除邮编）
 * 5. 只有附近区域 → 使用附近区域
 */
export function formatEventLocation(place: PlaceResult): {
  displayText: string;        // 主显示文本
  subtitle?: string;          // 副标题（可选）
  fullAddress?: string;       // 完整地址（用于详情）
} {
  const {
    name,
    formatted_address,
    address_components = [],
    types = [],
    vicinity
  } = place;

  // 检测国家/地区
  const countryInfo = detectCountry(address_components);
  
  // 提取地址组件（使用欧美格式）
  const streetAddress = buildStreetAddress(address_components, countryInfo.isUS);
  const areaInfo = buildAreaInfo(address_components, countryInfo.isUS);
  const city = getAddressComponent(address_components, 'locality');
  const state = getAddressComponent(address_components, 'administrative_area_level_1');
  const country = countryInfo.country;
  
  // 判断是否为活动场所
  const isVenue = isVenueType(types);
  const isSpecific = isSpecificVenue(types);

  // 策略 1: 有场所名称 + 街道地址（最佳情况 - 欧美格式）
  if (name && streetAddress) {
    const parts = [name, streetAddress];
    if (areaInfo) {
      parts.push(areaInfo);
    }
    // 欧美格式：Venue Name, Street Address, City, State
    return {
      displayText: parts.join(', '),
      subtitle: state ? `${city || ''}${city && state ? ', ' : ''}${state}`.trim() : city || undefined,
      fullAddress: formatted_address
    };
  }

  // 策略 2: 有场所名称 + 无街道地址，但有区域信息（欧美格式）
  if (name && areaInfo) {
    // 欧美格式：Venue Name, City, State
    return {
      displayText: `${name}, ${areaInfo}`,
      subtitle: state ? `${city || ''}${city && state ? ', ' : ''}${state}`.trim() : city || undefined,
      fullAddress: formatted_address
    };
  }

  // 策略 3: 有场所名称，但无详细地址信息（欧美格式）
  if (name && isVenue) {
    // 如果有格式化地址，尝试提取区域信息
    if (formatted_address) {
      // 移除名称部分，保留地址部分
      let addressPart = formatted_address;
      if (formatted_address.startsWith(name)) {
        addressPart = formatted_address.substring(name.length).trim();
        if (addressPart.startsWith(',')) {
          addressPart = addressPart.substring(1).trim();
        }
      }
      
      if (addressPart) {
        return {
          displayText: `${name}, ${addressPart}`,
          fullAddress: formatted_address
        };
      }
    }
    
    // 如果有附近区域信息
    if (vicinity) {
      return {
        displayText: `${name}, ${vicinity}`,
        fullAddress: formatted_address || `${name}, ${vicinity}`
      };
    }
    
    // 只有名称，添加城市和州信息
    const locationParts = [name];
    if (city) locationParts.push(city);
    if (state) locationParts.push(state);
    
    return {
      displayText: locationParts.length > 1 ? locationParts.join(', ') : name,
      subtitle: state ? `${city || ''}${city && state ? ', ' : ''}${state}`.trim() : city || undefined,
      fullAddress: formatted_address
    };
  }

  // 策略 4: 无场所名称，但有街道地址（欧美格式）
  if (streetAddress) {
    const parts = [streetAddress];
    if (areaInfo) {
      parts.push(areaInfo);
    }
    // 欧美格式：Street Address, City, State
    return {
      displayText: parts.join(', '),
      subtitle: state ? `${city || ''}${city && state ? ', ' : ''}${state}`.trim() : city || undefined,
      fullAddress: formatted_address
    };
  }

  // 策略 5: 使用格式化地址（去除邮编 - 支持欧美格式）
  if (formatted_address) {
    // 移除邮编（支持美国5位、9位邮编，英国邮编等）
    let cleanAddress = formatted_address
      // 美国邮编：12345 或 12345-6789
      .replace(/\b\d{5}(-\d{4})?\b/g, '')
      // 英国邮编：SW1A 1AA 格式
      .replace(/\b[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}\b/gi, '')
      // 加拿大邮编：A1A 1A1 格式
      .replace(/\b[A-Z]\d[A-Z]\s?\d[A-Z]\d\b/gi, '')
      // 通用邮编格式
      .replace(/\b\d{4,6}\b/g, '')
      // 清理多余逗号和空格
      .replace(/,\s*,/g, ',')
      .replace(/\s+/g, ' ')
      .trim();
    
    // 移除开头的逗号
    if (cleanAddress.startsWith(',')) {
      cleanAddress = cleanAddress.substring(1).trim();
    }
    
    return {
      displayText: cleanAddress,
      fullAddress: formatted_address
    };
  }

  // 策略 6: 使用附近区域
  if (vicinity) {
    return {
      displayText: vicinity,
      fullAddress: vicinity
    };
  }

  // 策略 7: 使用名称（最后备选）
  if (name) {
    return {
      displayText: name,
      fullAddress: name
    };
  }

  // 兜底：返回空字符串
  return {
    displayText: 'Incomplete address information',
    fullAddress: formatted_address || ''
  };
}

/**
 * 提取地址的关键信息用于搜索和匹配（优化欧美格式）
 */
export function extractLocationKeyInfo(place: PlaceResult): {
  venueName?: string;         // 场所名称
  streetAddress?: string;      // 街道地址
  city?: string;              // 城市
  state?: string;             // 州/省（欧美）
  district?: string;          // 区/县（非欧美）
  country?: string;            // 国家
  postalCode?: string;        // 邮编
} {
  const { name, address_components = [] } = place;
  const countryInfo = detectCountry(address_components);
  
  // 提取邮编
  const postalCode = getAddressComponent(address_components, 'postal_code');

  return {
    venueName: name || undefined,
    streetAddress: buildStreetAddress(address_components, countryInfo.isUS) || undefined,
    city: getAddressComponent(address_components, 'locality') || undefined,
    state: getAddressComponent(address_components, 'administrative_area_level_1') || undefined,
    district: countryInfo.isUS ? undefined : (
      getAddressComponent(address_components, 'sublocality') ||
      getAddressComponent(address_components, 'administrative_area_level_2') ||
      undefined
    ),
    country: countryInfo.country || undefined,
    postalCode: postalCode || undefined
  };
}

