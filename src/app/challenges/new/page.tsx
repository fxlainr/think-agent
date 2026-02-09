'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { ChallengeCreateForm } from '@/components/challenges/ChallengeCreateForm';

export default function NewChallengePage() {
  const router = useRouter();
  const { user } = useAuth();

  const isAdmin = user?.role === 'Administrateur';

  // Rediriger si pas admin
  if (user && !isAdmin) {
    router.push('/challenges');
    return null;
  }

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

          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold">Nouveau Challenge</h1>
            <p className="text-muted-foreground mt-2">
              Crée un nouveau challenge pour les collaborateurs eXalt
            </p>
          </div>

          {!user ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Connecte-toi pour créer un challenge</p>
              <Link href="/login">
                <Button className="mt-4">Se connecter</Button>
              </Link>
            </div>
          ) : (
            <ChallengeCreateForm
              onSuccess={(challenge) => {
                router.push(`/challenges/${challenge.id}`);
              }}
              onCancel={() => {
                router.push('/challenges');
              }}
            />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
