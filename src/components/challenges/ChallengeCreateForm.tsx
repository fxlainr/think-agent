'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MultiSelectMarques } from '@/components/ui/multi-select-marques';
import { MultiSelectThematiques } from '@/components/ui/multi-select-thematiques';
import { Loader2, Save, X } from 'lucide-react';
import { createChallenge } from '@/lib/supabase/queries';
import type { Challenge, UserLevel, ChallengeType, Marque, VortexStage, Thematique } from '@/types/database';

interface ChallengeCreateFormProps {
  onSuccess: (challenge: Challenge) => void;
  onCancel: () => void;
}

const NIVEAUX: UserLevel[] = ['Explorer', 'Crafter', 'Architecte'];
const TYPES: ChallengeType[] = ['Quiz', 'Exercice', 'Projet', 'Use_Case'];
const PARTICIPANTS = ['Solo', 'Duo', 'Équipe'] as const;

const VORTEX_STAGES: { value: VortexStage; label: string }[] = [
  { value: 'contextualize', label: '1. Cadrer (Contextualize)' },
  { value: 'empathize', label: '2. Découvrir (Empathize)' },
  { value: 'synthesize', label: '3. Définir (Synthesize)' },
  { value: 'hypothesize', label: '4. Idéer (Hypothesize)' },
  { value: 'externalize', label: '5. Construire (Externalize)' },
  { value: 'sensitize', label: '6. Tester (Sensitize)' },
  { value: 'systematize', label: '7. Apprendre (Systematize)' },
];

