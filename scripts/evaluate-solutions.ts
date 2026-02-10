/**
 * Script d'évaluation automatique des solutions ThinkAgent
 * 
 * Ce script récupère les solutions en attente d'évaluation,
 * les analyse via un LLM, et met à jour la base avec la note et le feedback.
 * 
 * Usage: npx ts-node scripts/evaluate-solutions.ts
 * 
 * Variables d'environnement requises:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY (ou NEXT_PUBLIC_SUPABASE_ANON_KEY)
 * - OPENAI_API_KEY (ou ANTHROPIC_API_KEY selon le LLM choisi)
 */

import { createClient } from '@supabase/supabase-js';

// ==========================================
// CONFIGURATION
// ==========================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Variables Supabase manquantes. Vérifiez NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ==========================================
// TYPES
// ==========================================

interface Challenge {
  id: string;
  titre: string;
  description: string;
  niveau_associe: 'Explorer' | 'Crafter' | 'Architecte';
  type: string;
  difficulte: number;
  criteres_evaluation: string;
  xp: number;
}

interface Solution {
  id: string;
  user_id: string;
  challenge_id: string;
  contenu_texte: string;
  fichiers_attaches: string[] | null;
  statut: 'Soumise' | 'Évaluée';
  note: number | null;
  feedback_reviewer: string | null;
  created_at: string;
}

interface SolutionWithChallenge extends Solution {
  challenge: Challenge;
}

interface EvaluationResult {
  note: number;           // 1-5
  feedback: string;       // Feedback détaillé pour le consultant
  isValid: boolean;       // true si la solution répond aux critères
}

// ==========================================
// RÉCUPÉRATION DES SOLUTIONS EN ATTENTE
// ==========================================

async function getPendingSolutions(): Promise<SolutionWithChallenge[]> {
  const { data, error } = await supabase
    .from('solutions')
    .select(`
      *,
      challenge:challenges(*)
    `)
    .eq('statut', 'Soumise')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('❌ Erreur récupération solutions:', error);
    return [];
  }

  return (data || []) as SolutionWithChallenge[];
}

// ==========================================
// ÉVALUATION D'UNE SOLUTION (À COMPLÉTER)
// ==========================================

/**
 * TODO: Implémenter l'appel au LLM pour évaluer la solution
 * 
 * Cette fonction reçoit:
 * - solution: le texte et fichiers soumis par le consultant
 * - challenge: le challenge avec sa description et critères d'évaluation
 * 
 * Elle doit retourner:
 * - note: 1 (insuffisant) à 5 (excellent)
 * - feedback: explication de la note, points forts/faibles
 * - isValid: true si la solution est recevable (note >= 3)
 * 
 * Exemple de prompt suggéré:
 * ```
 * Tu es un évaluateur de solutions pour des challenges IA.
 * 
 * CHALLENGE: {titre}
 * DESCRIPTION: {description}
 * CRITÈRES D'ÉVALUATION: {criteres_evaluation}
 * NIVEAU: {niveau_associe}
 * 
 * SOLUTION SOUMISE:
 * {contenu_texte}
 * 
 * Évalue cette solution sur 5 points:
 * 1 = Hors sujet ou incomplet
 * 2 = Tentative mais manque l'essentiel  
 * 3 = Correct, répond aux critères de base
 * 4 = Bon travail, au-delà des attentes
 * 5 = Excellent, créatif et exemplaire
 * 
 * Réponds en JSON: { "note": X, "feedback": "...", "isValid": true/false }
 * ```
 */
async function evaluateSolution(
  solution: SolutionWithChallenge
): Promise<EvaluationResult> {
  const { challenge } = solution;

  console.log(`\n📝 Évaluation: "${challenge.titre}"`);
  console.log(`   Niveau: ${challenge.niveau_associe} | Difficulté: ${challenge.difficulte}/5`);
  console.log(`   Solution: ${solution.contenu_texte.substring(0, 100)}...`);

  // ==========================================
  // TODO: REMPLACER CE BLOC PAR L'APPEL LLM
  // ==========================================
  
  // Exemple de données pour test (à supprimer)
  const mockResult: EvaluationResult = {
    note: 3,
    feedback: "🚧 Évaluation automatique non implémentée. Ceci est un placeholder.",
    isValid: true,
  };

  // Exemple d'appel OpenAI (à décommenter et adapter):
  /*
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  
  const prompt = `Tu es un évaluateur de solutions...`; // Voir prompt suggéré ci-dessus
  
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "Tu évalues des solutions de challenges IA. Réponds uniquement en JSON." },
      { role: "user", content: prompt }
    ],
    response_format: { type: "json_object" }
  });
  
  const result = JSON.parse(response.choices[0].message.content);
  return {
    note: result.note,
    feedback: result.feedback,
    isValid: result.note >= 3
  };
  */

  return mockResult;
  
  // ==========================================
  // FIN DU BLOC À COMPLÉTER
  // ==========================================
}

// ==========================================
// MISE À JOUR DE LA SOLUTION EN BASE
// ==========================================

async function updateSolutionEvaluation(
  solutionId: string,
  evaluation: EvaluationResult
): Promise<boolean> {
  const { error } = await supabase
    .from('solutions')
    .update({
      statut: 'Évaluée',
      note: evaluation.note,
      feedback_reviewer: evaluation.feedback,
    })
    .eq('id', solutionId);

  if (error) {
    console.error(`❌ Erreur mise à jour solution ${solutionId}:`, error);
    return false;
  }

  return true;
}

// ==========================================
// BOUCLE PRINCIPALE
// ==========================================

async function main() {
  console.log('🚀 Démarrage évaluation des solutions ThinkAgent');
  console.log('================================================\n');

  // 1. Récupérer les solutions en attente
  const solutions = await getPendingSolutions();
  
  if (solutions.length === 0) {
    console.log('✅ Aucune solution en attente d\'évaluation.');
    return;
  }

  console.log(`📋 ${solutions.length} solution(s) à évaluer\n`);

  // 2. Évaluer chaque solution
  let evaluated = 0;
  let errors = 0;

  for (const solution of solutions) {
    try {
      // Évaluer
      const result = await evaluateSolution(solution);
      
      // Mettre à jour en base
      const success = await updateSolutionEvaluation(solution.id, result);
      
      if (success) {
        console.log(`   ✅ Note: ${result.note}/5 | ${result.isValid ? 'Validée' : 'Non validée'}`);
        evaluated++;
      } else {
        errors++;
      }
    } catch (err) {
      console.error(`   ❌ Erreur:`, err);
      errors++;
    }
  }

  // 3. Résumé
  console.log('\n================================================');
  console.log(`📊 Résumé: ${evaluated} évaluée(s), ${errors} erreur(s)`);
}

// ==========================================
// EXÉCUTION
// ==========================================

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('💥 Erreur fatale:', err);
    process.exit(1);
  });
