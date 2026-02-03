'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, X } from 'lucide-react';
import type { ChallengeFilters as Filters, UserLevel, Marque } from '@/types/database';

interface ChallengeFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

const niveaux: UserLevel[] = ['Explorer', 'Crafter', 'Architecte'];
const marques: (Marque | 'Tous')[] = ['Tous', 'FLOW', 'IT', 'VALUE', 'FORGE', 'FI', 'SHIELD', 'NILO'];
const difficultes = [1, 2, 3, 4, 5];

const levelColors = {
  Explorer: 'bg-accent-vert/20 text-accent-vert border-accent-vert hover:bg-accent-vert hover:text-black',
  Crafter: 'bg-exalt-blue/20 text-exalt-blue border-exalt-blue hover:bg-exalt-blue hover:text-white',
  Architecte: 'bg-accent-rose/20 text-accent-rose border-accent-rose hover:bg-accent-rose hover:text-white',
};

export function ChallengeFilters({ filters, onFiltersChange }: ChallengeFiltersProps) {
  const [searchValue, setSearchValue] = useState(filters.search || '');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFiltersChange({ ...filters, search: searchValue });
  };

  const toggleNiveau = (niveau: UserLevel) => {
    onFiltersChange({
      ...filters,
      niveau: filters.niveau === niveau ? undefined : niveau,
    });
  };

  const toggleMarque = (marque: Marque | 'Tous') => {
    onFiltersChange({
      ...filters,
      marque: filters.marque === marque ? undefined : marque,
    });
  };

  const toggleDifficulte = (diff: number) => {
    onFiltersChange({
      ...filters,
      difficulte: filters.difficulte === diff ? undefined : diff,
    });
  };

  const clearFilters = () => {
    setSearchValue('');
    onFiltersChange({});
  };

  const hasFilters = filters.niveau || filters.marque || filters.difficulte || filters.search;

  return (
    <div className="space-y-4 bg-background p-4 rounded-lg border border-border relative z-20">
      {/* Search */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Rechercher un challenge..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="pl-10 bg-card border-border"
        />
      </form>

      {/* Niveau */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">Niveau</label>
        <div className="flex flex-wrap gap-2">
          {niveaux.map((niveau) => (
            <Badge
              key={niveau}
              variant="outline"
              className={`cursor-pointer transition-all ${
                filters.niveau === niveau
                  ? levelColors[niveau].replace('hover:', '')
                  : 'border-border hover:border-accent-cyan'
              }`}
              onClick={() => toggleNiveau(niveau)}
            >
              {niveau}
            </Badge>
          ))}
        </div>
      </div>

      {/* Marque */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">Marque</label>
        <div className="flex flex-wrap gap-2">
          {marques.map((marque) => (
            <Badge
              key={marque}
              variant="outline"
              className={`cursor-pointer transition-all ${
                filters.marque === marque
                  ? 'bg-exalt-blue text-white border-exalt-blue'
                  : 'border-border hover:border-accent-cyan'
              }`}
              onClick={() => toggleMarque(marque)}
            >
              {marque}
            </Badge>
          ))}
        </div>
      </div>

      {/* Difficulté */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">Difficulté</label>
        <div className="flex gap-2">
          {difficultes.map((diff) => (
            <Button
              key={diff}
              variant="outline"
              size="sm"
              className={`px-3 ${
                filters.difficulte === diff
                  ? 'bg-accent-jaune text-black border-accent-jaune'
                  : 'border-border hover:border-accent-cyan'
              }`}
              onClick={() => toggleDifficulte(diff)}
            >
              {'⭐'.repeat(diff)}
            </Button>
          ))}
        </div>
      </div>

      {/* Clear filters */}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-accent-rose"
          onClick={clearFilters}
        >
          <X className="h-4 w-4 mr-2" />
          Effacer les filtres
        </Button>
      )}
    </div>
  );
}
