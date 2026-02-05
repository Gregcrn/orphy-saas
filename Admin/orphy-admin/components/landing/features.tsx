import { MousePointerClick, MessageSquare, CheckCircle, Users } from "lucide-react";

const features = [
  {
    icon: MousePointerClick,
    title: "Cliquez, commentez",
    description: "Vos clients cliquent sur n'importe quel élément du site et laissent leur feedback. Position exacte capturée automatiquement.",
  },
  {
    icon: MessageSquare,
    title: "Contexte complet",
    description: "Page, élément, viewport, navigateur. Tout le contexte dont vous avez besoin pour comprendre et corriger.",
  },
  {
    icon: CheckCircle,
    title: "Workflow simple",
    description: "Ouvert → Traité → Validé. Vos clients confirment que c'est corrigé. Pas de ping-pong email.",
  },
  {
    icon: Users,
    title: "Équipe incluse",
    description: "Invitez votre équipe, assignez les feedbacks, suivez qui fait quoi. Tout centralisé.",
  },
];

export default function Features() {
  return (
    <div className="py-16 px-4 bg-muted/30">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col items-center justify-center gap-2 mb-12">
          <h2 className="text-3xl font-semibold text-foreground text-center">
            Simple par design
          </h2>
          <p className="text-muted-foreground text-center max-w-md">
            Trois étapes. Zéro friction.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="flex gap-4 p-6 rounded-lg bg-background border border-border"
            >
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-lg bg-[#D4A373]/10 flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-[#D4A373]" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
