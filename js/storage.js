/* storage.js — state shape, localStorage persistence, versioned seed data.
   Seed items use fixed ids and a `sinceVersion` tag so that when new
   ingredients/recipes/glasses are added later, anyone with existing saved
   data automatically gets the new ones merged in (without touching what
   they've already edited) instead of only new visitors seeing them. */

const Storage = (function () {
  const KEY = "pourCostApp.v1";
  const SEED_VERSION = 2;

  // ---- Glassware presets ----
  function seedGlasses() {
    return [
      { id: "glass_rocks", sinceVersion: 1, name: "Rocks", volumeOz: 8, defaultIceOz: 4, defaultStraw: false, notes: "Old fashioned / rocks glass" },
      { id: "glass_highball", sinceVersion: 1, name: "Highball", volumeOz: 12, defaultIceOz: 5, defaultStraw: true, notes: "Highball / collins-lite" },
      { id: "glass_collins", sinceVersion: 1, name: "Collins", volumeOz: 14, defaultIceOz: 6, defaultStraw: true, notes: "Tall collins glass" },
      { id: "glass_coupe", sinceVersion: 1, name: "Coupe / Martini", volumeOz: 6, defaultIceOz: 0, defaultStraw: false, notes: "Up, served without ice" },
      { id: "glass_pint", sinceVersion: 1, name: "Pint", volumeOz: 16, defaultIceOz: 0, defaultStraw: false, notes: "Beer pint" },
      { id: "glass_shot", sinceVersion: 1, name: "Shot", volumeOz: 2, defaultIceOz: 0, defaultStraw: false, notes: "Neat shot / shooter" },
    ];
  }

  // ---- Ingredients ----
  function seedIngredients() {
    return [
      // v1
      { id: "ing_well_vodka", sinceVersion: 1, name: "Well Vodka", category: "Spirit", baseUnit: "floz", purchaseUnit: "ml", purchaseQty: 750, purchaseCost: 18 },
      { id: "ing_tequila_blanco", sinceVersion: 1, name: "Tequila Blanco", category: "Spirit", baseUnit: "floz", purchaseUnit: "ml", purchaseQty: 1000, purchaseCost: 24 },
      { id: "ing_white_rum", sinceVersion: 1, name: "White Rum", category: "Spirit", baseUnit: "floz", purchaseUnit: "ml", purchaseQty: 1000, purchaseCost: 20 },
      { id: "ing_gin", sinceVersion: 1, name: "London Dry Gin", category: "Spirit", baseUnit: "floz", purchaseUnit: "ml", purchaseQty: 750, purchaseCost: 22 },
      { id: "ing_triple_sec", sinceVersion: 1, name: "Triple Sec", category: "Liqueur", baseUnit: "floz", purchaseUnit: "ml", purchaseQty: 750, purchaseCost: 14 },
      { id: "ing_lime_juice", sinceVersion: 1, name: "Fresh Lime Juice", category: "Juice", baseUnit: "floz", purchaseUnit: "floz", purchaseQty: 32, purchaseCost: 6 },
      { id: "ing_simple_syrup", sinceVersion: 1, name: "Simple Syrup", category: "Syrup", baseUnit: "floz", purchaseUnit: "floz", purchaseQty: 32, purchaseCost: 4 },
      { id: "ing_tonic_water", sinceVersion: 1, name: "Tonic Water", category: "Mixer", baseUnit: "floz", purchaseUnit: "liter", purchaseQty: 1, purchaseCost: 2.5 },
      { id: "ing_club_soda", sinceVersion: 1, name: "Club Soda", category: "Mixer", baseUnit: "floz", purchaseUnit: "liter", purchaseQty: 1, purchaseCost: 1.75 },
      { id: "ing_cola", sinceVersion: 1, name: "Cola", category: "Mixer", baseUnit: "floz", purchaseUnit: "liter", purchaseQty: 2, purchaseCost: 2.5 },
      { id: "ing_ice", sinceVersion: 1, name: "Bagged Ice", category: "Ice", baseUnit: "ozwt", purchaseUnit: "lb", purchaseQty: 40, purchaseCost: 6 },
      { id: "ing_straw", sinceVersion: 1, name: "Straw", category: "Straw", baseUnit: "each", unitNoun: "straw", purchaseUnit: "each", purchaseQty: 500, purchaseCost: 5 },
      { id: "ing_lime_wedge", sinceVersion: 1, name: "Lime Wedge", category: "Garnish", baseUnit: "each", unitNoun: "wedge", purchaseUnit: "each", purchaseQty: 200, purchaseCost: 8 },
      { id: "ing_cherry", sinceVersion: 1, name: "Cocktail Cherry", category: "Garnish", baseUnit: "each", unitNoun: "cherry", purchaseUnit: "each", purchaseQty: 100, purchaseCost: 7 },
      { id: "ing_salt_rim", sinceVersion: 1, name: "Rimming Salt", category: "Garnish", baseUnit: "ozwt", purchaseUnit: "lb", purchaseQty: 1, purchaseCost: 3 },

      // v2 — added for Old Fashioned, Mai Tai, Lemon Drop Martini
      { id: "ing_bourbon", sinceVersion: 2, name: "Bourbon Whiskey", category: "Spirit", baseUnit: "floz", purchaseUnit: "ml", purchaseQty: 750, purchaseCost: 22 },
      { id: "ing_dark_rum", sinceVersion: 2, name: "Dark Rum", category: "Spirit", baseUnit: "floz", purchaseUnit: "ml", purchaseQty: 1000, purchaseCost: 26 },
      { id: "ing_orange_curacao", sinceVersion: 2, name: "Orange Curaçao", category: "Liqueur", baseUnit: "floz", purchaseUnit: "ml", purchaseQty: 750, purchaseCost: 18 },
      { id: "ing_orgeat_syrup", sinceVersion: 2, name: "Orgeat Syrup", category: "Syrup", baseUnit: "floz", purchaseUnit: "floz", purchaseQty: 32, purchaseCost: 12 },
      { id: "ing_lemon_juice", sinceVersion: 2, name: "Fresh Lemon Juice", category: "Juice", baseUnit: "floz", purchaseUnit: "floz", purchaseQty: 32, purchaseCost: 6 },
      { id: "ing_sugar_rim", sinceVersion: 2, name: "Rimming Sugar", category: "Garnish", baseUnit: "ozwt", purchaseUnit: "lb", purchaseQty: 1, purchaseCost: 3 },
      { id: "ing_lemon_twist", sinceVersion: 2, name: "Lemon Twist", category: "Garnish", baseUnit: "each", unitNoun: "twist", purchaseUnit: "each", purchaseQty: 150, purchaseCost: 6 },
      { id: "ing_mint_sprig", sinceVersion: 2, name: "Mint Sprig", category: "Garnish", baseUnit: "each", unitNoun: "sprig", purchaseUnit: "each", purchaseQty: 100, purchaseCost: 5 },
      { id: "ing_orange_peel", sinceVersion: 2, name: "Orange Peel", category: "Garnish", baseUnit: "each", unitNoun: "peel", purchaseUnit: "each", purchaseQty: 150, purchaseCost: 9 },
      { id: "ing_angostura_bitters", sinceVersion: 2, name: "Angostura Bitters", category: "Dry Goods", baseUnit: "each", unitNoun: "dash", purchaseUnit: "each", purchaseQty: 200, purchaseCost: 9 },
    ];
  }

  // ---- Recipes ----
  function seedRecipes() {
    const g = Calc.uid;
    return [
      // v1
      {
        id: "rec_margarita", sinceVersion: 1, name: "Margarita", category: "Classic", glassId: "glass_rocks",
        menuPrice: 11, targetPourCostPct: 20, servingsPerWeek: 60,
        eventGuestCount: 100, eventDrinksPerGuest: 2, eventMixPct: 20,
        components: [
          { id: g("comp"), ingredientId: "ing_tequila_blanco", qty: 1.5, label: "Tequila" },
          { id: g("comp"), ingredientId: "ing_triple_sec", qty: 1, label: "Triple sec" },
          { id: g("comp"), ingredientId: "ing_lime_juice", qty: 0.75, label: "Fresh lime juice" },
          { id: g("comp"), ingredientId: "ing_simple_syrup", qty: 0.25, label: "Simple syrup" },
          { id: g("comp"), ingredientId: "ing_ice", qty: 4, label: "Ice (shaken + served)" },
          { id: g("comp"), ingredientId: "ing_salt_rim", qty: 0.15, label: "Salt rim" },
          { id: g("comp"), ingredientId: "ing_lime_wedge", qty: 1, label: "Lime wedge garnish" },
        ],
      },
      {
        id: "rec_gin_tonic", sinceVersion: 1, name: "Gin & Tonic", category: "Highball", glassId: "glass_highball",
        menuPrice: 9, targetPourCostPct: 20, servingsPerWeek: 80,
        eventGuestCount: 100, eventDrinksPerGuest: 2, eventMixPct: 15,
        components: [
          { id: g("comp"), ingredientId: "ing_gin", qty: 1.5, label: "Gin" },
          { id: g("comp"), ingredientId: "ing_tonic_water", qty: 5, label: "Tonic water" },
          { id: g("comp"), ingredientId: "ing_ice", qty: 5, label: "Ice" },
          { id: g("comp"), ingredientId: "ing_lime_wedge", qty: 1, label: "Lime wedge garnish" },
          { id: g("comp"), ingredientId: "ing_straw", qty: 1, label: "Straw" },
        ],
      },
      {
        id: "rec_rum_cola", sinceVersion: 1, name: "Rum & Coke", category: "Highball", glassId: "glass_highball",
        menuPrice: 8, targetPourCostPct: 20, servingsPerWeek: 70,
        eventGuestCount: 100, eventDrinksPerGuest: 2, eventMixPct: 15,
        components: [
          { id: g("comp"), ingredientId: "ing_white_rum", qty: 1.5, label: "White rum" },
          { id: g("comp"), ingredientId: "ing_cola", qty: 5, label: "Cola" },
          { id: g("comp"), ingredientId: "ing_ice", qty: 5, label: "Ice" },
          { id: g("comp"), ingredientId: "ing_straw", qty: 1, label: "Straw" },
        ],
      },

      // v2
      {
        id: "rec_old_fashioned", sinceVersion: 2, name: "Old Fashioned", category: "Classic", glassId: "glass_rocks",
        menuPrice: 12, targetPourCostPct: 20, servingsPerWeek: 50,
        eventGuestCount: 100, eventDrinksPerGuest: 2, eventMixPct: 15,
        components: [
          { id: g("comp"), ingredientId: "ing_bourbon", qty: 2, label: "Bourbon whiskey" },
          { id: g("comp"), ingredientId: "ing_simple_syrup", qty: 0.25, label: "Simple syrup" },
          { id: g("comp"), ingredientId: "ing_angostura_bitters", qty: 3, label: "Angostura bitters" },
          { id: g("comp"), ingredientId: "ing_ice", qty: 4, label: "Ice (large cube)" },
          { id: g("comp"), ingredientId: "ing_orange_peel", qty: 1, label: "Orange peel garnish" },
        ],
      },
      {
        id: "rec_mai_tai", sinceVersion: 2, name: "Mai Tai", category: "Tiki", glassId: "glass_rocks",
        menuPrice: 13, targetPourCostPct: 20, servingsPerWeek: 40,
        eventGuestCount: 100, eventDrinksPerGuest: 2, eventMixPct: 10,
        components: [
          { id: g("comp"), ingredientId: "ing_white_rum", qty: 1, label: "White rum" },
          { id: g("comp"), ingredientId: "ing_dark_rum", qty: 1, label: "Dark rum (float)" },
          { id: g("comp"), ingredientId: "ing_orange_curacao", qty: 0.5, label: "Orange curaçao" },
          { id: g("comp"), ingredientId: "ing_orgeat_syrup", qty: 0.5, label: "Orgeat syrup" },
          { id: g("comp"), ingredientId: "ing_lime_juice", qty: 0.75, label: "Fresh lime juice" },
          { id: g("comp"), ingredientId: "ing_ice", qty: 5, label: "Ice" },
          { id: g("comp"), ingredientId: "ing_mint_sprig", qty: 1, label: "Mint sprig garnish" },
          { id: g("comp"), ingredientId: "ing_lime_wedge", qty: 1, label: "Lime wedge garnish" },
        ],
      },
      {
        id: "rec_lemon_drop", sinceVersion: 2, name: "Lemon Drop Martini", category: "Martini", glassId: "glass_coupe",
        menuPrice: 12, targetPourCostPct: 20, servingsPerWeek: 45,
        eventGuestCount: 100, eventDrinksPerGuest: 2, eventMixPct: 12,
        components: [
          { id: g("comp"), ingredientId: "ing_well_vodka", qty: 1.5, label: "Vodka" },
          { id: g("comp"), ingredientId: "ing_triple_sec", qty: 0.5, label: "Triple sec" },
          { id: g("comp"), ingredientId: "ing_lemon_juice", qty: 0.75, label: "Fresh lemon juice" },
          { id: g("comp"), ingredientId: "ing_simple_syrup", qty: 0.5, label: "Simple syrup" },
          { id: g("comp"), ingredientId: "ing_sugar_rim", qty: 0.15, label: "Sugar rim" },
          { id: g("comp"), ingredientId: "ing_ice", qty: 3, label: "Ice (shaken)" },
          { id: g("comp"), ingredientId: "ing_lemon_twist", qty: 1, label: "Lemon twist garnish" },
        ],
      },
    ];
  }

  function defaultState() {
    return {
      ingredients: seedIngredients(),
      glassSizes: seedGlasses(),
      recipes: seedRecipes(),
      settings: {
        defaultTargetPourCostPct: 20,
        defaultIceIngredientId: "ing_ice",
        defaultStrawIngredientId: "ing_straw",
      },
      seedVersion: SEED_VERSION,
    };
  }

  // Merge in any seed ingredients/glasses/recipes added since the state was last saved,
  // without touching anything the user has already edited or added themselves.
  function applySeedUpdates(state) {
    const fromVersion = state.seedVersion || 1;
    if (fromVersion >= SEED_VERSION) return state;

    const existingIngredientIds = new Set(state.ingredients.map((i) => i.id));
    seedIngredients().forEach((ing) => {
      if (ing.sinceVersion > fromVersion && !existingIngredientIds.has(ing.id)) {
        state.ingredients.push(ing);
      }
    });

    const existingGlassIds = new Set(state.glassSizes.map((g) => g.id));
    seedGlasses().forEach((glass) => {
      if (glass.sinceVersion > fromVersion && !existingGlassIds.has(glass.id)) {
        state.glassSizes.push(glass);
      }
    });

    const existingRecipeIds = new Set(state.recipes.map((r) => r.id));
    seedRecipes().forEach((rec) => {
      if (rec.sinceVersion > fromVersion && !existingRecipeIds.has(rec.id)) {
        state.recipes.push(rec);
      }
    });

    state.seedVersion = SEED_VERSION;
    save(state);
    return state;
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.ingredients || !parsed.glassSizes || !parsed.recipes) return defaultState();
      return applySeedUpdates(parsed);
    } catch (e) {
      console.warn("Failed to load saved data, using defaults.", e);
      return defaultState();
    }
  }

  function save(state) {
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  function resetToDefaults() {
    const state = defaultState();
    save(state);
    return state;
  }

  function exportJSON(state) {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    downloadBlob(blob, "pour-cost-data.json");
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return { load, save, resetToDefaults, defaultState, exportJSON, downloadBlob, KEY };
})();
