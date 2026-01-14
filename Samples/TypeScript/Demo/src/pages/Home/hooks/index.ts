import { useQuery } from '@tanstack/react-query';
import { getCharacters, GetCharactersParams } from '@/pages/Home/api/getAllCharacters';

/**
 * 캐릭터 목록 조회 훅
 */
export const useCharacters = (params?: GetCharactersParams) => {
  return useQuery({
    queryKey: ['characters', params],
    queryFn: () => getCharacters(params)
  });
};