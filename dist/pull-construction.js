// A seamed raglan, worked bottom-up. One array entry describes one fabric
// course. Casting on, final binding off and making up are separate operations.
// Flat charts are viewed from the right side, column zero on the left.
const NAME = 'Pull raglan en quatre pièces, tricoté à plat du bas vers le haut';
const roundEven = value => 2 * Math.round(value / 2);
const fr = value => Number(value.toFixed(1)).toLocaleString('fr-FR');
const sCount = spans => spans.reduce((n, [a, b]) => n + b - a + 1, 0);
const odd = row => row % 2 === 1;

function incompatible(message) {
  return { construction: NAME, pieces: [], error: message, warnings: [message] };
}

function pointAction(point, row, round = false) {
  switch (point) {
    case 'garter':
      return round && !odd(row) ? 'Tricoter à l’envers.' : 'Tricoter à l’endroit.';
    case 'seed':
      return row === 1 ? 'Alterner 1 maille endroit et 1 maille envers.' :
        'Au point de riz, tricoter les mailles endroit à l’envers et les mailles envers à l’endroit. Intégrer les nouvelles mailles à l’alternance.';
    case 'rib':
      return row === 1 ? 'Alterner 1 maille endroit et 1 maille envers.' :
        'Continuer en côtes 1/1 en tricotant les mailles comme elles se présentent.';
    default:
      return round || odd(row) ? 'Tricoter à l’endroit.' : 'Tricoter à l’envers.';
  }
}

function selectedPoint(p) {
  return ['garter', 'rib', 'seed'].includes(p.stitch) ? p.stitch : 'stockinette';
}

function side(row) {
  return odd(row) ? 'Endroit. ' : 'Envers. ';
}

function decreaseInstruction(row, point) {
  if (odd(row) || point === 'garter') {
    return 'Au début du rang, glisser 1 maille, tricoter la suivante à l’endroit et passer la maille glissée par-dessus. En fin de rang, tricoter les 2 dernières mailles ensemble à l’endroit.';
  }
  return 'Au début du rang, tricoter les 2 premières mailles ensemble à l’envers. En fin de rang, tricoter les 2 dernières ensemble à l’envers.';
}

function liveSpan(count, width) {
  const start = (width - count) / 2;
  return [[start, start + count - 1]];
}

// Distribute single paired shapings over real rows. Favor right-side shaping
// where possible, but permit one increase/decrease at EACH edge on a WS row.
function shapingRows(begin, end, count, rounded = false) {
  if (!count) return new Set();
  const available = Array.from({ length: Math.max(0, end - begin + 1) }, (_, i) => begin + i);
  const rightSide = available.filter(odd);
  const slots = rightSide.length >= count ? rightSide : available;
  if (count > slots.length) throw new RangeError('Le nombre de rangs est insuffisant pour ce façonnage.');
  const chosen = new Set();
  let previous = -1;
  for (let i = 0; i < count; i++) {
    const fraction = (i + 0.5) / count;
    // Round necks open quickly at the bottom and more gently toward the top.
    const position = rounded ? 1 - Math.sqrt(1 - fraction * fraction) : fraction;
    const index = Math.min(slots.length - (count - i), Math.max(previous + 1, Math.floor(position * slots.length)));
    chosen.add(slots[index]);
    previous = index;
  }
  return chosen;
}

function makeRow(spans, before, action, stitch, phase, colors = true) {
  return { spans, before, action, stitch, phase, colors };
}

