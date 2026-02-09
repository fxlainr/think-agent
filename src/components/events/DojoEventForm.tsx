'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MultiSelectMarques } from '@/components/ui/multi-select-marques';
import { Loader2, Save, X } from 'lucide-react';
import { createDojoEvent, updateDojoEvent } from '@/lib/supabase/queries';
import type { DojoEvent, EventFormat, Marque } from '@/types/database';

interface DojoEventFormProps {
  event?: DojoEvent;  // Si fourni = mode édition, sinon = création
  onSuccess: (event: DojoEvent) => void;
  onCancel: () => void;
}

const FORMATS: EventFormat[] = ['En_Ligne', 'Présentiel'];

export function DojoEventForm({ event, onSuccess, onCancel }: DojoEventFormProps) {
  const isEditing = !!event;
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    titre: event?.titre || '',
    description: event?.description || '',
    date_debut: event?.date_debut ? event.date_debut.slice(0, 16) : '',
    date_fin: event?.date_fin ? event.date_fin.slice(0, 16) : '',
    format: event?.format || 'En_Ligne' as EventFormat,
    capacite: event?.capacite || 15,
    lien_360learning: event?.lien_360learning || '',
    marques: event?.marques || [] as Marque[],
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
    
    if (!formData.titre.trim() || !formData.date_debut || !formData.date_fin) {
      alert('Titre, date de début et date de fin sont obligatoires');
      return;
    }

    setIsSubmitting(true);

    const eventData = {
      titre: formData.titre,
      description: formData.description,
      date_debut: new Date(formData.date_debut).toISOString(),
      date_fin: new Date(formData.date_fin).toISOString(),
      format: formData.format,
      capacite: Number(formData.capacite),
      lien_360learning: formData.lien_360learning,
      marques: formData.marques,
      organisateur_id: null,
    };

    let result: DojoEvent | null;
    
    if (isEditing && event) {
      result = await updateDojoEvent(event.id, eventData);
    } else {
      result = await createDojoEvent(eventData);
    }

    setIsSubmitting(false);

    if (result) {
      onSuccess(result);
    } else {
      alert(`Erreur lors de ${isEditing ? 'la mise à jour' : 'la création'} de l'événement`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informations de l&apos;événement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Titre */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Titre *</label>
            <Input
              name="titre"
              value={formData.titre}
              onChange={handleChange}
              placeholder="Ex: Dojo Think Agent #1"
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
              placeholder="Décris l'événement..."
              className="w-full h-24 p-3 rounded-lg bg-background border border-border focus:border-accent-cyan focus:outline-none resize-none"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date & heure de début *</label>
              <Input
                name="date_debut"
                type="datetime-local"
                value={formData.date_debut}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date & heure de fin *</label>
              <Input
                name="date_fin"
                type="datetime-local"
                value={formData.date_fin}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Format + Capacité */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Format</label>
              <select
                name="format"
                value={formData.format}
                onChange={handleChange}
                className="w-full p-2 rounded-lg bg-background border border-border focus:border-accent-cyan focus:outline-none"
              >
                {FORMATS.map((f) => (
                  <option key={f} value={f}>
                    {f === 'En_Ligne' ? 'En ligne' : f}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Capacité</label>
              <Input
                name="capacite"
                type="number"
                value={formData.capacite}
                onChange={handleChange}
                min={1}
              />
            </div>
          </div>

          {/* Lien 360Learning */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Lien 360Learning</label>
            <Input
              name="lien_360learning"
              value={formData.lien_360learning}
              onChange={handleChange}
              placeholder="https://360learning.com/..."
            />
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
              {isEditing ? 'Mise à jour...' : 'Création...'}
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {isEditing ? 'Enregistrer' : 'Créer l\'événement'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
