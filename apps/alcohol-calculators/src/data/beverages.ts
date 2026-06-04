import type { BeverageEntry } from "../types";

const beerContainers = [
  { volume: 12, unit: "oz" },
  { volume: 16, unit: "oz" },
  { volume: 24, unit: "oz" },
  { volume: 25, unit: "oz" }
] satisfies BeverageEntry["commonContainers"];

const spiritContainers = [
  { volume: 1, unit: "pint" },
  { volume: 1, unit: "fifth" },
  { volume: 1, unit: "handle" }
] satisfies BeverageEntry["commonContainers"];

export const beverages: BeverageEntry[] = [
  {
    id: "regular_beer",
    displayName: "Regular beer",
    aliases: ["beer", "generic beer"],
    category: "beer",
    defaultAbv: 5,
    commonContainers: beerContainers,
    abvSource: "default assumption",
    notes: "Generic default. Verify package label when possible."
  },
  {
    id: "light_beer",
    displayName: "Light beer",
    aliases: ["lite beer"],
    category: "beer",
    defaultAbv: 4.2,
    commonContainers: beerContainers,
    abvSource: "default assumption",
    notes: "Generic default. Verify package label when possible."
  },
  {
    id: "high_gravity_beer",
    displayName: "High-gravity beer",
    aliases: ["strong beer", "ice beer"],
    category: "high-gravity beer",
    defaultAbv: 8,
    commonContainers: beerContainers,
    abvSource: "default assumption",
    notes: "Generic default. Verify package label when possible."
  },
  {
    id: "malt_liquor",
    displayName: "Malt liquor",
    aliases: ["40", "forty", "malt"],
    category: "malt liquor",
    defaultAbv: 7,
    commonContainers: [
      { volume: 16, unit: "oz" },
      { volume: 24, unit: "oz" },
      { volume: 40, unit: "oz" }
    ],
    abvSource: "default assumption",
    notes: "Generic default. Verify package label when possible."
  },
  {
    id: "hard_seltzer",
    displayName: "Hard seltzer",
    aliases: ["seltzer"],
    category: "hard seltzer",
    defaultAbv: 5,
    commonContainers: beerContainers,
    abvSource: "default assumption",
    notes: "Generic default. Verify package label when possible."
  },
  ...[8, 10, 12, 14].map((abv): BeverageEntry => ({
    id: `flavored_malt_beverage_${abv}`,
    displayName: `Flavored malt beverage (${abv}%)`,
    aliases: ["fmb", "flavored malt beverage", "alcopop"],
    category: "flavored malt beverage",
    defaultAbv: abv,
    commonContainers: beerContainers,
    abvSource: "default assumption" as const,
    notes: "Generic default. Verify package label when possible."
  })),
  {
    id: "wine",
    displayName: "Wine",
    aliases: ["table wine"],
    category: "wine",
    defaultAbv: 12,
    commonContainers: [
      { volume: 5, unit: "oz" },
      { volume: 750, unit: "mL" },
      { volume: 1.5, unit: "L" }
    ],
    abvSource: "default assumption",
    notes: "Generic default. Verify package label when possible."
  },
  {
    id: "boxed_wine",
    displayName: "Boxed wine",
    aliases: ["box wine"],
    category: "wine",
    defaultAbv: 12,
    commonContainers: [
      { volume: 3, unit: "L" },
      { volume: 5, unit: "L" }
    ],
    abvSource: "default assumption",
    notes: "Generic default. Verify package label when possible."
  },
  {
    id: "fortified_wine",
    displayName: "Fortified wine",
    aliases: ["port", "sherry"],
    category: "fortified wine",
    defaultAbv: 17,
    commonContainers: [
      { volume: 3, unit: "oz" },
      { volume: 750, unit: "mL" }
    ],
    abvSource: "default assumption",
    notes: "Generic default. Verify package label when possible."
  },
  ...["Vodka", "Whiskey", "Rum", "Tequila", "Gin"].map((name): BeverageEntry => ({
    id: name.toLowerCase(),
    displayName: name,
    aliases: [name.toLowerCase(), `${name.toLowerCase()} liquor`],
    category: "spirits",
    defaultAbv: 40,
    commonContainers: spiritContainers,
    abvSource: "default assumption" as const,
    notes: "Generic 80 proof default. Verify package label when possible."
  })),
  {
    id: "liqueur",
    displayName: "Liqueur",
    aliases: ["cordial", "liqueur cordial"],
    category: "liqueur",
    defaultAbv: 24,
    commonContainers: [
      { volume: 1.5, unit: "oz" },
      { volume: 750, unit: "mL" }
    ],
    abvSource: "default assumption",
    notes: "Generic default. Verify package label when possible."
  },
  {
    id: "natty_daddy",
    displayName: "Natty Daddy",
    aliases: ["natty daddy", "natural light daddy", "natty"],
    category: "high-gravity beer",
    defaultAbv: 8,
    commonContainers: beerContainers,
    abvSource: "product directory",
    notes: "Verify package label when possible."
  },
  {
    id: "natural_light",
    displayName: "Natural Light",
    aliases: ["natty light"],
    category: "light beer",
    defaultAbv: 4.2,
    commonContainers: beerContainers,
    abvSource: "product directory",
    notes: "Verify package label when possible."
  },
  {
    id: "bud_light",
    displayName: "Bud Light",
    aliases: ["budlight"],
    category: "light beer",
    defaultAbv: 4.2,
    commonContainers: beerContainers,
    abvSource: "product directory",
    notes: "Verify package label when possible."
  },
  {
    id: "budweiser",
    displayName: "Budweiser",
    aliases: ["bud"],
    category: "beer",
    defaultAbv: 5,
    commonContainers: beerContainers,
    abvSource: "product directory",
    notes: "Verify package label when possible."
  },
  {
    id: "coors_light",
    displayName: "Coors Light",
    aliases: ["coors lite"],
    category: "light beer",
    defaultAbv: 4.2,
    commonContainers: beerContainers,
    abvSource: "product directory",
    notes: "Verify package label when possible."
  },
  {
    id: "miller_lite",
    displayName: "Miller Lite",
    aliases: ["miller light"],
    category: "light beer",
    defaultAbv: 4.2,
    commonContainers: beerContainers,
    abvSource: "product directory",
    notes: "Verify package label when possible."
  },
  {
    id: "michelob_ultra",
    displayName: "Michelob Ultra",
    aliases: ["ultra"],
    category: "light beer",
    defaultAbv: 4.2,
    commonContainers: beerContainers,
    abvSource: "product directory",
    notes: "Verify package label when possible."
  },
  {
    id: "modelo_especial",
    displayName: "Modelo Especial",
    aliases: ["modelo"],
    category: "beer",
    defaultAbv: 4.4,
    commonContainers: beerContainers,
    abvSource: "product directory",
    notes: "Verify package label when possible."
  },
  {
    id: "corona_extra",
    displayName: "Corona Extra",
    aliases: ["corona"],
    category: "beer",
    defaultAbv: 4.6,
    commonContainers: beerContainers,
    abvSource: "product directory",
    notes: "Verify package label when possible."
  },
  {
    id: "heineken",
    displayName: "Heineken",
    aliases: ["heineken lager"],
    category: "beer",
    defaultAbv: 5,
    commonContainers: beerContainers,
    abvSource: "product directory",
    notes: "Verify package label when possible."
  },
  {
    id: "pabst_blue_ribbon",
    displayName: "Pabst Blue Ribbon",
    aliases: ["pbr"],
    category: "beer",
    defaultAbv: 4.8,
    commonContainers: beerContainers,
    abvSource: "product directory",
    notes: "Verify package label when possible."
  },
  {
    id: "steel_reserve",
    displayName: "Steel Reserve",
    aliases: ["steel reserve 211", "211"],
    category: "high-gravity beer",
    defaultAbv: 8.1,
    commonContainers: beerContainers,
    abvSource: "product directory",
    notes: "Verify package label when possible."
  },
  ...[8, 10, 12, 14].map((abv): BeverageEntry => ({
    id: `four_loko_${abv}`,
    displayName: `Four Loko (${abv}%)`,
    aliases: ["four loko", "4 loko"],
    category: "flavored malt beverage",
    defaultAbv: abv,
    abvOptions: [8, 10, 12, 14],
    commonContainers: [
      { volume: 23.5, unit: "oz" },
      { volume: 24, unit: "oz" }
    ],
    abvSource: "product directory" as const,
    notes: "Four Loko ABV varies by product and state. Verify package label."
  })),
  {
    id: "buzzballz",
    displayName: "BuzzBallz",
    aliases: ["buzz balls", "buzzball"],
    category: "ready-to-drink cocktail",
    defaultAbv: 15,
    commonContainers: [{ volume: 200, unit: "mL" }],
    abvSource: "product directory",
    notes: "Common container listed as 200 mL. Verify product label."
  },
  {
    id: "beatbox",
    displayName: "BeatBox",
    aliases: ["beat box"],
    category: "ready-to-drink cocktail",
    defaultAbv: 11.1,
    commonContainers: [{ volume: 500, unit: "mL" }],
    abvSource: "product directory",
    notes: "Common container listed as 500 mL. Verify product label."
  },
  {
    id: "white_claw",
    displayName: "White Claw",
    aliases: ["whiteclaw"],
    category: "hard seltzer",
    defaultAbv: 5,
    commonContainers: beerContainers,
    abvSource: "product directory",
    notes: "Verify package label when possible."
  },
  {
    id: "truly",
    displayName: "Truly",
    aliases: ["truly hard seltzer"],
    category: "hard seltzer",
    defaultAbv: 5,
    commonContainers: beerContainers,
    abvSource: "product directory",
    notes: "Verify package label when possible."
  },
  {
    id: "twisted_tea",
    displayName: "Twisted Tea",
    aliases: ["twisted tea hard iced tea"],
    category: "flavored malt beverage",
    defaultAbv: 5,
    commonContainers: beerContainers,
    abvSource: "product directory",
    notes: "Verify package label when possible."
  },
  {
    id: "mikes_hard_lemonade",
    displayName: "Mike's Hard Lemonade",
    aliases: ["mike's", "mikes hard lemonade"],
    category: "flavored malt beverage",
    defaultAbv: 5,
    commonContainers: beerContainers,
    abvSource: "product directory",
    notes: "Verify package label when possible."
  },
  {
    id: "highland_gaelic_ale",
    displayName: "Highland Gaelic Ale",
    aliases: ["gaelic", "gaelic ale"],
    category: "amber ale",
    defaultAbv: 5.5,
    commonContainers: [
      { volume: 12, unit: "oz" },
      { volume: 19.2, unit: "oz" }
    ],
    abvSource: "product directory",
    notes: "Starter ABV from Highland Brewing listing. Verify package label."
  },
  {
    id: "highland_avl_ipa",
    displayName: "Highland AVL IPA",
    aliases: ["avl ipa"],
    category: "IPA",
    defaultAbv: 6.5,
    commonContainers: [
      { volume: 12, unit: "oz" },
      { volume: 19.2, unit: "oz" }
    ],
    abvSource: "product directory",
    notes: "Starter ABV from Highland Brewing listing. Verify package label."
  },
  {
    id: "hiwire_hipitch_mosaic",
    displayName: "Hi-Wire Hi-Pitch Mosaic IPA",
    aliases: ["hi-pitch", "hi pitch", "hiwire hi pitch"],
    category: "IPA",
    defaultAbv: 6.7,
    commonContainers: [
      { volume: 12, unit: "oz" },
      { volume: 16, unit: "oz" }
    ],
    abvSource: "product directory",
    notes: "Starter ABV from Hi-Wire flagship listing. Verify package label."
  },
  {
    id: "hiwire_bed_of_nails",
    displayName: "Hi-Wire Bed of Nails Brown",
    aliases: ["bed of nails", "hiwire bed of nails"],
    category: "brown ale",
    defaultAbv: 5.5,
    commonContainers: [{ volume: 16, unit: "oz" }],
    abvSource: "product directory",
    notes: "ABV listings vary between 5.5% and 6.1%; verify label before relying on this default."
  },
  {
    id: "wicked_weed_pernicious",
    displayName: "Wicked Weed Pernicious IPA",
    aliases: ["pernicious"],
    category: "IPA",
    defaultAbv: 7.3,
    commonContainers: [
      { volume: 12, unit: "oz" },
      { volume: 16, unit: "oz" }
    ],
    abvSource: "product directory",
    notes: "Starter ABV from Wicked Weed listing. Verify package label."
  },
  {
    id: "green_man_ipa",
    displayName: "Green Man IPA",
    aliases: ["green man"],
    category: "IPA",
    defaultAbv: 6.2,
    commonContainers: [
      { volume: 12, unit: "oz" },
      { volume: 16, unit: "oz" }
    ],
    abvSource: "product directory",
    notes: "Starter ABV from Green Man listing. Verify package label."
  },
  {
    id: "asheville_brewing_shiva_ipa",
    displayName: "Asheville Brewing Shiva IPA",
    aliases: ["shiva", "shiva ipa"],
    category: "IPA",
    defaultAbv: 6,
    commonContainers: [
      { volume: 12, unit: "oz" },
      { volume: 16, unit: "oz" }
    ],
    abvSource: "product directory",
    notes: "Starter ABV from Asheville Brewing listing. Verify package label."
  },
  {
    id: "catawba_white_zombie",
    displayName: "Catawba White Zombie",
    aliases: ["white zombie"],
    category: "white ale",
    defaultAbv: 5.1,
    commonContainers: beerContainers,
    abvSource: "product directory",
    notes: "Starter ABV from Catawba listing. Verify package label."
  },
  {
    id: "new_belgium_fat_tire",
    displayName: "New Belgium Fat Tire",
    aliases: ["fat tire"],
    category: "amber ale",
    defaultAbv: 5.2,
    commonContainers: beerContainers,
    abvSource: "product directory",
    notes: "Starter ABV from New Belgium classic Fat Tire listing. Verify package label."
  },
  {
    id: "new_belgium_voodoo_ranger_ipa",
    displayName: "New Belgium Voodoo Ranger IPA",
    aliases: ["voodoo ranger", "voodoo ranger ipa"],
    category: "IPA",
    defaultAbv: 7,
    commonContainers: beerContainers,
    abvSource: "product directory",
    notes: "Starter ABV from New Belgium listing. Verify package label."
  },
  {
    id: "sierra_nevada_pale_ale",
    displayName: "Sierra Nevada Pale Ale",
    aliases: ["sierra nevada pale"],
    category: "pale ale",
    defaultAbv: 5.6,
    commonContainers: beerContainers,
    abvSource: "product directory",
    notes: "Starter ABV from Sierra Nevada listing. Verify package label."
  },
  {
    id: "sierra_nevada_hazy_little_thing",
    displayName: "Sierra Nevada Hazy Little Thing",
    aliases: ["hazy little thing"],
    category: "IPA",
    defaultAbv: 6.7,
    commonContainers: beerContainers,
    abvSource: "product directory",
    notes: "Starter ABV from Sierra Nevada listing. Verify package label."
  },
  {
    id: "sierra_nevada_torpedo",
    displayName: "Sierra Nevada Torpedo",
    aliases: ["torpedo", "torpedo ipa"],
    category: "IPA",
    defaultAbv: 7.2,
    commonContainers: beerContainers,
    abvSource: "product directory",
    notes: "Starter ABV from Sierra Nevada listing. Verify package label."
  },
  {
    id: "oskar_blues_dales_pale_ale",
    displayName: "Oskar Blues Dale's Pale Ale",
    aliases: ["dale's", "dales pale ale"],
    category: "pale ale",
    defaultAbv: 6.5,
    commonContainers: beerContainers,
    abvSource: "product directory",
    notes: "Starter ABV from Oskar Blues listing. Verify package label."
  },
  {
    id: "oskar_blues_mamas_yella_pils",
    displayName: "Oskar Blues Mama's Little Yella Pils",
    aliases: ["mama's little yella pils", "mamas little yella pils"],
    category: "pilsner",
    defaultAbv: 4.7,
    commonContainers: beerContainers,
    abvSource: "product directory",
    notes: "Starter ABV from Oskar Blues listing. Verify package label."
  },
  {
    id: "oskar_blues_old_chub",
    displayName: "Oskar Blues Old Chub",
    aliases: ["old chub"],
    category: "scotch ale",
    defaultAbv: 8,
    commonContainers: beerContainers,
    abvSource: "product directory",
    notes: "Starter ABV from Oskar Blues listing. Verify package label."
  }
];

export function findBeverage(query: string): BeverageEntry | undefined {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return undefined;
  }

  return beverages.find(
    (entry) =>
      entry.displayName.toLowerCase() === normalized ||
      entry.aliases.some((alias) => alias.toLowerCase() === normalized)
  );
}