function cmLimits(p) {
  if (!p || p.kind !== 'pull') return 'Cette construction s’applique au pull raglan.';
  if (!['round', 'v', 'high'].includes(p.collar)) return 'Choisissez un col rond, un col V ou un col montant.';
  const limits = {
    chest: [5, 260], hem: [5, 260], length: [3, 240], sleeve: [2, 140],
    upperArm: [2, 140], cuff: [2, 140], neck: [2, 140], armhole: [2, 140]
  };
  const labels = { chest: 'tour de poitrine', hem: 'tour du bas', length: 'hauteur épaule–bas', sleeve: 'longueur de manche', upperArm: 'tour de haut de manche', cuff: 'tour de poignet', neck: 'tour d’encolure', armhole: 'hauteur d’emmanchure' };
  for (const [key, [min, max]] of Object.entries(limits)) {
    const n = p.measures?.[key];
    if (!Number.isFinite(n) || n < min || n > max)
      return 'Vérifiez la mesure « ' + labels[key] + ' » : elle doit être comprise entre ' + fr(min) + ' et ' + fr(max) + ' cm.';
  }
  if (!(p.gauge?.stitches >= 2 && p.gauge.stitches <= 80 && Number.isFinite(p.gauge.stitches)) ||
      !(p.gauge?.rows >= 2 && p.gauge.rows <= 100 && Number.isFinite(p.gauge.rows)))
    return 'Renseignez un échantillon de 10 cm valide en mailles et en rangs.';
  if (p.measures.armhole > p.measures.length * 0.74)
    return 'L’emmanchure laisse trop peu de hauteur sous l’aisselle. Réduisez sa hauteur ou allongez le corps.';
  if (p.measures.neck > p.measures.chest * 0.74)
    return 'Cette encolure est trop large pour la poitrine. Réduisez son tour ou augmentez le tour du corps.';
  if (p.measures.cuff > p.measures.upperArm)
    return 'Pour cette manche fuselée, le tour du poignet doit être inférieur ou égal au tour du haut de manche.';
  return '';
}

function quarterEllipse(a, b) {
  // Ramanujan's perimeter approximation, divided by four. Degenerate arcs
  // are straight lines rather than zero-length shapes.
  if (Math.min(a, b) <= 0.0001) return Math.max(a, b);
  return Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b))) / 4;
}

