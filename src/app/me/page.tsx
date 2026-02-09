'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Trophy, Zap, Target, Clock, CheckCircle, 
  Medal, Crown, Rocket, Brain, Loader2
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { getUserParticipations, getAllBadges, getUserBadges, getLeaderboard } from '@/lib/supabase/queries';
import type { Badge as BadgeType, Challenge, Participation, LeaderboardEntry } from '@/types/database';

const levelConfig: Record<string, { color: string; icon: typeof Brain; nextLevel: string | null; xpNeeded: number | null }> = {
  Explorer: { color: 'bg-accent-vert text-black', icon: Brain, nextLevel: 'Crafter', xpNeeded: 150 },
  Crafter: { color: 'bg-exalt-blue text-white', icon: Rocket, nextLevel: 'Architecte', xpNeeded: 500 },
  Architecte: { color: 'bg-accent-rose text-white', icon: Crown, nextLevel: null, xpNeeded: null },
};

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('en-cours');
  const [participations, setParticipations] = useState<(Participation & { challenge?: Challenge })[]>([]);
  const [allBadges, setAllBadges] = useState<BadgeType[]>([]);
  const [userBadges, setUserBadges] = useState<BadgeType[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Rediriger si non connecté
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Charger les données
  useEffect(() => {
    async function loadData() {
      if (!user) return;

      setIsLoading(true);
      const [participationsData, allBadgesData, userBadgesData, leaderboardData] = await Promise.all([
        getUserParticipations(user.id),
        getAllBadges(),
        getUserBadges(user.id),
        getLeaderboard(10),
      ]);

      setParticipations(participationsData);
      setAllBadges(allBadgesData);
      setUserBadges(userBadgesData);
      setLeaderboard(leaderboardData);
      setIsLoading(false);
    }
    loadData();
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-exalt-blue" />
        </main>
        <Footer />
      </div>
    );
  }

  const config = levelConfig[user.niveau_actuel] || levelConfig.Explorer;
  const LevelIcon = config.icon;
  
  const inProgress = participations.filter(p => p.statut === 'En_cours');
  const completed = participations.filter(p => p.statut === 'Terminé');

  // Calcul progression
  const currentLevelXP = user.niveau_actuel === 'Explorer' ? 0 : user.niveau_actuel === 'Crafter' ? 150 : 500;
  const xpInCurrentLevel = user.points_totaux - currentLevelXP;
  const xpForNextLevel = config.xpNeeded ? config.xpNeeded - currentLevelXP : 0;
  const progressPercent = config.nextLevel ? Math.min(100, Math.max(0, (xpInCurrentLevel / xpForNextLevel) * 100)) : 100;

  // Trouver la position de l'utilisateur dans le leaderboard
  const userRank = leaderboard.findIndex(e => e.user_id === user.id) + 1;

  // Badges avec statut obtained
  const badgesWithStatus = allBadges.map(badge => ({
    ...badge,
    obtained: userBadges.some(ub => ub.id === badge.id),
  }));

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
            {/* Main content */}
            <div className="space-y-8">
              {/* Profile header */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                    <Avatar className="h-20 w-20">
                      <AvatarFallback className="bg-exalt-blue text-white text-2xl">
                        {user.nom?.split(' ').map(n => n[0]).join('') || user.email[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h1 className="text-2xl font-bold">{user.nom || 'Anonyme'}</h1>
                        <Badge className={config.color}>
                          <LevelIcon className="h-3 w-3 mr-1" />
                          {user.niveau_actuel}
                        </Badge>
                      </div>
                      
                      <p className="text-muted-foreground mb-4">{user.email}</p>
                      
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Zap className="h-4 w-4 text-accent-jaune" />
                          <span className="font-semibold">{user.points_totaux} XP</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <CheckCircle className="h-4 w-4" />
                          <span>{completed.length} challenges terminés</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Target className="h-4 w-4" />
                          <span>{inProgress.length} en cours</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Progression vers niveau suivant */}
                  {config.nextLevel && (
                    <div className="mt-6 pt-6 border-t border-border">
                      <div className="flex items-center justify-between mb-2 text-sm">
                        <span className="text-muted-foreground">Progression vers {config.nextLevel}</span>
                        <span className="font-medium">{Math.max(0, xpInCurrentLevel)} / {xpForNextLevel} XP</span>
                      </div>
                      <Progress value={progressPercent} className="h-2" />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Challenges tabs */}
              <Card>
                <CardHeader>
                  <CardTitle>Mes Challenges</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="mb-4">
                      <TabsTrigger value="en-cours" className="gap-2">
                        <Clock className="h-4 w-4" />
                        En cours ({inProgress.length})
                      </TabsTrigger>
                      <TabsTrigger value="termines" className="gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Terminés ({completed.length})
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="en-cours" className="space-y-3">
                      {isLoading ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-exalt-blue" />
                        </div>
                      ) : inProgress.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground mb-4">
                            Aucun challenge en cours.
                          </p>
                          <Link href="/challenges">
                            <Button variant="outline">Explorer les challenges</Button>
                          </Link>
                        </div>
                      ) : (
                        inProgress.map(({ challenge, ...participation }) => (
                          <Link
                            key={participation.challenge_id}
                            href={`/challenges/${participation.challenge_id}`}
                            className="block"
                          >
                            <div className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-accent-cyan transition-colors">
                              <div>
                                <h4 className="font-medium">{challenge?.titre || 'Challenge'}</h4>
                                <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                                  <Badge variant="outline" className="text-xs">
                                    {challenge?.niveau_associe}
                                  </Badge>
                                  <span className="flex items-center gap-1 text-accent-jaune">
                                    <Zap className="h-3 w-3" />
                                    {challenge?.xp} XP
                                  </span>
                                </div>
                              </div>
                              <Button size="sm" className="bg-accent-cyan hover:bg-accent-cyan/80 text-black">
                                Continuer
                              </Button>
                            </div>
                          </Link>
                        ))
                      )}
                    </TabsContent>

                    <TabsContent value="termines" className="space-y-3">
                      {isLoading ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-exalt-blue" />
                        </div>
                      ) : completed.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                          Aucun challenge terminé pour le moment.
                        </p>
                      ) : (
                        completed.map(({ challenge, ...participation }) => (
                          <Link
                            key={participation.challenge_id}
                            href={`/challenges/${participation.challenge_id}`}
                            className="block"
                          >
                            <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card/50 hover:border-accent-vert transition-colors">
                              <div className="flex items-center gap-3">
                                <CheckCircle className="h-5 w-5 text-accent-vert" />
                                <div>
                                  <h4 className="font-medium">{challenge?.titre || 'Challenge'}</h4>
                                  <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                                    <Badge variant="outline" className="text-xs">
                                      {challenge?.niveau_associe}
                                    </Badge>
                                    <span className="flex items-center gap-1 text-accent-vert">
                                      <Zap className="h-3 w-3" />
                                      +{challenge?.xp} XP
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <Button variant="ghost" size="sm">
                                Revoir
                              </Button>
                            </div>
                          </Link>
                        ))
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Badges */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Medal className="h-5 w-5 text-accent-jaune" />
                    Badges
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-exalt-blue" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      {badgesWithStatus.map((badge) => (
                        <div
                          key={badge.id}
                          className={`flex flex-col items-center p-3 rounded-lg border transition-all ${
                            badge.obtained
                              ? 'border-accent-jaune/50 bg-accent-jaune/10'
                              : 'border-border opacity-40'
                          }`}
                          title={badge.description || badge.nom}
                        >
                          <span className="text-2xl mb-1">{badge.emoji}</span>
                          <span className="text-xs text-center text-muted-foreground">
                            {badge.nom}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Leaderboard */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-accent-jaune" />
                    Leaderboard
                  </CardTitle>
                  <CardDescription>Top 10 global</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-exalt-blue" />
                    </div>
                  ) : leaderboard.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Pas encore de classement
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {leaderboard.map((entry, index) => {
                        const isCurrentUser = entry.user_id === user.id;
                        return (
                          <div
                            key={entry.user_id}
                            className={`flex items-center gap-3 p-2 rounded-lg ${
                              isCurrentUser ? 'bg-exalt-blue/20 border border-exalt-blue/50' : ''
                            }`}
                          >
                            <span className={`w-6 text-center font-bold ${
                              index === 0 ? 'text-accent-jaune' :
                              index === 1 ? 'text-gray-400' :
                              index === 2 ? 'text-amber-600' :
                              'text-muted-foreground'
                            }`}>
                              {index < 3 ? ['🥇', '🥈', '🥉'][index] : entry.rank}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate text-sm">
                                {entry.nom}
                                {isCurrentUser && <span className="text-exalt-blue ml-1">(toi)</span>}
                              </p>
                              <p className="text-xs text-muted-foreground">{entry.marque || '-'}</p>
                            </div>
                            <span className="text-sm font-semibold text-accent-jaune">
                              {entry.points_totaux}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
