export function getHtmlTemplate(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Rekkon Visualizer</title>
  <style>
    :root{--bg:#020617;--bg2:#0f172a;--panel:rgba(15,23,42,.92);--line:#1e293b;--line2:#334155;--txt:#e2e8f0;--muted:#94a3b8;--sub:#64748b;--accent:#38bdf8;--warn:#fbbf24;--err:#f87171}
    *{box-sizing:border-box;margin:0;padding:0}
    html,body{height:100%;overflow:hidden;background:radial-gradient(140% 100% at 10% 0%,#172554 0%,#0f172a 48%,#020617 100%);color:var(--txt);font-family:"IBM Plex Sans","Segoe UI",sans-serif}
    #app{height:100%;display:grid;grid-template-rows:50px 1fr}
    #top{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:0 14px;border-bottom:1px solid var(--line);background:rgba(2,6,23,.82)}
    #logo{color:var(--accent);font-size:14px;font-weight:700}
    #stats{font-size:12px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .v{color:#f8fafc;font-weight:700}
    #main{position:relative;min-height:0}
    #cy{width:100%;height:100%}
    #loading{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:14px}
    #controls{position:absolute;left:12px;top:12px;z-index:20;display:flex;flex-direction:column;gap:6px;padding:8px;border:1px solid var(--line);border-radius:12px;background:var(--panel)}
    .b{width:34px;height:34px;border-radius:8px;border:1px solid var(--line2);background:#111827;color:var(--txt);cursor:pointer;font-size:15px}
    .b:hover{background:#1f2937}
    .b.on{border-color:var(--accent);background:#0f2944;color:#bae6fd}
    #layers{display:none;position:absolute;left:72px;top:14px;z-index:30;min-width:220px;max-height:50vh;overflow:auto;padding:10px;border:1px solid var(--line);border-radius:12px;background:var(--panel)}
    #layers.open{display:block}
    .lt{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--sub);margin-bottom:8px}
    .lr{display:flex;align-items:center;gap:8px;padding:4px 0;font-size:12px;color:var(--muted)}
    .lr:hover{color:var(--txt)}
    .dot{width:8px;height:8px;border-radius:999px}
    #detail{position:absolute;top:0;right:0;bottom:0;width:min(360px,90vw);transform:translateX(100%);transition:transform .18s ease;z-index:40;overflow:auto;padding:16px;border-left:1px solid var(--line);background:linear-gradient(180deg,rgba(15,23,42,.97),rgba(2,6,23,.97))}
    #detail.show{transform:translateX(0)}
    .x{float:right;border:0;background:transparent;color:var(--sub);font-size:18px;cursor:pointer}
    .x:hover{color:var(--txt)}
    .t{font-size:16px;font-weight:700;color:#f8fafc;margin-bottom:4px;padding-right:18px;word-break:break-word}
    .s{font-size:11px;color:var(--sub);margin-bottom:14px;word-break:break-all}
    .st{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#475569;margin:16px 0 8px}
    .row{display:flex;justify-content:space-between;gap:10px;padding:5px 0;border-bottom:1px solid rgba(51,65,85,.35)}
    .k{color:var(--muted)}
    .val{max-width:60%;text-align:right;color:var(--txt);font-weight:600;word-break:break-word}
    .c{margin:4px 0;padding:5px 8px;border:1px solid rgba(51,65,85,.35);border-radius:6px;background:rgba(15,23,42,.7);color:var(--muted);font-size:12px;word-break:break-word}
    .e{position:absolute;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;padding:20px;text-align:center;color:var(--err);background:rgba(2,6,23,.8)}
    @media (max-width:900px){#stats{display:none}#detail{width:100%}}
  </style>
</head>
<body>
  <div id="app">
    <div id="top"><span id="logo">rekkon</span><div id="stats">Loading graph…</div></div>
    <div id="main">
      <div id="controls">
        <button class="b" id="fit" title="Fit">⊡</button>
        <button class="b" id="zin" title="Zoom in">+</button>
        <button class="b" id="zout" title="Zoom out">−</button>
        <button class="b" id="relayout" title="Re-layout">↻</button>
        <button class="b" id="symbols" title="Toggle symbols">Σ</button>
        <button class="b" id="layersbtn" title="Filter layers">▤</button>
      </div>
      <div id="layers"></div>
      <div id="cy"></div>
      <div id="loading">Loading architecture graph…</div>
      <div id="detail"></div>
    </div>
  </div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/cytoscape/3.30.4/cytoscape.min.js"></script>
  <script>
    (function() {
      var ui = {
        stats: byId("stats"), loading: byId("loading"), main: byId("main"), detail: byId("detail"), layers: byId("layers"),
        fit: byId("fit"), zin: byId("zin"), zout: byId("zout"), relayout: byId("relayout"), symbols: byId("symbols"), layersbtn: byId("layersbtn"), cy: byId("cy")
      };
      var state = { cy: null, graph: null, symbols: false, hidden: new Set(), layersOpen: false };

      if (!window.cytoscape) { fatal("Failed to load Cytoscape from CDN."); return; }

      var LAYERS = {API:{bg:"#1e3a5f",border:"#3b82f6",text:"#93c5fd"},Pages:{bg:"#1e3a5f",border:"#3b82f6",text:"#93c5fd"},UI:{bg:"#2d1b4e",border:"#8b5cf6",text:"#c4b5fd"},Hooks:{bg:"#1b2e4a",border:"#06b6d4",text:"#67e8f9"},Core:{bg:"#1a3329",border:"#22c55e",text:"#86efac"},Services:{bg:"#2a1f0f",border:"#f59e0b",text:"#fcd34d"},State:{bg:"#2d1b4e",border:"#a855f7",text:"#d8b4fe"},Data:{bg:"#1a2332",border:"#6366f1",text:"#a5b4fc"},Config:{bg:"#1f1f1f",border:"#6b7280",text:"#9ca3af"},Types:{bg:"#1f2937",border:"#6b7280",text:"#9ca3af"},Tests:{bg:"#1c1917",border:"#78716c",text:"#a8a29e"},Middleware:{bg:"#2a1f0f",border:"#f59e0b",text:"#fcd34d"},Styles:{bg:"#2d1b33",border:"#ec4899",text:"#f9a8d4"},Assets:{bg:"#1f2937",border:"#6b7280",text:"#9ca3af"},Other:{bg:"#1f2937",border:"#6b7280",text:"#9ca3af"}};
      var EDGES = {imports:{color:"#64748b",d:false},calls:{color:"#3b82f6",d:false},exports:{color:"#22c55e",d:false},renders:{color:"#a855f7",d:false},extends:{color:"#f59e0b",d:true},implements:{color:"#f59e0b",d:true},type_depends:{color:"#6b7280",d:true}};
      var SHAPES = {component:"round-rectangle",page:"round-rectangle",hook:"diamond",function:"ellipse",class:"hexagon",interface:"pentagon","type-alias":"pentagon",constant:"round-rectangle",variable:"round-rectangle",utility:"round-rectangle",config:"round-rectangle",route:"tag",test:"round-rectangle",style:"round-rectangle",enum:"octagon","type-definition":"pentagon",default:"ellipse"};
      try { init(); } catch (e) { renderInitError(e); }
      live();

      async function init() {
        try {
          var res = await fetch("/api/graph", { cache: "no-store" });
          if (!res.ok) throw new Error("Unable to load graph file (" + res.status + ")");
          state.graph = await res.json();
          drawStats(state.graph.snapshot || {});
          mount();
          buildLayers();
          wireControls();
          wireGraph();
          applyVisibility();
          layout();
          if (ui.loading) ui.loading.style.display = "none";
        } catch (e) {
          renderInitError(e);
        }
      }

      function mount() {
        var nodes = ((state.graph || {}).elements || {}).nodes || [];
        var edges = ((state.graph || {}).elements || {}).edges || [];
        state.cy = cytoscape({ container: ui.cy, elements: nodes.concat(edges), style: styleSheet(), minZoom: 0.005, maxZoom: 5 });
        colorize(nodes);
      }

      function styleSheet() {
        return [
          { selector:"node", style:{label:"data(label)","text-valign":"center","text-halign":"center","font-size":"10px","font-family":"\\"IBM Plex Sans\\",\\"Segoe UI\\",sans-serif",color:"#e2e8f0","text-outline-color":"#0f172a","text-outline-width":1,"background-color":"#334155","border-width":1,"border-color":"#475569"} },
          { selector:"node[type='layer']", style:{shape:"round-rectangle","background-opacity":0.15,"border-width":2,"border-opacity":0.7,"text-valign":"top","text-halign":"center","font-size":"14px","font-weight":"bold",padding:"22px","text-margin-y":10} },
          { selector:"node[type='module']", style:{shape:"round-rectangle","background-opacity":0.1,"border-width":1.5,"border-opacity":0.5,"text-valign":"top","text-halign":"center","font-size":"11px","font-weight":600,padding:"16px","text-margin-y":8} },
          { selector:"node[type='file']", style:{width:35,height:35,"font-size":"8px","text-max-width":"92px","text-wrap":"ellipsis"} },
          { selector:"node[type='symbol']", style:{width:18,height:18,"font-size":"7px","background-opacity":0.85,"text-max-width":"64px","text-wrap":"ellipsis"} },
          { selector:"edge", style:{width:1.5,"line-color":"#475569","target-arrow-color":"#475569","target-arrow-shape":"triangle","curve-style":"bezier","arrow-scale":0.8,opacity:0.65} },
          { selector:"node:selected", style:{"border-width":3,"border-color":"#38bdf8","background-opacity":0.32,"overlay-color":"#38bdf8","overlay-opacity":0.1} },
          { selector:"node.highlighted", style:{"border-width":2,"border-color":"#fbbf24","background-opacity":0.26} },
          { selector:"node.dimmed", style:{opacity:0.2} },
          { selector:"edge.dimmed", style:{opacity:0.06} },
          { selector:"edge.highlighted", style:{opacity:1,width:2.5} },
          { selector:":parent", style:{"background-clip":"none"} }
        ];
      }

      function colorize(nodes) {
        var cy = state.cy;
        var map = {};
        nodes.forEach(function(n){ if (n && n.data && n.data.id) map[n.data.id] = n.data; });
        cy.nodes().forEach(function(node) {
          var d = node.data() || {};
          var type = d.type || "file";
          var subtype = d.subtype || "default";
          var layer = findLayer(d.id, map);
          var c = LAYERS[layer] || LAYERS.Other;
          var loc = Number(d.loc || 0);
          var fileSize = Math.max(30, Math.min(64, 30 + Math.round(Math.sqrt(Math.max(loc, 1)) * 2)));
          var size = type === "file" ? fileSize : type === "symbol" ? 20 : type === "module" ? 60 : 80;
          node.style({
            shape: type === "layer" || type === "module" ? "round-rectangle" : (SHAPES[subtype] || SHAPES.default),
            width: size, height: size,
            "background-color": (type === "layer" || type === "module") ? c.bg : c.border,
            "background-opacity": type === "symbol" ? 0.85 : 1,
            "border-color": c.border, color: (type === "layer" || type === "module") ? c.text : "#f8fafc"
          });
        });
        cy.edges().forEach(function(edge) {
          var t = edge.data("type") || "imports";
          var w = Number(edge.data("weight") || 1);
          var s = EDGES[t] || EDGES.imports;
          edge.style({ width: Math.max(1, Math.min(4, 1 + w * 0.45)), "line-color": s.color, "target-arrow-color": s.color, "line-style": s.d ? "dashed" : "solid" });
        });
      }

      function findLayer(nodeId, map) {
        var cur = map[nodeId];
        var hops = 0;
        while (cur && hops < 12) {
          if (cur.type === "layer") return cur.label || "Other";
          var p = cur.parent || cur.parent_id;
          if (!p) break;
          cur = map[p];
          hops += 1;
        }
        return "Other";
      }

      function layout() {
        if (!state.cy) return;
        var visible = state.cy.elements(":visible");
        var target = visible.length ? visible : state.cy.elements();
        target.layout({
          name:"cose",
          animate:false,
          fit:false,
          padding:50,
          componentSpacing: 120,
          boundingBox:{ x1:0, y1:0, w:Math.max(1, state.cy.width()), h:Math.max(1, state.cy.height()) },
          nodeRepulsion:function(){ return 5000; },
          idealEdgeLength:function(){ return 90; },
          edgeElasticity:function(){ return 0.45; },
          gravity:0.25,
          numIter:1000,
          nodeDimensionsIncludeLabels:true
        }).run();
        var fitTarget = state.cy.elements(":visible");
        if (fitTarget.length) state.cy.fit(fitTarget, 50);
      }

      function wireGraph() {
        var cy = state.cy;
        cy.on("tap", "node", function(ev) {
          var node = ev.target;
          var hood = node.closedNeighborhood();
          var ns = hood.nodes().union(node);
          var es = hood.edges();
          cy.startBatch();
          cy.elements().removeClass("highlighted").removeClass("dimmed").addClass("dimmed");
          ns.removeClass("dimmed").addClass("highlighted");
          es.removeClass("dimmed").addClass("highlighted");
          var p = node.parent(); while (p && p.length > 0) { p.removeClass("dimmed"); p = p.parent(); }
          node.select();
          cy.endBatch();
          showDetail(node);
        });
        cy.on("tap", function(ev){ if (ev.target !== cy) return; clearFocus(); hideDetail(); });
      }

      function clearFocus() {
        if (!state.cy) return;
        state.cy.elements().removeClass("highlighted").removeClass("dimmed");
        state.cy.$(":selected").unselect();
      }

      function showDetail(node) {
        var d = node.data() || {};
        var parts = [];
        parts.push('<button class="x" id="close">✕</button>');
        parts.push('<div class="t">' + esc(d.label || node.id()) + "</div>");
        parts.push('<div class="s">' + esc((d.subtype || d.type || "unknown") + (d.file_path ? " · " + d.file_path : "")) + "</div>");
        parts.push('<div class="st">Metrics</div>');
        metric(parts, "Type", String(d.type || "unknown"));
        if (d.loc != null) metric(parts, "LOC", String(d.loc));
        if (d.complexity != null) metric(parts, "Complexity", String(d.complexity));
        if (d.export_count != null) metric(parts, "Exports", String(d.export_count));
        if (d.import_count != null) metric(parts, "Imports", String(d.import_count));
        var out = node.outgoers("edge"), inc = node.incomers("edge");
        if (out.length || inc.length) {
          parts.push('<div class="st">Connections</div>');
          out.forEach(function(e){ parts.push('<div class="c">→ ' + esc(String(e.data("type") || "edge")) + " " + esc(String(e.target().data("label") || e.target().id())) + "</div>"); });
          inc.forEach(function(e){ parts.push('<div class="c">← ' + esc(String(e.data("type") || "edge")) + " " + esc(String(e.source().data("label") || e.source().id())) + "</div>"); });
        }
        if (d.metadata && typeof d.metadata === "object" && Object.keys(d.metadata).length) {
          parts.push('<div class="st">Metadata</div>');
          Object.keys(d.metadata).forEach(function(k){ metric(parts, k, val(d.metadata[k])); });
        }
        ui.detail.innerHTML = parts.join("");
        ui.detail.classList.add("show");
        byId("close").addEventListener("click", function(){ clearFocus(); hideDetail(); });
      }

      function metric(parts, k, v) { parts.push('<div class="row"><span class="k">' + esc(k) + '</span><span class="val">' + esc(v) + "</span></div>"); }
      function hideDetail() { ui.detail.classList.remove("show"); }

      function buildLayers() {
        ui.layers.innerHTML = '<div class="lt">Layers</div>';
        var list = getLayerList();
        if (!list.length) { ui.layers.innerHTML += '<div class="lr">No layer nodes found</div>'; return; }
        list.forEach(function(layer) {
          var c = (LAYERS[layer.label] || LAYERS.Other).border;
          var row = document.createElement("label"); row.className = "lr";
          var cb = document.createElement("input"); cb.type = "checkbox"; cb.checked = true; cb.dataset.layerId = layer.id;
          var dot = document.createElement("span"); dot.className = "dot"; dot.style.backgroundColor = c;
          var txt = document.createElement("span"); txt.textContent = layer.label;
          row.appendChild(cb); row.appendChild(dot); row.appendChild(txt); ui.layers.appendChild(row);
          cb.addEventListener("change", function() {
            if (cb.checked) state.hidden.delete(layer.id); else state.hidden.add(layer.id);
            clearFocus(); hideDetail(); applyVisibility();
          });
        });
      }

      function getLayerList() {
        var g = state.graph || {};
        var fromSnapshot = ((g.snapshot || {}).layer_summary || []).map(function(layer){ return { id: String(layer.id), label: String(layer.label) }; });
        if (fromSnapshot.length) return fromSnapshot.sort(function(a,b){ return a.label.localeCompare(b.label); });
        var nodes = ((g.elements || {}).nodes || []);
        return nodes.filter(function(n){ return n && n.data && n.data.type === "layer"; }).map(function(n){ return { id: String(n.data.id), label: String(n.data.label) }; }).sort(function(a,b){ return a.label.localeCompare(b.label); });
      }

      function applyVisibility() {
        var cy = state.cy; if (!cy) return;
        cy.startBatch();
        cy.nodes().style("display", "element"); cy.edges().style("display", "element");
        if (!state.symbols) cy.nodes("[type='symbol']").style("display", "none");
        state.hidden.forEach(function(id){ var layer = cy.getElementById(id); if (layer && layer.length) layer.union(layer.descendants()).style("display", "none"); });
        cy.edges().forEach(function(e){ var sv = e.source().style("display") !== "none"; var tv = e.target().style("display") !== "none"; e.style("display", sv && tv ? "element" : "none"); });
        cy.endBatch();
      }

      function wireControls() {
        ui.fit.addEventListener("click", function(){ var vis = state.cy.elements(":visible"); if (vis.length) state.cy.fit(vis, 50); else state.cy.fit(undefined, 50); });
        ui.zin.addEventListener("click", function(){ zoom(1.3); });
        ui.zout.addEventListener("click", function(){ zoom(1 / 1.3); });
        ui.relayout.addEventListener("click", layout);
        ui.symbols.addEventListener("click", function(){ state.symbols = !state.symbols; ui.symbols.classList.toggle("on", state.symbols); clearFocus(); hideDetail(); applyVisibility(); if (state.symbols) layout(); });
        ui.layersbtn.addEventListener("click", function(){ state.layersOpen = !state.layersOpen; ui.layersbtn.classList.toggle("on", state.layersOpen); ui.layers.classList.toggle("open", state.layersOpen); });
      }

      function zoom(factor) {
        if (!state.cy) return;
        var z = clamp(state.cy.zoom() * factor, state.cy.minZoom(), state.cy.maxZoom());
        state.cy.zoom({ level: z, renderedPosition: { x: state.cy.width() / 2, y: state.cy.height() / 2 } });
      }

      function drawStats(s) {
        var langs = Array.isArray(s.languages) && s.languages.length ? s.languages.join(", ") : "unknown";
        var ms = s.analysis_duration_ms == null ? "?" : String(s.analysis_duration_ms);
        ui.stats.innerHTML = '<span class="v">' + num(s.total_files) + '</span> files · <span class="v">' + num(s.total_symbols) + '</span> symbols · <span class="v">' + num(s.total_edges) + '</span> edges · <span class="v">' + num(s.total_loc) + "</span> LOC · " + esc(langs) + ' · <span class="v">' + esc(ms) + "</span>ms";
      }

      function live() {
        try {
          var protocol = location.protocol === "https:" ? "wss:" : "ws:";
          var ws = new WebSocket(protocol + "//" + location.host);
          ws.onmessage = function(ev){ if (ev.data === "reload") location.reload(); };
          ws.onerror = function(){ try { ws.close(); } catch (_) {} };
          ws.onclose = function(){ setTimeout(live, 2000); };
        } catch (_) {
          setTimeout(live, 2000);
        }
      }

      function renderInitError(err) {
        if (ui.loading) ui.loading.style.display = "none";
        var cyEl = byId("cy");
        var msg = err && err.message ? err.message : String(err);
        if (cyEl) {
          cyEl.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#f87171;font-size:14px;padding:20px;text-align:center;">' + "Failed to load graph: " + esc(msg) + "</div>";
        } else {
          fatal("Failed to load graph: " + msg);
        }
        console.error("Rekkon visualizer error:", err);
      }

      function fatal(msg) {
        var loading = ui && ui.loading ? ui.loading : byId("loading");
        if (loading) loading.style.display = "none";
        var main = ui && ui.main ? ui.main : byId("main");
        if (!main) { console.error(msg); return; }
        var n = document.createElement("div"); n.className = "e"; n.textContent = msg; main.appendChild(n);
      }
      function val(v) { if (v == null) return ""; if (typeof v === "string") return v; try { return JSON.stringify(v); } catch (_) { return String(v); } }
      function num(v) { var n = Number(v); return isFinite(n) ? n.toLocaleString() : "0"; }
      function byId(id) { return document.getElementById(id); }
      function esc(v) { return String(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"); }
      function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }
    })();
  </script>
</body>
</html>`;
}
