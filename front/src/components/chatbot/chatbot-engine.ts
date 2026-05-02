export interface Intent {
  id: string;
  patterns: string[];
  response: string;
  action?: 'navigate';
  actionPayload?: string;
  followUp?: string[];
}

export interface Message {
  id: string;
  from: 'bot' | 'user';
  text: string;
  time: Date;
  action?: { label: string; payload: string };
}

/* ── Intent library (French NLP keyword matching) ── */
export const intents: Intent[] = [
  {
    id: 'greeting',
    patterns: ['bonjour','salut','hello','bonsoir','salam','hi','hey','coucou'],
    response: "Bonjour ! 👋 Je suis **Wafa**, l'assistant de Tamanar Assistance.\nQue puis-je faire pour vous ?",
    followUp: ['Créer une intervention','Voir les factures','Statistiques','Aide'],
  },
  {
    id: 'help',
    patterns: ['aide','help','comment','quoi faire','que faire','je veux','j\'ai besoin','besoin d\'aide','perdu','compris','comprendre'],
    response: "Je peux vous aider avec :\n• 🚛 Créer une intervention\n• ⛽ Suivi carburant\n• 🧾 Consulter les factures\n• 📊 Voir les statistiques\n• 📜 Historique\n\nDites-moi ce que vous cherchez !",
    followUp: ['Nouvelle intervention','Suivi carburant','Factures','Statistiques'],
  },
  {
    id: 'intervention_create',
    patterns: ['intervention','nouvelle','creer','créer','ajouter','add','nouvelle operation','nouveau dossier','opération','opération'],
    response: "Pour créer une **nouvelle intervention** 🚛 :\n1. Cliquez sur *Nouvelle opération* depuis l'accueil\n2. Remplissez la date, société, référence\n3. Ajoutez les infos client et localisation\n4. Entrez le montant TTC\n5. Cliquez **Enregistrer**\n\nLa facture PDF est générée automatiquement !",
    action: 'navigate',
    actionPayload: '/operation',
    followUp: ['Aller à Intervention','Comment générer un PDF ?','Retour accueil'],
  },
  {
    id: 'carburant',
    patterns: ['carburant','fuel','essence','gasoil','suivi carburant','pompiste','station','smitostation','smito','prix carburant'],
    response: "Pour le **suivi carburant** ⛽ :\n1. Accueil → *Nouvelle opération (Suivi Carburant)*\n2. Renseignez : date, véhicule, service\n3. Ajoutez le pompiste et le prix\n4. Indiquez la station Smito\n5. Enregistrez !",
    action: 'navigate',
    actionPayload: '/operation?type=suivi_carburant',
    followUp: ['Ouvrir Suivi Carburant','Voir historique carburant'],
  },
  {
    id: 'factures',
    patterns: ['facture','factures','factures','invoice','billing','registre','pdf','bon de commande','montant','ttc','ht','tva'],
    response: "Le **Registre des Factures** 🧾 vous permet de :\n• Voir toutes vos factures\n• **Modifier** une facture (bouton Modifier 🖊️)\n• **Supprimer** une facture\n• Générer le **PDF** d'une facture\n• Exporter toutes les factures en PDF",
    action: 'navigate',
    actionPayload: '/facture-records',
    followUp: ['Voir les factures','Générer un PDF','Comment modifier une facture ?'],
  },
  {
    id: 'pdf',
    patterns: ['pdf','generer','générer','imprimer','telecharger','télécharger','download','exporter pdf'],
    response: "Pour **générer un PDF** de facture 📄 :\n• Depuis *Registre des Factures* → cliquez **PDF** sur la ligne\n• Ou depuis *Nouvelle Intervention* → après enregistrement, vous êtes redirigé vers la page PDF\n\nLe PDF est téléchargé automatiquement !",
    followUp: ['Voir les factures','Créer une intervention'],
  },
  {
    id: 'statistics',
    patterns: ['statistique','statistiques','stat','stats','graphique','graphiques','chart','rapport','analyse','evolution','chiffre','données'],
    response: "La page **Statistiques** 📊 affiche :\n• Évolution mensuelle des interventions\n• Revenus et coûts (HT/TTC)\n• Répartition par type d'événement\n• Top sociétés d'assistance\n• Consommation carburant de la flotte",
    action: 'navigate',
    actionPayload: '/statistics',
    followUp: ['Ouvrir Statistiques','Voir l\'accueil'],
  },
  {
    id: 'history',
    patterns: ['historique','history','archive','ancien','passé','passé','journal','log','activite','activité'],
    response: "L'**Historique** 📜 regroupe toutes vos activités :\n• Interventions créées\n• Fiches carburant\n• Factures générées\n\nVous pouvez **filtrer** par type et **exporter** en Excel !",
    action: 'navigate',
    actionPayload: '/userhistory',
    followUp: ['Ouvrir Historique','Exporter en Excel ?'],
  },
  {
    id: 'excel',
    patterns: ['excel','xlsx','export','exporter','exporter excel','backup','sauvegarde','telechargement','téléchargement'],
    response: "Pour **exporter en Excel** 📊 :\n1. Allez dans *Historique d'activités*\n2. Cliquez le bouton **⬇ Excel** en haut\n3. Le fichier `Tamanar_backup_DATE.xlsx` est téléchargé\n\nLe fichier contient 2 feuilles : Interventions + Carburant !",
    followUp: ['Ouvrir Historique'],
  },
  {
    id: 'modify_facture',
    patterns: ['modifier','modifie','edit','changer','corriger','correction','mise à jour','mettre à jour','update','changer facture'],
    response: "Pour **modifier une facture** ✏️ :\n1. Allez dans *Registre des Factures*\n2. Sur la ligne concernée, cliquez **Modifier** (bouton jaune)\n3. Un formulaire s'ouvre avec tous les champs pré-remplis\n4. Modifiez ce que vous voulez\n5. Cliquez **Enregistrer** ✅",
    followUp: ['Voir les factures'],
  },
  {
    id: 'login',
    patterns: ['login','connexion','connecter','mot de passe','username','identifiant','session','déconnexion','logout','deconnecter'],
    response: "Pour vous **connecter** 🔐 :\n• Accédez à `/login`\n• Entrez votre nom d'utilisateur et mot de passe\n\nPour vous **déconnecter** :\n• Utilisez le bouton *Déconnexion* dans le menu de l'accueil",
    followUp: ['Retour accueil'],
  },
  {
    id: 'home',
    patterns: ['accueil','home','dashboard','tableau de bord','retourner','retour','menu principal','menu'],
    response: "Je vous redirige vers l'**accueil** 🏠 !\nLe tableau de bord affiche un résumé de vos interventions, factures et statistiques.",
    action: 'navigate',
    actionPayload: '/home',
    followUp: ['Nouvelle intervention','Voir statistiques'],
  },
  {
    id: 'about',
    patterns: ['qui','wafa','assistant','bot','chatbot','tamanar','application','app','logiciel','système','plateforme'],
    response: "Je suis **Wafa** 🤖, l'assistant intelligent de *Tamanar Assistance*.\n\nCette plateforme gère :\n🚛 Interventions de dépannage\n⛽ Suivi de carburant\n🧾 Facturation automatique\n📊 Statistiques avancées\n\nDéveloppée pour optimiser vos opérations terrain !",
    followUp: ['Aide','Créer une intervention'],
  },
  {
    id: 'merci',
    patterns: ['merci','super','parfait','excellent','genial','génial','cool','bien','ok','d\'accord','compris','nickel','bravo'],
    response: "Avec plaisir ! 😊 N'hésitez pas si vous avez d'autres questions.",
    followUp: ['Autre question','Fermer'],
  },
  {
    id: 'fallback',
    patterns: [],
    response: "Je n'ai pas bien compris votre demande 🤔\nVoici ce que je peux faire :",
    followUp: ['Créer une intervention','Voir les factures','Statistiques','Historique','Aide'],
  },
];