function plan(p) {
  const m = p.measures;
  const s = p.gauge.stitches / 10;
  const r = p.gauge.rows / 10;
  const bodyCast = roundEven(m.hem * s / 2) + 2;
  const chest = roundEven(m.chest * s / 2) + 2;
  const cuff = roundEven(m.cuff * s) + 2;
  const upper = roundEven(m.upperArm * s) + 2;
  // Two selvedge stitches per flat piece are included in all four counts.
  const total = Math.round(m.length * r);
  const armRows = Math.round(m.armhole * r);
  const lower = total - armRows;
  const sleeveLower = Math.round(m.sleeve * r);
  const bodyRib = Math.max(2, roundEven(Math.min(4.5, m.length * 0.064) * r));
  const sleeveRib = Math.max(2, roundEven(Math.min(5, m.sleeve * 0.10) * r));
  const under = Math.max(1, Math.min(Math.round(m.chest * 0.018 * s), Math.floor((upper - 6) / 5), Math.floor((chest - 10) / 6)));
  const pick = roundEven(m.neck * s);
  if (Math.min(chest, bodyCast, upper, cuff) < 6 || pick < 12)
    return { error: 'À cet échantillon, le poignet, le corps ou le col comporte trop peu de mailles pour former les coutures et les côtes. Vérifiez les mesures ou choisissez un fil plus fin.' };
  if (armRows < 6 || lower <= bodyRib + 1 || sleeveLower <= sleeveRib + 1)
    return { error: 'Il manque des rangs entre les côtes, l’aisselle et l’encolure. Augmentez la hauteur concernée ou vérifiez l’échantillon de rangs.' };
  if (Math.abs(chest - bodyCast) / 2 > lower - bodyRib)
    return { error: 'L’écart entre le bas et la poitrine demanderait plusieurs changements par bord à chaque rang. Rapprochez les deux tours ou allongez le corps sous l’aisselle.' };
  if ((upper - cuff) / 2 > sleeveLower - sleeveRib)
    return { error: 'La manche est trop courte pour passer du poignet au tour de haut de manche par une augmentation par bord et par rang. Allongez-la ou rapprochez les deux tours.' };

  const requestedDepth = {
    round: Math.min(m.armhole * 0.33, m.neck * 0.145),
    v: Math.min(m.armhole * 0.62, m.neck * 0.29),
    high: Math.min(m.armhole * 0.20, m.neck * 0.075)
  }[p.collar];
  const depthRows = Math.max(3, Math.round(requestedDepth * r));
  let splitRow = total - depthRows + 1;
  if (!odd(splitRow)) splitRow--;
  if (splitRow <= lower + 2)
    return { error: 'L’ouverture du devant empiète sur les rabattages d’aisselle. Augmentez la hauteur d’emmanchure ou réduisez l’encolure.' };
  const depth = (total - splitRow + 1) / r;
  const sleeveTop = Math.max(4, roundEven(m.neck * 0.06 * s) + 2);
  const sleeveDec = (upper - 2 * under - sleeveTop) / 2;
  if (!Number.isInteger(sleeveDec) || sleeveDec < 1)
    return { error: 'Le haut de manche est trop étroit pour son rabattage d’aisselle et sa portion d’encolure. Augmentez son tour ou réduisez celui du col.' };

  // Choose the horizontal back neckline that best fits the desired neck
  // circumference, including both sleeve tops and the shaped FRONT edge.
  // The sleeve cap row count is solved independently of the body row count
  // so that diagonal seam lengths agree despite different sleeve/chest widths.
  let best = null;
  const bodyHeight = (armRows - 2) / r;
  for (let cleanBack = 4; cleanBack <= chest - 2 * under - 6; cleanBack += 2) {
    const backTop = cleanBack + 2;
    const tip = backTop >= 10 ? 2 : 1;
    const endGap = backTop - 2 * tip;
    const bindCenter = p.collar === 'v' ? 0 : Math.min(endGap, Math.max(2, roundEven(endGap * (p.collar === 'high' ? 0.72 : 0.50))));
    const neckDec = (endGap - bindCenter) / 2;
    const bodyDec = (chest - 2 * under - backTop) / 2;
    if (bodyDec < 1 || bodyDec > armRows - 2 || neckDec > total - splitRow) continue;
    const edge = Math.hypot(bodyHeight, bodyDec / s);
    const capSquared = edge * edge - (sleeveDec / s) ** 2;
    if (capSquared <= 0) continue;
    const capShapeRows = Math.round(Math.sqrt(capSquared) * r);
    if (capShapeRows < Math.max(2, sleeveDec) || capShapeRows + sleeveLower > 3000) continue;
    const plain = cleanBack / s;
    const bottom = bindCenter / s;
    const frontLength = p.collar === 'v' ? 2 * Math.hypot(plain / 2, depth) :
      bottom + 2 * quarterEllipse(Math.max(0, (plain - bottom) / 2), depth);
    const circumference = plain + 2 * (sleeveTop - 2) / s + frontLength;
    const frontPick = pick - cleanBack - 2 * (sleeveTop - 2);
    if (frontPick < bindCenter + 2 || (frontPick - bindCenter) % 2) continue;
    // Even when stitches are much wider/narrower than usual, never ask for
    // more pickups than there are actual row ends plus horizontal steps.
    if ((frontPick - bindCenter) / 2 > total - splitRow + 1 + neckDec + tip) continue;
    const difference = Math.abs(circumference - m.neck);
    if (!best || difference < best.difference) {
      best = { backTop, cleanBack, sleeveTop, bodyDec, sleeveDec, bindCenter, tip, neckDec,
        capRows: capShapeRows + 2, edge, capEdge: Math.hypot(capShapeRows / r, sleeveDec / s),
        circumference, frontPick, difference, frontSidePick: (frontPick - bindCenter) / 2 };
    }
  }
  if (!best || best.difference > Math.max(2 / s, m.neck * 0.14))
    return { error: 'Ces mesures ne donnent pas un raglan que l’on peut assembler avec ce col. Vérifiez d’abord le tour du haut de manche, la hauteur d’emmanchure et le tour d’encolure. Augmenter la hauteur d’emmanchure donne davantage de rangs de façonnage.' };
  const collarRows = Math.max(2, Math.round((p.collar === 'high' ? Math.min(11, m.neck * 0.22) : Math.min(2.5, m.neck * 0.055)) * r));
  return { ...best, m, s, r, bodyCast, chest, cuff, upper, total, lower, armRows, sleeveLower,
    bodyRib, sleeveRib, under, depth, splitRow, pick, collarRows, point: selectedPoint(p), collar: p.collar };
}

