// Draw the selection room and mat on one pixel grid so their edges line up.
const selectionStage = (() => {
  const canvas = document.getElementById('select-stage');
  const slide = document.getElementById('slide');
  const poster = document.getElementById('poster');
  const ctx = canvas.getContext('2d');
  const marks = [
    ['01100110','11111111','01111110','00111100','00111100','01111110','11111111','01100110'],
    ['00111100','00100100','01100110','11000011','01100110','00111100','00011000','00111100'],
    ['01100110','11011011','11011011','01100110','00100100','00111100','00011000','00011000'],
    ['00011000','00111100','01011010','11111111','11111111','01011010','00111100','00011000'],
    ['00011000','00011000','00111100','11111111','11111111','00111100','00011000','00011000'],
    ['00011000','00111100','01100110','11000011','11000011','01100110','00111100','00011000']
  ];
  let member = 0, accent = '#ff75b5';

  function stamp(mark, x, y, sx, sy, ink) {
    ctx.fillStyle = ink;
    mark.forEach((row, j) => [...row].forEach((bit, i) => {
      if (bit === '1') ctx.fillRect(x + i * sx, y + j * sy, sx, sy);
    }));
  }

  function draw() {
    if (!canvas.clientWidth || !canvas.clientHeight) return;
    const grid = canvas.clientWidth < 600 ? 2 : 3;
    const w = canvas.width = Math.ceil(canvas.clientWidth / grid);
    const h = canvas.height = Math.ceil(canvas.clientHeight / grid);
    const horizon = Math.floor(h * 0.77);
    ctx.fillStyle = '#f8f5fc';
    ctx.fillRect(0, 0, w, h);
    for (let row = 0; row * 25 + 10 < horizon; row++) {
      for (let col = -1; col * 49 < w; col++) {
        const variant = (col + 1 + row * 2) % 6;
        stamp(marks[variant], col * 49 + (row % 2) * 24, row * 25 + 5, 1, 1,
          variant % 2 ? '#eecde9' : '#c1e5ee');
      }
    }
    ctx.fillStyle = '#a69ebd';
    ctx.fillRect(0, horizon, w, h - horizon);
    for (let y = horizon + 2; y < h; y++) {
      const depth = (y - horizon) / (h - horizon);
      ctx.fillStyle = depth < 0.35 ? '#ded7eb' : '#eee7f5';
      ctx.fillRect(0, y, w, 1);
      const spacing = 36 + depth * 30;
      ctx.fillStyle = '#c9bfd9';
      for (let seam = -Math.ceil(w / 36); seam * spacing < w; seam++) {
        ctx.fillRect(Math.round(w / 2 + seam * spacing), y, 1, 1);
      }
    }
    const scene = canvas.getBoundingClientRect();
    const pose = slide.getBoundingClientRect();
    const landscape = matchMedia('(orientation: landscape)').matches;
    const cx = Math.round((pose.left - scene.left + pose.width / 2) / grid);
    const image = slide.lastElementChild;
    const imageHeight = image?.naturalWidth ? Math.min(pose.height, pose.width * image.naturalHeight / image.naturalWidth) : pose.height;
    const cy = landscape ? Math.round((pose.bottom - scene.top - imageHeight * .09) / grid) : Math.round(h * .89);
    const rx = Math.max(12, Math.floor(landscape ? Math.min(poster.clientWidth * .44, imageHeight * .39) / grid : cx * .84)), ry = Math.max(6, Math.round(h * 0.073));
    function oval(insetX, insetY, offset, color) {
      ctx.fillStyle = color;
      const radius = ry - insetY;
      for (let dy = -radius; dy <= radius; dy++) {
        const half = Math.round((rx - insetX) * Math.sqrt(1 - (dy / radius) ** 2));
        ctx.fillRect(cx - half, cy + dy + offset, half * 2 + 1, 1);
      }
    }
    oval(0, 0, 2, '#a99db8');
    oval(0, 0, 0, accent);
    oval(2, 1, 0, '#fffbff');
    oval(5, 2, 0, accent);
    oval(8, 3, 0, '#fffbff');
    const sx = Math.max(2, Math.floor(rx / 9)), sy = Math.max(1, Math.floor((ry - 3) / 5));
    stamp(marks[member], cx - sx * 4, cy - sy * 4, sx, sy, accent);
  }
  new ResizeObserver(draw).observe(canvas);
  slide.addEventListener('load', draw, true);
  return (index, color) => { member = index; accent = color; draw(); };
})();
