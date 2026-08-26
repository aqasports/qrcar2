-- Migration 0013: Comprehensive Torque Specifications Database (Couples de Serrage)
-- Broad coverage: Wheels, Cylinder Heads, Spark Plugs, Oil Drain Plugs, Brake Calipers, ISO Standard Bolts

INSERT INTO torque_specs (category, make, model, engine_code, year_from, year_to, component, torque_nm, torque_sequence, thread_spec, bolt_grade, notes, source) VALUES
-- ========================================================
-- 1. WHEEL FASTENER TORQUES (Écrous & Goujons de Roues)
-- ========================================================
('wheel_fastener', 'Renault', 'Clio / Megane / Captur / Scenic / Kadjar', NULL, 2000, 2026, 'Vis de roue (Jantes Alu / Tôle)', 110.00, 'Serrage en croix à la clé dynamométrique', 'M12 x 1.5', '10.9', 'Ne jamais graisser les portées coniques des vis de roue.', 'oem_database'),
('wheel_fastener', 'Renault', 'Trafic / Master / Espace', NULL, 2005, 2026, 'Vis de roue utilitaires', 140.00, 'Serrage en étoile 5 goujons', 'M14 x 1.5', '10.9', 'Utilitaire / Charge lourde : resserrage après 50 km.', 'oem_database'),
('wheel_fastener', 'Dacia', 'Logan / Sandero / Duster / Stepway / Dokker', NULL, 2004, 2026, 'Vis de roue', 105.00, 'Serrage en croix 4 ou 5 trous', 'M12 x 1.5', '10.9', 'Contrôler la propreté du moyeu avant serrage.', 'oem_database'),
('wheel_fastener', 'Peugeot', '206 / 207 / 208 / 307 / 308 / 2008 / 3008', NULL, 2000, 2026, 'Vis de roue portées plates / coniques', 110.00, 'Serrage en croix', 'M12 x 1.25', '10.9', 'Attention rondelle plate imperdable sur jantes alliage PSA.', 'oem_database'),
('wheel_fastener', 'Peugeot', 'Partner / Expert / Boxer / 5008 / 508', NULL, 2006, 2026, 'Vis de roue', 130.00, 'Serrage en croix 5 trous', 'M14 x 1.5', '10.9', 'Boxer / Jumper gros porteur : 160 Nm.', 'oem_database'),
('wheel_fastener', 'Citroen', 'C3 / C4 / C5 / Berlingo / C-Elysee / C3 Aircross', NULL, 2002, 2026, 'Vis de roue', 110.00, 'Serrage en croix', 'M12 x 1.25', '10.9', 'Respecter l''ordre de serrage diamétralement opposé.', 'oem_database'),
('wheel_fastener', 'Volkswagen', 'Golf / Polo / Passat / Tiguan / Caddy / Touran', NULL, 2000, 2026, 'Vis de roue sphériques', 120.00, 'Serrage en étoile 5x100 / 5x112', 'M14 x 1.5', '10.9', 'Portée sphérique R13 (spécifique VAG d''origine).', 'oem_database'),
('wheel_fastener', 'Volkswagen', 'Transporter T5 / T6 / Crafter / Amarok', NULL, 2003, 2026, 'Vis de roue utilitaires', 180.00, 'Serrage en étoile', 'M14 x 1.5', '10.9', 'Crafter roues jumelées : 200 Nm.', 'oem_database'),
('wheel_fastener', 'Audi', 'A1 / A3 / A4 / A5 / A6 / Q3 / Q5', NULL, 2000, 2026, 'Vis de roue', 120.00, 'Serrage en étoile 5x112', 'M14 x 1.5', '10.9', 'Q7 / Q8 : 160 Nm.', 'oem_database'),
('wheel_fastener', 'Seat', 'Ibiza / Leon / Arona / Ateca', NULL, 2000, 2026, 'Vis de roue', 120.00, 'Serrage en étoile 5 trous', 'M14 x 1.5', '10.9', 'Portée sphérique VAG.', 'oem_database'),
('wheel_fastener', 'Skoda', 'Fabia / Octavia / Superb / Kamiq / Karoq', NULL, 2000, 2026, 'Vis de roue', 120.00, 'Serrage en étoile 5 trous', 'M14 x 1.5', '10.9', 'Portée sphérique standard VAG.', 'oem_database'),
('wheel_fastener', 'Toyota', 'Yaris / Corolla / Auris / RAV4 / Hilux / Land Cruiser', NULL, 2000, 2026, 'Écrous de roue à embase plate / conique', 103.00, 'Serrage en étoile', 'M12 x 1.5', '10.9', 'Hilux / Land Cruiser 6 trous : 115 Nm à 130 Nm.', 'oem_database'),
('wheel_fastener', 'Hyundai', 'i10 / i20 / i30 / Accent / Tucson / Santa Fe / Creta', NULL, 2002, 2026, 'Écrous de roue', 110.00, 'Serrage en croix / étoile', 'M12 x 1.5', '10.9', 'Plage nominale constructeur : 107 - 125 Nm.', 'oem_database'),
('wheel_fastener', 'Kia', 'Picanto / Rio / Ceed / Sportage / Sorento / Cerato', NULL, 2002, 2026, 'Écrous de roue', 110.00, 'Serrage en étoile', 'M12 x 1.5', '10.9', 'Plage nominale constructeur : 107 - 125 Nm.', 'oem_database'),
('wheel_fastener', 'BMW', 'Série 1 / 3 / 5 / X1 / X3 / X5 (E46, E90, F30, G20)', NULL, 2000, 2026, 'Vis de roue', 120.00, 'Serrage en étoile 5x120 / 5x112', 'M12 x 1.5 / M14 x 1.25', '10.9', 'F-Series & G-Series (M14x1.25) : 140 Nm.', 'oem_database'),
('wheel_fastener', 'Mercedes-Benz', 'Classe A / B / C / E / GLA / GLC / Sprinter', NULL, 2000, 2026, 'Vis de roue sphériques', 130.00, 'Serrage en étoile 5x112', 'M14 x 1.5', '10.9', 'Sprinter utilitaire : 180 Nm à 240 Nm selon empattement.', 'oem_database'),
('wheel_fastener', 'Nissan', 'Micra / Qashqai / Juke / X-Trail / Navara', NULL, 2003, 2026, 'Écrous de roue', 110.00, 'Serrage en étoile', 'M12 x 1.25', '10.9', 'Navara D40 / NP300 : 135 Nm.', 'oem_database'),
('wheel_fastener', 'Ford', 'Fiesta / Focus / Kuga / Ranger / Transit', NULL, 2002, 2026, 'Écrous de roue à capsule inox', 135.00, 'Serrage en croix / étoile', 'M12 x 1.5 / M14 x 1.5', '10.9', 'Transit utilitaire : 180 - 200 Nm.', 'oem_database'),
('wheel_fastener', 'Fiat', '500 / Panda / Punto / Tipo / Doblo / Ducato', NULL, 2003, 2026, 'Vis de roue', 100.00, 'Serrage en croix 4x98 / 5x98', 'M12 x 1.25', '10.9', 'Ducato utilitaire : 160 - 180 Nm.', 'oem_database'),

