import type { Card } from '../types';

export function filterCards(
  cardIds: string[],
  cards: Record<string, Card>,
  searchQuery: string,
  priorityFilter: 'all' | 'low' | 'medium' | 'high'
): string[] {
  const searchNormalized = searchQuery.toLowerCase().trim();
  return cardIds.filter(id => {
    const card = cards[id];
    if (!card) return false;
    
    const matchesPriority = priorityFilter === 'all' || card.priority === priorityFilter;
    const matchesKeyword = searchNormalized === '' ||
      card.title.toLowerCase().includes(searchNormalized) ||
      card.description.toLowerCase().includes(searchNormalized);
      
    return matchesPriority && matchesKeyword;
  });
}