export function ChallengeCreateForm({ onSuccess, onCancel }: ChallengeCreateFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    niveau_associe: 'Explorer' as UserLevel,
    type: 'Exercice' as ChallengeType,
    difficulte: 2,
    xp: 100,
    marques: [] as Marque[],
    etape_vortex: '' as string,
    thematiques: [] as Thematique[],
    participants: 'Solo' as 'Solo' | 'Duo' | 'Équipe',
    outils_recommandes: '',
    criteres_evaluation: '',
    vision_impact: '',
    le_saviez_vous: '',
    sources: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMarquesChange = (marques: Marque[]) => {
    setFormData((prev) => ({ ...prev, marques }));
  };

  const handleThematiquesChange = (thematiques: Thematique[]) => {
    setFormData((prev) => ({ ...prev, thematiques }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.titre.trim() || !formData.description.trim()) {
      alert('Titre et description sont obligatoires');
      return;
    }

    setIsSubmitting(true);

    const newChallenge = {
      titre: formData.titre,
      description: formData.description,
      niveau_associe: formData.niveau_associe,
      type: formData.type,
      difficulte: Number(formData.difficulte),
      type_evaluation: 'Manuelle' as const,
      xp: Number(formData.xp),
      statut: 'Actif' as const,
      marques: formData.marques,
      etape_vortex: (formData.etape_vortex || null) as VortexStage | null,
      thematiques: formData.thematiques,
      participants: formData.participants,
      outils_recommandes: formData.outils_recommandes
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      criteres_evaluation: formData.criteres_evaluation,
      vision_impact: formData.vision_impact || null,
      le_saviez_vous: formData.le_saviez_vous || null,
      sources: formData.sources
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
    };

    const created = await createChallenge(newChallenge);
    setIsSubmitting(false);

    if (created) {
      onSuccess(created);
    } else {
      alert('Erreur lors de la création du challenge');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informations générales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Titre */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Titre *</label>
            <Input
              name="titre"
              value={formData.titre}
              onChange={handleChange}
              placeholder="Ex: Le Conseiller McKinsey"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Décris le challenge, son objectif, ce que les participants vont apprendre..."
              required
              className="w-full h-32 p-3 rounded-lg bg-background border border-border focus:border-accent-cyan focus:outline-none resize-none"
            />
          </div>

          {/* Niveau + Type + Difficulté */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Niveau</label>
              <select
                name="niveau_associe"
                value={formData.niveau_associe}
                onChange={handleChange}
                className="w-full p-2 rounded-lg bg-background border border-border focus:border-accent-cyan focus:outline-none"
              >
                {NIVEAUX.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full p-2 rounded-lg bg-background border border-border focus:border-accent-cyan focus:outline-none"
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Difficulté (1-5)</label>
              <select
                name="difficulte"
                value={formData.difficulte}
                onChange={handleChange}
                className="w-full p-2 rounded-lg bg-background border border-border focus:border-accent-cyan focus:outline-none"
              >
                {[1, 2, 3, 4, 5].map((d) => (
                  <option key={d} value={d}>
                    {d} ⭐
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* XP + Participants */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">XP</label>
              <Input
                name="xp"
                type="number"
                value={formData.xp}
                onChange={handleChange}
                min={0}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Participants</label>
              <select
                name="participants"
                value={formData.participants}
                onChange={handleChange}
                className="w-full p-2 rounded-lg bg-background border border-border focus:border-accent-cyan focus:outline-none"
              >
                {PARTICIPANTS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Marques */}
      <Card>
        <CardHeader>
          <CardTitle>Marques concernées</CardTitle>
        </CardHeader>
        <CardContent>
          <MultiSelectMarques
            value={formData.marques}
            onChange={handleMarquesChange}
          />
        </CardContent>
      </Card>

      {/* Phases */}
      <Card>
        <CardHeader>
          <CardTitle>Phases</CardTitle>
        </CardHeader>
        <CardContent>
          <select
            name="etape_vortex"
            value={formData.etape_vortex}
            onChange={handleChange}
            className="w-full p-2 rounded-lg bg-background border border-border focus:border-accent-cyan focus:outline-none"
          >
            <option value="">Non définie</option>
            {VORTEX_STAGES.map((stage) => (
              <option key={stage.value} value={stage.value}>
                {stage.label}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {/* Thématiques */}
      <Card>
        <CardHeader>
          <CardTitle>Thématiques IA</CardTitle>
        </CardHeader>
        <CardContent>
          <MultiSelectThematiques
            value={formData.thematiques}
            onChange={handleThematiquesChange}
          />
        </CardContent>
      </Card>

      {/* Contenu pédagogique */}
      <Card>
        <CardHeader>
          <CardTitle>Contenu pédagogique</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Vision & Impact */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Vision & Impact</label>
            <textarea
              name="vision_impact"
              value={formData.vision_impact}
              onChange={handleChange}
              placeholder="Pourquoi ce challenge est important..."
              className="w-full h-24 p-3 rounded-lg bg-background border border-border focus:border-accent-cyan focus:outline-none resize-none"
            />
          </div>

          {/* Le saviez-vous */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Le saviez-vous ?</label>
            <textarea
              name="le_saviez_vous"
              value={formData.le_saviez_vous}
              onChange={handleChange}
              placeholder="Anecdote ou hook engageant..."
              className="w-full h-24 p-3 rounded-lg bg-background border border-border focus:border-accent-cyan focus:outline-none resize-none"
            />
          </div>

          {/* Critères d'évaluation */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Critères d&apos;évaluation</label>
            <textarea
              name="criteres_evaluation"
              value={formData.criteres_evaluation}
              onChange={handleChange}
              placeholder="Comment évaluer la réussite..."
              className="w-full h-24 p-3 rounded-lg bg-background border border-border focus:border-accent-cyan focus:outline-none resize-none"
            />
          </div>

          {/* Outils recommandés */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Outils recommandés</label>
            <Input
              name="outils_recommandes"
              value={formData.outils_recommandes}
              onChange={handleChange}
              placeholder="Séparés par des virgules : ChatGPT, n8n, Cursor..."
            />
          </div>

          {/* Sources */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Sources & Références</label>
            <textarea
              name="sources"
              value={formData.sources}
              onChange={handleChange}
              placeholder="Une URL par ligne..."
              className="w-full h-24 p-3 rounded-lg bg-background border border-border focus:border-accent-cyan focus:outline-none resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          <X className="w-4 h-4 mr-2" />
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-accent-jaune hover:bg-accent-jaune/80 text-black font-semibold"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Création...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Créer le challenge
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
