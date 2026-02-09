import { describe, it, expect } from 'vitest';
import {
  calculateNextLevel,
  countCompletedByLevel,
  calculateTotalXP,
  getXPForNextLevel,
  getLevelProgress,
  getUserDisplayName,
  getUserInitials,
  isAdmin,
  isMentor,
  getLevelColorClass,
  getLevelBgClass,
} from './userService';
import type { User, Challenge, Participation } from '@/types/database';

// Test fixtures
const mockUser: User = {
  id: 'u1',
  email: 'jean.dupont@exalt.com',
  nom: 'Jean Dupont',
  metier_id: null,
  marque_id: null,
  localisation: null,
  niveau_actuel: 'Explorer',
  role: 'Utilisateur',
  points_totaux: 100,
  created_at: '',
};

const mockChallenges: Challenge[] = [
  {
    id: 'c1',
    titre: 'Challenge 1',
    description: '',
    niveau_associe: 'Explorer',
    type: 'Quiz',
    difficulte: 1,
    type_evaluation: 'Automatique',
    outils_recommandes: [],
    criteres_evaluation: '',
    xp: 50,
    statut: 'Actif',
    solution_reference: null,
    solution_fichiers: null,
    marques: [],
    etape_vortex: null,
    thematiques: [],
    participants: 'Solo',
    created_at: '',
    vision_impact: null,
    le_saviez_vous: null,
    sources: null,
  },
  {
    id: 'c2',
    titre: 'Challenge 2',
    description: '',
    niveau_associe: 'Explorer',
    type: 'Quiz',
    difficulte: 2,
    type_evaluation: 'Automatique',
    outils_recommandes: [],
    criteres_evaluation: '',
    xp: 75,
    statut: 'Actif',
    solution_reference: null,
    solution_fichiers: null,
    marques: [],
    etape_vortex: null,
    thematiques: [],
    participants: 'Solo',
    created_at: '',
    vision_impact: null,
    le_saviez_vous: null,
    sources: null,
  },
  {
    id: 'c3',
    titre: 'Challenge 3',
    description: '',
    niveau_associe: 'Crafter',
    type: 'Exercice',
    difficulte: 3,
    type_evaluation: 'Manuelle',
    outils_recommandes: [],
    criteres_evaluation: '',
    xp: 150,
    statut: 'Actif',
    solution_reference: null,
    solution_fichiers: null,
    marques: ['FLOW'],
    etape_vortex: null,
    thematiques: [],
    participants: 'Solo',
    created_at: '',
    vision_impact: null,
    le_saviez_vous: null,
    sources: null,
  },
];

