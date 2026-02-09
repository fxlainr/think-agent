import { describe, it, expect } from 'vitest';
import {
  getCompletedChallengeTitles,
  groupChallengesByLevel,
  getParticipationForChallenge,
  hasCompletedChallenge,
  isInProgress,
  getChallengeStats,
  filterChallenges,
} from './challengeService';
import type { Challenge, Participation } from '@/types/database';

// Test fixtures
const mockChallenges: Challenge[] = [
  {
    id: 'c1',
    titre: 'Les Basiques du Prompting',
    description: 'Bases',
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
    participants: 'Solo',
    livrables: [],
    created_at: '',
    vision_impact: null,
    le_saviez_vous: null,
    sources: null,
  },
  {
    id: 'c2',
    titre: 'Le Gardien des Données',
    description: 'Sécurité',
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
    participants: 'Solo',
    livrables: [],
    created_at: '',
    vision_impact: null,
    le_saviez_vous: null,
    sources: null,
  },
  {
    id: 'c3',
    titre: 'Challenge Avancé',
    description: 'Avancé',
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
    participants: 'Solo',
    livrables: [],
    created_at: '',
    vision_impact: null,
    le_saviez_vous: null,
    sources: null,
  },
  {
    id: 'c4',
    titre: 'Challenge Architecte',
    description: 'Expert',
    niveau_associe: 'Architecte',
    type: 'Projet',
    difficulte: 5,
    type_evaluation: 'Manuelle',
    outils_recommandes: [],
    criteres_evaluation: '',
    xp: 300,
    statut: 'Actif',
    solution_reference: null,
    solution_fichiers: null,
    marques: ['IT'],
    etape_vortex: null,
    participants: 'Solo',
    livrables: [],
    created_at: '',
    vision_impact: null,
    le_saviez_vous: null,
    sources: null,
  },
];

describe('challengeService', () => {
  describe('getCompletedChallengeTitles', () => {
    it('should return empty array when no participations', () => {
      expect(getCompletedChallengeTitles([], mockChallenges)).toEqual([]);
    });

    it('should return only completed challenge titles', () => {
      const participations: Participation[] = [
        { user_id: 'u1', challenge_id: 'c1', statut: 'Terminé', created_at: '' },
        { user_id: 'u1', challenge_id: 'c2', statut: 'En_cours', created_at: '' },
      ];
      
      const titles = getCompletedChallengeTitles(participations, mockChallenges);
      expect(titles).toContain('Les Basiques du Prompting');
      expect(titles).not.toContain('Le Gardien des Données');
    });
  });

  describe('groupChallengesByLevel', () => {
    it('should group challenges by level', () => {
      const grouped = groupChallengesByLevel(mockChallenges);
      
      expect(grouped.Explorer.length).toBe(2);
      expect(grouped.Crafter.length).toBe(1);
      expect(grouped.Architecte.length).toBe(1);
    });
  });

  describe('getParticipationForChallenge', () => {
    it('should find participation for challenge', () => {
      const participations: Participation[] = [
        { user_id: 'u1', challenge_id: 'c1', statut: 'Terminé', created_at: '' },
      ];
      
      const result = getParticipationForChallenge('c1', participations);
      expect(result).toBeDefined();
      expect(result?.statut).toBe('Terminé');
    });

    it('should return undefined when no participation', () => {
      expect(getParticipationForChallenge('c1', [])).toBeUndefined();
    });
  });

  describe('hasCompletedChallenge / isInProgress', () => {
    const participations: Participation[] = [
      { user_id: 'u1', challenge_id: 'c1', statut: 'Terminé', created_at: '' },
      { user_id: 'u1', challenge_id: 'c2', statut: 'En_cours', created_at: '' },
    ];

    it('should detect completed challenge', () => {
      expect(hasCompletedChallenge('c1', participations)).toBe(true);
      expect(hasCompletedChallenge('c2', participations)).toBe(false);
    });

    it('should detect in progress challenge', () => {
      expect(isInProgress('c2', participations)).toBe(true);
      expect(isInProgress('c1', participations)).toBe(false);
    });
  });

  describe('getChallengeStats', () => {
    it('should calculate correct stats', () => {
      const participations: Participation[] = [
        { user_id: 'u1', challenge_id: 'c1', statut: 'Terminé', created_at: '' },
        { user_id: 'u1', challenge_id: 'c2', statut: 'En_cours', created_at: '' },
      ];
      
      const stats = getChallengeStats(participations, mockChallenges);
      
      expect(stats.total).toBe(4);
      expect(stats.completed).toBe(1);
      expect(stats.inProgress).toBe(1);
      expect(stats.completionRate).toBe(25);
    });

    it('should handle empty participations', () => {
      const stats = getChallengeStats([], mockChallenges);
      
      expect(stats.completed).toBe(0);
      expect(stats.completionRate).toBe(0);
    });
  });

  describe('filterChallenges', () => {
    it('should filter by niveau', () => {
      const result = filterChallenges(mockChallenges, { niveau: 'Explorer' });
      expect(result.length).toBe(2);
    });

    it('should filter by marque', () => {
      const result = filterChallenges(mockChallenges, { marque: 'FLOW' });
      // Should include FLOW + transverses ([])
      expect(result.some((c) => c.marques.includes('FLOW'))).toBe(true);
    });

    it('should filter by difficulte', () => {
      const result = filterChallenges(mockChallenges, { difficulte: 1 });
      expect(result.length).toBe(1);
      expect(result[0].difficulte).toBe(1);
    });

    it('should filter by search', () => {
      const result = filterChallenges(mockChallenges, { search: 'Prompting' });
      expect(result.length).toBe(1);
      expect(result[0].titre).toContain('Prompting');
    });

    it('should combine filters', () => {
      const result = filterChallenges(mockChallenges, { 
        niveau: 'Explorer', 
        difficulte: 1 
      });
      expect(result.length).toBe(1);
    });
  });
});
