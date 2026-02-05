import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Cta() {
  return (
    <div className="py-20 px-4">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-3xl font-semibold text-foreground mb-4">
          Prêt à tester avec vos clients ?
        </h2>
        <p className="text-muted-foreground mb-8">
          Rejoignez les agences pilotes. Gratuit pendant la beta.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/sign-up">
            <Button size="lg" className="bg-[#D4A373] hover:bg-[#c49366] text-white px-8">
              Commencer gratuitement
            </Button>
          </Link>
          <Link href="mailto:contact@orphy.app">
            <Button size="lg" variant="outline">
              Nous contacter
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
