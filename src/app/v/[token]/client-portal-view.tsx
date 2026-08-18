'use client';

import React, { useState } from 'react';
import FlippablePvcCard from '@/components/FlippablePvcCard';

export interface VehicleData {
  id: string;
  plate_number: string;
  make: string;
  model: string;
  year: number;
  color: string | null;
  current_mileage: number;
  client_name: string;
  fuel_type?: string;
  transmission?: string;
  engine_spec?: string;
  oil_type?: string;
  tire_size?: string;
  next_service_mileage?: number | null;
  next_service_date?: string | null;
  next_inspection_date?: string | null;
}

export interface PublicAction {
  id: string;
  type: string;
  description: string;
  client_visible_notes: string | null;
  mileage_at_service: number;
  date_in: string;
  date_out: string | null;
  invoice_id: string | null;
  parts_used?: Array<{ name: string; quantity: number }>;
}

export interface AppointmentData {
  id: string;
  service_type: string;
  preferred_date: string;
  preferred_time_slot: string;
  current_mileage: number | null;
  notes: string | null;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  garage_response: string | null;
  created_at: string;
}

export interface ReminderData {
  id: string;
  type: string;
  title: string;
  due_date: string | null;
  due_mileage: number | null;
  status: string;
}

export interface OrganizationBranding {
  name: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  locale: 'fr' | 'ar' | 'en';
  currency: string;
}

interface Props {
  token: string;
  vehicle: VehicleData;
  branding?: OrganizationBranding;
  actions: PublicAction[];
  appointments: AppointmentData[];
  reminders: ReminderData[];
  qrDataUrl: string;
}

