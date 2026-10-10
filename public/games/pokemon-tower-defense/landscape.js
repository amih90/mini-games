/* Original illustrated terrain. No downloaded tile packs or per-frame baking. */
(() => {
  "use strict";
  const cache = new Map();
  const palettes = {
    classic: { grass: ["#a8cf77", "#639e59", "#367054"], light: "#cee39a", leaves: ["#214e43", "#357958", "#67a36a"], road: ["#e8d5a2", "#c5ac79"], water: ["#7ed9c7", "#358f9b"], stone: ["#a8b1a0", "#697d77"] },
    coast: { grass: ["#d2dca1", "#88bba0", "#478e8b"], light: "#e7e5b9", leaves: ["#236761", "#399580", "#78bd92"], road: ["#f4e2b2", "#ccbb90"], water: ["#68dcd5", "#24759b"], stone: ["#d0c7af", "#829798"] },
    volcano: { grass: ["#b0ac85", "#667966", "#394e50"], light: "#d6c6a0", leaves: ["#3b5149", "#617d62", "#8caa79"], road: ["#bba68e", "#8e7d74"], water: ["#ffdc7a", "#d26343"], stone: ["#87938a", "#43565b"] },
    switchback: { grass: ["#c2d393", "#80ad72", "#466c64"], light: "#e0e4a8", leaves: ["#375b54", "#58896a", "#97b77b"], road: ["#e9dcb7", "#c0b48e"], water: ["#a3d9c7", "#518b9b"], stone: ["#b5bcb0", "#748681"] },
    spiral: { grass: ["#abd3ac", "#6cad91", "#346d73"], light: "#d1e2ac", leaves: ["#285958", "#458d79", "#83b494"], road: ["#e9dab0", "#b8ae88"], water: ["#80dad2", "#3c90a5"], stone: ["#b0bcb0", "#637f83"] },
  };
  function ellipse(c, x, y, rx, ry, color, angle = 0) {
    c.fillStyle = color; c.beginPath(); c.ellipse(x, y, rx, ry, angle, 0, Math.PI * 2); c.fill();
  }
  function seeded(seed) {
    return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  }
  function tree(c, x, y, size, p, palm = false) {
    ellipse(c, x + size * 0.2, y + size * 0.24, size * 0.68, size * 0.32, "#20493f35");
    c.strokeStyle = "#655b45"; c.lineWidth = size * 0.13; c.lineCap = "round";
    c.beginPath(); c.moveTo(x, y + size * 0.2); c.quadraticCurveTo(x - 8, y - 15, x, y - size * 0.55); c.stroke();
    if (palm) {
      for (let i = 0; i < 7; i++) {
        const a = i * Math.PI * 2 / 7;
        c.save(); c.translate(x, y - size * 0.6); c.rotate(a);
        c.fillStyle = p.leaves[i % 3]; c.beginPath(); c.moveTo(0, 0);
        c.bezierCurveTo(15, -30, size * 0.8, -20, size, 15);
        c.quadraticCurveTo(size * 0.6, -2, 0, 0); c.fill(); c.restore();
      }
    } else {
      ellipse(c, x, y - size * 0.36, size * 0.72, size * 0.59, p.leaves[0]);
      for (let i = 0; i < 6; i++) {
        const a = i * 2.4;
        ellipse(c, x + Math.cos(a) * size * 0.31, y - size * 0.55 + Math.sin(a) * size * 0.27,
          size * 0.42, size * 0.32, p.leaves[1 + i % 2], a / 3);
      }
      ellipse(c, x - size * 0.14, y - size * 0.8, size * 0.26, size * 0.16, "#d2e4a32c");
    }
  }
  function rock(c, x, y, s, p) {
    ellipse(c, x + 6, y + 10, s * 0.75, s * 0.28, "#173d4433");
    c.fillStyle = p.stone[1]; c.beginPath(); c.moveTo(x - s * 0.7, y); c.lineTo(x - s * 0.45, y - s * 0.55);
    c.lineTo(x + s * 0.2, y - s * 0.65); c.lineTo(x + s * 0.65, y - s * 0.15);
    c.lineTo(x + s * 0.55, y + s * 0.2); c.lineTo(x - s * 0.3, y + s * 0.3); c.closePath(); c.fill();
    c.fillStyle = p.stone[0]; c.beginPath(); c.moveTo(x - s * 0.7, y); c.lineTo(x - s * 0.45, y - s * 0.55);
    c.lineTo(x + s * 0.2, y - s * 0.65); c.lineTo(x + s * 0.13, y - s * 0.1); c.closePath(); c.fill();
    ellipse(c, x - s * 0.12, y - s * 0.45, s * 0.25, s * 0.08, "#c5d19c70");
  }
  function shoreline(c, area, p, random, lava) {
    const { x, y, rx, ry } = area;
    const contour = [];
    for (let i = 0; i < 48; i++) {
      const a = i / 48 * Math.PI * 2, wobble = 1 + Math.sin(a * 3 + 1) * 0.065 + Math.cos(a * 5) * 0.025;
      contour.push({ x: x + Math.cos(a) * rx * wobble, y: y + Math.sin(a) * ry * wobble });
    }
    c.beginPath(); contour.forEach((pt, i) => i ? c.lineTo(pt.x, pt.y) : c.moveTo(pt.x, pt.y)); c.closePath();
    c.strokeStyle = "#244f4b35"; c.lineWidth = 25; c.stroke();
    c.strokeStyle = lava ? "#b8a079" : "#d9d7aa"; c.lineWidth = 12; c.stroke();
    const g = c.createLinearGradient(x, y - ry, x, y + ry); g.addColorStop(0, p.water[0]); g.addColorStop(1, p.water[1]);
    c.fillStyle = g; c.fill();
    c.save(); c.clip();
    for (let i = 0; i < 30; i++) {
      const px = x - rx + random() * rx * 2, py = y - ry + random() * ry * 2;
      c.strokeStyle = lava ? "#ffedac80" : "#c8ffef65"; c.lineWidth = 2;
      c.beginPath(); c.moveTo(px, py); c.bezierCurveTo(px + 10, py + 3, px + 22, py - 3, px + 35, py); c.stroke();
    }
    if (!lava) for (let i = 0; i < 5; i++) {
      const px = x + (random() - 0.5) * rx * 1.3, py = y + (random() - 0.5) * ry;
      ellipse(c, px, py, 10, 5, "#64ac82"); ellipse(c, px - 2, py - 2, 6, 3, "#a1d690");
    }
    c.restore();
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * Math.PI * 2;
      rock(c, x + Math.cos(a) * (rx + 3), y + Math.sin(a) * (ry + 2), 10 + random() * 9, p);
    }
  }
  function trace(c, route) {
    c.beginPath(); route.forEach((pt, i) => i ? c.lineTo(pt.x, pt.y) : c.moveTo(pt.x, pt.y));
  }
  function sanctuary(c, point, p, entrance = false) {
    const { x, y } = point;
    ellipse(c, x, y + 15, 62, 28, "#1e474a35");
    ellipse(c, x, y + 5, 52, 25, p.stone[1]);
    ellipse(c, x, y, 52, 25, p.stone[0]);
    if (entrance) {
      for (const dx of [-38, 38]) {
        c.fillStyle = p.stone[1]; c.fillRect(x + dx - 9, y - 65, 18, 62);
        c.fillStyle = p.stone[0]; c.fillRect(x + dx - 12, y - 68, 24, 12);
      }
      c.strokeStyle = p.leaves[0]; c.lineWidth = 12; c.beginPath(); c.arc(x, y - 48, 38, Math.PI, 0); c.stroke();
      for (let i = 0; i < 7; i++) ellipse(c, x - 35 + i * 11, y - 78 + Math.abs(i - 3) * 5, 10, 6, p.leaves[2], i);
      return;
    }
    c.fillStyle = "#8a5b43"; c.beginPath(); c.moveTo(x - 31, y - 7); c.lineTo(x + 31, y - 7); c.lineTo(x + 25, y + 22); c.lineTo(x - 25, y + 22); c.closePath(); c.fill();
    c.strokeStyle = "#ddba83"; c.lineWidth = 3;
    for (let i = -20; i <= 20; i += 10) { c.beginPath(); c.moveTo(x + i, y - 7); c.lineTo(x + i * 0.8, y + 20); c.stroke(); }
    for (let i = 0; i < 9; i++) {
      const bx = x - 23 + i % 5 * 11, by = y - 10 - Math.floor(i / 5) * 12;
      ellipse(c, bx, by, 8, 9, i % 2 ? "#b66abe" : "#ee7973");
      ellipse(c, bx - 2, by - 3, 2, 3, "#ffffff70");
      ellipse(c, bx + 3, by - 10, 6, 3, p.leaves[2], -0.6);
    }
    c.strokeStyle = "#c6996a"; c.lineWidth = 4; c.beginPath(); c.arc(x, y - 14, 24, Math.PI, 0); c.stroke();
  }
  function bake(map, id) {
    const canvas = document.createElement("canvas");
    canvas.width = map.width; canvas.height = map.height;
    const c = canvas.getContext("2d"), p = palettes[id], random = seeded(429 + Object.keys(palettes).indexOf(id) * 119);
    const g = c.createLinearGradient(0, 0, map.width * 0.4, map.height);
    g.addColorStop(0, p.grass[0]); g.addColorStop(0.55, p.grass[1]); g.addColorStop(1, p.grass[2]);
    c.fillStyle = g; c.fillRect(0, 0, map.width, map.height);
    // Soft painted contours establish clear, buildable glades between lanes.
    for (let i = 0; i < 95; i++) {
      const x = random() * map.width, y = random() * map.height, r = 45 + random() * 160;
      ellipse(c, x, y, r, r * 0.45, i % 2 ? "#e4e4a611" : "#225b5711", random());
    }
    for (let i = 0; i < map.width * map.height / 950; i++) {
      const x = random() * map.width, y = random() * map.height;
      if (window.PokemonTDData.routeDistance(map.route, x, y) < 65) continue;
      c.strokeStyle = i % 3 ? "#dde4ac35" : "#285e4d35"; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(x - 3, y); c.lineTo(x - 5, y - 5); c.moveTo(x, y); c.lineTo(x + 1, y - 8); c.stroke();
      if (i % 9 === 0) {
        ellipse(c, x, y - 4, 3, 2, id === "volcano" ? "#e4c09c" : i % 2 ? "#fbdfad" : "#ead0d5");
        ellipse(c, x + 4, y - 3, 2.5, 2, "#ffffff99");
      }
    }
    // Blocking terrain uses precisely the same footprints as placement rules.
    for (const area of map.blockers) {
      if (area.type === "lake" || area.type === "pond") shoreline(c, area, p, random, id === "volcano");
      else if (area.type === "cliff") {
        ellipse(c, area.x, area.y + 12, area.rx, area.ry, "#28434545");
        for (let i = 0; i < 14; i++) {
          const a = random() * Math.PI * 2, r = Math.sqrt(random());
          rock(c, area.x + Math.cos(a) * area.rx * r * 0.7, area.y + Math.sin(a) * area.ry * r * 0.6, 24 + random() * 34, p);
        }
      } else {
        const trees = Array.from({ length: 12 }, () => {
          const a = random() * Math.PI * 2, r = Math.sqrt(random());
          return { x: area.x + Math.cos(a) * area.rx * r * 0.68, y: area.y + Math.sin(a) * area.ry * r * 0.65 };
        }).sort((a, b) => a.y - b.y);
        for (const pt of trees) tree(c, pt.x, pt.y + 15, 35 + random() * 25, p, id === "coast");
      }
    }
    c.lineJoin = "round"; c.lineCap = "round";
    trace(c, map.route); c.strokeStyle = "#1b494434"; c.lineWidth = 119; c.stroke();
    trace(c, map.route); c.strokeStyle = "#8b986d"; c.lineWidth = 106; c.stroke();
    const road = c.createLinearGradient(0, 0, map.width, map.height); road.addColorStop(0, p.road[0]); road.addColorStop(1, p.road[1]);
    trace(c, map.route); c.strokeStyle = road; c.lineWidth = 96; c.stroke();
    trace(c, map.route); c.strokeStyle = "#fff5d62b"; c.lineWidth = 72; c.stroke();
    // Subtle road grains, not animated lane dashes or a flat brown ribbon.
    for (let i = 3; i < map.route.length - 3; i += 3) {
      const pt = map.route[i], next = map.route[i + 1], a = Math.atan2(next.y - pt.y, next.x - pt.x);
      const offset = (random() - 0.5) * 70;
      ellipse(c, pt.x + Math.cos(a + Math.PI / 2) * offset, pt.y + Math.sin(a + Math.PI / 2) * offset,
        2 + random() * 3, 1.5, "#806e4b22", a);
    }
    // Edge vegetation frames the scene without obstructing playable pockets.
    for (let x = 30; x < map.width; x += 75) {
      if (window.PokemonTDData.routeDistance(map.route, x, 12) > 110) tree(c, x, 12, 42 + random() * 20, p, id === "coast");
      if (window.PokemonTDData.routeDistance(map.route, x, map.height - 8) > 110) tree(c, x, map.height + 20, 40 + random() * 20, p);
    }
    sanctuary(c, { x: 52, y: map.route[5].y }, p, true);
    sanctuary(c, map.goal, p);
    const vignette = c.createRadialGradient(map.width * 0.45, map.height * 0.4, map.height * 0.2, map.width * 0.5, map.height * 0.5, map.width * 0.65);
    vignette.addColorStop(0, "#162f3b00"); vignette.addColorStop(1, "#15374345");
    c.fillStyle = vignette; c.fillRect(0, 0, map.width, map.height);
    return canvas;
  }
  window.PokemonTDLandscape = {
    get(map, id) { if (!cache.has(id)) cache.set(id, bake(map, id)); return cache.get(id); },
    preview(map, id) {
      const thumb = document.createElement("canvas"); thumb.width = 320; thumb.height = 180;
      thumb.getContext("2d").drawImage(this.get(map, id), 0, 0, 320, 180); return thumb.toDataURL();
    },
  };
})();
