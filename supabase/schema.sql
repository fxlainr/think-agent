-- ===========================================
-- THINK AGENT - Schema Supabase
-- ===========================================

-- Extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- TABLES RÉFÉRENTIELLES
-- ===========================================

-- Marques eXalt
CREATE TABLE marques (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO marques (nom, description) VALUES
  ('FLOW', 'Produit / Projet / Change'),
  ('IT', 'Développement'),
  ('VALUE', 'Data / IA'),
  ('FORGE', 'Cloud / DevOps'),
  ('FI', 'Finance de marché'),
  ('SHIELD', 'Cybersécurité'),
  ('NILO', 'Engineering / Industrie');

-- Métiers
CREATE TABLE metiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom TEXT NOT NULL,
  marque_id UUID REFERENCES marques(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO metiers (nom, marque_id) VALUES
  ('Product Manager', (SELECT id FROM marques WHERE nom = 'FLOW')),
  ('UX/UI Designer', (SELECT id FROM marques WHERE nom = 'FLOW')),
  ('Scrum Master', (SELECT id FROM marques WHERE nom = 'FLOW')),
  ('Chef de projet', (SELECT id FROM marques WHERE nom = 'FLOW')),
  ('Change Manager', (SELECT id FROM marques WHERE nom = 'FLOW')),
  ('Développeur', (SELECT id FROM marques WHERE nom = 'IT')),
  ('Tech Lead', (SELECT id FROM marques WHERE nom = 'IT')),
  ('Data Scientist', (SELECT id FROM marques WHERE nom = 'VALUE')),
  ('Data Engineer', (SELECT id FROM marques WHERE nom = 'VALUE')),
  ('Data Analyst', (SELECT id FROM marques WHERE nom = 'VALUE')),
  ('ML Engineer', (SELECT id FROM marques WHERE nom = 'VALUE')),
  ('Ingénieur DevOps', (SELECT id FROM marques WHERE nom = 'FORGE')),
  ('Cloud Engineer', (SELECT id FROM marques WHERE nom = 'FORGE')),
  ('SRE', (SELECT id FROM marques WHERE nom = 'FORGE')),
  ('Business Analyst Finance', (SELECT id FROM marques WHERE nom = 'FI')),
  ('Quant/IT Quant', (SELECT id FROM marques WHERE nom = 'FI')),
  ('Analyste Cybersécurité', (SELECT id FROM marques WHERE nom = 'SHIELD')),
  ('Pentester', (SELECT id FROM marques WHERE nom = 'SHIELD')),
  ('Ingénieur Industriel', (SELECT id FROM marques WHERE nom = 'NILO')),
  ('Chef de projet technique', (SELECT id FROM marques WHERE nom = 'NILO'));

-- ===========================================
-- TABLES PRINCIPALES
-- ===========================================

-- Types ENUM
CREATE TYPE user_level AS ENUM ('Explorer', 'Crafter', 'Architecte');
CREATE TYPE user_role AS ENUM ('Utilisateur', 'Mentor', 'Administrateur');
CREATE TYPE challenge_type AS ENUM ('Quiz', 'Exercice', 'Projet', 'Use_Case');
CREATE TYPE evaluation_type AS ENUM ('Manuelle', 'Automatique', 'Hybride');
CREATE TYPE challenge_status AS ENUM ('Actif', 'Archivé');
CREATE TYPE solution_status AS ENUM ('Soumise', 'Évaluée');
CREATE TYPE participation_status AS ENUM ('En_cours', 'Terminé', 'Abandonné');
CREATE TYPE event_format AS ENUM ('En_Ligne', 'Présentiel');
CREATE TYPE participant_type AS ENUM ('Solo', 'Duo', 'Équipe');

-- Utilisateurs
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  nom TEXT,
  metier_id UUID REFERENCES metiers(id),
  marque_id UUID REFERENCES marques(id),
  localisation TEXT,
  niveau_actuel user_level DEFAULT 'Explorer',
  role user_role DEFAULT 'Utilisateur',
  points_totaux INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Challenges
CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titre TEXT NOT NULL,
  description TEXT NOT NULL,
  niveau_associe user_level NOT NULL,
  type challenge_type NOT NULL,
  difficulte INTEGER CHECK (difficulte >= 1 AND difficulte <= 5) NOT NULL,
  duree_estimee TEXT NOT NULL,
  type_evaluation evaluation_type NOT NULL,
  outils_recommandes JSONB DEFAULT '[]',
  criteres_evaluation TEXT,
  xp INTEGER NOT NULL,
  statut challenge_status DEFAULT 'Actif',
  solution_reference TEXT,
  solution_fichiers JSONB DEFAULT '[]',
  marque TEXT DEFAULT 'Tous',
  participants participant_type DEFAULT 'Solo',
  livrables JSONB DEFAULT '[]',
  -- Nouveaux champs (enrichissement contenu)
  vision_impact TEXT,                -- Pourquoi ce challenge est important (stratégique)
  le_saviez_vous TEXT,               -- Anecdote / hook engageant
  sources JSONB DEFAULT '[]',        -- Liens vers articles/posts LinkedIn
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Participations (user <-> challenge)
CREATE TABLE participations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  statut participation_status DEFAULT 'En_cours',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, challenge_id)
);

