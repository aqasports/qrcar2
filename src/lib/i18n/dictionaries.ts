export type Locale = 'fr' | 'ar' | 'en';

export interface Dictionary {
  dir: 'ltr' | 'rtl';
  common: {
    dashboard: string;
    appointments: string;
    clients: string;
    vehicles: string;
    actions: string;
    cards: string;
    workers: string;
    inventory: string;
    invoices: string;
    auditLogs: string;
    settings: string;
    billing: string;
    marketplace: string;
    knowledgebase: string;
    messages: string;
    directory: string;
    logout: string;
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    create: string;
    search: string;
    loading: string;
    status: string;
    active: string;
    inactive: string;
    date: string;
    total: string;
    actions_label: string;
    sessionActive: string;
    currency: string;
    newAction: string;
    viewDetails: string;
    confirm: string;
    filter: string;
    all: string;
    refresh: string;
    export: string;
    download: string;
    phone: string;
    email: string;
    address: string;
    name: string;
    notes: string;
    description: string;
    price: string;
    quantity: string;
    amount: string;
    type: string;
    back: string;
    next: string;
    previous: string;
    print: string;
    yes: string;
    no: string;
    empty: string;
    noData: string;
    breadcrumbsHome: string;
  };
  sidebar: {
    sectionDashboard: string;
    sectionOperations: string;
    sectionCards: string;
    sectionB2B: string;
    sectionAdmin: string;
    dashboard: string;
    appointments: string;
    vehicles: string;
    clients: string;
    actions: string;
    repairTemplates: string;
    inventory: string;
    cardsOverview: string;
    cardsStudio: string;
    cardsOrder: string;
    marketplace: string;
    knowledgebase: string;
    messages: string;
    directory: string;
    invoices: string;
    workers: string;
    notifications: string;
    auditLogs: string;
    settings: string;
    billing: string;
    signOut: string;
    connectedAs: string;
  };
  cockpit: {
    searchPlaceholder: string;
    systemOnline: string;
    newAction: string;
    messagesTooltip: string;
  };
  dashboard: {
    title: string;
    subtitle: string;
    vehiclesInShop: string;
    monthlyRevenue: string;
    activePassports: string;
    pendingAppointments: string;
    recentJobs: string;
    recentJobsDesc: string;
    quickStats: string;
  };
  vehicles: {
    title: string;
    subtitle: string;
    addVehicle: string;
    plate: string;
    make: string;
    model: string;
    year: string;
    mileage: string;
    client: string;
    passportStatus: string;
    vin: string;
    color: string;
    fuel: string;
    transmission: string;
    engineSpec: string;
    oilType: string;
    tireSize: string;
    decodeVin: string;
    vinSuccess: string;
    vinHelp: string;
    activePassport: string;
    unlinkedPassport: string;
    viewPassport: string;
    editVehicle: string;
    deleteVehicle: string;
    searchPlaceholder: string;
  };
  clients: {
    title: string;
    subtitle: string;
    addClient: string;
    fullName: string;
    phone: string;
    email: string;
    address: string;
    vehiclesCount: string;
    totalSpent: string;
    lastVisit: string;
    createPassport: string;
    searchPlaceholder: string;
    noClients: string;
  };
  actions: {
    title: string;
    subtitle: string;
    newAction: string;
    orderNumber: string;
    vehicle: string;
    client: string;
    serviceType: string;
    dateIn: string;
    dateOut: string;
    mileageAtService: string;
    statusPending: string;
    statusInProgress: string;
    statusCompleted: string;
    statusInvoiced: string;
    statusCancelled: string;
    totalAmount: string;
    partsUsed: string;
    laborCost: string;
    internalNotes: string;
    clientNotes: string;
    printRO: string;
    invoiceRO: string;
    searchPlaceholder: string;
  };
  inventory: {
    title: string;
    subtitle: string;
    addPart: string;
    reference: string;
    name: string;
    category: string;
    oemRef: string;
    stockQty: string;
    minStock: string;
    unitCost: string;
    salePrice: string;
    supplier: string;
    lowStockAlert: string;
    stockMovement: string;
    searchPlaceholder: string;
  };
  invoices: {
    title: string;
    subtitle: string;
    newInvoice: string;
    invoiceNumber: string;
    client: string;
    vehicle: string;
    issueDate: string;
    dueDate: string;
    totalHT: string;
    vatAmount: string;
    totalTTC: string;
    statusDraft: string;
    statusIssued: string;
    statusPaid: string;
    statusOverdue: string;
    payInvoice: string;
    downloadPDF: string;
    searchPlaceholder: string;
  };
  appointments: {
    title: string;
    subtitle: string;
    newAppointment: string;
    client: string;
    vehicle: string;
    serviceType: string;
    preferredDate: string;
    timeSlot: string;
    statusPending: string;
    statusConfirmed: string;
    statusCompleted: string;
    statusCancelled: string;
    confirmBooking: string;
    cancelBooking: string;
    garageNotes: string;
    searchPlaceholder: string;
  };
  cards: {
    title: string;
    subtitle: string;
    cardsInventory: string;
    cardsStudio: string;
    cardsOrder: string;
    token: string;
    status: string;
    assignedVehicle: string;
    qrCode: string;
    revokeCard: string;
    reassignCard: string;
    printBatch: string;
    studioTitle: string;
    studioSubtitle: string;
    frontFace: string;
    backFace: string;
    safeMargin: string;
    theme: string;
    exportDpi: string;
    orderTitle: string;
    orderSubtitle: string;
    volumeTiers: string;
    wilayaDelivery: string;
    unitPrice: string;
    deliveryCost: string;
    totalToPay: string;
    checkoutChargily: string;
  };
  marketplace: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    allWilayas: string;
    allCategories: string;
    publishListing: string;
    contactSeller: string;
    conditionNew: string;
    conditionUsed: string;
    conditionRefurbished: string;
    noListings: string;
  };
  knowledgebase: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    shareSolution: string;
    helpfulVotes: string;
    readGuide: string;
    noSolutions: string;
    popularCodes: string;
  };
  messages: {
    title: string;
    subtitle: string;
    activeDiscussions: string;
    noConversations: string;
    selectConversation: string;
    typeMessage: string;
    send: string;
    attachDtc: string;
    attachPart: string;
  };
  workers: {
    title: string;
    subtitle: string;
    addWorker: string;
    fullName: string;
    role: string;
    phone: string;
    specialty: string;
    activeJobs: string;
    statusActive: string;
    statusInactive: string;
    searchPlaceholder: string;
  };
  portal: {
    digitalPassport: string;
    vehicleSpecs: string;
    serviceHistory: string;
    reminders: string;
    bookAppointment: string;
    mileage: string;
    fuel: string;
    transmission: string;
    engine: string;
    oil: string;
    tires: string;
    nextService: string;
    nextInspection: string;
    noHistory: string;
    selectDate: string;
    timeSlot: string;
    morning: string;
    afternoon: string;
    submitBooking: string;
    bookingSuccess: string;
    reminderTitle: string;
    setReminder: string;
    garageResponse: string;
    pendingConfirmation: string;
    downloadInvoice: string;
    cardDeactivated: string;
    cardInvalid: string;
  };
  billing: {
    title: string;
    subtitle: string;
    currentPlan: string;
    payWithBaridiMob: string;
    starterPlan: string;
    proPlan: string;
    enterprisePlan: string;
    branchesQuota: string;
    seatsQuota: string;
    cardStudioTier: string;
    renewNow: string;
    trialEndsIn: string;
  };
  settings: {
    title: string;
    subtitle: string;
    garageName: string;
    logoUrl: string;
    primaryColor: string;
    secondaryColor: string;
    defaultLocale: string;
    currency: string;
    timezone: string;
    address: string;
    phone: string;
    savedSuccessfully: string;
  };
  login: {
    title: string;
    subtitle: string;
    username: string;
    password: string;
    signInButton: string;
    forgotPassword: string;
    backHome: string;
    proDirectory: string;
  };
}

