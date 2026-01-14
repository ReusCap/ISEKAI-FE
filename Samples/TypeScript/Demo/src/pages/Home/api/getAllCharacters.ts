import { axiosClient } from '@/api/client';
import { CharactersResponse } from '@/types/character';

export interface GetCharactersParams {
  page?: number;
  size?: number;
}

/**
 * 캐릭터 목록을 가져옴
 */
export const getCharacters = async (
  params?: GetCharactersParams
): Promise<CharactersResponse> => {
  const response = await axiosClient.get<CharactersResponse>('/characters', {
    params: {
      page: params?.page ?? 0,
      size: params?.size ?? 10
    }
  });
  return response.data;
};