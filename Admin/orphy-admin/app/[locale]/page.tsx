"use client";

import { SignedIn, SignedOut } from "@clerk/nextjs";
import { CircleDot } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  Header,
  Hero,
  Demo,
  Features,
  Faq,
  Cta,
  Footer,
} from "@/components/landing";

export default function Home() {
  return (
    <>
      {/* Marketing landing page for visitors */}
      <SignedOut>
        <div className="min-h-screen bg-background">
          <Header />
          <main>
            <Hero />
            <Demo />
            <Features />
            <Faq />
            <Cta />
          </main>
          <Footer />
        </div>
      </SignedOut>

      {/* Quick dashboard access for authenticated users */}
      <SignedIn>
        <div className="flex min-h-screen flex-col items-center justify-center bg-background">
          <main className="flex flex-col items-center gap-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-[#D4A373] flex items-center justify-center">
              <CircleDot className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-3xl font-semibold text-foreground">
              Bienvenue sur Orphy
            </h1>
            <p className="text-muted-foreground">
              Accédez à votre tableau de bord pour gérer vos feedbacks.
            </p>
            <Link href="/dashboard">
              <Button size="lg" className="bg-[#D4A373] hover:bg-[#c49366] text-white px-8">
                Aller au Dashboard
              </Button>
            </Link>
          </main>
        </div>
      </SignedIn>
    </>
  );
}
