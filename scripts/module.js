import { ModuleId, SettingIds } from "./consts.js";
import { RegisterSettings } from "./setting.js";
import { NowInRange } from "./movement.js";

Hooks.once("init", () => 
    {
        RegisterSettings();

        libWrapper.register(
            ModuleId,
            "foundry.canvas.placeables.tokens.TokenRuler.prototype._getSegmentStyle",
            function (wrapped, waypoint) {
                const style = wrapped(waypoint);
                const colorId = SettingIds[NowInRange(this, waypoint)];
                const hex = foundry.utils.Color.fromString(game.settings.get(ModuleId, colorId));
                style.color = hex;
                style.alpha ??= 1.0;
                return style;
            },
            "WRAPPER");

        libWrapper.register(
            ModuleId,
            "foundry.canvas.placeables.tokens.TokenRuler.prototype._getGridHighlightStyle",
            function (wrapped, waypoint, ...rest) {
                const style = wrapped(waypoint, ...rest);
                const colorId = SettingIds[NowInRange(this, waypoint)];
                const hex = foundry.utils.Color.fromString(game.settings.get(ModuleId, colorId));
                style.color = hex;
                style.alpha ??= 1.0;
                return style;
            },
            "WRAPPER"
        );
    });
