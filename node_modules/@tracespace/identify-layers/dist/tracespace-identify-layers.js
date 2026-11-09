function C(t) {
  let e = null, x = 0;
  const s = {};
  for (const d of t) {
    const { cad: h } = d;
    if (h !== null) {
      const y = (s[h] ?? 0) + 1;
      y > x && (x = y, e = h), s[h] = y;
    }
  }
  return e;
}
const g = "copper", E = "soldermask", k = "silkscreen", A = "solderpaste", D = "drill", L = "outline", T = "drawing", _ = "top", b = "bottom", P = "inner", f = "all", a = "kicad", m = "altium", I = "allegro", p = "eagle", c = "eagle-legacy", o = "eagle-oshpark", n = "eagle-pcbng", r = "geda-pcb", l = "orcad", i = "diptrace", u = [
  // High-priority non-matches
  {
    type: null,
    side: null,
    matchers: [
      // Eagle gerber generation metadata
      {
        ext: "gpi",
        cad: [p, c, o, n]
      },
      // Eagle drill generation metadata
      {
        ext: "dri",
        cad: [p, c, o, n]
      },
      // General data/BOM files
      { ext: "csv", cad: null },
      // Pick-n-place BOMs
      { match: /pnp_bom/, cad: n }
    ]
  },
  {
    type: g,
    side: _,
    matchers: [
      { ext: "cmp", cad: c },
      { ext: "top", cad: [c, l] },
      { ext: "gtl", cad: [a, m] },
      { ext: "toplayer\\.ger", cad: o },
      { match: /top\.\w+$/, cad: [r, i] },
      { match: /f[._]cu/, cad: a },
      { match: /copper_top/, cad: p },
      { match: /top_copper/, cad: n },
      { match: /top copper/, cad: null }
    ]
  },
  {
    type: E,
    side: _,
    matchers: [
      { ext: "stc", cad: c },
      { ext: "tsm", cad: c },
      { ext: "gts", cad: [a, m] },
      { ext: "smt", cad: l },
      { ext: "topsoldermask\\.ger", cad: o },
      { match: /topmask\.\w+$/, cad: [r, i] },
      { match: /f[._]mask/, cad: a },
      { match: /soldermask_top/, cad: p },
      { match: /top_mask/, cad: n },
      { match: /top solder resist/, cad: null }
    ]
  },
  {
    type: k,
    side: _,
    matchers: [
      { ext: "plc", cad: c },
      { ext: "tsk", cad: c },
      { ext: "gto", cad: [a, m] },
      { ext: "sst", cad: l },
      { ext: "topsilkscreen\\.ger", cad: o },
      { match: /topsilk\.\w+$/, cad: [r, i] },
      { match: /f[._]silks/, cad: a },
      { match: /silkscreen_top/, cad: p },
      { match: /top_silk/, cad: n },
      { match: /top silk screen/, cad: null }
    ]
  },
  {
    type: A,
    side: _,
    matchers: [
      { ext: "crc", cad: c },
      { ext: "tsp", cad: c },
      { ext: "gtp", cad: [a, m] },
      { ext: "spt", cad: l },
      { ext: "tcream\\.ger", cad: o },
      { match: /toppaste\.\w+$/, cad: [r, i] },
      { match: /f[._]paste/, cad: a },
      { match: /solderpaste_top/, cad: p },
      { match: /top_paste/, cad: n }
    ]
  },
  {
    type: g,
    side: b,
    matchers: [
      { ext: "sol", cad: c },
      { ext: "bot", cad: [c, l] },
      { ext: "gbl", cad: [a, m] },
      { ext: "bottomlayer\\.ger", cad: o },
      { match: /bottom\.\w+$/, cad: [r, i] },
      { match: /b[._]cu/, cad: a },
      { match: /copper_bottom/, cad: p },
      { match: /bottom_copper/, cad: n },
      { match: /bottom copper/, cad: null }
    ]
  },
  {
    type: E,
    side: b,
    matchers: [
      { ext: "sts", cad: c },
      { ext: "bsm", cad: c },
      { ext: "gbs", cad: [a, m] },
      { ext: "smb", cad: l },
      { ext: "bottomsoldermask\\.ger", cad: o },
      { match: /bottommask\.\w+$/, cad: [r, i] },
      { match: /b[._]mask/, cad: a },
      { match: /soldermask_bottom/, cad: p },
      { match: /bottom_mask/, cad: n },
      { match: /bottom solder resist/, cad: null }
    ]
  },
  {
    type: k,
    side: b,
    matchers: [
      { ext: "pls", cad: c },
      { ext: "bsk", cad: c },
      { ext: "gbo", cad: [a, m] },
      { ext: "ssb", cad: l },
      { ext: "bottomsilkscreen\\.ger", cad: o },
      { match: /bottomsilk\.\w+$/, cad: [r, i] },
      { match: /b[._]silks/, cad: a },
      { match: /silkscreen_bottom/, cad: p },
      { match: /bottom_silk/, cad: n },
      { match: /bottom silk screen/, cad: null }
    ]
  },
  {
    type: A,
    side: b,
    matchers: [
      { ext: "crs", cad: c },
      { ext: "bsp", cad: c },
      { ext: "gbp", cad: [a, m] },
      { ext: "spb", cad: l },
      { ext: "bcream\\.ger", cad: o },
      { match: /bottompaste\.\w+$/, cad: [r, i] },
      { match: /b[._]paste/, cad: a },
      { match: /solderpaste_bottom/, cad: p },
      { match: /bottom_paste/, cad: n }
    ]
  },
  {
    type: g,
    side: P,
    matchers: [
      { ext: "ly\\d+", cad: c },
      { ext: "gp?\\d+", cad: [a, m] },
      { ext: "in\\d+", cad: l },
      { ext: "internalplane\\d+\\.ger", cad: o },
      { match: /in(?:ner)?\d+[._]cu/, cad: a },
      { match: /inner/, cad: i }
    ]
  },
  {
    type: L,
    side: f,
    matchers: [
      { ext: "dim", cad: c },
      { ext: "mil", cad: c },
      { ext: "gml", cad: c },
      { ext: "gm\\d+", cad: [a, m] },
      { ext: "gko", cad: m },
      { ext: "fab", cad: l },
      { ext: "drd", cad: l },
      { match: /outline/, cad: [r, n] },
      { match: /boardoutline/, cad: [o, i] },
      { match: /edge[._]cuts/, cad: a },
      { match: /profile/, cad: p },
      { match: /mechanical \d+/, cad: null }
    ]
  },
  {
    type: D,
    side: f,
    matchers: [
      { ext: "txt", cad: [c, m] },
      {
        ext: "xln",
        cad: [p, c, o]
      },
      { ext: "exc", cad: c },
      { ext: "drd", cad: c },
      { ext: "drl", cad: [a, i] },
      { ext: "tap", cad: l },
      { ext: "npt", cad: l },
      { ext: "plated-drill\\.cnc", cad: r },
      { match: /fab/, cad: r },
      { match: /npth/, cad: a },
      { match: /drill/, cad: n }
    ]
  },
  {
    type: T,
    side: null,
    matchers: [
      { ext: "pos", cad: a },
      { ext: "art", cad: I },
      { ext: "gbr", cad: null },
      { ext: "gbx", cad: null },
      { ext: "ger", cad: null },
      { ext: "pho", cad: null }
    ]
  }
], R = u.flatMap((t) => t.matchers.flatMap((e) => {
  const x = Array.isArray(e.cad) ? e.cad : [e.cad], s = "ext" in e ? new RegExp("\\." + e.ext + "$", "i") : new RegExp(e.match, "i");
  return x.map((d) => ({
    type: t.type,
    side: t.side,
    match: s,
    cad: d
  }));
}));
function S(t) {
  return R.map((e) => e.match.test(t) ? { ...e, filename: t } : null).filter((e) => e !== null);
}
function O(t) {
  typeof t == "string" && (t = [t]);
  const e = t.flatMap((s) => S(s)), x = C(e);
  return Object.fromEntries(
    t.map((s) => {
      const d = w(e, s, x), h = d ? { type: d.type, side: d.side } : { type: null, side: null };
      return [s, h];
    })
  );
}
function G() {
  return u.map((t) => ({ type: t.type, side: t.side })).filter((t) => t.type !== null);
}
function M(t) {
  const e = u.some((d) => d.side === t.side && d.type === t.type), x = u.some((d) => d.side === t.side), s = u.some((d) => d.type === t.type);
  return {
    valid: e,
    side: x ? t.side : null,
    type: s ? t.type : null
  };
}
function w(t, e, x) {
  const s = t.filter((h) => h.filename === e);
  return s.find((h) => h.cad === x) ?? s[0] ?? null;
}
export {
  I as CAD_ALLEGRO,
  m as CAD_ALTIUM,
  i as CAD_DIPTRACE,
  p as CAD_EAGLE,
  c as CAD_EAGLE_LEGACY,
  o as CAD_EAGLE_OSHPARK,
  n as CAD_EAGLE_PCBNG,
  r as CAD_GEDA_PCB,
  a as CAD_KICAD,
  l as CAD_ORCAD,
  f as SIDE_ALL,
  b as SIDE_BOTTOM,
  P as SIDE_INNER,
  _ as SIDE_TOP,
  g as TYPE_COPPER,
  T as TYPE_DRAWING,
  D as TYPE_DRILL,
  L as TYPE_OUTLINE,
  k as TYPE_SILKSCREEN,
  E as TYPE_SOLDERMASK,
  A as TYPE_SOLDERPASTE,
  G as getAllLayers,
  O as identifyLayers,
  M as validate
};
//# sourceMappingURL=tracespace-identify-layers.js.map