-- ========================================================
-- 2. SPARK PLUGS & GLOW PLUGS (Bougies d''Allumage & Préchauffage)
-- ========================================================
('spark_plug', 'Universal', 'Tous moteurs essence culasse aluminium', NULL, NULL, NULL, 'Bougie d''allumage M14 joint plat', 28.00, 'Serrage direct à froid', 'M14 x 1.25', 'Standard', 'Culasse aluminium : 25 à 30 Nm. Culasse fonte : 35 à 40 Nm.', 'iso_standard'),
('spark_plug', 'Universal', 'Moteurs modernes compacts culasse alu', NULL, NULL, NULL, 'Bougie d''allumage M12 joint plat', 20.00, 'Serrage direct à froid', 'M12 x 1.25', 'Standard', 'Plage constructeur NGK / Bosch : 15 à 25 Nm.', 'iso_standard'),
('spark_plug', 'Universal', 'Moteurs downsizing (1.0 / 1.2 TCe / TSI / PureTech)', NULL, NULL, NULL, 'Bougie d''allumage M10 joint plat', 12.00, 'Serrage de précision à froid', 'M10 x 1.0', 'Standard', 'Très fragile : couple max 15 Nm pour éviter la casse du puits.', 'iso_standard'),
('spark_plug', 'Universal', 'Moteurs Ford / US siège conique', NULL, NULL, NULL, 'Bougie d''allumage siège conique sans joint', 18.00, 'Serrage direct', 'M14 x 1.25', 'Standard', 'Siège conique : 15 à 20 Nm (ne pas sur-serrer).', 'iso_standard'),
('spark_plug', 'Universal', 'Moteurs Diesel rampe commune', NULL, NULL, NULL, 'Bougie de préchauffage M10', 15.00, 'Serrage avec graisse haute température au cuivre/céramique', 'M10 x 1.0 / M10 x 1.25', 'Standard', 'Couple de rupture au démontage : max 35 Nm.', 'iso_standard'),
('spark_plug', 'Universal', 'Moteurs Diesel récents ultra-fins', NULL, NULL, NULL, 'Bougie de préchauffage M8', 10.00, 'Serrage de précision au doigt puis dynamométrique', 'M8 x 1.0', 'Standard', 'Couple de rupture très bas (20 Nm). Serrage strict à 10 Nm.', 'iso_standard'),

