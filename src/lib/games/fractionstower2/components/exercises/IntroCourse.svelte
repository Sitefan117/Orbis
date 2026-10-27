<script lang="ts">
let steps = [
  // ============================================================
  // ÉTAGE 1 — PARTAGE ÉQUITABLE ET VOCABULAIRE
  // ============================================================
  {
    floor: 1,
    floorTitle: "Étage 1 — Le partage équitable",
    title: "1. Une fraction, c'est un partage équitable",
    theory: "Une fraction permet de représenter une quantité quand une unité est partagée en parts <strong>de même taille</strong>. Si les parts sont différentes, le partage n'est pas équitable.",
    visualDesc: `<svg viewBox="0 0 320 125" role="img" aria-label="Deux tablettes de chocolat, l'une partagée en carrés égaux et l'autre en morceaux inégaux">
      <text x="75" y="16" text-anchor="middle" font-size="11" fill="currentColor">Parts égales</text>
      <rect x="25" y="27" width="100" height="60" rx="4" fill="#8b5e3c" stroke="#4e342e" stroke-width="2"/>
      <path d="M58 27V87 M92 27V87 M25 57H125" stroke="#f3d4b2" stroke-width="2"/>
      <text x="75" y="106" text-anchor="middle" font-size="11" fill="currentColor">Équitable</text>
      <text x="235" y="16" text-anchor="middle" font-size="11" fill="currentColor">Parts inégales</text>
      <path d="M185 27H285V87H185Z" fill="#8b5e3c" stroke="#4e342e" stroke-width="2"/>
      <path d="M207 27L220 87 M255 27L246 87 M185 53L285 63" stroke="#f3d4b2" stroke-width="2"/>
      <text x="235" y="106" text-anchor="middle" font-size="11" fill="currentColor">Non équitable</text>
    </svg>`,
    example: "Tu partages une tablette de chocolat entre 4 personnes. Pour que chacun reçoive la même quantité, il faut 4 parts de même taille.",
    question: "Pour représenter un partage en quarts, les 4 parts doivent-elles être de même taille ?",
    expected: ["oui"],
    hint: "Pense à ce que chacun doit recevoir dans un partage équitable.",
    errorExplanation: "Oui. Pour parler de quarts, l'unité doit être partagée en 4 parts égales. Quatre morceaux de tailles différentes ne représentent pas quatre quarts."
  },
  {
    floor: 1,
    floorTitle: "Étage 1 — Le partage équitable",
    title: "2. Le numérateur et le dénominateur",
    theory: "Dans une fraction, le nombre du <strong>bas</strong> s'appelle le <strong>dénominateur</strong> : il indique en combien de parts égales l'unité est partagée. Le nombre du <strong>haut</strong> s'appelle le <strong>numérateur</strong> : il indique combien de parts on compte.",
    visualDesc: `<svg viewBox="0 0 320 125" role="img" aria-label="Quatre cases dont trois coloriées pour représenter trois quarts">
      <rect x="18" y="35" width="144" height="36" fill="#d9eaf7" stroke="#245b83" stroke-width="2"/>
      <rect x="18" y="35" width="36" height="36" fill="#2786c7"/>
      <rect x="54" y="35" width="36" height="36" fill="#2786c7"/>
      <rect x="90" y="35" width="36" height="36" fill="#2786c7"/>
      <path d="M54 35V71 M90 35V71 M126 35V71" stroke="#245b83" stroke-width="1.5"/>
      <text x="90" y="22" text-anchor="middle" font-size="12" fill="currentColor">3 parts prises</text>
      <text x="90" y="88" text-anchor="middle" font-size="12" fill="currentColor">4 parts en tout</text>
      <text x="220" y="42" text-anchor="middle" font-size="12" fill="currentColor">Numérateur</text>
      <path d="M220 46V52" stroke="currentColor" stroke-width="1.5"/>
      <text x="220" y="69" text-anchor="middle" font-size="24" fill="currentColor">3</text>
      <path d="M201 75H239" stroke="currentColor" stroke-width="2"/>
      <text x="220" y="99" text-anchor="middle" font-size="24" fill="currentColor">4</text>
      <text x="220" y="115" text-anchor="middle" font-size="12" fill="currentColor">Dénominateur</text>
    </svg>`,
    example: "Dans 3/4, le 4 indique que la tablette est partagée en 4 parts égales. Le 3 indique que l'on compte 3 de ces parts.",
    question: "Dans la fraction 3/4, comment s'appelle le nombre du haut ?",
    expected: ["numérateur", "le numérateur"],
    hint: "C'est le nombre qui compte les parts prises.",
    errorExplanation: "Le nombre du haut est le numérateur. Dans 3/4, le numérateur est 3 et le dénominateur est 4."
  },
  {
    floor: 1,
    floorTitle: "Étage 1 — Le partage équitable",
    title: "3. Comment lire une fraction ?",
    theory: "Le nombre du bas donne le nom des parts. On dit par exemple <strong>un demi</strong> pour 1/2, <strong>un tiers</strong> pour 1/3 et <strong>un quart</strong> pour 1/4. Pour 3/4, on dit <strong>trois quarts</strong>.",
    visualDesc: `<svg viewBox="0 0 320 100" role="img" aria-label="Trois bandes représentant un demi, un tiers et un quart">
      <g transform="translate(12 12)">
        <rect width="82" height="24" fill="#e7e5e4" stroke="#555"/>
        <rect width="41" height="24" fill="#2786c7" stroke="#555"/>
        <text x="41" y="43" text-anchor="middle" font-size="12" fill="currentColor">1/2 : un demi</text>
      </g>
      <g transform="translate(119 12)">
        <rect width="82" height="24" fill="#e7e5e4" stroke="#555"/>
        <rect width="27.3" height="24" fill="#2786c7" stroke="#555"/>
        <path d="M27.3 0V24 M54.6 0V24" stroke="#555"/>
        <text x="41" y="43" text-anchor="middle" font-size="12" fill="currentColor">1/3 : un tiers</text>
      </g>
      <g transform="translate(226 12)">
        <rect width="82" height="24" fill="#e7e5e4" stroke="#555"/>
        <rect width="20.5" height="24" fill="#2786c7" stroke="#555"/>
        <path d="M20.5 0V24 M41 0V24 M61.5 0V24" stroke="#555"/>
        <text x="41" y="43" text-anchor="middle" font-size="12" fill="currentColor">1/4 : un quart</text>
      </g>
    </svg>`,
    example: "Une recette demande 1/2 litre de lait : cela signifie un demi-litre, donc la moitié d'un litre.",
    question: "Comment nomme-t-on une fraction dont le dénominateur est 3, par exemple 1/3 ?",
    expected: ["tiers", "un tiers", "des tiers"],
    hint: "On partage l'unité en trois parts égales.",
    errorExplanation: "1/3 se lit « un tiers ». Le dénominateur 3 indique que l'unité est divisée en trois parts égales."
  },

  // ============================================================
  // ÉTAGE 2 — LIRE ET REPRÉSENTER
  // ============================================================
  {
    floor: 2,
    floorTitle: "Étage 2 — Lire et représenter",
    title: "1. Lire une fraction en chiffres",
    theory: "Une fraction s'écrit avec deux nombres séparés par une barre. Le numérateur est en haut et le dénominateur en bas. Pour lire 3/5, on peut dire « trois cinquièmes » ou « trois sur cinq ».",
    visualDesc: `<svg viewBox="0 0 320 100" role="img" aria-label="Cinq cases, dont trois colorées, représentant trois cinquièmes">
      <g transform="translate(20 18)">
        <rect width="140" height="34" fill="#e5e7eb" stroke="#374151" stroke-width="1.5"/>
        <rect width="28" height="34" fill="#2786c7"/>
        <rect x="28" width="28" height="34" fill="#2786c7"/>
        <rect x="56" width="28" height="34" fill="#2786c7"/>
        <path d="M28 0V34 M56 0V34 M84 0V34 M112 0V34" stroke="#374151"/>
      </g>
      <text x="90" y="72" text-anchor="middle" font-size="13" fill="currentColor">3 parts colorées sur 5</text>
      <text x="235" y="39" text-anchor="middle" font-size="25" fill="currentColor">3/5</text>
      <text x="235" y="63" text-anchor="middle" font-size="13" fill="currentColor">trois cinquièmes</text>
    </svg>`,
    example: "Sur une boîte de 5 biscuits, tu en manges 3. La quantité mangée représente 3/5 de la boîte.",
    question: "Écris en chiffres « quatre septièmes » sous la forme d'une fraction.",
    expected: ["4/7", "4 / 7"],
    hint: "Écris 4 au numérateur et 7 au dénominateur.",
    errorExplanation: "« Quatre septièmes » s'écrit 4/7 : le nombre de parts comptées est en haut et le nombre total de parts égales est en bas."
  },
  {
    floor: 2,
    floorTitle: "Étage 2 — Lire et représenter",
    title: "2. Passer des chiffres au dessin",
    theory: "Pour représenter une fraction, dessine une unité et partage-la en autant de parts égales que l'indique le dénominateur. Colorie ensuite le nombre de parts indiqué par le numérateur.",
    visualDesc: `<svg viewBox="0 0 320 100" role="img" aria-label="Méthode pour représenter deux tiers : trois cases égales dont deux colorées">
      <text x="160" y="14" text-anchor="middle" font-size="12" fill="currentColor">Représenter 2/3</text>
      <rect x="70" y="25" width="60" height="35" fill="#2786c7" stroke="#245b83" stroke-width="1.5"/>
      <rect x="130" y="25" width="60" height="35" fill="#2786c7" stroke="#245b83" stroke-width="1.5"/>
      <rect x="190" y="25" width="60" height="35" fill="#e5e7eb" stroke="#245b83" stroke-width="1.5"/>
      <text x="160" y="80" text-anchor="middle" font-size="12" fill="currentColor">3 parts égales, 2 coloriées</text>
    </svg>`,
    example: "Pour représenter 2/3 d'une barre de céréales, partage la barre en 3 morceaux de même taille, puis colorie-en 2.",
    question: "Pour représenter 3/8, en combien de parts égales faut-il partager l'unité ?",
    expected: ["8", "huit"],
    hint: "Regarde le nombre placé en bas de la fraction.",
    errorExplanation: "Il faut 8 parts égales, car le dénominateur de 3/8 est 8. On en coloriera ensuite 3."
  },
  {
    floor: 2,
    floorTitle: "Étage 2 — Lire et représenter",
    title: "3. Relier dessin, fraction et mots",
    theory: "Le dessin, l'écriture en chiffres et le nom de la fraction représentent la même quantité. Vérifie toujours deux choses : le nombre total de parts égales, puis le nombre de parts coloriées.",
    visualDesc: `<svg viewBox="0 0 320 95" role="img" aria-label="Deux parts coloriées sur quatre, soit deux quarts">
      <g transform="translate(18 20)">
        <rect width="120" height="28" fill="#e5e7eb" stroke="#374151"/>
        <rect width="60" height="28" fill="#2786c7"/>
        <path d="M30 0V28 M60 0V28 M90 0V28" stroke="#374151"/>
      </g>
      <text x="158" y="39" font-size="20" fill="currentColor">= 2/4</text>
      <text x="240" y="39" font-size="14" fill="currentColor">deux quarts</text>
      <text x="160" y="76" text-anchor="middle" font-size="12" fill="currentColor">2 parts coloriées sur 4 parts égales</text>
    </svg>`,
    example: "Deux parts coloriées sur quatre se notent 2/4 et se lisent « deux quarts ».",
    question: "Comment se lit la fraction 5/6 ?",
    expected: ["cinq sixièmes", "cinq sixieme", "cinq sur six"],
    hint: "Le numérateur se lit d'abord, puis le nom donné par le dénominateur.",
    errorExplanation: "5/6 se lit « cinq sixièmes » : on compte cinq parts parmi six parts égales."
  },

  // ============================================================
  // ÉTAGE 3 — DROITE GRADUÉE
  // ============================================================
  {
    floor: 3,
    floorTitle: "Étage 3 — La droite graduée",
    title: "1. Partager l'unité en intervalles égaux",
    theory: "Sur une droite graduée, l'espace entre 0 et 1 représente une unité. Pour placer une fraction, on partage cet espace en intervalles <strong>égaux</strong>.",
    visualDesc: `<svg viewBox="0 0 320 90" role="img" aria-label="Segment de zéro à un divisé en quatre intervalles égaux">
      <path d="M30 42H290" stroke="currentColor" stroke-width="2"/>
      <path d="M30 32V52 M95 32V52 M160 32V52 M225 32V52 M290 32V52" stroke="currentColor" stroke-width="2"/>
      <text x="30" y="23" text-anchor="middle" font-size="12" fill="currentColor">0</text>
      <text x="290" y="23" text-anchor="middle" font-size="12" fill="currentColor">1</text>
      <text x="160" y="72" text-anchor="middle" font-size="12" fill="currentColor">4 intervalles égaux</text>
    </svg>`,
    example: "Sur une droite allant de 0 à 1, si tu partages l'espace en 4 intervalles égaux, chaque intervalle vaut 1/4.",
    question: "Entre 0 et 1, tu partages la droite en 6 intervalles égaux. Quel est le dénominateur des fractions représentées par les graduations ?",
    expected: ["6", "six"],
    hint: "Le dénominateur compte les intervalles entre 0 et 1.",
    errorExplanation: "Le dénominateur est 6, car l'unité entre 0 et 1 est partagée en six intervalles égaux."
  },
  {
    floor: 3,
    floorTitle: "Étage 3 — La droite graduée",
    title: "2. Le dénominateur donne les pas",
    theory: "Le dénominateur indique en combien d'intervalles égaux l'unité est partagée. Si le dénominateur vaut 5, chaque intervalle représente un cinquième.",
    visualDesc: `<svg viewBox="0 0 320 90" role="img" aria-label="Droite graduée de zéro à un avec cinq intervalles">
      <path d="M25 40H295" stroke="currentColor" stroke-width="2"/>
      <path d="M25 30V50 M79 30V50 M133 30V50 M187 30V50 M241 30V50 M295 30V50" stroke="currentColor" stroke-width="2"/>
      <text x="25" y="20" text-anchor="middle" font-size="12" fill="currentColor">0</text>
      <text x="295" y="20" text-anchor="middle" font-size="12" fill="currentColor">1</text>
      <text x="160" y="70" text-anchor="middle" font-size="12" fill="currentColor">Chaque pas vaut 1/5</text>
    </svg>`,
    example: "Si un trajet d'un kilomètre est partagé en 5 portions égales, chaque portion représente 1/5 du kilomètre.",
    question: "Sur une droite de 0 à 1 partagée en 5 intervalles égaux, quelle fraction représente le premier trait après 0 ?",
    expected: ["1/5", "1 / 5"],
    hint: "Le premier trait correspond à un seul intervalle.",
    errorExplanation: "Le premier trait après 0 représente 1/5 : un intervalle parcouru sur les cinq que compte l'unité."
  },
  {
    floor: 3,
    floorTitle: "Étage 3 — La droite graduée",
    title: "3. Le numérateur compte les pas",
    theory: "Le numérateur indique combien d'intervalles on parcourt à partir de 0. Pour placer 3/5, on avance de trois pas sur une droite où l'unité est partagée en cinq intervalles égaux.",
    visualDesc: `<svg viewBox="0 0 320 95" role="img" aria-label="Le point trois cinquièmes placé à la troisième graduation sur cinq">
      <path d="M25 42H295" stroke="currentColor" stroke-width="2"/>
      <path d="M25 32V52 M79 32V52 M133 32V52 M187 32V52 M241 32V52 M295 32V52" stroke="currentColor" stroke-width="2"/>
      <circle cx="187" cy="42" r="6" fill="#2786c7"/>
      <text x="25" y="22" text-anchor="middle" font-size="12" fill="currentColor">0</text>
      <text x="187" y="22" text-anchor="middle" font-size="12" fill="currentColor">3/5</text>
      <text x="295" y="22" text-anchor="middle" font-size="12" fill="currentColor">1</text>
      <text x="160" y="76" text-anchor="middle" font-size="12" fill="currentColor">3 pas sur 5</text>
    </svg>`,
    example: "Pour placer 4/6, partage l'unité en 6 intervalles égaux, puis compte 4 intervalles depuis 0.",
    question: "Sur une droite de 0 à 1 partagée en 5 intervalles égaux, quelle fraction représente le troisième trait après 0 ?",
    expected: ["3/5", "3 / 5"],
    hint: "Le dénominateur est 5 et tu as avancé de 3 pas.",
    errorExplanation: "La fraction est 3/5 : les cinq intervalles sont indiqués par le dénominateur, et le troisième trait correspond à trois pas depuis 0."
  },

  // ============================================================
  // ÉTAGE 4 — FRACTIONS ÉQUIVALENTES
  // ============================================================
  {
    floor: 4,
    floorTitle: "Étage 4 — Équivalences et simplification",
    title: "1. Une même quantité, plusieurs fractions",
    theory: "Deux fractions sont <strong>équivalentes</strong> quand elles représentent la même quantité. Les nombres peuvent changer, mais la quantité représentée reste identique.",
    visualDesc: `<svg viewBox="0 0 320 105" role="img" aria-label="Trois bandes de même longueur représentant une moitié, deux quarts et quatre huitièmes">
      <g transform="translate(10 12)">
        <rect width="84" height="22" fill="#e5e7eb" stroke="#374151"/>
        <rect width="42" height="22" fill="#2786c7"/>
        <text x="42" y="40" text-anchor="middle" font-size="12" fill="currentColor">1/2</text>
      </g>
      <g transform="translate(118 12)">
        <rect width="84" height="22" fill="#e5e7eb" stroke="#374151"/>
        <rect width="42" height="22" fill="#2786c7"/>
        <path d="M21 0V22 M42 0V22 M63 0V22" stroke="#374151"/>
        <text x="42" y="40" text-anchor="middle" font-size="12" fill="currentColor">2/4</text>
      </g>
      <g transform="translate(226 12)">
        <rect width="84" height="22" fill="#e5e7eb" stroke="#374151"/>
        <rect width="42" height="22" fill="#2786c7"/>
        <path d="M10.5 0V22 M21 0V22 M31.5 0V22 M42 0V22 M52.5 0V22 M63 0V22 M73.5 0V22" stroke="#374151"/>
        <text x="42" y="40" text-anchor="middle" font-size="12" fill="currentColor">4/8</text>
      </g>
      <text x="160" y="82" text-anchor="middle" font-size="13" fill="currentColor">La quantité coloriée est la même.</text>
    </svg>`,
    example: "Une demi-pizza représente la même quantité que deux quarts de cette même pizza.",
    question: "Les fractions 1/2 et 2/4 représentent-elles la même quantité ? Réponds par oui ou non.",
    expected: ["oui"],
    hint: "Compare la quantité coloriée, pas le nombre de morceaux.",
    errorExplanation: "Oui. Une moitié et deux quarts couvrent la même quantité. Les parts sont découpées différemment, mais la surface coloriée reste identique."
  },
  {
    floor: 4,
    floorTitle: "Étage 4 — Équivalences et simplification",
    title: "2. Fabriquer une fraction équivalente",
    theory: "Pour obtenir une fraction équivalente, on multiplie le numérateur <strong>et</strong> le dénominateur par le même nombre non nul. La quantité représentée ne change pas.",
    visualDesc: `<svg viewBox="0 0 320 100" role="img" aria-label="Une moitié transformée en deux quarts en multipliant le numérateur et le dénominateur par deux">
      <text x="72" y="38" text-anchor="middle" font-size="23" fill="currentColor">1/2</text>
      <path d="M110 34H205" stroke="#2786c7" stroke-width="2.5"/>
      <path d="M195 26L205 34L195 42" fill="none" stroke="#2786c7" stroke-width="2.5"/>
      <text x="160" y="20" text-anchor="middle" font-size="11" fill="currentColor">× 2 en haut et en bas</text>
      <text x="245" y="38" text-anchor="middle" font-size="23" fill="currentColor">2/4</text>
      <text x="160" y="70" text-anchor="middle" font-size="13" fill="currentColor">Même quantité, nouvelle écriture</text>
    </svg>`,
    example: "Pour transformer 1/2 en une fraction de dénominateur 4, on fait 2 × 2 = 4 en bas. On fait aussi 1 × 2 = 2 en haut : 1/2 = 2/4.",
    question: "Complète : 2/3 = ?/6. Quel nombre doit remplacer le point d'interrogation ?",
    expected: ["4"],
    hint: "Pour passer de 3 à 6, tu multiplies le dénominateur par 2.",
    errorExplanation: "Le dénominateur passe de 3 à 6 en étant multiplié par 2. Il faut donc aussi multiplier le numérateur par 2 : 2 × 2 = 4. La fraction équivalente est 4/6."
  },
  {
    floor: 4,
    floorTitle: "Étage 4 — Équivalences et simplification",
    title: "3. Simplifier une fraction",
    theory: "Simplifier une fraction, c'est écrire la même quantité avec des nombres plus petits. On divise le numérateur et le dénominateur par le même nombre, à condition que les deux divisions tombent juste.",
    visualDesc: `<svg viewBox="0 0 320 100" role="img" aria-label="Quatre huitièmes simplifiés en une moitié">
      <text x="70" y="35" text-anchor="middle" font-size="23" fill="currentColor">4/8</text>
      <path d="M112 32H205" stroke="#2786c7" stroke-width="2.5"/>
      <path d="M195 24L205 32L195 40" fill="none" stroke="#2786c7" stroke-width="2.5"/>
      <text x="158" y="20" text-anchor="middle" font-size="11" fill="currentColor">÷ 4 en haut et en bas</text>
      <text x="245" y="35" text-anchor="middle" font-size="23" fill="currentColor">1/2</text>
      <text x="160" y="70" text-anchor="middle" font-size="13" fill="currentColor">La quantité ne change pas.</text>
    </svg>`,
    example: "4/8 se simplifie en 1/2 : 4 ÷ 4 = 1 et 8 ÷ 4 = 2.",
    question: "Simplifie 3/6 en divisant le numérateur et le dénominateur par 3.",
    expected: ["1/2", "1 / 2"],
    hint: "Calcule 3 ÷ 3 en haut et 6 ÷ 3 en bas.",
    errorExplanation: "3 ÷ 3 = 1 et 6 ÷ 3 = 2. Donc 3/6 = 1/2. Les deux nombres doivent être divisés par le même nombre."
  },

  // ============================================================
  // ÉTAGE 5 — COMPARER ET ORDONNER
  // ============================================================
  {
    floor: 5,
    floorTitle: "Étage 5 — Comparer et ordonner",
    title: "1. Même dénominateur : comparer le haut",
    theory: "Quand deux fractions ont le même dénominateur, les parts ont la même taille. La fraction qui a le plus grand numérateur représente la plus grande quantité.",
    visualDesc: `<svg viewBox="0 0 320 100" role="img" aria-label="Comparaison de trois huitièmes et cinq huitièmes">
      <text x="14" y="15" font-size="12" fill="currentColor">3/8</text>
      <g transform="translate(14 23)">
        <rect width="136" height="20" fill="#e5e7eb" stroke="#374151"/>
        <rect width="51" height="20" fill="#2786c7"/>
        <path d="M17 0V20 M34 0V20 M51 0V20 M68 0V20 M85 0V20 M102 0V20 M119 0V20" stroke="#374151"/>
      </g>
      <text x="14" y="63" font-size="12" fill="currentColor">5/8</text>
      <g transform="translate(14 71)">
        <rect width="136" height="20" fill="#e5e7eb" stroke="#374151"/>
        <rect width="85" height="20" fill="#2786c7"/>
        <path d="M17 0V20 M34 0V20 M51 0V20 M68 0V20 M85 0V20 M102 0V20 M119 0V20" stroke="#374151"/>
      </g>
      <text x="228" y="49" text-anchor="middle" font-size="20" fill="currentColor">3/8 &lt; 5/8</text>
    </svg>`,
    example: "Trois huitièmes de tablette, c'est moins que cinq huitièmes : les carrés sont de la même taille, mais il y en a moins.",
    question: "Complète avec <, > ou = : 3/8 __ 5/8. Écris uniquement le symbole.",
    expected: ["<"],
    hint: "Les deux dénominateurs sont identiques : compare 3 et 5.",
    errorExplanation: "Le bon symbole est <. Les parts ont la même taille et 3 parts sont moins nombreuses que 5 parts : 3/8 < 5/8."
  },
  {
    floor: 5,
    floorTitle: "Étage 5 — Comparer et ordonner",
    title: "2. Même numérateur : comparer le bas",
    theory: "Quand le numérateur est identique, les fractions ne sont pas forcément égales. Si on prend le même nombre de parts, des parts plus grandes donnent une quantité plus grande. Un plus petit dénominateur signifie des parts plus grandes.",
    visualDesc: `<svg viewBox="0 0 320 100" role="img" aria-label="Un tiers comparé à un dixième">
      <text x="12" y="15" font-size="12" fill="currentColor">1/3</text>
      <g transform="translate(12 23)">
        <rect width="132" height="22" fill="#e5e7eb" stroke="#374151"/>
        <rect width="44" height="22" fill="#2786c7"/>
        <path d="M44 0V22 M88 0V22" stroke="#374151"/>
      </g>
      <text x="12" y="62" font-size="12" fill="currentColor">1/10</text>
      <g transform="translate(12 70)">
        <rect width="132" height="22" fill="#e5e7eb" stroke="#374151"/>
        <rect width="13.2" height="22" fill="#2786c7"/>
        <path d="M13.2 0V22 M26.4 0V22 M39.6 0V22 M52.8 0V22 M66 0V22 M79.2 0V22 M92.4 0V22 M105.6 0V22 M118.8 0V22" stroke="#374151"/>
      </g>
      <text x="235" y="52" text-anchor="middle" font-size="20" fill="currentColor">1/3 &gt; 1/10</text>
    </svg>`,
    example: "Un tiers d'une pizza est plus grand qu'un dixième de la même pizza. Dans les deux cas, on prend une seule part, mais les parts n'ont pas la même taille.",
    question: "Quelle fraction est la plus grande : 1/3 ou 1/10 ? Écris la fraction.",
    expected: ["1/3", "1 / 3"],
    hint: "Un tiers est une grosse part ; un dixième est une petite part.",
    errorExplanation: "1/3 est plus grand que 1/10. Quand le numérateur est le même, un dénominateur plus petit correspond à des parts plus grandes."
  },
  {
    floor: 5,
    floorTitle: "Étage 5 — Comparer et ordonner",
    title: "3. Reconnaître deux fractions égales",
    theory: "Pour comparer deux fractions, regarde d'abord si elles représentent la même quantité. Par exemple, 1/2 et 2/4 sont équivalentes : elles représentent toutes les deux la moitié.",
    visualDesc: `<svg viewBox="0 0 320 80" role="img" aria-label="Une moitié égale à deux quarts">
      <g transform="translate(12 15)">
        <rect width="100" height="22" fill="#e5e7eb" stroke="#374151"/>
        <rect width="50" height="22" fill="#2786c7"/>
        <text x="50" y="42" text-anchor="middle" font-size="12" fill="currentColor">1/2</text>
      </g>
      <text x="160" y="32" text-anchor="middle" font-size="22" fill="currentColor">=</text>
      <g transform="translate(208 15)">
        <rect width="100" height="22" fill="#e5e7eb" stroke="#374151"/>
        <rect width="50" height="22" fill="#2786c7"/>
        <path d="M25 0V22 M50 0V22 M75 0V22" stroke="#374151"/>
        <text x="50" y="42" text-anchor="middle" font-size="12" fill="currentColor">2/4</text>
      </g>
    </svg>`,
    example: "Deux quarts de pizza correspondent à la moitié d'une pizza. Les deux écritures représentent la même quantité.",
    question: "Quel symbole faut-il placer entre 1/2 et 2/4 ? Écris uniquement le symbole.",
    expected: ["="],
    hint: "Les deux fractions représentent-elles la même quantité ?",
    errorExplanation: "Le symbole est =, car 1/2 et 2/4 représentent exactement la même quantité."
  },
  {
    floor: 5,
    floorTitle: "Étage 5 — Comparer et ordonner",
    title: "4. Quand le haut et le bas diffèrent",
    theory: "Quand les deux nombres changent, ne compare pas seulement les numérateurs ou les dénominateurs. Compare les <strong>quantités</strong> : les bandes ont la même longueur, et une droite graduée aide à voir laquelle est la plus proche de 1.",
    visualDesc: `<svg viewBox="0 0 320 135" role="img" aria-label="Quatre neuvièmes est plus petit que trois cinquièmes même si quatre est plus grand que trois">
      <text x="18" y="17" font-size="12" fill="currentColor">4/9</text>
      <rect x="18" y="24" width="126" height="20" rx="4" fill="#e7e2d8" stroke="#796c59"/>
      <rect x="18" y="24" width="56" height="20" rx="4" fill="#668f86"/>
      <path d="M32 24V44 M46 24V44 M60 24V44 M74 24V44 M88 24V44 M102 24V44 M116 24V44 M130 24V44" stroke="#796c59"/>
      <text x="18" y="65" font-size="12" fill="currentColor">3/5</text>
      <rect x="18" y="72" width="126" height="20" rx="4" fill="#e7e2d8" stroke="#796c59"/>
      <rect x="18" y="72" width="76" height="20" rx="4" fill="#668f86"/>
      <path d="M43 72V92 M68 72V92 M93 72V92 M118 72V92" stroke="#796c59"/>
      <path d="M171 107H298" stroke="#584a3b" stroke-width="2"/>
      <path d="M171 102V112 M234 102V112 M298 102V112" stroke="#584a3b" stroke-width="2"/>
      <circle cx="228" cy="107" r="5" fill="#bd7c3c"/>
      <circle cx="247" cy="107" r="5" fill="#496f9a"/>
      <text x="171" y="128" font-size="11" fill="currentColor">0</text>
      <text x="298" y="128" text-anchor="end" font-size="11" fill="currentColor">1</text>
      <text x="231" y="78" text-anchor="middle" font-size="15" fill="currentColor">4/9 &lt; 3/5</text>
    </svg>`,
    example: "4/9 est un peu plus petit que 1/2, tandis que 3/5 est un peu plus grand que 1/2. Donc 4/9 < 3/5, même si 4 est plus grand que 3.",
    question: "Complète avec <, > ou = : 4/9 __ 3/5. Écris uniquement le symbole.",
    expected: ["<"],
    hint: "Ne compare pas seulement 4 et 3. Repère les deux fractions par rapport à 1/2.",
    errorExplanation: "4/9 est légèrement inférieur à 1/2, alors que 3/5 est supérieur à 1/2. La quantité 4/9 est donc plus petite : 4/9 < 3/5."
  },

  // ============================================================
  // ÉTAGE 6 — FRACTIONS DÉCIMALES ET NOMBRES DÉCIMAUX
  // ============================================================
  {
    floor: 6,
    floorTitle: "Étage 6 — Fractions décimales",
    title: "1. Les fractions décimales",
    theory: "Une fraction décimale a pour dénominateur 10, 100, 1 000, etc. Ces fractions sont pratiques pour représenter des dixièmes, des centièmes ou des millièmes.",
    visualDesc: `<svg viewBox="0 0 320 90" role="img" aria-label="Dix cases dont sept coloriées pour représenter sept dixièmes">
      <g transform="translate(20 18)">
        <rect width="280" height="30" fill="#e5e7eb" stroke="#374151"/>
        <rect width="196" height="30" fill="#2786c7"/>
        <path d="M28 0V30 M56 0V30 M84 0V30 M112 0V30 M140 0V30 M168 0V30 M196 0V30 M224 0V30 M252 0V30" stroke="#374151"/>
      </g>
      <text x="160" y="70" text-anchor="middle" font-size="13" fill="currentColor">7/10 = sept dixièmes</text>
    </svg>`,
    example: "Un euro contient 100 centimes. 25 centimes représentent 25/100 d'euro.",
    question: "Quel est le dénominateur de la fraction décimale 34/100 ?",
    expected: ["100", "cent"],
    hint: "Le dénominateur est le nombre placé sous la barre.",
    errorExplanation: "Le dénominateur est 100. La fraction 34/100 représente 34 centièmes."
  },
  {
    floor: 6,
    floorTitle: "Étage 6 — Fractions décimales",
    title: "2. Passer des dixièmes à la virgule",
    theory: "Quand le dénominateur est 10, le numérateur indique le nombre de dixièmes. Pour écrire la fraction en nombre décimal, on place les dixièmes après la virgule.",
    visualDesc: `<svg viewBox="0 0 320 85" role="img" aria-label="Sept dixièmes correspondent à zéro virgule sept">
      <text x="82" y="36" text-anchor="middle" font-size="24" fill="currentColor">7/10</text>
      <path d="M125 32H194" stroke="#2786c7" stroke-width="2.5"/>
      <path d="M184 24L194 32L184 40" fill="none" stroke="#2786c7" stroke-width="2.5"/>
      <text x="250" y="36" text-anchor="middle" font-size="24" fill="currentColor">0,7</text>
      <text x="160" y="67" text-anchor="middle" font-size="12" fill="currentColor">Sept dixièmes</text>
    </svg>`,
    example: "7/10 = 0,7. Il y a sept dixièmes et aucun entier complet.",
    question: "Écris 7/10 sous forme de nombre décimal.",
    expected: ["0,7", "0.7"],
    hint: "Sept dixièmes s'écrivent avec 7 au rang des dixièmes.",
    errorExplanation: "7/10 = 0,7. Le 7 est placé juste après la virgule, au rang des dixièmes. La virgule ou le point sont acceptés."
  },
  {
    floor: 6,
    floorTitle: "Étage 6 — Fractions décimales",
    title: "3. Passer des centièmes à la virgule",
    theory: "Quand le dénominateur est 100, le numérateur indique le nombre de centièmes. Les deux premiers chiffres après la virgule correspondent aux dixièmes et aux centièmes. Si nécessaire, on ajoute un zéro.",
    visualDesc: `<svg viewBox="0 0 320 85" role="img" aria-label="Trente-quatre centièmes correspondent à zéro virgule trente-quatre">
      <text x="76" y="36" text-anchor="middle" font-size="24" fill="currentColor">34/100</text>
      <path d="M125 32H194" stroke="#2786c7" stroke-width="2.5"/>
      <path d="M184 24L194 32L184 40" fill="none" stroke="#2786c7" stroke-width="2.5"/>
      <text x="253" y="36" text-anchor="middle" font-size="24" fill="currentColor">0,34</text>
      <text x="160" y="67" text-anchor="middle" font-size="12" fill="currentColor">Trente-quatre centièmes</text>
    </svg>`,
    example: "34/100 = 0,34. Pour l'argent, 34 centimes correspondent à 0,34 CHF.",
    question: "Écris 34/100 sous forme de nombre décimal.",
    expected: ["0,34", "0.34"],
    hint: "Il faut deux chiffres après la virgule pour représenter des centièmes.",
    errorExplanation: "34/100 = 0,34. Le 3 représente trois dixièmes et le 4 représente quatre centièmes. La virgule ou le point sont acceptés."
  },

  // ============================================================
  // ÉTAGE 7 — ADDITION ET SOUSTRACTION, MÊME DÉNOMINATEUR
  // ============================================================
  {
    floor: 7,
    floorTitle: "Étage 7 — Opérations avec le même dénominateur",
    title: "1. Additionner des fractions de même dénominateur",
    theory: "Si les dénominateurs sont identiques, les parts ont la même taille. Pour additionner les fractions, on additionne les numérateurs et on garde le dénominateur.",
    visualDesc: `<svg viewBox="0 0 320 105" role="img" aria-label="Deux huitièmes plus trois huitièmes donnent cinq huitièmes">
      <text x="12" y="15" font-size="12" fill="currentColor">2/8</text>
      <g transform="translate(12 22)">
        <rect width="104" height="20" fill="#e5e7eb" stroke="#374151"/>
        <rect width="26" height="20" fill="#2786c7"/>
        <path d="M13 0V20 M26 0V20 M39 0V20 M52 0V20 M65 0V20 M78 0V20 M91 0V20" stroke="#374151"/>
      </g>
      <text x="160" y="36" text-anchor="middle" font-size="20" fill="currentColor">+</text>
      <text x="204" y="15" font-size="12" fill="currentColor">3/8</text>
      <g transform="translate(204 22)">
        <rect width="104" height="20" fill="#e5e7eb" stroke="#374151"/>
        <rect width="39" height="20" fill="#2786c7"/>
        <path d="M13 0V20 M26 0V20 M39 0V20 M52 0V20 M65 0V20 M78 0V20 M91 0V20" stroke="#374151"/>
      </g>
      <text x="160" y="73" text-anchor="middle" font-size="16" fill="currentColor">2/8 + 3/8 = 5/8</text>
      <text x="160" y="93" text-anchor="middle" font-size="12" fill="currentColor">2 parts + 3 parts = 5 parts sur 8</text>
    </svg>`,
    example: "Tu manges 2 carrés d'une tablette de 8 carrés, puis encore 3 carrés. Tu as mangé 5/8 de la tablette.",
    question: "Calcule 3/8 + 2/8. Écris le résultat sous forme de fraction.",
    expected: ["5/8", "5 / 8"],
    hint: "Additionne les nombres du haut et garde le 8 en bas.",
    errorExplanation: "3 + 2 = 5. Le dénominateur reste 8, car les parts sont toujours des huitièmes. Le résultat est 5/8."
  },
  {
    floor: 7,
    floorTitle: "Étage 7 — Opérations avec le même dénominateur",
    title: "2. Soustraire des fractions de même dénominateur",
    theory: "Pour soustraire des fractions de même dénominateur, on soustrait les numérateurs et on garde le dénominateur. On retire des parts de même taille.",
    visualDesc: `<svg viewBox="0 0 320 90" role="img" aria-label="Cinq huitièmes moins deux huitièmes donnent trois huitièmes">
      <text x="12" y="15" font-size="12" fill="currentColor">5/8</text>
      <g transform="translate(12 22)">
        <rect width="144" height="22" fill="#e5e7eb" stroke="#374151"/>
        <rect width="90" height="22" fill="#2786c7"/>
        <path d="M18 0V22 M36 0V22 M54 0V22 M72 0V22 M90 0V22 M108 0V22 M126 0V22" stroke="#374151"/>
      </g>
      <path d="M166 33H194" stroke="#c2410c" stroke-width="2.5"/>
      <path d="M174 25L166 33L174 41" fill="none" stroke="#c2410c" stroke-width="2.5"/>
      <text x="215" y="15" font-size="12" fill="currentColor">2/8 retirés</text>
      <text x="160" y="70" text-anchor="middle" font-size="16" fill="currentColor">5/8 − 2/8 = 3/8</text>
    </svg>`,
    example: "Tu as 5/8 d'une tablette. Tu en manges 2/8. Il reste 3/8 de la tablette.",
    question: "Calcule 6/9 − 2/9. Écris le résultat sous forme de fraction.",
    expected: ["4/9", "4 / 9"],
    hint: "Calcule 6 − 2 et conserve le dénominateur 9.",
    errorExplanation: "6 − 2 = 4. Le dénominateur reste 9, car les parts ont toujours la même taille. Le résultat est 4/9."
  },

  // ============================================================
  // ÉTAGE 8 — DÉNOMINATEURS DIFFÉRENTS
  // ============================================================
  {
    floor: 8,
    floorTitle: "Étage 8 — Dénominateurs différents",
    title: "1. Pourquoi faut-il le même dénominateur ?",
    theory: "On ne peut pas additionner directement des fractions dont les parts n'ont pas la même taille. Il faut d'abord écrire les fractions avec un <strong>même dénominateur</strong>, pour compter des parts de même taille.",
    visualDesc: `<svg viewBox="0 0 320 95" role="img" aria-label="Une moitié et un quart sont des parts de tailles différentes">
      <text x="16" y="15" font-size="12" fill="currentColor">1/2</text>
      <g transform="translate(16 22)">
        <rect width="100" height="24" fill="#e5e7eb" stroke="#374151"/>
        <rect width="50" height="24" fill="#2786c7"/>
      </g>
      <text x="160" y="39" text-anchor="middle" font-size="22" fill="currentColor">≠</text>
      <text x="205" y="15" font-size="12" fill="currentColor">1/4</text>
      <g transform="translate(205 22)">
        <rect width="100" height="24" fill="#e5e7eb" stroke="#374151"/>
        <rect width="25" height="24" fill="#2786c7"/>
        <path d="M25 0V24 M50 0V24 M75 0V24" stroke="#374151"/>
      </g>
      <text x="160" y="76" text-anchor="middle" font-size="12" fill="currentColor">Un demi et un quart ne sont pas des parts de même taille.</text>
    </svg>`,
    example: "Une demi-pizza et un quart de pizza ne sont pas des parts de même taille. Pour les additionner, on peut transformer 1/2 en 2/4.",
    question: "Avant d'additionner 1/2 et 1/4, faut-il les écrire avec le même dénominateur ?",
    expected: ["oui"],
    hint: "Demande-toi si un demi et un quart sont des parts de même taille.",
    errorExplanation: "Oui. Les deux fractions doivent avoir le même dénominateur pour compter des parts de même taille. Ici, on peut transformer 1/2 en 2/4."
  },
  {
    floor: 8,
    floorTitle: "Étage 8 — Dénominateurs différents",
    title: "2. Transformer une fraction sans changer sa valeur",
    theory: "Pour passer à un dénominateur commun, on peut multiplier le numérateur et le dénominateur par le même nombre. La fraction garde la même valeur : on change le découpage, pas la quantité.",
    visualDesc: `<svg viewBox="0 0 320 110" role="img" aria-label="Une moitié devient deux quarts : multiplication du numérateur et du dénominateur par deux">
      <text x="60" y="24" text-anchor="middle" font-size="20" fill="currentColor">1/2</text>
      <path d="M90 20H220" stroke="#2786c7" stroke-width="2.5"/>
      <path d="M210 12L220 20L210 28" fill="none" stroke="#2786c7" stroke-width="2.5"/>
      <text x="155" y="12" text-anchor="middle" font-size="11" fill="currentColor">× 2 en haut et en bas</text>
      <text x="260" y="24" text-anchor="middle" font-size="20" fill="currentColor">2/4</text>
      <g transform="translate(22 43)">
        <rect width="100" height="22" fill="#e5e7eb" stroke="#374151"/>
        <rect width="50" height="22" fill="#2786c7"/>
      </g>
      <g transform="translate(198 43)">
        <rect width="100" height="22" fill="#e5e7eb" stroke="#374151"/>
        <rect width="50" height="22" fill="#2786c7"/>
        <path d="M25 0V22 M50 0V22 M75 0V22" stroke="#374151"/>
      </g>
      <text x="160" y="89" text-anchor="middle" font-size="12" fill="currentColor">La surface coloriée reste la même.</text>
    </svg>`,
    example: "Pour transformer 1/2 en quarts, on multiplie le haut et le bas par 2 : 1 × 2 = 2 et 2 × 2 = 4. Donc 1/2 = 2/4.",
    question: "Complète : 1/2 = ?/4. Quel nombre doit remplacer le point d'interrogation ?",
    expected: ["2"],
    hint: "Le dénominateur passe de 2 à 4 en étant multiplié par 2.",
    errorExplanation: "2 × 2 = 4 au dénominateur. Il faut multiplier le numérateur par le même nombre : 1 × 2 = 2. Donc 1/2 = 2/4."
  },
  {
    floor: 8,
    floorTitle: "Étage 8 — Dénominateurs différents",
    title: "3. Additionner après la transformation",
    theory: "Une fois les dénominateurs identiques, additionne les numérateurs et garde le dénominateur commun. Tu peux ensuite simplifier le résultat si c'est possible.",
    visualDesc: `<svg viewBox="0 0 320 90" role="img" aria-label="Un demi plus un quart devient deux quarts plus un quart, soit trois quarts">
      <text x="160" y="20" text-anchor="middle" font-size="16" fill="currentColor">1/2 + 1/4</text>
      <path d="M160 27V39" stroke="#2786c7" stroke-width="2"/>
      <path d="M153 33L160 40L167 33" fill="none" stroke="#2786c7" stroke-width="2"/>
      <text x="160" y="58" text-anchor="middle" font-size="16" fill="currentColor">2/4 + 1/4 = 3/4</text>
      <text x="160" y="78" text-anchor="middle" font-size="12" fill="currentColor">2 parts + 1 part = 3 quarts</text>
    </svg>`,
    example: "Pour calculer 1/2 + 1/4, on écrit 1/2 = 2/4. Puis 2/4 + 1/4 = 3/4.",
    question: "Calcule 1/2 + 1/4. Écris le résultat sous forme de fraction.",
    expected: ["3/4", "3 / 4"],
    hint: "Transforme d'abord 1/2 en 2/4, puis additionne les numérateurs.",
    errorExplanation: "1/2 devient 2/4. Ensuite, 2/4 + 1/4 = 3/4, car 2 + 1 = 3 et le dénominateur commun reste 4."
  },

  // ============================================================
  // ÉTAGE 9 — MULTIPLICATION ET DIVISION
  // ============================================================
  {
    floor: 9,
    floorTitle: "Étage 9 — Multiplication et division",
    title: "1. Multiplier deux fractions",
    theory: "Pour multiplier deux fractions, multiplie les numérateurs entre eux, puis les dénominateurs entre eux. Il n'est pas nécessaire de chercher un dénominateur commun.",
    visualDesc: `<svg viewBox="0 0 320 95" role="img" aria-label="Deux fractions multipliées : deux tiers fois trois quarts égale six douzièmes">
      <text x="160" y="24" text-anchor="middle" font-size="18" fill="currentColor">2/3 × 3/4</text>
      <path d="M160 32V43" stroke="#2786c7" stroke-width="2"/>
      <path d="M153 37L160 44L167 37" fill="none" stroke="#2786c7" stroke-width="2"/>
      <text x="160" y="64" text-anchor="middle" font-size="18" fill="currentColor">(2 × 3)/(3 × 4) = 6/12</text>
      <text x="160" y="84" text-anchor="middle" font-size="12" fill="currentColor">Haut × haut, bas × bas</text>
    </svg>`,
    example: "2/3 × 3/4 = (2 × 3)/(3 × 4) = 6/12. On multiplie les nombres du haut entre eux et les nombres du bas entre eux.",
    question: "Calcule 1/2 × 3/4. Écris le résultat sous forme de fraction.",
    expected: ["3/8", "3 / 8"],
    hint: "Multiplie 1 × 3 en haut et 2 × 4 en bas.",
    errorExplanation: "Le numérateur est 1 × 3 = 3. Le dénominateur est 2 × 4 = 8. Le résultat est 3/8."
  },
  {
    floor: 9,
    floorTitle: "Étage 9 — Multiplication et division",
    title: "2. Comprendre l'inverse d'une fraction",
    theory: "L'inverse d'une fraction s'obtient en échangeant le numérateur et le dénominateur. Par exemple, l'inverse de 2/3 est 3/2. Une fraction non nulle multipliée par son inverse donne 1.",
    visualDesc: `<svg viewBox="0 0 320 90" role="img" aria-label="L'inverse de deux tiers est trois demis, les nombres du haut et du bas sont échangés">
      <text x="75" y="34" text-anchor="middle" font-size="22" fill="currentColor">2/3</text>
      <path d="M115 29H205" stroke="#2786c7" stroke-width="2.5"/>
      <path d="M195 21L205 29L195 37" fill="none" stroke="#2786c7" stroke-width="2.5"/>
      <text x="160" y="18" text-anchor="middle" font-size="11" fill="currentColor">On échange</text>
      <text x="245" y="34" text-anchor="middle" font-size="22" fill="currentColor">3/2</text>
      <text x="160" y="70" text-anchor="middle" font-size="12" fill="currentColor">Le haut et le bas changent de place.</text>
    </svg>`,
    example: "L'inverse de 4/5 est 5/4. Attention : l'inverse n'est pas le résultat de 1 moins la fraction.",
    question: "Quel est l'inverse de 2/3 ? Écris le résultat sous forme de fraction.",
    expected: ["3/2", "3 / 2"],
    hint: "Échange le numérateur et le dénominateur.",
    errorExplanation: "L'inverse de 2/3 est 3/2 : le numérateur 2 devient le dénominateur, et le dénominateur 3 devient le numérateur."
  },
  {
    floor: 9,
    floorTitle: "Étage 9 — Multiplication et division",
    title: "3. Diviser par une fraction",
    theory: "Pour diviser par une fraction, on multiplie par son inverse. On garde la première fraction, on remplace le signe de division par une multiplication, puis on retourne la deuxième fraction.",
    visualDesc: `<svg viewBox="0 0 320 105" role="img" aria-label="La division un demi divisé par un quart devient un demi multiplié par quatre">
      <text x="160" y="23" text-anchor="middle" font-size="17" fill="currentColor">1/2 ÷ 1/4</text>
      <path d="M160 31V42" stroke="#2786c7" stroke-width="2"/>
      <path d="M153 36L160 43L167 36" fill="none" stroke="#2786c7" stroke-width="2"/>
      <text x="160" y="63" text-anchor="middle" font-size="17" fill="currentColor">1/2 × 4/1</text>
      <text x="160" y="88" text-anchor="middle" font-size="13" fill="currentColor">Diviser par 1/4 revient à multiplier par 4.</text>
    </svg>`,
    example: "1/2 ÷ 1/4 = 1/2 × 4/1 = 4/2 = 2. Il y a deux quarts dans une moitié.",
    question: "Pour calculer 2/3 ÷ 1/4, par quelle fraction faut-il remplacer 1/4 après avoir changé la division en multiplication ?",
    expected: ["4/1", "4", "4 / 1"],
    hint: "Il faut prendre l'inverse de la deuxième fraction.",
    errorExplanation: "L'inverse de 1/4 est 4/1. Donc 2/3 ÷ 1/4 devient 2/3 × 4/1. On inverse uniquement la deuxième fraction."
  }
];

  // Les étapes pédagogiques ci-dessus sont partagées entre les neuf étages.
  // Le composant n'affiche que les étapes correspondant au floorId reçu.
  let { floorId = 'floor-1', onComplete } = $props<{
    floorId?: string;
    onComplete?: () => void;
  }>();

  let floorNum = $derived(Number.parseInt(floorId.match(/(\d+)/)?.[1] ?? '1', 10));
  let floorSteps = $derived(steps.filter((step) => step.floor === floorNum));

  const fallbackStep = {
    floor: 1,
    floorTitle: 'Cours sur les fractions',
    title: 'Découvrir les fractions',
    theory: 'Lis la règle, observe la représentation, puis réponds à la question.',
    visualDesc: '<svg viewBox="0 0 320 70" role="img" aria-label="Représentation indisponible"><text x="160" y="38" text-anchor="middle" fill="currentColor">Représentation</text></svg>',
    example: 'Observe la règle et applique-la à la question.',
    question: 'Es-tu prêt à commencer ?',
    expected: ['oui'],
    hint: 'Relis la règle avant de répondre.',
    errorExplanation: 'Relis la règle, puis essaie une nouvelle réponse.'
  };

  let currentSubStepIndex = $state(0);
  let userAnswer = $state('');
  let feedbackMessage = $state('');
  let isCorrect = $state(false);

  let activeStep = $derived(
    floorSteps[currentSubStepIndex] ?? floorSteps[0] ?? fallbackStep
  );

  // Réinitialiser uniquement lorsque l'étage change, pas lors d'un simple rendu.
  // Variable de comparaison uniquement : pas besoin d'en faire un état réactif.
  // La valeur est renseignée par l'effet dès son premier passage.
  let previousFloorId = '';
  $effect(() => {
    const nextFloorId = floorId;
    if (nextFloorId !== previousFloorId) {
      previousFloorId = nextFloorId;
      currentSubStepIndex = 0;
      userAnswer = '';
      feedbackMessage = '';
      isCorrect = false;
    }
  });

  function normalizeAnswer(value: string): string {
    return value
      .trim()
      .toLocaleLowerCase('fr-CH')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s*\/\s*/g, '/')
      .replace(/\s+/g, ' ');
  }

  function checkAnswer() {
    if (isCorrect) return;

    if (!userAnswer.trim()) {
      feedbackMessage = 'Écris une réponse avant de la vérifier.';
      return;
    }

    const cleanedAnswer = normalizeAnswer(userAnswer);
    const matches = activeStep.expected.some(
      (expectedAnswer) => normalizeAnswer(expectedAnswer) === cleanedAnswer
    );

    if (matches) {
      isCorrect = true;
      feedbackMessage = 'Bravo ! Ta réponse est correcte. Tu peux passer à la suite.';
    } else {
      isCorrect = false;
      feedbackMessage = `Pas encore. ${activeStep.errorExplanation} Indice : ${activeStep.hint}`;
    }
  }

  function nextSubStep() {
    // Sécurité : une étape ne peut pas être franchie sans validation correcte.
    if (!isCorrect) return;

    if (currentSubStepIndex < floorSteps.length - 1) {
      currentSubStepIndex += 1;
      userAnswer = '';
      feedbackMessage = '';
      isCorrect = false;
    } else {
      onComplete?.();
    }
  }

  function prevSubStep() {
    if (currentSubStepIndex <= 0) return;

    currentSubStepIndex -= 1;
    userAnswer = '';
    feedbackMessage = '';
    // Revalider cette étape est nécessaire après y être revenu.
    isCorrect = false;
  }
