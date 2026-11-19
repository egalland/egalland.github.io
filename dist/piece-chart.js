/*
 * Diagramme d’une pièce entière. piece.rows[0] est le premier rang tricoté,
 * en bas ; les colonnes du tableau sont toujours indexées de gauche à droite.
 * Les coordonnées renvoyées utilisent les pixels internes du canvas.
 */

const MAX_SIDE = 4096;
const MAX_PIXELS = 6 * 1024 * 1024;
const INK = '#253a32';
const PAPER = '#ffffff';
const HIGHLIGHT = '#995224';

function clampNumber(value, minimum, maximum, fallback) {
  if (value == null || value === '') return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(minimum, Math.min(maximum, number)) : fallback;
}

function cleanSpans(spans, cols) {
  if (!Array.isArray(spans)) return [];
  const candidates = [];
  for (const span of spans) {
    if (!Array.isArray(span) || span.length < 2) continue;
    const left = Math.max(0, Math.ceil(Number(span[0])));
    const right = Math.min(cols - 1, Math.floor(Number(span[1])));
    if (Number.isFinite(left) && Number.isFinite(right) && left <= right) {
      candidates.push([left, right]);
    }
  }
  candidates.sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const span of candidates) {
    const last = merged[merged.length - 1];
    if (last && span[0] <= last[1] + 1) last[1] = Math.max(last[1], span[1]);
    else merged.push(span);
  }
  return merged;
}