// Multilingual translations (FR, AR, EN)
const TRANSLATIONS = {
  fr: {
    garageName: 'Garage Pro',
    digitalServiceBook: 'Carnet d\'Entretien Numérique',
    verifiedCard: 'Carte Authentifiée',
    tapToFlip: 'Cliquer pour retourner la carte (QR Code officiel)',
    owner: 'Propriétaire',
    odometer: 'Kilométrage',
    year: 'Année',
    fuel: 'Carburant',
    transmission: 'Transmission',
    engine: 'Motorisation',
    oil: 'Huile recommandée',
    tires: 'Pneumatiques',
    tabs: {
      history: 'Carnet d\'Entretien',
      booking: 'Prendre RDV',
      guide: 'Guide Véhicule',
      reminders: 'Rappels & Alertes',
    },
    history: {
      title: 'Historique des Interventions',
      subtitle: 'Toutes les réparations et entretiens certifiés par le garage',
      all: 'Toutes',
      maintenance: 'Entretiens',
      repair: 'Réparations',
      inspection: 'Contrôles',
      empty: 'Aucune intervention enregistrée pour ce véhicule.',
      downloadInvoice: 'Télécharger la Facture PDF',
      partsReplaced: 'Pièces & Fournitures utilisées :',
      notes: 'Notes de l\'atelier :',
      atMileage: 'à',
    },
    booking: {
      title: 'Prendre un Rendez-Vous Garage',
      subtitle: 'Réservez votre créneau d\'intervention directement auprès de l\'atelier',
      selectService: 'Type d\'intervention souhaitée',
      serviceVidange: 'Vidange & Entretien périodique',
      serviceFreins: 'Système de Freinage (Plaquettes / Disques)',
      serviceCourroie: 'Courroie de Distribution / Accessoires',
      serviceClim: 'Climatisation & Recharge gaz',
      serviceDiag: 'Diagnostic Électronique / Voyant Moteur',
      servicePneus: 'Pneumatiques & Géométrie',
      serviceSuspension: 'Suspension & Amortisseurs',
      serviceCT: 'Pré-Contrôle Technique',
      serviceOther: 'Autre réparation mécanique',
      date: 'Date souhaitée',
      timeSlot: 'Créneau horaire',
      morning: 'Matin (08:30 - 12:00)',
      afternoon: 'Après-midi (13:30 - 17:30)',
      mileage: 'Kilométrage actuel au compteur (km)',
      notes: 'Description du problème ou précisions',
      phone: 'Numéro de téléphone pour confirmation',
      submitBtn: 'Confirmer la demande de rendez-vous',
      submitting: 'Transmission en cours...',
      successMsg: 'Votre demande de rendez-vous a bien été transmise à l\'atelier. Vous recevrez une confirmation sous peu.',
      myAppointments: 'Rendez-vous enregistrés pour ce véhicule',
      pending: 'En attente de confirmation',
      confirmed: 'Confirmé par l\'atelier',
      completed: 'Intervention effectuée',
      cancelled: 'Annulé',
    },
    guide: {
      title: 'Spécifications & Guide Véhicule',
      subtitle: 'Caractéristiques constructeur et calendrier d\'entretien préventif',
      specsHeader: 'Fiche Technique Véhicule',
      intervalsHeader: 'Échéances d\'Entretien Préconisées',
      warningLightsHeader: 'Guide des Témoins du Tableau de Bord',
      warningSearch: 'Rechercher un témoin lumineux ou une anomalie...',
      warningFilterAll: 'Tous les témoins',
      warningFilterRed: 'Rouge (Danger / Arrêt)',
      warningFilterAmber: 'Orange (Avertissement)',
      warningFilterGreen: 'Vert / Bleu (Information)',
      oilChangeInterval: 'Vidange Moteur + Filtre à Huile',
      oilChangeDesc: 'Tous les 10 000 à 15 000 km ou 1 an',
      airFilterInterval: 'Filtres à Air & Habitacle',
      airFilterDesc: 'Tous les 20 000 km pour préserver le moteur et la ventilation',
      fuelFilterInterval: 'Filtre à Carburant (Diesel / Essence)',
      fuelFilterDesc: 'Tous les 30 000 à 45 000 km pour protéger le système d\'injection',
      brakeFluidInterval: 'Liquide de Frein',
      brakeFluidDesc: 'Tous les 2 ans (prévention de l\'absorption d\'humidité)',
      timingBeltInterval: 'Kit de Distribution & Pompe à Eau',
      timingBeltDesc: 'Tous les 80 000 à 120 000 km ou 5 à 6 ans',
      ctInterval: 'Contrôle Technique Périodique',
      ctDesc: 'Tous les 2 ans pour les véhicules de plus de 4 ans',
    },
    reminders: {
      title: 'Rappels & Échéances d\'Entretien',
      subtitle: 'Suivi rigoureux des échéances pour la longévité de votre véhicule',
      nextOilChange: 'Prochaine Vidange Moteur',
      nextCT: 'Prochain Contrôle Technique',
      addToCalendar: 'Exporter vers Calendrier (.ics)',
      whatsappRemind: 'Contacter l\'Atelier via WhatsApp',
      calendarHelp: 'Fichier standard compatible Apple Calendar, Google Calendar et Outlook',
      statusOk: 'À jour',
      statusDueSoon: 'Échéance proche',
      statusOverdue: 'Entretien requis',
      kmRemaining: 'km restants',
      daysRemaining: 'jours restants',
      noDateSet: 'Non planifié — contactez l\'atelier',
    }
  },
  ar: {
    garageName: 'جراج برو',
    digitalServiceBook: 'دفتر الصيانة الرقمي المعتمد',
    verifiedCard: 'بطاقة موثقة',
    tapToFlip: 'انقر لعرض رمز الاستجابة السريعة (QR Code)',
    owner: 'المالك',
    odometer: 'العداد',
    year: 'السنة',
    fuel: 'الوقود',
    transmission: 'ناقل الحركة',
    engine: 'المحرك',
    oil: 'الزيت الموصى به',
    tires: 'مقاس العجلات',
    tabs: {
      history: 'سجل الصيانة',
      booking: 'حجز موعد',
      guide: 'دليل السيارة',
      reminders: 'التنبيهات والمواعيد',
    },
    history: {
      title: 'سجل الصيانة والإصلاحات',
      subtitle: 'جميع العمليات المسجلة والموثقة من قبل الورشة',
      all: 'الكل',
      maintenance: 'صيانة دورية',
      repair: 'إصلاحات ميكانيكية',
      inspection: 'فحص وتشخيص',
      empty: 'لا توجد عمليات صيانة مسجلة لهذا المركبة حالياً.',
      downloadInvoice: 'تحميل الفاتورة المعتمدة (PDF)',
      partsReplaced: 'القطع والمستلزمات المستخدمة:',
      notes: 'ملاحظات الورشة:',
      atMileage: 'عند عداد',
    },
    booking: {
      title: 'حجز موعد صيانة',
      subtitle: 'احجز موعد الصيانة مباشرة مع ورشة العمل',
      selectService: 'نوع الخدمة المطلوبة',
      serviceVidange: 'تغيير الزيت والفلاتر (صيانة دورية)',
      serviceFreins: 'الفرامل (تيل ودسكات)',
      serviceCourroie: 'سير الكاتينة / المجموعات',
      serviceClim: 'التكييف وشحن الفريون',
      serviceDiag: 'فحص كمبيوتر وكشف الأعطال',
      servicePneus: 'الإطارات وضبط الزوايا',
      serviceSuspension: 'المساعدين والعفشة',
      serviceCT: 'الفحص الفني الدوري',
      serviceOther: 'إصلاح ميكانيكي آخر',
      date: 'التاريخ المطلوب',
      timeSlot: 'الفترة المفضلة',
      morning: 'صباحاً (08:30 - 12:00)',
      afternoon: 'مساءً (13:30 - 17:30)',
      mileage: 'العداد الحالي بالكيلومتر',
      notes: 'وصف المشكلة أو تفاصيل إضافية',
      phone: 'رقم الهاتف للتأكيد',
      submitBtn: 'تأكيد طلب الموعد',
      submitting: 'جاري الإرسال...',
      successMsg: 'تم تسجيل طلب الموعد بنجاح، سيتم تأكيده من طرف الورشة.',
      myAppointments: 'المواعيد المسجلة لهذه المركبة',
      pending: 'قيد المراجعة',
      confirmed: 'تم التأكيد',
      completed: 'تم الإنجاز',
      cancelled: 'ملغي',
    },
    guide: {
      title: 'دليل ومواصفات المركبة',
      subtitle: 'المواصفات الفنية وجداول الصيانة الموصى بها',
      specsHeader: 'المواصفات الفنية',
      intervalsHeader: 'مواعيد الصيانة الدورية الموصى بها',
      warningLightsHeader: 'دليل إشارات ولمبات لوحة القيادة',
      warningSearch: 'ابحث عن إشارة أو لمبة تحذير...',
      warningFilterAll: 'الكل',
      warningFilterRed: 'أحمر (خطر / توقف فوري)',
      warningFilterAmber: 'برتقالي (تحذير / فحص قريب)',
      warningFilterGreen: 'أخضر / أزرق (إرشاد)',
      oilChangeInterval: 'تغيير زيت المحرك والفلتر',
      oilChangeDesc: 'كل 10,000 إلى 15,000 كم أو سنة واحدة',
      airFilterInterval: 'فلتر الهواء وفلتر المكيف',
      airFilterDesc: 'كل 20,000 كم لحماية المحرك ونقاء الهواء',
      fuelFilterInterval: 'فلتر الوقود (الديزل / البنزين)',
      fuelFilterDesc: 'كل 30,000 إلى 45,000 كم لحماية الرشاشات',
      brakeFluidInterval: 'زيت الفرامل',
      brakeFluidDesc: 'كل سنتين لضمان كفاءة التوقف',
      timingBeltInterval: 'سير الكاتينة ومضخة المياه',
      timingBeltDesc: 'كل 80,000 إلى 120,000 كم أو 5 سنوات',
      ctInterval: 'الفحص الفني الدوري',
      ctDesc: 'كل سنتين للسيارات فوق 4 سنوات',
    },
    reminders: {
      title: 'التنبيهات والمواعيد القادمة',
      subtitle: 'متابعة دقيقة لجداول الصيانة لضمان كفاءة وسلامة المركبة',
      nextOilChange: 'موعد تغيير الزيت القادم',
      nextCT: 'موعد الفحص الفني الدوري',
      addToCalendar: 'إضافة إلى التقويم (.ics)',
      whatsappRemind: 'تواصل عبر واتساب',
      calendarHelp: 'متوافق مع تقويم آبل، جوجل، وأوتلوك',
      statusOk: 'محدث',
      statusDueSoon: 'يقترب الموعد',
      statusOverdue: 'صيانة مطلوبة',
      kmRemaining: 'كم متبقي',
      daysRemaining: 'يوم متبقي',
      noDateSet: 'غير محدد — يرجى مراجعة الورشة',
    }
  },
  en: {
    garageName: 'Garage Pro',
    digitalServiceBook: 'Digital Service Record Book',
    verifiedCard: 'Verified Digital Card',
    tapToFlip: 'Click to flip card (Official QR verification)',
    owner: 'Owner',
    odometer: 'Odometer',
    year: 'Year',
    fuel: 'Fuel',
    transmission: 'Transmission',
    engine: 'Engine',
    oil: 'Recommended Oil',
    tires: 'Tires',
    tabs: {
      history: 'Service Book',
      booking: 'Book Service',
      guide: 'Vehicle Guide',
      reminders: 'Reminders',
    },
    history: {
      title: 'Service & Repair History',
      subtitle: 'All mechanical actions certified and recorded by the workshop',
      all: 'All',
      maintenance: 'Maintenance',
      repair: 'Repairs',
      inspection: 'Inspections',
      empty: 'No service records logged yet for this vehicle.',
      downloadInvoice: 'Download Certified Invoice (PDF)',
      partsReplaced: 'Parts & Fluids Replaced:',
      notes: 'Workshop Notes:',
      atMileage: 'at',
    },
    booking: {
      title: 'Book Workshop Appointment',
      subtitle: 'Schedule your repair or periodic maintenance directly with the garage',
      selectService: 'Intervention type',
      serviceVidange: 'Oil Change & Periodic Service',
      serviceFreins: 'Braking System (Pads & Discs)',
      serviceCourroie: 'Timing Belt & Water Pump',
      serviceClim: 'A/C Service & Gas Recharge',
      serviceDiag: 'Electronic Diagnostic / Warning Light',
      servicePneus: 'Tires & Wheel Alignment',
      serviceSuspension: 'Suspension & Shock Absorbers',
      serviceCT: 'Pre-Technical Inspection',
      serviceOther: 'Other Mechanical Work',
      date: 'Preferred Date',
      timeSlot: 'Time Slot',
      morning: 'Morning (08:30 - 12:00)',
      afternoon: 'Afternoon (13:30 - 17:30)',
      mileage: 'Current Odometer (km)',
      notes: 'Describe the issue or service requests',
      phone: 'Contact phone number for confirmation',
      submitBtn: 'Confirm Appointment Request',
      submitting: 'Submitting request...',
      successMsg: 'Your appointment request was submitted to the garage. You will receive confirmation shortly.',
      myAppointments: 'Scheduled Appointments for this Vehicle',
      pending: 'Pending Confirmation',
      confirmed: 'Confirmed by Garage',
      completed: 'Completed',
      cancelled: 'Cancelled',
    },
    guide: {
      title: 'Vehicle Specs & Maintenance Guide',
      subtitle: 'Manufacturer technical specifications and preventative maintenance intervals',
      specsHeader: 'Technical Specifications',
      intervalsHeader: 'Recommended Maintenance Schedule',
      warningLightsHeader: 'Dashboard Warning Lights Glossary',
      warningSearch: 'Search a warning light or symptom...',
      warningFilterAll: 'All Indicators',
      warningFilterRed: 'Red (Critical / Stop)',
      warningFilterAmber: 'Amber (Warning / Check Soon)',
      warningFilterGreen: 'Green / Blue (Information)',
      oilChangeInterval: 'Engine Oil & Filter Change',
      oilChangeDesc: 'Every 10,000 to 15,000 km or 1 year',
      airFilterInterval: 'Air & Cabin Filters',
      airFilterDesc: 'Every 20,000 km to protect engine and cabin air quality',
      fuelFilterInterval: 'Fuel Filter (Diesel / Petrol)',
      fuelFilterDesc: 'Every 30,000 to 45,000 km to protect injectors',
      brakeFluidInterval: 'Brake Fluid Replacement',
      brakeFluidDesc: 'Every 2 years (moisture absorption prevention)',
      timingBeltInterval: 'Timing Belt Kit & Water Pump',
      timingBeltDesc: 'Every 80,000 to 120,000 km or 5-6 years',
      ctInterval: 'Periodic Technical Inspection',
      ctDesc: 'Every 2 years for vehicles older than 4 years',
    },
    reminders: {
      title: 'Maintenance Reminders & Milestones',
      subtitle: 'Precision tracking of critical maintenance cycles for maximum vehicle lifespan',
      nextOilChange: 'Next Engine Oil Service',
      nextCT: 'Next Technical Inspection',
      addToCalendar: 'Export to Calendar (.ics)',
      whatsappRemind: 'Contact Workshop via WhatsApp',
      calendarHelp: 'Standard file format compatible with Apple Calendar, Google Calendar and Outlook',
      statusOk: 'Up to date',
      statusDueSoon: 'Due Soon',
      statusOverdue: 'Service Required',
      kmRemaining: 'km remaining',
      daysRemaining: 'days remaining',
      noDateSet: 'Not scheduled — contact workshop',
    }
  }
};