-- ========================================================
-- 3. OIL DRAIN PLUGS (Bouchons de Vidange Carter d''Huile)
-- ========================================================
('oil_drain', 'Renault / Dacia', 'Tous moteurs K9K, H4B, D4F, K4M, M9R', 'K9K / H4B / K4M', 2000, 2026, 'Bouchon de vidange carré 8mm', 22.00, 'Remplacement systématique du joint cuivre écrasable', 'M16 x 1.5', 'Standard', 'Joint cuivre à lèvre : serrer modérément sans déformer le carter tôle.', 'oem_database'),
('oil_drain', 'PSA (Peugeot/Citroen)', 'Tous moteurs DV6, DW10, EB2, EP6', 'DV6 / EB2 / DW10', 2000, 2026, 'Bouchon de vidange six pans creux / Torx', 25.00, 'Remplacement joint cuivre avec insert caoutchouc', 'M10 x 1.25 / M14 x 1.5', 'Standard', 'Carter alu 1.6 HDi : 25 Nm max pour préserver le taraudage.', 'oem_database'),
('oil_drain', 'Volkswagen / Audi', 'Moteurs TDI / TSI carter acier ou alu', 'EA189 / EA288 / EA211', 2000, 2026, 'Bouchon de vidange avec joint imperdable', 30.00, 'Remplacement bouchon complet préconisé chez VAG', 'M14 x 1.5', 'Standard', 'Carter plastique EA888 / EA288 Evo : bouchon plastique 4 Nm.', 'oem_database'),
('oil_drain', 'Toyota', 'Moteurs essence & diesel D-4D / VVT-i', '1ND-TV / 1KD-FTV / 2ZR', 2000, 2026, 'Bouchon de vidange', 38.00, 'Remplacement joint rondelle fibre / alu Toyota', 'M12 x 1.25', 'Standard', 'Hilux / Prado carter acier : 38 Nm.', 'oem_database'),
('oil_drain', 'Hyundai / Kia', 'Moteurs CRDi et essence Gamma / Nu', 'D4FB / G4FA / G4LC', 2002, 2026, 'Bouchon de vidange', 35.00, 'Remplacement rondelle d''écrasement alu', 'M14 x 1.5', 'Standard', 'Couple prescrit usine : 34 à 44 Nm.', 'oem_database'),
('oil_drain', 'BMW', 'Moteurs Diesel & Essence N47, B47, N20, B48', 'N47 / B47 / M57', 2000, 2026, 'Bouchon de vidange clé 17mm', 25.00, 'Remplacement joint cuivre fourni avec filtre', 'M12 x 1.5', 'Standard', 'Carter alu / magnésium : 25 Nm strict.', 'oem_database'),
('oil_drain', 'Mercedes-Benz', 'Moteurs OM646, OM651, OM654', 'OM646 / OM651', 2000, 2026, 'Bouchon de vidange clé 13mm', 30.00, 'Remplacement joint cuivre', 'M14 x 1.5', 'Standard', 'Couple prescrit : 30 Nm.', 'oem_database'),

