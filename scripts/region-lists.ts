import type { SourceRegion } from './build-types.ts'

/**
 * Hand-authored regional dexes for two fan regions.
 *
 * Species are drawn from every generation, but only ever default forms — never
 * an alternate form, whose slugs 404 on /pokemon-species and carry ids above
 * 10000. `build-dex.mjs` enforces that. A few default forms carry a suffix in
 * PokeAPI (`lycanroc-midday`, `basculin-red-striped`, ...); those still map to
 * a real species id, which is why they are allowed.
 *
 * Ordering follows the conventions real regional dexes use:
 *   1. the starter trio (Grass -> Fire -> Water), each line complete
 *   2. the early-route staples: bird, rodent, bug
 *   3. the "Pikachu slot" electric line
 *   4. mid-game habitats in roughly the order a player walks through them
 *   5. late-game rarities: fossils, then the pseudo-legendary line
 *   6. legendaries last
 * Evolution lines are always kept adjacent and in base -> final order, and
 * baby Pokemon sit directly in front of the stage they hatch into.
 *
 * Two further rules, both enforced by the tests in App.test.jsx:
 *   - No species appears in both regions. Each dex is its own ecosystem.
 *   - A starter line only ever appears in a starters section. Starters are
 *     given, not found, so they must not turn up on a route.
 */