function lowerSection(a, cast, target, count, rib, width) {
  const rows = [];
  const changes = shapingRows(rib + 1, count, Math.abs(target - cast) / 2);
  const sign = Math.sign(target - cast);
  let current = cast;
  for (let row = 1; row <= count; row++) {
    const before = current;
    const border = row <= rib;
    const stitch = border ? 'rib' : a.point;
    let action = side(row);
    if (changes.has(row)) {
      current += 2 * sign;
      action += sign > 0 ?
        'Ajouter 1 maille après la première maille et 1 maille avant la dernière : soulever le fil entre deux mailles et le tricoter torse. ' :
        decreaseInstruction(row, stitch) + ' ';
    }
    if (row === rib + 1 && stitch === 'seed') {
      action += 'Commencer le point de riz en alternant 1 maille endroit et 1 maille envers.';
    } else if (row === rib + 1 && stitch !== 'rib') action += 'Quitter les côtes. ' + pointAction(stitch, row);
    else action += pointAction(stitch, row);
    rows.push(makeRow(liveSpan(current, width), before, action, stitch, border ? 'rib' : 'body', !border));
  }
  return rows;
}

function addCap(piece, a, isSleeve, front) {
  const start = isSleeve ? a.sleeveLower : a.lower;
  const total = start + (isSleeve ? a.capRows : a.armRows);
  const outerDecs = shapingRows(start + 3, total, isSleeve ? a.sleeveDec : a.bodyDec);
  const innerDecs = front ? shapingRows(a.splitRow + 1, total, a.neckDec, a.collar !== 'v') : new Set();
  const initial = piece.rows.at(-1).spans[0];
  let [left, right] = initial;
  let gap = 0;
  for (let row = start + 1; row <= total; row++) {
    const before = sCount(piece.rows.at(-1).spans);
    const binding = row <= start + 2;
    const decOuter = outerDecs.has(row);
    const decInner = innerDecs.has(row);
    const split = front && row === a.splitRow;
    const divided = front && row >= a.splitRow;
    let action = side(row);
    if (binding) {
      if (odd(row)) right -= a.under;
      else left += a.under;
      action += 'Au début du rang, rabattre ' + a.under + ' m. pour l’aisselle (bord ' +
        (odd(row) ? 'droit' : 'gauche') + ' du diagramme). Tricoter jusqu’au bout au point de l’ouvrage.';
    }
    if (decOuter) { left++; right--; }
    if (split) gap = a.bindCenter;
    if (decInner) gap += 2;
    const middle = piece.width / 2;
    const spans = divided ? [[left, middle - gap / 2 - 1], [middle + gap / 2, right]] : [[left, right]];
    if (spans.some(([lo, hi]) => lo > hi || !Number.isInteger(lo) || !Number.isInteger(hi)))
      throw new RangeError('L’encolure ne laisse pas assez de mailles pour finir les pointes du devant.');
    if (split) {
      const rightCount = spans[1][1] - spans[1][0] + 1;
      action += 'Séparer le devant. Depuis le bord droit du diagramme, ';
      if (decOuter) action += 'diminuer 1 m. pour le raglan puis ';
      action += 'tricoter jusqu’à avoir ' + rightCount + ' m. travaillées à droite. Laisser ce fil en attente. ';
      if (a.bindCenter) {
        action += 'Avec une seconde pelote, rabattre les ' + a.bindCenter +
          ' m. centrales sans prendre la dernière maille du premier groupe. La maille restante de ce rabattage appartient déjà au groupe gauche. ';
      } else {
        action += 'Placer un repère dans le tissu à la pointe du V. Attacher une seconde pelote sur la première maille du groupe gauche, sans réunir les deux groupes. ';
      }
      action += 'Terminer le groupe gauche' + (decOuter ? ' avec 1 diminution à son bord extérieur.' : '.') +
        ' Continuer les deux côtés sur le même rang, chacun avec son fil.';
    } else if (divided) {
      action += 'Avec les deux fils séparés, travailler le groupe ' + (odd(row) ? 'droit puis le gauche' : 'gauche puis le droit') +
        ' tel que vu sur le diagramme. ';
      if (decOuter && decInner && before === 6) {
        action += 'Sur chacun des deux groupes de 3 m., réunir les deux diminutions (raglan et encolure) : tricoter les 3 m. ensemble ' +
          (odd(row) || a.point === 'garter' ? 'à l’endroit' : 'à l’envers') + '. Il reste 1 m. de chaque côté.';
      } else {
        if (decOuter) action += 'Sur chaque groupe, diminuer 1 m. au bord extérieur (raglan), en tricotant ensemble les deux mailles de ce bord. ';
        if (decInner) action += 'Sur chaque groupe, diminuer 1 m. au bord intérieur (encolure), en tricotant ensemble les deux mailles de ce bord. ';
        action += pointAction(a.point, row) + ' Garder ' + (spans[0][1] - spans[0][0] + 1) + ' m. par côté.';
      }
    } else if (!binding) {
      if (decOuter) action += 'Former le raglan. ' + decreaseInstruction(row, a.point) + ' ';
      action += pointAction(a.point, row);
    }
    piece.rows.push(makeRow(spans, before, action, a.point, binding ? 'underarm' : divided ? 'neck' : 'raglan'));
  }
}