-- ========================================================
-- 4. CYLINDER HEAD BOLTS & ANGULAR SEQUENCES (Vis de Culasse)
-- ========================================================
('cylinder_head', 'Renault / Dacia', 'Clio, Megane, Duster, Kangoo, Sandero', '1.5 dCi (K9K)', 2001, 2026, 'Vis de culasse (Kit 10 vis neuves obligatoires)', 25.00, 'Passe 1: 25 Nm | Passe 2: Serrage angulaire 255° ± 10° dans l''ordre escargot 1->10', 'M10 x 1.5', '12.9', 'Toujours lubrifier les filets et sous-têtes à l''huile moteur. Ordre hélicoïdal depuis le centre.', 'oem_elring'),
('cylinder_head', 'PSA (Peugeot/Citroen/Ford)', '207, 208, 308, Focus, Fiesta, C3, C4, Berlingo', '1.6 HDi 16V / 8V (DV6TED4 / DV6C)', 2004, 2026, 'Vis de culasse (10 vis neuves)', 20.00, 'Passe 1: 20 Nm | Passe 2: 40 Nm | Passe 3: Serrage angulaire 260°', 'M10 x 1.5', '12.9', 'DV6C 8 soupapes : 20 Nm + 40 Nm + 260°. Respecter le schéma de serrage.', 'oem_elring'),
('cylinder_head', 'PSA (Peugeot/Citroen/Opel)', '208, 308, 2008, C3, C4, C-Elysee', '1.2 PureTech (EB2)', 2012, 2026, 'Vis de culasse (8 vis neuves)', 30.00, 'Passe 1: 30 Nm | Passe 2: Serrage angulaire 130° | Passe 3: Serrage angulaire 130°', 'M10 x 1.25', '12.9', 'Moteur 3 cylindres alu. Contrôler impérativement l''état de la courroie immergée.', 'oem_elring'),
('cylinder_head', 'Volkswagen / Audi / Seat / Skoda', 'Golf, Passat, A3, A4, Leon, Octavia, Caddy', '1.9 TDI & 2.0 TDI (EA188 / EA189 / EA288)', 2000, 2026, 'Vis de culasse (10 vis M12 neuves)', 40.00, 'Passe 1: 40 Nm | Passe 2: 70 Nm | Passe 3: 90° | Passe 4: 90°', 'M12 x 1.75', '12.9', 'EA288 2.0 TDI : 40 Nm + 70 Nm + 90° + 90°. Contrôler planéité du bloc.', 'oem_elring'),
('cylinder_head', 'Volkswagen / Audi / Seat / Skoda', 'Polo, Golf, Ibiza, Fabia', '1.2 TSI / 1.4 TSI (EA211)', 2012, 2026, 'Vis de culasse (10 vis M10 neuves)', 30.00, 'Passe 1: 30 Nm | Passe 2: 50 Nm | Passe 3: 90° | Passe 4: 90°', 'M10 x 1.5', '12.9', 'Culasse aluminium ultra-légère. Remplacer impérativement les vis.', 'oem_elring'),
('cylinder_head', 'Hyundai / Kia', 'Accent, i20, i30, Rio, Ceed, Cerato, Creta', '1.4 / 1.6 CRDi (D4FC / D4FB)', 2006, 2026, 'Vis de culasse (10 vis M12 neuves)', 50.00, 'Passe 1: 50 Nm | Passe 2: Desserrer 360° | Passe 3: 25 Nm | Passe 4: 120° | Passe 5: 120°', 'M12 x 1.5', '12.9', 'Procédure constructeur Hyundai avec étape de relaxation/desserrage.', 'oem_elring'),
('cylinder_head', 'Toyota', 'Hilux, Land Cruiser Prado, Hiace', '2.5 D-4D / 3.0 D-4D (2KD-FTV / 1KD-FTV)', 2001, 2020, 'Vis de culasse (18 vis M12 neuves)', 39.00, 'Passe 1: 39 Nm | Passe 2: 78 Nm | Passe 3: Serrage angulaire 90° | Passe 4: Serrage angulaire 90°', 'M12 x 1.5', '12.9', '1KD/2KD 4 cylindres 16V diesel : respecter les 18 vis par ordre numérique.', 'oem_elring'),
('cylinder_head', 'BMW', 'Série 1, 3, 5, X1, X3 (E87, E90, F30, F10)', '2.0d (N47D20 / B47D20)', 2007, 2026, 'Vis de culasse (10 vis M12 neuves)', 70.00, 'Passe 1: 70 Nm | Passe 2: Serrage angulaire 180° | Passe 3: Serrage angulaire 50°', 'M12 x 1.5', '12.9', 'N47 distribution arrière : calage distribution au comparateur requis.', 'oem_elring'),
('cylinder_head', 'Mercedes-Benz', 'Classe C, E, Sprinter, Vito', '2.1 CDI 16V (OM646 / OM651)', 2002, 2024, 'Vis de culasse (10 vis M12 neuves)', 60.00, 'Passe 1: 60 Nm | Passe 2: Serrage angulaire 90° | Passe 3: Serrage angulaire 90°', 'M12 x 1.75', '12.9', 'OM651 : 60 Nm + 90° + 90°. Contrôler les guides de chaîne.', 'oem_elring'),

