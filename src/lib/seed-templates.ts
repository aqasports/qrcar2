import { sql } from '@/lib/db';
import crypto from 'crypto';

export interface SeedTemplateLineItem {
  name: string;
  description?: string;
  item_type: 'service' | 'part' | 'labor' | 'inspection';
  default_unit_price: number;
  default_quantity: number;
  unit: string;
  is_required?: boolean;
  sort_order: number;
}

export interface SeedTemplateData {
  name: string;
  category: 'maintenance' | 'repair' | 'inspection' | 'custom';
  description: string;
  default_labor_cost: number;
  default_labor_hours: number;
  checkpoints: Array<{ id: string; label: string; category: string }>;
  suggested_parts: string[];
  line_items: SeedTemplateLineItem[];
}

export const STARTER_REPAIR_TEMPLATES: SeedTemplateData[] = [
  {
    name: "Vidange & Entretien Rapide",
    category: "maintenance",
    description: "Vidange moteur complète avec remplacement de l'ensemble des filtres (huile, air, carburant, habitacle), contrôle visuel des niveaux et remise à zéro de l'indicateur d'entretien.",
    default_labor_cost: 3000,
    default_labor_hours: 1.0,
    suggested_parts: ["Huile moteur 5W-30 / 5W-40", "Filtre à huile", "Filtre à air", "Filtre à carburant / gazole", "Filtre d'habitacle", "Joint de vidange"],
    checkpoints: [
      { id: "oil_drain", label: "Vidange huile moteur & remplacement filtre à huile", category: "Lubrification" },
      { id: "air_filter", label: "Remplacement / dépoussiérage filtre à air moteur", category: "Admission" },
      { id: "fuel_filter", label: "Remplacement filtre à carburant / purge eau", category: "Carburant" },
      { id: "cabin_filter", label: "Remplacement filtre d'habitacle / climatisation", category: "Confort" },
      { id: "levels_check", label: "Mise à niveau liquide de refroidissement & lave-glace", category: "Niveaux" },
      { id: "reset_service", label: "Remise à zéro indicateur vidange tableau de bord", category: "Électronique" }
    ],
    line_items: [
      { name: "Forfait Main d'Œuvre Vidange & Filtres", description: "Vidange par gravité + remplacement filtres + RAZ", item_type: "labor", default_unit_price: 3000, default_quantity: 1, unit: "forfait", is_required: true, sort_order: 1 },
      { name: "Huile Moteur Synthétique 5W-30 / 5W-40 (Litre)", description: "Huile homologuée constructeur haute protection", item_type: "part", default_unit_price: 1500, default_quantity: 5, unit: "L", is_required: true, sort_order: 2 },
      { name: "Filtre à Huile Moteur", description: "Cartouche filtrante ou filtre vissé", item_type: "part", default_unit_price: 1200, default_quantity: 1, unit: "u", is_required: true, sort_order: 3 },
      { name: "Filtre à Air Moteur", description: "Remplacement élément filtrant air", item_type: "part", default_unit_price: 1600, default_quantity: 1, unit: "u", is_required: false, sort_order: 4 },
      { name: "Filtre à Carburant / Gazole", description: "Filtre gasoil avec purge du décanteur d'eau", item_type: "part", default_unit_price: 2800, default_quantity: 1, unit: "u", is_required: false, sort_order: 5 },
      { name: "Filtre d'Habitacle Antipollen", description: "Purification air entrant habitacle", item_type: "part", default_unit_price: 1500, default_quantity: 1, unit: "u", is_required: false, sort_order: 6 },
      { name: "Joint de Bouchon de Carter", description: "Joint cuivre écrasable neuf", item_type: "part", default_unit_price: 150, default_quantity: 1, unit: "u", is_required: true, sort_order: 7 },
    ],
  },
  {
    name: "Freinage & Trains Roulants",
    category: "repair",
    description: "Remplacement plaquettes et disques de frein avant/arrière, contrôle étanchéité circuit hydraulique, purge liquide DOT4 et vérification des jeux de trains roulants.",
    default_labor_cost: 5000,
    default_labor_hours: 1.5,
    suggested_parts: ["Jeu de plaquettes de frein AV/AR", "Paire de disques de frein", "Liquide de frein DOT 4", "Flexibles de frein", "Biellettes de barre stab"],
    checkpoints: [
      { id: "pads_wear", label: "Contrôle épaisseur garniture plaquettes AV & AR", category: "Freinage" },
      { id: "discs_thickness", label: "Mesure cote d'usure & voile des disques de frein", category: "Freinage" },
      { id: "fluid_boiling", label: "Test taux d'humidité liquide de frein & purge DOT 4", category: "Hydraulique" },
      { id: "calipers_slide", label: "Dégrippage & graissage colonnettes étriers", category: "Mécanique" },
      { id: "shocks_leak", label: "Inspection fuite huile amortisseurs & coupelles", category: "Suspension" },
      { id: "ball_joints", label: "Contrôle jeu rotules de direction & bras de suspension", category: "Direction" }
    ],
    line_items: [
      { name: "Main d'Œuvre Freinage AV & Purge", description: "Dépose/pose disques et plaquettes + graissage colonnettes", item_type: "labor", default_unit_price: 5000, default_quantity: 1, unit: "forfait", is_required: true, sort_order: 1 },
      { name: "Jeu de Plaquettes de Frein Avant", description: "Plaquettes homologuées ECE R90", item_type: "part", default_unit_price: 4500, default_quantity: 1, unit: "set", is_required: true, sort_order: 2 },
      { name: "Paire de Disques de Frein Avant", description: "Disques ventilés traités anticorrosion", item_type: "part", default_unit_price: 11000, default_quantity: 1, unit: "set", is_required: false, sort_order: 3 },
      { name: "Liquide de Frein DOT 4 (0.5L)", description: "Liquide synthétique haute température", item_type: "part", default_unit_price: 950, default_quantity: 2, unit: "L", is_required: false, sort_order: 4 },
      { name: "Nettoyant Freins & Dégraissant Pro (500ml)", description: "Nettoyage des étriers et dégraissage disques neufs", item_type: "part", default_unit_price: 650, default_quantity: 1, unit: "u", is_required: true, sort_order: 5 },
    ],
  },
  {
    name: "Mécanique Générale & Distribution",
    category: "repair",
    description: "Remplacement kit courroie de distribution, pompe à eau, courroie accessoire, galets tendeurs, purge du circuit de refroidissement et calage moteur au banc.",
    default_labor_cost: 12000,
    default_labor_hours: 4.0,
    suggested_parts: ["Kit distribution complet", "Pompe à eau", "Courroie accessoire", "Liquide de refroidissement G12/G13", "Joint spi vilebrequin"],
    checkpoints: [
      { id: "dist_belt", label: "État & calage piges courroie distribution", category: "Moteur" },
      { id: "water_pump", label: "Étanchéité pompe à eau & circuit refroidissement", category: "Refroidissement" },
      { id: "alternator", label: "Tension de charge alternateur & batterie", category: "Électricité" },
      { id: "engine_mounts", label: "État des silentblocs & supports moteur", category: "Châssis" },
      { id: "fluid_leaks", label: "Recherche de fuites huile / liquide sous caisse", category: "Contrôle" }
    ],
    line_items: [
      { name: "Main d'Œuvre Remplacement Kit Distribution + Pompe à Eau", description: "Dépose calandres, supports moteur, pigeage vilebrequin/AAC et purge", item_type: "labor", default_unit_price: 12000, default_quantity: 1, unit: "forfait", is_required: true, sort_order: 1 },
      { name: "Kit Distribution Complet (Courroie + Galets)", description: "Kit d'origine haute résistance", item_type: "part", default_unit_price: 16500, default_quantity: 1, unit: "set", is_required: true, sort_order: 2 },
      { name: "Pompe à Eau Moteur", description: "Pompe à turbine renforcée avec joint neuf", item_type: "part", default_unit_price: 7500, default_quantity: 1, unit: "u", is_required: true, sort_order: 3 },
      { name: "Courroie d'Accessoire (Poly-V)", description: "Courroie alternateur et compresseur clim", item_type: "part", default_unit_price: 3200, default_quantity: 1, unit: "u", is_required: false, sort_order: 4 },
      { name: "Liquide de Refroidissement Organique 5L (-35°C)", description: "Protection anticorrosion alu G12/G13", item_type: "part", default_unit_price: 2400, default_quantity: 1, unit: "bidon", is_required: true, sort_order: 5 },
    ],
  },
  {
    name: "Injection Diesel & Diagnostic Calculateur",
    category: "repair",
    description: "Diagnostic électronique complet OBD-II, contrôle pression rampe commune (Rail), test débit de retour injecteurs, nettoyage circuit et apprentissage des codes IMA.",
    default_labor_cost: 8000,
    default_labor_hours: 2.0,
    suggested_parts: ["Injecteur haute pression", "Joints pare-feu injecteur", "Capteur de pression rail", "Bougies de préchauffage", "Additif nettoyant injecteurs"],
    checkpoints: [
      { id: "obd_scan", label: "Lecture mémoire calculateur & rapport de codes défauts", category: "Diagnostic" },
      { id: "rail_pressure", label: "Contrôle pression de consigne vs mesurée rampe commune", category: "Pression" },
      { id: "injector_leakoff", label: "Test de débit de retour injecteurs au ralenti et en charge", category: "Injecteurs" },
      { id: "glow_plugs", label: "Test résistance électrique bougies de préchauffage", category: "Allumage" },
      { id: "adaptation_reset", label: "Apprentissage des nouveaux codes IMA/injecteurs", category: "Électronique" }
    ],
    line_items: [
      { name: "Diagnostic Électronique Approfondi & Test Injection", description: "Passage valise OBD2 + mesures paramètres réels + effacement défauts", item_type: "service", default_unit_price: 4000, default_quantity: 1, unit: "forfait", is_required: true, sort_order: 1 },
      { name: "Main d'Œuvre Dépose / Repose Injecteurs", description: "Nettoyage des puits, fraisage des portées de joint et serrage au couple", item_type: "labor", default_unit_price: 6000, default_quantity: 1, unit: "forfait", is_required: false, sort_order: 2 },
      { name: "Pochette Joints Cuivre Pare-Feu Injecteurs", description: "Joints d'étanchéité thermique neufs haute pression", item_type: "part", default_unit_price: 1800, default_quantity: 1, unit: "set", is_required: false, sort_order: 3 },
      { name: "Traitement Curatif Nettoyant Circuit Injection (500ml)", description: "Additif professionnel décalaminant pompe et nez d'injecteurs", item_type: "part", default_unit_price: 2200, default_quantity: 1, unit: "u", is_required: false, sort_order: 4 },
    ],
  },
  {
    name: "Boîte de Vitesses & Kit Embrayage",
    category: "repair",
    description: "Remplacement kit embrayage complet avec butée hydraulique, volant moteur bi-masse, vidange huile de boîte de vitesses et contrôle des joints spi et soufflets de cardans.",
    default_labor_cost: 15000,
    default_labor_hours: 5.0,
    suggested_parts: ["Kit d'embrayage 3 pièces", "Volant moteur bi-masse", "Butée hydraulique", "Huile de boîte 75W-80", "Soufflet de cardan"],
    checkpoints: [
      { id: "clutch_slip", label: "Contrôle garde & patinage embrayage au point de friction", category: "Embrayage" },
      { id: "dual_mass", label: "Mesure jeu angulaire & basculement volant bi-masse", category: "Volant Moteur" },
      { id: "gearbox_oil", label: "Vidange & niveau huile de boîte", category: "Lubrification" },
      { id: "driveshaft_boots", label: "Inspection soufflets de cardans & étanchéité pont", category: "Transmission" },
      { id: "clutch_bleeding", label: "Purge émetteur / récepteur hydraulique d'embrayage", category: "Hydraulique" }
    ],
    line_items: [
      { name: "Main d'Œuvre Dépose / Repose Boîte & Embrayage", description: "Dépose berceau/transmission, centrage disque, serrage volant moteur au couple", item_type: "labor", default_unit_price: 15000, default_quantity: 1, unit: "forfait", is_required: true, sort_order: 1 },
      { name: "Kit d'Embrayage avec Butée Hydraulique", description: "Disque renforcé + mécanisme + butée concentrique", item_type: "part", default_unit_price: 24000, default_quantity: 1, unit: "set", is_required: true, sort_order: 2 },
      { name: "Volant Moteur Bi-Masse (DMF)", description: "Amortissement des acyclismes moteur", item_type: "part", default_unit_price: 45000, default_quantity: 1, unit: "u", is_required: false, sort_order: 3 },
      { name: "Huile de Boîte de Vitesses Manuelle 75W-80 (2L)", description: "Huile d'engrenages extrême pression API GL-4+", item_type: "part", default_unit_price: 2600, default_quantity: 1, unit: "bidon", is_required: true, sort_order: 4 },
      { name: "Joints d'Étanchéité Sorties de Boîte / Différentiel", description: "Joints spi cardans neufs gauche & droite", item_type: "part", default_unit_price: 1900, default_quantity: 2, unit: "u", is_required: false, sort_order: 5 },
    ],
  },
  {
    name: "Climatisation & Circuit Thermique",
    category: "maintenance",
    description: "Recharge en fluide frigorigène (R134a / R1234yf), tirage au vide 25 min avec contrôle d'étanchéité, injection d'huile compresseur PAG avec traceur UV et traitement antibactérien.",
    default_labor_cost: 6000,
    default_labor_hours: 1.0,
    suggested_parts: ["Gaz frigorigène R134a / R1234yf", "Huile compresseur PAG", "Traceur UV fuite", "Purifiant climatisation habitacle"],
    checkpoints: [
      { id: "ac_vacuum_test", label: "Tirage au vide & contrôle étanchéité circuit clim", category: "Dépression" },
      { id: "gas_recharge", label: "Injection masse exacte de gaz selon plaque moteur", category: "Charge" },
      { id: "compressor_clutch", label: "Enclenchement embrayage magnétique compresseur", category: "Compresseur" },
      { id: "vent_temp_test", label: "Mesure température d'air pulsé aux aérateurs (4-7°C)", category: "Efficacité" },
      { id: "cabin_disinfection", label: "Traitement antibactérien & antifongique conduits", category: "Hygiène" }
    ],
    line_items: [
      { name: "Forfait Recharge Climatisation Complète", description: "Tirage au vide 25 min + injection gaz + huile PAG + traceur UV", item_type: "service", default_unit_price: 6000, default_quantity: 1, unit: "forfait", is_required: true, sort_order: 1 },
      { name: "Désinfection & Traitement Purifiant Circuit d'Air", description: "Aérosol One-Shot assainissant conduits et évaporateur", item_type: "service", default_unit_price: 2500, default_quantity: 1, unit: "forfait", is_required: false, sort_order: 2 },
      { name: "Filtre d'Habitacle / Climatisation", description: "Remplacement élément filtrant pollen/charbon actif", item_type: "part", default_unit_price: 1800, default_quantity: 1, unit: "u", is_required: false, sort_order: 3 },
    ],
  },
  {
    name: "Pneumatiques & Géométrie 3D",
    category: "inspection",
    description: "Montage et équilibrage haute précision, réglage de la géométrie 3D des trains avant/arrière (parallélisme, carrossage, chasse) et calibrage des capteurs de pression TPMS.",
    default_labor_cost: 4000,
    default_labor_hours: 1.0,
    suggested_parts: ["Pneumatiques neufs", "Valves TPMS", "Masses d'équilibrage zinc", "Rotules de direction"],
    checkpoints: [
      { id: "tire_tread", label: "Mesure profondeur sculpture & témoins d'usure", category: "Pneus" },
      { id: "dynamic_balance", label: "Équilibrage dynamique des roues sur machine", category: "Équilibrage" },
      { id: "wheel_alignment", label: "Réglage parallélisme & pincement banc laser 3D", category: "Géométrie" },
      { id: "torque_wrench", label: "Serrage écrous de roues à la clé dynamométrique (110-120 Nm)", category: "Sécurité" }
    ],
    line_items: [
      { name: "Contrôle & Réglage Géométrie Train Avant / Arrière 3D", description: "Rapport avant/après réglage parallélisme et carrossage", item_type: "service", default_unit_price: 3500, default_quantity: 1, unit: "forfait", is_required: true, sort_order: 1 },
      { name: "Forfait Montage & Équilibrage Pneumatiques (par roue)", description: "Dépose, brossage moyeu, valve neuve, équilibrage dynamique", item_type: "labor", default_unit_price: 500, default_quantity: 2, unit: "roue", is_required: true, sort_order: 2 },
    ],
  },
  {
    name: "Devis / Ordre de Réparation Sur-Mesure",
    category: "custom",
    description: "Modèle vierge hautement personnalisable permettant d'ajouter vos propres actes d'atelier, pièces et tarifs spécifiques.",
    default_labor_cost: 0,
    default_labor_hours: 1.0,
    suggested_parts: [],
    checkpoints: [],
    line_items: [
      { name: "Main d'Œuvre Mécanique (Heure)", description: "Taux horaire atelier", item_type: "labor", default_unit_price: 2500, default_quantity: 1, unit: "h", is_required: false, sort_order: 1 },
    ],
  },
];

