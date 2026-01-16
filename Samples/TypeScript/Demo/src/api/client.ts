import axios from 'axios';
import { getAccessToken } from '@/utils/kakaoAuth';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const axiosClient = axios.create({
  baseURL: API_BASE_URL,
});

//요청보낼때 request 인터셉트해서 토큰 갱신하는거임
axiosClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
