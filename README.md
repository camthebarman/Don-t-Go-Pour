# Don't Go Pour

A beverage pour cost & usage calculator for bar and event programs. It prices out every
component of a drink — spirits/liqueurs, mixers, dry goods, ice, straws, garnish, and
house-made preps — based on glass size, then projects nightly, weekly, monthly, annual, and
one-off event usage and profitability.

No build step, no dependencies — it's a static HTML/CSS/JS app. Data is saved to your
browser's `localStorage`, with JSON export/import for backups or sharing between machines.

## Running it

Just open `index.html` in a browser, or serve the folder with any static file server:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## What it does

- **Ingredients** — enter how you actually buy something (e.g. "750 mL for $18", "40 lb bag
  for $6", "500 straws for $5") and it computes the true cost per fluid ounce, weight ounce,
  or each — whichever fits that ingredient (liquor/mixers by volume, ice by weight, garnish/
  straws by count). Pricing is calibrated to current U.S. market rates.
- **Preps** — house-made syrups, concentrates, and infusions (brown sugar syrup, cold brew
  concentrate, jalapeño-lime syrup, ginger syrup, ...). Each has its own sub-recipe of raw
  ingredients plus a batch yield; its cost per unit is computed live from those ingredients'
  prices, spread across the batch — then it can be dropped into any cocktail recipe exactly
  like a purchased ingredient.
- **Glassware** — define your glass sizes (rocks, highball, collins, coupe, copper mug, wine/
  spritz glass, pint, shot, or custom) with default ice weight and straw usage, so new recipes
  can auto-populate sensible defaults.
- **Recipes** — build a drink from any combination of ingredients and preps tied to a glass
  size. Get the total pour cost, a suggested menu price at your target pour-cost %, and — once
  you set an actual menu price — the real pour cost %, gross profit, and margin per drink.
- **Usage** — guesstimate servings per night per recipe (with an editable "operating nights
  per week"), rolled up into nightly, weekly, monthly, and annual cost, revenue, and profit.
- **Events** — guest count × average drinks per guest × % of guests expected to order that
  drink, rolled up into projected event cost, revenue, and profit.
- **Dashboard** — program-wide view: estimated nightly sales, average pour cost %, weekly
  profit, and a sortable pour-cost-% overview flagging drinks running over target.
- **Popularity ranking** — every recipe is ranked by its estimated servings/night, with
  "🔥 Best Seller" and "Least Popular" badges on the extremes, right on the Recipes tab.

The seeded menu is a 12-drink small-bar example (Margarita, Gin & Tonic, Rum & Coke, Old
Fashioned, Mai Tai, Lemon Drop Martini, Whiskey Smash, Espresso Martini, Spicy Paloma, Moscow
Mule, Aperol Spritz, Whiskey Sour) with four house-made preps behind it, calibrated so the full
menu totals roughly $3,000 in nightly sales with a realistic popular/slow-mover spread — edit
or delete any of it freely, or use **Reset Data** to restore the sample set at any time.
