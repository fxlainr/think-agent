// Types pour Think Agent - basés sur le PRD

export type UserLevel = 'Explorer' | 'Crafter' | 'Architecte';
export type UserRole = 'Utilisateur' | 'Mentor' | 'Administrateur';
export type ChallengeType = 'Quiz' | 'Exercice' | 'Projet' | 'Use_Case';
export type EvaluationType = 'Manuelle' | 'Automatique' | 'Hybride';
export type ChallengeStatus = 'Actif' | 'Archivé';
export type SolutionStatus = 'Soumise' | 'Évaluée';
export type ParticipationStatus = 'En_cours' | 'Terminé' | 'Abandonné';
export type EventFormat = 'En_Ligne' | 'Présentiel';

// Marques eXalt
export type Marque = 'FLOW' | 'IT' | 'VALUE' | 'FORGE' | 'FI' | 'SHIELD' | 'NILO' | 'DSM';

// Étapes Innovation Vortex
export type VortexStage = 
  | 'contextualize'  // Cadrer / Frame
  | 'empathize'      // Découvrir / Discover
  | 'synthesize'     // Définir / Define
  | 'hypothesize'    // Idéer / Ideate
  | 'externalize'    // Construire / Build
  | 'sensitize'      // Tester / Test
  | 'systematize';   // Apprendre / Learn

// Thématiques Challenges IA
export type Thematique =
  | 'knowledge'       // 📚 Knowledge & Formation
  | 'content'         // ✍️ Création de contenu
  | 'data'            // 📊 Data & Analyse
  | 'automation'      // 🤖 Automatisation & Workflows
  | 'agents'          // 💬 Agents & Assistants
  | 'strategy'        // 💼 Stratégie & Conseil
  | 'code'            // 🧑‍💻 Code & Développement
  | 'design'          // 🎨 Design & UX
  | 'research'        // 🔍 Recherche & Veille
  | 'prompting';      // 🧠 Prompt Engineering

export interface User {
  id: string;
  email: string;
  nom: string | null;
  metier_id: string | null;
  marque_id: string | null;
  localisation: string | null;
  niveau_actuel: UserLevel;
  role: UserRole;
  points_totaux: number;
  created_at: string;
}

export interface Challenge {
  id: string;
  titre: string;
  description: string;
  niveau_associe: UserLevel;
  type: ChallengeType;
  difficulte: number; // 1-5
  type_evaluation: EvaluationType;
  outils_recommandes: string[];
  criteres_evaluation: string;
  xp: number;
  statut: ChallengeStatus;
  marques: Marque[];  // [] = transverse (toutes marques)
  etape_vortex: VortexStage | null;  // Étape Innovation Vortex
  thematiques: Thematique[];  // Thématiques IA (multi-select)
  participants: 'Solo' | 'Duo' | 'Équipe';
  // Champs d'enrichissement
  vision_impact: string | null;      // Pourquoi ce challenge est important
  le_saviez_vous: string | null;     // Anecdote / hook engageant
  sources: string[] | null;          // Liens vers articles/posts LinkedIn
  created_at: string;
}

export interface Solution {
  id: string;
  user_id: string;
  challenge_id: string;
  contenu_texte: string;
  fichiers_attaches: string[] | null;
  statut: SolutionStatus;
  note: number | null; // 1-5
  feedback_reviewer: string | null;
  reviewer_id: string | null;
  a_consulte_solution: boolean;
  created_at: string;
}

export interface Participation {
  user_id: string;
  challenge_id: string;
  statut: ParticipationStatus;
  created_at: string;
}

export interface Badge {
  id: string;
  nom: string;
  description: string;
  emoji: string;
  conditions: Record<string, unknown>;
}

export interface UserBadge {
  user_id: string;
  badge_id: string;
  date: string;
}

export interface DojoEvent {
  id: string;
  titre: string;
  description: string;
  date_debut: string;
  date_fin: string;
  format: EventFormat;
  capacite: number;
  lien_360learning: string;
  organisateur_id: string | null;
  marques: Marque[];  // [] = toutes marques
  created_at: string;
}

export interface MarqueRef {
  id: string;
  nom: Marque;
  description: string;
}

export interface MetierRef {
  id: string;
  nom: string;
  marque_id: string;
}

// Types enrichis pour l'UI
export interface ChallengeWithProgress extends Challenge {
  participation?: Participation;
  solution?: Solution;
  isCompleted: boolean;
  hasSubmitted: boolean;
}

export interface UserWithStats extends User {
  badges: Badge[];
  challenges_completed: number;
  challenges_in_progress: number;
  rank: number;
}

// Filtres pour le catalogue
export interface ChallengeFilters {
  niveau?: UserLevel;
  marque?: Marque;  // Filtre sur une marque (affiche aussi les transverses)
  difficulte?: number;
  type?: ChallengeType;
  search?: string;
}

// Leaderboard
export interface LeaderboardEntry {
  user_id: string;
  nom: string;
  niveau_actuel: UserLevel;
  points_totaux: number;
  marque: string | null;
  rank: number;
}