describe('userService', () => {
  describe('calculateNextLevel', () => {
    it('should return Crafter when Explorer completes 2 challenges', () => {
      const participations: Participation[] = [
        { user_id: 'u1', challenge_id: 'c1', statut: 'Terminé', created_at: '' },
        { user_id: 'u1', challenge_id: 'c2', statut: 'Terminé', created_at: '' },
      ];
      
      expect(calculateNextLevel('Explorer', participations, mockChallenges)).toBe('Crafter');
    });

    it('should return null when not enough challenges completed', () => {
      const participations: Participation[] = [
        { user_id: 'u1', challenge_id: 'c1', statut: 'Terminé', created_at: '' },
      ];
      
      expect(calculateNextLevel('Explorer', participations, mockChallenges)).toBeNull();
    });

    it('should return null for Architecte (max level)', () => {
      const participations: Participation[] = [];
      expect(calculateNextLevel('Architecte', participations, mockChallenges)).toBeNull();
    });
  });

  describe('countCompletedByLevel', () => {
    it('should count completed challenges by level', () => {
      const participations: Participation[] = [
        { user_id: 'u1', challenge_id: 'c1', statut: 'Terminé', created_at: '' },
        { user_id: 'u1', challenge_id: 'c2', statut: 'Terminé', created_at: '' },
        { user_id: 'u1', challenge_id: 'c3', statut: 'En_cours', created_at: '' },
      ];
      
      const counts = countCompletedByLevel(participations, mockChallenges);
      
      expect(counts.Explorer).toBe(2);
      expect(counts.Crafter).toBe(0); // c3 is En_cours, not Terminé
      expect(counts.Architecte).toBe(0);
    });
  });

  describe('calculateTotalXP', () => {
    it('should sum XP from completed challenges', () => {
      const participations: Participation[] = [
        { user_id: 'u1', challenge_id: 'c1', statut: 'Terminé', created_at: '' },
        { user_id: 'u1', challenge_id: 'c2', statut: 'Terminé', created_at: '' },
      ];
      
      expect(calculateTotalXP(participations, mockChallenges)).toBe(125); // 50 + 75
    });

    it('should not count in-progress challenges', () => {
      const participations: Participation[] = [
        { user_id: 'u1', challenge_id: 'c1', statut: 'En_cours', created_at: '' },
      ];
      
      expect(calculateTotalXP(participations, mockChallenges)).toBe(0);
    });
  });

  describe('getXPForNextLevel', () => {
    it('should return correct thresholds', () => {
      expect(getXPForNextLevel('Explorer')).toBe(200);
      expect(getXPForNextLevel('Crafter')).toBe(500);
      expect(getXPForNextLevel('Architecte')).toBeNull();
    });
  });

  describe('getLevelProgress', () => {
    it('should calculate progress percentage', () => {
      // Explorer needs 200 XP for Crafter
      expect(getLevelProgress('Explorer', 100)).toBe(50);
      expect(getLevelProgress('Explorer', 0)).toBe(0);
      expect(getLevelProgress('Explorer', 200)).toBe(100);
    });

    it('should return 100 for max level', () => {
      expect(getLevelProgress('Architecte', 1000)).toBe(100);
    });
  });

  describe('getUserDisplayName', () => {
    it('should return nom when available', () => {
      expect(getUserDisplayName(mockUser)).toBe('Jean Dupont');
    });

    it('should return email prefix when no nom', () => {
      const userNoName = { ...mockUser, nom: null };
      expect(getUserDisplayName(userNoName)).toBe('jean.dupont');
    });
  });

  describe('getUserInitials', () => {
    it('should return initials from name', () => {
      expect(getUserInitials(mockUser)).toBe('JD');
    });

    it('should handle single name', () => {
      const userSingleName = { ...mockUser, nom: 'Jean' };
      expect(getUserInitials(userSingleName)).toBe('JE');
    });

    it('should handle email when no name', () => {
      const userNoName = { ...mockUser, nom: null };
      // jean.dupont -> split by . -> ['jean', 'dupont'] -> JD
      expect(getUserInitials(userNoName)).toBe('JD');
    });
  });

  describe('isAdmin / isMentor', () => {
    it('should detect admin role', () => {
      const admin = { ...mockUser, role: 'Administrateur' as const };
      expect(isAdmin(admin)).toBe(true);
      expect(isAdmin(mockUser)).toBe(false);
    });

    it('should detect mentor role', () => {
      const mentor = { ...mockUser, role: 'Mentor' as const };
      expect(isMentor(mentor)).toBe(true);
      expect(isMentor(mockUser)).toBe(false);
    });

    it('should treat admin as mentor', () => {
      const admin = { ...mockUser, role: 'Administrateur' as const };
      expect(isMentor(admin)).toBe(true);
    });
  });

  describe('getLevelColorClass / getLevelBgClass', () => {
    it('should return correct color classes', () => {
      expect(getLevelColorClass('Explorer')).toBe('text-accent-vert');
      expect(getLevelColorClass('Crafter')).toBe('text-exalt-blue');
      expect(getLevelColorClass('Architecte')).toBe('text-accent-rose');
    });

    it('should return correct bg classes', () => {
      expect(getLevelBgClass('Explorer')).toBe('bg-accent-vert');
      expect(getLevelBgClass('Crafter')).toBe('bg-exalt-blue');
      expect(getLevelBgClass('Architecte')).toBe('bg-accent-rose');
    });
  });
});
