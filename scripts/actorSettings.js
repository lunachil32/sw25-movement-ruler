import { ModuleId, SerializeVersion } from "./consts.js";
import { L10N, L10NFormat } from "./translator.js";

export function RegisterActorSettingsHook() {
  Hooks.on("getActorSheetHeaderButtons", (sheet, buttons) => {
    const actor = sheet.object ?? sheet.actor;
    if (!isAllowedActor(actor)) return;

    buttons.unshift({
      label: L10N("Settings.MovementInfo"),
      class: "movement-editor",
      icon: "fas fa-shoe-prints",
      onclick: () => new MovementStandardForm(actor).render(true)
    });
  });
}

const ALLOWED_TYPES = new Set(["npc", "monster"]);
const DEFAULT_MOVEMENTS = Object.freeze({ active: null, list: {} });

function isAllowedActor(actor) {
  return !!actor && ALLOWED_TYPES.has(actor.type);
}

export function GetFlagsMovement(actor) {
  const v = actor.getFlag(ModuleId, "movement") ?? DEFAULT_MOVEMENTS;

  const list = {};
  for (const [movementKey, movementValue] of Object.entries(v.list ?? {})) {
    const name = String(movementKey || "").trim();
    if (!name) continue;
    const n = Number(movementValue);
    list[name] = Number.isFinite(n) && n >= 0 ? n : 0;
  }
  
  let active =
    typeof v.active === "string" && v.active in list
      ? v.active
      : Object.keys(list)[0] ?? null;
  return { active, list };
}

async function setFlagsMovement(actor, values) {
  const norm = {};
  const names =
    Object.keys(values?.list ?? {})
      .map((s) => String(s).trim())
      .filter(Boolean);
  const seen = new Set();
  for (const name of names) {
    if (seen.has(name)) throw new Error(L10NFormat("Msg.ErrorDuplicate", {name: name}));
    seen.add(name);
    const n = Number(values.list[name]);
    norm[name] = Math.max(0, Number.isFinite(n) ? n : 0);
  }
  let active =
    typeof values?.active === "string" ? values.active.trim() : null;
  if (!active || !(active in norm)) active = names[0] ?? null;

  const payload = { active, list: norm, serializeVersion: SerializeVersion };
  await actor.setFlag(ModuleId, "movement", payload);
  return payload;
}

class MovementStandardForm extends FormApplication {
  constructor(actor, options = {}) { super(actor, options); }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "movement-standard-form",
      classes: ["sheet", "sheet-config", "standard-form", "movement-app"],
      template: `modules/${ModuleId}/handlebars/actor-movement-settings.hbs`,
      width: 600,
      resizable: true,
      closeOnSubmit: true,
      submitOnChange: false
    });
  }

  get title() { return L10NFormat("Settings.MovementInfoTitle", {name: this.object.name}); }

  async getData() {
    const { active, list } = GetFlagsMovement(this.object);
    return { active, entries: Object.entries(list).map(([name, speed]) => ({ name, speed })) };
  }

  activateListeners(html) {
    super.activateListeners(html);
    attachHandlers(html);
    html.on("click", "[data-action='cancel']", () => this.close());
  }

  async _updateObject(event, formData) {
    const { active, list } = collectFromForm(this.element);
    await setFlagsMovement(this.object, { active, list });
    ui.notifications.info(L10N("Msg.SavedMovement"));
  }
}

function attachHandlers(root) {
  const $root = root instanceof jQuery ? root : $(root);
  const $list = $root.find(".actor-movement-list");
  const $active = $root.find(".mm-active");

  $root.find(".mm-add").on("click", () => {
    const row = $(`
      <li class="actor-movement-row">
        <div class="actor-movement-name-cell">
          <img class="actor-movement-image" src="icons/svg/wing.svg" alt=""/>
          <input type="text" class="mm-name" placeholder="${L10N("Settings.MovementName")}"/>
        </div>
        <div class="actor-movement-detail">
          <label>${L10N("Settings.Movement")}</label>
          <input type="number" class="mm-speed" min="0" step="1" value="0"/>
        </div>
        <div class="actor-movement-controls">
          <a class="actor-movement-control mm-delete" title="${L10N("Settings.Delete")}"><i class="fas fa-trash"></i></a>
        </div>
      </li>
    `);
    $list.append(row);
    row.find(".mm-name").trigger("focus");
    refreshActiveOptions();
  });

  $list.on("click", ".mm-delete", (ev) => {
    $(ev.currentTarget).closest(".actor-movement-row").remove();
    refreshActiveOptions();
  });

  $list.on("input", ".mm-name", () => refreshActiveOptions());

  refreshActiveOptions();

  function refreshActiveOptions() {
    const names = $list
      .find(".mm-name")
      .map((_, el) => $(el).val().trim())
      .get()
      .filter(Boolean);

    const current = $active.val();
    $active.empty();
    for (const n of names) {
      $active.append(
        `<option value="${foundry.utils.escapeHTML(n)}">${foundry.utils.escapeHTML(n)}</option>`
      );
    }
    $active.val(names.includes(current) ? current : names[0] ?? "");
  }
}

function collectFromForm(root) {
  const $root = root instanceof jQuery ? root : $(root);
  const $list = $root.find(".actor-movement-list");
  const $active = $root.find(".mm-active");

  const list = {};
  $list.find("li.actor-movement-row").each((_, li) => {
    const $li = $(li);
    const name = $li.find(".mm-name").val().trim();
    if (!name) return;
    const speed = Number($li.find(".mm-speed").val());
    list[name] = Math.max(0, Number.isFinite(speed) ? speed : 0);
  });

  const active = ($active.val() || "").toString().trim();
  return { active, list };
}
