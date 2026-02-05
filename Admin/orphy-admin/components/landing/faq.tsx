import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function Faq() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-16 px-4">
      <div className="flex flex-col items-center justify-center gap-2 max-w-md">
        <h2 className="sm:text-3xl text-2xl font-semibold text-foreground">
          Questions fréquentes
        </h2>
        <p className="sm:text-base text-sm text-muted-foreground text-center">
          Tout ce que vous devez savoir sur Orphy.
        </p>
      </div>
      <div className="w-full max-w-lg">
        <Accordion
          type="single"
          collapsible
          className="w-full flex flex-col gap-4"
        >
          <AccordionItem value="item-1">
            <AccordionTrigger className="hover:no-underline">
              Comment mes clients utilisent Orphy ?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              Vous partagez un lien vers leur site en mode review. Ils cliquent sur n&apos;importe quel élément, écrivent leur commentaire, et c&apos;est envoyé. Pas de compte à créer, pas d&apos;installation côté client.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger className="hover:no-underline">
              Est-ce que ça modifie le site de mon client ?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              Non. Orphy fonctionne en overlay, il ne touche jamais au DOM du site. Le scroll, la navigation, tout fonctionne normalement. Le widget est invisible pour les visiteurs normaux.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger className="hover:no-underline">
              Comment j&apos;intègre Orphy sur un site ?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              Une seule ligne de code à ajouter. Vous copiez le script depuis votre dashboard, vous le collez dans le HTML du site. C&apos;est tout. Fonctionne avec React, Vue, WordPress, ou n&apos;importe quel site.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-4">
            <AccordionTrigger className="hover:no-underline">
              Combien ça coûte ?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              Orphy est gratuit pendant la beta. Nous travaillons avec des agences pilotes pour affiner le produit avant de lancer une offre payante.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
