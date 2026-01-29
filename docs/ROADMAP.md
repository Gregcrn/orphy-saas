# Orphy Product Roadmap

> *Dernière mise à jour : 29 janvier 2026*
>
> 🎯 **Priorité actuelle** : Phase 1 - Validation Client

## Vision

**"Le hub central de feedback pour agences digitales - précis, collaboratif, intégré"**

---

## État actuel du produit

### ✅ Fonctionnalités complètes

**Widget**

- Capture d'éléments via overlay DOM
- Génération de sélecteurs CSS intelligents
- Tracking de position (élément, viewport, point de clic)
- Device/browser detection
- Types de feedback : bug, design, content, question
- Mode replay avec highlight
- API publique (`Orphy.init()`, `toggle()`, `destroy()`)
- i18n (FR/EN)
- Zero dependencies, IIFE bundle

**Admin Dashboard**

- Authentification Clerk
- Gestion d'équipe (workspaces, rôles, invitations)
- CRUD projets avec wizard de setup
- Inbox avec filtres (type, priorité, assigné, device, browser, projet)
- Assignation des feedbacks aux membres
- Statuts open/resolved avec toggle
- Stats dashboard

**Backend (Convex)**

- Modèle de données complet
- HTTP endpoints CORS-enabled
- Autorisation par workspace/projet

---

## Roadmap

### Phase 0: Quick Wins ⚡

*Effort minimal, impact immédiat*

| Feature | Pourquoi | Effort |
|---------|----------|--------|
| 🔍 Recherche textuelle | UX critique à 50+ feedbacks | 2h |
| 📄 Pagination | Performance | 3h |
| 🌙 Dark mode | Standard 2026 | 2h |
| 📋 Code d'installation généré | Onboarding | 2h |
| ⌨️ Raccourcis clavier (Cmd+K) | Power users | 1h |

**Progress:**

- [ ] Recherche textuelle
- [ ] Pagination
- [ ] Dark mode
- [ ] Code d'installation généré
- [ ] Raccourcis clavier

---

### Phase 1: Validation Client 🎯

*2-3 semaines - KILLER FEATURE (issue lead interview)*

> **Pain point identifié** : "C'est chiant de suivre ce qui a été validé par le client et de rédiger les récaps manuellement"

#### 1.1 Infos client sur projet

| Tâche | Description |
|-------|-------------|
| Schema projet | Ajouter clientName, clientEmail, clientCompany (obligatoires) |
| Formulaire création | Nouveaux champs dans création projet |
| Formulaire édition | Nouveaux champs dans settings projet |
| Migration douce | Projets existants = champs optionnels en DB |

**Progress:**

- [x] Schema: ajouter clientName, clientEmail, clientCompany
- [x] Mutation create projet mise à jour
- [x] Mutation update projet mise à jour
- [x] UI formulaire création projet
- [x] UI settings projet (édition)
- [x] Traductions FR/EN

#### 1.2 Notes de résolution

| Tâche | Description |
|-------|-------------|
| Schema feedback | Ajouter `resolutionNote` (optionnel) |
| UI résolution | Modal/input pour noter ce qui a été fait |
| Affichage | Montrer la note dans le détail feedback |

**Progress:**

- [x] Schema: ajouter resolutionNote, resolvedBy, resolvedAt sur feedbacks
- [x] Mutations: resolve() avec note, reopen() pour rouvrir
- [x] UI: modal de résolution avec note optionnelle
- [x] Affichage: indicateur + tooltip si note présente

#### 1.3 Review Rounds (cycles de validation)

| Tâche | Description |
|-------|-------------|
| Schema reviewRounds | Nouvelle table (projectId, name, status, pages[], createdAt) |
| Schema pageValidations | Nouvelle table (roundId, pageUrl, status, validatedBy, validatedAt) |
| CRUD rounds | Créer/lister/clôturer des rounds |
| UI dashboard | Vue des rounds par projet |

**Progress:**

- [ ] Schema: table reviewRounds
- [ ] Schema: table pageValidations
- [ ] Mutations: createRound, closeRound
- [ ] Queries: getRounds, getRoundDetails
- [ ] UI: liste des rounds dans projet
- [ ] UI: création d'un round

#### 1.4 Interface client (validation)

| Tâche | Description |
|-------|-------------|
| Page publique | `/review/[token]` - interface client simple |
| Auth token | Génération token sécurisé par round |
| UX validation | Boutons "Approuver" / "Demander modifs" |
| Navigation | Liste des pages du round avec statuts |

**Progress:**

- [ ] Route publique /review/[token]
- [ ] Génération token sécurisé
- [ ] UI: liste pages à valider
- [ ] UI: boutons validation par page
- [ ] Bloquer validation si feedbacks ouverts
- [ ] Redirection vers widget si "Demander modifs"

#### 1.5 Récap automatique

| Tâche | Description |
|-------|-------------|
| Génération récap | Liste des feedbacks résolus + notes |
| Template email | Intro/outro + liste des modifs |
| Envoi email | Intégration Resend (déjà en place) |
| Lien validation | Inclure lien vers round dans email |

**Progress:**

