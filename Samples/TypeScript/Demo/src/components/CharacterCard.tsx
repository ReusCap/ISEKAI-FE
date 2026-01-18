// src/components/CharacterCard.tsx
import React from 'react';
import styled from 'styled-components';
import { COLORS, LAYOUT, FONTS } from '@/constants';
import { CharacterCardProps } from '@/types/character';

export const CharacterCard: React.FC<CharacterCardProps> = ({ 
  character, 
  onClick 
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick(character);
    }
  };

  return (
    <CardContainer onClick={handleClick}>
      <CardImage>
        {character.thumbnailUrl ? (
          <img src={character.thumbnailUrl} alt={character.name} />
        ) : (
          <Placeholder>{character.name[0]}</Placeholder>
        )}
      </CardImage>
      
      <CardContent>
        <CardTitle>{character.name}</CardTitle>
        <CardDescription>{character.persona}</CardDescription>
      </CardContent>
    </CardContainer>
  );
};

const CardContainer = styled.div`
  background-color: ${COLORS.card.bg};
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;
  display: flex;
  flex-direction: column;

  &:hover {
    transform: translateY(-4px);
    box-shadow: ${COLORS.shadow.lg};
  }
`;

const CardImage = styled.div`
  width: 100%;
  aspect-ratio: 1 / 1;
  background-color: ${COLORS.card.bg};
  border-radius: ${LAYOUT.borderRadius.md};
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    position: absolute;
    top: 0;
    left: 0;
  }
`;

const Placeholder = styled.span`
  font-size: 48px;
  font-weight: 700;
  color: ${COLORS.accent.primary};
  user-select: none;
  position: relative;
  z-index: 1;
`;

const CardContent = styled.div`
  padding: ${LAYOUT.spacing.sm};
  display: flex;
  flex-direction: column;
  background-color: ${COLORS.card.bg};
  min-height: 0;
`;

const CardTitle = styled.h3`
  font-size: ${FONTS.size.cardTitle};
  font-weight: ${FONTS.weight.extrabold};
  color: ${COLORS.card.text};
  margin-bottom: ${LAYOUT.spacing.xs};
  
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const CardDescription = styled.p`
  font-size: ${FONTS.size.cardDesc};
  font-weight: ${FONTS.weight.regular};
  color: ${COLORS.card.describe};
  line-height: 1.5;
  opacity: 0.8;
  
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
`;