export const REGIONS: SourceRegion[] = [
  {
    id: 'kanata',
    name: 'Kanata',
    tagline: 'The Region of the Long Winter',
    // "Kanata" is the Iroquoian word for "village" that the name Canada
    // actually descends from.
    etymology:
      'From kanata, the St. Lawrence Iroquoian word for "village" — the word that gave Canada its name.',
    blurb:
      'A vast northern region of boreal pine, shield rock and frozen coast. Trainers start among the maple groves of the south, climb the mining ranges, cross the cattle prairies, and finish their journey on the aurora-lit tundra where the ice legends nest.',
    professor: 'Professor Maple',
    // Kanata is catalogued on a first-generation Pokedex: red shell, blue lens,
    // four-shade monochrome screen.
    skin: 'gen1',
    sections: [
      {
        label: 'Maplewood Grove — Starters',
        note: 'Professor Maple hands out one of three: a sapling, a lit branch, or a fledgling emperor.',
        // Turtwig and Piplup come from Sinnoh, which is built on Hokkaido —
        // Japan's cold northern island — so they are already tuned for snow.
        // The fire slot goes to the line that is literally about tending a
        // flame, which is the correct northern survival story.
        species: [
          'turtwig', 'grotle', 'torterra',
          'fennekin', 'braixen', 'delphox',
          'piplup', 'prinplup', 'empoleon',
        ],
      },
      {
        label: 'Route 1 — First Steps',
        note: 'The bird, the beaver and the bugs every Kanatan trainer meets first.',
        species: [
          'starly', 'staravia', 'staraptor',
          'bidoof', 'bibarel',
          'sentret', 'furret',
          'kricketot', 'kricketune',
          'ledyba', 'ledian',
        ],
      },
      {
        label: 'Aurora Flats',
        note: 'Static crackles off the northern lights here, drawing anything that holds a charge.',
        // Pachirisu fills the "Pikachu slot" — it is a Pikachu clone, and a
        // flying squirrel, which suits the region far better than Pikachu.
        species: ['pachirisu', 'elekid', 'electabuzz', 'electivire'],
      },
      {
        label: 'The Boreal Belt',
        note: 'Endless black spruce and pine. Owls above, something much larger in the snow between the trunks.',
        species: [
          'hoothoot', 'noctowl',
          'murkrow', 'honchkrow',
          'rookidee', 'corvisquire', 'corviknight',
          'snover', 'abomasnow',
          'phantump', 'trevenant',
          'pineco', 'forretress',
          'shroomish', 'breloom',
          'sudowoodo',
          'zorua', 'zoroark',
          'deerling', 'sawsbuck',
        ],
      },
      {
        label: 'Shieldstone Range',
        note: 'Old grey rock and older mine shafts. The compass needles here point at the Pokemon, not the pole.',
        species: [
          'geodude', 'graveler', 'golem',
          'onix', 'steelix',
          'nacli', 'naclstack', 'garganacl',
          'rolycoly', 'carkol', 'coalossal',
          'nosepass', 'probopass',
          'stonjourner',
        ],
      },
      {
        label: 'The Long Prairie',
        note: 'Wheat, wool and a horizon that does not interrupt itself for anything.',
        species: [
          'hoppip', 'skiploom', 'jumpluff',
          'mareep', 'flaaffy', 'ampharos',
          'miltank',
          'ponyta', 'rapidash',
          'growlithe', 'arcanine',
          'bouffalant',
        ],
      },
      {
        // Karonto is from tkaronto, the Mohawk phrase for "where there are
        // trees standing in the water" — the fish weirs at the Narrows, and
        // the actual origin of the name Toronto.
        label: 'Karonto City & the Ravines',
        note: 'The region\'s largest city: a lakefront, a needle you can see from an hour away, more construction cranes than anywhere on the continent, and a ravine system nobody ever managed to build over. Everything here has learned to live off people, and most of it is winning.',
        species: [
          'zigzagoon', 'linoone',
          'skwovet', 'greedent',
          'stunky', 'skuntank',
          'trubbish', 'garbodor',
          'timburr', 'gurdurr', 'conkeldurr',
          'magnemite', 'magneton', 'magnezone',
          'shuppet', 'banette',
        ],
      },
      {
        label: 'The Great Lakes',
        note: 'Freshwater inland seas, muskeg bogs, and the rivers the salmon climb every autumn.',
        species: [
          'psyduck', 'golduck',
          'ducklett', 'swanna',
          'marill', 'azumarill',
          'buizel', 'floatzel',
          'feebas', 'milotic',
          'basculin-red-striped', 'basculegion-male',
          'lapras',
        ],
      },
      {
        label: 'The Cold Atlantic',
        note: 'Lobster traps, fog banks, and a lighthouse that has never once been switched off.',
        species: [
          'wingull', 'pelipper',
          'krabby', 'kingler',
          'shellder', 'cloyster',
          'chinchou', 'lanturn',
          'qwilfish',
          'remoraid', 'octillery',
          'wailmer', 'wailord',
        ],
      },
      {
        label: 'The Treeline Tundra',
        note: "Past the last tree. Bears, caribou herds, pack ice, and the region's signature cold-dwellers.",
        species: [
          'stantler', 'wyrdeer',
          'teddiursa', 'ursaring', 'ursaluna',
          'cubchoo', 'beartic',
          'sneasel', 'weavile',
          'swinub', 'piloswine', 'mamoswine',
          'seel', 'dewgong',
          'spheal', 'sealeo', 'walrein',
          'bergmite', 'avalugg',
          'delibird',
        ],
      },
      {
        label: 'Northern Lights Sanctuary',
        note: 'A single Eevee is gifted here. What the aurora makes of it is up to the aurora.',
        species: [
          'eevee', 'vaporeon', 'jolteon', 'flareon',
          'espeon', 'umbreon', 'leafeon', 'glaceon', 'sylveon',
        ],
      },
      {
        label: 'The Shale Beds — Fossils',
        note: 'A cliff of impossibly old sea creatures, and a badland of much newer, much larger ones.',
        species: [
          'anorith', 'armaldo',
          'omanyte', 'omastar',
          'cranidos', 'rampardos',
          'tyrunt', 'tyrantrum',
          'amaura', 'aurorus',
        ],
      },
      {
        label: 'Summit Trial',
        note: "The region's pseudo-legendary, raised on the highest and coldest peaks.",
        species: ['frigibax', 'arctibax', 'baxcalibur'],
      },
      {
        label: 'Legends of Kanata',
        note: 'Three powers and a witness: the one above, the one in the cold, the one below the ice — and the forest that was here before all of them and expects to outlast them.',
        // A deliberate trio rather than a pile of ice legendaries. Each is a
        // distinct myth from a distinct people, and each holds one domain:
        // Thunderbird the sky, Wendigo the frozen interior, Sedna the sea.
        // Celebi sits apart, which is what a mythical is for.
        species: ['zapdos', 'kyurem', 'lugia', 'celebi'],
      },
    ],
  },
  {
    id: 'anahua',
    name: 'Anahua',
    tagline: 'The Region Where the Sun is Kept',
    // From Anahuac, the Nahuatl name for the highland heart of Mexico.
    etymology:
      'From Anáhuac, the Nahuatl name — roughly "land ringed by water" — for the highland valley at the heart of Mexico.',
    blurb:
      'A sun-hammered region of cactus flats, live volcanoes and green cenote country. Trainers begin in the jungle lowlands, cross the desert, climb the smoking sierra, and end among the glyph-carved tombs where the sun legend still roosts.',
    professor: 'Professor Ceiba',
    // Anahua is catalogued on a second-generation Pokedex: gold shell, silver
    // trim, and a colour screen.
    skin: 'gen2',
    sections: [
      {
        label: 'Ceiba Village — Starters',
        note: 'Professor Ceiba offers a vine, a singer, or a river-jaw.',
        species: [
          'treecko', 'grovyle', 'sceptile',
          'fuecoco', 'crocalor', 'skeledirge',
          'mudkip', 'marshtomp', 'swampert',
        ],
      },
      {
        label: 'Route 1 — The Dry Wash',
        note: 'The bird, the rodent and the bugs every Anahuan trainer meets first — including the ones that migrate here in their millions.',
        species: [
          'fletchling', 'fletchinder', 'talonflame',
          'doduo', 'dodrio',
          'patrat', 'watchog',
          'spinarak', 'ariados',
          'scatterbug', 'spewpa', 'vivillon',
        ],
      },
      {
        label: 'Thunderhead Mesa',
        note: "The rain god's storms break over this mesa every afternoon in the wet season.",
        species: ['pichu', 'pikachu', 'raichu'],
      },
      {
        label: 'The Cenote Caves',
        note: 'Flooded limestone shafts, and the colonies that boil out of them at dusk.',
        species: ['zubat', 'golbat', 'crobat', 'carbink'],
      },
      {
        label: 'Obsidian Desert',
        note: 'Burrows, serpents, cactus and bleached bone under a very large sky.',
        species: [
          'sandshrew', 'sandslash',
          'sandile', 'krokorok', 'krookodile',
          'trapinch', 'vibrava', 'flygon',
          'cacnea', 'cacturne',
          'maractus',
          'silicobra', 'sandaconda',
          'ekans', 'arbok',
          'gligar', 'gliscor',
          'cubone', 'marowak-alola',
          'sandygast', 'palossand',
          'rockruff', 'lycanroc-midday',
        ],
      },
      {
        label: 'Sunstone Flats',
        note: 'Everything here turns to follow the sun, and two things here answer to the sky itself.',
        species: [
          'sunkern', 'sunflora',
          'helioptile', 'heliolisk',
          'solrock',
          'lunatone',
        ],
      },
      {
        label: 'The Smoking Sierra',
        note: 'Three active cones, a lava flow, and air you can taste from the next valley over.',
        species: [
          'numel', 'camerupt',
          'slugma', 'magcargo',
          'magby', 'magmar', 'magmortar',
          'salandit', 'salazzle',
        ],
      },
      {
        label: 'Yucatl Jungle',
        note: 'Canopy so thick the floor never dries. Watch the branches, not the path.',
        species: [
          'bellsprout', 'weepinbell', 'victreebel',
          'tangela', 'tangrowth',
          'exeggcute', 'exeggutor',
          'tropius',
          'pikipek', 'trumbeak', 'toucannon',
          'mankey', 'primeape', 'annihilape',
          'meowth', 'persian',
          'heracross',
        ],
      },
      {
        label: 'The Floating Gardens',
        note: 'Reed islands on a shallow lake. One resident is found nowhere else on earth; another never stops dancing.',
        species: [
          'wooper', 'quagsire',
          'tadbulb', 'bellibolt',
          'lotad', 'lombre', 'ludicolo',
        ],
      },
      {
        // Tenoch is from Tenochtitlan, "place of the prickly pear on a stone" —
        // the Mexica city the modern capital was built directly on top of.
        label: 'Tenoch City',
        note: 'One of the largest cities on earth, sunk a little further into its old lakebed every year. Painted wall to wall, loud from before dawn, and fed entirely from the street.',
        species: [
          'grafaiai',
          'fidough', 'dachsbun',
          'capsakid', 'scovillain',
          'bounsweet', 'steenee', 'tsareena',
          'oricorio-baile',
          'toxel', 'toxtricity-amped',
          'bronzor', 'bronzong',
          'cufant', 'copperajah',
          'munchlax', 'snorlax',
        ],
      },
      {
        label: 'City of the Dead',
        note: 'One night a year the marigold road opens, the candles are lit, and the residents come out to visit.',
        species: [
          'gastly', 'haunter', 'gengar',
          'misdreavus', 'mismagius',
          'duskull', 'dusclops', 'dusknoir',
          'greavard', 'houndstone',
          'litwick', 'lampent', 'chandelure',
          'comfey',
          'pumpkaboo-average', 'gourgeist-average',
          'drifloon', 'drifblim',
          'mimikyu-disguised',
        ],
      },
      {
        label: 'The Glyph Temples',
        note: 'Step pyramids covered in a script that will not hold still long enough to be read.',
        species: [
          'abra', 'kadabra', 'alakazam',
          'natu', 'xatu',
          'unown',
          'baltoy', 'claydol',
          'sigilyph',
          'golett', 'golurk',
          'cleffa', 'clefairy', 'clefable',
        ],
      },
      {
        label: 'The Great Arena',
        note: "Masks, ropes, and a crowd that can be heard three streets away — and next door, a stadium that holds a hundred thousand and has decided two World Cups. The region's two proudest traditions share a car park.",
        species: [
          'hawlucha',
          'passimian',
          'scraggy', 'scrafty',
          'tyrogue', 'hitmonlee', 'hitmonchan', 'hitmontop',
          'machop', 'machoke', 'machamp',
          'tauros',
        ],
      },
      {
        label: 'The Turquoise Reef',
        note: 'Warm shallows and a coral shelf that runs the length of the eastern coast.',
        species: [
          'horsea', 'seadra', 'kingdra',
          'staryu', 'starmie',
          'corsola',
          'mantyke', 'mantine',
          'carvanha', 'sharpedo',
        ],
      },
      {
        label: 'The Impact Crater — Fossils',
        note: 'A ring of cenotes marks where something enormous once fell out of the sky and ended a world.',
        species: ['lileep', 'cradily', 'aerodactyl'],
      },
      {
        label: 'Feathered Serpent Trial',
        note: "The region's pseudo-legendary, and the shape its oldest god is carved in.",
        species: ['gible', 'gabite', 'garchomp'],
      },
      {
        label: 'Legends of Anahua',
        note: 'Three powers and a witness: the sun that dies and comes back, the serpent that rules the sky, the land that withholds the rain — and the small thing in the jungle that everything else descends from.',
        // The same shape as Kanata's: a domain trio plus a mythical apart from
        // it. Sun, sky and earth — the three the region's calendar is built on.
        species: ['ho-oh', 'rayquaza', 'groudon', 'mew'],
      },
    ],
  },
]
