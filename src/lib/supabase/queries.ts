import { createClient } from './client';
import type { 
  User, Challenge, Participation, Solution, 
  Badge, DojoEvent, ChallengeFilters, LeaderboardEntry 
} from '@/types/database';

const supabase = createClient();

// ==========================================
// USERS
// ==========================================

export async function getUserByEmail(email: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching user:', error);
  }
  return data;
}

export async function createUser(email: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .insert({ email })
    .select()
    .single();

  if (error) {
    console.error('Error creating user:', error);
    return null;
  }
  return data;
}

export async function getOrCreateUser(email: string): Promise<User | null> {
  // Essayer de récupérer l'utilisateur
  let user = await getUserByEmail(email);
  
  // S'il n'existe pas, le créer
  if (!user) {
    user = await createUser(email);
  }
  
  return user;
}

export async function updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating user:', error);
    return null;
  }
  return data;
}

// ==========================================
// CHALLENGES
// ==========================================

export async function getChallenges(filters?: ChallengeFilters): Promise<Challenge[]> {
  let query = supabase
    .from('challenges')
    .select('*')
    .eq('statut', 'Actif')
    .order('difficulte', { ascending: true });

  if (filters?.niveau) {
    query = query.eq('niveau_associe', filters.niveau);
  }
  // Filtre marques : affiche les challenges contenant la marque OU transverses ([])
  if (filters?.marque) {
    query = query.or(`marques.cs.["${filters.marque}"],marques.eq.[]`);
  }
  if (filters?.difficulte) {
    query = query.eq('difficulte', filters.difficulte);
  }
  if (filters?.search) {
    query = query.or(`titre.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching challenges:', error);
    return [];
  }
  return data || [];
}

export async function getChallengeById(id: string): Promise<Challenge | null> {
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching challenge:', error);
    return null;
  }
  return data;
}

export async function updateChallenge(
  id: string,
  updates: Partial<Challenge>
): Promise<Challenge | null> {
  const { data, error } = await supabase
    .from('challenges')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating challenge:', error);
    return null;
  }
  return data;
}

export async function createChallenge(
  challenge: Omit<Challenge, 'id' | 'created_at'>
): Promise<Challenge | null> {
  const { data, error } = await supabase
    .from('challenges')
    .insert(challenge)
    .select()
    .single();

  if (error) {
    console.error('Error creating challenge:', error);
    return null;
  }
  return data;
}

// ==========================================
// PARTICIPATIONS
// ==========================================

export async function getUserParticipations(userId: string): Promise<(Participation & { challenge: Challenge })[]> {
  const { data, error } = await supabase
    .from('participations')
    .select(`
      *,
      challenge:challenges(*)
    `)
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching participations:', error);
    return [];
  }
  return data || [];
}

export async function getParticipation(userId: string, challengeId: string): Promise<Participation | null> {
  const { data, error } = await supabase
    .from('participations')
    .select('*')
    .eq('user_id', userId)
    .eq('challenge_id', challengeId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching participation:', error);
  }
  return data;
}

export async function createParticipation(userId: string, challengeId: string): Promise<Participation | null> {
  // D'abord vérifier s'il existe une participation abandonnée
  const existing = await getParticipation(userId, challengeId);
  
  if (existing && existing.statut === 'Abandonné') {
    // Réactiver la participation
    return updateParticipation(userId, challengeId, { statut: 'En_cours' });
  }

  // Sinon créer une nouvelle participation
  const { data, error } = await supabase
    .from('participations')
    .insert({ user_id: userId, challenge_id: challengeId })
    .select()
    .single();

  if (error) {
    console.error('Error creating participation:', error);
    return null;
  }
  return data;
}

export async function updateParticipation(
  userId: string, 
  challengeId: string, 
  updates: Partial<Participation>
): Promise<Participation | null> {
  const { data, error } = await supabase
    .from('participations')
    .update(updates)
    .eq('user_id', userId)
    .eq('challenge_id', challengeId)
    .select()
    .single();

  if (error) {
    console.error('Error updating participation:', error);
    return null;
  }
  return data;
}

export async function abandonParticipation(userId: string, challengeId: string): Promise<boolean> {
  const { error } = await supabase
    .from('participations')
    .update({ statut: 'Abandonné' })
    .eq('user_id', userId)
    .eq('challenge_id', challengeId);

  if (error) {
    console.error('Error abandoning participation:', error);
    return false;
  }
  return true;
}

// ==========================================
// SOLUTIONS
// ==========================================

export async function getSolution(userId: string, challengeId: string): Promise<Solution | null> {
  const { data, error } = await supabase
    .from('solutions')
    .select('*')
    .eq('user_id', userId)
    .eq('challenge_id', challengeId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching solution:', error);
  }
  return data;
}

export async function submitSolution(
  userId: string,
  challengeId: string,
  contenuTexte: string,
  fichiers?: string[]
): Promise<Solution | null> {
  const { data, error } = await supabase
    .from('solutions')
    .insert({
      user_id: userId,
      challenge_id: challengeId,
      contenu_texte: contenuTexte,
      fichiers_attaches: fichiers || [],
    })
    .select()
    .single();

  if (error) {
    console.error('Error submitting solution:', error);
    return null;
  }

  // Mettre à jour la participation en "Terminé"
  await updateParticipation(userId, challengeId, { statut: 'Terminé' });

  return data;
}

export async function markSolutionViewed(userId: string, challengeId: string): Promise<void> {
  await supabase
    .from('solutions')
    .update({ a_consulte_solution: true })
    .eq('user_id', userId)
    .eq('challenge_id', challengeId);
}

// ==========================================
// BADGES
// ==========================================

export async function getAllBadges(): Promise<Badge[]> {
  const { data, error } = await supabase
    .from('badges')
    .select('*');

  if (error) {
    console.error('Error fetching badges:', error);
    return [];
  }
  return data || [];
}

export async function getUserBadges(userId: string): Promise<Badge[]> {
  const { data, error } = await supabase
    .from('user_badges')
    .select(`
      badge:badges(*)
    `)
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching user badges:', error);
    return [];
  }
  return data?.map(d => d.badge as unknown as Badge) || [];
}

export async function awardBadge(userId: string, badgeId: string): Promise<boolean> {
  const { error } = await supabase
    .from('user_badges')
    .insert({ user_id: userId, badge_id: badgeId });

  if (error && error.code !== '23505') { // Ignore duplicate
    console.error('Error awarding badge:', error);
    return false;
  }
  return true;
}

// ==========================================
// ÉVÉNEMENTS DOJO
// ==========================================

export async function getDojoEvents(): Promise<DojoEvent[]> {
  const { data, error } = await supabase
    .from('evenements_dojo')
    .select('*')
    .order('date_debut', { ascending: true });

  if (error) {
    console.error('Error fetching events:', error);
    return [];
  }
  return data || [];
}

// ==========================================
// LEADERBOARD
// ==========================================

export async function getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from('users')
    .select(`
      id,
      nom,
      niveau_actuel,
      points_totaux,
      marque_id
    `)
    .order('points_totaux', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }

  // Pour simplifier, on ne fait pas de join pour le nom de marque dans le MVP
  return (data || []).map((user, index) => ({
    user_id: user.id,
    nom: user.nom || 'Anonyme',
    niveau_actuel: user.niveau_actuel,
    points_totaux: user.points_totaux,
    marque: null, // Simplifié pour le MVP
    rank: index + 1,
  }));
}

// ==========================================
// RÉFÉRENCES
// ==========================================

export async function getMarques() {
  const { data, error } = await supabase
    .from('marques')
    .select('*')
    .order('nom');

  if (error) {
    console.error('Error fetching marques:', error);
    return [];
  }
  return data || [];
}

export async function getMetiers() {
  const { data, error } = await supabase
    .from('metiers')
    .select(`
      *,
      marque:marques(nom)
    `)
    .order('nom');

  if (error) {
    console.error('Error fetching metiers:', error);
    return [];
  }
  return data || [];
}

// ==========================================
// LOGIQUE MÉTIER
// ==========================================

/**
 * Met à jour les XP de l'utilisateur après validation d'un challenge
 */
export async function addUserXP(userId: string, xp: number): Promise<void> {
  const user = await getUserByEmail(''); // On a besoin de l'email ou ID
  
  // Utiliser RPC ou faire un update direct
  const { error } = await supabase.rpc('increment_user_xp', { 
    user_id: userId, 
    xp_amount: xp 
  });

  if (error) {
    // Fallback: update manuel
    const { data: currentUser } = await supabase
      .from('users')
      .select('points_totaux')
      .eq('id', userId)
      .single();

    if (currentUser) {
      await supabase
        .from('users')
        .update({ points_totaux: currentUser.points_totaux + xp })
        .eq('id', userId);
    }
  }
}

/**
 * Vérifie et met à jour le niveau de l'utilisateur
 */
export async function checkAndUpdateLevel(userId: string): Promise<void> {
  const participations = await getUserParticipations(userId);
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (!user) return;

  // Compter les challenges complétés avec note >= 3 par niveau
  const completedByLevel = {
    Explorer: 0,
    Crafter: 0,
    Architecte: 0,
  };

  for (const p of participations) {
    if (p.statut === 'Terminé' && p.challenge) {
      // Pour le MVP, on considère tous les challenges terminés comme validés
      completedByLevel[p.challenge.niveau_associe]++;
    }
  }

  // Logique de passage de niveau
  let newLevel = user.niveau_actuel;

  if (user.niveau_actuel === 'Explorer' && completedByLevel.Explorer >= 2) {
    newLevel = 'Crafter';
  } else if (user.niveau_actuel === 'Crafter' && completedByLevel.Crafter >= 2) {
    newLevel = 'Architecte';
  }

  if (newLevel !== user.niveau_actuel) {
    await updateUser(userId, { niveau_actuel: newLevel });
  }
}
