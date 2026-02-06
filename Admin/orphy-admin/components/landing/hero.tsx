import Link from "next/link";
import { CircleDot } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Hero() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 pt-20 pb-10 px-4">
      <div className="flex flex-col items-center justify-center gap-6 mb-6">
        {/* Logo */}
        <div className="w-16 h-16 rounded-2xl bg-[#D4A373] flex items-center justify-center">
          <CircleDot className="w-8 h-8 text-white" strokeWidth={2.5} />
        </div>
        <div className="flex items-center gap-4 rounded-full border border-border px-4 py-1 relative">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-lime-400" />
          </span>
          <p className="uppercase text-sm font-medium">
            Disponible maintenant
          </p>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center gap-4 max-w-2xl text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground">
          Le feedback client, directement sur le site.
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl">
          Vos clients cliquent, commentent, valident. Sans screenshot, sans email.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-4">
        <Link href="/sign-up">
          <Button size="lg" className="bg-[#D4A373] hover:bg-[#c49366] text-white px-8">
            Commencer gratuitement
          </Button>
        </Link>
        <Link href="/demo" target="_blank">
          <Button size="lg" variant="outline">
            Essayer la démo interactive
          </Button>
        </Link>
      </div>
      <p className="text-sm text-muted-foreground mt-2">
        Gratuit pendant la beta • Aucune carte requise
      </p>
    </div>
  );
}