-- ========================================================
-- 5. BRAKE CALIPERS & SUSPENSION (Étriers de Frein & Châssis)
-- ========================================================
('brake_caliper', 'Universal', 'Tous véhicules de tourisme', NULL, NULL, NULL, 'Colonnettes / Guides d''étrier flottant (Brembo/TRW/Ate)', 30.00, 'Serrage direct avec graisse silicone sur axes', 'M8 x 1.25 / BTR 7mm', '8.8', 'Vis de guidage étrier : 25 à 35 Nm selon étrier TRW/Ate/Lucas.', 'oem_database'),
('brake_caliper', 'Universal', 'Tous véhicules de tourisme', NULL, NULL, NULL, 'Support d''étrier de frein sur porte-fusée (Chape)', 105.00, 'Serrage énergique avec frein-filet moyen (bleu)', 'M12 x 1.5 / M14 x 1.5', '10.9', 'Vis de chape porte-étrier : sécurité vitale, 90 à 120 Nm selon classe vis.', 'oem_database'),
('suspension', 'Universal', 'Tous véhicules de tourisme', NULL, NULL, NULL, 'Rotule de direction sur pivot', 45.00, 'Serrage avec contre-écrou neuf ou goupille', 'M10 x 1.25 / M12 x 1.25', '10.9', 'Plage générale : 40 à 55 Nm.', 'oem_database'),
('suspension', 'Universal', 'Tous véhicules de tourisme', NULL, NULL, NULL, 'Rotule de suspension inférieure sur triangle / porte-fusée', 75.00, 'Serrage avec écrou autofreiné neuf (Nylstop)', 'M12 x 1.5', '10.9', 'Plage nominale : 65 à 85 Nm.', 'oem_database'),
('suspension', 'Universal', 'Tous véhicules de tourisme', NULL, NULL, NULL, 'Biellette de barre stabilisatrice', 45.00, 'Serrage à la clé plate avec maintien six pans central', 'M10 x 1.5 / M12 x 1.5', '8.8', 'Plage nominale : 35 à 50 Nm.', 'oem_database'),