function toHex(color) {
  if (typeof color !== 'string') return '#87998c';
  if (/^#[a-f\d]{6}$/i.test(color)) return color;
  if (/^#[a-f\d]{3}$/i.test(color)) {
    return '#' + [...color.slice(1)].map(c => c + c).join('');
  }
  return '#87998c';
}

function letterFor(index) {
  let letter = '', n = index + 1;
  while (n > 0) {
    n--;
    letter = String.fromCharCode(65 + n % 26) + letter;
    n = Math.floor(n / 26);
  }
  return letter;
}

function paletteOf(yarns) {
  const source = Array.isArray(yarns) && yarns.length ? yarns : [{ color: '#87998c' }];
  return source.map((yarn, i) => {
    const color = toHex(yarn?.color ?? yarn?.hex);
    const channels = [1, 3, 5].map(start => {
      const s = Number.parseInt(color.slice(start, start + 2), 16) / 255;
      return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    const luminance = channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
    return { color, ink: luminance > 0.20 ? '#172720' : '#ffffff', letter: letterFor(i) };
  });
}

function metricsOf(canvas, cols, rows, options) {
  const baseWidth = clampNumber(options.maxWidth, 96, MAX_SIDE, 1100);
  const zoom = clampNumber(options.zoom, 0.25, 12, 1);
  const ratio = clampNumber(options.ratio, 0.2, 2.5, 0.74);
  const requestedWidth = Math.max(96, Math.round(baseWidth * zoom));
  const font = Math.min(16, Math.max(11, baseWidth * 0.028));
  // Font and gutters stay legible at fit width and keep their size during zoom.
  const left = Math.ceil(Math.max(3.3 * font, String(rows).length * font * 0.68 + font * 1.7));
  const right = Math.ceil(font * 0.9);
  const top = Math.ceil(font * 2.0);
  const bottom = Math.ceil(font * 3.55);
  const gutterWidth = left + right, gutterHeight = top + bottom;
  const aspect = rows * ratio / Math.max(cols, 1);
  const fitHeight = clampNumber(options.fitHeight, 96, MAX_SIDE, 0);
  const requestedPlot = fitHeight
    ? Math.max(1,Math.min(baseWidth - gutterWidth,(fitHeight - gutterHeight) / Math.max(aspect,0.0001))) * zoom
    : requestedWidth - gutterWidth;
  // Cap the logical zoom before lowering the backing resolution. That keeps
  // the axis font readable even when a longer piece reaches the canvas budget.
  const availableArea = MAX_PIXELS - gutterWidth * gutterHeight;
  const linearTerm = gutterHeight + aspect * gutterWidth;
  const areaLimit = 2 * availableArea /
    (linearTerm + Math.sqrt(linearTerm * linearTerm + 4 * aspect * availableArea));
  const plotWidth = Math.max(0.01, Math.min(requestedPlot, MAX_SIDE - gutterWidth,
    (MAX_SIDE - gutterHeight) / Math.max(aspect, 0.0001), areaLimit));
  const displayWidth = Math.ceil(gutterWidth + plotWidth);
  const cw = plotWidth / Math.max(cols, 1);
  const ch = cw * ratio;
  const displayHeight = Math.max(1, Math.ceil(top + rows * ch + bottom));
  const deviceDpr = canvas.ownerDocument?.defaultView?.devicePixelRatio ?? 1;
  const dpr = clampNumber(options.pixelRatio, 0.5, 3, Math.min(2, deviceDpr || 1));
  const scale = Math.min(
    dpr, MAX_SIDE / displayWidth, MAX_SIDE / displayHeight,
    Math.sqrt(MAX_PIXELS / (displayWidth * displayHeight))
  );
  const width = Math.max(1, Math.floor(displayWidth * scale));
  const height = Math.max(1, Math.floor(displayHeight * scale));
  return {
    font, left, top, cw, ch, scaleX: width / displayWidth, scaleY: height / displayHeight,
    displayWidth, displayHeight, width, height, limited: plotWidth + 0.01 < requestedPlot || scale + 1e-6 < dpr
  };
}

function splitUncovered(left, right, adjacent, draw) {
  let start = left;
  for (const [a, b] of adjacent) {
    if (b < start) continue;
    if (a > right) break;
    if (a > start) draw(start, Math.min(right, a - 1));
    start = Math.max(start, b + 1);
    if (start > right) break;
  }
  if (start <= right) draw(start, right);
}

function contour(ctx, spans, edgeX, edgeY) {
  ctx.beginPath();
  for (let r = 0; r < spans.length; r++) {
    const yBottom = edgeY(r), yTop = edgeY(r + 1);
    for (const [left, right] of spans[r]) {
      for (const c of [left, right + 1]) {
        ctx.moveTo(edgeX(c), yTop);
        ctx.lineTo(edgeX(c), yBottom);
      }
      splitUncovered(left, right, spans[r + 1] || [], (a, b) => {
        ctx.moveTo(edgeX(a), yTop);
        ctx.lineTo(edgeX(b + 1), yTop);
      });
      splitUncovered(left, right, spans[r - 1] || [], (a, b) => {
        ctx.moveTo(edgeX(a), yBottom);
        ctx.lineTo(edgeX(b + 1), yBottom);
      });
    }
  }
  ctx.lineCap = 'square';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.lineCap = 'butt';
}

function clipToPiece(ctx, spans, edgeX, edgeY) {
  ctx.beginPath();
  for (let r = 0; r < spans.length; r++) {
    const top = edgeY(r + 1);
    const height = edgeY(r) - top;
    for (const [a, b] of spans[r]) ctx.rect(edgeX(a), top, edgeX(b + 1) - edgeX(a), height);
  }
  ctx.clip();
}

function gridLines(ctx, spans, cols, geo, edgeX, edgeY, rightToLeft, detail) {
  const rows = spans.length, { cw, ch } = geo;
  ctx.save();
  clipToPiece(ctx, spans, edgeX, edgeY);
  function lineX(c) {
    ctx.moveTo(edgeX(c), edgeY(rows));
    ctx.lineTo(edgeX(c), edgeY(0));
  }
  function lineY(r) {
    ctx.moveTo(edgeX(0), edgeY(r));
    ctx.lineTo(edgeX(cols), edgeY(r));
  }
  function verticalAtTen(c) {
    return (rightToLeft ? cols - c : c) % 10 === 0;
  }
  const fineLimit = detail ? 3.0 : 4.2;
  ctx.beginPath();
  if (cw >= fineLimit && cw * geo.scaleX >= 2.3) {
    for (let c = 1; c < cols; c++) if (!verticalAtTen(c)) lineX(c);
  }
  if (ch >= fineLimit && ch * geo.scaleY >= 2.3) {
    for (let r = 1; r < rows; r++) if (r % 10) lineY(r);
  }
  // A pale and a dark component preserve lines on cream and charcoal alike.
  ctx.strokeStyle = 'rgba(255,255,255,0.38)';
  ctx.lineWidth = 0.80;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(35,47,39,0.25)';
  ctx.lineWidth = 0.45;
  ctx.stroke();
  ctx.beginPath();
  if (10 * cw * geo.scaleX >= 3) {
    const first = rightToLeft ? (cols % 10 || 10) : 10;
    for (let c = first; c < cols; c += 10) lineX(c);
  }
  if (10 * ch * geo.scaleY >= 3) {
    for (let r = 10; r < rows; r += 10) lineY(r);
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.76)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(32,49,39,0.66)';
  ctx.lineWidth = 0.8;
  ctx.stroke();
  ctx.restore();
}

function axisTicks(count, cellSize, minDistance) {
  if (!count) return [];
  if (count === 1) return [1];
  const step = Math.max(10, Math.ceil(minDistance / Math.max(0.0001, cellSize) / 10) * 10);
  const result = [1];
  for (let value = step; value < count; value += step) {
    if ((value - 1) * cellSize >= minDistance && (count - value) * cellSize >= minDistance) result.push(value);
  }
  if ((count - 1) * cellSize >= minDistance) result.push(count);
  return result;
}

function axes(ctx, pieceRows, cols, geo, selected, rightToLeft) {
  const { left, top, cw, ch, font } = geo;
  const plotBottom = top + pieceRows * ch, plotRight = left + cols * cw;
  const yCenter = n => plotBottom - (n - 0.5) * ch;
  const xCenter = n => left + (rightToLeft ? cols - n + 0.5 : n - 0.5) * cw;
  ctx.font = font + 'px Arial, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#4c5c53';
  ctx.textAlign = 'right';
  ctx.fillText('Rang', left - 6, Math.max(font * 0.70, top * 0.44));

  const yTicks = axisTicks(pieceRows, ch, font * 1.65);
  ctx.strokeStyle = '#758279';
  ctx.lineWidth = 0.85;
  ctx.beginPath();
  for (const n of yTicks) {
    const y = yCenter(n);
    ctx.moveTo(left - 3, y);
    ctx.lineTo(left - 6, y);
    if (!selected || Math.abs(yCenter(selected) - y) >= font * 1.10) {
      ctx.fillText(String(n), left - 9, y);
    }
  }
  ctx.stroke();

  ctx.textAlign = 'center';
  const minXGap = (String(cols).length * 0.63 + 0.72) * font;
  const xTicks = axisTicks(cols, cw, minXGap);
  ctx.beginPath();
  for (const n of xTicks) {
    const x = xCenter(n);
    ctx.moveTo(x, plotBottom + 2);
    ctx.lineTo(x, plotBottom + 5);
    ctx.fillText(String(n), x, plotBottom + font * 1.15);
  }
  ctx.stroke();
  ctx.fillText('Mailles', (left + plotRight) / 2, plotBottom + font * 2.8);
}

function highlight(ctx, current, spans, geo, edgeX, edgeY) {
  const row = current - 1, { left, font, cw, ch } = geo;
  const y = edgeY(row + 1), center = (edgeY(row) + y) / 2;
  for (const [a, b] of spans[row]) {
    const x = edgeX(a), width = edgeX(b + 1) - x;
    ctx.fillStyle = 'rgba(242,173,68,0.16)';
    ctx.fillRect(x, y, width, ch);
    ctx.beginPath();
    if (ch >= 5 && width >= 3) ctx.rect(x + 0.5, y + 0.5, Math.max(0, width - 1), Math.max(0, ch - 1));
    else {
      ctx.moveTo(x, center);
      ctx.lineTo(x + width, center);
    }
    ctx.lineWidth = ch < 5 ? 1.4 : 2.6;
    ctx.strokeStyle = '#fff9e9';
    ctx.stroke();
    ctx.lineWidth = ch < 5 ? 0.85 : 1.3;
    ctx.strokeStyle = HIGHLIGHT;
    ctx.stroke();
  }
  const tagWidth = Math.min(left - 5, Math.max(font * 1.75, String(current).length * font * 0.66 + 9));
  const tagHeight = font * 1.55, right = left - 5;
  ctx.fillStyle = HIGHLIGHT;
  ctx.fillRect(right - tagWidth, center - tagHeight / 2, tagWidth, tagHeight);
  ctx.beginPath();
  ctx.moveTo(right - 0.5, center - 3.7);
  ctx.lineTo(right + Math.min(4, cw), center);
  ctx.lineTo(right - 0.5, center + 3.7);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold ' + font + 'px Arial, sans-serif';
  ctx.fillText(String(current), right - tagWidth / 2, center);
}

function cursorRing(ctx, cursor, spans, geo, edgeX, edgeY) {
  if (!cursor || !Number.isInteger(cursor.r) || !Number.isInteger(cursor.c)) return;
  if (!spans[cursor.r]?.some(([a, b]) => cursor.c >= a && cursor.c <= b)) return;
  const x = edgeX(cursor.c), y = edgeY(cursor.r + 1);
  const w = edgeX(cursor.c + 1) - x, h = edgeY(cursor.r) - y;
  const inset = Math.min(0.8, geo.cw * 0.1, geo.ch * 0.1);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = Math.min(3.2, Math.max(1.3, h * 0.24));
  ctx.strokeRect(x + inset, y + inset, Math.max(0.1, w - 2 * inset), Math.max(0.1, h - 2 * inset));
  ctx.strokeStyle = '#462358';
  ctx.lineWidth = Math.min(1.6, Math.max(0.7, h * 0.12));
  ctx.strokeRect(x + inset, y + inset, Math.max(0.1, w - 2 * inset), Math.max(0.1, h - 2 * inset));
}

/**
 * The full chart is always rendered. For a responsive viewport pass its CSS
 * width as maxWidth, then size the canvas in CSS to displayWidth/displayHeight.
 * Zoom enlarges that logical surface. For print set maxWidth to the desired
 * print working width and supply pixelRatio (e.g. 2) as needed.
 *
 * The default axis reads stitch 1 at the right, as on a knitting chart.
 * rightToLeft:false numbers from the left instead; it never reverses the data.
 * width/height are the complete backing canvas dimensions. gridWidth/gridHeight
 * bound the actual stitches. Coordinates conversion example:
 *   x=(event.clientX-rect.left)*canvas.width/rect.width;
 *   c=Math.floor((x-m.x0)/m.cw);
 *   r=piece.rows.length-1-Math.floor((y-m.y0)/m.ch);
 * Check the selected row’s spans before painting a stitch.
 */
export function drawPieceChart(canvas, piece, options = {}) {
  const rows = Array.isArray(piece?.rows) ? piece.rows : [];
  const rawCols = Math.floor(Number(piece?.width));
  const cols = Number.isSafeInteger(rawCols) && rawCols > 0 ? rawCols : 0;
  const geo = metricsOf(canvas, cols, rows.length, options);
  if (canvas.width !== geo.width) canvas.width = geo.width;
  if (canvas.height !== geo.height) canvas.height = geo.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Le diagramme demande un canvas 2D.');
  const detail = options.detail === true;
  const nominalFont = Math.min(geo.ch * 0.76, geo.cw * 0.73, 24);
  const minFont = detail ? 8 : 9;
  const symbolsDrawn = Boolean(options.symbols) && nominalFont >= minFont &&
    nominalFont * Math.min(geo.scaleX, geo.scaleY) >= minFont;
  const result = {
    x0: geo.left * geo.scaleX, y0: geo.top * geo.scaleY,
    cw: geo.cw * geo.scaleX, ch: geo.ch * geo.scaleY,
    width: canvas.width, height: canvas.height,
    gridWidth: cols * geo.cw * geo.scaleX, gridHeight: rows.length * geo.ch * geo.scaleY,
    displayWidth: geo.displayWidth, displayHeight: geo.displayHeight,
    symbolsDrawn, limited: geo.limited
  };
  ctx.save();
  try {
    ctx.setTransform(geo.scaleX, 0, 0, geo.scaleY, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.shadowColor = 'transparent';
    ctx.setLineDash([]);
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, geo.displayWidth, geo.displayHeight);
    if (!cols || !rows.length) return result;
    const spans = rows.map(r => cleanSpans(r?.spans, cols));
    const palette = paletteOf(options.yarns);
    const sample = typeof options.cellColor === 'function' ? options.cellColor : () => 0;
    const rowCount = rows.length;
    const rightToLeft = options.rightToLeft !== false;
    const selected = Number.isInteger(options.row) && options.row >= 1 && options.row <= rowCount ? options.row : 0;

    // Snap shared edges to actual pixels before filling to avoid white seams
    // between adjacent stitches at noninteger zoom levels.
    const edgeX = col => Math.round((geo.left + col * geo.cw) * geo.scaleX) / geo.scaleX;
    const edgeY = row => Math.round((geo.top + (rowCount - row) * geo.ch) * geo.scaleY) / geo.scaleY;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = nominalFont + 'px Arial, sans-serif';
    for (let r = 0; r < rowCount; r++) {
      const y = edgeY(r + 1), h = edgeY(r) - y;
      for (const [left, right] of spans[r]) {
        let first = left, previous = -1;
        for (let c = left; c <= right + 1; c++) {
          let index = -1;
          if (c <= right) {
            const value = sample(r, c);
            index = Number.isInteger(value) && value >= 0 && value < palette.length ? value : 0;
          }
          if (index === previous) continue;
          if (first < c) {
            const yarn = palette[previous];
            ctx.fillStyle = yarn.color;
            ctx.fillRect(edgeX(first), y, edgeX(c) - edgeX(first), h);
            if (symbolsDrawn) {
              ctx.fillStyle = yarn.ink;
              for (let stitch = first; stitch < c; stitch++) {
                ctx.fillText(yarn.letter, geo.left + (stitch + 0.5) * geo.cw, y + h / 2);
              }
            }
          }
          first = c;
          previous = index;
        }
      }
    }
    gridLines(ctx, spans, cols, geo, edgeX, edgeY, rightToLeft, detail);
    contour(ctx, spans, edgeX, edgeY);
    axes(ctx, rowCount, cols, geo, selected, rightToLeft);
    if (selected) highlight(ctx, selected, spans, geo, edgeX, edgeY);
    cursorRing(ctx, options.cursor, spans, geo, edgeX, edgeY);
    return result;
  } finally {
    ctx.restore();
  }
}

