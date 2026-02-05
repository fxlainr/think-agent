-- Migration: Ajout des champs d'enrichissement pour les challenges
-- Date: 2026-02-05
-- Description: Ajoute vision_impact, le_saviez_vous, sources

-- Ajouter les nouveaux champs
ALTER TABLE challenges 
ADD COLUMN IF NOT EXISTS vision_impact TEXT,
ADD COLUMN IF NOT EXISTS le_saviez_vous TEXT,
ADD COLUMN IF NOT EXISTS sources JSONB DEFAULT '[]';

-- Commentaires pour documentation
COMMENT ON COLUMN challenges.vision_impact IS 'Pourquoi ce challenge est important (vision stratégique, impact métier)';
COMMENT ON COLUMN challenges.le_saviez_vous IS 'Anecdote ou fait marquant pour engager le lecteur';
COMMENT ON COLUMN challenges.sources IS 'Liens vers articles, posts LinkedIn ou ressources externes (array JSON)';