-- Solutions soumises
CREATE TABLE solutions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  contenu_texte TEXT,
  fichiers_attaches JSONB DEFAULT '[]',
  statut solution_status DEFAULT 'Soumise',
  note INTEGER CHECK (note >= 1 AND note <= 5),
  feedback_reviewer TEXT,
  reviewer_id UUID REFERENCES users(id),
  a_consulte_solution BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, challenge_id)
);

-- Badges
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom TEXT UNIQUE NOT NULL,
  description TEXT,
  emoji TEXT NOT NULL,
  conditions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO badges (nom, description, emoji, conditions) VALUES
  ('Premier Pas', 'Premier challenge validé', '🌱', '{"challenges_completed": 1}'),
  ('Bâtisseur', 'Premier outil créé (Crafter)', '🛠️', '{"level_reached": "Crafter"}'),
  ('Binôme', 'Challenge réalisé en duo', '🤝', '{"duo_challenge": true}'),
  ('On Fire', '3 challenges validés en 1 mois', '🔥', '{"monthly_challenges": 3}'),
  ('Explorer Complet', 'Tous les challenges Explorer validés', '🏆', '{"level_complete": "Explorer"}'),
  ('Crafter Complet', 'Tous les challenges Crafter validés', '🏆', '{"level_complete": "Crafter"}'),
  ('Architect Complet', 'Tous les challenges Architect validés', '🏆', '{"level_complete": "Architecte"}');

-- Obtention badges (user <-> badge)
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
  obtained_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Événements Dojo