function panel(a, id, name, isSleeve = false) {
  const front = id === 'front';
  const cast = isSleeve ? a.cuff : a.bodyCast;
  const target = isSleeve ? a.upper : a.chest;
  const lower = isSleeve ? a.sleeveLower : a.lower;
  const rib = isSleeve ? a.sleeveRib : a.bodyRib;
  const width = Math.max(cast, target);
  const piece = {
    id, name, mode: 'flat', part: isSleeve ? 'sleeve' : 'body', surface: isSleeve ? id : 'body',
    width, rows: lowerSection(a, cast, target, lower, rib, width),
    setupCount: cast, castOn: cast,
    setup: 'Avec le fil indiqué pour le début de cette pièce, monter souplement ' + cast + ' mailles, dont une maille de lisière à chaque extrémité pour la couture. Le montage est terminé avant le rang 1. Commencer sur l’endroit par ' +
      rib + ' rangs de côtes 1/1. ' + (isSleeve ? 'La manche commence au poignet.' : 'Cette pièce commence au bas du vêtement.'),
    shaping: { ribRows: rib, underarmRow: lower + 1, raglanRow: lower + 3, neckRow: front ? a.splitRow : null }
  };
  addCap(piece, a, isSleeve, front);
  const last = sCount(piece.rows.at(-1).spans);
  piece.finishCount = last;
  piece.bindOff = last;
  piece.mapping = { vStart: rib, vEnd: piece.rows.length - 1 };
  if (front) piece.finish = (a.tip === 1 ? 'Il reste 1 maille de chaque côté. Couper les deux fils en gardant une longueur pour la couture, puis passer chaque fil dans la dernière maille de son côté pour la fermer.' :
    'Rabattre les ' + a.tip + ' dernières mailles du premier côté, puis les ' + a.tip + ' du second avec son propre fil.') +
    ' Les deux pointes se joindront au sommet des manches lors du montage du raglan.';
  else piece.finish = 'Rabattre souplement les ' + last + ' mailles restantes en un rang de fermeture. Le bord obtenu forme ' +
    (isSleeve ? 'une partie de l’encolure, entre le dos et le devant.' : 'le bord arrière de l’encolure.');
  return piece;
}

