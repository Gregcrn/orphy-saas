"use client";

import Link from "next/link";
import { CircleDot } from "lucide-react";
import { cn } from "@/lib/utils";
import { useScroll } from "@/hooks/use-scroll";
import { Button } from "@/components/ui/button";

export default function Header() {
  const scrolled = useScroll();

  return (
    <header
      className={cn(
        "py-4 flex flex-row gap-2 justify-between items-center md:px-10 sm:px-6 px-4 sticky top-0 z-50 transition-all",
        scrolled && "bg-background/80 backdrop-blur-sm border-b border-border"
      )}
    >
      <Link href="/" className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-[#D4A373] flex items-center justify-center">
          <CircleDot className="w-5 h-5 text-white" strokeWidth={2.5} />
        </div>
        <span className="font-semibold text-lg">Orphy</span>
      </Link>

      <div className="flex items-center gap-2">
        <Link href="/sign-in">
          <Button variant="ghost">Se connecter</Button>
        </Link>
        <Link href="/sign-up">
          <Button className="bg-[#D4A373] hover:bg-[#c49366] text-white">
            Commencer
          </Button>
        </Link>
      </div>
    </header>
  );
}
