// A 48-pixel yarn badge. Stepped lines keep its edge sharp at HUD scale.
export function drawBrand(ctx) {
  const colors = {
    ink: '#211728', shade: '#873453', berry: '#c43c75',
    pink: '#f45f9e', light: '#ff99c1', shine: '#ffd6df',
    aqua: '#8bd4da', ice: '#c7f4ed', gold: '#f4bf79', ivory: '#ffdfac'
  };
  const pixel = (x, y, color, width = 1) => {
    ctx.fillStyle = colors[color] || color;
    ctx.fillRect(x, y, width, width);
  };
  function line(points, color, width = 1) {
    for (let i = 1; i < points.length; i++) {
      let [x, y] = points[i - 1];
      const [endX, endY] = points[i];
      const dx = Math.abs(endX - x), dy = -Math.abs(endY - y);
      const stepX = x < endX ? 1 : -1, stepY = y < endY ? 1 : -1;
      let error = dx + dy;
      while (true) {
        pixel(x, y, color, width);
        if (x === endX && y === endY) break;
        const twice = 2 * error;
        if (twice >= dy) { error += dy; x += stepX; }
        if (twice <= dx) { error += dx; y += stepY; }
      }
    }
  }
  function stitch(path, bright = 'light') {
    line(path, 'shade', 4);
    line(path.map(([x, y]) => [x, y - 1]), 'pink', 3);
    line(path, bright);
  }

  ctx.save();
  ctx.clearRect(0, 0, 48, 48);
  line([[3, 5], [42, 39]], 'ink', 4);
  line([[4, 5], [42, 39]], 'gold', 2);
  line([[5, 4], [20, 17]], 'ivory');
  pixel(2, 3, 'ink', 5); pixel(3, 3, 'gold', 3); pixel(3, 3, 'ivory');
  line([[41, 3], [6, 40]], 'ink', 4);
  line([[42, 4], [7, 40]], 'aqua', 2);
  line([[42, 3], [26, 20]], 'ice');
  pixel(40, 1, 'ink', 5); pixel(41, 2, 'aqua', 3); pixel(42, 2, 'ice');

  const tail = [[23, 39], [27, 42], [32, 43], [36, 42], [39, 40], [43, 40], [45, 42]];
  line(tail, 'ink', 4); line(tail, 'pink', 2); line([[25, 40], [29, 42], [32, 42]], 'light');

  // One run per pair of rows defines a softly stepped, hand-wound silhouette.
  const silhouette = [
    [16, 29], [12, 33], [10, 35], [8, 37], [7, 38],
    [6, 39], [5, 40], [5, 40], [5, 40], [6, 39],
    [6, 39], [7, 38], [8, 37], [10, 35], [13, 33], [16, 30]
  ];
  silhouette.forEach(([left, right], row) => {
    ctx.fillStyle = colors.ink;
    ctx.fillRect(left - 1, 8 + row * 2, right - left + 3, 4);
    ctx.fillStyle = colors.berry;
    ctx.fillRect(left, 9 + row * 2, right - left + 1, 2);
  });
  stitch([[15, 12], [20, 10], [26, 10], [31, 12]], 'shine');
  stitch([[10, 16], [16, 14], [23, 13], [27, 13]]);
  stitch([[8, 20], [15, 18], [21, 17]]);
  stitch([[7, 24], [13, 22], [17, 21]], 'pink');

  stitch([[8, 26], [11, 28], [15, 34], [18, 37]]);
  stitch([[9, 22], [14, 25], [19, 31], [23, 36], [25, 38]]);
  stitch([[13, 19], [18, 22], [23, 27], [28, 33], [30, 36]], 'shine');
  stitch([[18, 17], [22, 19], [28, 24], [33, 30], [34, 32]]);
  stitch([[24, 14], [29, 17], [34, 21], [37, 25]]);
  stitch([[30, 13], [34, 16], [37, 20]], 'pink');

  stitch([[19, 37], [24, 34], [28, 30], [33, 25], [37, 20]]);
  stitch([[25, 37], [29, 35], [33, 31], [36, 27], [38, 24]], 'light');
  line([[11, 32], [13, 35], [15, 36]], 'pink', 2);
  ctx.restore();
}
