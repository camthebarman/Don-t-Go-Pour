/* app.js — rendering + event wiring. Depends on Calc and Storage. */

const App = (function () {
  let state = Storage.load();

  const CATEGORIES = ["Spirit", "Liqueur", "Wine", "Beer", "Mixer", "Juice", "Syrup", "Ice", "Garnish", "Straw", "Dry Goods", "Other"];

  // ---------- generic helpers ----------
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }
  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([k, v]) => {
      if (k === "class") node.className = v;
      else if (k === "html") node.innerHTML = v;
      else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v);
    });
    (children || []).forEach((c) => node.appendChild(typeof c === "string" ? document.createTextNode(c) : c));
    return node;
  }
  function persist() { Storage.save(state); }
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => { t.hidden = true; }, 2200);
  }

  function getIngredient(id) { return state.ingredients.find((i) => i.id === id); }
  function getGlass(id) { return state.glassSizes.find((g) => g.id === id); }
  function getRecipe(id) { return state.recipes.find((r) => r.id === id); }

  // ---------- modal ----------
  function openModal(title, renderFn) {
    $("#modal-title").textContent = title;
    const body = $("#modal-body");
    body.innerHTML = "";
    renderFn(body, closeModal);
    $("#modal-overlay").hidden = false;
  }
  function closeModal() { $("#modal-overlay").hidden = true; }
  $("#modal-close").addEventListener("click", closeModal);
  $("#modal-overlay").addEventListener("click", (e) => { if (e.target === $("#modal-overlay")) closeModal(); });

  // ---------- tabs ----------
  function switchTab(name) {
    $all(".tab-btn").forEach((b) => b.classList.toggle("active", b.dataset.tab === name));
    $all(".panel").forEach((p) => p.classList.toggle("active", p.id === "panel-" + name));
  }
  $all(".tab-btn").forEach((b) => b.addEventListener("click", () => switchTab(b.dataset.tab)));

  // ---------- header actions ----------
  function updateThemeButton() {
    const btn = $("#btn-theme-toggle");
    btn.textContent = window.Theme.effective() === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode";
  }
  $("#btn-theme-toggle").addEventListener("click", () => {
    window.Theme.toggle();
    updateThemeButton();
  });
  updateThemeButton();

  $("#btn-export").addEventListener("click", () => Storage.exportJSON(state));
  $("#btn-reset").addEventListener("click", () => {
    if (confirm("Reset all data to the built-in sample dataset? This discards your current data (export first if you want a backup).")) {
      state = Storage.resetToDefaults();
      renderAll();
      toast("Data reset to defaults.");
    }
  });
  $("#input-import").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed.ingredients || !parsed.glassSizes || !parsed.recipes) throw new Error("Missing fields");
        state = parsed;
        persist();
        renderAll();
        toast("Data imported.");
      } catch (err) {
        alert("Could not import that file: " + err.message);
      }
      e.target.value = "";
    };
    reader.readAsText(file);
  });

  // ================= INGREDIENTS =================
  function renderIngredients() {
    const panel = $("#panel-ingredients");
    panel.innerHTML = "";
    panel.append(
      el("div", { class: "panel-head" }, [
        el("div", {}, [
          el("h2", {}, ["Ingredients"]),
          el("div", { class: "sub" }, ["Every liquid, dry good, ice, straw, and garnish priced down to its cost-per-use."]),
        ]),
        el("button", { class: "btn btn-primary", onclick: () => openIngredientForm() }, ["+ Add Ingredient"]),
      ])
    );

    const wrap = el("div", { class: "card" });
    if (!state.ingredients.length) {
      wrap.append(el("div", { class: "empty-state" }, ["No ingredients yet. Add your first one."]));
    } else {
      const table = el("table", {}, [
        el("thead", {}, [
          el("tr", {}, [
            el("th", {}, ["Name"]),
            el("th", {}, ["Category"]),
            el("th", {}, ["Purchased As"]),
            el("th", { class: "num" }, ["Purchase Cost"]),
            el("th", { class: "num" }, ["Cost / " + "unit"]),
            el("th", {}, [""]),
          ]),
        ]),
      ]);
      const tbody = el("tbody");
      state.ingredients
        .slice()
        .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))
        .forEach((ing) => {
          const perUnitLabel = Calc.unitLabel(ing, 1);
          const purchaseUnit = Calc.purchaseUnitsFor(ing.baseUnit).find((u) => u.id === ing.purchaseUnit);
          const purchaseLabel = purchaseUnit && purchaseUnit.id === "each" ? Calc.unitLabel(ing, ing.purchaseQty) : purchaseUnit ? purchaseUnit.label : "";
          const cpu = Calc.costPerBaseUnit(ing);
          tbody.append(
            el("tr", {}, [
              el("td", {}, [el("strong", {}, [ing.name])]),
              el("td", {}, [el("span", { class: "pill" }, [ing.category])]),
              el("td", { class: "muted" }, [`${Calc.fmtQty(ing.purchaseQty)} ${purchaseLabel} for ${Calc.fmtMoney(ing.purchaseCost)}`]),
              el("td", { class: "num" }, [Calc.fmtMoney(ing.purchaseCost)]),
              el("td", { class: "num" }, [`${Calc.fmtMoney(cpu)} / ${perUnitLabel}`]),
              el("td", {}, [
                el("div", { class: "row-actions" }, [
                  el("button", { class: "btn btn-sm", onclick: () => openIngredientForm(ing.id) }, ["Edit"]),
                  el("button", { class: "btn btn-sm danger", onclick: () => deleteIngredient(ing.id) }, ["Delete"]),
                ]),
              ]),
            ])
          );
        });
      table.append(tbody);
      wrap.append(el("div", { class: "table-wrap" }, [table]));
    }
    panel.append(wrap);
  }

  function openIngredientForm(id) {
    const existing = id ? getIngredient(id) : null;
    openModal(existing ? "Edit Ingredient" : "Add Ingredient", (body) => {
      const draft = existing
        ? { ...existing }
        : { name: "", category: "Spirit", baseUnit: "floz", purchaseUnit: "ml", purchaseQty: "", purchaseCost: "" };

      function render() {
        body.innerHTML = "";
        const purchaseOptions = Calc.purchaseUnitsFor(draft.baseUnit);
        if (!purchaseOptions.find((u) => u.id === draft.purchaseUnit)) draft.purchaseUnit = purchaseOptions[0].id;

        const form = el("form", {}, [
          field("Name", el("input", { type: "text", required: "required", value: draft.name, oninput: (e) => (draft.name = e.target.value) })),
          fieldRow([
            field("Category", selectEl(CATEGORIES, draft.category, (v) => (draft.category = v))),
            field(
              "Measured By",
              selectEl(
                Object.entries(Calc.BASE_UNITS).map(([id, u]) => ({ id, label: u.long })),
                draft.baseUnit,
                (v) => { draft.baseUnit = v; render(); },
                true
              )
            ),
          ]),
          el("div", { class: "section-title" }, ["How it's purchased"]),
          fieldRow([
            field("Quantity", el("input", { type: "number", step: "any", min: "0", required: "required", value: draft.purchaseQty, oninput: (e) => (draft.purchaseQty = e.target.value) })),
            field(
              "Unit",
              selectEl(
                purchaseOptions.map((u) => ({ id: u.id, label: u.label })),
                draft.purchaseUnit,
                (v) => (draft.purchaseUnit = v),
                true
              )
            ),
            field("Total Cost ($)", el("input", { type: "number", step: "any", min: "0", required: "required", value: draft.purchaseCost, oninput: (e) => (draft.purchaseCost = e.target.value) })),
          ]),
          el("p", { class: "hint" }, [
            `≈ ${Calc.fmtMoney(Calc.costPerBaseUnit(draft))} per ${Calc.BASE_UNITS[draft.baseUnit].label} — this is the cost recipes will use.`,
          ]),
          el("div", { class: "form-actions" }, [
            el("button", { type: "button", class: "btn", onclick: closeModal }, ["Cancel"]),
            el("button", { type: "submit", class: "btn btn-primary" }, [existing ? "Save Changes" : "Add Ingredient"]),
          ]),
        ]);
        form.addEventListener("submit", (e) => {
          e.preventDefault();
          if (!draft.name.trim()) return;
          draft.purchaseQty = Number(draft.purchaseQty) || 0;
          draft.purchaseCost = Number(draft.purchaseCost) || 0;
          if (existing) {
            Object.assign(existing, draft);
          } else {
            draft.id = Calc.uid("ing");
            state.ingredients.push(draft);
          }
          persist();
          renderIngredients();
          renderRecipes();
          renderDashboard();
          renderUsage();
          renderEvents();
          closeModal();
          toast(existing ? "Ingredient updated." : "Ingredient added.");
        });
        body.append(form);
      }
      render();
    });
  }

  function deleteIngredient(id) {
    const usedIn = state.recipes.filter((r) => r.components.some((c) => c.ingredientId === id));
    if (usedIn.length) {
      alert(`Can't delete — used in: ${usedIn.map((r) => r.name).join(", ")}. Remove it from those recipes first.`);
      return;
    }
    if (!confirm("Delete this ingredient?")) return;
    state.ingredients = state.ingredients.filter((i) => i.id !== id);
    persist();
    renderIngredients();
    toast("Ingredient deleted.");
  }

  // ================= GLASSWARE =================
  function renderGlassware() {
    const panel = $("#panel-glassware");
    panel.innerHTML = "";
    panel.append(
      el("div", { class: "panel-head" }, [
        el("div", {}, [
          el("h2", {}, ["Glassware"]),
          el("div", { class: "sub" }, ["Glass sizes drive default ice and mixer volumes when you build a recipe."]),
        ]),
        el("button", { class: "btn btn-primary", onclick: () => openGlassForm() }, ["+ Add Glass"]),
      ])
    );

    const grid = el("div", { class: "grid grid-3" });
    state.glassSizes.forEach((glass) => {
      grid.append(
        el("div", { class: "card" }, [
          el("h3", {}, [glass.name]),
          el("div", { class: "muted", style: "margin-bottom:8px" }, [`${glass.volumeOz} fl oz capacity`]),
          el("ul", { class: "breakdown-list" }, [
            el("li", {}, [el("span", {}, ["Default ice (wt.)"]), el("span", {}, [`${glass.defaultIceOz} oz`])]),
            el("li", {}, [el("span", {}, ["Default straw"]), el("span", {}, [glass.defaultStraw ? "Yes" : "No"])]),
          ]),
          glass.notes ? el("p", { class: "muted", style: "margin-top:8px" }, [glass.notes]) : el("span", {}),
          el("div", { class: "row-actions", style: "margin-top:10px" }, [
            el("button", { class: "btn btn-sm", onclick: () => openGlassForm(glass.id) }, ["Edit"]),
            el("button", { class: "btn btn-sm danger", onclick: () => deleteGlass(glass.id) }, ["Delete"]),
          ]),
        ])
      );
    });
    panel.append(grid);
  }

  function openGlassForm(id) {
    const existing = id ? getGlass(id) : null;
    openModal(existing ? "Edit Glass" : "Add Glass", (body) => {
      const draft = existing ? { ...existing } : { name: "", volumeOz: "", defaultIceOz: "", defaultStraw: false, notes: "" };
      const form = el("form", {}, [
        field("Glass Name", el("input", { type: "text", required: "required", value: draft.name, oninput: (e) => (draft.name = e.target.value) })),
        fieldRow([
          field("Capacity (fl oz)", el("input", { type: "number", step: "any", min: "0", required: "required", value: draft.volumeOz, oninput: (e) => (draft.volumeOz = e.target.value) })),
          field("Default Ice (oz weight)", el("input", { type: "number", step: "any", min: "0", value: draft.defaultIceOz, oninput: (e) => (draft.defaultIceOz = e.target.value) })),
        ]),
        field(
          "",
          el("label", { class: "checkbox-field" }, [
            el("input", { type: "checkbox", checked: draft.defaultStraw ? "checked" : null, onchange: (e) => (draft.defaultStraw = e.target.checked) }),
            el("span", {}, ["Straw included by default"]),
          ])
        ),
        field("Notes", el("input", { type: "text", value: draft.notes || "", oninput: (e) => (draft.notes = e.target.value) })),
        el("div", { class: "form-actions" }, [
          el("button", { type: "button", class: "btn", onclick: closeModal }, ["Cancel"]),
          el("button", { type: "submit", class: "btn btn-primary" }, [existing ? "Save Changes" : "Add Glass"]),
        ]),
      ]);
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        draft.volumeOz = Number(draft.volumeOz) || 0;
        draft.defaultIceOz = Number(draft.defaultIceOz) || 0;
        if (existing) Object.assign(existing, draft);
        else {
          draft.id = Calc.uid("glass");
          state.glassSizes.push(draft);
        }
        persist();
        renderGlassware();
        renderRecipes();
        closeModal();
        toast(existing ? "Glass updated." : "Glass added.");
      });
      body.append(form);
    });
  }

  function deleteGlass(id) {
    const usedIn = state.recipes.filter((r) => r.glassId === id);
    if (usedIn.length) {
      alert(`Can't delete — used in: ${usedIn.map((r) => r.name).join(", ")}.`);
      return;
    }
    if (!confirm("Delete this glass size?")) return;
    state.glassSizes = state.glassSizes.filter((g) => g.id !== id);
    persist();
    renderGlassware();
    toast("Glass deleted.");
  }

  // ================= RECIPES =================
  function renderRecipes() {
    const panel = $("#panel-recipes");
    panel.innerHTML = "";
    panel.append(
      el("div", { class: "panel-head" }, [
        el("div", {}, [
          el("h2", {}, ["Recipes"]),
          el("div", { class: "sub" }, ["Full pour cost per drink: spirits, mixers, ice, straws, and garnish."]),
        ]),
        el("button", { class: "btn btn-primary", onclick: () => openRecipeForm() }, ["+ Add Recipe"]),
      ])
    );

    if (!state.recipes.length) {
      panel.append(el("div", { class: "card empty-state" }, ["No recipes yet. Add your first one."]));
      return;
    }

    state.recipes.forEach((r) => panel.append(renderRecipeCard(r)));
  }

  function renderRecipeCard(recipe) {
    const glass = getGlass(recipe.glassId);
    const cost = Calc.recipeCost(recipe, getIngredient);
    const suggested = Calc.suggestedPrice(cost, recipe.targetPourCostPct);
    const actualPct = Calc.pourCostPct(cost, recipe.menuPrice);
    const profit = Calc.grossProfit(cost, recipe.menuPrice);

    let pillClass = "good";
    if (recipe.menuPrice) {
      if (actualPct > recipe.targetPourCostPct + 5) pillClass = "bad";
      else if (actualPct > recipe.targetPourCostPct) pillClass = "warn";
    }

    const card = el("div", { class: "card recipe-card" }, [
      el("div", { class: "recipe-card-head" }, [
        el("div", {}, [
          el("h3", {}, [recipe.name]),
          el("div", { class: "recipe-meta" }, [
            `${recipe.category || "Uncategorized"} · ${glass ? glass.name + " (" + glass.volumeOz + " oz)" : "No glass set"}`,
          ]),
        ]),
        el("div", { class: "row-actions" }, [
          el("button", { class: "btn btn-sm", onclick: () => openRecipeForm(recipe.id) }, ["Edit"]),
          el("button", { class: "btn btn-sm danger", onclick: () => deleteRecipe(recipe.id) }, ["Delete"]),
        ]),
      ]),
    ]);

    const bodyWrap = el("div", { class: "recipe-card-body two-col" });

    // Left: component breakdown
    const list = el("ul", { class: "breakdown-list" });
    recipe.components.forEach((c) => {
      const ing = getIngredient(c.ingredientId);
      if (!ing) return;
      const lineCost = Calc.componentCost(ing, c.qty);
      list.append(
        el("li", {}, [
          el("span", {}, [`${ing.name} — ${Calc.fmtQty(c.qty)} ${Calc.unitLabel(ing, c.qty)}`]),
          el("span", {}, [Calc.fmtMoney(lineCost)]),
        ])
      );
    });
    if (!recipe.components.length) list.append(el("li", {}, [el("span", { class: "muted" }, ["No components added yet."])]));
    const left = el("div", {}, [el("div", { class: "section-title" }, ["Component Cost Breakdown"]), list]);

    // Right: cost summary
    const right = el("div", {}, [
      el("div", { class: "section-title" }, ["Pour Cost Summary"]),
      el("div", { class: "grid grid-2", style: "gap:10px" }, [
        statMini("Total Pour Cost", Calc.fmtMoney(cost)),
        statMini(`Suggested Price (@${recipe.targetPourCostPct}%)`, Calc.fmtMoney(suggested)),
        statMini("Menu Price", recipe.menuPrice ? Calc.fmtMoney(recipe.menuPrice) : "—"),
        statMini("Gross Profit / Drink", recipe.menuPrice ? Calc.fmtMoney(profit) : "—"),
      ]),
      recipe.menuPrice
        ? el("div", { class: "callout " + pillClass, style: "margin-top:12px" }, [
            `Actual pour cost: ${Calc.fmtPct(actualPct)} (target ${recipe.targetPourCostPct}%)`,
          ])
        : el("div", { class: "callout warn", style: "margin-top:12px" }, ["Set a menu price to see actual pour cost %."]),
    ]);

    bodyWrap.append(left, right);
    card.append(bodyWrap);
    return card;
  }

  function statMini(label, value) {
    return el("div", { class: "stat-card" }, [
      el("div", { class: "label" }, [label]),
      el("div", { class: "value small" }, [value]),
    ]);
  }

  function openRecipeForm(id) {
    const existing = id ? getRecipe(id) : null;
    openModal(existing ? "Edit Recipe" : "Add Recipe", (body) => {
      const draft = existing
        ? JSON.parse(JSON.stringify(existing))
        : {
            name: "",
            category: "",
            glassId: state.glassSizes[0] ? state.glassSizes[0].id : "",
            menuPrice: "",
            targetPourCostPct: state.settings.defaultTargetPourCostPct || 20,
            servingsPerWeek: "",
            eventGuestCount: "",
            eventDrinksPerGuest: "",
            eventMixPct: "",
            components: [],
          };

      function applyGlassDefaults() {
        const glass = getGlass(draft.glassId);
        if (!glass) return;
        const hasIce = draft.components.some((c) => getIngredient(c.ingredientId)?.category === "Ice");
        const hasStraw = draft.components.some((c) => getIngredient(c.ingredientId)?.category === "Straw");
        if (!hasIce && glass.defaultIceOz > 0 && state.settings.defaultIceIngredientId) {
          draft.components.push({ id: Calc.uid("comp"), ingredientId: state.settings.defaultIceIngredientId, qty: glass.defaultIceOz, label: "Ice" });
        }
        if (!hasStraw && glass.defaultStraw && state.settings.defaultStrawIngredientId) {
          draft.components.push({ id: Calc.uid("comp"), ingredientId: state.settings.defaultStrawIngredientId, qty: 1, label: "Straw" });
        }
      }

      function render() {
        body.innerHTML = "";
        const cost = Calc.recipeCost(draft, getIngredient);

        const form = el("form", {});
        form.append(
          field("Recipe Name", el("input", { type: "text", required: "required", value: draft.name, oninput: (e) => (draft.name = e.target.value) })),
          fieldRow([
            field("Category (optional)", el("input", { type: "text", value: draft.category || "", oninput: (e) => (draft.category = e.target.value) })),
            field(
              "Glass Size",
              selectEl(
                state.glassSizes.map((g) => ({ id: g.id, label: `${g.name} (${g.volumeOz} oz)` })),
                draft.glassId,
                (v) => (draft.glassId = v),
                true
              )
            ),
          ]),
          !existing
            ? el(
                "button",
                {
                  type: "button",
                  class: "btn btn-sm",
                  style: "margin-bottom:10px",
                  onclick: () => { applyGlassDefaults(); render(); },
                },
                ["Auto-add default ice / straw for this glass"]
              )
            : el("span", {})
        );

        const compSection = el("div", {}, [el("div", { class: "section-title" }, ["Components (spirits, mixers, dry goods, ice, straws, garnish)"])]);
        if (!draft.components.length) {
          compSection.append(el("p", { class: "muted" }, ["No components yet — add one below."]));
        }
        draft.components.forEach((comp, idx) => {
          const ing = getIngredient(comp.ingredientId);
          const row = el("div", { class: "component-row" }, [
            field(
              idx === 0 ? "Ingredient" : "",
              selectEl(
                state.ingredients.map((i) => ({ id: i.id, label: `${i.name} (${i.category})` })),
                comp.ingredientId,
                (v) => { comp.ingredientId = v; render(); }
              )
            ),
            field(
              `Qty (${ing ? Calc.unitLabel(ing, comp.qty) : "unit"})`,
              el("input", { type: "number", step: "any", min: "0", value: comp.qty, oninput: (e) => (comp.qty = e.target.value) })
            ),
            field(idx === 0 ? "Line Cost" : "", el("input", { type: "text", disabled: "disabled", value: Calc.fmtMoney(Calc.componentCost(ing, comp.qty)) })),
            el("button", { type: "button", class: "btn btn-sm danger btn-icon", title: "Remove", onclick: () => { draft.components.splice(idx, 1); render(); } }, ["✕"]),
          ]);
          compSection.append(row);
        });
        compSection.append(
          el(
            "button",
            {
              type: "button",
              class: "btn btn-sm",
              style: "margin-top:8px",
              onclick: () => {
                draft.components.push({ id: Calc.uid("comp"), ingredientId: state.ingredients[0] ? state.ingredients[0].id : "", qty: 0 });
                render();
              },
            },
            ["+ Add Component"]
          )
        );
        form.append(compSection);

        form.append(
          el("div", { class: "section-title" }, ["Pricing"]),
          fieldRow([
            field("Menu Price ($)", el("input", { type: "number", step: "any", min: "0", value: draft.menuPrice, oninput: (e) => (draft.menuPrice = e.target.value) })),
            field("Target Pour Cost %", el("input", { type: "number", step: "any", min: "0", max: "100", value: draft.targetPourCostPct, oninput: (e) => { draft.targetPourCostPct = e.target.value; renderCostLine(); } })),
          ]),
          el("p", { class: "hint", id: "recipe-cost-line" }, [costLineText()]),

          el("div", { class: "section-title" }, ["Usage Guesstimates"]),
          field("Estimated servings / week", el("input", { type: "number", step: "any", min: "0", value: draft.servingsPerWeek, oninput: (e) => (draft.servingsPerWeek = e.target.value) })),
          fieldRow([
            field("Event guest count", el("input", { type: "number", step: "any", min: "0", value: draft.eventGuestCount, oninput: (e) => (draft.eventGuestCount = e.target.value) })),
            field("Avg drinks / guest", el("input", { type: "number", step: "any", min: "0", value: draft.eventDrinksPerGuest, oninput: (e) => (draft.eventDrinksPerGuest = e.target.value) })),
            field("% choosing this drink", el("input", { type: "number", step: "any", min: "0", max: "100", value: draft.eventMixPct, oninput: (e) => (draft.eventMixPct = e.target.value) })),
          ]),

          el("div", { class: "form-actions" }, [
            el("button", { type: "button", class: "btn", onclick: closeModal }, ["Cancel"]),
            el("button", { type: "submit", class: "btn btn-primary" }, [existing ? "Save Changes" : "Add Recipe"]),
          ])
        );

        function costLineText() {
          const c = Calc.recipeCost(draft, getIngredient);
          const sp = Calc.suggestedPrice(c, draft.targetPourCostPct);
          return `Total pour cost: ${Calc.fmtMoney(c)} — suggested price at ${draft.targetPourCostPct || 0}% pour cost: ${Calc.fmtMoney(sp)}`;
        }
        function renderCostLine() {
          const line = $("#recipe-cost-line", form);
          if (line) line.textContent = costLineText();
        }

        form.addEventListener("submit", (e) => {
          e.preventDefault();
          if (!draft.name.trim()) return;
          draft.menuPrice = draft.menuPrice === "" ? "" : Number(draft.menuPrice);
          draft.targetPourCostPct = Number(draft.targetPourCostPct) || 0;
          draft.servingsPerWeek = Number(draft.servingsPerWeek) || 0;
          draft.eventGuestCount = Number(draft.eventGuestCount) || 0;
          draft.eventDrinksPerGuest = Number(draft.eventDrinksPerGuest) || 0;
          draft.eventMixPct = Number(draft.eventMixPct) || 0;
          draft.components = draft.components
            .filter((c) => c.ingredientId)
            .map((c) => ({ ...c, qty: Number(c.qty) || 0 }));

          if (existing) {
            Object.assign(existing, draft);
          } else {
            draft.id = Calc.uid("rec");
            state.recipes.push(draft);
          }
          persist();
          renderRecipes();
          renderDashboard();
          renderUsage();
          renderEvents();
          closeModal();
          toast(existing ? "Recipe updated." : "Recipe added.");
        });

        body.append(form);
      }
      render();
    });
  }

  function deleteRecipe(id) {
    if (!confirm("Delete this recipe?")) return;
    state.recipes = state.recipes.filter((r) => r.id !== id);
    persist();
    renderRecipes();
    renderDashboard();
    renderUsage();
    renderEvents();
    toast("Recipe deleted.");
  }

  // ================= DASHBOARD =================
  function renderDashboard() {
    const panel = $("#panel-dashboard");
    panel.innerHTML = "";
    panel.append(
      el("div", { class: "panel-head" }, [
        el("div", {}, [el("h2", {}, ["Dashboard"]), el("div", { class: "sub" }, ["Program-wide pour cost health, at a glance."])]),
      ])
    );

    const recipeStats = state.recipes.map((r) => {
      const cost = Calc.recipeCost(r, getIngredient);
      return { r, cost, pct: r.menuPrice ? Calc.pourCostPct(cost, r.menuPrice) : null };
    });
    const priced = recipeStats.filter((s) => s.pct !== null);
    const avgPct = priced.length ? priced.reduce((s, x) => s + x.pct, 0) / priced.length : 0;

    let weeklyCost = 0, weeklyRevenue = 0;
    recipeStats.forEach((s) => {
      const proj = Calc.periodProjection(s.cost, s.r.menuPrice, s.r.servingsPerWeek);
      weeklyCost += proj.weekly.cost;
      weeklyRevenue += proj.weekly.revenue;
    });

    panel.append(
      el("div", { class: "grid grid-4" }, [
        statCard("Recipes", state.recipes.length),
        statCard("Ingredients Tracked", state.ingredients.length),
        statCard("Avg. Pour Cost %", priced.length ? Calc.fmtPct(avgPct) : "—"),
        statCard("Weekly Profit (est.)", Calc.fmtMoney(weeklyRevenue - weeklyCost)),
      ])
    );

    const card = el("div", { class: "card" }, [el("h3", {}, ["Recipe Pour Cost Overview"])]);
    if (!recipeStats.length) {
      card.append(el("div", { class: "empty-state" }, ["Add recipes to see pour cost analysis here."]));
    } else {
      const table = el("table", {}, [
        el("thead", {}, [
          el("tr", {}, [
            el("th", {}, ["Recipe"]),
            el("th", { class: "num" }, ["Cost"]),
            el("th", { class: "num" }, ["Menu Price"]),
            el("th", { class: "num" }, ["Pour Cost %"]),
            el("th", {}, ["Status"]),
          ]),
        ]),
      ]);
      const tbody = el("tbody");
      recipeStats
        .slice()
        .sort((a, b) => (b.pct || 0) - (a.pct || 0))
        .forEach((s) => {
          let status = el("span", { class: "pill" }, ["No price set"]);
          if (s.pct !== null) {
            if (s.pct > s.r.targetPourCostPct + 5) status = el("span", { class: "pill bad" }, ["Over target"]);
            else if (s.pct > s.r.targetPourCostPct) status = el("span", { class: "pill warn" }, ["Slightly over"]);
            else status = el("span", { class: "pill good" }, ["On target"]);
          }
          tbody.append(
            el("tr", {}, [
              el("td", {}, [s.r.name]),
              el("td", { class: "num" }, [Calc.fmtMoney(s.cost)]),
              el("td", { class: "num" }, [s.r.menuPrice ? Calc.fmtMoney(s.r.menuPrice) : "—"]),
              el("td", { class: "num" }, [s.pct !== null ? Calc.fmtPct(s.pct) : "—"]),
              el("td", {}, [status]),
            ])
          );
        });
      table.append(tbody);
      card.append(el("div", { class: "table-wrap" }, [table]));
    }
    panel.append(card);
  }

  function statCard(label, value) {
    return el("div", { class: "stat-card" }, [el("div", { class: "label" }, [label]), el("div", { class: "value" }, [String(value)])]);
  }

  // ================= USAGE (weekly/monthly/annual program usage) =================
  function renderUsage() {
    const panel = $("#panel-usage");
    panel.innerHTML = "";
    panel.append(
      el("div", { class: "panel-head" }, [
        el("div", {}, [
          el("h2", {}, ["Usage"]),
          el("div", { class: "sub" }, ["Guesstimate weekly program usage per recipe and see the weekly/monthly/annual cost and revenue impact."]),
        ]),
      ])
    );

    if (!state.recipes.length) {
      panel.append(el("div", { class: "card empty-state" }, ["Add recipes first to project usage."]));
      return;
    }

    let totalWeeklyCost = 0, totalWeeklyRevenue = 0;
    const rows = state.recipes.map((r) => {
      const cost = Calc.recipeCost(r, getIngredient);
      const weekly = Calc.periodProjection(cost, r.menuPrice, r.servingsPerWeek);
      totalWeeklyCost += weekly.weekly.cost;
      totalWeeklyRevenue += weekly.weekly.revenue;
      return { r, cost, weekly };
    });

    panel.append(
      el("div", { class: "grid grid-3" }, [
        statCard("Weekly COGS (est.)", Calc.fmtMoney(totalWeeklyCost)),
        statCard("Weekly Revenue (est.)", Calc.fmtMoney(totalWeeklyRevenue)),
        statCard("Weekly Profit (est.)", Calc.fmtMoney(totalWeeklyRevenue - totalWeeklyCost)),
      ])
    );

    rows.forEach(({ r, cost, weekly }) => {
      const card = el("div", { class: "card" });
      card.append(
        el("div", { style: "display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:8px" }, [
          el("h3", {}, [r.name]),
          el("span", { class: "muted" }, [`Pour cost: ${Calc.fmtMoney(cost)} / drink`]),
        ])
      );

      card.append(numberFieldInline("Servings / week", r.servingsPerWeek, (v) => { r.servingsPerWeek = Number(v) || 0; persist(); renderUsage(); }));

      const table = el("table", { style: "margin-top:12px" }, [
        el("thead", {}, [
          el("tr", {}, [
            el("th", {}, ["Period"]),
            el("th", { class: "num" }, ["Servings"]),
            el("th", { class: "num" }, ["Cost"]),
            el("th", { class: "num" }, ["Revenue"]),
            el("th", { class: "num" }, ["Profit"]),
          ]),
        ]),
      ]);
      const tbody = el("tbody", {}, [
        projRow("Weekly", weekly.weekly),
        projRow("Monthly", weekly.monthly),
        projRow("Annual", weekly.annual),
      ]);
      table.append(tbody);
      card.append(el("div", { class: "table-wrap" }, [table]));
      panel.append(card);
    });
  }

  // ================= EVENTS (one-off event usage guesstimates) =================
  function renderEvents() {
    const panel = $("#panel-events");
    panel.innerHTML = "";
    panel.append(
      el("div", { class: "panel-head" }, [
        el("div", {}, [
          el("h2", {}, ["Events"]),
          el("div", { class: "sub" }, ["Guesstimate one-off event usage per recipe: guest count × average drinks per guest × % of guests choosing that drink."]),
        ]),
      ])
    );

    if (!state.recipes.length) {
      panel.append(el("div", { class: "card empty-state" }, ["Add recipes first to project event usage."]));
      return;
    }

    let totalEventCost = 0, totalEventRevenue = 0;
    const rows = state.recipes.map((r) => {
      const cost = Calc.recipeCost(r, getIngredient);
      const evServings = Calc.eventServings(r.eventGuestCount, r.eventDrinksPerGuest, r.eventMixPct);
      const event = Calc.eventProjection(cost, r.menuPrice, evServings);
      totalEventCost += event.cost;
      totalEventRevenue += event.revenue;
      return { r, cost, event };
    });

    panel.append(
      el("div", { class: "grid grid-3" }, [
        statCard("Event Cost (all recipes)", Calc.fmtMoney(totalEventCost)),
        statCard("Event Revenue (all recipes)", Calc.fmtMoney(totalEventRevenue)),
        statCard("Event Profit (all recipes)", Calc.fmtMoney(totalEventRevenue - totalEventCost)),
      ])
    );

    rows.forEach(({ r, cost, event }) => {
      const card = el("div", { class: "card" });
      card.append(
        el("div", { style: "display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:8px" }, [
          el("h3", {}, [r.name]),
          el("span", { class: "muted" }, [`Pour cost: ${Calc.fmtMoney(cost)} / drink`]),
        ])
      );

      card.append(
        el("div", { class: "grid grid-3" }, [
          numberFieldInline("Event guests", r.eventGuestCount, (v) => { r.eventGuestCount = Number(v) || 0; persist(); renderEvents(); }),
          numberFieldInline("Avg drinks / guest", r.eventDrinksPerGuest, (v) => { r.eventDrinksPerGuest = Number(v) || 0; persist(); renderEvents(); }),
          numberFieldInline("% choosing this drink", r.eventMixPct, (v) => { r.eventMixPct = Number(v) || 0; persist(); renderEvents(); }),
        ])
      );

      card.append(
        el("div", { class: "grid grid-4", style: "margin-top:12px" }, [
          statMini("Estimated Servings", Calc.fmtNum(event.servings, 0)),
          statMini("Event Cost", Calc.fmtMoney(event.cost)),
          statMini("Event Revenue", Calc.fmtMoney(event.revenue)),
          statMini("Event Profit", Calc.fmtMoney(event.profit)),
        ])
      );
      panel.append(card);
    });
  }

  function projRow(label, data) {
    return el("tr", {}, [
      el("td", {}, [label]),
      el("td", { class: "num" }, [Calc.fmtNum(data.servings, 0)]),
      el("td", { class: "num" }, [Calc.fmtMoney(data.cost)]),
      el("td", { class: "num" }, [Calc.fmtMoney(data.revenue)]),
      el("td", { class: "num" }, [Calc.fmtMoney(data.profit)]),
    ]);
  }

  function numberFieldInline(label, value, onChange) {
    return field(label, el("input", { type: "number", step: "any", min: "0", value: value, oninput: (e) => onChange(e.target.value) }));
  }

  // ---------- form field helpers ----------
  function field(label, inputEl) {
    const wrap = el("div", { class: "field" });
    if (label) wrap.append(el("label", {}, [label]));
    wrap.append(inputEl);
    return wrap;
  }
  function fieldRow(fields) { return el("div", { class: "field-row" }, fields); }
  function selectEl(options, value, onChange, required) {
    const sel = el("select", required ? { required: "required" } : {});
    options.forEach((o) => {
      const optVal = typeof o === "string" ? o : o.id;
      const optLabel = typeof o === "string" ? o : o.label;
      const opt = el("option", { value: optVal }, [optLabel]);
      if (optVal === value) opt.setAttribute("selected", "selected");
      sel.append(opt);
    });
    sel.addEventListener("change", (e) => onChange(e.target.value));
    return sel;
  }

  // ---------- init ----------
  function renderAll() {
    renderDashboard();
    renderIngredients();
    renderGlassware();
    renderRecipes();
    renderUsage();
    renderEvents();
  }

  function init() {
    renderAll();
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", App.init);
