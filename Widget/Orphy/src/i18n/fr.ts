/**
 * French translations (default)
 */

export const fr = {
  // Comment box
  commentBox: {
    headerNew: "Que souhaitez-vous signaler ?",
    headerExisting: "Feedbacks sur cet élément",
    placeholder: "Décrivez votre feedback...",
    cancel: "Annuler",
    submit: "Ajouter",
    submitExisting: "Enregistrer",
    addAnother: "Ajouter un autre feedback",
    hint: "⌘Enter pour valider, Esc pour annuler",
  },

  // Feedback types
  types: {
    bug: "Bug",
    design: "Design",
    content: "Contenu",
    question: "Question",
  },

  // Review panel
  reviewPanel: {
    title: "Vos feedbacks",
    subtitle: "Relisez et envoyez vos annotations",
    empty: "Aucun feedback pour le moment",
    emptyHint: "Cliquez sur des éléments pour les annoter",
    submit: "Envoyer",
    submitCount: "Envoyer ({{count}})",
    cancel: "Annuler",
    sending: "Envoi...",
  },

  // Toast messages
  toast: {
    successSingle: "Feedback envoyé !",
    successMultiple: "{{count}} feedbacks envoyés !",
    error: "Erreur lors de l'envoi",
    retry: "Réessayer",
  },

  // Toolbar
  toolbar: {
    feedback: "Feedback",
    done: "Terminé",
    review: "Envoyer",
    messages: "Messages",
  },

  // Replay mode
  replay: {
    status: {
      open: "Ouvert",
      resolved: "Résolu",
    },
    close: "Fermer",
    resolve: "Marquer résolu",
    resolving: "En cours...",
    resolved: "Résolu !",
    hint: "Appuyez sur Esc pour fermer",
    notePlaceholder: "Décrivez ce qui a été fait...",
    noteHint: "Note incluse dans le récap client",
    viewport: "{{width}}×{{height}} • {{device}}",
    device: {
      desktop: "Desktop",
      mobile: "Mobile",
      tablet: "Tablette",
    },
    timeAgo: {
      now: "À l'instant",
      minutes: "Il y a {{count}} min",
      hours: "Il y a {{count}}h",
      days: "Il y a {{count}}j",
      weeks: "Il y a {{count}} sem",
    },
    fallback: {
      notFound: "Élément introuvable sur cette page",
      loadError: "Impossible de charger le feedback",
      close: "Fermer",
    },
  },

  // Thread panel (bidirectional comments)
  thread: {
    author: {
      client: "Client",
      agency: "Agence",
    },
    anonymous: "Anonyme",
    replyPlaceholder: "Écrivez une réponse...",
    send: "Envoyer",
    sending: "Envoi...",
    noReplies: "Pas encore de réponses",
    // Validation workflow
    status: {
      open: "En attente",
      treated: "Traité",
      validated: "Validé",
    },
    validateInfo: "L'agence a traité ce retour. Confirmez si c'est résolu :",
    validate: "Valider",
    validating: "Validation...",
    validated: "Validé !",
  },

  // Minimized bar
  minimizedBar: {
    expand: "Agrandir",
    previous: "Précédent",
    next: "Suivant",
    minimize: "Réduire",
  },
} as const;

// Define structure type (allows any string values)
export interface TranslationKeys {
  commentBox: {
    headerNew: string;
    headerExisting: string;
    placeholder: string;
    cancel: string;
    submit: string;
    submitExisting: string;
    addAnother: string;
    hint: string;
  };
  types: {
    bug: string;
    design: string;
    content: string;
    question: string;
  };
  reviewPanel: {
    title: string;
    subtitle: string;
    empty: string;
    emptyHint: string;
    submit: string;
    submitCount: string;
    cancel: string;
    sending: string;
  };
  toast: {
    successSingle: string;
    successMultiple: string;
    error: string;
    retry: string;
  };
  toolbar: {
    feedback: string;
    done: string;
    review: string;
    messages: string;
  };
  replay: {
    status: {
      open: string;
      resolved: string;
    };
    close: string;
    resolve: string;
    resolving: string;
    resolved: string;
    hint: string;
    notePlaceholder: string;
    noteHint: string;
    viewport: string;
    device: {
      desktop: string;
      mobile: string;
      tablet: string;
    };
    timeAgo: {
      now: string;
      minutes: string;
      hours: string;
      days: string;
      weeks: string;
    };
    fallback: {
      notFound: string;
      loadError: string;
      close: string;
    };
  };
  thread: {
    author: {
      client: string;
      agency: string;
    };
    anonymous: string;
    replyPlaceholder: string;
    send: string;
    sending: string;
    noReplies: string;
    status: {
      open: string;
      treated: string;
      validated: string;
    };
    validateInfo: string;
    validate: string;
    validating: string;
    validated: string;
  };
  minimizedBar: {
    expand: string;
    previous: string;
    next: string;
    minimize: string;
  };
}
