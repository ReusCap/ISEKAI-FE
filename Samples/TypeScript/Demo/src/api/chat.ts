import { axiosClient } from './client';

export interface ChatHistoryResponse {
  content: {
    speaker: 'USER' | 'BOT';
    content: string;
    createdAt?: string;
  }[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
}

export const getChatHistory = async (
  characterId: string,
  page: number = 1,
  size: number = 10
) => {
  const response = await axiosClient.get<ChatHistoryResponse>(
    `/characters/${characterId}/chats`,
    {
      params: {
        page,
        size,
        sort: 'created_at',
        direction: 'asc', // 오름차순으로 가져와서 UI에 뿌릴때 참고
      },
    }
  );
  return response.data;
};
