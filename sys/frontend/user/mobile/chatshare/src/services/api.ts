// 物理デバイスから（ローカルPC内の）dockerコンテナへのアドレスは？？
// PCでifconfigで表示されたen0のinetアドレス。（PC ゲートウェイ 192.168.0.1）
// スマホのゲートウェイアドレス（スマホゲートウェイ 192.168.0.1）
//const API_BASE_URL = 'http://10.0.2.2:8080/api/v1';
const API_BASE_URL = 'http://192.168.0.241:8080/api/v1';

export interface Category {
  id: number;
  name: string;
  description?: string;
  // Add other fields based on your API response
}

export const fetchCategories = async (): Promise<Category[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/categories`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const apiResponseData = await response.json();
    if (!apiResponseData.success) {
      throw new Error('API response indicates failure');
    } else if (!Array.isArray(apiResponseData.data)) {
      throw new Error('API response data is not an array');
    }
    return apiResponseData.data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};
