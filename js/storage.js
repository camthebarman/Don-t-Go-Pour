/* storage.js — state shape, localStorage persistence, default seed data. */

const Storage = (function () {
  const KEY = "pourCostApp.v1";

  function defaultState() {
    const g = Calc.uid;

    // ---- Glassware presets ----
    const glassRocks = { id: g("glass"), name: "Rocks", volumeOz: 8, defaultIceOz: 4, defaultStraw: false, notes: "Old fashioned / rocks glass" };
    const glassHighball = { id: g("glass"), name: "Highball", volumeOz: 12, defaultIceOz: 5, defaultStraw: true, notes: "Highball / collins-lite" };
    const glassCollins = { id: g("glass"), name: "Collins", volumeOz: 14, defaultIceOz: 6, defaultStraw: true, notes: "Tall collins glass" };
    const glassCoupe = { id: g("glass"), name: "Coupe / Martini", volumeOz: 6, defaultIceOz: 0, defaultStraw: false, notes: "Up, served without ice" };
    const glassPint = { id: g("glass"), name: "Pint", volumeOz: 16, defaultIceOz: 0, defaultStraw: false, notes: "Beer pint" };
    const glassShot = { id: g("glass"), name: "Shot", volumeOz: 2, defaultIceOz: 0, defaultStraw: false, notes: "Neat shot / shooter" };

    // ---- Ingredients ----
    const vodka = { id: g("ing"), name: "Well Vodka", category: "Spirit", baseUnit: "floz", purchaseUnit: "ml", purchaseQty: 750, purchaseCost: 18 };
    const tequila = { id: g("ing"), name: "Tequila Blanco", category: "Spirit", baseUnit: "floz", purchaseUnit: "ml", purchaseQty: 1000, purchaseCost: 24 };
    const rum = { id: g("ing"), name: "White Rum", category: "Spirit", baseUnit: "floz", purchaseUnit: "ml", purchaseQty: 1000, purchaseCost: 20 };
    const gin = { id: g("ing"), name: "London Dry Gin", category: "Spirit", baseUnit: "floz", purchaseUnit: "ml", purchaseQty: 750, purchaseCost: 22 };
    const tripleSec = { id: g("ing"), name: "Triple Sec", category: "Liqueur", baseUnit: "floz", purchaseUnit: "ml", purchaseQty: 750, purchaseCost: 14 };
    const limeJuice = { id: g("ing"), name: "Fresh Lime Juice", category: "Juice", baseUnit: "floz", purchaseUnit: "floz", purchaseQty: 32, purchaseCost: 6 };
    const simpleSyrup = { id: g("ing"), name: "Simple Syrup", category: "Syrup", baseUnit: "floz", purchaseUnit: "floz", purchaseQty: 32, purchaseCost: 4 };
    const tonicWater = { id: g("ing"), name: "Tonic Water", category: "Mixer", baseUnit: "floz", purchaseUnit: "liter", purchaseQty: 1, purchaseCost: 2.5 };
    const clubSoda = { id: g("ing"), name: "Club Soda", category: "Mixer", baseUnit: "floz", purchaseUnit: "liter", purchaseQty: 1, purchaseCost: 1.75 };
    const cola = { id: g("ing"), name: "Cola", category: "Mixer", baseUnit: "floz", purchaseUnit: "liter", purchaseQty: 2, purchaseCost: 2.5 };
    const ice = { id: g("ing"), name: "Bagged Ice", category: "Ice", baseUnit: "ozwt", purchaseUnit: "lb", purchaseQty: 40, purchaseCost: 6 };
    const straw = { id: g("ing"), name: "Straw", category: "Straw", baseUnit: "each", purchaseUnit: "each", purchaseQty: 500, purchaseCost: 5 };
    const limeWedge = { id: g("ing"), name: "Lime Wedge", category: "Garnish", baseUnit: "each", purchaseUnit: "each", purchaseQty: 200, purchaseCost: 8 };
    const cherry = { id: g("ing"), name: "Cocktail Cherry", category: "Garnish", baseUnit: "each", purchaseUnit: "each", purchaseQty: 100, purchaseCost: 7 };
    const saltRim = { id: g("ing"), name: "Rimming Salt", category: "Garnish", baseUnit: "ozwt", purchaseUnit: "lb", purchaseQty: 1, purchaseCost: 3 };

    const ingredients = [
      vodka, tequila, rum, gin, tripleSec, limeJuice, simpleSyrup,
      tonicWater, clubSoda, cola, ice, straw, limeWedge, cherry, saltRim,
    ];

    const glassSizes = [glassRocks, glassHighball, glassCollins, glassCoupe, glassPint, glassShot];

    // ---- Sample recipes ----
    const margarita = {
      id: g("rec"),
      name: "Margarita",
      category: "Classic",
      glassId: glassRocks.id,
      menuPrice: 11,
      targetPourCostPct: 20,
      servingsPerWeek: 60,
      eventGuestCount: 100,
      eventDrinksPerGuest: 2,
      eventMixPct: 20,
      components: [
        { id: g("comp"), ingredientId: tequila.id, qty: 1.5, label: "Tequila" },
        { id: g("comp"), ingredientId: tripleSec.id, qty: 1, label: "Triple sec" },
        { id: g("comp"), ingredientId: limeJuice.id, qty: 0.75, label: "Fresh lime juice" },
        { id: g("comp"), ingredientId: simpleSyrup.id, qty: 0.25, label: "Simple syrup" },
        { id: g("comp"), ingredientId: ice.id, qty: 4, label: "Ice (shaken + served)" },
        { id: g("comp"), ingredientId: saltRim.id, qty: 0.15, label: "Salt rim" },
        { id: g("comp"), ingredientId: limeWedge.id, qty: 1, label: "Lime wedge garnish" },
      ],
    };

    const ginTonic = {
      id: g("rec"),
      name: "Gin & Tonic",
      category: "Highball",
      glassId: glassHighball.id,
      menuPrice: 9,
      targetPourCostPct: 20,
      servingsPerWeek: 80,
      eventGuestCount: 100,
      eventDrinksPerGuest: 2,
      eventMixPct: 15,
      components: [
        { id: g("comp"), ingredientId: gin.id, qty: 1.5, label: "Gin" },
        { id: g("comp"), ingredientId: tonicWater.id, qty: 5, label: "Tonic water" },
        { id: g("comp"), ingredientId: ice.id, qty: 5, label: "Ice" },
        { id: g("comp"), ingredientId: limeWedge.id, qty: 1, label: "Lime wedge garnish" },
        { id: g("comp"), ingredientId: straw.id, qty: 1, label: "Straw" },
      ],
    };

    const rumCola = {
      id: g("rec"),
      name: "Rum & Coke",
      category: "Highball",
      glassId: glassHighball.id,
      menuPrice: 8,
      targetPourCostPct: 20,
      servingsPerWeek: 70,
      eventGuestCount: 100,
      eventDrinksPerGuest: 2,
      eventMixPct: 15,
      components: [
        { id: g("comp"), ingredientId: rum.id, qty: 1.5, label: "White rum" },
        { id: g("comp"), ingredientId: cola.id, qty: 5, label: "Cola" },
        { id: g("comp"), ingredientId: ice.id, qty: 5, label: "Ice" },
        { id: g("comp"), ingredientId: straw.id, qty: 1, label: "Straw" },
      ],
    };

    const recipes = [margarita, ginTonic, rumCola];

    return {
      ingredients,
      glassSizes,
      recipes,
      settings: {
        defaultTargetPourCostPct: 20,
        defaultIceIngredientId: ice.id,
        defaultStrawIngredientId: straw.id,
      },
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.ingredients || !parsed.glassSizes || !parsed.recipes) return defaultState();
      return parsed;
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
