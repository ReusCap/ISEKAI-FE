import { axiosClient } from '@/api/client';

export const getTicketForWebSocket = async (): Promise<string> => {
  const response = await axiosClient.post<{ ticket: string }>('/websocket/ticket');
  return response.data.ticket;
};