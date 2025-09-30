import { ModuleId, SettingIds } from "./consts.js";
import { L10N } from "./translator.js";

class MovementColorMenu extends foundry.applications.api.ApplicationV2 {
  static get DEFAULT_OPTIONS() {
    return {
        id: `${ModuleId}-color-menu`,
        tag: "form",
        window: { title: L10N("Menu.Title") },
        actions: { submit: MovementColorMenu.onSubmit }
    };
  }

  _prepareContext() {
    return {
      limitedColor: game.settings.get(ModuleId, SettingIds.limited),
      normalColor: game.settings.get(ModuleId, SettingIds.normal),
      maxColor: game.settings.get(ModuleId, SettingIds.max),
      overColor: game.settings.get(ModuleId, SettingIds.over),
      highlightAlpha: game.settings.get(ModuleId, SettingIds.highlight)
    };
  }

  async _renderHTML(context ) {
    const base = game.modules.get(ModuleId)?.path ?? `modules/${ModuleId}`;
    const path = `${base}/handlebars/settings.hbs`;
    const htmlString = await foundry.applications.handlebars.renderTemplate(path, context);
    const wrapper = document.createElement("div");
    wrapper.innerHTML = htmlString.trim();

    const range = wrapper.querySelector('input[name="highlightAlpha"]');
    const label = wrapper.querySelector(".range-value");
    if (range && label) range.addEventListener("input", ev => label.textContent = ev.currentTarget.value);

    return wrapper;
  }

  _replaceHTML(result, content) {
    content.replaceChildren(result);
  }

  static async onSubmit(event) {
    event?.preventDefault?.();
    const form = event?.currentTarget?.closest?.("form");
    const dict = Object.fromEntries(new FormData(form).entries());
    for (const cp of form.querySelectorAll('color-picker[name]')) {
        const name = cp.getAttribute("name");
        dict[name] = cp.value ?? cp.getAttribute("value") ?? dict[name];
    }
    const get = (k) => dict[k] ?? game.settings.get(ModuleId, k);

    const limitedColor = get(SettingIds.limited);
    const normalColor = get(SettingIds.normal);
    const maxColor = get(SettingIds.max);
    const overColor = get(SettingIds.over);
    const highlightAlpha = Math.max(0, Math.min(1, Number(get(SettingIds.highlight)) || 0));

    await game.settings.set(ModuleId, SettingIds.limited, limitedColor);
    await game.settings.set(ModuleId, SettingIds.normal, normalColor);
    await game.settings.set(ModuleId, SettingIds.max, maxColor);
    await game.settings.set(ModuleId, SettingIds.over, overColor);
    await game.settings.set(ModuleId, SettingIds.highlight, Number(highlightAlpha));
    ui.notifications.info(L10N("Msg.Saved"));
  }
}

export async function RegisterSettings(){
    const pathColorAId = "pathColorA";
    const pathColorBId = "pathColorB";
    const pathColorCId = "pathColorC";

    const base = game.modules.get(ModuleId)?.path ?? `modules/${ModuleId}`;
    await foundry.applications.handlebars.loadTemplates([`${base}/handlebars/settings.hbs`]);

    game.settings.register(ModuleId, SettingIds.limited,    { scope: "client", config: false, type: String, default: "#0088ff" });
    game.settings.register(ModuleId, SettingIds.normal,     { scope: "client", config: false, type: String, default: "#00ff88" });
    game.settings.register(ModuleId, SettingIds.max,        { scope: "client", config: false, type: String, default: "#ff8800" });
    game.settings.register(ModuleId, SettingIds.over,       { scope: "client", config: false, type: String, default: "#ff0066" });
    game.settings.register(ModuleId, SettingIds.highlight,  { scope: "client", config: false, type: Number,  default: 0.35 });

    game.settings.registerMenu(ModuleId, "colorMenu", {
    name: L10N("Menu.Title"),
    label: L10N("Menu.Open"),
    icon: "fas fa-palette",
    scope: "client",
    type: MovementColorMenu
  });
}