function raglanAssembly(a) {
  return { id: 'join-raglans', name: 'Coutures du raglan', mode: 'finish', surface: 'body', part: 'trim', width: 0, rows: [],
    setup: 'Prévoir une aiguille à laine et des repères. Chaque manche relie le devant au dos. La gauche et la droite sont celles de la personne qui porte le pull.',
    tasks: [
      'Humidifier les quatre pièces selon l’étiquette du fil. Les mettre à plat aux mesures prévues : corps ' + fr(a.m.length) + ' cm de haut, ' + fr(a.m.chest / 2) +
        ' cm de large à la poitrine ; manches ' + fr(a.m.sleeve) + ' cm du poignet à l’aisselle et ' + fr(a.m.upperArm) +
        ' cm de large en haut avant la couture. Laisser sécher, puis marquer les extrémités, le milieu et les quarts de chaque diagonale.',
      'Coudre le bord avant de la manche gauche au raglan gauche du devant (gauche de la personne qui porte le pull). Utiliser la même méthode pour les quatre coutures : placer les bords côte à côte, endroit visible. Au point de matelas, coudre de la fin du rabattage d’aisselle vers le col ; répartir les ' +
        (a.capRows - 2) + ' rangs de manche sur les ' + (a.armRows - 2) + ' rangs du corps entre les repères, sans froncer. La couture mesure environ ' + fr(a.edge) + ' cm.',
      'Coudre le bord arrière de cette même manche au raglan gauche du dos.',
      'Coudre le bord avant de la manche droite au raglan droit du devant.',
      'Coudre le bord arrière de cette même manche au raglan droit du dos.'
    ],
    finish: 'Les quatre coutures entourent maintenant l’encolure. Laisser les petits bords d’aisselle, les côtés et les dessous de manches ouverts pour le moment.' };
}

function collarPiece(a) {
  const v = a.collar === 'v';
  const count = a.pick;
  const sleeve = a.sleeveTop - 2;
  let setup = '';
  if (v) {
    setup += 'Col V à bandes croisées. Sur l’endroit, partir de la pointe du V et relever ' + a.frontSidePick +
      ' m. en remontant un premier bord du V, ' + sleeve + ' m. au sommet de la première manche, ' + a.cleanBack +
      ' m. au dos, ' + sleeve + ' m. sur la seconde manche et ' + a.frontSidePick + ' m. en redescendant l’autre bord du V. Total ' +
      count + ' m. Répartir les relevages régulièrement entre les extrémités de chaque section. Laisser la bande ouverte à la pointe. Tourner : le premier rang après relevage se travaille sur l’envers.';
  } else {
    setup += 'Sur une aiguille circulaire, partir de la jonction dos/manche. Sur l’endroit, relever et tricoter ' +
      a.cleanBack + ' m. le long du dos, ' + sleeve + ' m. au sommet de la manche, puis ' + a.frontSidePick +
      ' m. en descendant le premier côté du devant, ' + a.bindCenter + ' m. au centre, ' + a.frontSidePick +
      ' m. en remontant le second côté et ' + sleeve + ' m. au sommet de la seconde manche. Total ' + count +
      ' m. Répartir les relevages régulièrement sur chaque courbe. Placer un anneau et fermer en rond sans vriller.';
  }
  const rows = [];
  for (let i = 1; i <= a.collarRows; i++) {
    const face = v ? (odd(i) ? 'Envers. ' : 'Endroit. ') : 'En rond. ';
    const instruction = i === 1 ? 'Alterner 1 maille endroit, 1 maille envers sur les ' + count + ' mailles.' :
      'Continuer les côtes 1/1 sur ' + count + ' mailles comme elles se présentent' + (v ? ', puis tourner.' : ' jusqu’à l’anneau.');
    rows.push(makeRow([[0, count - 1]], count, face + instruction, 'rib', 'collar', false));
  }
  const finish = 'Rabattre souplement les ' + count + ' mailles dans le sens des côtes et vérifier que la tête passe dans l’encolure avant de rentrer les fils.' +
    (v ? ' Au bas du V, croiser les deux petites extrémités à plat. Fixer la première sous le bord opposé et la seconde par-dessus à petits points souples.' : '');
  return { id: 'collar', name: v ? 'Col V croisé' : a.collar === 'high' ? 'Col montant' : 'Col rond', mode: v ? 'flat' : 'round',
    // On a flat V band the first fabric row follows a right-side pickup row.
    firstSide: v ? 'wrong' : 'right', surface: 'collar', part: 'rib', width: count, setup, finish, rows,
    setupCount: count, pickUp: count, bindOff: count, finishCount: count,
    pickupSections: { back: a.cleanBack, sleeveLeft: sleeve, sleeveRight: sleeve, frontLeft: a.frontSidePick, frontRight: a.frontSidePick, frontCenter: a.bindCenter },
    shaping: { ribRows: a.collarRows, underarmRow: null, raglanRow: null, neckRow: null } };
}

