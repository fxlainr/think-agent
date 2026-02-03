# 🧠 THINK AGENT

> **DON'T JUST DO IT! TEACH IT!**

Plateforme de challenges IA pour les collaborateurs d'eXalt (1500-1700 personnes).

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-cyan)

## 🚀 Démarrage rapide

### 1. Cloner le repo

```bash
git clone https://github.com/fxlainr/think-agent.git
cd think-agent
npm install
```

### 2. Configurer Supabase

1. Crée un projet sur [supabase.com](https://supabase.com)
2. Va dans **SQL Editor** et exécute le contenu de `supabase/schema.sql`
3. Copie les clés depuis **Settings → API** :

```bash
cp .env.local.example .env.local
```

Édite `.env.local` :
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

### 3. Lancer en local

```bash
npm run dev
```

→ http://localhost:3000

## 📁 Structure

```
src/
├── app/                    # Pages Next.js (App Router)
│   ├── (auth)/login/      # Page de connexion
│   ├── challenges/        # Catalogue + détail challenge
│   ├── events/            # Événements Dojo
│   └── me/                # Profil utilisateur
├── components/
│   ├── ui/                # Composants shadcn/ui
│   ├── layout/            # Header, Footer
│   ├── challenges/        # Cards, filtres
│   └── providers/         # AuthProvider
├── lib/
│   ├── supabase/          # Client + queries
│   └── auth.ts            # Context auth
└── types/
    └── database.ts        # Types TypeScript
```

## 🎨 Charte Glitchforge

| Couleur | Hex | Usage |
|---------|-----|-------|
| Fond | `#0A0A0A` | Background principal |
| Bleu eXalt | `#3B82F6` | Primary, Crafter |
| Rose | `#EC4899` | Architecte |
| Vert | `#10B981` | Explorer, succès |
| Cyan | `#06B6D4` | Hover, liens |
| Jaune | `#FCD34D` | CTAs, XP |

## 🏗️ Déploiement Vercel

1. Connecte ton repo GitHub à [Vercel](https://vercel.com)
2. Configure les variables d'environnement :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy !

## 📊 Fonctionnalités MVP

- ✅ Authentification par email (sans mot de passe)
- ✅ Catalogue de challenges filtrable
- ✅ Système de progression (Explorer → Crafter → Architecte)
- ✅ Soumission de solutions
- ✅ Solution de référence (débloquée après soumission)
- ✅ Page profil avec XP, badges, leaderboard
- ✅ Événements Dojo avec lien 360 Learning
- ✅ Prérequis obligatoires (Basiques + Gardien)

## 🗺️ Roadmap

- [ ] Évaluation par mentors
- [ ] Upload de fichiers (Supabase Storage)
- [ ] Notifications
- [ ] Admin dashboard
- [ ] i18n (FR/EN)

---

**eXalt** - *Transformer chaque collaborateur en bâtisseur de son propre futur.*
