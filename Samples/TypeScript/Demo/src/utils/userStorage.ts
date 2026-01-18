import { UserInfo } from '@/types/user';

const USER_INFO_KEY = 'userInfo';

export const saveUserInfo = (userInfo: UserInfo): void => {
  localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));
};

export const getUserInfo = (): UserInfo | null => {
  const userInfo = localStorage.getItem(USER_INFO_KEY);
  if (!userInfo) return null;
  
  try {
    return JSON.parse(userInfo);
  } catch {
    return null;
  }
};

export const clearUserInfo = (): void => {
  localStorage.removeItem(USER_INFO_KEY);
};

export const isLoggedIn = (): boolean => {
  return !!localStorage.getItem('accessToken') && !!getUserInfo();
};