/**
 * Seeds or initializes the repair order templates for a specific garage/organization.
 */
export async function seedOrganizationTemplates(orgId: string, userId?: string): Promise<number> {
  if (!orgId) return 0;

  try {
    // Check if templates already exist
    const existing = await sql(`SELECT id FROM repair_order_templates WHERE organization_id = $1 LIMIT 1`, [orgId]);
    if (existing && existing.length > 0) {
      return 0; // Already seeded
    }

    let insertedCount = 0;

    for (let i = 0; i < STARTER_REPAIR_TEMPLATES.length; i++) {
      const tmpl = STARTER_REPAIR_TEMPLATES[i];
      const templateId = crypto.randomUUID();

      await sql(
        `
        INSERT INTO repair_order_templates (
          id, organization_id, name, category, description,
          default_labor_cost, default_labor_hours, is_active,
          sort_order, checkpoints, suggested_parts, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `,
        [
          templateId,
          orgId,
          tmpl.name,
          tmpl.category,
          tmpl.description,
          tmpl.default_labor_cost,
          tmpl.default_labor_hours,
          1,
          i,
          JSON.stringify(tmpl.checkpoints),
          JSON.stringify(tmpl.suggested_parts),
          userId || null,
        ]
      );

      // Insert line items
      for (let j = 0; j < tmpl.line_items.length; j++) {
        const item = tmpl.line_items[j];
        const lineItemId = crypto.randomUUID();

        await sql(
          `
          INSERT INTO template_line_items (
            id, template_id, name, description, item_type,
            default_unit_price, default_quantity, unit, is_required, sort_order
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `,
          [
            lineItemId,
            templateId,
            item.name,
            item.description || null,
            item.item_type,
            item.default_unit_price,
            item.default_quantity,
            item.unit,
            item.is_required ? 1 : 0,
            item.sort_order || j,
          ]
        );
      }

      insertedCount++;
    }

    return insertedCount;
  } catch (error) {
    console.error('Failed to seed organization templates:', error);
    return 0;
  }
}
