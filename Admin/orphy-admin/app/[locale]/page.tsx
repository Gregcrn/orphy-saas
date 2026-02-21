"use client";

import { useEffect } from "react";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { useRouter } from "@/i18n/navigation";
import {
  Header,
  Hero,
  Demo,
  Features,
  Faq,
  Cta,
  Footer,
} from "@/components/landing";

function AuthRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);
  return null;
}

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

      {/* Redirect authenticated users straight to dashboard */}
      <SignedIn>
        <AuthRedirect />
      </SignedIn>
    </>
  );
}
