import type { Criterion, CriterionInfo } from '../src/lib/types.ts'
import type { Rationale } from './build-types.ts'

/**
 * Why each evolution line is in the dex it is in, and which criteria it meets.
 *
 * Placement is decided per line, not per stage — nobody puts Bayleef in a
 * region for a different reason than Chikorita — so the reasoning is written
 * once against the line's base form and every later stage inherits it.
 *
 * Every line must earn its place against at least one of four criteria, and
 * the target is two. `build-dex.mjs` enforces the floor and reports any line
 * scraping in on a single criterion.
 */

export const CRITERIA: Record<Criterion, CriterionInfo> = {
  thematic: {
    label: 'Thematic',
    blurb: "Built on the region's real-world cultures, myths, stories, industries or institutions.",
  },
  fauna: {
    label: 'Animal / Fauna',
    blurb: 'Based on an animal or plant genuinely tied to the region.',
  },
  stylistic: {
    label: 'Stylistic',
    blurb: "Matches the region's design aesthetic — its landscape, palette and mood.",
  },
  mechanics: {
    label: 'Mechanics',
    blurb: 'Fills a slot a Pokémon region needs: a starter, a route staple, type coverage, a fossil, a pseudo-legendary, a legendary.',
  },
}

/**
 * Where a species has several equally canonical forms and one was picked, the
 * pick is its own decision and gets its own note. Forms that are simply
 * PokeAPI's name for the only ordinary version of a species do not.
 */
export const VARIANT_NOTES: Record<string, string> = {
  'lycanroc-midday': 'Midday over Midnight or Dusk: the daytime coyote is the one people actually meet, trotting along a road shoulder in full view and entirely unconcerned.',
  'basculegion-male': 'The male form, whose markings run red — the colour a sockeye turns when it stops feeding and starts up the river to die.',
  'marowak-alola': 'The regional form over the standard one, and it is not close. Ordinary Marowak is a ground-type with a club; this one is a fire-and-ghost bone dancer that spins a lit femur and is described as guiding the spirits of its dead. Put that in a region whose defining festival is a night of skulls, candles and dancing and it stops being a variant and starts being the point.',
}

