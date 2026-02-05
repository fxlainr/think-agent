'use client';

import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Star, Users, Zap, CheckCircle } from 'lucide-react';
import type { Challenge, Participation } from '@/types/database';

interface ChallengeCardProps {
  challenge: Challenge;
  participation?: Participation;
}

const levelConfig = {
  Explorer: { color: 'bg-accent-vert text-black', glow: 'hover:glow-vert' },
  Crafter: { color: 'bg-exalt-blue text-white', glow: 'hover:glow-blue' },
  Architecte: { color: 'bg-accent-rose text-white', glow: 'hover:glow-rose' },
};

export function ChallengeCard({ challenge, participation }: ChallengeCardProps) {
  const config = levelConfig[challenge.niveau_associe];
  const isCompleted = participation?.statut === 'Terminé';
  const isInProgress = participation?.statut === 'En_cours';

  return (
    <Card className={`group relative overflow-hidden transition-all duration-300 bg-card border-border ${config.glow} transition-glow`}>
      {/* Status indicator */}
      {isCompleted && (
        <div className="absolute top-3 right-3 z-10">
          <CheckCircle className="h-6 w-6 text-accent-vert" />
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <Badge className={config.color}>{challenge.niveau_associe}</Badge>
          {challenge.marque !== 'Tous' && (
            <Badge variant="outline" className="text-xs">
              {challenge.marque}
            </Badge>
          )}
        </div>
        <h3 className="mt-2 text-lg font-semibold leading-tight line-clamp-2">
          {challenge.titre}
        </h3>
      </CardHeader>

      <CardContent className="pb-3">
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {challenge.description.slice(0, 120)}...
        </p>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {/* Difficulté */}
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-3 w-3 ${i < challenge.difficulte ? 'fill-accent-jaune text-accent-jaune' : 'text-muted'}`}
              />
            ))}
          </div>

          {/* Durée */}
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {challenge.duree_estimee}
          </div>

          {/* Participants */}
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {challenge.participants}
          </div>

          {/* XP */}
          <div className="flex items-center gap-1 text-accent-jaune font-medium">
            <Zap className="h-3 w-3" />
            {challenge.xp} XP
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <Link href={`/challenges/${challenge.id}`} className="w-full">
          <Button
            className={`w-full ${isInProgress ? 'bg-accent-cyan hover:bg-accent-cyan/80' : 'bg-accent-jaune hover:bg-accent-jaune/80'} text-black font-semibold`}
          >
            {isCompleted ? 'Revoir' : isInProgress ? 'Continuer' : 'Voir le détail'}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