- [ ] Query: getFeedbacksForRecap (résolus, groupés par page)
- [ ] Template email récap
- [ ] Mutation: sendRecapEmail
- [ ] UI: bouton "Envoyer récap" quand feedbacks résolus
- [ ] UI: prévisualisation/édition avant envoi

#### 1.6 Invalidation automatique

| Tâche | Description |
|-------|-------------|
| Détection modif | Si feedback ajouté après validation |
| Alerte agence | Notification "Page modifiée depuis validation" |
| Reset optionnel | Bouton "Demander re-validation" |

**Progress:**

- [ ] Logique détection modification post-validation
- [ ] UI: alerte dans dashboard
- [ ] Action: demander re-validation

---

### Phase 2: Collaboration Interne 💬

*2 semaines - Le vrai différenciateur*

| Feature | Valeur business |
|---------|-----------------|
| 💬 Commentaires threadés | Discussion sur chaque feedback |
| 📜 Timeline d'activité | Qui a fait quoi, quand |
| 🔔 Notifications email | Assignations, mentions, nouveaux feedbacks |
| 🏷️ Tags/Labels | Organisation personnalisée |
| 📊 Statut "In Progress" | Workflow complet (open → in_progress → resolved) |

**Progress:**

- [ ] Commentaires threadés
- [ ] Timeline d'activité
- [ ] Notifications email
- [ ] Tags/Labels
- [ ] Statut "In Progress"

---

### Phase 3: Intelligence 📈

*2 semaines - Transformer les données en insights*

| Feature | Valeur business |
|---------|-----------------|
| 📈 Dashboard analytics | Graphiques temporels, taux de résolution |
| 🎯 Auto-scoring priorité | Volume + récence = urgence |
| 🗺️ Heatmap des feedbacks | Pages/éléments les plus signalés |
| ⏱️ Métriques de résolution | Temps moyen, SLA tracking |
| 📤 Export CSV/PDF | Reporting client |

**Progress:**

- [ ] Dashboard analytics
- [ ] Auto-scoring priorité
- [ ] Heatmap des feedbacks
- [ ] Métriques de résolution
- [ ] Export CSV/PDF

---

### Phase 4: Intégrations 🔗

*2 semaines - Devenir indispensable*

| Intégration | Priorité | Pourquoi |
|-------------|----------|----------|
| 💬 Slack | P0 | 90% des agences l'utilisent |
| 🐙 GitHub Issues | P1 | Workflow dev naturel |
| 🎫 Jira | P1 | Entreprises |
| 🔌 Webhooks custom | P2 | Flexibilité |
| ⚡ Zapier | P2 | 1000+ intégrations gratuites |

**Progress:**

- [ ] Slack
- [ ] GitHub Issues
- [ ] Jira
- [ ] Webhooks custom
- [ ] Zapier

---

### Phase 5: Widget Pro 🎬

*3 semaines - Différenciation technique*

| Feature | Wow factor |
|---------|------------|
| 🎥 Capture vidéo | Context ultime |
| 🖼️ Screenshot annoté | Alternative légère |
| 🔴 Console errors | Debug automatique |
| 📱 Responsive preview | Test multi-device |
| ⚙️ Widget customization | Couleurs, position, textes |

**Progress:**

- [ ] Capture vidéo
- [ ] Screenshot annoté
- [ ] Console errors
- [ ] Responsive preview
- [ ] Widget customization

---

### Phase 6: Scale & Enterprise 🏢

*1 mois+ - Monétisation et grands comptes*

| Feature | Segment |
|---------|---------|
| 💳 Plans & Billing | SaaS model |
| 🔐 SSO (SAML) | Enterprise |
| 📋 Audit logs | Compliance |
| 🌍 Multi-workspace avancé | Agences multi-clients |
| 📊 API publique | Développeurs |

**Progress:**

- [ ] Plans & Billing
- [ ] SSO (SAML)
- [ ] Audit logs
- [ ] Multi-workspace avancé
- [ ] API publique

---

## Métriques clés

### Widget

- Bundle size < 30KB
- Load impact < 100ms
- Error rate < 0.1%

### Product

- Feedbacks/projet/semaine
- Time-to-resolution moyen
- Team adoption (membres actifs/workspace)

### Business

- MRR
- Churn rate
- NPS

---

## Timeline YC-ready

```
Semaine 1      : Phase 0 (quick wins)
Semaines 2-4   : Phase 1 (validation client) ← KILLER FEATURE
Semaines 5-6   : Phase 2 (collaboration interne)
Semaines 7-8   : Phase 3 (analytics)
Semaines 9-10  : Phase 4 (Slack + GitHub)
Semaine 11     : Polish + landing page
```

**Target : Launch YC-ready en 11 semaines**

---

## Changelog

### 29 janvier 2026

- ✅ Assignation des feedbacks aux membres
- ✅ Filtres avancés (type, priorité, assigné, device, browser, projet)
- ✅ Labels avec icônes sur les filtres
- 📋 Ajout Phase 1: Validation Client (killer feature issue lead interview)
- ✅ **1.1 Infos client sur projet** : clientName, clientEmail, clientCompany
- ✅ **1.2 Notes de résolution** : modal avec note optionnelle, indicateur visuel
