/* calc.js — pure calculation + unit conversion helpers. No DOM access here. */

const Calc = (function () {
  // Base units every ingredient cost boils down to.
  const BASE_UNITS = {
    floz: { label: "fl oz", long: "Fluid Ounce (volume)" },
    ozwt: { label: "oz wt", long: "Weight Ounce (mass)" },
    each: { label: "each", long: "Each (count)" },
  };

  // Purchase units a user can buy in, per base unit, and their conversion factor TO the base unit.
  const PURCHASE_UNITS = {
    floz: [
      { id: "floz", label: "fl oz", toBase: (q) => q },
      { id: "ml", label: "mL", toBase: (q) => q / 29.5735 },
      { id: "liter", label: "Liter", toBase: (q) => q * 33.814 },
      { id: "gal", label: "Gallon", toBase: (q) => q * 128 },
    ],
    ozwt: [
      { id: "ozwt", label: "oz (weight)", toBase: (q) => q },
      { id: "lb", label: "lb", toBase: (q) => q * 16 },
      { id: "kg", label: "kg", toBase: (q) => q * 35.274 },
    ],
    each: [{ id: "each", label: "each", toBase: (q) => q }],
  };

  function purchaseUnitsFor(baseUnit) {
    return PURCHASE_UNITS[baseUnit] || PURCHASE_UNITS.each;
  }

  function toBaseQty(baseUnit, purchaseUnitId, qty) {
    const units = purchaseUnitsFor(baseUnit);
    const u = units.find((u) => u.id === purchaseUnitId) || units[0];
    return u.toBase(Number(qty) || 0);
  }

  // Cost per base unit given how the ingredient was purchased.
  function costPerBaseUnit(ingredient) {
    const baseQty = toBaseQty(ingredient.baseUnit, ingredient.purchaseUnit, ingredient.purchaseQty);
    if (!baseQty) return 0;
    return (Number(ingredient.purchaseCost) || 0) / baseQty;
  }

  // Total cost of a single recipe component (qty is already expressed in the ingredient's base unit).
  function componentCost(ingredient, qty) {
    if (!ingredient) return 0;
    return costPerBaseUnit(ingredient) * (Number(qty) || 0);
  }

  // Sum of all components in a recipe. `resolveIngredient` maps ingredientId -> ingredient object.
  function recipeCost(recipe, resolveIngredient) {
    return (recipe.components || []).reduce((sum, c) => {
      const ing = resolveIngredient(c.ingredientId);
      return sum + componentCost(ing, c.qty);
    }, 0);
  }

  // Pour-cost math.
  function suggestedPrice(cost, targetPourCostPct) {
    const pct = Number(targetPourCostPct) || 0;
    if (!pct) return 0;
    return cost / (pct / 100);
  }

  function pourCostPct(cost, menuPrice) {
    const price = Number(menuPrice) || 0;
    if (!price) return 0;
    return (cost / price) * 100;
  }

  function grossProfit(cost, menuPrice) {
    return (Number(menuPrice) || 0) - cost;
  }

  function marginPct(cost, menuPrice) {
    const price = Number(menuPrice) || 0;
    if (!price) return 0;
    return (grossProfit(cost, menuPrice) / price) * 100;
  }

  // Usage / event projections.
  function periodProjection(cost, menuPrice, servingsPerWeek) {
    const servings = Number(servingsPerWeek) || 0;
    const weeklyCost = cost * servings;
    const weeklyRevenue = (Number(menuPrice) || 0) * servings;
    const weeklyProfit = weeklyRevenue - weeklyCost;
    return {
      weekly: { servings, cost: weeklyCost, revenue: weeklyRevenue, profit: weeklyProfit },
      monthly: {
        servings: servings * 4.33,
        cost: weeklyCost * 4.33,
        revenue: weeklyRevenue * 4.33,
        profit: weeklyProfit * 4.33,
      },
      annual: {
        servings: servings * 52,
        cost: weeklyCost * 52,
        revenue: weeklyRevenue * 52,
        profit: weeklyProfit * 52,
      },
    };
  }

  function eventServings(guestCount, avgDrinksPerGuest, mixPct) {
    const guests = Number(guestCount) || 0;
    const perGuest = Number(avgDrinksPerGuest) || 0;
    const mix = Number(mixPct) || 0;
    return guests * perGuest * (mix / 100);
  }

  function eventProjection(cost, menuPrice, servings) {
    const s = Number(servings) || 0;
    const eventCost = cost * s;
    const eventRevenue = (Number(menuPrice) || 0) * s;
    return { servings: s, cost: eventCost, revenue: eventRevenue, profit: eventRevenue - eventCost };
  }

  function fmtMoney(n) {
    const v = Number(n) || 0;
    return v.toLocaleString(undefined, { style: "currency", currency: "USD" });
  }

  function fmtPct(n) {
    const v = Number(n) || 0;
    return v.toFixed(1) + "%";
  }

  function fmtNum(n, digits) {
    const v = Number(n) || 0;
    return v.toFixed(digits == null ? 2 : digits);
  }

  // Like fmtNum, but drops trailing zeros: 1.00 -> "1", 1.50 -> "1.5".
  function fmtQty(n, maxDigits) {
    const v = Number(n) || 0;
    return parseFloat(v.toFixed(maxDigits == null ? 2 : maxDigits)).toString();
  }

  function pluralize(word) {
    if (/[^aeiou]y$/i.test(word)) return word.slice(0, -1) + "ies";
    if (/(s|x|z|ch|sh)$/i.test(word)) return word + "es";
    return word + "s";
  }

  // Display noun for an ingredient's unit, matched to qty (1 wedge, 3 wedges) — a
  // custom singular unitNoun (e.g. "dash", "wedge") if set, otherwise the generic
  // base-unit label (which doesn't pluralize: "fl oz", "oz wt").
  function unitLabel(ingredient, qty) {
    if (!ingredient) return "";
    if (ingredient.unitNoun) {
      return Number(qty) === 1 ? ingredient.unitNoun : pluralize(ingredient.unitNoun);
    }
    return BASE_UNITS[ingredient.baseUnit].label;
  }

  function uid(prefix) {
    return (prefix || "id") + "_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  }

  return {
    BASE_UNITS,
    purchaseUnitsFor,
    toBaseQty,
    costPerBaseUnit,
    componentCost,
    recipeCost,
    suggestedPrice,
    pourCostPct,
    grossProfit,
    marginPct,
    periodProjection,
    eventServings,
    eventProjection,
    fmtMoney,
    fmtPct,
    fmtNum,
    fmtQty,
    unitLabel,
    uid,
  };
})();
