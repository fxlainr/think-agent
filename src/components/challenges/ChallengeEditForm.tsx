'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MultiSelectMarques } from '@/components/ui/multi-select-marques';
import { Loader2, Save, X } from 'lucide-react';
import { updateChallenge } from '@/lib/supabase/queries';
import type { Challenge, UserLevel, ChallengeType, Marque } from '@/types/database';

interface ChallengeEditFormProps {
  challenge: Challenge;
  onSave: (updated: Challenge) => void;
  onCancel: () => void;
}

const NIVEAUX: UserLevel[] = ['Explorer', 'Crafter', 'Architecte'];
const TYPES: ChallengeType[] = ['Quiz', 'Exercice', 'Projet', 'Use_Case'];
const PARTICIPANTS = ['Solo', 'Duo', 'Équipe'] as const;
const STATUTS = ['Actif', 'Archivé'] as const;

export function ChallengeEditForm({ challenge, onSave, onCancel }: ChallengeEditFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    titre: challenge.titre,
    description: challenge.description,
    niveau_associe: challenge.niveau_associe,
    type: challenge.type,
    difficulte: challenge.difficulte,
    xp: challenge.xp,
    marques: challenge.marques || [],
    participants: challenge.participants,
    statut: challenge.statut,
    outils_recommandes: (challenge.outils_recommandes || []).join(', '),
    criteres_evaluation: challenge.criteres_evaluation || '',
    livrables: (challenge.livrables || []).join(', '),
    vision_impact: challenge.vision_impact || '',
    le_saviez_vous: challenge.le_saviez_vous || '',
    sources: (challenge.sources || []).join('\n'),
    solution_reference: challenge.solution_reference || '',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const updates: Partial<Challenge> = {
      titre: formData.titre,
      description: formData.description,
      niveau_associe: formData.niveau_associe,
      type: formData.type,
      difficulte: Number(formData.difficulte),
      xp: Number(formData.xp),
      marques: formData.marques,
      participants: formData.participants,
      statut: formData.statut,
      outils_recommandes: formData.outils_recommandes
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      criteres_evaluation: formData.criteres_evaluation,
      livrables: formData.livrables
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      vision_impact: formData.vision_impact || null,
      le_saviez_vous: formData.le_saviez_vous || null,
      sources: formData.sources
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      solution_reference: formData.solution_reference || null,
    };

    const updated = await updateChallenge(challenge.id, updates);
    setIsSubmitting(false);

    if (updated) {
      onSave(updated);
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
            <label className="text-sm font-medium">Titre</label>
            <Input
              name="titre"
              value={formData.titre}
              onChange={handleChange}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
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

          {/* XP + Participants + Statut */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            <div className="space-y-2">
              <label className="text-sm font-medium">Statut</label>
              <select
                name="statut"
                value={formData.statut}
                onChange={handleChange}
                className="w-full p-2 rounded-lg bg-background border border-border focus:border-accent-cyan focus:outline-none"
              >
                {STATUTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
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

          {/* Livrables */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Livrables attendus</label>
            <Input
              name="livrables"
              value={formData.livrables}
              onChange={handleChange}
              placeholder="Séparés par des virgules : Prompt système, Documentation..."
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

          {/* Solution de référence */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Solution de référence</label>
            <textarea
              name="solution_reference"
              value={formData.solution_reference}
              onChange={handleChange}
              placeholder="Solution modèle pour les participants..."
              className="w-full h-32 p-3 rounded-lg bg-background border border-border focus:border-accent-cyan focus:outline-none resize-none"
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
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Enregistrer
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
