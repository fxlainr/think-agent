import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChallengeCard } from './ChallengeCard';
import type { Challenge, Participation } from '@/types/database';

// Test fixtures
const mockChallenge: Challenge = {
  id: 'challenge-123',
  titre: 'Les Basiques du Prompting',
  description: 'Apprendre les bases du prompting avec les LLMs. Ce challenge vous permettra de maîtriser les fondamentaux.',
  niveau_associe: 'Explorer',
  type: 'Quiz',
  difficulte: 2,
  duree_estimee: '30min',
  type_evaluation: 'Automatique',
  outils_recommandes: ['ChatGPT'],
  criteres_evaluation: 'Score > 80%',
  xp: 50,
  statut: 'Actif',
  solution_reference: null,
  solution_fichiers: null,
  marque: 'Tous',
  participants: 'Solo',
  livrables: [],
  created_at: '2024-01-01T00:00:00Z',
};

const mockParticipationInProgress: Participation = {
  user_id: 'user-123',
  challenge_id: 'challenge-123',
  statut: 'En_cours',
  created_at: '2024-01-01T00:00:00Z',
};

const mockParticipationCompleted: Participation = {
  user_id: 'user-123',
  challenge_id: 'challenge-123',
  statut: 'Terminé',
  created_at: '2024-01-01T00:00:00Z',
};

describe('ChallengeCard', () => {
  describe('Basic rendering', () => {
    it('should render challenge title', () => {
      render(<ChallengeCard challenge={mockChallenge} />);
      
      expect(screen.getByText('Les Basiques du Prompting')).toBeInTheDocument();
    });

    it('should render challenge description (truncated)', () => {
      render(<ChallengeCard challenge={mockChallenge} />);
      
      expect(screen.getByText(/Apprendre les bases/)).toBeInTheDocument();
    });

    it('should render niveau badge', () => {
      render(<ChallengeCard challenge={mockChallenge} />);
      
      expect(screen.getByText('Explorer')).toBeInTheDocument();
    });

    it('should render XP amount', () => {
      render(<ChallengeCard challenge={mockChallenge} />);
      
      expect(screen.getByText('50 XP')).toBeInTheDocument();
    });

    it('should render duration', () => {
      render(<ChallengeCard challenge={mockChallenge} />);
      
      expect(screen.getByText('30min')).toBeInTheDocument();
    });

    it('should render difficulty stars', () => {
      render(<ChallengeCard challenge={mockChallenge} />);
      
      // 5 stars total (some filled, some empty based on difficulty)
      const stars = document.querySelectorAll('svg.lucide-star');
      expect(stars.length).toBe(5);
    });
  });

  describe('Participation states', () => {
    it('should show "Voir le détail" button when no participation', () => {
      render(<ChallengeCard challenge={mockChallenge} />);
      
      expect(screen.getByRole('button', { name: /voir le détail/i })).toBeInTheDocument();
    });

    it('should show "Continuer" button when in progress', () => {
      render(
        <ChallengeCard 
          challenge={mockChallenge} 
          participation={mockParticipationInProgress} 
        />
      );
      
      expect(screen.getByRole('button', { name: /continuer/i })).toBeInTheDocument();
    });

    it('should show "Revoir" button when completed', () => {
      render(
        <ChallengeCard 
          challenge={mockChallenge} 
          participation={mockParticipationCompleted} 
        />
      );
      
      expect(screen.getByRole('button', { name: /revoir/i })).toBeInTheDocument();
    });

    it('should show checkmark icon when completed', () => {
      const { container } = render(
        <ChallengeCard 
          challenge={mockChallenge} 
          participation={mockParticipationCompleted} 
        />
      );
      
      // CheckCircle icon should be present (lucide icons have class lucide)
      const checkIcon = container.querySelector('[class*="lucide-circle-check"], [class*="text-accent-vert"]');
      expect(checkIcon).toBeInTheDocument();
    });
  });

  describe('Different niveaux', () => {
    it('should render Crafter badge correctly', () => {
      const crafterChallenge = { ...mockChallenge, niveau_associe: 'Crafter' as const };
      render(<ChallengeCard challenge={crafterChallenge} />);
      
      expect(screen.getByText('Crafter')).toBeInTheDocument();
    });

    it('should render Architecte badge correctly', () => {
      const architecteChallenge = { ...mockChallenge, niveau_associe: 'Architecte' as const };
      render(<ChallengeCard challenge={architecteChallenge} />);
      
      expect(screen.getByText('Architecte')).toBeInTheDocument();
    });
  });

  describe('Marque badge', () => {
    it('should not show marque badge when marque is Tous', () => {
      render(<ChallengeCard challenge={mockChallenge} />);
      
      expect(screen.queryByText('Tous')).not.toBeInTheDocument();
    });

    it('should show marque badge when marque is specific', () => {
      const flowChallenge = { ...mockChallenge, marque: 'FLOW' as const };
      render(<ChallengeCard challenge={flowChallenge} />);
      
      expect(screen.getByText('FLOW')).toBeInTheDocument();
    });
  });

  describe('Link', () => {
    it('should link to challenge detail page', () => {
      render(<ChallengeCard challenge={mockChallenge} />);
      
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/challenges/challenge-123');
    });
  });
});
