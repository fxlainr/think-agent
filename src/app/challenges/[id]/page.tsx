'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowLeft, Star, Users, Zap, Target, Wrench, Clock,
  CheckCircle, Loader2, FileText, Send, Paperclip, XCircle, Pencil
} from 'lucide-react';
import { ChallengeEditForm } from '@/components/challenges/ChallengeEditForm';
import { useAuth } from '@/lib/auth';
import { FileUpload } from '@/components/challenges/FileUpload';
import type { UploadedFile } from '@/lib/supabase/storage';
import { 
  getChallengeById, 
  getParticipation, 
  getSolution,
  createParticipation, 
  submitSolution,
  abandonParticipation
} from '@/lib/supabase/queries';
import type { Challenge, Participation, Solution, VortexStage, Thematique } from '@/types/database';

const levelConfig: Record<string, { color: string; bgColor: string }> = {
  Explorer: { color: 'text-accent-vert', bgColor: 'bg-accent-vert' },
  Crafter: { color: 'text-exalt-blue', bgColor: 'bg-exalt-blue' },
  Architecte: { color: 'text-accent-rose', bgColor: 'bg-accent-rose' },
};

const VORTEX_LABELS: Record<VortexStage, string> = {
  contextualize: '1. Cadrer',
  empathize: '2. Découvrir',
  synthesize: '3. Définir',
  hypothesize: '4. Idéer',
  externalize: '5. Construire',
  sensitize: '6. Tester',
  systematize: '7. Apprendre',
};

const THEMATIQUE_LABELS: Record<Thematique, { emoji: string; label: string }> = {
  knowledge: { emoji: '📚', label: 'Knowledge & Formation' },
  content: { emoji: '✍️', label: 'Création de contenu' },
  data: { emoji: '📊', label: 'Data & Analyse' },
  automation: { emoji: '🤖', label: 'Automatisation & Workflows' },
  agents: { emoji: '💬', label: 'Agents & Assistants' },
  strategy: { emoji: '💼', label: 'Stratégie & Conseil' },
  code: { emoji: '🧑‍💻', label: 'Code & Développement' },
  design: { emoji: '🎨', label: 'Design & UX' },
  research: { emoji: '🔍', label: 'Recherche & Veille' },
  prompting: { emoji: '🧠', label: 'Prompt Engineering' },
};