export function makePullConstruction(p) {
  const invalid = cmLimits(p);
  if (invalid) return incompatible(invalid);
  const a = plan(p);
  if (a.error) return incompatible(a.error);
  const tasks = [
    'Assembler à chaque aisselle les deux petits bords de ' + a.under + ' mailles rabattues du corps avec les deux bords de ' + a.under + ' mailles rabattues de la manche correspondante.',
    'Coudre au point de matelas le dessous de chaque manche du poignet à l’aisselle. Faire coïncider les limites des côtes et les repères de rangs.',
    'Coudre chaque côté du corps, de l’aisselle au bas. Fermer les jours éventuels sous les bras avec le fil correspondant.',
    'Rentrer les fils sur l’envers. Humidifier selon l’étiquette du fil, remettre à plat aux dimensions finies et laisser sécher.'
  ];
  const pieces = [
    panel(a, 'back', 'Dos'), panel(a, 'front', 'Devant'),
    panel(a, 'sleeve-left', 'Manche gauche', true), panel(a, 'sleeve-right', 'Manche droite', true),
    raglanAssembly(a), collarPiece(a),
    { id: 'assembly', name: 'Finitions', mode: 'finish', surface: 'body', part: 'trim', width: 0, rows: [], tasks,
      setup: 'Prévoir une aiguille à laine et le fil assorti à chaque couture. Présenter les deux bords à assembler côte à côte, endroit visible.',
      finish: 'Le pull est terminé après séchage à plat et vérification des mesures.' }
  ];
  const warnings = [];
  if (!p.gauge.manual) warnings.push('Les rangs reposent sur l’échantillon indicatif. Mesurez votre échantillon lavé et séché avec le point et les fils du projet avant de monter les mailles.');
  if (a.difference > Math.max(0.8, a.m.neck * 0.025)) warnings.push('Avec cet échantillon, le bord des pièces avant relevage du col mesure environ ' + fr(a.circumference) + ' cm pour ' + fr(a.m.neck) + ' cm demandés. La bande se répartit sur tout ce bord ; contrôlez son élasticité et le passage de la tête sur un échantillon avant de commencer.');
  return { construction: NAME, pieces, warnings,
    notes: 'Les tours sont les mesures finies du vêtement, aisance comprise. La manche est mesurée du poignet à l’aisselle. Les deux lisières de chaque pièce plate sont incluses dans les comptes. Les rangs pairs se lisent de gauche à droite sur la grille et les rangs impairs de droite à gauche, sauf indication du col V.',
    seams: { bodyRaglanCm: a.edge, sleeveRaglanCm: a.capEdge, bodyRaglanRows: a.armRows - 2, sleeveRaglanRows: a.capRows - 2, underarmBindOff: a.under },
    neckline: { targetCm: a.m.neck, edgeCm: a.circumference, depthCm: a.depth, pickup: a.pick } };
}