CREATE TABLE evenements_dojo (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titre TEXT NOT NULL,
  description TEXT,
  date_debut TIMESTAMPTZ NOT NULL,
  date_fin TIMESTAMPTZ NOT NULL,
  format event_format NOT NULL,
  capacite INTEGER DEFAULT 15,
  lien_360learning TEXT NOT NULL,
  organisateur_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- INDEX
-- ===========================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_niveau ON users(niveau_actuel);
CREATE INDEX idx_users_marque ON users(marque_id);
CREATE INDEX idx_challenges_niveau ON challenges(niveau_associe);
CREATE INDEX idx_challenges_statut ON challenges(statut);
CREATE INDEX idx_participations_user ON participations(user_id);
CREATE INDEX idx_participations_challenge ON participations(challenge_id);
CREATE INDEX idx_solutions_user ON solutions(user_id);
CREATE INDEX idx_solutions_challenge ON solutions(challenge_id);
CREATE INDEX idx_evenements_date ON evenements_dojo(date_debut);

-- ===========================================
-- ROW LEVEL SECURITY (RLS)
-- ===========================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE solutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE evenements_dojo ENABLE ROW LEVEL SECURITY;

-- Policies pour lecture publique (app interne)
CREATE POLICY "Challenges visibles par tous" ON challenges FOR SELECT USING (true);
CREATE POLICY "Événements visibles par tous" ON evenements_dojo FOR SELECT USING (true);
CREATE POLICY "Badges visibles par tous" ON badges FOR SELECT USING (true);
CREATE POLICY "Marques visibles par tous" ON marques FOR SELECT USING (true);
CREATE POLICY "Métiers visibles par tous" ON metiers FOR SELECT USING (true);

-- Policies pour users (simplifié - pas d'auth complexe)
CREATE POLICY "Users peuvent lire tous les profils" ON users FOR SELECT USING (true);
CREATE POLICY "Users peuvent créer leur profil" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Users peuvent modifier leur profil" ON users FOR UPDATE USING (true);

-- Policies pour participations
CREATE POLICY "Participations visibles par tous" ON participations FOR SELECT USING (true);
CREATE POLICY "Users peuvent créer leurs participations" ON participations FOR INSERT WITH CHECK (true);
CREATE POLICY "Users peuvent modifier leurs participations" ON participations FOR UPDATE USING (true);

-- Policies pour solutions
CREATE POLICY "Solutions visibles par tous" ON solutions FOR SELECT USING (true);
CREATE POLICY "Users peuvent créer leurs solutions" ON solutions FOR INSERT WITH CHECK (true);
CREATE POLICY "Users peuvent modifier leurs solutions" ON solutions FOR UPDATE USING (true);

-- Policies pour user_badges
CREATE POLICY "Badges utilisateurs visibles par tous" ON user_badges FOR SELECT USING (true);
CREATE POLICY "Système peut attribuer badges" ON user_badges FOR INSERT WITH CHECK (true);

-- ===========================================
-- FONCTIONS UTILITAIRES
-- ===========================================

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers updated_at
CREATE TRIGGER users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER challenges_updated_at BEFORE UPDATE ON challenges FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER participations_updated_at BEFORE UPDATE ON participations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER solutions_updated_at BEFORE UPDATE ON solutions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER evenements_updated_at BEFORE UPDATE ON evenements_dojo FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Fonction pour calculer le leaderboard
CREATE OR REPLACE FUNCTION get_leaderboard(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  user_id UUID,
  nom TEXT,
  niveau_actuel user_level,
  points_totaux INTEGER,
  marque_nom TEXT,
  rank BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.nom,
    u.niveau_actuel,
    u.points_totaux,
    m.nom,
    ROW_NUMBER() OVER (ORDER BY u.points_totaux DESC)
  FROM users u
  LEFT JOIN marques m ON u.marque_id = m.id
  ORDER BY u.points_totaux DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- DONNÉES INITIALES - CHALLENGES
-- ===========================================

-- Challenges Explorer
INSERT INTO challenges (titre, description, niveau_associe, type, difficulte, duree_estimee, type_evaluation, outils_recommandes, criteres_evaluation, xp, marque, livrables) VALUES
(
  'Les Basiques du Prompting',
  'Quiz interactif pour maîtriser les fondamentaux du prompting : zero-shot, few-shot, chain-of-thought, persona. La base indispensable pour tous les autres challenges.',
  'Explorer',
  'Quiz',
  1,
  '15 min',
  'Automatique',
  '["Chat IA"]',
  'Score au quiz ≥ 80%',
  50,
  'Tous',
  '["Quiz complété"]'
),
(
  'Le Gardien des Données',
  'Quiz sur la confidentialité, le RGPD et les bonnes pratiques d''anonymisation. Indispensable pour utiliser l''IA de manière responsable.',
  'Explorer',
  'Quiz',
  1,
  '15 min',
  'Automatique',
  '["Chat IA"]',
  'Score au quiz ≥ 80%',
  50,
  'Tous',
  '["Quiz complété"]'
),
(
  'Le Coffre-Fort',
  'Créer un assistant résistant au prompt injection. Apprends à sécuriser tes prompts contre les tentatives de manipulation.',
  'Explorer',
  'Exercice',
  2,
  '30 min',
  'Automatique',
  '["Chat IA"]',
  'Assistant résiste à 5 attaques de test',
  75,
  'Tous',
  '["Prompt système", "Documentation défenses"]'
),
(
  'La Fabrique à Experts',
  'Créer une formation complète avec NotebookLM : modules structurés, quiz de validation et podcast audio généré automatiquement.',
  'Explorer',
  'Projet',
  2,
  '1h',
  'Manuelle',
  '["NotebookLM", "Google Docs"]',
  'Formation avec 3+ modules, quiz et podcast',
  75,
  'Tous',
  '["Formation NotebookLM", "Podcast audio"]'
);

-- Challenges Crafter
INSERT INTO challenges (titre, description, niveau_associe, type, difficulte, duree_estimee, type_evaluation, outils_recommandes, criteres_evaluation, xp, marque, livrables, solution_reference) VALUES
(
  'Le Conseiller McKinsey',
  'Créer un assistant stratégique maîtrisant les frameworks MECE, Pyramide de Minto et Issue Trees. L''IA qui challenge vraiment tes idées.',
  'Crafter',
  'Projet',
  3,
  '2h',
  'Manuelle',
  '["Chat IA", "Google Docs"]',
  'Assistant fonctionnel + session documentée',
  150,
  'Tous',
  '["Assistant", "Documentation session"]',
  'Tu es un consultant senior McKinsey avec 15 ans d''expérience. Tu maîtrises les frameworks MECE, Pyramide de Minto, Issue Trees. Tu challenges systématiquement les hypothèses et poses des questions incisives.'
),
(
  'PRD Manager',
  'Assistant qui mène des entretiens structurés et rédige des PRD (Product Requirements Document) professionnels.',
  'Crafter',
  'Projet',
  3,
  '2h',
  'Manuelle',
  '["Chat IA", "Google Docs"]',
  'Assistant + PRD généré sur cas réel',
  150,
  'FLOW',
  '["Assistant", "PRD exemple"]',
  NULL
),
(
  'Veille Augmentée',
  'Pipeline n8n de veille automatisée : collecte RSS, filtrage par pertinence IA, synthèse quotidienne et livraison Slack/Email.',
  'Crafter',
  'Projet',
  3,
  '2h',
  'Manuelle',
  '["n8n", "OpenAI", "Slack"]',
  'Workflow fonctionnel + 2 sources minimum',
  150,
  'Tous',
  '["Workflow n8n", "Exemple de newsletter"]',
  NULL
);

-- Challenges Architecte
INSERT INTO challenges (titre, description, niveau_associe, type, difficulte, duree_estimee, type_evaluation, outils_recommandes, criteres_evaluation, xp, marque, livrables) VALUES
(
  'L''Employé Numérique',
  'Agent conversationnel capable de créer des workflows n8n à partir de descriptions en langage naturel. Le meta-challenge.',
  'Architecte',
  'Projet',
  4,
  '4h',
  'Manuelle',
  '["Chat IA", "n8n", "API n8n"]',
  'Agent créant des workflows fonctionnels',
  300,
  'FORGE',
  '["Agent", "3 workflows générés"]'
),
(
  'AgCraft (Boss Final) 🏆',
  'Interface RTS pour piloter des agents IA. Crée un système où tu supervises plusieurs agents qui collaborent sur des tâches complexes.',
  'Architecte',
  'Projet',
  5,
  '16h',
  'Manuelle',
  '["Multi-agents", "API", "Interface custom"]',
  'Système multi-agents fonctionnel',
  400,
  'Tous',
  '["Système complet", "Documentation architecture"]'
);

-- ===========================================
-- DONNÉES INITIALES - ÉVÉNEMENTS
-- ===========================================

INSERT INTO evenements_dojo (titre, description, date_debut, date_fin, format, capacite, lien_360learning) VALUES
(
  'Dojo Think Agent #1 - Les Basiques du Prompting',
  'Atelier pratique pour maîtriser les fondamentaux du prompting : zero-shot, few-shot, chain-of-thought. Parfait pour débuter ton parcours IA.',
  '2025-02-15 10:00:00+00',
  '2025-02-15 11:00:00+00',
  'En_Ligne',
  12,
  'https://360learning.com/exalt/dojo-1'
),
(
  'Dojo Think Agent #2 - Crée ton premier assistant',
  'Atelier hands-on : crée ton premier assistant métier avec un prompt système structuré. Accompagnement par les mentors eXalt.',
  '2025-02-28 14:00:00+00',
  '2025-02-28 15:00:00+00',
  'En_Ligne',
  10,
  'https://360learning.com/exalt/dojo-2'
),
(
  'Dojo Think Agent #3 - Présentiel Paris',
  'Atelier en présentiel dans les locaux eXalt Paris. Networking et pratique sur les challenges Crafter.',
  '2025-03-15 10:00:00+00',
  '2025-03-15 11:00:00+00',
  'Présentiel',
  15,
  'https://360learning.com/exalt/dojo-3'
);