export default function ChallengeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const challengeId = params.id as string;

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [participation, setParticipation] = useState<Participation | null>(null);
  const [solution, setSolution] = useState<Solution | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [solutionText, setSolutionText] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  // Vérifier si l'utilisateur est admin
  const isAdmin = user?.role === 'Administrateur';

  // Charger les données
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      
      const challengeData = await getChallengeById(challengeId);
      setChallenge(challengeData);

      if (user && challengeData) {
        const [participationData, solutionData] = await Promise.all([
          getParticipation(user.id, challengeId),
          getSolution(user.id, challengeId),
        ]);
        setParticipation(participationData);
        setSolution(solutionData);
      }

      setIsLoading(false);
    }
    loadData();
  }, [challengeId, user]);

  // Participer au challenge
  const handleParticipate = async () => {
    if (!user || !challenge) return;

    setIsSubmitting(true);
    const newParticipation = await createParticipation(user.id, challenge.id);
    if (newParticipation) {
      setParticipation(newParticipation);
    }
    setIsSubmitting(false);
  };

  // Soumettre une solution
  const handleSubmit = async () => {
    if (!user || !challenge || (!solutionText.trim() && uploadedFiles.length === 0)) return;

    setIsSubmitting(true);
    const fileUrls = uploadedFiles.map(f => f.url);
    const newSolution = await submitSolution(user.id, challenge.id, solutionText, fileUrls);
    if (newSolution) {
      setSolution(newSolution);
      setParticipation(prev => prev ? { ...prev, statut: 'Terminé' } : null);
    }
    setIsSubmitting(false);
  };

  // Abandonner le challenge
  const handleAbandon = async () => {
    if (!user || !challenge) return;

    setIsSubmitting(true);
    const success = await abandonParticipation(user.id, challenge.id);
    if (success) {
      setParticipation(null);
    }
    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-exalt-blue" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center gap-4">
          <p className="text-xl text-muted-foreground">Challenge non trouvé</p>
          <Link href="/challenges">
            <Button variant="outline">Retour au catalogue</Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const config = levelConfig[challenge.niveau_associe] || levelConfig.Explorer;
  const isParticipating = participation?.statut === 'En_cours';
  const hasSubmitted = !!solution;
  const isCompleted = participation?.statut === 'Terminé';
  const isAbandoned = participation?.statut === 'Abandonné';

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Back link */}
          <Link
            href="/challenges"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-accent-cyan transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au catalogue
          </Link>

          {/* Mode édition */}
          {isEditing && challenge ? (
            <ChallengeEditForm
              challenge={challenge}
              onSave={(updated) => {
                setChallenge(updated);
                setIsEditing(false);
              }}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
          <>
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <Badge className={`${config.bgColor} text-white`}>
                {challenge.niveau_associe}
              </Badge>
              {challenge.marques && challenge.marques.length > 0 ? (
                challenge.marques.map((marque) => (
                  <Badge key={marque} variant="outline">{marque}</Badge>
                ))
              ) : (
                <Badge variant="outline" className="text-muted-foreground">Toutes marques</Badge>
              )}
              {challenge.etape_vortex && (
                <Badge variant="outline" className="bg-accent-rose/10 border-accent-rose text-accent-rose">
                  {VORTEX_LABELS[challenge.etape_vortex]}
                </Badge>
              )}
              {challenge.thematiques && challenge.thematiques.length > 0 && (
                challenge.thematiques.map((theme) => (
                  <Badge key={theme} variant="outline" className="bg-accent-jaune/10 border-accent-jaune text-accent-jaune">
                    {THEMATIQUE_LABELS[theme].emoji} {THEMATIQUE_LABELS[theme].label}
                  </Badge>
                ))
              )}
              {isCompleted && (
                <Badge className="bg-accent-vert text-black">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Complété
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-between gap-4">
              <h1 className="text-3xl md:text-4xl font-bold">{challenge.titre}</h1>
              {isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="border-accent-cyan text-accent-cyan hover:bg-accent-cyan hover:text-black"
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
              )}
            </div>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < challenge.difficulte ? 'fill-accent-jaune text-accent-jaune' : 'text-muted'}`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {challenge.participants}
              </div>
              <div className="flex items-center gap-1 text-accent-jaune font-semibold">
                <Zap className="h-4 w-4" />
                {challenge.xp} XP
              </div>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
            {/* Main content */}
            <div className="space-y-8">
              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Description
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {challenge.description}
                  </p>
                </CardContent>
              </Card>

              {/* Vision & Impact */}
              {challenge.vision_impact && (
                <Card className="border-accent-cyan/30 bg-accent-cyan/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-accent-cyan">
                      <Zap className="h-5 w-5" />
                      Vision &amp; Impact
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {challenge.vision_impact}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Le saviez-vous */}
              {challenge.le_saviez_vous && (
                <Card className="border-accent-jaune/30 bg-accent-jaune/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-accent-jaune">
                      <Star className="h-5 w-5" />
                      Le saviez-vous ?
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {challenge.le_saviez_vous}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Critères d'évaluation */}
              {challenge.criteres_evaluation && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Critères d&apos;évaluation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {challenge.criteres_evaluation}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Sources */}
              {challenge.sources && (challenge.sources as string[]).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Sources &amp; Références
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {(challenge.sources as string[]).map((source, index) => {
                        const isUrl = source.startsWith('http://') || source.startsWith('https://');
                        return (
                          <li key={index}>
                            {isUrl ? (
                              <a
                                href={source}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-accent-cyan hover:underline text-sm break-all"
                              >
                                {source}
                              </a>
                            ) : (
                              <span className="text-sm text-muted-foreground">{source}</span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Zone de soumission */}
              {user && isParticipating && !hasSubmitted && (
                <Card className="border-accent-cyan">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Send className="h-5 w-5" />
                      Soumettre ta solution
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Texte */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Description de ta solution</label>
                      <textarea
                        placeholder="Décris ta solution, ton approche, colle tes prompts..."
                        value={solutionText}
                        onChange={(e) => setSolutionText(e.target.value)}
                        className="w-full h-48 p-4 rounded-lg bg-background border border-border focus:border-accent-cyan focus:outline-none resize-none"
                      />
                    </div>

                    {/* Upload fichiers */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Paperclip className="h-4 w-4" />
                        Fichiers joints (optionnel)
                      </label>
                      <FileUpload
                        userId={user.id}
                        challengeId={challenge.id}
                        onFilesChange={setUploadedFiles}
                        maxFiles={5}
                        maxSizeMB={10}
                      />
                    </div>

                    {/* Bouton soumettre */}
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting || (!solutionText.trim() && uploadedFiles.length === 0)}
                      className="bg-accent-jaune hover:bg-accent-jaune/80 text-black font-semibold"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Envoi...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Soumettre
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Solution soumise */}
              {hasSubmitted && (
                <Card className="border-accent-vert">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-accent-vert">
                      <CheckCircle className="h-5 w-5" />
                      Solution soumise
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Texte de la solution */}
                    {solution?.contenu_texte && (
                      <div className="p-4 rounded-lg bg-card border border-border">
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {solution.contenu_texte}
                        </p>
                      </div>
                    )}

                    {/* Fichiers joints */}
                    {solution?.fichiers_attaches && (solution.fichiers_attaches as string[]).length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium flex items-center gap-2">
                          <Paperclip className="h-4 w-4" />
                          Fichiers joints
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {(solution.fichiers_attaches as string[]).map((url, index) => {
                            const fullUrl = url.startsWith('http') ? url : `https://${url}`;
                            return (
                              <a
                                key={index}
                                href={fullUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border hover:border-accent-cyan transition-colors text-sm"
                              >
                                <FileText className="h-4 w-4" />
                                Fichier {index + 1}
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Actions */}
              <Card>
                <CardContent className="pt-6">
                  {!user ? (
                    <div className="text-center space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Connecte-toi pour participer
                      </p>
                      <Link href="/login">
                        <Button className="w-full bg-accent-jaune hover:bg-accent-jaune/80 text-black font-semibold">
                          Se connecter
                        </Button>
                      </Link>
                    </div>
                  ) : isCompleted ? (
                    <div className="text-center space-y-2">
                      <CheckCircle className="h-12 w-12 mx-auto text-accent-vert" />
                      <p className="font-semibold text-accent-vert">Challenge complété !</p>
                      <p className="text-sm text-muted-foreground">+{challenge.xp} XP</p>
                    </div>
                  ) : isParticipating ? (
                    <div className="text-center space-y-4">
                      <div className="space-y-2">
                        <div className="h-12 w-12 mx-auto rounded-full bg-accent-cyan/20 flex items-center justify-center">
                          <Clock className="h-6 w-6 text-accent-cyan" />
                        </div>
                        <p className="font-semibold text-accent-cyan">En cours</p>
                        <p className="text-sm text-muted-foreground">Soumets ta solution ci-dessous</p>
                      </div>
                      <Button
                        onClick={handleAbandon}
                        disabled={isSubmitting}
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                      >
                        {isSubmitting ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <XCircle className="h-4 w-4 mr-2" />
                        )}
                        Arrêter le challenge
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={handleParticipate}
                      disabled={isSubmitting}
                      className="w-full bg-accent-jaune hover:bg-accent-jaune/80 text-black font-semibold"
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Participer'
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Outils recommandés */}
              {challenge.outils_recommandes && challenge.outils_recommandes.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Wrench className="h-5 w-5" />
                      Outils recommandés
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {(challenge.outils_recommandes as string[]).map((outil, index) => (
                        <Badge key={index} variant="secondary">
                          {outil}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

            </div>
          </div>
          </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