/* ── NLP Engine: tokenize + score intents ── */
function normalize(text: string): string {
  return text.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')  // remove accents
    .replace(/[^a-z0-9\s']/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

export function detectIntent(userInput: string): Intent {
  const input = normalize(userInput);
  const words = input.split(' ');

  let bestIntent: Intent = intents.find(i => i.id === 'fallback')!;
  let bestScore = 0;

  for (const intent of intents) {
    if (intent.id === 'fallback') continue;
    let score = 0;
    for (const pattern of intent.patterns) {
      const normPattern = normalize(pattern);
      if (input.includes(normPattern)) {
        score += normPattern.split(' ').length * 2; // longer match = higher score
      } else {
        // partial word match
        for (const w of words) {
          if (normPattern.includes(w) && w.length > 2) score += 1;
        }
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestIntent = intent;
    }
  }

  return bestIntent;
}

/* ── Quick replies → intent map ── */
export const quickReplyMap: Record<string, string> = {
  'Créer une intervention': 'nouvelle intervention',
  'Nouvelle intervention': 'nouvelle intervention',
  'Aller à Intervention': 'nouvelle intervention',
  'Voir les factures': 'factures',
  'Statistiques': 'statistiques',
  'Ouvrir Statistiques': 'statistiques',
  'Historique': 'historique',
  'Ouvrir Historique': 'historique',
  'Suivi carburant': 'suivi carburant',
  'Ouvrir Suivi Carburant': 'suivi carburant',
  'Voir historique carburant': 'historique',
  'Aide': 'aide',
  'Autre question': 'aide',
  'Générer un PDF': 'pdf',
  'Comment générer un PDF ?': 'pdf',
  'Comment modifier une facture ?': 'modifier facture',
  'Exporter en Excel ?': 'excel',
  'Retour accueil': 'accueil',
  'Voir l\'accueil': 'accueil',
};
