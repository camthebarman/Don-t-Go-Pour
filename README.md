# Don't Go Pour

A beverage pour cost & usage calculator for bar and event programs. It prices out every
component of a drink — spirits/liqueurs, mixers, dry goods, ice, straws, and garnish — based
on glass size, then projects weekly, monthly, annual, and one-off event usage and profitability.

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
  straws by count).
- **Glassware** — define your glass sizes (rocks, highball, collins, coupe, pint, shot, or
  custom) with default ice weight and straw usage, so new recipes can auto-populate sensible
  defaults.
- **Recipes** — build a drink from any combination of ingredients (liquid, dry, ice, mixer,
  straw, garnish) tied to a glass size. Get the total pour cost, a suggested menu price at your
  target pour-cost %, and — once you set an actual menu price — the real pour cost %, gross
  profit, and margin per drink.
- **Usage & Projections** — guesstimate usage two ways per recipe:
  - **Program usage**: servings/week, rolled up into weekly, monthly, and annual cost,
    revenue, and profit.
  - **Event usage**: guest count × average drinks per guest × % of guests expected to order
    that drink, rolled up into projected event cost, revenue, and profit.
- **Dashboard** — program-wide view: recipe count, ingredients tracked, average pour cost %,
  and estimated weekly profit, plus a sortable pour-cost-% overview flagging drinks running
  over target.

Sample ingredients, glass sizes, and recipes (Margarita, Gin & Tonic, Rum & Coke) are seeded
on first load so the tool is immediately usable — edit or delete them freely, or use
**Reset Data** to restore the sample set at any time.
