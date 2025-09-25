export function IsWithinMovement(ruler, waypoint, epsilon = 1e-6) {
  const limited = getLimitedMove(ruler);
  if (!Number.isFinite(limited) || limited <= 0) return true;
  const cost = movementCost(waypoint);
  return cost <= limited + epsilon;
}

export function NowInRange(ruler, waypoint, epsilon = 1e-6){
  const limited = getLimitedMove(ruler);
  const normal = getNormalMove(ruler);
  const max = getMaxMove(ruler);

  //TODO: モンスター、NPCに対応する
  // 移動力が存在しない場合は over 扱いにしておく
  if (!Number.isFinite(limited) || limited <= 0) return 'over';

  const cost = movementCost(waypoint);
  if (cost <= limited + epsilon) return 'limited';
  if (cost <= normal + epsilon) return 'normal';
  if (cost <= max + epsilon) return 'max';

  return 'over';
}

function getLimitedMove(ruler) {
  const actor = ruler?.token?.actor;
  const mv = foundry.utils.getProperty(actor, "system.attributes.move.limited");
  return Number(mv);
}

function getNormalMove(ruler) {
  const actor = ruler?.token?.actor;
  const mv = foundry.utils.getProperty(actor, "system.attributes.move.normal");
  return Number(mv);
}

function getMaxMove(ruler) {
  const actor = ruler?.token?.actor;
  const mv = foundry.utils.getProperty(actor, "system.attributes.move.max");
  return Number(mv);
}

function movementCost(waypoint){
    return waypoint.measurement.cost;
}
