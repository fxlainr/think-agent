# Scripts ThinkAgent

## evaluate-solutions.ts

Script d'évaluation automatique des solutions soumises par les consultants.

### Installation

```bash
cd think-agent
npm install
```

### Variables d'environnement

Créer un fichier `.env.local` à la racine :

```env
NEXT_PUBLIC_SUPABASE_URL=https://szvtfhhrfdaepfhsywhq.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<demander à FX>
OPENAI_API_KEY=<ta clé OpenAI>
```

### Exécution

```bash
npx ts-node scripts/evaluate-solutions.ts
```

### Ce que fait le script

1. **Récupère** toutes les solutions avec `statut = 'Soumise'`
2. **Évalue** chaque solution via un LLM (partie à compléter)
3. **Met à jour** la solution en base :
   - `statut` → `'Évaluée'`
   - `note` → 1 à 5
   - `feedback_reviewer` → explication de la note

### Ce qui est à compléter

La fonction `evaluateSolution()` (ligne ~90) contient un placeholder.

Tu dois :
1. Construire le prompt avec le contexte du challenge
2. Appeler le LLM (OpenAI ou Anthropic)
3. Parser la réponse et retourner `{ note, feedback, isValid }`

Un exemple de prompt et d'appel OpenAI est commenté dans le code.

---

## Schéma de données

### Table `challenges`

| Champ | Type | Description |
|-------|------|-------------|
| id | uuid | ID unique |
| titre | text | Nom du challenge |
| description | text | Description complète avec attendus |
| niveau_associe | enum | 'Explorer' / 'Crafter' / 'Architecte' |
| type | enum | 'Quiz' / 'Exercice' / 'Projet' / 'Use_Case' |
| difficulte | int | 1 à 5 |
| criteres_evaluation | text | Critères spécifiques pour noter |
| xp | int | Points gagnés à la validation |

### Table `solutions`

| Champ | Type | Description |
|-------|------|-------------|
| id | uuid | ID unique |
| user_id | uuid | Consultant qui a soumis |
| challenge_id | uuid | Challenge concerné |
| contenu_texte | text | Réponse textuelle |
| fichiers_attaches | text[] | URLs des fichiers uploadés |
| statut | enum | 'Soumise' → 'Évaluée' |
| note | int | 1-5 (null avant évaluation) |
| feedback_reviewer | text | Feedback de l'évaluateur |
| created_at | timestamp | Date de soumission |

---

## Exemple de challenge (pour tests)

```json
{
  "id": "test-123",
  "titre": "Les basiques du prompting",
  "description": "Maîtriser les fondamentaux du prompt engineering.\n\nObjectif : Rédiger 3 prompts différents pour une même tâche (résumer un article) en utilisant les techniques : zero-shot, few-shot, et chain-of-thought.\n\nLivrables attendus :\n1. Les 3 prompts rédigés\n2. Un exemple de résultat pour chaque\n3. Une analyse comparative (lequel fonctionne le mieux et pourquoi)",
  "niveau_associe": "Explorer",
  "type": "Exercice",
  "difficulte": 2,
  "criteres_evaluation": "- Compréhension des 3 techniques (zero-shot, few-shot, CoT)\n- Qualité des prompts rédigés\n- Pertinence de l'analyse comparative\n- Clarté de la présentation",
  "xp": 50
}
```

### Exemple de solution valide (note 4-5)

```
## Mes 3 prompts pour résumer un article

### 1. Zero-shot
"Résume cet article en 3 points clés : [article]"

Résultat : Le modèle a identifié les points principaux mais de façon parfois superficielle.

### 2. Few-shot
"Voici comment résumer un article :
Exemple 1 : [article] → [résumé]
Exemple 2 : [article] → [résumé]

Maintenant résume : [nouvel article]"

Résultat : Résumé plus structuré, suit le format des exemples.

### 3. Chain-of-thought
"Résume cet article étape par étape :
1. Identifie le sujet principal
2. Liste les arguments clés
3. Note la conclusion
4. Synthétise en 3 points

Article : [article]"

Résultat : Résumé le plus complet, le raisonnement étape par étape améliore la qualité.

## Analyse
Le Chain-of-thought donne les meilleurs résultats car il force le modèle à structurer sa réflexion. Le few-shot est utile pour imposer un format. Le zero-shot est rapide mais moins fiable.
```

### Exemple de solution insuffisante (note 1-2)

```
J'ai testé ChatGPT et ça marche bien pour résumer.
```

---

## Barème de notation

| Note | Signification |
|------|---------------|
| 1 | Hors sujet ou très incomplet |
| 2 | Tentative mais manque l'essentiel |
| 3 | Correct, répond aux critères de base |
| 4 | Bon travail, au-delà des attentes |
| 5 | Excellent, créatif et exemplaire |

Une solution est considérée **validée** si `note >= 3`.
