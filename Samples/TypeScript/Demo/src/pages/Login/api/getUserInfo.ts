import { axiosClient } from '@/api/client';

export interface UserInfoResponse {
  email: string;
  nickname: {
    value: string;
  };
}

export const getUserInfo = async (): Promise<UserInfoResponse> => {
  const { data } = await axiosClient.get<UserInfoResponse>('/me');
  return data;
};