// Warning Lights Vector Definitions
const WARNING_LIGHTS = [
  {
    id: 'oil_pressure',
    name: "Pression d'Huile Moteur / Oil Pressure",
    color: 'red',
    code: 'OIL-PRES',
    severity: 'danger',
    description: "Chute critique de la pression d'huile moteur. Risque de casse moteur irréversible.",
    action: "Arrêt immédiat du véhicule, couper le contact, vérifier le niveau d'huile et contacter l'atelier.",
  },
  {
    id: 'engine_temp',
    name: 'Surchauffe Liquide de Refroidissement / Engine Temp',
    color: 'red',
    code: 'COOLANT-TEMP',
    severity: 'danger',
    description: 'Température moteur anormalement élevée (surchauffe ou fuite de liquide de refroidissement).',
    action: 'Arrêt immédiat. Ne pas ouvrir le vase d\'expansion à chaud sous risque de brûlure grave.',
  },
  {
    id: 'battery_charge',
    name: 'Circuit de Charge Batterie / Alternateur',
    color: 'red',
    code: 'ALT-CHARGE',
    severity: 'danger',
    description: "L'alternateur ne recharge plus la batterie ou rupture de la courroie d'accessoire.",
    action: 'Rejoindre immédiatement le garage le plus proche avant coupure des calculateurs électroniques.',
  },
  {
    id: 'brake_system',
    name: 'Système de Freinage / Frein de Stationnement',
    color: 'red',
    code: 'BRK-WARN',
    severity: 'danger',
    description: 'Niveau de liquide de frein sous le seuil critique ou anomalie de pression du circuit.',
    action: 'Vérifier le desserrage du frein à main. Si le témoin persiste, immobiliser le véhicule.',
  },
  {
    id: 'check_engine',
    name: 'Témoin Moteur / Check Engine (MIL)',
    color: 'amber',
    code: 'MIL-ENG',
    severity: 'warning',
    description: 'Anomalie du système d\'injection, allumage ou système antipollution (FAP, vanne EGR, sonde lambda).',
    action: 'Faire réaliser un diagnostic électronique avec valise en atelier dès que possible.',
  },
  {
    id: 'tire_pressure',
    name: 'Pression des Pneus / TPMS',
    color: 'amber',
    code: 'TPMS-WARN',
    severity: 'warning',
    description: 'Sous-gonflage détecté sur un ou plusieurs pneumatiques.',
    action: 'Vérifier la pression à froid des 4 pneumatiques en station et réinitialiser le capteur.',
  },
  {
    id: 'brake_pads',
    name: 'Usure des Plaquettes de Frein',
    color: 'amber',
    code: 'PAD-WEAR',
    severity: 'warning',
    description: 'Épaisseur de garniture des plaquettes de frein avant ou arrière en fin de vie.',
    action: 'Prendre rendez-vous rapidement pour remplacement des plaquettes avant usure des disques.',
  },
  {
    id: 'glow_plugs',
    name: 'Préchauffage Diesel / Gestion Moteur',
    color: 'amber',
    code: 'GLOW-PLUG',
    severity: 'warning',
    description: 'Bougies de préchauffage ou dysfonctionnement de gestion électronique diesel.',
    action: 'Contrôler en atelier si le voyant clignote en roulant.',
  },
  {
    id: 'abs_esp',
    name: 'Système ABS / ESP',
    color: 'amber',
    code: 'ABS-ESP',
    severity: 'warning',
    description: 'Assistance au freinage antiblocage ou contrôle de stabilité trajectoire désactivé.',
    action: 'Le freinage hydraulique classique reste opérationnel. Prévoir contrôle des capteurs de roue.',
  }
];