-- ========================================================
-- 6. ISO 898-1 STANDARD BOLTS (Visserie Standard Mécanique Automobile)
-- ========================================================
('standard_bolt', 'ISO Standard', 'Boulonnerie Automobile Filetage Standard', NULL, NULL, NULL, 'Boulon M6 Classe 8.8', 10.00, 'Serrage élastique standard K=0.15', 'M6 x 1.0', '8.8', 'Carters tôle, brides de fixation, caches culbuteurs.', 'iso_898_1'),
('standard_bolt', 'ISO Standard', 'Boulonnerie Automobile Haute Résistance', NULL, NULL, NULL, 'Boulon M6 Classe 10.9', 14.00, 'Serrage haute résistance K=0.15', 'M6 x 1.0', '10.9', 'Fixations mécaniques renforcées.', 'iso_898_1'),
('standard_bolt', 'ISO Standard', 'Boulonnerie Automobile Filetage Standard', NULL, NULL, NULL, 'Boulon M8 Classe 8.8', 25.00, 'Serrage élastique standard K=0.15', 'M8 x 1.25', '8.8', 'Pompes à eau, alternateurs, compresseurs clim.', 'iso_898_1'),
('standard_bolt', 'ISO Standard', 'Boulonnerie Automobile Haute Résistance', NULL, NULL, NULL, 'Boulon M8 Classe 10.9', 35.00, 'Serrage haute résistance K=0.15', 'M8 x 1.25', '10.9', 'Supports moteurs, poulies damper, galets tendeurs.', 'iso_898_1'),
('standard_bolt', 'ISO Standard', 'Boulonnerie Automobile Filetage Standard', NULL, NULL, NULL, 'Boulon M10 Classe 8.8', 49.00, 'Serrage élastique standard K=0.15', 'M10 x 1.5', '8.8', 'Boîtes de vitesses sur bloc, berceau moteur.', 'iso_898_1'),
('standard_bolt', 'ISO Standard', 'Boulonnerie Automobile Haute Résistance', NULL, NULL, NULL, 'Boulon M10 Classe 10.9', 70.00, 'Serrage haute résistance K=0.15', 'M10 x 1.5', '10.9', 'Trains roulants, bras de suspension, paliers vilebrequin.', 'iso_898_1'),
('standard_bolt', 'ISO Standard', 'Boulonnerie Automobile Filetage Standard', NULL, NULL, NULL, 'Boulon M12 Classe 8.8', 85.00, 'Serrage élastique standard K=0.15', 'M12 x 1.75', '8.8', 'Fixations de boîtes de vitesses, amortisseurs.', 'iso_898_1'),
('standard_bolt', 'ISO Standard', 'Boulonnerie Automobile Haute Résistance', NULL, NULL, NULL, 'Boulon M12 Classe 10.9', 120.00, 'Serrage haute résistance K=0.15', 'M12 x 1.75', '10.9', 'Pieds d''amortisseurs, rotules, berceaux moteur lourds.', 'iso_898_1'),
('standard_bolt', 'ISO Standard', 'Boulonnerie Automobile Haute Résistance', NULL, NULL, NULL, 'Boulon M14 Classe 10.9', 190.00, 'Serrage haute résistance K=0.15', 'M14 x 2.0', '10.9', 'Moyeux de roues, fusées, vis de volant moteur bi-masse.', 'iso_898_1'),
('standard_bolt', 'ISO Standard', 'Boulonnerie Automobile Très Haute Résistance', NULL, NULL, NULL, 'Boulon M16 Classe 12.9', 350.00, 'Serrage très haute résistance K=0.14', 'M16 x 2.0', '12.9', 'Poulie de vilebrequin / damper centrale, ponts arrière.', 'iso_898_1')
ON CONFLICT DO NOTHING;
