# THINK AGENT - Rapport d'Audit de Code

**Date :** 2026-02-07
**Version auditée :** 0.1.0 (MVP)
**Auditeur :** Claude Code (Audit automatisé)

---

## Table des matières

1. [Résumé exécutif](#1-résumé-exécutif)
2. [Architecture et structure](#2-architecture-et-structure)
3. [Sécurité](#3-sécurité)
4. [Qualité du code](#4-qualité-du-code)
5. [Base de données](#5-base-de-données)
6. [Tests](#6-tests)
7. [Performance](#7-performance)
8. [Dépendances](#8-dépendances)
9. [Accessibilité et UX](#9-accessibilité-et-ux)
10. [Recommandations prioritaires](#10-recommandations-prioritaires)

---

## 1. Résumé exécutif

**THINK AGENT** est une plateforme d'apprentissage IA gamifiée pour les collaborateurs d'eXalt (~1500 personnes). L'application est construite avec Next.js 16, React 19, Supabase et Tailwind CSS.

### Verdict global

| Catégorie | Note | Commentaire |
|-----------|------|-------------|
| Sécurité | **CRITIQUE** | Authentification sans protection réelle |
| Architecture | Correcte | Structure Next.js App Router bien organisée |
| Qualité du code | Bonne | Code lisible, services séparés de l'UI |
| Tests | Passable | 103 tests passent, mais couverture limitée |
| Performance | Correcte | Pas de problèmes majeurs détectés |
| Base de données | Passable | Schéma cohérent, RLS mal configuré |
| Dépendances | Bonne | Stack moderne, pas de vulnérabilités npm |

### Points forts
- Code TypeScript bien typé avec des interfaces claires
- Séparation business logic / UI (services `challengeService.ts`, `userService.ts`)
- 103 tests unitaires fonctionnels
- Gestion d'erreurs structurée (`QueryError`, `ErrorBoundary`)
- UX soignée (dark mode, gamification, design system Glitchforge)

### Points critiques
- **Absence totale d'authentification sécurisée** (accès par simple email)
- **RLS Supabase non fonctionnel** (toutes les policies sont `USING (true)`)
- **Injection potentielle dans les requêtes Supabase** (filtre search)
- **Race condition** dans la gestion des XP (`addUserXP`)
- **Build en échec** (fonts Google non accessibles en production)

---

## 2. Architecture et structure

### 2.1 Stack technologique

| Couche | Technologie | Version |
|--------|-------------|---------|
| Framework | Next.js (App Router) | 16.1.6 |
| UI | React | 19.2.3 |
| Langage | TypeScript | 5.x |
| CSS | Tailwind CSS | 4.x |
| Composants | shadcn/ui + Radix UI | 1.4.3 |
| BDD | Supabase (PostgreSQL) | 2.93.3 |
| Tests | Vitest + Testing Library | 4.0.18 |

### 2.2 Structure des fichiers

```
src/
├── app/           ← Pages (App Router)
├── components/    ← Composants React
│   ├── ui/        ← shadcn/ui (réutilisables)
│   ├── layout/    ← Header, Footer
│   ├── challenges/← ChallengeCard, Filters, FileUpload
│   └── providers/ ← AuthProvider
├── lib/           ← Utilitaires et intégration Supabase
│   └── supabase/  ← client, server, queries, storage
├── services/      ← Logique métier (challengeService, userService)
├── types/         ← Interfaces TypeScript
└── test/          ← Configuration tests et mocks
```

**Verdict :** L'architecture est bien organisée et suit les conventions Next.js App Router. La séparation entre pages, composants, services et requêtes est claire.

### 2.3 Points d'attention architecturaux

- **Client Supabase singleton** (`queries.ts:7`) : Le client est instancié une seule fois au niveau du module. Cela peut poser problème en SSR car le même client est réutilisé entre différentes requêtes serveur.
- **Toutes les pages sont `'use client'`** : Aucune page ne profite du Server-Side Rendering de Next.js. La page d'accueil, la page challenges, la page profil -- toutes sont des Client Components. Cela signifie que le contenu n'est pas indexable par les moteurs de recherche et que le premier affichage est plus lent.
- **Pas de middleware Next.js** : Aucun `middleware.ts` pour protéger les routes authentifiées (`/me`, `/challenges/[id]`).

---

## 3. Sécurité

### 3.1 CRITIQUE - Authentification fictive

**Fichiers :** `src/app/(auth)/login/page.tsx`, `src/lib/auth.ts`, `src/components/providers/AuthProvider.tsx`

Le système d'authentification n'en est pas un :

```
// login/page.tsx:40
const loggedInUser = await login(trimmedEmail);
```

- **Aucun mot de passe, aucun token, aucun OAuth, aucun magic link**
- N'importe qui peut se connecter avec n'importe quel email
- L'état utilisateur est stocké dans `localStorage` (`think_agent_user`)
- Un attaquant peut se connecter en tant que n'importe quel utilisateur existant simplement en entrant son email
- Un attaquant peut modifier le `localStorage` pour usurper n'importe quel utilisateur

**Impact :** N'importe qui peut accéder à n'importe quel compte, soumettre des solutions, modifier des participations, consulter des données privées.

**Sévérité : CRITIQUE**

### 3.2 CRITIQUE - Row Level Security inefficace

**Fichier :** `supabase/schema.sql:213-237`

Toutes les policies RLS sont permissives :

```sql
-- Tout le monde peut lire, créer et modifier TOUS les profils
CREATE POLICY "Users peuvent lire tous les profils" ON users FOR SELECT USING (true);
CREATE POLICY "Users peuvent créer leur profil" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Users peuvent modifier leur profil" ON users FOR UPDATE USING (true);
```

Les policies de storage (`20260204_storage_policies.sql`) référencent `auth.uid()` mais Supabase Auth n'est pas utilisé dans l'application. Ces policies ne protègent rien.

**Impact :** N'importe quel client avec la clé anon peut lire, créer et modifier n'importe quelle donnée dans la base.

**Sévérité : CRITIQUE**

### 3.3 HAUTE - Injection dans les filtres de recherche

**Fichier :** `src/lib/supabase/queries.ts:88`

```typescript
query = query.or(`titre.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
```

La valeur `filters.search` est injectée directement dans la chaîne de filtre PostgREST sans sanitization. Un utilisateur peut manipuler cette valeur pour altérer la requête PostgREST (injection de filtres supplémentaires via des caractères spéciaux comme `,`, `.`, `(`).

**Sévérité : HAUTE**

### 3.4 HAUTE - Clé API Supabase exposée côté client

**Fichier :** `src/lib/supabase/client.ts:4-6`

```typescript
process.env.NEXT_PUBLIC_SUPABASE_URL!
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
```

La clé anon est nécessairement publique dans un client Supabase. Cela est normal **si et seulement si** les RLS sont correctement configurées. Comme les RLS sont toutes `USING (true)`, cette clé donne un accès complet en lecture/écriture à toute la base de données.

**Sévérité : HAUTE** (conséquence directe du problème RLS)

### 3.5 MOYENNE - Pas de validation email côté serveur

**Fichier :** `src/app/(auth)/login/page.tsx:32`

```typescript
if (!trimmedEmail || !trimmedEmail.includes('@')) {
```

La validation email est minimaliste (`includes('@')`) et uniquement côté client. Aucune validation côté serveur. Les emails ne sont pas vérifiés (pas de confirmation par email).

**Sévérité : MOYENNE**

### 3.6 MOYENNE - Bucket storage public

**Fichier :** `src/lib/supabase/storage.ts:39-42`

```typescript
// URL publique (bucket est public)
const { data: urlData } = supabase.storage
  .from(BUCKET_NAME)
  .getPublicUrl(data.path);
```

Le bucket `solutions` est public. Toutes les solutions uploadées par les utilisateurs sont accessibles sans authentification si on connaît l'URL. Les fichiers suivent un pattern prévisible : `{userId}/{challengeId}/{timestamp}_{filename}`.

**Sévérité : MOYENNE**

### 3.7 BASSE - Assertions non-null sur les variables d'environnement

**Fichier :** `src/lib/supabase/client.ts:5-6`

```typescript
process.env.NEXT_PUBLIC_SUPABASE_URL!
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
```

L'opérateur `!` (non-null assertion) supprime le contrôle TypeScript. Si ces variables ne sont pas définies, l'application crashe sans message d'erreur explicite à l'exécution.

**Sévérité : BASSE**

---

## 4. Qualité du code

### 4.1 Points positifs

- **TypeScript strict** : Interfaces bien définies dans `types/database.ts` pour toutes les entités
- **Services découplés** : La logique métier (`challengeService.ts`, `userService.ts`) est séparée des composants UI et des requêtes DB
- **Gestion d'erreurs** : Classe `QueryError` avec codes d'erreur typés et messages user-friendly en français
- **Composants réutilisables** : shadcn/ui bien intégré avec des composants d'état (`LoadingState`, `EmptyState`, `ErrorState`)
- **Code cohérent** : Conventions de nommage suivies (français pour le domaine métier, anglais pour le code technique)

### 4.2 Bug - Fonction `addUserXP` cassée

**Fichier :** `src/lib/supabase/queries.ts:392-416`

```typescript
export async function addUserXP(userId: string, xp: number): Promise<void> {
  const user = await getUserByEmail(''); // On a besoin de l'email ou ID ← BUG: email vide
```

La fonction appelle `getUserByEmail('')` avec une chaîne vide. Elle repose ensuite sur un appel RPC `increment_user_xp` qui n'existe pas dans le schéma, et le fallback contient une **race condition** (lecture puis écriture non-atomique des points).

**Impact :** Les XP utilisateur ne sont jamais incrémentées correctement.

### 4.3 Code mort / incomplet

- `addUserXP()` est définie mais jamais appelée de manière fonctionnelle
- `checkAndUpdateLevel()` (`queries.ts:421-457`) duplique la logique de `calculateNextLevel()` dans `userService.ts`
- La fonction `getLeaderboard()` dans `queries.ts` ignore la fonction SQL `get_leaderboard()` définie dans le schéma et fait une requête manuelle à la place
- `updateUser()` accepte `Partial<User>` ce qui inclut `id`, `created_at`, etc. Pas de filtrage des champs modifiables

### 4.4 Incohérences

- **Doubles implémentations** : Le filtrage des challenges existe à la fois dans `queries.ts` (côté base) et dans `challengeService.ts:98-131` (côté client)
- **XP thresholds inconsistants** : `userService.ts` utilise `{Explorer: 0, Crafter: 200, Architecte: 500}` tandis que `me/page.tsx` utilise `{Explorer: 0, Crafter: 150, Architecte: 500}` - les seuils ne correspondent pas
- **Types casting** : Nombreux casts `as string[]` dans les pages (`challenge.sources as string[]`, `challenge.livrables as string[]`, `solution.fichiers_attaches as string[]`) au lieu de typer correctement les champs JSONB

### 4.5 Gestion d'erreurs incomplète

Les fonctions `queries.ts` retournent `null` ou `[]` en cas d'erreur avec un `console.error`, mais l'UI ne différencie pas "pas de données" et "erreur de chargement". Par exemple, si la base est indisponible, la page challenges affiche "Aucun challenge" au lieu d'un message d'erreur.

---

## 5. Base de données

### 5.1 Schéma

Le schéma est bien structuré avec :
- UUIDs comme clés primaires (bon choix pour Supabase)
- ENUMs PostgreSQL pour les types (bon pour l'intégrité)
- Contraintes CHECK sur `difficulte` (1-5) et `note` (1-5)
- Contraintes UNIQUE sur les paires (`user_id`, `challenge_id`)
- Index sur les colonnes fréquemment requêtées
- Triggers `updated_at` automatiques
- Cascades ON DELETE appropriées

### 5.2 Problèmes identifiés

| Problème | Fichier | Sévérité |
|----------|---------|----------|
| RLS toutes permissives (`USING (true)`) | `schema.sql:213-237` | CRITIQUE |
| Pas de politique DELETE sur `users`, `challenges` | `schema.sql` | HAUTE |
| `challenges.marque` est `TEXT` au lieu d'une FK vers `marques` | `schema.sql:105` | MOYENNE |
| `challenges.difficulte` est `INTEGER` sans index composé avec `niveau_associe` | `schema.sql:96` | BASSE |
| Données seed avec dates passées (2025-02) pour les événements | `schema.sql:430-458` | BASSE |
| La fonction `get_leaderboard()` n'est pas utilisée par l'application | `schema.sql:260-283` | BASSE |

### 5.3 Migrations

4 fichiers de migration sont présents mais il n'y a pas de système de migration automatisé (pas de Supabase CLI configuré, pas de numérotation séquentielle cohérente). L'ordre d'exécution dépend de la documentation.

---

## 6. Tests

### 6.1 Résultats

```
Test Files  : 9 passed (9)
Tests       : 103 passed (103)
Duration    : 8.66s
```

Tous les 103 tests passent.

### 6.2 Couverture

| Catégorie | Fichiers testés | Fichiers non testés |
|-----------|----------------|---------------------|
| Services | `challengeService.ts`, `userService.ts` | - |
| Lib | `errors.ts`, `queries.ts` (avec mocks) | `auth.ts`, `storage.ts`, `utils.ts` |
| Composants | `ChallengeCard`, `ChallengeFilters`, `states` | `Header`, `Footer`, `FileUpload`, `AuthProvider` |
| Pages | - | **Aucune page testée** |

### 6.3 Lacunes

- **Aucun test d'intégration** : Pas de tests end-to-end ou de tests avec une vraie base de données
- **Aucun test de page** : Les 7 pages de l'application ne sont pas testées
- **Mocks incomplets** : Le mock Supabase (`test/mocks/supabase.ts`) simule les réponses mais ne vérifie pas les paramètres des requêtes
- **Pas de test de sécurité** : Aucun test ne vérifie les contrôles d'accès
- **Pas de test du flow d'authentification**

---

## 7. Performance

### 7.1 Build

Le build Next.js **échoue** à cause des Google Fonts non accessibles :

```
Error: Failed to fetch `Geist` from Google Fonts.
Error: Failed to fetch `Geist Mono` from Google Fonts.
```

Ce problème ne bloque pas le développement local (`next dev`) mais empêche le déploiement en production dans un environnement sans accès internet.

### 7.2 Points d'attention

- **Cascade de requêtes** : La page profil (`me/page.tsx:51-56`) lance 4 requêtes Supabase en parallèle, ce qui est correct. Mais la page challenge detail (`challenges/[id]/page.tsx:52-69`) fait une requête séquentielle puis 2 en parallèle, ajoutant de la latence.
- **Pas de cache** : Aucun mécanisme de cache côté client (React Query, SWR, etc.). Chaque navigation re-fetch toutes les données.
- **Pas de pagination** : `getChallenges()` charge tous les challenges en une requête. Acceptable pour 9 challenges, problématique au-delà de 100.
- **Pas de lazy loading** : Tous les composants sont chargés immédiatement.

---

## 8. Dépendances

### 8.1 Audit npm

```
found 0 vulnerabilities
```

Aucune vulnérabilité connue dans les dépendances.

### 8.2 Stack à jour

| Package | Version | Commentaire |
|---------|---------|-------------|
| Next.js | 16.1.6 | Version récente |
| React | 19.2.3 | Version récente |
| Supabase JS | 2.93.3 | Version récente |
| TypeScript | 5.x | Version récente |
| Vitest | 4.0.18 | Version récente |
| Tailwind CSS | 4.x | Version récente |

### 8.3 Dépendance inutilisée

- **`next-intl`** (`^4.8.2`) est déclaré dans `package.json` mais n'est importé nulle part dans le code. Toutes les chaînes sont en dur en français.

---

## 9. Accessibilité et UX

### 9.1 Points positifs

- Utilisation de Radix UI (primitives accessibles)
- Attributs `title` sur certains éléments interactifs (bouton déconnexion)
- Structure sémantique (`header`, `main`, `nav`, `footer`)
- Responsive design (breakpoints `sm:`, `md:`, `lg:`)

### 9.2 Points d'amélioration

- **Navigation mobile incomplète** : Le menu de navigation est caché (`hidden md:flex`) sur mobile sans hamburger menu ni alternative
- **Pas de labels explicites** : Le champ email du login n'a pas de `<label>` visible
- **Pas d'attributs aria** : Les états de chargement, les filtres dynamiques et les tabs n'ont pas d'attributs `aria-live`, `aria-busy`
- **Contraste** : Le thème dark avec certaines couleurs (gris sur fond sombre) pourrait ne pas respecter WCAG 2.1 AA (non vérifié quantitativement)

---

## 10. Recommandations prioritaires

### Priorité 1 - CRITIQUE (à corriger avant tout déploiement)

| # | Recommandation | Effort |
|---|----------------|--------|
| 1 | **Implémenter une vraie authentification** : Utiliser Supabase Auth (magic link, OAuth Google/Microsoft, ou email+password). Supprimer le système email-only actuel. | Moyen |
| 2 | **Corriger les RLS** : Remplacer toutes les policies `USING (true)` par des policies basées sur `auth.uid()`. Les utilisateurs ne doivent pouvoir modifier que leurs propres données. | Moyen |
| 3 | **Sanitizer les inputs de recherche** : Échapper les caractères spéciaux PostgREST dans `getChallenges()` avant de les injecter dans `.or()`. Utiliser les méthodes `.ilike()` chaînées au lieu de string interpolation. | Faible |

### Priorité 2 - HAUTE (à corriger rapidement)

| # | Recommandation | Effort |
|---|----------------|--------|
| 4 | **Corriger `addUserXP()`** : Supprimer l'appel `getUserByEmail('')`, créer la fonction RPC `increment_user_xp` en SQL, ou utiliser une transaction atomique. | Faible |
| 5 | **Ajouter un middleware Next.js** : Protéger les routes `/me`, `/challenges/[id]` pour rediriger les utilisateurs non-authentifiés. | Faible |
| 6 | **Corriger le build** : Configurer les Google Fonts en local (télécharger les fichiers) ou ajouter un fallback pour les environnements hors-ligne. | Faible |
| 7 | **Rendre le bucket storage privé** : Utiliser des signed URLs systématiquement au lieu d'URLs publiques pour les solutions. | Faible |

### Priorité 3 - MOYENNE (améliorations recommandées)

| # | Recommandation | Effort |
|---|----------------|--------|
| 8 | **Harmoniser les seuils XP** : Aligner `userService.ts` et `me/page.tsx` sur les mêmes valeurs de `LEVEL_THRESHOLDS`. | Faible |
| 9 | **Supprimer le code mort** : Nettoyer `checkAndUpdateLevel()` dans `queries.ts`, la dépendance `next-intl`. | Faible |
| 10 | **Ajouter du SSR** : Convertir les pages qui n'ont pas besoin d'interactivité initiale (page d'accueil, catalogue challenges) en Server Components pour améliorer le SEO et le temps de chargement. | Moyen |
| 11 | **Ajouter un client-side cache** : Intégrer React Query ou SWR pour éviter les re-fetch inutiles et améliorer l'UX. | Moyen |
| 12 | **Valider les inputs côté serveur** : Ajouter une validation email stricte (regex RFC 5322 ou Zod) et des validations sur les données soumises. | Faible |
| 13 | **Ajouter la navigation mobile** : Implémenter un menu hamburger ou une barre de navigation bottom pour mobile. | Faible |

### Priorité 4 - BASSE (bonnes pratiques)

| # | Recommandation | Effort |
|---|----------------|--------|
| 14 | Ajouter des tests E2E (Playwright ou Cypress) pour les parcours critiques. | Élevé |
| 15 | Faire du champ `challenges.marque` une FK vers la table `marques`. | Faible |
| 16 | Mettre en place un système de migration automatisé (Supabase CLI). | Moyen |
| 17 | Ajouter un rate limiting sur le endpoint de login pour prévenir le brute-force. | Moyen |
| 18 | Valider les variables d'environnement au démarrage avec une assertion explicite plutôt que `!`. | Faible |

---

## Annexes

### A. Fichiers analysés (liste complète)

| Fichier | Lignes | Rôle |
|---------|--------|------|
| `src/lib/supabase/queries.ts` | 458 | Toutes les requêtes BDD |
| `src/app/challenges/[id]/page.tsx` | 550 | Page détail challenge |
| `supabase/schema.sql` | 459 | Schéma complet BDD |
| `src/app/me/page.tsx` | 371 | Page profil utilisateur |
| `src/components/challenges/FileUpload.tsx` | 183 | Composant upload fichier |
| `src/services/userService.ts` | 174 | Logique métier utilisateur |
| `src/app/(auth)/login/page.tsx` | 145 | Page de login |
| `src/types/database.ts` | 146 | Interfaces TypeScript |
| `src/services/challengeService.ts` | 132 | Logique métier challenges |
| `src/lib/supabase/storage.ts` | 118 | Gestion fichiers Supabase |
| `src/components/layout/Header.tsx` | 99 | Barre de navigation |
| `src/lib/errors.ts` | 77 | Gestion d'erreurs |
| `src/lib/auth.ts` | 56 | Contexte authentification |
| `src/app/layout.tsx` | 41 | Layout racine |
| `src/lib/supabase/client.ts` | 9 | Client Supabase browser |
| `src/lib/supabase/server.ts` | 28 | Client Supabase serveur |
| `package.json` | 46 | Dépendances |

### B. Commandes d'audit exécutées

```bash
npm audit          # 0 vulnerabilities
npx vitest run     # 9 suites, 103 tests, 0 failures
npx next build     # FAIL (Google Fonts fetch error)
git log --oneline  # 20 commits analysés
```

---

*Ce rapport est un instantané de l'état du code au 2026-02-07. Il couvre les aspects sécurité, qualité, performance et maintenabilité. Les recommandations sont classées par priorité et effort estimé.*
