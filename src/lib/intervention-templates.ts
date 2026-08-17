export interface InterventionCheckpoint {
  id: string;
  label: string;
  category: string;
  checked?: boolean;
}

export interface InterventionTemplate {
  id: string;
  name: string;
  specialty: string;
  description_placeholder: string;
  default_type: 'maintenance' | 'repair' | 'inspection' | 'other';
  suggested_labor_cost: number;
  client_notes_template: string;
  internal_notes_template: string;
  checkpoints: InterventionCheckpoint[];
  suggested_parts: string[];
}

export const INTERVENTION_TEMPLATES: InterventionTemplate[] = [
  {
    id: 'general_mechanic',
    name: 'Mécanique Générale & Révision Complète',
    specialty: 'Garage Mécanique Générale',
    default_type: 'repair',
    suggested_labor_cost: 8000,
    description_placeholder: 'Révision mécanique générale : Contrôle circuit de distribution, pompe à eau, alternateur, démarreur, supports moteur et trains roulants.',
    client_notes_template: 'Révision générale validée. Contrôle des principaux organes de sécurité et de motricité effectué avec succès.',
    internal_notes_template: 'Tension courroie accessoire vérifiée. Absence de jeu dans les rotules et silentblocs.',
    suggested_parts: ['Kit distribution', 'Pompe à eau', 'Courroie accessoire', 'Support moteur', 'Alternateur', 'Démarreur'],
    checkpoints: [
      { id: 'dist_belt', label: 'État & tension courroie distribution / chaîne', category: 'Moteur' },
      { id: 'water_pump', label: 'Étanchéité pompe à eau & circuit refroidissement', category: 'Refroidissement' },
      { id: 'alternator', label: 'Tension de charge alternateur & batterie', category: 'Électricité' },
      { id: 'starter', label: 'Fonctionnement démarreur au premier coup', category: 'Électricité' },
      { id: 'engine_mounts', label: 'État des silentblocs & supports moteur', category: 'Châssis' },
      { id: 'fluid_leaks', label: 'Recherche de fuites huile / liquide sous caisse', category: 'Contrôle' }
    ]
  },
  {
    id: 'oil_service',
    name: 'Vidange & Entretien Rapide',
    specialty: 'Centre de Lubrification & Vidange',
    default_type: 'maintenance',
    suggested_labor_cost: 3000,
    description_placeholder: 'Vidange moteur complète avec remplacement du filtre à huile, filtre à air, filtre à carburant et filtre d\'habitacle. Contrôle des niveaux et remise à zéro du compteur de vidange.',
    client_notes_template: 'Vidange moteur effectuée selon les normes constructeur avec huile certifiée. Prochaine vidange conseillée dans 10 000 à 15 000 km.',
    internal_notes_template: 'Bouchon de carter resserré au couple prescrit. Remplacement joint cuivre systématique. RAZ indicateur de maintenance effectuée au tableau de bord.',
    suggested_parts: ['Huile moteur 5W-30 / 5W-40', 'Filtre à huile', 'Filtre à air', 'Filtre à carburant / gazole', 'Filtre d\'habitacle / pollen', 'Joint de vidange'],
    checkpoints: [
      { id: 'oil_drain', label: 'Vidange huile moteur & remplacement filtre à huile', category: 'Lubrification' },
      { id: 'air_filter', label: 'Remplacement / dépoussiérage filtre à air moteur', category: 'Admission' },
      { id: 'fuel_filter', label: 'Remplacement filtre à carburant / purge eau', category: 'Carburant' },
      { id: 'cabin_filter', label: 'Remplacement filtre d\'habitacle / climatisation', category: 'Confort' },
      { id: 'levels_check', label: 'Mise à niveau liquide de refroidissement & lave-glace', category: 'Niveaux' },
      { id: 'reset_service', label: 'Remise à zéro indicateur vidange tableau de bord', category: 'Électronique' }
    ]
  },
  {
    id: 'injection_diesel',
    name: 'Injection & Diagnostic Électronique',
    specialty: 'Atelier Dieseliste & Injection',
    default_type: 'repair',
    suggested_labor_cost: 12000,
    description_placeholder: 'Diagnostic approfondi du système d\'injection haute pression : test débit/retour injecteurs, contrôle pression rampe commune (Rail), vérification pompe HP et lecture des codes défauts (DTC).',
    client_notes_template: 'Système d\'injection contrôlé et étalonné. Pression de rampe et débits injecteurs conformes aux tolérances d\'usine.',
    internal_notes_template: 'Codes défauts effacés après intervention. Test de compression relatif et contrôle correction de débit cylindre par cylindre effectués.',
    suggested_parts: ['Injecteur haute pression', 'Joints pare-feu injecteur', 'Capteur de pression rail', 'Régulateur de pression', 'Pompe haute pression', 'Bougies de préchauffage'],
    checkpoints: [
      { id: 'obd_scan', label: 'Lecture mémoire calculateur & rapport de codes défauts', category: 'Diagnostic' },
      { id: 'rail_pressure', label: 'Contrôle pression de consigne vs mesurée rampe commune', category: 'Pression' },
      { id: 'injector_leakoff', label: 'Test de débit de retour injecteurs au ralenti et en charge', category: 'Injecteurs' },
      { id: 'glow_plugs', label: 'Test résistance électrique bougies de préchauffage', category: 'Allumage' },
      { id: 'hp_pump', label: 'Inspection visuelle et étanchéité pompe haute pression', category: 'Pompe' },
      { id: 'adaptation_reset', label: 'Apprentissage des nouveaux codes IMA/injecteurs', category: 'Électronique' }
    ]
  },
  {
    id: 'brakes_chassis',
    name: 'Freinage, Suspension & Liaisons au Sol',
    specialty: 'Atelier Spécialiste Freinage & Trains Roulants',
    default_type: 'other',
    suggested_labor_cost: 5000,
    description_placeholder: 'Remplacement disques et plaquettes de frein avant/arrière, purge complète du circuit de liquide de frein (DOT 4), contrôle de l\'épaisseur des disques et vérification des amortisseurs et rotules.',
    client_notes_template: 'Système de freinage révisé et purgé. Respecter une période de rodage de 200 km en évitant les freinages brusques.',
    internal_notes_template: 'Étriers nettoyés et colonnettes graissées. Niveau DOT 4 stabilisé au maxi. Absence de fuite au niveau des flexibles.',
    suggested_parts: ['Jeu de plaquettes de frein AV/AR', 'Paire de disques de frein', 'Liquide de frein DOT 4 / DOT 5.1', 'Flexibles de frein', 'Amortisseurs', 'Biellettes de barre stabilisatrice'],
    checkpoints: [
      { id: 'pads_wear', label: 'Contrôle épaisseur garniture plaquettes AV & AR', category: 'Freinage' },
      { id: 'discs_thickness', label: 'Mesure cote d\'usure & voile des disques de frein', category: 'Freinage' },
      { id: 'fluid_boiling', label: 'Test taux d\'humidité liquide de frein & purge DOT 4', category: 'Hydraulique' },
      { id: 'calipers_slide', label: 'Dégrippage & graissage colonnettes étriers', category: 'Mécanique' },
      { id: 'shocks_leak', label: 'Inspection fuite huile amortisseurs & coupelles', category: 'Suspension' },
      { id: 'ball_joints', label: 'Contrôle jeu rotules de direction & bras de suspension', category: 'Direction' }
    ]
  },
  {
    id: 'transmission_clutch',
    name: 'Boîte de Vitesses, Embrayage & Transmission',
    specialty: 'Atelier Transmission & Boîtes Automatiques',
    default_type: 'repair',
    suggested_labor_cost: 15000,
    description_placeholder: 'Remplacement kit embrayage complet avec volant moteur bi-masse, butée hydraulique, vidange huile de boîte de vitesses et contrôle de l\'état des cardans et soufflets de transmission.',
    client_notes_template: 'Kit embrayage et transmission remplacés avec succès. Passage des rapports souple et progressif.',
    internal_notes_template: 'Centrage disque d\'embrayage vérifié. Vis volant moteur serrées au couple avec frein filet. Niveau huile de boîte de vitesses complété.',
    suggested_parts: ['Kit d\'embrayage 3 pièces', 'Volant moteur bi-masse', 'Butée hydraulique', 'Huile de boîte 75W-80 / ATF / DSG', 'Crépine de boîte auto', 'Soufflet de cardan'],
    checkpoints: [
      { id: 'clutch_slip', label: 'Contrôle garde & patinage embrayage au point de friction', category: 'Embrayage' },
      { id: 'dual_mass', label: 'Mesure jeu angulaire & basculement volant bi-masse', category: 'Volant Moteur' },
      { id: 'gearbox_oil', label: 'Vidange & niveau huile de boîte (Manuelle / Automatique)', category: 'Lubrification' },
      { id: 'driveshaft_boots', label: 'Inspection soufflets de cardans & étanchéité pont', category: 'Transmission' },
      { id: 'gear_linkage', label: 'Réglage tringlerie de commande des vitesses', category: 'Commande' },
      { id: 'clutch_bleeding', label: 'Purge émetteur / récepteur hydraulique d\'embrayage', category: 'Hydraulique' }
    ]
  },
  {
    id: 'exhaust_emissions',
    name: 'Échappement, Dépollution & FAP / EGR',
    specialty: 'Atelier Dépollution & Systèmes Anti-Pollution',
    default_type: 'repair',
    suggested_labor_cost: 10000,
    description_placeholder: 'Nettoyage et régénération forcée du Filtre à Particules (FAP / DPF), décalaminage de la vanne EGR et vérification du circuit d\'injection d\'AdBlue / additif FAP.',
    client_notes_template: 'Circuit de dépollution décalaminé. Taux d\'encrassement du FAP et débit EGR rétablis aux normes antipollution en vigueur.',
    internal_notes_template: 'Taux de suie initial contrôlé à l\'OBD. Régénération thermique terminée avec succès. Taux résiduel de cendres normalisé.',
    suggested_parts: ['Nettoyant FAP professionnel', 'Vanne EGR', 'Capteur de pression différentielle FAP', 'Sonde de température échappement', 'Liquide AdBlue / Cérine', 'Colliers et joints échappement'],
    checkpoints: [
      { id: 'dpf_soot_load', label: 'Mesure masse de suie & pression différentielle FAP', category: 'FAP' },
      { id: 'egr_valve_clean', label: 'Démontage & décalaminage mécanique vanne EGR', category: 'EGR' },
      { id: 'lambda_sensors', label: 'Contrôle signal sondes Lambda amont & aval', category: 'Sondes' },
      { id: 'adblue_system', label: 'Contrôle pression pompe & injecteur AdBlue / SCR', category: 'AdBlue' },
      { id: 'exhaust_mounts', label: 'État des silentblocs de suspension de la ligne échappement', category: 'Fixation' },
      { id: 'dpf_forced_regen', label: 'Régénération forcée statique / dynamique au banc', category: 'Électronique' }
    ]
  },
  {
    id: 'tires_alignment',
    name: 'Pneumatiques, Géométrie & Parallélisme',
    specialty: 'Centre Pneumatique & Géométrie 3D',
    default_type: 'other',
    suggested_labor_cost: 4000,
    description_placeholder: 'Montage et équilibrage haute précision de pneumatiques neufs, contrôle et réglage de la géométrie 3D des trains avant et arrière (parallélisme, carrossage, chasse) et vérification des valves TPMS.',
    client_notes_template: 'Pneumatiques neufs montés et équilibrés. Géométrie des trains réglée pour garantir une tenue de route optimale et une usure régulière.',
    internal_notes_template: 'Serrage des goujons de roues à la clé dynamométrique (120 Nm). Programmation des capteurs de pression TPMS effectuée.',
    suggested_parts: ['Pneumatiques neufs', 'Valves électroniques TPMS', 'Masses d\'équilibrage', 'Rotules de direction', 'Biellettes de direction'],
    checkpoints: [
      { id: 'tire_tread', label: 'Mesure profondeur sculpture & témoins d\'usure', category: 'Pneus' },
      { id: 'dynamic_balance', label: 'Équilibrage dynamique des roues sur équilibreuse', category: 'Équilibrage' },
      { id: 'wheel_alignment', label: 'Réglage parallélisme & pincement train avant / arrière', category: 'Géométrie' },
      { id: 'tpms_valves', label: 'Contrôle piles & calibrage capteurs de pression TPMS', category: 'Pression' },
      { id: 'torque_wrench', label: 'Serrage écrous de roues au couple prescrit (clé dyn)', category: 'Sécurité' },
      { id: 'spare_tire_check', label: 'Pression roue de secours & kit anti-crevaison', category: 'Secours' }
    ]
  },
  {
    id: 'ac_climate',
    name: 'Climatisation & Circuit Thermique',
    specialty: 'Atelier Climatisation & Thermique Moteur',
    default_type: 'maintenance',
    suggested_labor_cost: 6000,
    description_placeholder: 'Recharge en fluide frigorigène (R134a / R1234yf), tirage au vide du circuit de climatisation avec test d\'étanchéité, injection d\'huile compresseur avec traceur UV et traitement antibactérien.',
    client_notes_template: 'Circuit de climatisation rechargé et désinfecté. Température soufflée mesurée aux aérateurs conforme (entre 4°C et 7°C).',
    internal_notes_template: 'Tirage au vide pendant 25 min : aucune perte de dépression détectée. Quantité de gaz injectée selon plaque signalétique moteur.',
    suggested_parts: ['Gaz réfrigérant R134a / R1234yf', 'Huile PAG compresseur', 'Traceur UV fuite', 'Filtre déshydrateur', 'Condenseur de clim', 'Purifiant habitacle antibactérien'],
    checkpoints: [
      { id: 'ac_vacuum_test', label: 'Tirage au vide & contrôle étanchéité circuit clim', category: 'Dépression' },
      { id: 'gas_recharge', label: 'Injection masse exacte de gaz selon préconisation constructeur', category: 'Charge' },
      { id: 'compressor_clutch', label: 'Enclenchement embrayage magnétique / détendeur clim', category: 'Compresseur' },
      { id: 'vent_temp_test', label: 'Mesure température d\'air pulsé aux aérateurs centraux', category: 'Efficacité' },
      { id: 'radiator_fans', label: 'Fonctionnement motoventilateur de refroidissement en 1ère/2ème vitesse', category: 'Refroidissement' },
      { id: 'cabin_disinfection', label: 'Traitement antibactérien & antifongique des conduits d\'air', category: 'Hygiène' }
    ]
  },
  {
    id: 'blank_custom',
    name: 'Modèle Vierge (Sur-Mesure)',
    specialty: 'Intervention Personnalisée / Sur-Mesure',
    default_type: 'repair',
    suggested_labor_cost: 0,
    description_placeholder: '',
    client_notes_template: '',
    internal_notes_template: '',
    checkpoints: [],
    suggested_parts: []
  }
];
