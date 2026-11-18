export type ConversationLine = { speaker: string; text: string };

export type Conversation = {
  id: string;
  title: string;
  themes: string[];
  lines: ConversationLine[];
};

export const conversations: Conversation[] = [
  {
    id: 'ecole-aide', title: 'Demander de l’aide en classe', themes: ['ecole', 'argumentation'],
    lines: [
      { speaker: 'Élève', text: 'Excusez-moi, je ne comprends pas la consigne.' },
      { speaker: 'Enseignante', text: 'Quelle partie est difficile pour toi ?' },
      { speaker: 'Élève', text: 'Je ne sais pas quel exemple je dois choisir.' },
      { speaker: 'Enseignante', text: 'Relis la deuxième phrase. Elle donne le critère.' }
    ]
  },
  {
    id: 'famille-invitation', title: 'Inviter une amie', themes: ['famille', 'emotions'],
    lines: [
      { speaker: 'Lina', text: 'Bonjour Sara. Tu veux venir chez moi samedi ?' },
      { speaker: 'Sara', text: 'Merci pour l’invitation. À quelle heure ?' },
      { speaker: 'Lina', text: 'Vers quinze heures. Ma sœur sera aussi là.' },
      { speaker: 'Sara', text: 'D’accord. Je te confirme ce soir.' }
    ]
  },
  {
    id: 'sante-pharmacie', title: 'À la pharmacie', themes: ['corps', 'securite', 'pharmacie-urgences'],
    lines: [
      { speaker: 'Cliente', text: 'Bonjour. J’ai une ordonnance du médecin.' },
      { speaker: 'Pharmacienne', text: 'Bonjour. Puis-je la voir, s’il vous plaît ?' },
      { speaker: 'Cliente', text: 'Oui. Comment dois-je prendre ce médicament ?' },
      { speaker: 'Pharmacienne', text: 'Prenez une dose le matin et lisez la notice.' }
    ]
  },
  {
    id: 'courses-budget', title: 'Faire les courses', themes: ['alimentation', 'budget'],
    lines: [
      { speaker: 'Cliente', text: 'Bonjour. Quel est le prix de ces pommes ?' },
      { speaker: 'Vendeur', text: 'Elles coûtent trois francs le kilo.' },
      { speaker: 'Cliente', text: 'Alors, je prends un kilo, s’il vous plaît.' },
      { speaker: 'Vendeur', text: 'Très bien. Vous pouvez payer à la caisse.' }
    ]
  },
  {
    id: 'logement-panne', title: 'Signaler une panne', themes: ['maison', 'logement', 'reparation-entretien'],
    lines: [
      { speaker: 'Locataire', text: 'Bonjour. Le chauffage de mon appartement est en panne.' },
      { speaker: 'Régie', text: 'Depuis quand ne fonctionne-t-il plus ?' },
      { speaker: 'Locataire', text: 'Depuis hier soir. Il fait très froid.' },
      { speaker: 'Régie', text: 'Nous envoyons une personne cet après-midi.' }
    ]
  },
  {
    id: 'horaire-bus', title: 'Demander son chemin', themes: ['actions', 'ville', 'temps'],
    lines: [
      { speaker: 'Voyageuse', text: 'Excusez-moi, où se trouve l’arrêt de bus ?' },
      { speaker: 'Passant', text: 'Continuez tout droit, puis tournez à gauche.' },
      { speaker: 'Voyageuse', text: 'Merci. Le bus passe bientôt ?' },
      { speaker: 'Passant', text: 'Oui, il arrive dans cinq minutes.' }
    ]
  },
  {
    id: 'sortie-meteo', title: 'Préparer une sortie', themes: ['nature', 'loisirs-sorties'],
    lines: [
      { speaker: 'Noah', text: 'On va au lac demain ?' },
      { speaker: 'Maya', text: 'Oui, mais la météo annonce de la pluie.' },
      { speaker: 'Noah', text: 'Je prendrai mon parapluie et une veste.' },
      { speaker: 'Maya', text: 'Parfait. On se retrouve à la gare à neuf heures.' }
    ]
  },
  {
    id: 'administration', title: 'Au guichet communal', themes: ['demarches', 'poste-banque-assurances'],
    lines: [
      { speaker: 'Usagère', text: 'Bonjour. Je voudrais déposer ce formulaire.' },
      { speaker: 'Employé', text: 'Avez-vous une pièce d’identité et une copie ?' },
      { speaker: 'Usagère', text: 'Oui. Est-ce que je dois aussi signer ici ?' },
      { speaker: 'Employé', text: 'Oui. Ensuite, votre dossier sera complet.' }
    ]
  },
  {
    id: 'emploi-entretien', title: 'Un entretien pour un stage', themes: ['formation', 'travail-stage'],
    lines: [
      { speaker: 'Responsable', text: 'Bonjour. Pourquoi avez-vous postulé à ce stage ?' },
      { speaker: 'Candidate', text: 'Je veux découvrir le métier et gagner de l’expérience.' },
      { speaker: 'Responsable', text: 'Quelles sont vos principales compétences ?' },
      { speaker: 'Candidate', text: 'Je suis ponctuelle, sérieuse et j’aime travailler en équipe.' }
    ]
  },
  {
    id: 'securite-numerique', title: 'Protéger son compte', themes: ['numerique', 'medias'],
    lines: [
      { speaker: 'Ami', text: 'Tu as reçu ce lien étrange sur le réseau social ?' },
      { speaker: 'Élève', text: 'Oui, mais je ne l’ai pas ouvert.' },
      { speaker: 'Ami', text: 'Tu as bien fait. Il faut d’abord vérifier la source.' },
      { speaker: 'Élève', text: 'Je vais aussi bloquer le contact et changer mon mot de passe.' }
    ]
  },
  {
    id: 'debat', title: 'Donner son avis', themes: ['argumentation', 'citoyennete', 'environnement'],
    lines: [
      { speaker: 'Animatrice', text: 'Faut-il utiliser davantage les transports publics ?' },
      { speaker: 'Élève 1', text: 'Oui, car ils peuvent réduire la pollution.' },
      { speaker: 'Élève 2', text: 'Je suis d’accord, mais les horaires doivent être améliorés.' },
      { speaker: 'Animatrice', text: 'Nous avons donc un accord et une condition.' }
    ]
  },
  {
    id: 'coiffeuse', title: 'Chez la coiffeuse', themes: ['coiffeuse'],
    lines: [
      { speaker: 'Coiffeuse', text: 'Bonjour. Quelle coupe souhaitez-vous ?' },
      { speaker: 'Cliente', text: 'Je voudrais raccourcir les cheveux et garder la frange.' },
      { speaker: 'Coiffeuse', text: 'D’accord. Est-ce que je peux aussi effiler les pointes ?' },
      { speaker: 'Cliente', text: 'Oui, mais pas trop court, s’il vous plaît.' }
    ]
  },
  {
    id: 'fleuriste', title: 'Commander un bouquet', themes: ['fleuriste'],
    lines: [
      { speaker: 'Cliente', text: 'Bonjour. Je voudrais commander un bouquet.' },
      { speaker: 'Fleuriste', text: 'Pour quelle occasion et quel budget ?' },
      { speaker: 'Cliente', text: 'Pour un anniversaire. Environ quarante francs.' },
      { speaker: 'Fleuriste', text: 'Très bien. Je prépare une composition de fleurs de saison.' }
    ]
  },
  {
    id: 'tatoueuse', title: 'Avant un tatouage', themes: ['tatoueuse'],
    lines: [
      { speaker: 'Tatoueuse', text: 'Bonjour. Avez-vous choisi le motif et la zone ?' },
      { speaker: 'Cliente', text: 'Oui. Je voudrais ce dessin sur l’avant-bras.' },
      { speaker: 'Tatoueuse', text: 'Avez-vous une allergie connue ?' },
      { speaker: 'Cliente', text: 'Non. Pouvez-vous m’expliquer les soins après le tatouage ?' }
    ]
  },
  {
    id: 'carrosserie', title: 'Faire réparer une voiture', themes: ['carrossiere-peintre'],
    lines: [
      { speaker: 'Cliente', text: 'Bonjour. Ma portière a une bosse et une rayure.' },
      { speaker: 'Carrossière', text: 'Je vais contrôler la carrosserie et préparer un devis.' },
      { speaker: 'Cliente', text: 'Faudra-t-il repeindre toute la portière ?' },
      { speaker: 'Carrossière', text: 'Seulement la zone réparée, avec la même teinte.' }
    ]
  },
  {
    id: 'hygiene', title: 'Préparer ses affaires', themes: ['hygiene-soins'],
    lines: [
      { speaker: 'Éducatrice', text: 'As-tu préparé tes affaires pour la douche ?' },
      { speaker: 'Élève', text: 'J’ai pris le savon et la serviette.' },
      { speaker: 'Éducatrice', text: 'N’oublie pas les vêtements propres et le déodorant.' },
      { speaker: 'Élève', text: 'D’accord. Je vais aussi prendre ma brosse à dents.' }
    ]
  },
  {
    id: 'sport', title: 'Avant un entraînement', themes: ['sports-equipements'],
    lines: [
      { speaker: 'Entraîneuse', text: 'Vous avez tous votre équipement ?' },
      { speaker: 'Joueuse', text: 'J’ai mon maillot, mes baskets et le ballon.' },
      { speaker: 'Entraîneuse', text: 'Très bien. Commencez par vous échauffer.' },
      { speaker: 'Joueuse', text: 'Ensuite, nous faisons un match ?' },
      { speaker: 'Entraîneuse', text: 'Oui, après les exercices en équipe.' }
    ]
  }
];