export const RATIONALES: Record<string, Rationale> = {
  // ─────────────────────────── KANATA ───────────────────────────

  // Maplewood Grove — Starters
  turtwig: {
    tags: ['thematic', 'mechanics'],
    why: 'Turtle Island. In the Haudenosaunee and Anishinaabe creation stories this continent is carried on the back of a great turtle, and Torterra is a turtle with an entire landscape growing on its shell. No other Pokemon is a closer fit to the oldest story told about this land.',
  },
  fennekin: {
    tags: ['stylistic', 'mechanics'],
    why: 'The one slot with no northern animal available in any starter line, so it is justified by theme instead: this line is about tending a flame — Braixen carries a burning branch, Delphox reads its own fire. In a region where winter is the antagonist, the starter should be the hearth you keep lit through the dark half of the year. This is the weakest case in the region and it is not pretending otherwise.',
  },
  piplup: {
    tags: ['fauna', 'thematic', 'mechanics'],
    why: 'The great auk. The North Atlantic had its own flightless black-and-white diving seabird, it nested in enormous colonies off Newfoundland, the word "penguin" originally referred to it, and it was clubbed to extinction by 1844. Empoleon is what it should have grown into.',
  },

  // Route 1 — First Steps
  starly: {
    tags: ['fauna', 'mechanics'],
    why: 'The blackbird flocks that come off the farm belt in numbers that darken a field, and the northern goshawk that peels away from them — the bird everyone here has watched and nobody here looks up.',
  },
  bidoof: {
    tags: ['fauna', 'thematic', 'mechanics'],
    why: 'The beaver: the national animal, the animal on the nickel, and the animal whose pelt the entire country was chartered to trade. Bibarel dams rivers and builds lodges to live in, which is the single most Kanatan behaviour available.',
  },
  sentret: {
    tags: ['fauna', 'mechanics'],
    why: 'The ermine — the stoat that turns white for winter. Furret is built long and narrow for hunting the tunnels under the snowpack, which is exactly how weasels get through a boreal winter.',
  },
  kricketot: {
    tags: ['fauna', 'mechanics'],
    why: 'The snowy tree cricket, whose chirp rate tracks the temperature closely enough to be used as a thermometer. Kricketune is the sound of late summer here, and it stops dead on the night of the first hard frost.',
  },
  ledyba: {
    tags: ['fauna', 'mechanics'],
    why: 'The ladybug, which overwinters in huge huddled clusters under bark and in cabin walls — a genuinely northern strategy, and a genuinely northern nuisance.',
  },

  // Aurora Flats
  pachirisu: {
    tags: ['fauna', 'mechanics'],
    why: 'The northern flying squirrel, which lives across the entire boreal belt and glides between spruce at night. It fills the "Pikachu slot" every regional dex has, but with an animal that actually lives here.',
  },
  elekid: {
    tags: ['thematic', 'mechanics'],
    why: 'Hydroelectricity. This country generates most of its power from falling water and exports the surplus; James Bay and Churchill Falls reshaped whole territories to do it, and the transmission corridors run dead straight through the bush for hundreds of miles. Electivire trails two leads because that is what the landscape looks like.',
  },

  // The Boreal Belt
  hoothoot: {
    tags: ['fauna', 'thematic', 'stylistic'],
    why: 'The great grey owl — the provincial bird of Manitoba, the largest owl in the world by length, and a bird whose face is a parabolic dish for hearing voles moving under a foot of snow.',
  },
  murkrow: {
    tags: ['thematic', 'fauna'],
    why: 'Raven. On the Northwest Coast, Raven is not a bird but the trickster who stole the light and made the world, and the Haida and Tlingit have been carving him for a very long time. Honchkrow arrives with a following, which is also correct.',
  },
  rookidee: {
    tags: ['thematic', 'fauna'],
    why: 'Corvids that go where there are no roads. Corviknight carries freight between places that have no highway, which is the job the bush plane and the float plane actually do up here — an entire aviation culture that exists because the country was too big to finish building.',
  },
  snover: {
    tags: ['thematic', 'fauna'],
    why: 'Two things at once: the black spruce, which is the tree this entire forest is made of, and the sásq\'ets — the Halkomelem word behind "Sasquatch", from the Sts\'ailes people of the Fraser Valley, who were describing something in the treeline long before anyone else was.',
  },
  phantump: {
    tags: ['thematic', 'stylistic'],
    why: 'The child who went into the woods and did not come back — the warning every northern community tells its kids, and the reason nobody lets you walk to the next cabin at dusk. Trevenant is the old growth closing the trail behind you.',
  },
  pineco: {
    tags: ['fauna', 'stylistic'],
    why: 'The jack pine. Its cones are sealed shut with resin and only open in a fire, which is how this forest regenerates: it is not damaged by burning, it depends on it. Forretress is that cone, armoured shut.',
  },
  shroomish: {
    tags: ['fauna', 'thematic'],
    why: 'The morel harvest. Morels fruit in enormous numbers on ground that burned the previous summer, and pickers follow the fire maps north every spring to camps that exist for six weeks and then vanish — a real seasonal economy built entirely on where the forest burned. It is the other half of the story Forretress tells.',
  },
  sudowoodo: {
    tags: ['thematic', 'stylistic'],
    why: 'The Group of Seven. The lone wind-bent pine standing on bare Shield rock is the most reproduced image in the region’s art — Tom Thomson painted it, Lawren Harris and A.Y. Jackson built a national visual identity out of it, and Sudowoodo is a tree standing by itself on rock refusing to admit what it is.',
  },
  zorua: {
    tags: ['thematic', 'fauna'],
    why: 'Wisakedjak — the shape-changing trickster of Cree and Anishinaabe story, whose name English mangled into "whiskeyjack". Zoroark works entirely by illusion, which is the right body for him.',
  },
  deerling: {
    tags: ['fauna', 'thematic'],
    why: 'The sugar bush. Sawsbuck turns colour with the season in the country that puts a maple leaf on its flag and produces the overwhelming majority of the world\'s maple syrup — almost all of it out of Quebec, tapped in the same six-week thaw every spring, in a cabane à sucre culture that is its own festival.',
  },

  // Shieldstone Range
  geodude: {
    tags: ['stylistic', 'mechanics'],
    why: 'The Shield: four million square kilometres of scraped-bare Precambrian rock, some of the oldest exposed stone on the planet, and the physical foundation of half the country.',
  },
  onix: {
    tags: ['thematic', 'stylistic'],
    why: 'Hard-rock nickel mining. Onix bores through the range the way the shafts under Sudbury do — two miles down, into an ore body left by a meteorite impact, in a town whose entire culture is built around going underground for a living.',
  },
  nacli: {
    tags: ['thematic', 'mechanics'],
    why: 'Salt. The largest salt mine in the world is under Lake Huron at Goderich, running out beneath the lakebed, and most of what it produces goes onto winter roads in this region. Garganacl is a walking pillar of it.',
  },
  rolycoly: {
    tags: ['thematic', 'mechanics'],
    why: 'Coal. Cape Breton and the Crowsnest Pass were built on it and largely undone by it — Springhill collapsed three times and the last of the deep mines closed within living memory. What is left is a culture: pit songs, a miners\' choir that still tours, and towns that measure their history in disasters.',
  },
  nosepass: {
    tags: ['stylistic', 'mechanics'],
    why: 'Its nose points permanently at magnetic north — and magnetic north is here, wandering across the high Arctic at about fifty kilometres a year. This is the one region where that trait is a navigational fact rather than a novelty.',
  },
  stonjourner: {
    tags: ['thematic', 'stylistic'],
    why: 'The inuksuk. Inuit stone figures built across ground with no trees and no landmarks, to say that someone passed this way and that the route is good. It is on a territorial flag.',
  },

  // The Long Prairie
  hoppip: {
    tags: ['stylistic', 'mechanics'],
    why: 'The prairie wind, which is constant, and which will take anything not tied down as far as it wants.',
  },
  mareep: {
    tags: ['thematic', 'fauna', 'mechanics'],
    why: 'Wool at one end and a lighthouse at the other. Ampharos is why this line is here: the Atlantic coast is fogbound most of the year, the lights at places like Peggy\'s Cove were the difference between arriving and not, and none of them were ever switched off on purpose.',
  },
  miltank: {
    tags: ['fauna', 'thematic'],
    why: 'Dairy, in the part of the region that is entirely agriculture — and in a country that runs its milk on a supply-management system it has been arguing about in every trade negotiation for fifty years.',
  },
  ponyta: {
    tags: ['fauna', 'thematic'],
    why: 'The little iron horse — descended from stock Louis XIV shipped to New France in the 1660s, bred small and hard enough through three centuries of winters to earn the name. It was made the national horse in 2002, having very nearly been lost entirely.',
  },
  growlithe: {
    tags: ['thematic', 'fauna'],
    why: 'The Mounted Police. Growlithe is canonically the police dog of the Pokemon world, it is red, and the force that became a national symbol trained on this prairie — Depot Division in Regina still does, and the Musical Ride still tours. Arcanine at a full gallop in red is the image the country put on its own stamps.',
  },
  bouffalant: {
    tags: ['fauna', 'thematic'],
    why: 'The plains bison. Tens of millions of them, then under a thousand, then a slow deliberate recovery in places like Wood Buffalo. It is the largest land animal on the continent, it was the economy and the larder of the Plains nations, and it very nearly was not one at all.',
  },

  // Karonto City & the Ravines
  zigzagoon: {
    tags: ['fauna', 'thematic'],
    why: 'The raccoon. This city has the densest urban raccoon population on earth, has been losing an arms race with them over its green bins for two decades, and spent thirty-one million dollars on a raccoon-proof bin in 2016 that they had cracked within the year. Zigzagoon is canonically the Tiny Raccoon Pokemon and its defining trait is picking up whatever it finds lying around and taking it home, which is the entire problem.',
  },
  skwovet: {
    tags: ['fauna', 'thematic'],
    why: 'The black squirrels. The melanistic form of the eastern grey is unusual almost everywhere and ordinary here — the city is full of them, they are a minor civic mascot, and Greedent is a squirrel that cannot stop hoarding and drops half of it.',
  },
  stunky: {
    tags: ['fauna', 'thematic'],
    why: 'The skunk under the porch. Every neighbourhood has one, everyone knows the smell from two streets away, and nobody has ever successfully removed one. It is the other half of the city\'s nocturnal wildlife problem, and the half people complain about more.',
  },
  trubbish: {
    tags: ['thematic', 'mechanics'],
    why: 'The garbage. In 2009 a civic strike shut collection down for thirty-nine days in high summer and the parks became landfill; the bins that came out of that fight are the ones the raccoons now open. Trubbish is a tied bag that got up and walked off, which is roughly what residents describe.',
  },
  timburr: {
    tags: ['thematic', 'mechanics'],
    why: 'The cranes. This city has run more high-rise construction cranes than anywhere else on the continent for years running, and the line is the whole trade in order: Timburr carries a squared timber the way the river drives did, Gurdurr carries a steel girder, and Conkeldurr carries concrete pillars and teaches the younger ones how.',
  },
  magnemite: {
    tags: ['thematic', 'stylistic'],
    why: 'The overhead wires. The city runs the largest streetcar network on the continent, the cars draw off a grid of catenary strung over every major street, and Magneton is what that intersection of wires looks like if it decided to hover.',
  },
  shuppet: {
    tags: ['stylistic', 'thematic'],
    why: 'The ravines. The city is cut through by a wooded ravine system it never managed to build over, and everything the streets above throw away ends up down there — Shuppet is a discarded thing that kept enough resentment to move, which is the correct ghost for a place made of what the city discarded.',
  },

  // The Great Lakes
  psyduck: {
    tags: ['fauna', 'mechanics'],
    why: 'The prairie pothole country — millions of shallow glacial ponds that produce most of the ducks in North America. It is known in the literature, without irony, as the duck factory.',
  },
  ducklett: {
    tags: ['fauna', 'thematic'],
    why: 'The grey goose. Migratory, enormously loud, entirely unafraid, and it has chased every single person in this region across a parking lot at least once.',
  },
  marill: {
    tags: ['fauna', 'thematic'],
    why: 'The muskrat — the fur trade\'s most-traded animal after beaver, and, in the Anishinaabe telling of Turtle Island, the one who dove to the bottom and came back up with the handful of earth that everything else was built on.',
  },
  buizel: {
    tags: ['fauna', 'thematic'],
    why: 'The river otter, complete with flotation collars — and the voyageur canoe routes it shares. The French-speaking paddlers who moved the fur trade across this country covered impossible distances on these rivers, and left behind a body of song, a dialect and a folklore that is still the backbone of Francophone identity here.',
  },
  feebas: {
    tags: ['thematic', 'stylistic'],
    why: 'N\'ha-a-itk, the lake being of Okanagan Lake that settlers renamed Ogopogo — known to the Syilx long before there was a tourist board. Milotic is a serpent nobody has ever managed to photograph properly, which is the whole point.',
  },
  'basculin-red-striped': {
    tags: ['fauna', 'thematic'],
    why: 'The salmon run. Nothing about the rivers, the forests, the bears or the coastal First Nations of this region makes sense without it. Basculegion carries the ones that did not finish the climb, and almost none of them finish the climb.',
  },
  lapras: {
    tags: ['thematic', 'mechanics'],
    why: 'The ferry. This is a country you cannot cross without one, the crossings are long and cold and rough, and for a great many communities the boat is the only road. That it doubles as the thing people report seeing off Cadboro Bay is a bonus.',
  },

  // The Cold Atlantic
  wingull: {
    tags: ['fauna', 'stylistic'],
    why: 'The harbour gull: loud, thieving, and inseparable from a working wharf anywhere on this coast.',
  },
  krabby: {
    tags: ['fauna', 'thematic'],
    why: 'Lobster and snow crab — the traps the entire Atlantic economy is built on, the trap seasons the outports live by, and the long unfinished argument about whose treaty right it is to set them.',
  },
  shellder: {
    tags: ['fauna', 'thematic'],
    why: 'Malpeque oysters and Digby scallops. Cold water grows them slowly, which is exactly why they are worth what they are, and why two very small places are known nationally for nothing else.',
  },
  chinchou: {
    tags: ['stylistic', 'mechanics'],
    why: 'A light in the dark at depth. This region has one other famous light in the dark, and Lanturn is named for the same idea.',
  },
  qwilfish: {
    tags: ['fauna', 'mechanics'],
    why: 'The bad-tempered spiked thing that comes up in the net when you wanted something else. Every fishery has one and this is the North Atlantic\'s.',
  },
  remoraid: {
    tags: ['fauna', 'mechanics'],
    why: 'The giant Pacific octopus — the largest octopus species on earth, resident on this coast, startlingly intelligent, and wedged into a rock crevice sulking.',
  },
  wailmer: {
    tags: ['fauna', 'thematic'],
    why: 'Whale watching, which is the second industry of both coasts — and the North Atlantic right whale, of which a few hundred remain and every single death makes the national news here.',
  },

  // The Treeline Tundra
  stantler: {
    tags: ['fauna', 'thematic'],
    why: 'The barren-ground caribou. Their migration is the largest movement of land animals on the continent, they are on the twenty-five cent coin, and entire communities across the North still plan the year around where the herd will be.',
  },
  teddiursa: {
    tags: ['fauna', 'thematic'],
    why: 'The black bear and then the grizzly — a cub with a honey habit that becomes the animal every camp, cabin and canoe route in this country is organised around not surprising.',
  },
  cubchoo: {
    tags: ['fauna', 'thematic'],
    why: 'The polar bear. Churchill, Manitoba calls itself the polar bear capital of the world, has a holding facility for the ones that wander into town, and leaves its cars unlocked so anyone being followed can get off the street.',
  },
  sneasel: {
    tags: ['fauna', 'thematic'],
    why: 'Marten and fisher — the mid-sized mustelids the Hudson\'s Bay Company built two centuries of trade around, and the reason there are trading posts at the mouth of every northern river. Weavile hunts in coordinated groups and marks trees with claw signs, which is wolverine behaviour at wolverine temperament.',
  },
  swinub: {
    tags: ['fauna', 'thematic'],
    why: 'The mammoth. The Yukon permafrost gives them up regularly and in remarkable condition, and the placer miners around Dawson still turn up tusks in the gravel alongside the gold.',
  },
  seel: {
    tags: ['fauna', 'thematic'],
    why: 'The harp seal on the pack ice off Newfoundland — an animal at the centre of the most divisive argument this country has ever had with the rest of the world, and a food and clothing source communities are still defending.',
  },
  spheal: {
    tags: ['fauna', 'thematic'],
    why: 'The walrus, which hauls out on the ice with its tusks and has fed communities across the eastern Arctic for as long as there have been communities there.',
  },
  bergmite: {
    tags: ['thematic', 'stylistic'],
    why: 'The outdoor rink. Avalugg is a flat sheet of ice big enough to stand on, and in this country that means the pond you shovel off, the boards someone\'s father built, and the game that is the closest thing the place has to a shared religion. Behind it, Iceberg Alley: ten-thousand-year-old ice drifting down past Newfoundland every spring.',
  },
  delibird: {
    tags: ['thematic', 'stylistic'],
    why: 'The gift-bringer, in the country whose postal service maintains the address H0H 0H0, staffs it with volunteers, and answers every one of the million-odd letters children send there each December.',
  },

  // Northern Lights Sanctuary
  eevee: {
    tags: ['thematic', 'mechanics'],
    why: 'The aurora. A single Eevee is gifted at the sanctuary and what it becomes is left to the sky — which is the right way to run it, in the country that has Yellowknife, sitting directly under the auroral oval on one of the clearest, driest, darkest patches of sky in the world.',
  },

  // The Shale Beds — Fossils
  anorith: {
    tags: ['fauna', 'thematic', 'mechanics'],
    why: 'Anomalocaris, out of the Burgess Shale in Yoho — the single most important fossil bed on earth for understanding the Cambrian, high in the Rockies. Armaldo is that animal having left the water.',
  },
  omanyte: {
    tags: ['fauna', 'thematic', 'mechanics'],
    why: 'The ammonite — and specifically ammolite, the iridescent shell gemstone found in commercial quantity only in southern Alberta. The Blackfoot know those shells as iniskim, the buffalo-calling stones.',
  },
  cranidos: {
    tags: ['thematic', 'mechanics'],
    why: 'Dinosaur Provincial Park, which has produced more dinosaur species than almost anywhere on the planet out of badlands you can walk across in an afternoon.',
  },
  tyrunt: {
    tags: ['thematic', 'mechanics'],
    why: 'Albertosaurus. Drumheller has an entire bonebed of them, a museum built on top of the industry that came with it, and a town that has rebuilt its whole identity around being the place the bones are.',
  },
  amaura: {
    tags: ['stylistic', 'mechanics'],
    why: 'A cold-climate fossil, revived with ice, that generates its own aurora and was named for one. It belongs to this region and to no other.',
  },

  // Summit Trial
  frigibax: {
    tags: ['stylistic', 'mechanics'],
    why: 'The Columbia Icefield: the largest icefield in the Rockies, feeding three oceans at once, and still thick enough to swallow things. Baxcalibur is what lives on top of it.',
  },

  // Legends of Kanata — a domain trio plus a mythical, not a pile of ice
  zapdos: {
    tags: ['thematic', 'mechanics'],
    why: 'THE SKY. The Thunderbird is one of the most widespread figures in Indigenous North American belief — Plains, Northwest Coast, Anishinaabe — an enormous bird whose wingbeats are thunder and whose eyes throw lightning. Zapdos is that, without adjustment.',
  },
  kyurem: {
    tags: ['thematic', 'mechanics'],
    why: 'THE COLD. The Wendigo — in Algonquian belief the thing the deep cold turns a person into, hollow and starving and never satisfied no matter how much it consumes. Kyurem is a shell missing most of itself, and it lives exactly where the ice ends.',
  },
  lugia: {
    tags: ['thematic', 'mechanics'],
    why: 'THE SEA. Sedna — in Inuit belief the woman at the bottom of the sea who holds every seal, walrus and whale in her hands, and when she is angry she keeps them there and the hunting fails. Lugia commands the sea and is calmed rather than defeated.',
  },
  celebi: {
    tags: ['fauna', 'mechanics'],
    why: 'THE WITNESS. Apart from the trio, as a mythical should be: the boreal forest itself, which wraps the top of the world, holds more carbon than the tropics, is older than the ice sheet that buried it, and fully expects to outlast all three of them.',
  },

  // ─────────────────────────── ANAHUA ───────────────────────────

  // Ceiba Village — Starters
  treecko: {
    tags: ['fauna', 'mechanics'],
    why: 'A gecko on a jungle trunk. This region has more reptile species than anywhere else on the continent, and Sceptile ends the line as the canopy\'s apex with a forest\'s worth of seeds down its back.',
  },
  fuecoco: {
    tags: ['thematic', 'mechanics'],
    why: 'A crocodile that sings, ending as a skull, a candle and a mariachi. Skeledirge is the most explicitly Day-of-the-Dead design in the franchise and it anchors the entire region.',
  },
  mudkip: {
    tags: ['fauna', 'mechanics'],
    why: 'A mudskipper in the shallow lake margins, breathing through its skin. Swampert shifts boulders and predicts storms, which a hurricane coast needs.',
  },

  // Route 1 — The Dry Wash
  fletchling: {
    tags: ['fauna', 'mechanics'],
    why: 'A small, tame, cheerful bird of the dry wash that ends as a falcon diving out of the sun — in a region that worships the sun directly.',
  },
  doduo: {
    tags: ['fauna', 'mechanics'],
    why: 'The roadrunner, in the one region where the roadrunner actually belongs, with a second head so something is always watching.',
  },
  patrat: {
    tags: ['fauna', 'mechanics'],
    why: 'The prairie dog, standing sentry on its mound while the rest of the colony feeds. Sentries are the entire reason colonies work.',
  },
  spinarak: {
    tags: ['fauna', 'mechanics'],
    why: 'The tarantula. This region\'s most famous one is bright orange, lives in exactly this scrub, and strings lines between the cactus at head height.',
  },
  scatterbug: {
    tags: ['fauna', 'thematic', 'mechanics'],
    why: 'The monarch butterfly. Hundreds of millions of them overwinter in this region\'s fir forests after flying thousands of miles south, on a migration that takes more generations than any individual lives, and the reserve they land in is a World Heritage site.',
  },

  // Thunderhead Mesa
  pichu: {
    tags: ['thematic', 'mechanics'],
    why: 'The rain god here is also the thunder god. The storms break over this mesa every afternoon in the wet season, they are violent and entirely reliable, and they have been worshipped for it for a very long time.',
  },

  // The Cenote Caves
  zubat: {
    tags: ['thematic', 'fauna'],
    why: 'The bat god of this region\'s oldest religion is not a metaphor. There are genuinely millions of them under the limestone, and they come out at dusk in a column you can see from the next valley.',
  },
  carbink: {
    tags: ['stylistic', 'mechanics'],
    why: 'Crystal growing on the cave wall, which is what these shafts are lined with — and this region has produced the largest natural crystals ever found.',
  },

  // Obsidian Desert
  sandshrew: {
    tags: ['fauna', 'mechanics'],
    why: 'It burrows to escape the heat, which is the whole of desert survival in a single behaviour.',
  },
  sandile: {
    tags: ['fauna', 'stylistic'],
    why: 'A crocodile buried in sand with only its eyes above the surface, watching the road. The eye markings read as sunglasses and the design leans all the way into the desert-bandit idea.',
  },
  trapinch: {
    tags: ['fauna', 'thematic'],
    why: 'The antlion, which digs a pit in loose sand and waits at the bottom of it. Flygon ends the line as the desert spirit that only appears inside a sandstorm and is described as singing.',
  },
  cacnea: {
    tags: ['fauna', 'stylistic'],
    why: 'A cactus with a temper that follows travellers for days and waits for them to stop moving. The scarecrow on the desert road.',
  },
  maractus: {
    tags: ['thematic', 'fauna'],
    why: 'A cactus that dances to a rhythm and rattles its own maracas. It was designed for this region\'s music specifically and it is not being subtle about it.',
  },
  silicobra: {
    tags: ['fauna', 'stylistic'],
    why: 'It sheds sand instead of skin and then buries itself in what it produced. Sandaconda stores an entire sandstorm in its own body.',
  },
  ekans: {
    tags: ['thematic', 'fauna'],
    why: 'The serpent. No animal sits closer to the centre of this region\'s ancient religion, and Arbok\'s hood is read simultaneously as a warning and as a face, exactly the way the old carvings use it.',
  },
  gligar: {
    tags: ['fauna', 'stylistic'],
    why: 'A scorpion that flies. Both halves of that are correct for this desert, and Gliscor hunts by dropping off the cliff face at night.',
  },
  cubone: {
    tags: ['thematic', 'stylistic'],
    why: 'It wears the skull of its dead mother and grieves openly, carrying her bone as both weapon and memorial. This region has an entire festival about precisely that, and it is the happiest week of the year.',
  },
  sandygast: {
    tags: ['thematic', 'stylistic'],
    why: 'A mound of sand that is also a grave, taking hold of whoever disturbed it. Palossand is a sandcastle that is a tomb, and out here the distinction is not always obvious.',
  },
  rockruff: {
    tags: ['fauna', 'stylistic'],
    why: 'The coyote — the cleverest and most persistent animal in the region, and the one that has done best out of everything people have built.',
  },

  // Sunstone Flats
  sunkern: {
    tags: ['stylistic', 'mechanics'],
    why: 'It does nothing at all but wait for sunlight, of which there is a permanent and overwhelming surplus.',
  },
  helioptile: {
    tags: ['fauna', 'stylistic'],
    why: 'A frilled lizard that generates electricity directly from sunlight. Solar power, as an animal, on flats that produce more of it than anything can use.',
  },
  solrock: {
    tags: ['thematic', 'stylistic'],
    why: 'The sun stone. This region carved a calendar into one of those and built a civilisation on top of it.',
  },
  lunatone: {
    tags: ['thematic', 'stylistic'],
    why: 'The moon stone, and the other half of that calendar. Here the moon goddess is the sun god\'s sister, cut apart and thrown into the sky.',
  },

  // The Smoking Sierra
  numel: {
    tags: ['stylistic', 'mechanics'],
    why: 'It carries magma in a hump and does not register pain, which is a reasonable adaptation to living on a volcano that is still going.',
  },
  slugma: {
    tags: ['stylistic', 'mechanics'],
    why: 'Magma that flows, and then cools to a crust over a body that is still molten — which is exactly what a lava field is.',
  },
  magby: {
    tags: ['stylistic', 'mechanics'],
    why: 'It hatches inside the crater itself. In this range the active cones are nurseries as much as they are hazards.',
  },
  salandit: {
    tags: ['fauna', 'stylistic'],
    why: 'A volcanic lizard with a toxic gas problem, on slopes that have exactly that problem. Salazzle commands a group and is always female, which was unusual enough that the locals built a temple about it.',
  },

  // Yucatl Jungle
  bellsprout: {
    tags: ['fauna', 'mechanics'],
    why: 'A carnivorous plant on the jungle floor, where insects are the only reliable source of nitrogen, hanging from a branch and waiting.',
  },
  tangela: {
    tags: ['fauna', 'stylistic'],
    why: 'A mass of vines with something inside it. Tangrowth is what a cleared trail looks like after a single wet season.',
  },
  exeggcute: {
    tags: ['fauna', 'stylistic'],
    why: 'A walking palm, which is the defining tree of the tropical lowland.',
  },
  tropius: {
    tags: ['fauna', 'stylistic'],
    why: 'It grows fruit under its neck and gives it away. The jungle\'s fruiting trees are what feed everything else in it.',
  },
  pikipek: {
    tags: ['fauna', 'stylistic'],
    why: 'The toucan — the most recognisable bird in this jungle and comfortably the loudest. Trumbeak stockpiles seeds in its bill and fires them, and fruit-eating birds are what actually replant a jungle.',
  },
  mankey: {
    tags: ['fauna', 'thematic'],
    why: 'The spider monkey, with the accurate temperament. Annihilape ends the line as rage that outlived the body, which belongs to this jungle and to the region\'s dead at the same time.',
  },
  meowth: {
    tags: ['fauna', 'thematic'],
    why: 'The ocelot: a spotted jungle cat that everyone in the region respects and nobody attempts to keep. Meowth works the market streets with a coin in its forehead.',
  },
  heracross: {
    tags: ['fauna', 'stylistic'],
    why: 'The Hercules beetle — tropical, enormous, horned, and the strongest insect there is.',
  },

  // The Floating Gardens
  wooper: {
    tags: ['fauna', 'thematic'],
    why: 'The axolotl. It exists in exactly one lake system on earth, that lake system is this one, it is critically endangered in every part of it, and it is on the currency.',
  },
  tadbulb: {
    tags: ['fauna', 'mechanics'],
    why: 'The frills and the grin are an axolotl\'s, and this one runs a current through the reed beds.',
  },
  lotad: {
    tags: ['thematic', 'fauna'],
    why: 'Ludicolo hears a rhythm and physically cannot stop dancing, and it is wearing a sombrero. This is the region\'s national Pokemon and it was never going anywhere else.',
  },

  // Tenoch City
  grafaiai: {
    tags: ['thematic', 'stylistic'],
    why: 'Muralism. This is the country that put its history on public walls at national scale — Rivera, Orozco, Siqueiros painted government buildings because the argument was that art belonged outdoors and to everyone, and the street art that covers the city now is the direct descendant. Grafaiai marks territory by painting it, at night, with its own hands.',
  },
  fidough: {
    tags: ['thematic', 'fauna'],
    why: 'The panadería. Sweet bread is a daily institution here — you take a tray and tongs and choose your own — and once a year the bakeries turn out pan de muerto, an orange-blossom loaf shaped with bones across the top, baked specifically so the dead have something waiting. Fidough is dough that became a dog and is delighted about it.',
  },
  capsakid: {
    tags: ['fauna', 'thematic'],
    why: 'The chile. Capsicum was domesticated in this country roughly six thousand years ago and every cuisine on earth that uses it got it from here — sixty-odd named varieties, dried in sacks along the market aisles, and a mole that can take three days and thirty ingredients. Scovillain is named for the scale invented to measure exactly how much of this a person can take.',
  },
  bounsweet: {
    tags: ['fauna', 'thematic'],
    why: 'The mercado. Tropical fruit stacked into walls, cut to order and eaten with chilli and lime on the walk home — and Tsareena ends the line as a dancer who fights entirely with her legs, which is the other thing the market square is for after dark.',
  },
  'oricorio-baile': {
    tags: ['thematic', 'stylistic'],
    why: 'The dance. Its default style is called Baile, which is simply the Spanish word for it, and the design is a flamenco dancer in a red ruffled skirt mid-turn. It changes what it is by drinking a different nectar, which is a reasonable description of a region with a different regional dance every few hundred kilometres.',
  },
  toxel: {
    tags: ['thematic', 'mechanics'],
    why: 'The sound. Nothing here happens quietly: sound systems in the back of trucks, brass bands that arrive without warning, and a rock scene that has been enormous since the sixties. Toxtricity is an electric guitar that decided to stand up, and it comes in two temperaments depending on how it was raised.',
  },
  bronzor: {
    tags: ['thematic', 'mechanics'],
    why: 'The bells over the square. The cathedral on the main plaza was built from the stones of the temple it replaced, its bells have rung over four centuries of that argument, and the excavated temple is now open to visitors a hundred metres away. The whole city is stacked like that.',
  },
  cufant: {
    tags: ['thematic', 'mechanics'],
    why: 'Copper. This is one of the largest copper producers on earth, and in Michoacán there is a town that has beaten it by hand since before the Spanish arrived — every workshop on the street hammering vessels out of it, and a national competition each August to judge them.',
  },
  munchlax: {
    tags: ['thematic', 'mechanics'],
    why: 'The city that eats, and is sinking. Nowhere feeds itself off the street like this — thousands of stalls going from before dawn to after midnight, and a midday meal long enough to close the offices for it. Meanwhile the whole place is settling into the lakebed it was built on, dropping something like ten metres in a century as the water is pumped out from underneath. Snorlax is an enormous appetite that does not move, sits where it likes, and slowly presses down into the ground it is sitting on.',
  },

  // City of the Dead
  gastly: {
    tags: ['thematic', 'stylistic'],
    why: 'Gas in a graveyard, which is what a graveyard reliably produces. Gengar follows people as their own shadow, and on this one night that is welcome.',
  },
  misdreavus: {
    tags: ['thematic', 'stylistic'],
    why: 'La Llorona — the weeping woman who appears near water after dark and cannot be consoled. This region has been telling that story for four hundred years and it has never once stopped being frightening.',
  },
  duskull: {
    tags: ['thematic', 'stylistic'],
    why: 'A single eye behind a bone mask, coming only for the ones whose time it is. Dusknoir escorts them where they are going, which is the entire purpose of the festival.',
  },
  greavard: {
    tags: ['thematic', 'fauna'],
    why: 'The Xoloitzcuintli. The hairless dog of this region is one of the oldest breeds on earth, it is named for Xolotl the dog-headed god of the underworld, and its job in the old belief is to meet the dead at the river and carry them across to Mictlán. Greavard is a friendly graveyard dog that follows you home; Houndstone wears its own headstone.',
  },
  comfey: {
    tags: ['thematic', 'fauna'],
    why: 'Cempasúchil — the marigold. Tonnes of them are cut every October, strung into garlands and laid in paths from the road to the door, because the smell is what the dead follow home. Comfey is a Pokemon whose entire body is a flower garland handed to someone as a welcome.',
  },
  litwick: {
    tags: ['thematic', 'stylistic'],
    why: 'The candles. The altar is lit so the dead can find the road home, and Chandelure is what happens when there are enough of them in one place.',
  },
  'pumpkaboo-average': {
    tags: ['thematic', 'stylistic'],
    why: 'A carved gourd with a light inside it, set out after dark to mark the way. Gourgeist sings on the night the road opens, and the singing is not for you.',
  },
  drifloon: {
    tags: ['thematic', 'stylistic'],
    why: 'A balloon made of souls, drifting through a festival that is already full of balloons and does not find this strange.',
  },
  'mimikyu-disguised': {
    tags: ['thematic', 'stylistic'],
    why: 'It wears a costume so that it will be loved. On this night the entire city wears one for exactly the same reason.',
  },

  // The Glyph Temples
  abra: {
    tags: ['thematic', 'mechanics'],
    why: 'It sleeps twenty hours a day and teleports the instant it is disturbed, which is why the temple priests could never keep one. Alakazam remembers everything that has ever happened to it, which is what the temples were built to do.',
  },
  natu: {
    tags: ['thematic', 'stylistic'],
    why: 'Xatu stands motionless for days with one eye on the past and one on the future, patterned like a totem. It is the most explicitly Mesoamerican design in the franchise.',
  },
  unown: {
    tags: ['thematic', 'stylistic'],
    why: 'Glyphs that arrange themselves into writing on temple walls and will not hold still long enough to be read. This region\'s real script took until the 1980s to crack and parts of it are still argued over.',
  },
  baltoy: {
    tags: ['thematic', 'stylistic'],
    why: 'A clay figurine that spins on its point, dug out of these ruins by the hundred. Claydol was made, buried, and then woke up.',
  },
  sigilyph: {
    tags: ['thematic', 'stylistic'],
    why: 'A guardian bound to enormous lines drawn across the ground, which it patrols and never deviates from. The lines are real, they are only legible from the air, and nobody agrees why they are there.',
  },
  golett: {
    tags: ['thematic', 'stylistic'],
    why: 'An automaton of clay built by a lost civilisation to do a job it no longer remembers. Golurk guarded a city that is not there any more.',
  },
  cleffa: {
    tags: ['thematic', 'mechanics'],
    why: 'It arrived with a meteorite and dances in a ring when the moon is full. Here the moon goddess was cut apart by her brother and thrown into the sky, and this is what came back down.',
  },

  // The Great Arena
  hawlucha: {
    tags: ['thematic', 'stylistic'],
    why: 'A masked wrestler that fights off the top rope. It is explicitly, entirely and unambiguously a luchador, and the region would be incomplete without it.',
  },
  passimian: {
    tags: ['thematic', 'mechanics'],
    why: 'Fútbol. The stadium next door has held a hundred thousand people since 1966, is the only ground to have decided two World Cup finals, and has a third coming. Passimian is the closest thing to a team sport the franchise has: they work in squads of ten, they win by passing to each other rather than by being individually strongest, and the whole group is judged on the result.',
  },
  scraggy: {
    tags: ['thematic', 'stylistic'],
    why: 'It holds its own shed skin up like a championship belt and picks fights it cannot possibly win. Scrafty is the rowdy end of the crowd, given a body.',
  },
  tyrogue: {
    tags: ['thematic', 'mechanics'],
    why: 'Every fighter in the region starts here and then picks a style: all reach, all hands, or upside down and spinning.',
  },
  machop: {
    tags: ['thematic', 'mechanics'],
    why: 'It trains by lifting things heavier than itself and wears a belt to keep its own strength under control, which every fighter in the arena also does.',
  },
  tauros: {
    tags: ['thematic', 'fauna'],
    why: 'The bull. The arena\'s other tradition, and the older of the two by several centuries.',
  },

  // The Turquoise Reef
  horsea: {
    tags: ['fauna', 'mechanics'],
    why: 'A seahorse in the seagrass beds behind the reef crest, ending as something that lives at a depth nobody visits.',
  },
  staryu: {
    tags: ['fauna', 'stylistic'],
    why: 'A starfish on the reef flat regrowing whatever it most recently lost. Starmie is the same reef at night.',
  },
  corsola: {
    tags: ['fauna', 'thematic'],
    why: 'It is coral. The reef along this coast is the second largest on earth, and this Pokemon is literally made of the thing that is bleaching.',
  },
  mantyke: {
    tags: ['fauna', 'thematic'],
    why: 'The manta ray. Diving this coast to swim alongside them is the region\'s other industry.',
  },
  carvanha: {
    tags: ['fauna', 'mechanics'],
    why: 'It attacks anything entering the water, in numbers — the piranha\'s reputation attached to the reef shark\'s reality.',
  },

  // The Impact Crater — Fossils
  lileep: {
    tags: ['fauna', 'mechanics'],
    why: 'A sea lily anchored to the floor of the shallow sea that covered this crater at the moment it was made, and unable to move even slightly out of the way.',
  },
  aerodactyl: {
    tags: ['thematic', 'mechanics'],
    why: 'It was in the air when the sky changed. A ring of sinkholes marks where something enormous came down here and ended the world that was flying through it.',
  },

  // Feathered Serpent Trial
  gible: {
    tags: ['thematic', 'mechanics'],
    why: 'A land shark in a burrow that becomes a serpent flying faster than sound. The feathered serpent is this region\'s oldest god and Garchomp is the shape it is carved in on every temple wall.',
  },

  // Legends of Anahua — the same shape: a domain trio plus a mythical
  'ho-oh': {
    tags: ['thematic', 'mechanics'],
    why: 'THE SUN. It burns, dies and returns — which is what the sun does, and precisely what this region\'s most important god promised to do before he left. The whole calendar is built on the assumption that he meant it.',
  },
  rayquaza: {
    tags: ['thematic', 'mechanics'],
    why: 'THE SKY. The feathered serpent at the scale the myth actually describes: a green-marked snake that lives in the sky and only comes down when the world is ending.',
  },
  groudon: {
    tags: ['thematic', 'mechanics'],
    why: 'THE EARTH. It parts the water and raises the land, and the drought that follows is remembered in the record long after the rain came back.',
  },
  mew: {
    tags: ['thematic', 'mechanics'],
    why: 'THE WITNESS. Apart from the trio, as a mythical should be: found in a jungle on this continent, and the ancestor of everything that came after. The region\'s creation story has room for that.',
  },
}
