import { GetFlagsMovement } from "./actorSettings.js";

export function IsWithinMovement(ruler, waypoint, epsilon = 1e-6) {
    const limited = getLimitedMove(ruler);
    if (!Number.isFinite(limited) || limited <= 0) return true;
    const cost = movementCost(waypoint);
    return cost <= limited + epsilon;
}

export function NowInRange(ruler, waypoint, epsilon = 1e-6){
    const actor = ruler?.token?.actor;
    let limited = getLimitedMove(actor);
    let normal = getNormalMove(actor);
    let max = getMaxMove(actor);

    // システム側に移動情報が存在しない場合(モンスター、NPC)
    if (!Number.isFinite(limited) || limited <= 0) 
    {
        const movement = GetFlagsMovement(actor);

        // 移動情報が存在しない場合は over 扱いにしておく
        if (movement.active == null || movement.list.length === 0 ) return 'over';

        let moveMod = getEfMoveMod(actor);
        if (isNaN(movemMode)) moveMod = 0;

        limited = 3;
        normal = movement.list[movement.active] + moveMod;
        max = normal * 3;
    }

    const cost = movementCost(waypoint);
    if (cost <= limited + epsilon) return 'limited';
    if (cost <= normal + epsilon) return 'normal';
    if (cost <= max + epsilon) return 'max';

    return 'over';
}

function getLimitedMove(actor) {
    const mv = foundry.utils.getProperty(actor, "system.attributes.move.limited");
    return Number(mv);
}

function getNormalMove(actor) {
    const mv = foundry.utils.getProperty(actor, "system.attributes.move.normal");
    return Number(mv);
}

function getMaxMove(actor) {
    const mv = foundry.utils.getProperty(actor, "system.attributes.move.max");
    return Number(mv);
}

function getEfMoveMod(actor) {
    const mv = foundry.utils.getProperty(actor, "system.attributes.move.efmovemod");
    return Number(mv);
}

function movementCost(waypoint){
    return waypoint.measurement.cost;
}
