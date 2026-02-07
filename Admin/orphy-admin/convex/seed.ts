import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// =============================================================================
// DEMO SEED DATA
// =============================================================================

interface DemoFeedback {
  orphyId: string;
  selector: string;
  feedbackType: "bug" | "design" | "content" | "question";
  comment: string;
  status: "open" | "treated" | "validated";
  boundingBox: { top: number; left: number; width: number; height: number };
  positionInElement: { x: number; y: number };
  positionInViewport: { x: number; y: number };
  replies: {
    authorType: "client" | "agency";
    authorName: string;
    content: string;
  }[];
}

const DEMO_FEEDBACKS: DemoFeedback[] = [
  {
    orphyId: "demo-hero-cta",
    selector: "#demo-hero-cta",
    feedbackType: "bug",
    comment:
      "Le bouton 'Démarrer un projet' ne redirige nulle part quand on clique dessus",
    status: "treated",
    boundingBox: { top: 370, left: 430, width: 240, height: 52 },
    positionInElement: { x: 120, y: 26 },
    positionInViewport: { x: 550, y: 396 },

    replies: [
      {
        authorType: "agency",
        authorName: "Marie — Artisan Studio",
        content:
          "Merci pour le retour ! C'est corrigé, le lien a été mis à jour vers la page contact.",
      },
    ],
  },
  {
    orphyId: "demo-hero-title",
    selector: "#demo-hero-title",
    feedbackType: "design",
    comment:
      "La taille du titre est trop grande sur tablette, il déborde du conteneur",
    status: "open",
    boundingBox: { top: 200, left: 200, width: 800, height: 120 },
    positionInElement: { x: 400, y: 60 },
    positionInViewport: { x: 600, y: 260 },
    replies: [
      {
        authorType: "agency",
        authorName: "Marie — Artisan Studio",
        content:
          "On peut regarder ça. Vous pouvez nous partager une capture d'écran sur tablette ?",
      },
      {
        authorType: "client",
        authorName: "Client",
        content: "Oui je vous envoie ça par email, c'est sur iPad Pro",
      },
    ],
  },
  {
    orphyId: "demo-pricing-business",
    selector: "#demo-pricing-business",
    feedbackType: "content",
    comment:
      "Le prix devrait être 890€/mois et non 990€, merci de vérifier avec le commercial",
    status: "treated",
    boundingBox: { top: 1800, left: 420, width: 360, height: 500 },
    positionInElement: { x: 180, y: 120 },
    positionInViewport: { x: 600, y: 400 },

    replies: [
      {
        authorType: "agency",
        authorName: "Marie — Artisan Studio",
        content:
          "Bien vu ! Le tarif a été corrigé, ça sera en ligne à la prochaine mise en production.",
      },
    ],
  },
  {
    orphyId: "demo-nav",
    selector: "#demo-nav",
    feedbackType: "question",
    comment:
      "Est-ce qu'on peut ajouter un menu déroulant pour les sous-catégories de services ?",
    status: "open",
    boundingBox: { top: 0, left: 0, width: 1200, height: 72 },
    positionInElement: { x: 400, y: 36 },
    positionInViewport: { x: 400, y: 36 },
    replies: [],
  },
  {
    orphyId: "demo-feature-design",
    selector: "#demo-feature-design",
    feedbackType: "design",
    comment:
      "Les cards devraient avoir un peu plus d'espace entre elles sur la grille",
    status: "validated",
    boundingBox: { top: 1100, left: 40, width: 380, height: 220 },
    positionInElement: { x: 190, y: 110 },
    positionInViewport: { x: 230, y: 450 },

    replies: [
      {
        authorType: "agency",
        authorName: "Marie — Artisan Studio",
        content:
          "L'espacement a été augmenté de 24px à 32px, ça devrait être mieux maintenant.",
      },
      {
        authorType: "client",
        authorName: "Client",
        content: "Parfait, c'est beaucoup mieux comme ça !",
      },
    ],
  },
];

// =============================================================================
// SEED MUTATION
// =============================================================================

export const seedDemoData = internalMutation({
  args: {
    projectId: v.id("projects"),
    pageUrl: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if demo data already exists for this pageUrl
    const existing = await ctx.db
      .query("feedbacks")
      .withIndex("by_project", (q: any) =>
        q.eq("projectId", args.projectId)
      )
      .collect();

    const demoFeedbacks = existing.filter(
      (f: any) =>
        f.pageUrl === args.pageUrl &&
        typeof f.orphyId === "string" &&
        f.orphyId.startsWith("demo-")
    );

    if (demoFeedbacks.length > 0) {
      return { seeded: false, message: "Demo data already exists" };
    }

    // Verify project exists
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const now = Date.now();
    const createdIds: { orphyId: string; feedbackId: Id<"feedbacks"> }[] = [];

    // Create feedbacks
    for (const demo of DEMO_FEEDBACKS) {
      // Stagger createdAt so they appear in order (oldest first)
      const createdAt =
        now - (DEMO_FEEDBACKS.length - DEMO_FEEDBACKS.indexOf(demo)) * 3600000;

      const feedbackId = await ctx.db.insert("feedbacks", {
        projectId: args.projectId,
        orphyId: demo.orphyId,
        selector: demo.selector,
        boundingBox: demo.boundingBox,
        positionInElement: demo.positionInElement,
        positionInViewport: demo.positionInViewport,
        viewport: { width: 1440, height: 900, devicePixelRatio: 2 },
        pageUrl: args.pageUrl,
        feedbackType: demo.feedbackType,
        comment: demo.comment,
        status: demo.status,
        priority: "medium",
        authorType: "client",
        ...(demo.status === "treated" || demo.status === "validated"
          ? { resolvedAt: createdAt + 1800000 }
          : {}),
        ...(demo.status === "validated"
          ? { validatedAt: createdAt + 3600000 }
          : {}),
        createdAt,
        updatedAt: createdAt,
      });

      createdIds.push({ orphyId: demo.orphyId, feedbackId });

      // Create replies
      for (let i = 0; i < demo.replies.length; i++) {
        const reply = demo.replies[i]!;
        await ctx.db.insert("replies", {
          feedbackId,
          authorType: reply.authorType,
          authorName: reply.authorName,
          content: reply.content,
          createdAt: createdAt + (i + 1) * 600000, // 10min apart
        });
      }
    }

    return {
      seeded: true,
      count: createdIds.length,
      feedbacks: createdIds,
    };
  },
});