export function ClientPortalView({
  token,
  vehicle,
  branding,
  actions,
  appointments: initialAppointments,
  reminders,
  qrDataUrl,
}: Props) {
  const [lang, setLang] = useState<'fr' | 'ar' | 'en'>(branding?.locale || 'fr');
  const [activeTab, setActiveTab] = useState<'history' | 'booking' | 'guide' | 'reminders'>('history');
  const [isFlipped, setIsFlipped] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'maintenance' | 'repair' | 'inspection'>('all');
  
  // Warning lights state
  const [warningSearch, setWarningSearch] = useState('');
  const [warningColorFilter, setWarningColorFilter] = useState<'all' | 'red' | 'amber'>('all');

  // Booking Form State
  const [serviceType, setServiceType] = useState('Vidange & Entretien périodique');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTimeSlot, setPreferredTimeSlot] = useState('morning');
  const [mileageInput, setMileageInput] = useState(vehicle.current_mileage?.toString() || '');
  const [notesInput, setNotesInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [appointmentsList, setAppointmentsList] = useState<AppointmentData[]>(initialAppointments || []);

  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'ar';

  // Filter actions
  const filteredActions = actions.filter((act) => {
    if (historyFilter === 'all') return true;
    if (historyFilter === 'maintenance') return act.type === 'maintenance';
    if (historyFilter === 'repair') return act.type === 'repair';
    if (historyFilter === 'inspection') return act.type === 'inspection';
    return true;
  });

  // Calculate oil change countdown
  const nextServiceKm = vehicle.next_service_mileage || (vehicle.current_mileage ? vehicle.current_mileage + 10000 : null);
  const kmToNextService = nextServiceKm && vehicle.current_mileage ? nextServiceKm - vehicle.current_mileage : null;
  const isOilOverdue = kmToNextService !== null && kmToNextService <= 0;
  const isOilDueSoon = kmToNextService !== null && kmToNextService > 0 && kmToNextService <= 1500;

  // Handle appointment submission
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingBooking(true);
    setBookingError('');
    setBookingSuccess(false);

    try {
      const res = await fetch('/api/public/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          service_type: serviceType,
          preferred_date: preferredDate,
          preferred_time_slot: preferredTimeSlot,
          current_mileage: mileageInput ? parseInt(mileageInput, 10) : undefined,
          notes: notesInput,
          client_phone: phoneInput,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setBookingError(data.error || "Erreur lors de l'enregistrement de votre demande.");
      } else {
        setBookingSuccess(true);
        if (data.appointment) {
          setAppointmentsList([data.appointment, ...appointmentsList]);
        }
        setNotesInput('');
      }
    } catch (err) {
      setBookingError('Erreur de communication avec le serveur.');
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  // Filter warning lights
  const filteredWarningLights = WARNING_LIGHTS.filter((w) => {
    const matchesSearch = w.name.toLowerCase().includes(warningSearch.toLowerCase()) ||
                          w.description.toLowerCase().includes(warningSearch.toLowerCase());
    const matchesColor = warningColorFilter === 'all' || w.color === warningColorFilter;
    return matchesSearch && matchesColor;
  });

  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-blue-600 selection:text-white"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Top Ambient Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-72 bg-gradient-to-b from-blue-600/10 via-indigo-600/5 to-transparent pointer-events-none blur-3xl -z-10" />

      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-slate-950/85 border-b border-slate-900/80 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white shadow-lg shadow-blue-500/20 text-xs">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-100 text-sm tracking-tight">{t.garageName}</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {t.verifiedCard}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">{t.digitalServiceBook}</p>
            </div>
          </div>

          {/* Language Switcher */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            {(['fr', 'ar', 'en'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-2.5 py-1 rounded text-xs font-bold transition ${
                  lang === l
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-6 pb-24 space-y-6">
        {/* 3D Interactive Flip Digital PVC Card */}
        <div className="flex flex-col items-center select-none">
          <FlippablePvcCard
            token={token}
            serialLabel={vehicle.plate_number}
            status="active"
            vehiclePlate={vehicle.plate_number}
            vehicleMakeModel={`${vehicle.make} ${vehicle.model} (${vehicle.year})`}
            size="lg"
            showControls={true}
          />
        </div>

        {/* 4 Main Navigation Tabs */}
        <div className="grid grid-cols-4 gap-1.5 bg-slate-900/90 border border-slate-800 p-1.5 rounded-2xl backdrop-blur-xl shadow-xl">
          {[
            {
              id: 'history',
              label: t.tabs.history,
              icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              ),
            },
            {
              id: 'booking',
              label: t.tabs.booking,
              icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              ),
            },
            {
              id: 'guide',
              label: t.tabs.guide,
              icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
            },
            {
              id: 'reminders',
              label: t.tabs.reminders,
              icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              ),
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-xl text-center transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 font-medium'
              }`}
            >
              <span className="mb-1">{tab.icon}</span>
              <span className="text-[11px] sm:text-xs leading-tight line-clamp-1">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* TAB 1: DIGITAL SERVICE RECORD BOOK */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              {(['all', 'maintenance', 'repair', 'inspection'] as const).map((filterKey) => (
                <button
                  key={filterKey}
                  onClick={() => setHistoryFilter(filterKey)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition shrink-0 ${
                    historyFilter === filterKey
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t.history[filterKey]}
                </button>
              ))}
            </div>

            {/* Timeline Cards */}
            {filteredActions.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center space-y-2">
                <svg className="w-8 h-8 text-slate-600 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                <p className="text-sm font-semibold text-slate-300">{t.history.empty}</p>
                <p className="text-xs text-slate-500">Les interventions futures enregistrées par l&apos;atelier s&apos;afficheront ici.</p>
              </div>
            ) : (
              <div className="space-y-4 relative before:absolute before:top-3 before:bottom-3 before:left-[15px] rtl:before:right-[15px] rtl:before:left-auto before:w-[2px] before:bg-slate-800">
                {filteredActions.map((act) => (
                  <div key={act.id} className="relative pl-8 rtl:pr-8 rtl:pl-0 group">
                    {/* Node Dot */}
                    <span className="absolute left-[9px] rtl:right-[9px] rtl:left-auto top-4 h-3.5 w-3.5 rounded-full bg-blue-600 border-2 border-slate-950" />

                    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl transition space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                        <div>
                          <span className="text-xs text-slate-500 font-medium block">
                            {new Date(act.date_in).toLocaleDateString(lang === 'ar' ? 'ar-DZ' : lang === 'fr' ? 'fr-FR' : 'en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </span>
                          <h3 className="text-base font-bold text-slate-100 capitalize mt-0.5">
                            {act.type === 'maintenance' ? 'Entretien Périodique' :
                             act.type === 'repair' ? 'Réparation Mécanique' :
                             act.type === 'inspection' ? 'Contrôle & Diagnostic' : act.type}
                          </h3>
                        </div>

                        <span className="bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-lg text-xs font-mono text-blue-400 font-bold">
                          {act.mileage_at_service.toLocaleString()} km
                        </span>
                      </div>

                      <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-normal">
                        {act.description}
                      </p>

                      {/* Client Visible Notes */}
                      {act.client_visible_notes && (
                        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-850 text-xs text-slate-400 space-y-1">
                          <span className="font-bold text-slate-300 block">{t.history.notes}</span>
                          <p>{act.client_visible_notes}</p>
                        </div>
                      )}

                      {/* Download Invoice PDF Button */}
                      {act.invoice_id && (
                        <div className="pt-2 flex justify-end">
                          <a
                            href={`/api/invoices/${act.invoice_id}/download?token=${token}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/20 hover:border-transparent text-xs font-bold transition shadow-sm"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            <span>{t.history.downloadInvoice}</span>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: BOOK A RENDEZ-VOUS (RDV GARAGE) */}
        {activeTab === 'booking' && (
          <div className="space-y-6">
            {/* Booking Form Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
              <div>
                <h2 className="text-lg font-bold text-slate-100">{t.booking.title}</h2>
                <p className="text-xs text-slate-400 mt-0.5">{t.booking.subtitle}</p>
              </div>

              {bookingSuccess && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-medium leading-relaxed flex items-center gap-2.5">
                  <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{t.booking.successMsg}</span>
                </div>
              )}

              {bookingError && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-medium flex items-center gap-2.5">
                  <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>{bookingError}</span>
                </div>
              )}

              <form onSubmit={handleBookingSubmit} className="space-y-4">
                {/* Service Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    {t.booking.selectService} *
                  </label>
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-3 text-slate-200 text-sm outline-none transition"
                    required
                  >
                    <option value="Vidange & Entretien périodique">{t.booking.serviceVidange}</option>
                    <option value="Système de Freinage">{t.booking.serviceFreins}</option>
                    <option value="Courroie de Distribution">{t.booking.serviceCourroie}</option>
                    <option value="Climatisation & Recharge gaz">{t.booking.serviceClim}</option>
                    <option value="Diagnostic Électronique / Voyant">{t.booking.serviceDiag}</option>
                    <option value="Pneumatiques & Géométrie">{t.booking.servicePneus}</option>
                    <option value="Suspension & Amortisseurs">{t.booking.serviceSuspension}</option>
                    <option value="Pré-Contrôle Technique">{t.booking.serviceCT}</option>
                    <option value="Autre">{t.booking.serviceOther}</option>
                  </select>
                </div>

                {/* Date and Time Slot */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      {t.booking.date} *
                    </label>
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={preferredDate}
                      onChange={(e) => setPreferredDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-slate-200 text-sm outline-none transition"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      {t.booking.timeSlot} *
                    </label>
                    <select
                      value={preferredTimeSlot}
                      onChange={(e) => setPreferredTimeSlot(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-slate-200 text-sm outline-none transition"
                    >
                      <option value="morning">{t.booking.morning}</option>
                      <option value="afternoon">{t.booking.afternoon}</option>
                    </select>
                  </div>
                </div>

                {/* Mileage & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      {t.booking.mileage}
                    </label>
                    <input
                      type="number"
                      placeholder="ex. 120000"
                      value={mileageInput}
                      onChange={(e) => setMileageInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-slate-200 text-sm outline-none transition font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      {t.booking.phone}
                    </label>
                    <input
                      type="tel"
                      placeholder="ex. 0550 12 34 56"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-slate-200 text-sm outline-none transition font-mono"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    {t.booking.notes}
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Précisez un symptôme particulier, bruit anormal ou vos disponibilités..."
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-slate-200 text-sm outline-none transition resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingBooking}
                  className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{isSubmittingBooking ? t.booking.submitting : t.booking.submitBtn}</span>
                </button>
              </form>
            </div>

            {/* List of Existing Bookings */}
            {appointmentsList.length > 0 && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <h3 className="text-base font-bold text-slate-100">{t.booking.myAppointments}</h3>
                <div className="space-y-3">
                  {appointmentsList.map((app) => (
                    <div key={app.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-xs font-bold text-blue-400 block">{app.service_type}</span>
                          <span className="text-xs text-slate-400 block mt-0.5">
                            {new Date(app.preferred_date).toLocaleDateString(lang === 'ar' ? 'ar-DZ' : lang === 'fr' ? 'fr-FR' : 'en-US')} &bull; {app.preferred_time_slot === 'morning' ? 'Matin' : 'Après-midi'}
                          </span>
                        </div>
                        <span className={`px-2.5 py-1 rounded text-[10px] font-bold border ${
                          app.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                          app.status === 'completed' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                          app.status === 'cancelled' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                          'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}>
                          {t.booking[app.status]}
                        </span>
                      </div>
                      {app.garage_response && (
                        <p className="text-xs text-slate-300 bg-slate-900/80 p-2.5 rounded-lg border border-slate-850">
                          <span className="font-bold text-blue-400">Message Atelier :</span> {app.garage_response}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: VEHICLE SPECS & DASHBOARD WARNING LIGHTS */}
        {activeTab === 'guide' && (
          <div className="space-y-6">
            {/* Technical Specs Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span>{t.guide.specsHeader}</span>
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-850">
                  <span className="text-slate-500 font-bold block">{t.engine}</span>
                  <span className="text-slate-200 font-semibold block mt-0.5">{vehicle.engine_spec || 'Standard'}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-850">
                  <span className="text-slate-500 font-bold block">{t.fuel}</span>
                  <span className="text-slate-200 font-semibold block mt-0.5">{vehicle.fuel_type || 'Diesel'}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-850">
                  <span className="text-slate-500 font-bold block">{t.transmission}</span>
                  <span className="text-slate-200 font-semibold block mt-0.5">{vehicle.transmission || 'Manuelle'}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-850">
                  <span className="text-slate-500 font-bold block">{t.oil}</span>
                  <span className="text-blue-400 font-semibold font-mono block mt-0.5">{vehicle.oil_type || '5W-30 ACEA C3'}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-850 col-span-2 sm:col-span-1">
                  <span className="text-slate-500 font-bold block">{t.tires}</span>
                  <span className="text-slate-200 font-semibold font-mono block mt-0.5">{vehicle.tire_size || '—'}</span>
                </div>
              </div>
            </div>

            {/* Maintenance Schedule Timeline */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{t.guide.intervalsHeader}</span>
              </h3>

              <div className="space-y-3 text-xs">
                {[
                  { title: t.guide.oilChangeInterval, desc: t.guide.oilChangeDesc, badge: '10 000 - 15 000 km' },
                  { title: t.guide.airFilterInterval, desc: t.guide.airFilterDesc, badge: '20 000 km' },
                  { title: t.guide.fuelFilterInterval, desc: t.guide.fuelFilterDesc, badge: '30 000 km' },
                  { title: t.guide.brakeFluidInterval, desc: t.guide.brakeFluidDesc, badge: '2 ans' },
                  { title: t.guide.timingBeltInterval, desc: t.guide.timingBeltDesc, badge: '80 000 - 120 000 km' },
                  { title: t.guide.ctInterval, desc: t.guide.ctDesc, badge: 'Tous les 2 ans' },
                ].map((item, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-850 flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-slate-200">{item.title}</h4>
                      <p className="text-slate-400 text-[11px] mt-0.5">{item.desc}</p>
                    </div>
                    <span className="bg-blue-600/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded text-[10px] font-bold shrink-0 font-mono">
                      {item.badge}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive Dashboard Warning Lights Glossary */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>{t.guide.warningLightsHeader}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Identification des alertes du tableau de bord et procédures de sécurité.</p>
              </div>

              {/* Search & Filters */}
              <div className="space-y-2.5">
                <input
                  type="text"
                  placeholder={t.guide.warningSearch}
                  value={warningSearch}
                  onChange={(e) => setWarningSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none"
                />

                <div className="flex items-center gap-1.5 overflow-x-auto text-[11px]">
                  {(['all', 'red', 'amber'] as const).map((col) => (
                    <button
                      key={col}
                      onClick={() => setWarningColorFilter(col)}
                      className={`px-3 py-1 rounded-lg font-bold transition shrink-0 ${
                        warningColorFilter === col
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-950 border border-slate-800 text-slate-400'
                      }`}
                    >
                      {col === 'all' ? t.guide.warningFilterAll :
                       col === 'red' ? t.guide.warningFilterRed : t.guide.warningFilterAmber}
                    </button>
                  ))}
                </div>
              </div>

              {/* Warning Cards */}
              <div className="space-y-3 pt-2">
                {filteredWarningLights.map((w) => (
                  <div
                    key={w.id}
                    className={`p-4 rounded-xl border transition ${
                      w.color === 'red'
                        ? 'bg-red-500/5 border-red-500/25'
                        : 'bg-amber-500/5 border-amber-500/25'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg border shrink-0 text-xs font-mono font-bold ${
                        w.color === 'red' ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}>
                        {w.code}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-100 text-xs sm:text-sm">{w.name}</h4>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            w.color === 'red' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                          }`}>
                            {w.color === 'red' ? 'Urgent' : 'Alerte'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{w.description}</p>
                        <p className="text-[11px] text-blue-400 font-semibold pt-1">
                          <span className="text-slate-400">Action requise :</span> {w.action}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: REMINDERS & RAPPELS D'ENTRETIEN */}
        {activeTab === 'reminders' && (
          <div className="space-y-6">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
              <div>
                <h2 className="text-lg font-bold text-slate-100">{t.reminders.title}</h2>
                <p className="text-xs text-slate-400 mt-0.5">{t.reminders.subtitle}</p>
              </div>

              {/* Maintenance Countdown Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Next Oil Change */}
                <div className={`p-5 rounded-2xl border space-y-3 transition ${
                  isOilOverdue ? 'bg-red-500/10 border-red-500/30' :
                  isOilDueSoon ? 'bg-amber-500/10 border-amber-500/30' :
                  'bg-slate-950 border-slate-800'
                }`}>
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.reminders.nextOilChange}</span>
                    <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  </div>

                  <div>
                    <span className="text-2xl font-black font-mono text-slate-100 block">
                      {kmToNextService !== null ? `${Math.abs(kmToNextService).toLocaleString()} km` : '10 000 km'}
                    </span>
                    <span className={`text-xs font-bold block mt-0.5 ${
                      isOilOverdue ? 'text-red-400' : isOilDueSoon ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {isOilOverdue ? 'Dépassement kilométrage' : isOilDueSoon ? 'Échéance très proche' : t.reminders.kmRemaining}
                    </span>
                  </div>

                  {vehicle.next_service_date && (
                    <p className="text-xs text-slate-500">
                      Date limite : {new Date(vehicle.next_service_date).toLocaleDateString()}
                    </p>
                  )}

                  <a
                    href={`/api/public/calendar/${token}?type=service`}
                    download
                    className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition shadow-sm"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{t.reminders.addToCalendar}</span>
                  </a>
                </div>

                {/* Next Technical Inspection */}
                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.reminders.nextCT}</span>
                    <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>

                  <div>
                    <span className="text-base font-bold text-slate-200 block">
                      {vehicle.next_inspection_date
                        ? new Date(vehicle.next_inspection_date).toLocaleDateString(lang === 'ar' ? 'ar-DZ' : lang === 'fr' ? 'fr-FR' : 'en-US')
                        : 'Dans 6 mois'}
                    </span>
                    <span className="text-xs text-blue-400 font-bold block mt-0.5">Contrôle Périodique Obligatoire</span>
                  </div>

                  <a
                    href={`/api/public/calendar/${token}?type=inspection`}
                    download
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{t.reminders.addToCalendar}</span>
                  </a>
                </div>
              </div>

              {/* Direct WhatsApp Contact / Rappel */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <h4 className="font-bold text-sm text-slate-100">{t.reminders.whatsappRemind}</h4>
                  <p className="text-xs text-slate-400">Demande d&apos;assistance ou précision technique directe avec les mécaniciens.</p>
                </div>

                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Bonjour, je vous contacte au sujet de mon véhicule ${vehicle.make} ${vehicle.model} (${vehicle.plate_number}).`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold shrink-0 transition flex items-center gap-1.5"
                >
                  <span>Ouvrir WhatsApp</span>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>
              </div>

              <p className="text-center text-[11px] text-slate-500">
                {t.reminders.calendarHelp}
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