export const dictionaries: Record<Locale, Dictionary> = {
  fr: {
    dir: 'ltr',
    common: {
      dashboard: 'Tableau de bord',
      appointments: 'Rendez-Vous (RDV)',
      clients: 'Clients',
      vehicles: 'Véhicules',
      actions: 'Interventions',
      cards: 'Cartes PVC',
      workers: 'Équipe & Techniciens',
      inventory: 'Stock & Pièces',
      invoices: 'Facturation & Devis',
      auditLogs: 'Journal d’Audit',
      settings: 'Paramètres & Marque',
      billing: 'Facturation & Abonnements',
      marketplace: 'Marketplace Pièces',
      knowledgebase: 'Base Diagnostics DTC',
      messages: 'Messagerie Directe',
      directory: 'Annuaire National',
      logout: 'Déconnexion',
      save: 'Enregistrer',
      cancel: 'Annuler',
      delete: 'Supprimer',
      edit: 'Modifier',
      create: 'Créer',
      search: 'Rechercher...',
      loading: 'Chargement...',
      status: 'Statut',
      active: 'Actif',
      inactive: 'Inactif',
      date: 'Date',
      total: 'Total',
      actions_label: 'Actions',
      sessionActive: 'Session Active',
      currency: 'DZD',
      newAction: 'Nouvel OR',
      viewDetails: 'Consulter',
      confirm: 'Confirmer',
      filter: 'Filtrer',
      all: 'Tous',
      refresh: 'Actualiser',
      export: 'Exporter',
      download: 'Télécharger',
      phone: 'Téléphone',
      email: 'Email',
      address: 'Adresse',
      name: 'Nom',
      notes: 'Notes',
      description: 'Description',
      price: 'Prix',
      quantity: 'Quantité',
      amount: 'Montant',
      type: 'Type',
      back: 'Retour',
      next: 'Suivant',
      previous: 'Précédent',
      print: 'Imprimer',
      yes: 'Oui',
      no: 'Non',
      empty: 'Aucune donnée',
      noData: 'Aucun enregistrement disponible',
      breadcrumbsHome: 'Tableau de bord',
    },
    sidebar: {
      sectionDashboard: 'Tableau de bord & Planning',
      sectionOperations: 'Atelier & Opérations',
      sectionCards: 'Cartes PVC & Fidélité',
      sectionB2B: 'Réseau B2B Inter-Ateliers',
      sectionAdmin: 'Gestion & Administration',
      dashboard: 'Tableau de Bord',
      appointments: 'Rendez-Vous (RDV)',
      vehicles: 'Parc Véhicules',
      clients: 'Clients & Passeports',
      actions: 'Ordres de Réparation (OR)',
      repairTemplates: 'Modèles & Forfaits OR',
      inventory: 'Stock & Pièces',
      cardsOverview: 'Gestion des Cartes PVC',
      cardsStudio: 'Studio Design Cartes',
      cardsOrder: 'Commander des Cartes',
      marketplace: 'Marketplace Pièces B2B',
      knowledgebase: 'Base Diagnostics DTC',
      messages: 'Messagerie Directe',
      directory: 'Annuaire Professionnel',
      invoices: 'Factures & Devis',
      workers: 'Équipe & Techniciens',
      notifications: 'Notifications & Alertes',
      auditLogs: 'Journal d’Audit & Sécurité',
      settings: 'Paramètres Atelier',
      billing: 'Abonnement & Formules',
      signOut: 'Déconnexion Atelier',
      connectedAs: 'Connecté en tant que',
    },
    cockpit: {
      searchPlaceholder: 'Recherche globale, VIN, DTC...',
      systemOnline: 'SYSTÈME CONNECTÉ',
      newAction: 'Nouvel OR',
      messagesTooltip: 'Messagerie Directe Inter-Garages',
    },
    dashboard: {
      title: 'Cockpit de Gestion Atelier',
      subtitle: 'Suivi en temps réel des réparations, du flux de véhicules et du chiffre d\'affaires',
      vehiclesInShop: 'Véhicules en Atelier',
      monthlyRevenue: 'Chiffre d\'Affaires du Mois',
      activePassports: 'Passeports PVC Actifs',
      pendingAppointments: 'Rendez-vous en Attente',
      recentJobs: 'Dernières Interventions d\'Atelier',
      recentJobsDesc: 'Historique des ordres de réparation récemment créés ou mis à jour.',
      quickStats: 'Métriques Clés de l\'Atelier',
    },
    vehicles: {
      title: 'Parc Automobile & Gestion des Véhicules',
      subtitle: 'Suivi centralisé des véhicules de l’atelier, décodage VIN automatique et association des badges PVC',
      addVehicle: 'Ajouter un Véhicule',
      plate: 'Immatriculation',
      make: 'Marque',
      model: 'Modèle',
      year: 'Année',
      mileage: 'Kilométrage',
      client: 'Propriétaire / Client',
      passportStatus: 'Passeport PVC',
      vin: 'Numéro de Châssis (VIN)',
      color: 'Couleur',
      fuel: 'Carburant',
      transmission: 'Transmission',
      engineSpec: 'Motorisation',
      oilType: 'Huile Préconisée',
      tireSize: 'Pneumatiques',
      decodeVin: 'Décoder VIN',
      vinSuccess: 'Données techniques récupérées avec succès',
      vinHelp: 'Entrez 17 caractères conformes ISO 3779',
      activePassport: 'Actif',
      unlinkedPassport: 'Non assigné',
      viewPassport: 'Consulter le Passeport',
      editVehicle: 'Modifier Véhicule',
      deleteVehicle: 'Supprimer Véhicule',
      searchPlaceholder: 'Rechercher par immatriculation, VIN, marque ou client...',
    },
    clients: {
      title: 'Répertoire Clients & Propriétaires',
      subtitle: 'Gérez vos fiches clients, coordonnées de contact et véhicules rattachés',
      addClient: 'Nouveau Client',
      fullName: 'Nom & Prénom',
      phone: 'Téléphone',
      email: 'Adresse Email',
      address: 'Adresse / Wilaya',
      vehiclesCount: 'Véhicules',
      totalSpent: 'Chiffre d’Affaires',
      lastVisit: 'Dernière Visite',
      createPassport: 'Créer Passeport',
      searchPlaceholder: 'Rechercher par nom, téléphone ou email...',
      noClients: 'Aucun client enregistré dans votre base.',
    },
    actions: {
      title: 'Ordres de Réparation (OR) & Interventions',
      subtitle: 'Créez, planifiez et clôturez les réparations de l’atelier avec pièces et main d’œuvre',
      newAction: 'Nouvel Ordre de Réparation',
      orderNumber: 'N° OR',
      vehicle: 'Véhicule',
      client: 'Client',
      serviceType: 'Prestation Principale',
      dateIn: 'Date Entrée',
      dateOut: 'Date Sortie',
      mileageAtService: 'Kilométrage OR',
      statusPending: 'En attente',
      statusInProgress: 'En cours',
      statusCompleted: 'Terminé',
      statusInvoiced: 'Facturé',
      statusCancelled: 'Annulé',
      totalAmount: 'Montant Total',
      partsUsed: 'Pièces Utilisées',
      laborCost: 'Main d’Œuvre',
      internalNotes: 'Notes Internes Atelier',
      clientNotes: 'Notes Visibles sur Passeport Client',
      printRO: 'Imprimer OR',
      invoiceRO: 'Générer Facture',
      searchPlaceholder: 'Rechercher par N° OR, immatriculation ou description...',
    },
    inventory: {
      title: 'Gestion des Stocks & Magasin de Pièces',
      subtitle: 'Contrôlez les stocks de pièces de rechange, alertes de réapprovisionnement et références OEM',
      addPart: 'Ajouter une Pièce',
      reference: 'Référence / Réf OEM',
      name: 'Désignation',
      category: 'Catégorie',
      oemRef: 'Réf. Constructeur OEM',
      stockQty: 'Stock Actuel',
      minStock: 'Seuil Alerte',
      unitCost: 'Prix Achat HT',
      salePrice: 'Prix Vente TTC',
      supplier: 'Fournisseur',
      lowStockAlert: 'Alerte Rupture Imminente',
      stockMovement: 'Mouvement de Stock',
      searchPlaceholder: 'Rechercher par désignation, référence ou catégorie...',
    },
    invoices: {
      title: 'Facturation & Devis Atelier',
      subtitle: 'Émettez des factures professionnelles conformes avec QR code de certification',
      newInvoice: 'Créer une Facture',
      invoiceNumber: 'N° Facture',
      client: 'Client Facturé',
      vehicle: 'Véhicule Lié',
      issueDate: 'Date d’Émission',
      dueDate: 'Date d’Échéance',
      totalHT: 'Total HT',
      vatAmount: 'TVA',
      totalTTC: 'Total TTC',
      statusDraft: 'Brouillon',
      statusIssued: 'Émise / En attente',
      statusPaid: 'Payée',
      statusOverdue: 'En retard',
      payInvoice: 'Enregistrer Paiement',
      downloadPDF: 'Télécharger PDF',
      searchPlaceholder: 'Rechercher par N° Facture, client ou immatriculation...',
    },
    appointments: {
      title: 'Planning & Rendez-Vous Atelier',
      subtitle: 'Gérez les demandes de réservation des clients issues des scans de cartes PVC',
      newAppointment: 'Planifier un RDV',
      client: 'Client',
      vehicle: 'Véhicule',
      serviceType: 'Type d’Entretien',
      preferredDate: 'Date Prévue',
      timeSlot: 'Créneau Horaire',
      statusPending: 'En attente',
      statusConfirmed: 'Confirmé',
      statusCompleted: 'Réalisé',
      statusCancelled: 'Annulé',
      confirmBooking: 'Confirmer le RDV',
      cancelBooking: 'Annuler le RDV',
      garageNotes: 'Réponse de l’Atelier',
      searchPlaceholder: 'Rechercher un rendez-vous par client ou véhicule...',
    },
    cards: {
      title: 'Cartes PVC Connectées & Passeports',
      subtitle: 'Inventaire des cartes NFC / QR physiques, association aux véhicules et suivi',
      cardsInventory: 'Inventaire Cartes',
      cardsStudio: 'Studio Design 300 DPI',
      cardsOrder: 'Commander Réassort',
      token: 'Jeton Cryptographique',
      status: 'Statut Badge',
      assignedVehicle: 'Véhicule Associé',
      qrCode: 'QR Code Officiel',
      revokeCard: 'Révoquer Carte',
      reassignCard: 'Réassigner Carte',
      printBatch: 'Imprimer Planche',
      studioTitle: 'Studio de Conception Carte PVC (CR-80)',
      studioSubtitle: 'Personnalisez la maquette officielle 300 DPI (85.6mm × 53.98mm) de vos cartes atelier',
      frontFace: 'Recto (Face Principale)',
      backFace: 'Verso (Scan QR Code)',
      safeMargin: 'Marge de Sécurité Découpe',
      theme: 'Thème Graphique',
      exportDpi: 'Aperçu Rendu 300 DPI',
      orderTitle: 'Commande de Cartes PVC Pré-Imprimées',
      orderSubtitle: 'Livraison express suivie dans les 58 Wilayas via Yalidine Express',
      volumeTiers: 'Tarifs Dégressifs par Volume',
      wilayaDelivery: 'Wilaya de Livraison',
      unitPrice: 'Prix Unitaire',
      deliveryCost: 'Frais d’Expédition Yalidine',
      totalToPay: 'Total à Payer',
      checkoutChargily: 'Payer avec Chargily Pay (BaridiMob / EDAHABIA)',
    },
    marketplace: {
      title: 'Marketplace B2B Pièces de Rechange',
      subtitle: 'Achetez et vendez des pièces neuves, d\'occasion testées ou reconditionnées entre professionnels',
      searchPlaceholder: 'Rechercher par référence OEM, nom de pièce ou modèle...',
      allWilayas: 'Toutes les Wilayas (58)',
      allCategories: 'Toutes les Catégories',
      publishListing: 'Publier une Pièce',
      contactSeller: 'Contacter l\'Atelier',
      conditionNew: 'Neuf d\'origine (OEM)',
      conditionUsed: 'Occasion Testée',
      conditionRefurbished: 'Reconditionné Garanti',
      noListings: 'Aucune pièce disponible avec ces filtres.',
    },
    knowledgebase: {
      title: 'Base de Connaissances Mécaniques & Diagnostics DTC',
      subtitle: 'Dépannages éprouvés, causes racines et procédures d\'atelier pour les codes calculateurs OBD-II',
      searchPlaceholder: 'Rechercher par symptôme (ex. calage à chaud, P0300, perte de puissance...)',
      shareSolution: 'Partager une Fiche Technique',
      helpfulVotes: 'Votes Utiles',
      readGuide: 'Lire la Fiche →',
      noSolutions: 'Aucune fiche de dépannage trouvée.',
      popularCodes: 'Codes Fréquents :',
    },
    messages: {
      title: 'Messagerie Directe B2B Inter-Ateliers',
      subtitle: 'Échangez instantanément entre chefs d\'atelier sur les pièces de rechange, diagnostics et disponibilités',
      activeDiscussions: 'Discussions Actives',
      noConversations: 'Aucune conversation en cours. Contactez un atelier depuis la Marketplace ou l’Annuaire.',
      selectConversation: 'Sélectionnez une discussion pour afficher les messages.',
      typeMessage: 'Rédigez votre message à l\'atelier...',
      send: 'Envoyer',
      attachDtc: 'Attacher Code DTC',
      attachPart: 'Attacher Réf. Pièce',
    },
    workers: {
      title: 'Équipe d’Atelier & Gestion des Techniciens',
      subtitle: 'Gérez vos mécaniciens, électriciens auto et chefs d’équipe avec leurs accès',
      addWorker: 'Ajouter un Technicien',
      fullName: 'Nom & Prénom',
      role: 'Poste / Rôle',
      phone: 'Téléphone',
      specialty: 'Spécialité Principale',
      activeJobs: 'Interventions en cours',
      statusActive: 'En activité',
      statusInactive: 'Inactif',
      searchPlaceholder: 'Rechercher un membre de l’équipe...',
    },
    portal: {
      digitalPassport: 'Passeport Numérique Véhicule',
      vehicleSpecs: 'Fiche Technique & Spécifications',
      serviceHistory: 'Historique Certifié des Entretiens',
      reminders: 'Rappels & Alertes Maintenance',
      bookAppointment: 'Prendre Rendez-vous à l’Atelier',
      mileage: 'Kilométrage Actuel',
      fuel: 'Carburant',
      transmission: 'Boîte de Vitesse',
      engine: 'Motorisation',
      oil: 'Huile Moteur Recommandée',
      tires: 'Dimensions Pneus',
      nextService: 'Prochaine Vidange',
      nextInspection: 'Contrôle Technique',
      noHistory: 'Aucune intervention enregistrée pour ce véhicule.',
      selectDate: 'Date souhaitée',
      timeSlot: 'Créneau horaire',
      morning: 'Matin (08h00 - 12h00)',
      afternoon: 'Après-midi (13h00 - 17h00)',
      submitBooking: 'Confirmer la Demande de Rendez-vous',
      bookingSuccess: 'Votre demande de rendez-vous a été transmise à l’atelier.',
      reminderTitle: 'Programmer un Rappel Entretien',
      setReminder: 'Enregistrer le rappel',
      garageResponse: 'Note de l’atelier',
      pendingConfirmation: 'En attente de confirmation',
      downloadInvoice: 'Télécharger Facture PDF',
      cardDeactivated: 'Cette carte d’identité véhicule a été désactivée.',
      cardInvalid: 'Le QR code scanné n’est associé à aucun véhicule valide.',
    },
    billing: {
      title: 'Facturation & Abonnement Atelier',
      subtitle: 'Gérez votre formule SaaS et vos paiements via BaridiMob / EDAHABIA / CIB.',
      currentPlan: 'Forfait Actuel',
      payWithBaridiMob: 'Payer avec BaridiMob / EDAHABIA',
      starterPlan: 'Starter Atelier',
      proPlan: 'Pro Performance (Recommandé)',
      enterprisePlan: 'Enterprise Multi-Sites',
      branchesQuota: 'Succursales & Ateliers',
      seatsQuota: 'Utilisateurs & Techniciens',
      cardStudioTier: 'Studio Cartes PVC',
      renewNow: 'Renouveler l’Abonnement',
      trialEndsIn: 'Votre période d’essai expire le',
    },
    settings: {
      title: 'Paramètres & Personnalisation de l’Atelier',
      subtitle: 'Personnalisez votre logo, vos couleurs d’atelier, votre devise et vos coordonnées.',
      garageName: 'Nom Commercial de l’Atelier',
      logoUrl: 'URL du Logo de l’Atelier',
      primaryColor: 'Couleur Principale (Thème)',
      secondaryColor: 'Couleur Secondaire (Accent)',
      defaultLocale: 'Langue par Défaut',
      currency: 'Devise Principale',
      timezone: 'Fuseau Horaire',
      address: 'Adresse de l’Atelier',
      phone: 'Téléphone de Contact',
      savedSuccessfully: 'Paramètres et thème de marque enregistrés avec succès !',
    },
    login: {
      title: 'Garage Pro Back-Office',
      subtitle: 'Portail de gestion atelier et traçabilité des véhicules',
      username: 'Identifiant Utilisateur',
      password: 'Mot de Passe',
      signInButton: 'Se Connecter à l’Atelier →',
      forgotPassword: 'Mot de passe oublié ?',
      backHome: '← Retour à l’accueil',
      proDirectory: 'Annuaire public ↗',
    },
  },
  ar: {
    dir: 'rtl',
    common: {
      dashboard: 'لوحة القيادة',
      appointments: 'المواعيد (RDV)',
      clients: 'الزبائن',
      vehicles: 'المركبات',
      actions: 'التدخلات والصيانة',
      cards: 'بطاقات PVC',
      workers: 'فريق العمل والتقنيين',
      inventory: 'المخزون وقطع الغيار',
      invoices: 'الفواتير وعروض الأسعار',
      auditLogs: 'سجل العمليات',
      settings: 'الإعدادات والهوية',
      billing: 'الاشتراكات والدفع',
      marketplace: 'سوق قطع الغيار',
      knowledgebase: 'قاعدة تشخيص الأعطال',
      messages: 'المراسلة المباشرة',
      directory: 'الدليل الوطني',
      logout: 'تسجيل الخروج',
      save: 'حفظ',
      cancel: 'إلغاء',
      delete: 'حذف',
      edit: 'تعديل',
      create: 'إنشاء',
      search: 'بحث...',
      loading: 'جاري التحميل...',
      status: 'الحالة',
      active: 'نشط',
      inactive: 'غير نشط',
      date: 'التاريخ',
      total: 'المجموع',
      actions_label: 'الإجراءات',
      sessionActive: 'الجلسة نشطة',
      currency: 'د.ج',
      newAction: 'أمر إصلاح جديد',
      viewDetails: 'معاينة',
      confirm: 'تأكيد',
      filter: 'تصفية',
      all: 'الكل',
      refresh: 'تحديث',
      export: 'تصدير',
      download: 'تحميل',
      phone: 'الهاتف',
      email: 'البريد الإلكتروني',
      address: 'العنوان',
      name: 'الاسم',
      notes: 'ملاحظات',
      description: 'الوصف',
      price: 'السعر',
      quantity: 'الكمية',
      amount: 'المبلغ',
      type: 'النوع',
      back: 'رجوع',
      next: 'التالي',
      previous: 'السابق',
      print: 'طباعة',
      yes: 'نعم',
      no: 'لا',
      empty: 'لا توجد بيانات',
      noData: 'لا توجد سجلات متاحة',
      breadcrumbsHome: 'لوحة القيادة',
    },
    sidebar: {
      sectionDashboard: 'لوحة القيادة والمواعيد',
      sectionOperations: 'الورشة والعمليات',
      sectionCards: 'بطاقات PVC والولاء',
      sectionB2B: 'شبكة الورشات المشتركة B2B',
      sectionAdmin: 'الإدارة والإعدادات',
      dashboard: 'لوحة القيادة',
      appointments: 'المواعيد (RDV)',
      vehicles: 'أسطول المركبات',
      clients: 'الزبائن وجوازات السفر',
      actions: 'أوامر الإصلاح (OR)',
      repairTemplates: 'نماذج وباقات الإصلاح',
      inventory: 'المخزون وقطع الغيار',
      cardsOverview: 'إدارة بطاقات PVC',
      cardsStudio: 'استوديو تصميم البطاقات',
      cardsOrder: 'طلب طباعة البطاقات',
      marketplace: 'سوق قطع الغيار B2B',
      knowledgebase: 'قاعدة تشخيص الأعطال DTC',
      messages: 'المحادثات المباشرة',
      directory: 'الدليل الوطني للورشات',
      invoices: 'الفواتير وعروض الأسعار',
      workers: 'فريق العمل والتقنيين',
      notifications: 'الإشعارات والتنبيهات',
      auditLogs: 'سجل الأمان والعمليات',
      settings: 'إعدادات الورشة',
      billing: 'الاشتراك والباقات',
      signOut: 'تسجيل الخروج',
      connectedAs: 'متصل بحساب',
    },
    cockpit: {
      searchPlaceholder: 'بحث عام، رقم الشاسيه VIN، كود العطل DTC...',
      systemOnline: 'النظام متصل',
      newAction: 'أمر إصلاح جديد',
      messagesTooltip: 'المراسلة المباشرة بين الورشات',
    },
    dashboard: {
      title: 'لوحة قيادة إدارة الورشة',
      subtitle: 'متابعة مباشرة للإصلاحات، حركة المركبات ورقم الأعمال',
      vehiclesInShop: 'مركبات في الورشة حالياً',
      monthlyRevenue: 'رقم أعمال الشهر',
      activePassports: 'بطاقات PVC المفعّلة',
      pendingAppointments: 'مواعيد في انتظار التأكيد',
      recentJobs: 'آخر أوامر الإصلاح',
      recentJobsDesc: 'سجل أوامر الإصلاح والتدخلات المنشأة حديثاً.',
      quickStats: 'المؤشرات الرئيسية للورشة',
    },
    vehicles: {
      title: 'أسطول المركبات وإدارة السيارات',
      subtitle: 'متابعة مركزية لمركبات الورشة، فك شفرة VIN تلقائياً وربط بطاقات PVC',
      addVehicle: 'إضافة مركبة جديدة',
      plate: 'رقم التسجيل (الترقيم)',
      make: 'الماركة',
      model: 'الطراز',
      year: 'سنة الصنع',
      mileage: 'العداد (كم)',
      client: 'المالك / الزبون',
      passportStatus: 'بطاقة PVC',
      vin: 'رقم الشاسيه (VIN)',
      color: 'اللون',
      fuel: 'نوع الوقود',
      transmission: 'علبة السرعات',
      engineSpec: 'المحرك',
      oilType: 'الزيت الموصى به',
      tireSize: 'مقاس العجلات',
      decodeVin: 'فك شفرة VIN',
      vinSuccess: 'تم استخراج البيانات التقنية بنجاح',
      vinHelp: 'أدخل 17 حرفاً مطابقاً لمعيار ISO 3779',
      activePassport: 'مفعّلة',
      unlinkedPassport: 'غير معينة',
      viewPassport: 'معاينة جواز السفر',
      editVehicle: 'تعديل المركبة',
      deleteVehicle: 'حذف المركبة',
      searchPlaceholder: 'بحث برقم الترقيم، VIN، الماركة أو الزبون...',
    },
    clients: {
      title: 'دليل الزبائن ومالكي المركبات',
      subtitle: 'إدارة ملفات الزبائن، أرقام الهواتف والمركبات التابعة لهم',
      addClient: 'زبون جديد',
      fullName: 'الاسم واللقب',
      phone: 'رقم الهاتف',
      email: 'البريد الإلكتروني',
      address: 'العنوان / الولاية',
      vehiclesCount: 'المركبات',
      totalSpent: 'إجمالي المداخيل',
      lastVisit: 'آخر زيارة',
      createPassport: 'إنشاء جواز سفر',
      searchPlaceholder: 'بحث بالاسم، رقم الهاتف أو البريد...',
      noClients: 'لا يوجد زبائن مسجلون في قاعدة البيانات.',
    },
    actions: {
      title: 'أوامر الإصلاح (OR) والتدخلات',
      subtitle: 'إنشاء ومتابعة عمليات الصيانة والإصلاح في الورشة مع حساب القطع واليد العاملة',
      newAction: 'أمر إصلاح جديد',
      orderNumber: 'رقم أمر الإصلاح',
      vehicle: 'المركبة',
      client: 'الزبون',
      serviceType: 'نوع التدخل الرئيسي',
      dateIn: 'تاريخ الدخول',
      dateOut: 'تاريخ الخروج',
      mileageAtService: 'العداد عند الدخول',
      statusPending: 'في الانتظار',
      statusInProgress: 'قيد الإنجاز',
      statusCompleted: 'مكتمل',
      statusInvoiced: 'مفوتر',
      statusCancelled: 'ملغى',
      totalAmount: 'المبلغ الإجمالي',
      partsUsed: 'القطع المستخدمة',
      laborCost: 'اليد العاملة',
      internalNotes: 'ملاحظات داخلية للورشة',
      clientNotes: 'ملاحظات ظاهرة للزبون في الجواز',
      printRO: 'طباعة أمر الإصلاح',
      invoiceRO: 'إصدار فاتورة',
      searchPlaceholder: 'بحث برقم الأمر، الترقيم أو الوصف...',
    },
    inventory: {
      title: 'إدارة المخزون ومستودع قطع الغيار',
      subtitle: 'مراقبة كميات قطع الغيار، تنبيهات الاقتراب من النفاد وأرقام OEM',
      addPart: 'إضافة قطعة غيار',
      reference: 'المرجع / كود OEM',
      name: 'اسم القطعة',
      category: 'الصنف',
      oemRef: 'المرجع الأصلي OEM',
      stockQty: 'الكمية الحالية',
      minStock: 'حد التنبيه الأدنى',
      unitCost: 'سعر الشراء بدون ضريبة',
      salePrice: 'سعر البيع النهائي',
      supplier: 'المورد',
      lowStockAlert: 'تنبيه اقتراب نفاد المخزون',
      stockMovement: 'حركة المخزون',
      searchPlaceholder: 'بحث باسم القطعة، المرجع أو الصنف...',
    },
    invoices: {
      title: 'الفواتير وعروض الأسعار',
      subtitle: 'إصدار فواتير احترافية معتمدة مع رمز الاستجابة السريعة QR للتحقق',
      newInvoice: 'إنشاء فاتورة جديدة',
      invoiceNumber: 'رقم الفاتورة',
      client: 'الزبون',
      vehicle: 'المركبة المرتبطة',
      issueDate: 'تاريخ الإصدار',
      dueDate: 'تاريخ الاستحقاق',
      totalHT: 'المبلغ الخام HT',
      vatAmount: 'قيمة الضريبة TVA',
      totalTTC: 'المبلغ الإجمالي TTC',
      statusDraft: 'مسودة',
      statusIssued: 'صادرة / غير مدفوعة',
      statusPaid: 'مدفوعة بالكامل',
      statusOverdue: 'متأخرة',
      payInvoice: 'تسجيل الدفع',
      downloadPDF: 'تحميل الفاتورة PDF',
      searchPlaceholder: 'بحث برقم الفاتورة، الزبون أو الترقيم...',
    },
    appointments: {
      title: 'جدول المواعيد وحجوزات الورشة',
      subtitle: 'إدارة طلبات المواعيد الواردة من مسح بطاقات الزبائن PVC',
      newAppointment: 'حجز موعد جديد',
      client: 'الزبون',
      vehicle: 'المركبة',
      serviceType: 'نوع الصيانة المطلوبة',
      preferredDate: 'التاريخ المحدد',
      timeSlot: 'الفترة الزمنية',
      statusPending: 'في الانتظار',
      statusConfirmed: 'مؤكد',
      statusCompleted: 'منجز',
      statusCancelled: 'ملغى',
      confirmBooking: 'تأكيد الموعد',
      cancelBooking: 'إلغاء الموعد',
      garageNotes: 'رد وتوجيهات الورشة',
      searchPlaceholder: 'بحث في المواعيد بالزبون أو المركبة...',
    },
    cards: {
      title: 'بطاقات PVC الذكية وجوازات السفر',
      subtitle: 'مخزون بطاقات NFC / QR المادية، التعيين للمركبات والتتبع',
      cardsInventory: 'مخزون البطاقات',
      cardsStudio: 'استوديو التصميم 300 DPI',
      cardsOrder: 'طلب بطاقات جديدة',
      token: 'الرمز التشفيري',
      status: 'حالة البطاقة',
      assignedVehicle: 'المركبة المعينة',
      qrCode: 'رمز QR الرسمي',
      revokeCard: 'إلغاء تفعيل البطاقة',
      reassignCard: 'إعادة تعيين البطاقة',
      printBatch: 'طباعة الدفعة',
      studioTitle: 'استوديو تصميم بطاقات PVC الرسمية (CR-80)',
      studioSubtitle: 'تخصيص المظهر الطباعي الاحترافي 300 DPI لبطاقات الورشة',
      frontFace: 'الواجهة الأمامية (الرئيسية)',
      backFace: 'الواجهة الخلفية (رمز QR)',
      safeMargin: 'هامش أمان القص',
      theme: 'سمة التصميم والألوان',
      exportDpi: 'معاينة الطباعة 300 DPI',
      orderTitle: 'طلب طباعة بطاقات PVC مع الشحن',
      orderSubtitle: 'توصيل سريع مع التتبع عبر 58 ولاية عن طريق ياليدين إكسبريس',
      volumeTiers: 'أسعار مخفضة حسب الكمية',
      wilayaDelivery: 'ولاية الاستلام',
      unitPrice: 'سعر البطاقة الواحدة',
      deliveryCost: 'تكلفة شحن ياليدين',
      totalToPay: 'المبلغ الإجمالي للدفع',
      checkoutChargily: 'الدفع الآمن عبر بريدي موب / البطاقة الذهبية',
    },
    marketplace: {
      title: 'سوق قطع الغيار B2B بين الورشات',
      subtitle: 'بيع وشراء قطع الغيار الأصلية، المستعملة المفحوصة والمجددة بين المحترفين',
      searchPlaceholder: 'بحث برقم القطعة OEM، الاسم أو طراز المركبة...',
      allWilayas: 'كل الولايات (58)',
      allCategories: 'كل الأصناف',
      publishListing: 'نشر قطعة للبيع',
      contactSeller: 'مراسلة الورشة',
      conditionNew: 'أصلي جديد (OEM)',
      conditionUsed: 'مستعمل مفحوص ومضمون',
      conditionRefurbished: 'مجدد مع الضمان',
      noListings: 'لا توجد قطع مطابقة لخيارات البحث.',
    },
    knowledgebase: {
      title: 'قاعدة المعرفة الميكانيكية وتشخيص أعطال DTC',
      subtitle: 'إجراءات إصلاح معتمدة، الأسباب الجذرية وحلول أعطال حواسيب المركبات OBD-II',
      searchPlaceholder: 'بحث بالعَرَض أو رمز العطل (مثال: توقف المحرك، P0300، ضعف العزم...)',
      shareSolution: 'مشاركة تقرير إصلاح',
      helpfulVotes: 'أصوات مفيدة',
      readGuide: 'قراءة التقرير ←',
      noSolutions: 'لم يتم العثور على تقارير إصلاح مطابقة.',
      popularCodes: 'رموز الأعطال الشائعة :',
    },
    messages: {
      title: 'المراسلة المباشرة B2B بين الورشات',
      subtitle: 'تواصل فوري بين رؤساء الورشات حول قطع الغيار، تشخيص الأعطال والتوفر',
      activeDiscussions: 'المحادثات النشطة',
      noConversations: 'لا توجد محادثات جارية. تواصل مع ورشة من السوق أو الدليل.',
      selectConversation: 'اختر محادثة لعرض الرسائل المتبادلة.',
      typeMessage: 'اكتب رسالتك للورشة...',
      send: 'إرسال',
      attachDtc: 'إرفاق رمز DTC',
      attachPart: 'إرفاق رقم القطعة',
    },
    workers: {
      title: 'فريق عمل الورشة والتقنيين',
      subtitle: 'إدارة الميكانيكيين، تقنيي كهرباء السيارات ورؤساء الفرق مع صلاحياتهم',
      addWorker: 'إضافة تقني جديد',
      fullName: 'الاسم واللقب',
      role: 'المنصب / الصلاحية',
      phone: 'رقم الهاتف',
      specialty: 'التخصص التقني',
      activeJobs: 'المهام الجارية',
      statusActive: 'نشط',
      statusInactive: 'غير نشط',
      searchPlaceholder: 'بحث في أعضاء الفريق...',
    },
    portal: {
      digitalPassport: 'جواز السفر الرقمي للمركبة',
      vehicleSpecs: 'البطاقة التقنية والمواصفات',
      serviceHistory: 'سجل الصيانة المعتمد',
      reminders: 'تنبيهات ومواعيد الصيانة القادمة',
      bookAppointment: 'حجز موعد في الورشة',
      mileage: 'العداد الحالي (كم)',
      fuel: 'نوع الوقود',
      transmission: 'علبة السرعات',
      engine: 'المحرك',
      oil: 'زيت المحرك الموصى به',
      tires: 'مقاس العجلات',
      nextService: 'موعد تغيير الزيت القادم',
      nextInspection: 'الفحص التقني الدوري',
      noHistory: 'لا توجد تدخلات مسجلة لهذه المركبة حتى الآن.',
      selectDate: 'التاريخ المطلوب',
      timeSlot: 'الفترة المفضلة',
      morning: 'صباحاً (08:00 - 12:00)',
      afternoon: 'مساءً (13:00 - 17:00)',
      submitBooking: 'تأكيد طلب الموعد',
      bookingSuccess: 'تم إرسال طلب الموعد إلى الورشة بنجاح.',
      reminderTitle: 'ضبط تذكير صيانة',
      setReminder: 'حفظ التذكير',
      garageResponse: 'ملاحظة الورشة',
      pendingConfirmation: 'في انتظار التأكيد',
      downloadInvoice: 'تحميل الفاتورة PDF',
      cardDeactivated: 'تم إلغاء تفعيل بطاقة هوية هذه المركبة.',
      cardInvalid: 'رمز الاستجابة السريعة غير مرتبط بأي مركبة صالحة.',
    },
    billing: {
      title: 'الفواتير والاشتراك السنوي/الشهري',
      subtitle: 'إدارة اشتراك المنصة والدفع الآمن عبر بريدي موب / البطاقة الذهبية / CIB.',
      currentPlan: 'الاشتراك الحالي',
      payWithBaridiMob: 'الدفع عبر بريدي موب / البطاقة الذهبية',
      starterPlan: 'المبتدئ (Starter)',
      proPlan: 'المحترف (Pro - موصى به)',
      enterprisePlan: 'المؤسسات (Enterprise)',
      branchesQuota: 'الفروع والورشات',
      seatsQuota: 'المستخدمين والتقنيين',
      cardStudioTier: 'استوديو تصميم البطاقات',
      renewNow: 'تجديد الاشتراك',
      trialEndsIn: 'تنتهي الفترة التجريبية في',
    },
    settings: {
      title: 'إعدادات وهوية الورشة',
      subtitle: 'تخصيص الشعار، ألوان العلامة التجارية، اللغة الافتراضية ومعلومات الاتصال.',
      garageName: 'الاسم التجاري للورشة',
      logoUrl: 'رابط الشعار (Logo URL)',
      primaryColor: 'اللون الرئيسي',
      secondaryColor: 'اللون الثانوي',
      defaultLocale: 'اللغة الافتراضية',
      currency: 'العملة',
      timezone: 'المنطقة الزمنية',
      address: 'عنوان الورشة',
      phone: 'رقم هاتف الاتصال',
      savedSuccessfully: 'تم حفظ الإعدادات وهوية الورشة بنجاح!',
    },
    login: {
      title: 'بوابة إدارة الورشة Garage Pro',
      subtitle: 'نظام إدارة صيانة السيارات وتتبع جوازات السفر الرقمية',
      username: 'اسم المستخدم أو البريد',
      password: 'كلمة المرور',
      signInButton: 'تسجيل الدخول إلى الورشة ←',
      forgotPassword: 'هل نسيت كلمة المرور؟',
      backHome: '→ العودة للرئيسية',
      proDirectory: 'الدليل الوطني للورشات ↗',
    },
  },
  en: {
    dir: 'ltr',
    common: {
      dashboard: 'Dashboard',
      appointments: 'Appointments',
      clients: 'Clients',
      vehicles: 'Vehicles',
      actions: 'Service Actions',
      cards: 'PVC Cards',
      workers: 'Staff & Technicians',
      inventory: 'Parts Inventory',
      invoices: 'Invoices & Estimates',
      auditLogs: 'Audit Logs',
      settings: 'Settings & Branding',
      billing: 'Billing & Plans',
      marketplace: 'Parts Marketplace',
      knowledgebase: 'DTC Diagnostic Base',
      messages: 'Direct Messages',
      directory: 'National Directory',
      logout: 'Sign Out',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      create: 'Create',
      search: 'Search...',
      loading: 'Loading...',
      status: 'Status',
      active: 'Active',
      inactive: 'Inactive',
      date: 'Date',
      total: 'Total',
      actions_label: 'Actions',
      sessionActive: 'Session Active',
      currency: 'DZD',
      newAction: 'New Repair Order',
      viewDetails: 'View Details',
      confirm: 'Confirm',
      filter: 'Filter',
      all: 'All',
      refresh: 'Refresh',
      export: 'Export',
      download: 'Download',
      phone: 'Phone',
      email: 'Email',
      address: 'Address',
      name: 'Name',
      notes: 'Notes',
      description: 'Description',
      price: 'Price',
      quantity: 'Quantity',
      amount: 'Amount',
      type: 'Type',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      print: 'Print',
      yes: 'Yes',
      no: 'No',
      empty: 'No data',
      noData: 'No records available',
      breadcrumbsHome: 'Dashboard',
    },
    sidebar: {
      sectionDashboard: 'Dashboard & Planning',
      sectionOperations: 'Workshop & Operations',
      sectionCards: 'PVC Cards & Loyalty',
      sectionB2B: 'Inter-Garage B2B Network',
      sectionAdmin: 'Management & Admin',
      dashboard: 'Dashboard',
      appointments: 'Appointments',
      vehicles: 'Vehicle Fleet',
      clients: 'Clients & Passports',
      actions: 'Repair Orders (RO)',
      repairTemplates: 'RO Templates & Packages',
      inventory: 'Stock & Parts',
      cardsOverview: 'PVC Cards Overview',
      cardsStudio: 'Card Design Studio',
      cardsOrder: 'Order PVC Cards',
      marketplace: 'B2B Parts Marketplace',
      knowledgebase: 'DTC Diagnostic Base',
      messages: 'Direct Messages',
      directory: 'Pro Directory',
      invoices: 'Invoices & Quotes',
      workers: 'Staff & Technicians',
      notifications: 'Notifications & Alerts',
      auditLogs: 'Audit Logs & Security',
      settings: 'Workshop Settings',
      billing: 'Subscription & Plans',
      signOut: 'Sign Out Workshop',
      connectedAs: 'Connected as',
    },
    cockpit: {
      searchPlaceholder: 'Global search, VIN, DTC...',
      systemOnline: 'SYSTEM ONLINE',
      newAction: 'New RO',
      messagesTooltip: 'Direct Inter-Garage Messaging',
    },
    dashboard: {
      title: 'Workshop Management Cockpit',
      subtitle: 'Real-time tracking of repairs, vehicle flow, and revenue',
      vehiclesInShop: 'Vehicles in Shop',
      monthlyRevenue: 'Monthly Revenue',
      activePassports: 'Active PVC Passports',
      pendingAppointments: 'Pending Appointments',
      recentJobs: 'Recent Workshop Interventions',
      recentJobsDesc: 'Log of repair orders recently created or updated.',
      quickStats: 'Key Workshop Metrics',
    },
    vehicles: {
      title: 'Vehicle Fleet & Workshop Tracking',
      subtitle: 'Centralized workshop fleet management, automated VIN decoding, and PVC badge linkage',
      addVehicle: 'Add Vehicle',
      plate: 'License Plate',
      make: 'Make',
      model: 'Model',
      year: 'Year',
      mileage: 'Mileage',
      client: 'Owner / Client',
      passportStatus: 'PVC Passport',
      vin: 'Chassis Number (VIN)',
      color: 'Color',
      fuel: 'Fuel Type',
      transmission: 'Transmission',
      engineSpec: 'Engine Spec',
      oilType: 'Preconised Oil',
      tireSize: 'Tire Dimensions',
      decodeVin: 'Decode VIN',
      vinSuccess: 'Vehicle specifications retrieved successfully',
      vinHelp: 'Enter 17 characters compliant with ISO 3779',
      activePassport: 'Active',
      unlinkedPassport: 'Unassigned',
      viewPassport: 'View Passport',
      editVehicle: 'Edit Vehicle',
      deleteVehicle: 'Delete Vehicle',
      searchPlaceholder: 'Search by plate, VIN, make, or owner...',
    },
    clients: {
      title: 'Client Directory & Vehicle Owners',
      subtitle: 'Manage client records, contact information, and linked vehicles',
      addClient: 'New Client',
      fullName: 'Full Name',
      phone: 'Phone Number',
      email: 'Email Address',
      address: 'Address / Wilaya',
      vehiclesCount: 'Vehicles',
      totalSpent: 'Total Revenue',
      lastVisit: 'Last Visit',
      createPassport: 'Create Passport',
      searchPlaceholder: 'Search by name, phone, or email...',
      noClients: 'No clients registered in your database.',
    },
    actions: {
      title: 'Repair Orders (RO) & Interventions',
      subtitle: 'Create, schedule, and complete workshop repair orders with parts and labor accounting',
      newAction: 'New Repair Order',
      orderNumber: 'RO #',
      vehicle: 'Vehicle',
      client: 'Client',
      serviceType: 'Main Service',
      dateIn: 'Date In',
      dateOut: 'Date Out',
      mileageAtService: 'Service Mileage',
      statusPending: 'Pending',
      statusInProgress: 'In Progress',
      statusCompleted: 'Completed',
      statusInvoiced: 'Invoiced',
      statusCancelled: 'Cancelled',
      totalAmount: 'Total Amount',
      partsUsed: 'Parts Used',
      laborCost: 'Labor Cost',
      internalNotes: 'Internal Workshop Notes',
      clientNotes: 'Notes Visible on Client Passport',
      printRO: 'Print RO',
      invoiceRO: 'Generate Invoice',
      searchPlaceholder: 'Search by RO #, plate, or description...',
    },
    inventory: {
      title: 'Inventory & Parts Warehouse',
      subtitle: 'Track spare parts stock levels, low inventory reorder alerts, and OEM references',
      addPart: 'Add Part',
      reference: 'Reference / OEM Code',
      name: 'Part Name',
      category: 'Category',
      oemRef: 'OEM Manufacturer Ref',
      stockQty: 'Current Stock',
      minStock: 'Alert Threshold',
      unitCost: 'Purchase Price (excl. VAT)',
      salePrice: 'Sale Price (incl. VAT)',
      supplier: 'Supplier',
      lowStockAlert: 'Low Stock Alert',
      stockMovement: 'Stock Movement',
      searchPlaceholder: 'Search by part name, reference, or category...',
    },
    invoices: {
      title: 'Invoices & Estimates',
      subtitle: 'Issue certified professional invoices with QR code authentication',
      newInvoice: 'New Invoice',
      invoiceNumber: 'Invoice #',
      client: 'Client',
      vehicle: 'Linked Vehicle',
      issueDate: 'Issue Date',
      dueDate: 'Due Date',
      totalHT: 'Net Amount',
      vatAmount: 'VAT',
      totalTTC: 'Total (incl. VAT)',
      statusDraft: 'Draft',
      statusIssued: 'Issued / Pending',
      statusPaid: 'Paid in Full',
      statusOverdue: 'Overdue',
      payInvoice: 'Record Payment',
      downloadPDF: 'Download PDF',
      searchPlaceholder: 'Search by invoice #, client, or plate...',
    },
    appointments: {
      title: 'Workshop Scheduling & Appointments',
      subtitle: 'Manage client booking requests received from PVC card scans',
      newAppointment: 'Schedule Appointment',
      client: 'Client',
      vehicle: 'Vehicle',
      serviceType: 'Service Type',
      preferredDate: 'Scheduled Date',
      timeSlot: 'Time Slot',
      statusPending: 'Pending',
      statusConfirmed: 'Confirmed',
      statusCompleted: 'Completed',
      statusCancelled: 'Cancelled',
      confirmBooking: 'Confirm Appointment',
      cancelBooking: 'Cancel Appointment',
      garageNotes: 'Workshop Response Note',
      searchPlaceholder: 'Search appointments by client or vehicle...',
    },
    cards: {
      title: 'Connected PVC Cards & Passports',
      subtitle: 'Inventory of physical NFC / QR cards, vehicle assignment, and tracking',
      cardsInventory: 'Cards Inventory',
      cardsStudio: '300 DPI Design Studio',
      cardsOrder: 'Order Cards',
      token: 'Cryptographic Token',
      status: 'Badge Status',
      assignedVehicle: 'Assigned Vehicle',
      qrCode: 'Official QR Code',
      revokeCard: 'Revoke Card',
      reassignCard: 'Reassign Card',
      printBatch: 'Print Batch',
      studioTitle: 'Official PVC Card Design Studio (CR-80)',
      studioSubtitle: 'Customize the official 300 DPI (85.6mm × 53.98mm) workshop card layout',
      frontFace: 'Front Face (Main Badge)',
      backFace: 'Back Face (QR Scan)',
      safeMargin: 'Cutting Safe Margin',
      theme: 'Visual Theme',
      exportDpi: '300 DPI Render Preview',
      orderTitle: 'Order Pre-Printed PVC Cards',
      orderSubtitle: 'Tracked express delivery across all 58 Wilayas via Yalidine Express',
      volumeTiers: 'Volume Discount Pricing',
      wilayaDelivery: 'Delivery Wilaya',
      unitPrice: 'Unit Price',
      deliveryCost: 'Yalidine Shipping Cost',
      totalToPay: 'Total to Pay',
      checkoutChargily: 'Secure Checkout via Chargily Pay (BaridiMob / EDAHABIA)',
    },
    marketplace: {
      title: 'B2B Spare Parts Marketplace',
      subtitle: 'Buy and sell new, tested used, or refurbished parts between certified workshops',
      searchPlaceholder: 'Search by OEM part ref, part name, or car model...',
      allWilayas: 'All 58 Wilayas',
      allCategories: 'All Categories',
      publishListing: 'Publish a Part',
      contactSeller: 'Contact Workshop',
      conditionNew: 'Brand New (OEM)',
      conditionUsed: 'Tested Used Part',
      conditionRefurbished: 'Refurbished with Warranty',
      noListings: 'No parts available matching these filters.',
    },
    knowledgebase: {
      title: 'Mechanical Knowledge Base & DTC Diagnostics',
      subtitle: 'Proven repair procedures, root causes, and fixes for OBD-II fault codes',
      searchPlaceholder: 'Search by symptom or fault code (e.g. engine stall, P0300, power loss...)',
      shareSolution: 'Share Technical Sheet',
      helpfulVotes: 'Helpful Votes',
      readGuide: 'Read Guide →',
      noSolutions: 'No repair guides found.',
      popularCodes: 'Common Codes:',
    },
    messages: {
      title: 'Inter-Garage Direct B2B Messaging',
      subtitle: 'Instantly exchange on spare parts, diagnostics, and stock availability',
      activeDiscussions: 'Active Discussions',
      noConversations: 'No conversations in progress. Contact a workshop via the Marketplace or Directory.',
      selectConversation: 'Select a discussion to display messages.',
      typeMessage: 'Type your message to the workshop...',
      send: 'Send',
      attachDtc: 'Attach DTC Code',
      attachPart: 'Attach Part Ref',
    },
    workers: {
      title: 'Workshop Team & Technician Management',
      subtitle: 'Manage your mechanics, auto electricians, and team leaders with their roles',
      addWorker: 'Add Technician',
      fullName: 'Full Name',
      role: 'Position / Role',
      phone: 'Phone Number',
      specialty: 'Main Specialty',
      activeJobs: 'Active Interventions',
      statusActive: 'Active',
      statusInactive: 'Inactive',
      searchPlaceholder: 'Search team members...',
    },
    portal: {
      digitalPassport: 'Vehicle Digital Passport',
      vehicleSpecs: 'Technical Specifications',
      serviceHistory: 'Certified Maintenance History',
      reminders: 'Maintenance Reminders',
      bookAppointment: 'Book Workshop Appointment',
      mileage: 'Current Mileage',
      fuel: 'Fuel Type',
      transmission: 'Transmission',
      engine: 'Engine Spec',
      oil: 'Recommended Motor Oil',
      tires: 'Tire Dimensions',
      nextService: 'Next Oil Service',
      nextInspection: 'Technical Inspection',
      noHistory: 'No service interventions recorded for this vehicle yet.',
      selectDate: 'Preferred Date',
      timeSlot: 'Time Slot',
      morning: 'Morning (08:00 - 12:00)',
      afternoon: 'Afternoon (13:00 - 17:00)',
      submitBooking: 'Confirm Appointment Request',
      bookingSuccess: 'Your appointment request has been submitted to the workshop.',
      reminderTitle: 'Set Maintenance Reminder',
      setReminder: 'Save Reminder',
      garageResponse: 'Workshop Note',
      pendingConfirmation: 'Pending Confirmation',
      downloadInvoice: 'Download Invoice PDF',
      cardDeactivated: 'This vehicle identity card has been deactivated.',
      cardInvalid: 'The scanned QR code is not associated with any vehicle.',
    },
    billing: {
      title: 'Workshop Billing & Subscription',
      subtitle: 'Manage your SaaS plan and payments via BaridiMob / EDAHABIA / CIB.',
      currentPlan: 'Current Plan',
      payWithBaridiMob: 'Pay with BaridiMob / EDAHABIA',
      starterPlan: 'Starter Workshop',
      proPlan: 'Pro Performance (Recommended)',
      enterprisePlan: 'Enterprise Multi-Sites',
      branchesQuota: 'Branches & Workshops',
      seatsQuota: 'Users & Technicians',
      cardStudioTier: 'PVC Card Studio',
      renewNow: 'Renew Subscription',
      trialEndsIn: 'Trial period expires on',
    },
    settings: {
      title: 'Workshop Settings & Branding',
      subtitle: 'Customize your logo, brand colors, default locale, and contact details.',
      garageName: 'Workshop Business Name',
      logoUrl: 'Workshop Logo URL',
      primaryColor: 'Primary Brand Color',
      secondaryColor: 'Secondary Accent Color',
      defaultLocale: 'Default Language',
      currency: 'Primary Currency',
      timezone: 'Timezone',
      address: 'Workshop Address',
      phone: 'Contact Phone Number',
      savedSuccessfully: 'Settings and brand customizer saved successfully!',
    },
    login: {
      title: 'Garage Pro Workshop Back-Office',
      subtitle: 'Automotive workshop management and vehicle traceability portal',
      username: 'Username or Email',
      password: 'Password',
      signInButton: 'Sign In to Workshop →',
      forgotPassword: 'Forgot password?',
      backHome: '← Back to Home',
      proDirectory: 'Public Directory ↗',
    },
  },
};