</script>

<div class="intro-course-container">
  <main class="course-card">
    <div class="card-top-row">
      <span class="floor-tag">Étage {floorNum}</span>
      <span class="step-count">Partie {currentSubStepIndex + 1} sur {floorSteps.length || 1}</span>
    </div>

    <h2>{activeStep.floorTitle}</h2>
    <h3 class="subtitle">{activeStep.title}</h3>

    <section class="theory-block" aria-labelledby="theory-heading">
      <h4 id="theory-heading">Règle à retenir</h4>
      <div class="rich-text">{@html activeStep.theory}</div>
    </section>

    <section class="visual-container" aria-labelledby="visual-heading">
      <h4 id="visual-heading" class="section-label">Illustration</h4>
      <div class="visual-svg">{@html activeStep.visualDesc}</div>
    </section>

    <section class="example-block" aria-labelledby="example-heading">
      <h4 id="example-heading">Exemple du quotidien</h4>
      <p>{activeStep.example}</p>
    </section>

    <section class="validation-box" aria-labelledby="question-heading">
      <h4 id="question-heading" class="question-title">À toi de répondre</h4>
      <p class="question-text">{activeStep.question}</p>

      <form class="input-row" onsubmit={(event) => { event.preventDefault(); checkAnswer(); }}>
        <label class="sr-only" for="course-answer">Ta réponse</label>
        <input
          id="course-answer"
          type="text"
          bind:value={userAnswer}
          placeholder="Écris ta réponse ici…"
          autocomplete="off"
          disabled={isCorrect}
        />
        {#if !isCorrect}
          <button class="btn-check" type="submit">Vérifier</button>
        {:else}
          <span class="validated-badge" role="status">Validé</span>
        {/if}
      </form>

      {#if feedbackMessage}
        <p class="feedback" class:success={isCorrect} class:error={!isCorrect} role="status">
          {feedbackMessage}
        </p>
      {/if}
    </section>
  </main>

  <footer class="course-footer">
    <button
      class="btn-nav secondary"
      type="button"
      onclick={prevSubStep}
      disabled={currentSubStepIndex === 0}
    >
      ← Précédent
    </button>

    <span class="progress-indicator" aria-live="polite">
      Partie {currentSubStepIndex + 1} / {floorSteps.length || 1}
    </span>

    <button
      class="btn-nav primary"
      type="button"
      onclick={nextSubStep}
      disabled={!isCorrect}
    >
      {currentSubStepIndex === floorSteps.length - 1 ? 'Terminer la leçon' : 'Étape suivante →'}
    </button>
  </footer>
</div>

<style>
  .intro-course-container {
    width: 100%;
    max-width: 760px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid #d8e0e8;
    border-radius: 16px;
    background: #ffffff;
    color: #202124;
    font-family: Arial, Helvetica, sans-serif;
  }

  .course-card {
    flex: 1;
    padding: 1.5rem;
    overflow-y: auto;
    max-height: 70vh;
  }

  .card-top-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    margin-bottom: 0.85rem;
  }

  .floor-tag {
    display: inline-block;
    border-radius: 6px;
    background: #e8f3ed;
    padding: 0.3rem 0.65rem;
    color: #176b4d;
    font-size: 0.82rem;
    font-weight: 700;
    text-transform: uppercase;
  }

  .step-count {
    color: #536273;
    font-size: 0.9rem;
    font-weight: 600;
  }

  h2 {
    margin: 0 0 0.4rem;
    color: #1e293b;
    font-size: 1.3rem;
    line-height: 1.35;
  }

  .subtitle {
    margin: 0 0 1.1rem;
    color: #176b4d;
    font-size: 1.15rem;
    line-height: 1.4;
  }

  .theory-block,
  .example-block,
  .validation-box,
  .visual-container {
    margin-bottom: 1.1rem;
    border-radius: 12px;
    padding: 1rem 1.1rem;
  }

  .theory-block {
    border-left: 5px solid #2786c7;
    background: #eef6fc;
    line-height: 1.65;
    font-size: 1.03rem;
  }

  .example-block {
    border-left: 5px solid #e6a23c;
    background: #fff8e8;
    line-height: 1.6;
    font-size: 1rem;
  }

  .example-block p {
    margin: 0;
  }

  .visual-container {
    border: 1px solid #dce4eb;
    background: #f8fafc;
    text-align: center;
  }

  .visual-svg {
    width: 100%;
    overflow-x: auto;
  }

  .visual-svg :global(svg) {
    display: block;
    width: 100%;
    max-width: 420px;
    height: auto;
    margin: 0 auto;
    animation: diagram-arrive 260ms ease-out both;
  }

  .visual-svg :global(svg rect),
  .visual-svg :global(svg path),
  .visual-svg :global(svg circle),
  .visual-svg :global(svg line) {
    transform-box: fill-box;
    transform-origin: center;
    animation: model-piece-arrive 360ms ease-out both;
  }

  .visual-svg :global(svg > :nth-child(2)) { animation-delay: 35ms; }
  .visual-svg :global(svg > :nth-child(3)) { animation-delay: 70ms; }
  .visual-svg :global(svg > :nth-child(4)) { animation-delay: 105ms; }

  @keyframes diagram-arrive {
    from { opacity: 0; transform: translateY(5px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes model-piece-arrive {
    from { opacity: .35; transform: scale(.985); }
    to { opacity: 1; transform: scale(1); }
  }

  h4 {
    margin: 0 0 0.55rem;
    color: #263445;
    font-size: 1rem;
    line-height: 1.4;
  }

  .section-label {
    text-align: left;
    color: #536273;
  }

  .rich-text :global(strong) {
    color: #163d5c;
  }

  .validation-box {
    border: 2px dashed #a8b5c3;
    background: #f8fafc;
  }

  .question-title {
    color: #263445;
  }

  .question-text {
    margin: 0 0 0.9rem;
    font-size: 1.05rem;
    line-height: 1.6;
    overflow-wrap: anywhere;
  }

  .input-row {
    display: flex;
    align-items: stretch;
    gap: 0.65rem;
  }

  input[type='text'] {
    box-sizing: border-box;
    min-width: 0;
    flex: 1;
    border: 2px solid #cbd5e1;
    border-radius: 8px;
    background: #ffffff;
    padding: 0.7rem 0.8rem;
    color: #1f2937;
    font: inherit;
    font-size: 1rem;
  }

  input[type='text']:focus-visible,
  button:focus-visible {
    outline: 3px solid #2786c7;
    outline-offset: 3px;
  }

  input[type='text']:disabled {
    background: #f0fdf4;
    color: #14532d;
  }

  .btn-check {
    border: 0;
    border-radius: 8px;
    background: #176b4d;
    padding: 0.7rem 1rem;
    color: white;
    cursor: pointer;
    font: inherit;
    font-weight: 700;
  }

  .btn-check:hover {
    background: #12543c;
  }

  .validated-badge {
    display: inline-flex;
    align-items: center;
    border: 1px solid #a7d9bf;
    border-radius: 8px;
    background: #eaf7ef;
    padding: 0.6rem 0.9rem;
    color: #176b4d;
    font-weight: 700;
  }

  .feedback {
    margin: 0.8rem 0 0;
    border-radius: 8px;
    padding: 0.75rem 0.85rem;
    line-height: 1.55;
    overflow-wrap: anywhere;
  }

  .feedback.success {
    background: #eaf7ef;
    color: #176b4d;
  }

  .feedback.error {
    background: #fff1f0;
    color: #9f2d25;
  }

  .course-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.8rem;
    border-top: 1px solid #d8e0e8;
    background: #f1f5f9;
    padding: 1rem 1.25rem;
  }

  .btn-nav {
    border: 0;
    border-radius: 8px;
    padding: 0.7rem 1rem;
    cursor: pointer;
    font: inherit;
    font-size: 0.95rem;
    font-weight: 700;
  }

  .btn-nav.secondary {
    border: 1px solid #cbd5e1;
    background: #ffffff;
    color: #334155;
  }

  .btn-nav.primary {
    background: #176b4d;
    color: white;
  }

  .btn-nav.primary:hover:not(:disabled) {
    background: #12543c;
  }

  .btn-nav:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }

  .progress-indicator {
    flex-shrink: 0;
    color: #475569;
    font-size: 0.9rem;
    font-weight: 700;
    text-align: center;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  @media (prefers-reduced-motion: reduce) {
    .visual-svg :global(svg),
    .visual-svg :global(svg rect),
    .visual-svg :global(svg path),
    .visual-svg :global(svg circle),
    .visual-svg :global(svg line) { animation: none; }
  }

  @media (max-width: 540px) {
    .course-card {
      padding: 1rem;
      max-height: 66vh;
    }

    .course-footer {
      flex-wrap: wrap;
      padding: 0.8rem;
    }

    .btn-nav {
      padding: 0.65rem 0.75rem;
      font-size: 0.9rem;
    }

    .progress-indicator {
      order: -1;
      width: 100%;
    }

    .input-row {
      flex-direction: column;
    }

    .btn-check,
    .validated-badge {
      justify-content: center;
      min-height: 42px;
    }
  }

  .intro-course-container { border-color: var(--fraction-line); background: var(--fraction-paper); color: var(--fraction-ink); }
  .course-card { background: var(--fraction-paper); }
  .floor-tag { color: var(--fraction-forest); background: #e9efe4; border: 1px solid #c9d8c3; }
  .step-count, .section-label, .progress-indicator { color: #70634f; }
  h2, h4, .question-title { color: var(--fraction-forest); }
  .subtitle { color: #7a6847; }
  .theory-block { border-left-color: var(--fraction-theory); background: #eaf1f1; }
  .example-block { border-left-color: var(--fraction-gold); background: #f7efdd; }
  .visual-container { border-color: var(--fraction-line); background: #fbf7ed; }
  .validation-box { border-color: #c8b88f; background: #fffdf7; }
  .rich-text :global(strong) { color: #355d70; }
  input[type='text'] { border-color: #cbbd9f; background: #fff; color: var(--fraction-ink); }
  input[type='text']:focus-visible, button:focus-visible { outline-color: var(--fraction-gold); }
  .btn-check, .btn-nav.primary { background: var(--fraction-forest); color: #fff8e8; }
  .btn-check:hover, .btn-nav.primary:hover:not(:disabled) { background: #243e3a; }
  .btn-nav.secondary { border-color: var(--fraction-line); background: #f5eddc; color: var(--fraction-ink); }
  .validated-badge, .feedback.success { border-color: #b4ccaa; background: #e8f0e1; color: #315a38; }
  .feedback.error { background: #f7e9e2; color: #743d34; }
  .course-footer { border-color: var(--fraction-line); background: var(--fraction-parchment); }

</style>
