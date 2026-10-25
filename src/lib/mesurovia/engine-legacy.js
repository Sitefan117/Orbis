/*
 * Mesurovia — moteur pédagogique autonome.
 * Pas de dépendance externe : le même fichier fonctionne dans le navigateur
 * et peut être testé avec Node.js. Les fonctions sont séparées de l'interface
 * pour rendre les conversions et l'adaptation vérifiables.
 */
(function (root) {
  'use strict';

  const FAMILIES = {
    length: { label: 'Longueurs', base: 'm', units: { mm: 0.001, cm: 0.01, dm: 0.1, m: 1, dam: 10, hm: 100, km: 1000 } },
    mass: { label: 'Masses', base: 'kg', units: { mg: 0.000001, g: 0.001, kg: 1, t: 1000 } },
    capacity: { label: 'Capacités', base: 'L', units: { mL: 0.001, cL: 0.01, dL: 0.1, L: 1, daL: 10, hL: 100 } },
    duration: { label: 'Durées', base: 's', units: { s: 1, min: 60, h: 3600, j: 86400 } },
    area: { label: 'Aires', base: 'm²', units: { 'mm²': 0.000001, 'cm²': 0.0001, 'dm²': 0.01, 'm²': 1, 'dam²': 100, 'hm²': 10000, 'km²': 1000000 } },
    volume: { label: 'Volumes', base: 'm³', units: { 'mm³': 0.000000001, 'cm³': 0.000001, 'dm³': 0.001, 'm³': 1 } }
  };

  const HOUSE_SETS = {
    'sentiers-moulin': [
      ['repères', 'La Maison des Repères', ['length','mass','capacity'], 'Choisir une unité et estimer'],
      ['longueurs', 'L’Atelier des Rubans', ['length'], 'Convertir des longueurs'],
      ['masses', 'La Halle des Balances', ['mass','capacity'], 'Peser et mesurer des contenances'],
      ['durées', 'L’Horloge du Moulin', ['duration'], 'Comprendre les durées'],
      ['expedition', 'Le Bureau des Courses', ['length','mass','capacity','duration'], 'Résoudre des problèmes concrets']
    ],
    'clairieres-compas': [
      ['repères', 'La Maison des Repères', ['length','mass','capacity'], 'Choisir une unité adaptée'],
      ['longueurs', 'L’Atelier des Rubans', ['length'], 'Relier km, m, dm, cm et mm'],
      ['masses', 'La Halle des Balances', ['mass','capacity'], 'Convertir masses et capacités'],
      ['durées', 'L’Horloge des Clairières', ['duration'], 'Calculer des durées sans piège décimal'],
      ['expedition', 'Le Bureau des Courses', ['length','mass','capacity','duration','area'], 'Appliquer les conversions en situation']
    ],
    'canaux-artisans': [
      ['repères', 'La Maison des Repères', ['length','mass','capacity','duration'], 'Choisir, estimer et vérifier'],
      ['longueurs', 'L’Atelier des Rubans', ['length'], 'Convertir avec des nombres décimaux'],
      ['masses', 'La Halle des Balances', ['mass','capacity'], 'Maîtriser masses et capacités'],
      ['surfaces', 'La Cour des Pavés', ['area'], 'Convertir des aires : les unités sont au carré'],
      ['expedition', 'Le Bureau des Expéditions', ['length','mass','capacity','duration','area','volume'], 'Résoudre des problèmes à plusieurs étapes']
    ],
    'hautes-terres': [
      ['repères', 'La Maison des Repères', ['length','mass','capacity','duration','area','volume'], 'Choisir l’unité et contrôler la vraisemblance'],
      ['longueurs', 'L’Atelier des Rubans', ['length'], 'Convertir, comparer et ordonner'],
      ['masses', 'La Halle des Balances', ['mass','capacity'], 'Mélanger les unités sans perdre le sens'],
      ['formes', 'L’Atelier des Formes', ['area','volume'], 'Aires et volumes : puissances des unités'],
      ['expedition', 'Le Bureau des Expéditions', ['length','mass','capacity','duration','area','volume'], 'Résoudre et justifier une situation complète']
    ]
  };

  const VILLAGES = [
    { id:'sentiers-moulin', name:'Les Sentiers du Moulin', subtitle:'Le hameau des premières mesures', palette:['#c9e9a9','#7cbe74','#e9c26c'], story:'Le moulin s’est arrêté : ses habitants ne savent plus quelle quantité de farine peser, ni quelle longueur de ruban préparer.' },
    { id:'clairieres-compas', name:'Les Clairières du Compas', subtitle:'Le village des chemins et des balances', palette:['#c8e5a8','#62ab87','#e4b26e'], story:'Les sentiers se croisent sans panneaux. Aide les cartographes à remettre les distances et les mesures dans le bon ordre.' },
    { id:'canaux-artisans', name:'Les Canaux des Artisans', subtitle:'La cité des ateliers et des pavés', palette:['#bfe6df','#58a6ad','#e5bd83'], story:'Les bâtisseurs ont mélangé longueurs, surfaces et contenances. Le chantier ne reprendra que lorsque chaque mesure aura retrouvé sa place.' },
    { id:'hautes-terres', name:'Les Hautes-Terres de la Mesure', subtitle:'Le bourg des missions expertes', palette:['#c7d8ef','#6b8dc5','#d8b184'], story:'Le château prépare une grande expédition. Il faut des mesures fiables, des calculs cohérents et des résultats qu’on sait vérifier.' }
  ];

  // Les contenus de cours suivent une structure stable : 4 explications courtes,
  // chacune suivie d'une question de compréhension avant de poursuivre.
  const LESSONS = {
    'repères': [
      {title:'Je choisis une unité qui a du sens',body:'Avant de calculer, je me demande ce que je mesure : une longueur, une masse, une capacité ou une durée. Le nom de l’unité me donne un indice.',visual:'<div class="measure-cards"><span>📏 longueur<br><b>m · cm · km</b></span><span>⚖️ masse<br><b>g · kg · t</b></span><span>🫗 capacité<br><b>mL · L</b></span><span>⏱ durée<br><b>s · min · h</b></span></div>',ask:'Une valise bien remplie pèse environ 12 ___. Quelle unité choisir ?',options:['g','kg','t'],answer:'kg',explain:'Le kilogramme (kg) convient pour la masse d’une valise. Le gramme est trop petit et la tonne beaucoup trop grande.'},
      {title:'J’estime avant de convertir',body:'Je pense à un repère réel. Une porte mesure environ 2 m, une bouteille peut contenir 1 L et un trajet entre deux villes se mesure souvent en kilomètres.',visual:'<div class="example-strip"><span>🚪 porte ≈ 2 m</span><span>🧴 bouteille ≈ 1 L</span><span>🚲 tour ≈ 20 min</span></div>',ask:'Une carte indique une distance de 4 km. Quelle autre écriture représente la même distance ?',options:['400 m','4 000 m','40 000 m'],answer:'4 000 m',explain:'1 km = 1 000 m. Donc 4 km = 4 × 1 000 = 4 000 m.'},
      {title:'Je garde la même grandeur',body:'Convertir ne change pas la longueur, la masse ou la capacité réelle. Seul le nombre écrit change parce que l’unité n’a pas la même taille.',visual:'<div class="equal-visual"><b>1 m</b><span>＝</span><div class="bar-meter"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><b>100 cm</b></div>',ask:'Un ruban mesure 3 m. Un autre mesure 300 cm. Lequel est le plus long ?',options:['Celui de 3 m','Celui de 300 cm','Ils ont la même longueur'],answer:'Ils ont la même longueur',explain:'3 m = 300 cm. Les deux rubans ont la même longueur, même si le nombre écrit est différent.'},
      {title:'Je vérifie si le résultat est raisonnable',body:'Après une conversion, je relis l’unité et j’estime le résultat. En allant vers une unité plus petite, le nombre augmente. En allant vers une unité plus grande, le nombre diminue.',visual:'<div class="direction-visual"><span>unité grande</span><b>← le nombre diminue</b><b>le nombre augmente →</b><span>unité petite</span></div>',ask:'Combien de centimètres y a-t-il dans 2 mètres ?',options:['0,2 cm','20 cm','200 cm'],answer:'200 cm',explain:'Le centimètre est plus petit que le mètre : il en faut 100 pour faire 1 m. Donc 2 m = 200 cm.'}
    ],
    'longueurs': [
      {title:'Étape 1 — Je lis les unités',body:'Ordre des longueurs : km | hm | dam | m | dm | cm | mm. Chaque pas vers la droite correspond à une unité dix fois plus petite.',visual:'TABLE',ask:'Une fourmi mesure quelques millimètres. Quelle unité convient pour écrire sa longueur ?',options:['mm','m','km'],answer:'mm',explain:'Le centimètre est plus petit que le mètre. Le kilomètre et le décamètre sont plus grands.'},
      {title:'Étape 2 — Je place le nombre dans le tableau',body:'Pour 2,4 m, je place le 2 dans la colonne des mètres et le 4 dans celle des décimètres. Les chiffres occupent une colonne ; les cases vides valent zéro.',visual:'TABLE_EXAMPLE',ask:'Dans 3,6 m, quel chiffre indique les décimètres ?',options:['3','6','0'],answer:'6',explain:'Dans 3,6 m, le 3 correspond aux mètres et le 6 aux décimètres.'},
      {title:'Étape 3 — Je lis la colonne d’arrivée',body:'Pour convertir, je repère la colonne demandée puis je lis le nombre. Vers une unité plus petite, le nombre s’écrit avec davantage de chiffres ; vers une unité plus grande, il devient plus petit.',visual:'<div class="number-line"><span>km</span><span>hm</span><span>dam</span><span class="active">m</span><span>dm</span><span>cm</span><span>mm</span></div>',ask:'2 m = combien de dm ?',options:['0,2 dm','20 dm','200 dm'],answer:'20 dm',explain:'Entre m et dm, il y a un pas vers une unité dix fois plus petite. 2 × 10 = 20 dm.'},
      {title:'Étape 4 — Je vérifie si le résultat a du sens',body:'Je peux contrôler avec un repère : 2 m est la longueur d’une grande table. 20 dm désigne exactement la même longueur. 200 dm ferait 20 mètres : beaucoup trop long.',visual:'<div class="example-strip"><span>❌ 2 m = 0,2 cm</span><span>✅ 2 m = 200 cm</span></div>',ask:'5 m = combien de cm ?',options:['50 cm','500 cm','5 000 cm'],answer:'500 cm',explain:'m → dm → cm : deux pas vers des unités 10 fois plus petites. 5 × 100 = 500 cm.'}
    ],
    'masses': [
      {title:'Je sais ce que je mesure',body:'Une masse se pèse avec une balance. Les unités fréquentes sont le gramme (g), le kilogramme (kg) et parfois la tonne (t). Une capacité indique ce qu’un récipient peut contenir : mL, cL, dL ou L.',visual:'<div class="measure-cards"><span>🍎 pomme<br><b>≈ 150 g</b></span><span>🎒 sac<br><b>≈ 4 kg</b></span><span>🥛 verre<br><b>≈ 2 dL</b></span><span>🧃 bouteille<br><b>≈ 1 L</b></span></div>',ask:'Un seau peut contenir 8 ___. Quelle unité choisir ?',options:['L','mL','cL'],answer:'L',explain:'Le litre (L) convient pour la capacité d’un seau. Le millilitre et le centilitre sont de plus petites unités.'},
      {title:'Les masses : kg et g',body:'1 kg = 1 000 g. Pour passer des kilogrammes aux grammes, on multiplie par 1 000. Dans l’autre sens, on divise par 1 000.',visual:'<div class="conversion-equation"><span>1 kg</span><b>＝</b><span>1 000 g</span></div>',ask:'2 kg = combien de g ?',options:['200 g','2 000 g','20 000 g'],answer:'2 000 g',explain:'2 × 1 000 = 2 000 g.'},
      {title:'Les capacités : L et mL',body:'1 L = 100 cL = 1 000 mL. Les unités de capacité suivent ici des rapports par 10 entre L, dL, cL et mL.',visual:'<div class="beaker"><div class="water"></div><span>1 L = 1 000 mL</span></div>',ask:'0,5 L = combien de mL ?',options:['5 mL','50 mL','500 mL'],answer:'500 mL',explain:'1 L vaut 1 000 mL. La moitié de 1 000 mL est 500 mL.'},
      {title:'Je contrôle avec la vie réelle',body:'Une conversion doit rester plausible. Une personne ne pèse pas 70 g, et une petite bouteille d’eau ne contient pas 500 L. Les repères aident à repérer une erreur de zéro.',visual:'<div class="example-strip"><span>🙂 personne ≈ 70 kg</span><span>💧 petite bouteille ≈ 500 mL</span></div>',ask:'Quelle masse est plausible pour un petit chien ?',options:['8 kg','8 g','8 t'],answer:'8 kg',explain:'8 kg est plausible pour un petit chien. 8 g est presque la masse d’un petit objet, et 8 tonnes celle d’un très gros véhicule.'}
    ],
    'durées': [
      {title:'Le temps ne se convertit pas comme les longueurs',body:'Pour les durées, 1 minute = 60 secondes et 1 heure = 60 minutes. Attention : les minutes ne sont pas des centièmes d’heure. 1,5 h, c’est 1 h 30 min, pas 1 h 5 min.',visual:'<div class="clock-equation"><span>1 h</span><b>＝</b><span>60 min</span><br><span>1 min</span><b>＝</b><span>60 s</span></div>',ask:'1 h 30 min correspond à combien de minutes ?',options:['90 min','130 min','30 min'],answer:'90 min',explain:'1 heure = 60 minutes. 60 + 30 = 90 minutes.'},
      {title:'Je décompose une durée',body:'Pour additionner ou convertir une durée, je sépare les heures et les minutes. 2 h 15 min = 120 min + 15 min = 135 min.',visual:'<div class="time-blocks"><span>2 h = 120 min</span><b>+</b><span>15 min</span><b>=</b><strong>135 min</strong></div>',ask:'3 h = combien de minutes ?',options:['180 min','300 min','30 min'],answer:'180 min',explain:'Chaque heure contient 60 minutes. Donc 3 × 60 = 180 minutes.'},
      {title:'Je transforme une écriture décimale avec prudence',body:'Dans 2,5 h, 0,5 h signifie une demi-heure, donc 30 minutes. On obtient 2 h 30 min. On ne lit pas les chiffres après la virgule comme des minutes.',visual:'<div class="time-blocks"><span>2,5 h</span><b>→</b><strong>2 h 30 min</strong></div>',ask:'1,25 h correspond à combien de minutes ?',options:['75 min','125 min','1 h 25 min'],answer:'75 min',explain:'0,25 h = un quart d’heure = 15 min. 1 h 15 min = 75 min.'},
      {title:'Je vérifie la durée',body:'Je vérifie en revenant à une heure connue. 120 min = 2 h. Si ma réponse pour 2 h est 20 min ou 2 000 min, elle n’est pas cohérente.',visual:'<div class="example-strip"><span>✅ 120 min = 2 h</span><span>❌ 2 h = 20 min</span></div>',ask:'3 h 10 min = combien de minutes ?',options:['190 min','310 min','180 min'],answer:'190 min',explain:'3 heures font 180 minutes. 180 + 10 = 190 minutes.'}
    ],
    'surfaces': [
      {title:'Une longueur et une aire, ce n’est pas pareil',body:'La longueur se mesure le long d’un côté. L’aire mesure la surface couverte. Une longueur s’écrit en m ; une aire en m².',visual:'<svg class="svg-visual" viewBox="0 0 320 100" role="img" aria-label="Un rectangle avec sa longueur et sa surface"><rect x="16" y="18" width="122" height="62" fill="#b7dc96" stroke="#32654b" stroke-width="2"/><path d="M16 8 H138 M16 4 V12 M138 4 V12" stroke="#32654b"/><text x="77" y="9" font-size="9" text-anchor="middle">longueur</text><rect x="176" y="18" width="122" height="62" fill="#efc46f" stroke="#986a23" stroke-width="2"/><path d="M196 18V80M216 18V80M236 18V80M256 18V80M276 18V80M176 38H298M176 58H298" stroke="#986a23" stroke-width="1" opacity=".7"/><text x="237" y="53" font-size="12" text-anchor="middle">surface</text></svg>',ask:'Quelle unité convient pour l’aire d’une chambre ?',options:['m','m²','m³'],answer:'m²',explain:'Une aire mesure une surface. On écrit par exemple m² : le petit ² rappelle qu’on mesure une surface.'},
      {title:'Pourquoi le carré change le facteur ?',body:'Si 1 m = 10 dm, alors un carré de 1 m de côté contient 10 × 10 petits carrés de 1 dm². Donc 1 m² = 100 dm², pas 10 dm².',visual:'<div class="square-grid" aria-label="Carré découpé en cent petits carrés">'+Array.from({length:100},()=>'<i></i>').join('')+'</div><p class="visual-caption">10 lignes × 10 colonnes = 100 carrés</p>',ask:'2 m² = combien de dm² ?',options:['20 dm²','200 dm²','2 000 dm²'],answer:'200 dm²',explain:'Il y a dix décimètres dans chaque côté : 10 × 10 = 100 dm².'},
      {title:'Je regarde bien si l’unité est au carré',body:'Je garde ensemble l’unité et son exposant : cm² n’est pas cm. Quand l’unité de longueur change par 10, l’unité d’aire change par 100 entre deux unités voisines.',visual:'<div class="conversion-equation"><span>1 m²</span><b>＝</b><span>100 dm²</span><b>＝</b><span>10 000 cm²</span></div>',ask:'1 dm² = combien de cm² ?',options:['10 cm²','100 cm²','1 000 cm²'],answer:'100 cm²',explain:'1 dm = 10 cm. Pour l’aire : 10 × 10 = 100 cm².'},
      {title:'Je contrôle la taille du résultat',body:'Convertir m² en cm² fait augmenter le nombre, car le cm² est beaucoup plus petit. Le nombre 2 m² = 20 cm² est trop petit ; il faut 20 000 cm².',visual:'<div class="example-strip"><span>✅ 2 m² = 20 000 cm²</span><span>❌ 2 m² = 20 cm²</span></div>',ask:'3 m² = combien de cm² ?',options:['300 cm²','3 000 cm²','30 000 cm²'],answer:'30 000 cm²',explain:'1 m² = 10 000 cm² ; donc 3 m² = 30 000 cm².'}
    ],
    'formes': [
      {title:'Aire et volume : deux idées différentes',body:'Une aire mesure une surface en unités au carré (cm², m²). Un volume mesure l’espace occupé en unités au cube (cm³, m³). Je regarde si je couvre une surface ou si je remplis un solide.',visual:'<div class="measure-cards"><span>🟨 surface<br><b>m²</b></span><span>🧊 espace 3D<br><b>m³</b></span></div>',ask:'Pour mesurer l’espace occupé par un coffre, on choisit plutôt…',options:['m','m²','m³'],answer:'m³',explain:'Un coffre est un solide : son volume s’exprime en unités cubiques.'},
      {title:'Pourquoi le cube change le facteur ?',body:'1 m = 10 dm sur chacun des trois côtés. Un cube de 1 m³ contient 10 × 10 × 10 petits cubes de 1 dm³ : donc 1 m³ = 1 000 dm³.',visual:'<div class="cube-visual"><span>10 × 10 × 10</span><b>＝ 1 000 petits cubes</b></div>',ask:'2 m³ = combien de dm³ ?',options:['200 dm³','2 000 dm³','20 000 dm³'],answer:'2 000 dm³',explain:'Chaque dimension est multipliée par 10. Pour le volume : 2 × 10 × 10 × 10 = 2 000 dm³.'},
      {title:'Je distingue les tableaux',body:'Le tableau des longueurs change par 10 à chaque colonne. Celui des aires correspond à des facteurs au carré ; celui des volumes à des facteurs au cube. Je ne déplace donc pas la virgule de la même façon.',visual:'<div class="number-line"><span>m</span><span>dm</span><span>cm</span><span>↕</span><span>m²</span><span>dm²</span><span>cm²</span></div>',ask:'Un bac occupe 0,5 m³. Quel est son volume en dm³ ?',options:['50 dm³','500 dm³','5 000 dm³'],answer:'500 dm³',explain:'1 m³ = 1 000 dm³. La moitié de 1 000 dm³ est 500 dm³.'},
      {title:'Je vérifie avant d’écrire',body:'Ici, les volumes restent en cm³, dm³ ou m³. Les litres mesurent une capacité : on les travaille dans une autre série d’exercices.',visual:'<div class="example-strip"><span>✅ 2 m³ = 2 000 dm³</span><span>🧠 L et m³ : on ne mélange pas les tableaux ici</span></div>',ask:'3 m³ = combien de dm³ ?',options:['300 dm³','3 000 dm³','30 000 dm³'],answer:'3 000 dm³',explain:'1 m³ = 1 000 dm³. Donc 3 m³ = 3 × 1 000 = 3 000 dm³.'}
    ],
    'expedition': [
      {title:'Je lis toute la situation',body:'Avant de calculer, je souligne la grandeur et les unités. Je repère ce qui est demandé. Je ne commence pas à multiplier ou diviser tant que je ne sais pas si les unités sont compatibles.',visual:'<div class="steps-card"><b>1. Je repère</b><b>2. Je convertis</b><b>3. Je calcule</b><b>4. Je vérifie</b></div>',ask:'Pour additionner 2 m et 30 cm, quelle étape faire avant le calcul ?',options:['Mettre les deux longueurs dans la même unité','Multiplier les nombres','Changer de grandeur'],answer:'Mettre les deux longueurs dans la même unité',explain:'On convertit par exemple 2 m en 200 cm, puis on additionne 200 cm + 30 cm.'},
      {title:'Je convertis avant de combiner',body:'Les nombres avec des unités différentes ne s’additionnent pas directement. 2 m + 30 cm devient 200 cm + 30 cm = 230 cm, ou 2 m + 0,30 m = 2,30 m.',visual:'<div class="conversion-equation"><span>2 m</span><b>+</b><span>30 cm</span><b>→</b><strong>230 cm</strong></div>',ask:'1 m 20 cm = combien de cm ?',options:['120 cm','1020 cm','12 cm'],answer:'120 cm',explain:'1 m = 100 cm ; 100 + 20 = 120 cm.'},
      {title:'Je garde les unités visibles',body:'Je note l’unité dans chaque étape. Cela m’aide à repérer une erreur et à ne pas confondre une mesure avec un nombre sans sens.',visual:'<div class="steps-card"><b>200 cm</b><span>+</span><b>30 cm</b><span>=</span><b>230 cm</b></div>',ask:'2 kg + 500 g = combien de grammes ?',options:['2 500 g','700 g','2,5 g'],answer:'2 500 g',explain:'2 kg = 2 000 g ; 2 000 + 500 = 2 500 g.'},
      {title:'Je vérifie si le résultat a du sens',body:'Je demande : est-ce que le résultat est de la bonne taille ? Puis je vérifie en sens inverse si nécessaire. Une conversion doit conserver la grandeur de départ.',visual:'<div class="example-strip"><span>🔎 Unité correcte ?</span><span>🔎 Nombre plausible ?</span><span>🔎 Réponse à la question ?</span></div>',ask:'Une randonnée de 3 km correspond à…',options:['300 m','3 000 m','30 000 m'],answer:'3 000 m',explain:'1 km = 1 000 m, donc 3 km = 3 000 m.'}
    ]
  };

  // Un texte de secours est fourni pour le type de maison propre à un village.
  // Les checkpoints de fin rendent chaque région pédagogiquement distincte.
  // Le reste de la leçon conserve une structure familière : cela réduit la charge
  // de compréhension de l'interface, tandis que le défi augmente avec les régions.
  const STAGE_FINAL_CHECKPOINTS = {
    'sentiers-moulin': {
      'repères': {ask:'Le moulin doit préparer 2 mètres de ruban. Combien cela représente-t-il en centimètres ?',options:['20 cm','200 cm','2 000 cm'],answer:'200 cm',explain:'1 m = 100 cm. Donc 2 m = 2 × 100 = 200 cm.'},
      'longueurs': {ask:'Le moulin a besoin de 5 m de corde. Combien de centimètres faut-il mesurer ?',options:['50 cm','500 cm','5 000 cm'],answer:'500 cm',explain:'m → dm → cm : deux pas vers des unités 10 fois plus petites. 5 × 100 = 500 cm.'},
      'masses': {ask:'Le boulanger pèse 2 kg de farine. Cela représente combien de grammes ?',options:['20 g','200 g','2 000 g'],answer:'2 000 g',explain:'1 kg = 1 000 g, donc 2 kg = 2 × 1 000 = 2 000 g.'},
      'durées': {ask:'Le moulin tourne pendant 2 h 40 min. Combien cela fait-il de minutes ?',options:['160 min','240 min','204 min'],answer:'160 min',explain:'2 h = 120 min. Puis 120 + 40 = 160 minutes.'},
      'expedition': {ask:'Tu as 1 m de ruban et encore 60 cm. Quelle longueur totale cela représente-t-il en centimètres ?',options:['160 cm','106 cm','60 cm'],answer:'160 cm',explain:'Convertis d’abord 1 m en 100 cm, puis additionne : 100 + 60 = 160 cm.'}
    },
    'clairieres-compas': {
      'repères': {ask:'Le cartographe note une distance de 0,12 km. Cela correspond à combien de mètres ?',options:['12 m','120 m','1 200 m'],answer:'120 m',explain:'1 km = 1 000 m. Donc 0,12 × 1 000 = 120 m.'},
      'longueurs': {ask:'Le ruban mesure 4,5 dm. Quelle est sa longueur en millimètres ?',options:['45 mm','450 mm','4 500 mm'],answer:'450 mm',explain:'1 dm = 100 mm. Donc 4,5 × 100 = 450 mm.'},
      'masses': {ask:'Le panier pèse 0,65 kg. Combien cela fait-il de grammes ?',options:['65 g','650 g','6 500 g'],answer:'650 g',explain:'1 kg = 1 000 g. 0,65 × 1 000 = 650 g.'},
      'durées': {ask:'Une mission dure 1,75 h. Combien cela fait-il de minutes ?',options:['75 min','105 min','175 min'],answer:'105 min',explain:'1 h = 60 min et 0,75 h = 45 min. Au total : 60 + 45 = 105 min.'},
      'expedition': {ask:'Le sentier fait 2 km puis 350 m. Quelle est sa longueur totale en mètres ?',options:['550 m','2 035 m','2 350 m'],answer:'2 350 m',explain:'2 km = 2 000 m. Ensuite 2 000 + 350 = 2 350 m.'}
    },
    'canaux-artisans': {
      'repères': {ask:'Un plan indique 1,2 m² pour une surface. Que signifie le symbole m² ?',options:['Une longueur','Une masse','Une aire'],answer:'Une aire',explain:'Le carré (²) indique une aire : on mesure une surface, par exemple le sol d’un atelier. Une longueur s’exprime en m, pas en m².'},
      'longueurs': {ask:'Une planche mesure 2,48 m. Quelle est sa longueur en centimètres ?',options:['24,8 cm','248 cm','2 480 cm'],answer:'248 cm',explain:'1 m = 100 cm, donc 2,48 × 100 = 248 cm. Le nombre augmente car on compte dans une unité plus petite.'},
      'masses': {ask:'Une palette a une masse de 1,25 t. Combien cela représente-t-il de kilogrammes ?',options:['125 kg','1 250 kg','12 500 kg'],answer:'1 250 kg',explain:'1 t = 1 000 kg. Donc 1,25 × 1 000 = 1 250 kg.'},
      'surfaces': {ask:'Un atelier couvre 2,4 m². Combien cela représente-t-il de dm² ?',options:['24 dm²','240 dm²','2 400 dm²'],answer:'240 dm²',explain:'Pour les aires, chaque pas d’unité multiplie par 100 : 1 m² = 100 dm². Donc 2,4 m² = 240 dm².'},
      'expedition': {ask:'Un sol fait 2,4 m² et une extension ajoute 75 dm². Quelle aire totale obtient-on en m² ?',options:['2,475 m²','3,15 m²','9,9 m²'],answer:'3,15 m²',explain:'Convertis 75 dm² en m² : 75 ÷ 100 = 0,75 m². Puis 2,4 + 0,75 = 3,15 m².'}
    },
    'hautes-terres': {
      'repères': {ask:'Une caisse est décrite par 1,2 m³. Que mesure cette unité ?',options:['Une longueur','Un volume','Une capacité en litres'],answer:'Un volume',explain:'m³ mesure un volume en unités cubiques. Ne transforme pas automatiquement chaque volume en litres : il faut connaître la relation et le contexte pertinents.'},
      'longueurs': {ask:'La carte indique 3,075 km. Quelle distance cela représente-t-il en mètres ?',options:['307,5 m','3 075 m','30 750 m'],answer:'3 075 m',explain:'1 km = 1 000 m. Donc 3,075 × 1 000 = 3 075 m. Vérifie que la distance est plausible pour un parcours de quelques kilomètres.'},
      'masses': {ask:'Le chargement pèse 3 500 g. Quelle est sa masse en kilogrammes ?',options:['0,35 kg','3,5 kg','35 kg'],answer:'3,5 kg',explain:'Pour passer de g à kg, on divise par 1 000 : 3 500 ÷ 1 000 = 3,5 kg.'},
      'formes': {ask:'Une boîte a une longueur de 2 m, une largeur de 1 m et une hauteur de 0,5 m. Quel est son volume ?',options:['3,5 m³','1 m³','2 m³'],answer:'1 m³',explain:'Volume = longueur × largeur × hauteur : 2 × 1 × 0,5 = 1 m³. Le volume est une grandeur cubique, distincte de la capacité.'},
      'expedition': {ask:'Une expédition parcourt 1,8 km le matin et 750 m l’après-midi. Quelle distance a-t-elle parcourue au total, en kilomètres ?',options:['2,55 km','1,875 km','9,3 km'],answer:'2,55 km',explain:'1,8 km reste 1,8 km. Convertis 750 m en 0,75 km, puis additionne : 1,8 + 0,75 = 2,55 km.'}
    }
  };

  // En plus de la dernière question propre à chaque région, ces notes ajoutent
  // une consigne de raisonnement différente à chacune des quatre étapes. Cela
  // conserve une interface familière sans répéter exactement le même cours.
  const STAGE_HOUSE_NOTES = {
    'sentiers-moulin': {
      'repères':['Associe d’abord chaque objet à ce que tu mesures : longueur, masse, capacité ou durée.','Compare avec un objet familier : une porte, une bouteille ou un sac de pommes.','La mesure réelle ne change pas quand on change l’unité ; seul le nombre écrit change.','Si tu comptes dans une unité plus petite, il faut davantage d’unités pour mesurer la même chose.'],
      'longueurs':['Commence par repérer le mètre dans la famille des longueurs.','Dans le tableau, place le chiffre des unités dans la colonne de l’unité donnée.','Pour passer de mètres à centimètres, avance de deux colonnes vers des unités plus petites.','Avant de valider, imagine la longueur d’une corde ou d’une table pour vérifier le résultat.'],
      'masses':['Une balance mesure une masse ; un verre mesure une capacité. Ne mélange pas ces deux grandeurs.','Retiens le repère central : 1 kg pèse autant que 1 000 g.','Pour les contenances, un litre équivaut à 1 000 millilitres. Utilise le tableau adapté à la capacité.','Relis l’unité : quelques grammes sont légers, quelques kilogrammes sont plausibles pour un sac.'],
      'durées':['Pour le temps, retiens d’abord les deux relations utiles : 1 min = 60 s et 1 h = 60 min.','Convertis les heures en paquets de 60 minutes, puis ajoute les minutes restantes.','Ne traite pas les minutes comme des centièmes d’heure : 30 min correspondent à une demi-heure.','Vérifie en recomposant les heures et les minutes de départ.'],
      'expedition':['Entoure ce que la question demande avant de faire un calcul.','Convertis les deux mesures dans la même unité avant de les additionner.','Écris l’unité à chaque étape pour éviter de mélanger mètres, centimètres, kilogrammes et grammes.','À la fin, demande-toi si le résultat ressemble à une vraie mesure dans la situation.']
    },
    'clairieres-compas': {
      'repères':['Le cartographe choisit une unité qui correspond à l’échelle du trajet ou de l’objet.','Une estimation t’aide à voir à peu près quel résultat attendre avant d’utiliser le tableau.','Avec les décimaux, la quantité reste identique ; seule sa représentation change.','Compare les résultats proposés avec le repère : 0,08 km doit rester une petite distance, soit 80 m.'],
      'longueurs':['La famille complète est km | hm | dam | m | dm | cm | mm ; chaque pas change par 10.','Aligne le chiffre de départ avec la bonne colonne, même si le nombre contient une virgule.','Compte le nombre de pas entre l’unité de départ et celle d’arrivée, puis applique le facteur.','Vérifie le résultat avec une unité connue : 3,2 dm, c’est 32 cm ou 320 mm.'],
      'masses':['Observe le nombre et l’unité ensemble : 0,75 kg n’est pas 0,75 g.','Pour les masses, kg → g multiplie par 1 000 ; dans l’autre sens, on divise par 1 000.','Une capacité suit son propre tableau ; un résultat en mL ne peut pas être une masse en g.','Contrôle que 0,75 kg est proche de trois quarts de kilogramme, donc 750 g.'],
      'durées':['Les heures et les minutes utilisent un facteur 60, contrairement aux colonnes décimales de longueur.','Sépare la partie entière des heures et la partie décimale avant de convertir.','0,5 h vaut 30 minutes ; 0,25 h vaut 15 minutes. Ne lis jamais 2,5 h comme 2 h 5 min.','Contrôle le total en recomposant : 150 min = 2 h 30 min.'],
      'expedition':['Choisis une unité commune avant d’additionner ou de comparer des mesures.','Convertis d’abord les kilomètres en mètres, puis ajoute les mètres restants.','Garde la famille de grandeur visible : une longueur ne s’ajoute pas à une masse.','Refais le calcul dans l’autre sens ou utilise une estimation pour repérer un zéro de trop.']
    },
    'canaux-artisans': {
      'repères':['Regarde les symboles : m, m² et m³ désignent trois grandeurs différentes.','Les décimaux sont utiles en mesure ; estime d’abord si le résultat attendu est de quelques unités ou de centaines.','Pour comparer deux mesures, transforme-les dans la même unité sans changer la grandeur.','Un exposant au carré indique une aire : ne convertis pas m² avec le même facteur qu’un m.'],
      'longueurs':['Le tableau sert aussi avec un nombre décimal : la virgule ne doit pas te faire perdre la colonne d’unité.','Place les chiffres à partir de l’unité donnée et complète les colonnes absentes par des zéros si nécessaire.','Vérifie le facteur avant de déplacer la virgule : m ↔ cm correspond à 100, pas à 10.','Après conversion, contrôle en sens inverse : 236 cm divisés par 100 redonnent 2,36 m.'],
      'masses':['Pour les cargaisons, tu peux rencontrer kg et tonnes ; le rapport est 1 t = 1 000 kg.','Multiplie ou divise par 1 000 selon le sens de conversion, puis relis la virgule.','Pour les capacités, conserve le tableau L, dL, cL, mL ; les unités doivent rester dans la même famille.','Une réponse réaliste doit correspondre à la taille de l’objet ou de la livraison décrite.'],
      'surfaces':['Un côté se mesure en mètres ; la surface du pavé se mesure en mètres carrés.','Chaque côté se multiplie par 10 entre m et dm : l’aire se multiplie donc par 10 × 10 = 100.','Pour m² → cm², le facteur global est 10 000 ; ne déplace pas seulement d’une colonne.','Compare avec une grille : 1 m² contient 100 carrés de 1 dm².'],
      'expedition':['Avant les calculs, sépare les longueurs, masses, durées et aires données.','Ramène chaque donnée dans l’unité qui rend l’opération possible.','Additionne seulement des mesures de même grandeur et garde l’unité commune dans l’écriture.','Une extension de surface doit être convertie en m² avant de s’ajouter à des m².']
    },
    'hautes-terres': {
      'repères':['Choisis l’unité en fonction de la grandeur et de l’échelle : le bon nombre seul ne suffit pas.','Estime le résultat attendu avant de choisir une procédure de conversion.','Deux écritures peuvent représenter la même mesure. Pour les comparer, mets-les dans la même unité.','Dans m² et m³, le petit chiffre en haut change la façon de convertir : une aire et un volume ne se convertissent pas comme une longueur.'],
      'longueurs':['Un nombre décimal représente une mesure entière, pas une approximation automatique.','Pour aligner un décimal dans le tableau, garde le chiffre des unités de départ dans sa colonne.','Pour comparer des distances, convertis-les dans la même unité ou compare des représentations équivalentes.','Justifie le résultat avec le facteur utilisé et une estimation de la distance parcourue.'],
      'masses':['Écris clairement la famille de grandeur et l’unité avant d’appliquer le facteur.','Pour g ↔ kg, divise ou multiplie par 1 000 ; vérifie la position de la virgule.','Quand des données sont dans plusieurs unités, harmonise-les avant toute addition ou comparaison.','Conserve l’unité jusqu’à la dernière ligne et vérifie la masse attendue dans le contexte.'],
      'formes':['Le volume mesure l’espace occupé par un solide ; l’aire mesure sa surface.','Pour convertir m³ en dm³, le facteur 10 agit sur trois dimensions : 10 × 10 × 10.','Utilise des relations distinctes pour les longueurs, aires et volumes : ×10, ×100 ou ×1 000 entre unités voisines correspondantes.','Ne transforme pas automatiquement des m³ en litres : regarde d’abord ce que la question te demande.'],
      'expedition':['Identifie les données, la grandeur demandée et l’unité du résultat avant de calculer.','Découpe la résolution en petites opérations et convertis seulement quand c’est nécessaire.','Pour une durée, transforme séparément les heures et les minutes ; le système n’est pas décimal.','Explique pourquoi le résultat est raisonnable et, si possible, contrôle-le par une opération inverse.']
    }
  };

  function lessonForHouse(houseId, villageId) {
    // Retourner une copie évite qu'une modification d'affichage altère les données source.
    const source = LESSONS[houseId] || LESSONS.repères;
    const lesson = source.map(item => ({...item}));
    const checkpoints = STAGE_FINAL_CHECKPOINTS[villageId]?.[houseId];
    if (checkpoints) lesson[3] = {...lesson[3], ...checkpoints};
    if (villageId === 'sentiers-moulin' && houseId === 'durées') {
      lesson[1] = {...lesson[1], title:'Je décompose heures et minutes', body:'Chaque heure vaut 60 minutes. Je convertis d’abord les heures complètes, puis j’ajoute les minutes restantes.', visual:'<div class="time-blocks"><span>2 h = 120 min</span><b>+</b><span>15 min</span><b>=</b><strong>135 min</strong></div>', ask:'2 h 25 min = combien de minutes ?', options:['125 min','145 min','225 min'], answer:'145 min', explain:'2 h = 120 min. Ensuite 120 + 25 = 145 min.'};
      lesson[2] = {...lesson[2], title:'Je garde les unités visibles', body:'Quand une durée contient des heures et des minutes, je transforme d’abord les heures, puis j’ajoute les minutes. Je vérifie que le total peut se recomposer en heures et minutes.', visual:'<div class="time-blocks"><span>1 h = 60 min</span><b>+</b><span>50 min</span><b>=</b><strong>110 min</strong></div>', ask:'1 h 45 min = combien de minutes ?', options:['145 min','105 min','85 min'], answer:'105 min', explain:'1 h = 60 min ; 60 + 45 = 105 min.'};
    }
    const notes = STAGE_HOUSE_NOTES[villageId]?.[houseId];
    if (notes) lesson.forEach((item, index) => {
      item.body = `${item.body}\n\nDans cette mission : ${notes[index]}`;
    });
    return lesson;
  }

  function listHouses(villageId) {
    return (HOUSE_SETS[villageId] || HOUSE_SETS['sentiers-moulin']).map((h, i) => ({
      index: i, id: h[0], title: h[1], families: h[2], subtitle: h[3],
      icon: ['🧭','📏','⚖️','🧱','🗺️'][i]
    }));
  }

  function nrand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function neat(n) {
    // Garde les petites valeurs et les grands nombres sans les arrondir brutalement à 4 décimales.
    return Number(Number(n).toPrecision(12));
  }
  function fmt(n) {
    const v = neat(n);
    return v.toLocaleString('fr-CH', { maximumFractionDigits: 8 }).replace(/\u202f/g, ' ');
  }
  function normalizeAnswer(value) {
    return String(value ?? '').trim().toLowerCase().replace(/\s/g,'').replace(/,/g,'.').replace(/’/g,"'");
  }
  function convert(value, family, from, to) {
    const f = FAMILIES[family];
    if (!f || !(from in f.units) || !(to in f.units)) throw new Error('Unité incompatible');
    return neat(Number(value) * f.units[from] / f.units[to]);
  }
  function unitsFor(family, difficulty) {
    // La progression introduit les unités par étapes pour éviter des conversions
    // absurdes (par exemple mm² → km²) dès qu'un élève choisit un village avancé.
    if (family === 'duration') return difficulty <= 2 ? ['min','h'] : ['s','min','h','j'];
    if (family === 'length') {
      if (difficulty === 1) return ['cm','m'];
      if (difficulty === 2) return ['mm','cm','dm','m'];
      if (difficulty === 3) return ['mm','cm','dm','m','dam','km'];
      return ['mm','cm','dm','m','dam','hm','km'];
    }
    if (family === 'mass') {
      if (difficulty <= 2) return ['g','kg'];
      // Les mg restent dans le moteur mais ne sont pas mélangés aux kg et tonnes dans un seul saut.
      return ['g','kg','t'];
    }
    if (family === 'capacity') {
      if (difficulty === 1) return ['mL','L'];
      if (difficulty === 2) return ['mL','cL','dL','L'];
      return ['mL','cL','dL','L','daL','hL'];
    }
    if (family === 'area') {
      if (difficulty === 1) return ['dm²','m²'];
      if (difficulty === 2) return ['cm²','dm²','m²'];
      if (difficulty === 3) return ['cm²','dm²','m²'];
      return ['mm²','cm²','dm²','m²','dam²'];
    }
    if (family === 'volume') {
      if (difficulty <= 2) return ['dm³','m³'];
      if (difficulty === 3) return ['cm³','dm³','m³'];
      return ['mm³','cm³','dm³','m³'];
    }
    return Object.keys(FAMILIES[family].units);
  }
  function explanationFor(family, value, from, to, answer) {
    const f = FAMILIES[family];
    const ratio = f.units[from] / f.units[to];
    let action;
    if (ratio > 1) action = `L’unité d’arrivée est plus petite : le nombre augmente. Ici, on multiplie par ${fmt(ratio)}.`;
    else if (ratio < 1) action = `L’unité d’arrivée est plus grande : le nombre diminue. Ici, on multiplie par ${fmt(ratio)} (c’est-à-dire qu’on divise par ${fmt(1/ratio)}).`;
    else action = 'Les deux unités sont identiques : le nombre ne change pas.';
    if (family === 'duration') {
      // Formule une explication exacte pour toute paire temporelle autorisée,
      // y compris les jours, au lieu d'afficher une règle sans lien avec la question.
      const timeFactor = ratio > 1 ? fmt(ratio) : fmt(1 / ratio);
      action = ratio > 1
        ? `1 ${from} = ${timeFactor} ${to}. Multiplie par ${timeFactor} : ${fmt(value)} × ${timeFactor} = ${fmt(answer)} ${to}.`
        : `1 ${to} = ${timeFactor} ${from}. Divise par ${timeFactor} : ${fmt(value)} ÷ ${timeFactor} = ${fmt(answer)} ${to}.`;
    }
    if (family === 'area') action += ' Comme il s’agit d’une aire, le facteur est au carré : chaque changement de longueur agit sur deux dimensions.';
    if (family === 'volume') action += ' Comme il s’agit d’un volume, le facteur est au cube : chaque changement de longueur agit sur trois dimensions.';
    return `Étape 1 : je repère la grandeur (${f.label.toLowerCase()}). Étape 2 : je repère l’unité de départ (${from}) et celle demandée (${to}). Étape 3 : ${action} Étape 4 : ${fmt(value)} ${from} = ${fmt(answer)} ${to}. Je relis l’unité demandée.`;
  }
  function makeConversion(family, difficulty) {
    const units = unitsFor(family, difficulty);
    // Limite l'écart entre unités afin de garder les résultats lisibles et adaptés au niveau.
    // Chaque famille a des pas différents : les aires progressent par 100 et les volumes par 1 000.
    const maxFactor = { length: 1000, mass: 1000, capacity: 1000, duration: 3600, area: 10000, volume: 1000000 }[family] || 1000;
    const allowedPairs = [];
    for (const fromUnit of units) {
      for (const toUnit of units) {
        if (fromUnit === toUnit) continue;
        const ratio = FAMILIES[family].units[fromUnit] / FAMILIES[family].units[toUnit];
        if (ratio <= maxFactor && ratio >= 1 / maxFactor) allowedPairs.push([fromUnit, toUnit]);
      }
    }
    const [firstFrom, firstTo] = allowedPairs.length ? pick(allowedPairs) : [Object.keys(FAMILIES[family].units)[0], Object.keys(FAMILIES[family].units)[1]];
    let from = firstFrom, to = firstTo;
    let value;
    if (family === 'duration') {
      // Respecte les unités introduites à chaque niveau. Auparavant, les niveaux 1/2
      // proposaient aussi des secondes, alors que unitsFor ne les introduit qu'aux niveaux 3/4.
      [from, to] = pick(allowedPairs);

      // Valeurs lisibles pour chaque conversion de durée. Les jours ne sont utilisés
      // qu'aux niveaux avancés ; secondes ↔ jours reste exclu par maxFactor.
      const durationValues = {
        'h>min': [1, 2, 3, 4, 5, 10],
        'min>h': [60, 90, 120, 180, 240],
        'min>s': [1, 2, 3, 4, 5, 10, 15, 30],
        's>min': [60, 120, 180, 240, 300, 600],
        'h>s': [1, 2, 3, 4, 5],
        's>h': [3600, 5400, 7200, 10800, 14400, 18000],
        'j>h': [1, 2, 3, 5],
        'h>j': [24, 36, 48, 72, 120],
        'j>min': [1, 2, 3],
        'min>j': [1440, 2160, 2880, 4320]
      };
      value = pick(durationValues[`${from}>${to}`] || [1, 2, 3, 4]);
    } else {
      const ratio = FAMILIES[family].units[from] / FAMILIES[family].units[to];
      if (difficulty === 1) {
        const smallToLarge = ratio < 1;
        const beginnerValues = {
          length: smallToLarge ? [100,200,250,500,1000] : [1,2,3,5],
          mass: smallToLarge ? [100,250,500,1000] : [1,2,3,5],
          capacity: smallToLarge ? [100,250,500,1000] : [0.5,1,1.5,2],
          area: smallToLarge ? [100,200,500,1000] : [1,2,3,5],
          volume: smallToLarge ? [250,500,1000] : [1,2,3],
        };
        value = pick(beginnerValues[family] || [1,2,3,5]);
      } else if (ratio < 1) {
        // Si la réponse diminue en changeant d'unité, on choisit d'abord un résultat
        // simple (0,5 ; 1 ; 1,5 ; …), puis on retrouve la mesure de départ correspondante.
        const targetValues = difficulty === 2 ? [0.5,1,1.5,2,2.5,5] : [0.5,1.2,1.5,2.4,3.25,4.5,7.2,12];
        value = neat(pick(targetValues) / ratio);
      } else {
        value = pick(difficulty === 2 ? [0.5,1,1.5,2,3,4,5,10,20,50,100] : [0.5,1,1.2,1.5,2.4,3.25,4.5,7.2,12]);
      }
    }
    const factor = FAMILIES[family].units[from] / FAMILIES[family].units[to];
    const answer = neat(value * factor);
    return {
      family, type:'number', value, from, to, answer,
      prompt:`Convertis ${fmt(value)} ${from} en ${to}.`,
      context:`Une mesure vaut ${fmt(value)} ${from}. Écris la même mesure en ${to}.`,
      answerLabel:`${fmt(answer)} ${to}`,
      explain: explanationFor(family, value, from, to, answer),
      hint:`1. Regarde les deux unités. 2. Place ${fmt(value)} ${from} dans le tableau. 3. Repère la colonne ${to}. 4. Vérifie si le nombre doit augmenter ou diminuer.`,
      worked:`La grandeur reste la même. Le facteur entre ${from} et ${to} est ${fmt(factor)}. Donc ${fmt(value)} × ${fmt(factor)} = ${fmt(answer)}. La réponse est ${fmt(answer)} ${to}.`
    };
  }
  function makeLegacyQuestion(family, difficulty = 1, opts = {}) {
    if (!FAMILIES[family]) family = 'length';
    const level = Math.max(1, Math.min(4, Number(difficulty) || 1));
    const roll = Math.random();
    if (roll < 0.54 || family === 'duration') return makeConversion(family, level);
    if (roll < 0.70 && ['length','mass','capacity'].includes(family)) {
      const examples = {
        length: [{p:'La longueur d’un terrain de football est plutôt proche de…',o:['100 m','100 cm','100 km'],a:'100 m',e:'Un terrain mesure environ une centaine de mètres.'},{p:'Pour mesurer la distance entre deux villes, choisis…',o:['km','mm','cm'],a:'km',e:'On utilise généralement les kilomètres pour des distances entre villes.'}],
        mass: [{p:'La masse d’un gros sac de pommes est plutôt…',o:['5 kg','5 g','5 t'],a:'5 kg',e:'Quelques kilogrammes sont plausibles pour un sac de pommes.'}],
        capacity: [{p:'Une grande bouteille d’eau contient environ…',o:['1,5 L','1,5 mL','1,5 kL'],a:'1,5 L',e:'Une bouteille courante contient un ou quelques litres.'}]
      };
      const t = pick(examples[family]); return {family,type:'choice',prompt:t.p,options:t.o,answer:t.a,answerLabel:t.a,explain:t.e,hint:'Pense à un objet réel. Quelle unité est utilisée dans la vie quotidienne ?',worked:`Repère concret : ${t.e}`};
    }
    if (roll < 0.84 && family === 'area') {
      const v = pick([1,2,3,4,5]); const to = pick(['dm²','cm²']); const from = 'm²'; const ans = convert(v,'area',from,to);
      return {family,type:'number',prompt:`Une petite terrasse fait ${v} m². Combien cela représente-t-il en ${to} ?`,answer:ans,answerLabel:`${fmt(ans)} ${to}`,explain:explanationFor('area',v,from,to,ans),hint:'Pour les aires, le facteur de longueur est au carré : 1 m² = 100 dm² et 1 m² = 10 000 cm².',worked:`${v} m² = ${fmt(ans)} ${to}. On utilise un facteur au carré, pas seulement × 10.`};
    }
    const q = makeConversion(family, level);
    if (roll < 0.93) {
      return {...q,type:'choice',prompt:q.prompt,options:makeChoices(q.answer, family, q.to),answer:`${fmt(q.answer)} ${q.to}`,answerLabel:`${fmt(q.answer)} ${q.to}`,explain:q.explain,hint:q.hint,worked:q.worked};
    }
    return {...q,prompt:`Mission : ${q.context}`,type:'number'};
  }

  /*
   * Mesurovia V3 — formats de questions séparés du contenu.
   * Les formats sont générés à la demande : aucun catalogue géant de questions
   * écrites à la main n'est nécessaire. Pour ajouter un format, on le déclare
   * ici et on ajoute son rendu/correcteur dans la page de jeu.
   */
  const QUESTION_FORMATS = ['choice', 'number', 'unit', 'match', 'order', 'table', 'error', 'multi'];
  const TABLE_FAMILIES = ['length', 'mass', 'capacity'];

  const UNIT_SCENARIOS = {
    length: [
      { prompt: 'Un crayon mesure 18 ___. Quelle unité convient ?', answer: 'cm', options: ['cm', 'mm', 'm'] },
      { prompt: 'La distance entre deux villes est de 35 ___. Quelle unité convient ?', answer: 'km', options: ['km', 'm', 'cm'] },
      { prompt: 'Une porte mesure environ 2 ___. Quelle unité convient ?', answer: 'm', options: ['m', 'cm', 'km'] },
      { prompt: 'Une fourmi mesure quelques ___. Quelle unité convient ?', answer: 'mm', options: ['mm', 'cm', 'm'] }
    ],
    mass: [
      { prompt: 'Un sac de pommes pèse 4 ___. Quelle unité convient ?', answer: 'kg', options: ['kg', 'g', 't'] },
      { prompt: 'Une pomme pèse environ 150 ___. Quelle unité convient ?', answer: 'g', options: ['g', 'kg', 't'] },
      { prompt: 'Un camion chargé peut peser 8 ___. Quelle unité convient ?', answer: 't', options: ['t', 'kg', 'g'] }
    ],
    capacity: [
      { prompt: 'Une bouteille d’eau contient 1,5 ___. Quelle unité convient ?', answer: 'L', options: ['L', 'mL', 'cL'] },
      { prompt: 'Une cuillère contient quelques ___. Quelle unité convient ?', answer: 'mL', options: ['mL', 'L', 'hL'] },
      { prompt: 'Une baignoire contient beaucoup de ___. Quelle unité convient ?', answer: 'L', options: ['L', 'dL', 'mL'] }
    ],
    duration: [
      { prompt: 'Un film dure environ 90 ___. Quelle unité convient ?', answer: 'min', options: ['min', 'h', 's'] },
      { prompt: 'Une journée dure 24 ___. Quelle unité convient ?', answer: 'h', options: ['h', 'min', 's'] },
      { prompt: 'Un clignement d’œil dure environ une fraction de ___. Quelle unité convient ?', answer: 's', options: ['s', 'min', 'h'] }
    ],
    area: [
      { prompt: 'La surface d’une petite chambre est d’environ 12 ___. Quelle unité convient ?', answer: 'm²', options: ['m²', 'cm²', 'km²'] },
      { prompt: 'La surface d’un timbre se mesure plutôt en ___.', answer: 'cm²', options: ['cm²', 'm²', 'km²'] }
    ],
    volume: [
      { prompt: 'Le volume d’un petit dé se mesure en ___.', answer: 'cm³', options: ['cm³', 'dm³', 'm³'] },
      { prompt: 'Le volume d’une grande boîte peut se mesurer en ___.', answer: 'dm³', options: ['dm³', 'cm³', 'm³'] }
    ]
  };

  const MATCH_BANK = {
    length: [['1 m','100 cm'],['2 m','200 cm'],['3 m','30 dm'],['1 km','1 000 m'],['50 cm','5 dm'],['4 dm','40 cm'],['1,5 m','150 cm']],
    mass: [['1 kg','1 000 g'],['2 kg','2 000 g'],['500 g','0,5 kg'],['3 t','3 000 kg'],['250 g','0,25 kg'],['4 kg','4 000 g']],
    capacity: [['1 L','1 000 mL'],['2 L','200 cL'],['50 cL','0,5 L'],['3 dL','300 mL'],['1,5 L','1 500 mL'],['4 L','400 cL']],
    duration: [['1 h','60 min'],['2 h','120 min'],['3 min','180 s'],['90 min','1 h 30 min'],['1 min','60 s'],['2 h','7 200 s']],
    area: [['1 m²','100 dm²'],['2 m²','20 000 cm²'],['3 m²','300 dm²'],['1 dm²','100 cm²'],['4 m²','400 dm²']],
    volume: [['1 m³','1 000 dm³'],['1 dm³','1 000 cm³'],['2 m³','2 000 dm³'],['3 dm³','3 000 cm³']]
  };

  function chooseDistractors(answer, family, from, to, opts = {}) {
    // Erreurs courantes : facteur 10/100/1 000 dans le mauvais sens.
    const correct = neat(Number(answer));
    const candidates = [correct * 10, correct / 10, correct * 100, correct / 100, correct * 1000, correct / 1000, correct + 1, Math.max(0, correct - 1)];
    const seen = new Set([normalizeAnswer(fmt(correct))]);
    const out = [correct];
    for (const n of candidates) {
      if (!Number.isFinite(n) || n < 0) continue;
      const value = neat(n);
      const key = normalizeAnswer(fmt(value));
      if (seen.has(key)) continue;
      seen.add(key); out.push(value);
      if (out.length === 4) break;
    }
    // A very small answer can create duplicate or unhelpful alternatives; keep the set distinct.
    while (out.length < 4) {
      const value = neat(correct + out.length + 2);
      const key = normalizeAnswer(fmt(value));
      if (!seen.has(key)) { seen.add(key); out.push(value); }
    }
    return shuffle(out).slice(0, 4).map(v => `${fmt(v)} ${to}`);
  }

  function shuffle(items) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  function makeUnitQuestion(family) {
    const scenario = pick(UNIT_SCENARIOS[family] || UNIT_SCENARIOS.length);
    return {
      family, type: 'unit', prompt: scenario.prompt,
      options: shuffle(scenario.options), answer: scenario.answer, answerLabel: scenario.answer,
      explain: `On choisit une unité adaptée à ce qu’on mesure. Ici, ${scenario.answer} est l’unité qui convient.`,
      hint: 'Pense à la taille de l’objet ou à la durée de l’action.',
      worked: `Relis la situation, puis compare la taille attendue avec les unités proposées. La bonne unité est ${scenario.answer}.`
    };
  }

  function makeMatchQuestion(family, difficulty = 1) {
    // Les équivalences sont calculées à la demande : elles ne sont pas limitées
    // aux quelques exemples de la banque historique.
    const pairs = [];
    const leftSeen = new Set();
    const rightSeen = new Set();
    let attempts = 0;
    while (pairs.length < 3 && attempts < 40) {
      attempts += 1;
      const q = makeConversion(family, difficulty);
      const left = `${fmt(q.value)} ${q.from}`;
      const right = `${fmt(q.answer)} ${q.to}`;
      if (leftSeen.has(normalizeAnswer(left)) || rightSeen.has(normalizeAnswer(right))) continue;
      leftSeen.add(normalizeAnswer(left)); rightSeen.add(normalizeAnswer(right));
      pairs.push([left, right]);
    }
    // Filet de sécurité au cas où un hasard défavorable répète trop de valeurs.
    for (const pair of shuffle(MATCH_BANK[family] || MATCH_BANK.length)) {
      if (pairs.length >= 3) break;
      if (!leftSeen.has(normalizeAnswer(pair[0])) && !rightSeen.has(normalizeAnswer(pair[1]))) {
        leftSeen.add(normalizeAnswer(pair[0])); rightSeen.add(normalizeAnswer(pair[1])); pairs.push(pair);
      }
    }
    const chosen = shuffle(pairs).slice(0, 3);
    const leftItems = chosen.map((pair, i) => ({ id: `g${i}`, label: pair[0] }));
    const rightItems = shuffle(chosen.map((pair, i) => ({ id: `d${i}`, label: pair[1] })));
    const answer = {};
    chosen.forEach((pair, i) => { answer[`g${i}`] = `d${i}`; });
    return {
      family, type: 'match', prompt: 'Relie chaque mesure à une mesure équivalente.', leftItems, rightItems, answer,
      explain: 'Les deux écritures d’une paire représentent la même grandeur.',
      hint: 'Commence par une mesure facile à reconnaître, puis utilise-la pour vérifier les autres.',
      worked: chosen.map(pair => `${pair[0]} = ${pair[1]}`).join('\n')
    };
  }

  function makeOrderQuestion(family, difficulty = 1) {
    const unitByFamily = { length: 'm', mass: 'kg', capacity: 'L', duration: 'min', area: 'm²', volume: 'm³' };
    const unit = unitByFamily[family] || 'm';
    const values = new Set();
    while (values.size < 4) {
      // Petits niveaux : valeurs simples. Niveaux avancés : davantage de décimaux.
      const value = family === 'duration'
        ? nrand(1, difficulty <= 2 ? 60 : 240)
        : difficulty <= 2 ? nrand(1, 20) : Math.round((Math.random() * 99 + 1) * 10) / 10;
      values.add(value);
    }
    const sorted = [...values].sort((a,b)=>a-b);
    const items = shuffle(sorted.map(value => `${fmt(value)} ${unit}`));
    return {
      family, type: 'order', prompt: 'Range ces mesures de la plus petite à la plus grande.', items,
      answer: sorted.map(value => `${fmt(value)} ${unit}`),
      explain: 'Toutes les mesures utilisent la même unité : compare les nombres.',
      hint: 'Repère d’abord la plus petite mesure, puis cherche celle qui vient juste après.',
      worked: sorted.map(value => `${fmt(value)} ${unit}`).join(' → ')
    };
  }

  function makeTableQuestion(family, difficulty) {
    if (!TABLE_FAMILIES.includes(family)) family = 'length';
    const q = makeConversion(family, difficulty);
    return {
      ...q, type: 'table', prompt: `Utilise le tableau pour convertir ${fmt(q.value)} ${q.from} en ${q.to}.`,
      explain: `La mesure ne change pas. Dans la colonne ${q.from}, tu pars de ${fmt(q.value)}. Lis ensuite le résultat dans la colonne ${q.to}. ${q.explain}`,
      hint: `Repère la colonne ${q.from}, puis celle de ${q.to}. L’unité demandée est ${q.to}.`,
      worked: `${fmt(q.value)} ${q.from} = ${fmt(q.answer)} ${q.to}. Vérifie le sens du déplacement entre les unités.`
    };
  }

  function makeErrorQuestion(family, difficulty) {
    const q = makeConversion(family, difficulty);
    const alternatives = chooseDistractors(q.answer, family, q.from, q.to, { includeCorrect: false });
    const wrong = alternatives.find(item => normalizeAnswer(item) !== normalizeAnswer(`${fmt(q.answer)} ${q.to}`)) || `${fmt(q.answer + 1)} ${q.to}`;
    const correct = `${fmt(q.answer)} ${q.to}`;
    const options = shuffle([correct, ...alternatives.filter(item => normalizeAnswer(item) !== normalizeAnswer(wrong) && normalizeAnswer(item) !== normalizeAnswer(correct)).slice(0, 2), wrong]);
    const unique = [...new Set(options)];
    while (unique.length < 4) unique.push(`${fmt(q.answer + unique.length + 1)} ${q.to}`);
    return {
      ...q, type: 'error', prompt: `Léo écrit : ${fmt(q.value)} ${q.from} = ${wrong}. Quelle est la bonne conversion ?`,
      options: shuffle(unique), answer: correct, answerLabel: correct,
      explain: `La bonne conversion est ${correct}. ${q.explain}`,
      hint: 'Ne choisis pas tout de suite : regarde les unités et demande-toi si le nombre doit augmenter ou diminuer.',
      worked: `${fmt(q.value)} ${q.from} = ${correct}. La réponse de Léo, ${wrong}, utilise un mauvais facteur de conversion.`
    };
  }

  function makeMultiQuestion(family, difficulty = 1) {
    const configs = {
      length: { unit:'m', targets:[['cm',100],['dm',10],['mm',1000]], wrong:[['cm',10],['mm',100]] },
      mass: { unit:'kg', targets:[['g',1000],['t',0.001]], wrong:[['g',100],['t',1]] },
      capacity: { unit:'L', targets:[['cL',100],['dL',10],['mL',1000]], wrong:[['cL',10],['mL',100]] },
      duration: { unit:'h', targets:[['min',60],['s',3600]], wrong:[['min',100],['s',600]] },
      area: { unit:'m²', targets:[['dm²',100],['cm²',10000]], wrong:[['dm²',10],['cm²',100]] },
      volume: { unit:'m³', targets:[['dm³',1000],['cm³',1000000]], wrong:[['dm³',100],['cm³',100000]] }
    };
    const data = configs[family] || configs.length;
    const value = pick(difficulty <= 2 ? [1,2,3,5] : [1,1.5,2,2.5,3,4,5]);
    const target = `${fmt(value)} ${data.unit}`;
    const correct = data.targets.map(([unit, factor]) => `${fmt(neat(value * factor))} ${unit}`);
    const wrong = data.wrong.map(([unit, factor]) => `${fmt(neat(value * factor))} ${unit}`);
    return {
      family, type: 'multi', prompt: `Coche toutes les autres écritures équivalentes à ${target}.`, options: shuffle([...correct, ...wrong]),
      answer: correct, answerLabel: correct.join(', '),
      explain: `${target} peut aussi s’écrire ${correct.join(' ou ')}.`,
      hint: 'Il peut y avoir plusieurs bonnes réponses. Vérifie chaque proposition séparément.',
      worked: `Les bonnes réponses sont : ${correct.join(', ')}.`
    };
  }

  function makeQuestion(family, difficulty = 1, opts = {}) {
    if (!FAMILIES[family]) family = 'length';
    const level = Math.max(1, Math.min(4, Number(difficulty) || 1));
    const available = QUESTION_FORMATS.filter(format => format !== 'table' || TABLE_FAMILIES.includes(family));
    // Le format peut être imposé par un jeu ou laissé au générateur pour varier les entraînements.
    let format = opts.format;
    if (!format) format = pick(available);
    if (!available.includes(format)) format = 'choice';
    if (format === 'unit') return makeUnitQuestion(family);
    if (format === 'match') return makeMatchQuestion(family, level);
    if (format === 'order') return makeOrderQuestion(family, level);
    if (format === 'table') return makeTableQuestion(family, level);
    if (format === 'multi') return makeMultiQuestion(family, level);
    if (format === 'error') return makeErrorQuestion(family, level);

    const q = makeConversion(family, level);
    const correct = `${fmt(q.answer)} ${q.to}`;
    if (format === 'number') return { ...q, type: 'number', prompt: `Convertis ${fmt(q.value)} ${q.from} en ${q.to}.`, answerLabel: correct };
    // Choice remains a single-answer format; alternatives share the target unit.
    const options = chooseDistractors(q.answer, family, q.from, q.to).map(item => item);
    return { ...q, type: 'choice', prompt: `Convertis ${fmt(q.value)} ${q.from} en ${q.to}.`, options, answer: correct, answerLabel: correct };
  }

  function tableUnitsFor(family) {
    if (!FAMILIES[family]) return [];
    return Object.keys(FAMILIES[family].units).sort((a, b) => FAMILIES[family].units[a] - FAMILIES[family].units[b]);
  }

  function availableFormats(family) {
    return QUESTION_FORMATS.filter(format => format !== 'table' || TABLE_FAMILIES.includes(family));
  }

  function makeChoices(answer, family, unit) {
    const opts = [answer, neat(answer * 10), neat(answer / 10), neat(answer * 100)];
    const unique = [...new Set(opts)].slice(0,3);
    while (unique.length < 3) unique.push(neat(answer + unique.length + 1));
    return unique.sort(() => Math.random() - 0.5).map(v => `${fmt(v)} ${unit}`);
  }
  function checkAnswer(q, raw) {
    let value = raw;
    if (typeof raw === 'string' && ['match', 'order', 'multi'].includes(q.type)) {
      try { value = JSON.parse(raw); } catch { return false; }
    }
    if (q.type === 'match') {
      if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
      const keys = Object.keys(q.answer);
      return keys.every(key => value[key] === q.answer[key]) && Object.keys(value).length === keys.length;
    }
    if (q.type === 'order') {
      if (!Array.isArray(value) || value.length !== q.answer.length) return false;
      return value.every((item, index) => normalizeAnswer(item) === normalizeAnswer(q.answer[index]));
    }
    if (q.type === 'multi') {
      if (!Array.isArray(value)) return false;
      const actual = value.map(normalizeAnswer).sort();
      const expected = q.answer.map(normalizeAnswer).sort();
      return actual.length === expected.length && actual.every((item, index) => item === expected[index]);
    }
    if (q.type === 'choice' || q.type === 'unit' || q.type === 'error') {
      const a = normalizeAnswer(value).replace(/[^a-z0-9.²³]/g,'');
      const expected = normalizeAnswer(q.answer).replace(/[^a-z0-9.²³]/g,'');
      return a === expected;
    }
    // Number entry and interactive-table entry accept a decimal comma and spaced thousands,
    // but reject arbitrary text such as "abc500" that only happens to contain the right digits.
    const cleanNumber = normalizeAnswer(value).replace(/,/g, '.');
    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(cleanNumber)) return false;
    const parsed = Number(cleanNumber);
    if (!Number.isFinite(parsed)) return false;
    const target = Number(q.answer);
    const tolerance = Math.max(1e-9, Number.EPSILON * Math.max(1, Math.abs(target)) * 8);
    return Math.abs(parsed - target) <= tolerance;
  }
  function createAdaptiveState(difficulty = 1) { return {difficulty:Math.max(1,Math.min(4,difficulty)), correctStreak:0, errorStreak:0, lastErrorAt:0, answered:0, correct:0, guidedCorrect:0}; }
  function updateAdaptive(state, correct, helped = false) {
    const next = {...state, answered:state.answered + 1};
    // lastChange est un événement ponctuel : il ne doit pas persister et réafficher
    // indéfiniment un toast à chaque réponse suivante.
    delete next.lastChange;
    if (correct) {
      next.correct += 1; next.errorStreak = 0;
      if (helped) { next.guidedCorrect += 1; next.correctStreak = 0; }
      else {
        next.correctStreak += 1;
        if (next.correctStreak >= 3) { next.difficulty = Math.min(4,next.difficulty + 1); next.correctStreak = 0; next.lastChange = 'up'; }
      }
    } else {
      next.errorStreak += 1; next.correctStreak = 0; next.lastErrorAt = next.answered;
      if (next.errorStreak >= 2) { next.difficulty = Math.max(1,next.difficulty - 1); next.errorStreak = 0; next.lastChange = 'down'; }
    }
    return next;
  }
  // Niveau de départ prudent selon la région choisie ; le prétest ajuste seulement
  // la famille de compétence concernée. Il s'agit d'une heuristique à valider en classe.
  function startingDifficulty(villageId, family, pretest = null) {
    const levels = [1, 2, 3, 3];
    const idx = Math.max(0, VILLAGES.findIndex(v => v.id === villageId));
    let start = levels[idx] || 1;
    const result = pretest && pretest.byFamily && pretest.byFamily[family];
    if (result && result.total) {
      const ratio = result.correct / result.total;
      if (ratio < 0.5) start = Math.max(1, start - 1);
      else if (ratio >= 0.8) start = Math.min(4, start + 1);
    }
    return start;
  }

  function pretestRecommendation(results) {
    // Un prétest conseille un point de départ ; il ne produit pas un diagnostic validé.
    const levels = ['sentiers-moulin','clairieres-compas','canaux-artisans','hautes-terres'];
    const total = results.total || 0, score = total ? results.correct / total : 0;
    const perFamily = results.byFamily || {};
    let recommended = score < .35 ? 0 : score < .55 ? 1 : score < .76 ? 2 : 3;
    const weak = Object.entries(perFamily).filter(([,v]) => v.total && v.correct / v.total < .5).map(([k]) => k);
    if (weak.length >= 3) recommended = Math.max(0,recommended - 1);
    return { villageId:levels[recommended], villageIndex:recommended, percent:Math.round(score*100), weakFamilies:weak };
  }

  const api = {FAMILIES, VILLAGES, HOUSE_SETS, LESSONS, listHouses, lessonForHouse, convert, makeQuestion, checkAnswer, normalizeAnswer, availableFormats, tableUnitsFor, createAdaptiveState, updateAdaptive, pretestRecommendation, startingDifficulty, fmt};
  root.MesuEngine = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
