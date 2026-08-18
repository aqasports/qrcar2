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
      starterPlan: 'Starter',
      proPlan: 'Pro (Recommandé)',
      enterprisePlan: 'Enterprise',
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
      starterPlan: 'Starter',
      proPlan: 'Pro (Recommended)',
      enterprisePlan: 'Enterprise',
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
  },
};
