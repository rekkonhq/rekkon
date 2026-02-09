export function getHtmlTemplate(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Rekkon — Architecture Graph</title>
  <style>
    :root {
      --bg: #020617;
      --bg2: #0f172a;
      --panel: rgba(15, 23, 42, 0.95);
      --line: #1e293b;
      --line2: #334155;
      --txt: #e2e8f0;
      --muted: #94a3b8;
      --sub: #64748b;
      --accent: #38bdf8;
      --warn: #fbbf24;
      --err: #f87171;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    html,
    body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      color: var(--txt);
      background: radial-gradient(ellipse 140% 100% at 10% 0%, #172554 0%, #0f172a 48%, #020617 100%);
      font-family: "IBM Plex Sans", "Inter", "Segoe UI", system-ui, sans-serif;
    }

    #app {
      height: 100%;
      display: grid;
      grid-template-rows: 48px 1fr;
    }

    #top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 48px;
      padding: 0 14px;
      border-bottom: 1px solid var(--line);
      background: rgba(2, 6, 23, 0.78);
      backdrop-filter: blur(6px);
    }

    #logo {
      color: var(--accent);
      font-weight: 700;
      font-size: 15px;
      letter-spacing: 0.04em;
      text-transform: lowercase;
    }

    #stats {
      font-size: 12px;
      color: var(--muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    #main {
      position: relative;
      min-height: 0;
      width: 100%;
      height: 100%;
    }

    #cy {
      width: 100%;
      height: 100%;
    }

    #loading {
      position: absolute;
      inset: 0;
      z-index: 35;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(2, 6, 23, 0.5);
      color: var(--muted);
      font-size: 14px;
      letter-spacing: 0.02em;
    }

    #controls {
      position: absolute;
      top: 12px;
      left: 12px;
      z-index: 40;
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 9px;
      border-radius: 999px;
      border: 1px solid var(--line);
      background: var(--panel);
      box-shadow: 0 12px 32px rgba(2, 6, 23, 0.45);
    }

    .ctrl {
      width: 34px;
      height: 34px;
      border: 1px solid var(--line2);
      border-radius: 999px;
      background: rgba(15, 23, 42, 0.95);
      color: var(--txt);
      cursor: pointer;
      font-size: 18px;
      line-height: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: background-color 140ms ease, border-color 140ms ease, color 140ms ease, transform 140ms ease;
    }

    .ctrl:hover {
      background: #13243f;
      border-color: var(--accent);
      transform: translateY(-1px);
    }

    .ctrl.active {
      border-color: var(--accent);
      color: #bae6fd;
      background: #0c3352;
    }

    #layers {
      position: absolute;
      top: 12px;
      left: 64px;
      z-index: 41;
      width: min(280px, calc(100vw - 88px));
      max-height: min(60vh, 520px);
      overflow: auto;
      padding: 12px;
      border-radius: 12px;
      border: 1px solid var(--line);
      background: var(--panel);
      box-shadow: 0 14px 38px rgba(2, 6, 23, 0.52);
      transform: translateX(-115%);
      opacity: 0;
      pointer-events: none;
      transition: transform 180ms ease, opacity 180ms ease;
    }

    #layers.open {
      transform: translateX(0);
      opacity: 1;
      pointer-events: auto;
    }

    .layers-title {
      font-size: 11px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--sub);
      margin-bottom: 10px;
      font-weight: 700;
    }

    .layer-row {
      display: flex;
      align-items: center;
      gap: 9px;
      margin: 6px 0;
      font-size: 13px;
      color: var(--muted);
      user-select: none;
      cursor: pointer;
    }

    .layer-row:hover {
      color: var(--txt);
    }

    .layer-check {
      accent-color: var(--accent);
      width: 14px;
      height: 14px;
      cursor: pointer;
    }

    .layer-dot {
      width: 10px;
      height: 10px;
      border-radius: 999px;
      box-shadow: 0 0 0 2px rgba(2, 6, 23, 0.5);
    }

    #detail {
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      z-index: 45;
      width: min(420px, 95vw);
      border-left: 1px solid var(--line);
      background: linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(2, 6, 23, 0.98));
      box-shadow: -12px 0 32px rgba(2, 6, 23, 0.6);
      padding: 16px;
      overflow: auto;
      transform: translateX(100%);
      transition: transform 180ms ease;
    }

    #detail.open {
      transform: translateX(0);
    }

    .detail-close {
      float: right;
      border: 0;
      background: transparent;
      color: var(--muted);
      cursor: pointer;
      font-size: 20px;
      line-height: 1;
      margin-left: 6px;
    }

    .detail-close:hover {
      color: var(--txt);
    }

    .detail-title {
      font-size: 18px;
      line-height: 1.25;
      font-weight: 700;
      margin-bottom: 6px;
      color: #f8fafc;
      word-break: break-word;
      padding-right: 24px;
    }

    .detail-path {
      font-size: 12px;
      color: var(--muted);
      margin-bottom: 12px;
      line-height: 1.4;
      word-break: break-all;
    }

    .type-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 3px 10px;
      border-radius: 999px;
      border: 1px solid;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.02em;
      text-transform: uppercase;
      margin-bottom: 12px;
    }

    .detail-section {
      margin-top: 10px;
    }

    .detail-section-title {
      font-size: 11px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--sub);
      font-weight: 700;
      margin-bottom: 8px;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      padding: 6px 0;
      border-bottom: 1px solid rgba(51, 65, 85, 0.38);
      font-size: 13px;
    }

    .detail-key {
      color: var(--muted);
      text-transform: capitalize;
    }

    .detail-value {
      color: var(--txt);
      font-weight: 600;
      text-align: right;
      word-break: break-word;
    }

    .conn-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .conn-item {
      border: 1px solid rgba(51, 65, 85, 0.45);
      background: rgba(15, 23, 42, 0.65);
      color: var(--muted);
      border-radius: 8px;
      padding: 7px 9px;
      font-size: 12px;
      line-height: 1.35;
      word-break: break-word;
    }

    .conn-item.empty {
      font-style: italic;
      color: var(--sub);
    }

    .error-message {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 24px;
      color: var(--err);
      font-size: 14px;
      background: rgba(2, 6, 23, 0.82);
    }

    @media (max-width: 900px) {
      #stats {
        display: none;
      }

      #controls {
        left: 10px;
        top: 10px;
      }

      #layers {
        top: 64px;
        left: 10px;
      }

      #detail {
        width: 100%;
      }
    }
  </style>
</head>
<body>
  <div id="app">
    <div id="top">
      <span id="logo">rekkon</span>
      <div id="stats">Loading...</div>
    </div>
    <div id="main">
      <div id="controls">
        <button id="fit" class="ctrl" title="Fit graph">⊡</button>
        <button id="zin" class="ctrl" title="Zoom in">+</button>
        <button id="zout" class="ctrl" title="Zoom out">−</button>
        <button id="relayout" class="ctrl" title="Re-layout">↻</button>
        <button id="symbols" class="ctrl" title="Symbols">Σ</button>
        <button id="layersbtn" class="ctrl" title="Layers">▤</button>
      </div>
      <div id="layers"></div>
      <div id="cy"></div>
      <div id="loading">Analyzing architecture...</div>
      <div id="detail"></div>
    </div>
  </div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/cytoscape/3.30.4/cytoscape.min.js"></script>
  <script>
    (function() {
      var ui = {
        stats: byId("stats"),
        loading: byId("loading"),
        cy: byId("cy"),
        detail: byId("detail"),
        layers: byId("layers"),
        fit: byId("fit"),
        zin: byId("zin"),
        zout: byId("zout"),
        relayout: byId("relayout"),
        symbols: byId("symbols"),
        layersbtn: byId("layersbtn")
      };

      var state = {
        cy: null,
        graph: null,
        symbols: false,
        layersOpen: false,
        hiddenLayers: Object.create(null),
        nodeDataById: Object.create(null)
      };

      var LAYER_COLORS = {
        Core:       { bg: "#0f2818", border: "#22c55e" },
        Data:       { bg: "#1a1333", border: "#8b5cf6" },
        Hooks:      { bg: "#0f1a2e", border: "#3b82f6" },
        Styles:     { bg: "#2a1328", border: "#ec4899" },
        UI:         { bg: "#0f2a2a", border: "#06b6d4" },
        API:        { bg: "#1a1333", border: "#a855f7" },
        Pages:      { bg: "#1a1333", border: "#8b5cf6" },
        Services:   { bg: "#0f2818", border: "#22c55e" },
        State:      { bg: "#1a1333", border: "#8b5cf6" },
        Middleware: { bg: "#1a1818", border: "#f97316" },
        Config:     { bg: "#1a1a1a", border: "#64748b" },
        Types:      { bg: "#1a1a1a", border: "#64748b" },
        Tests:      { bg: "#1a1a1a", border: "#6b7280" },
        Assets:     { bg: "#1a1a1a", border: "#64748b" },
        Other:      { bg: "#1a1a1a", border: "#475569" }
      };

      var EDGE_STYLES = {
        imports:      { color: "rgba(100,116,139,0.5)", dashed: false },
        calls:        { color: "rgba(59,130,246,0.6)",  dashed: false },
        exports:      { color: "rgba(34,197,94,0.5)",   dashed: false },
        renders:      { color: "rgba(168,85,247,0.5)",  dashed: false },
        extends:      { color: "rgba(245,158,11,0.5)",  dashed: true },
        implements:   { color: "rgba(245,158,11,0.5)",  dashed: true },
        type_depends: { color: "rgba(107,114,128,0.4)", dashed: true }
      };

      var LAYOUT_OPTIONS = {
        name: "cose",
        animate: false,
        fit: true,
        padding: 50,
        nodeDimensionsIncludeLabels: true,
        nodeRepulsion: function() { return 65536; },
        idealEdgeLength: function() { return 120; },
        edgeElasticity: function() { return 0.1; },
        gravity: 0.6,
        numIter: 2000,
        nestPadding: 25,
        componentSpacing: 80,
        randomize: true
      };

      init();
      setupLiveReload();

      async function init() {
        try {
          if (!window.cytoscape) {
            throw new Error("Cytoscape failed to load.");
          }

          var response = await fetch("/api/graph", { cache: "no-store" });
          if (!response.ok) {
            throw new Error("Failed to load graph (" + response.status + ").");
          }

          state.graph = await response.json();
          var prepared = prepareElements(state.graph);
          mount(prepared);
          buildLayerFilter(prepared);
          wireControls();
          wireGraph();
          applyVisibility();
          runLayout();
          drawStats(state.graph, prepared);

          if (ui.loading) {
            ui.loading.style.display = "none";
          }
        } catch (error) {
          renderInitError(error);
        }
      }

      function prepareElements(graph) {
        var rawNodes = (((graph || {}).elements || {}).nodes || []);
        var rawEdges = (((graph || {}).elements || {}).edges || []);

        var nodeDataById = Object.create(null);
        rawNodes.forEach(function(node) {
          var data = (node && node.data) || {};
          if (data.id) {
            nodeDataById[data.id] = data;
          }
        });
        state.nodeDataById = nodeDataById;

        var layerCache = Object.create(null);

        var nodes = rawNodes.map(function(node) {
          var out = {};
          var data = Object.assign({}, (node && node.data) || {});

          if (node && node.position) {
            out.position = node.position;
          }
          if (node && node.group) {
            out.group = node.group;
          }
          if (node && node.classes) {
            out.classes = node.classes;
          }

          var layerName = resolveLayerName(data.id, nodeDataById, layerCache);
          var palette = LAYER_COLORS[layerName] || LAYER_COLORS.Other;

          data.bgColor = palette.bg;
          data.borderColor = palette.border;
          data.layerName = layerName;
          data.path = data.path || data.file_path || data.id;
          data.label = data.label || data.id || "(unknown)";

          out.data = data;
          return out;
        });

        var edges = rawEdges.map(function(edge) {
          var out = {};
          var data = Object.assign({}, (edge && edge.data) || {});

          if (edge && edge.position) {
            out.position = edge.position;
          }
          if (edge && edge.group) {
            out.group = edge.group;
          }
          if (edge && edge.classes) {
            out.classes = edge.classes;
          }

          var style = EDGE_STYLES[data.type] || EDGE_STYLES.imports;
          var weight = Number(data.weight || 1);

          data.edgeColor = style.color;
          data.edgeStyle = style.dashed ? "dashed" : "solid";
          data.edgeWidth = Math.max(1, Math.min(4, 1 + weight * 0.5));

          out.data = data;
          return out;
        });

        return {
          nodes: nodes,
          edges: edges
        };
      }

      function resolveLayerName(nodeId, nodeDataById, cache) {
        if (!nodeId) {
          return "Other";
        }

        if (cache[nodeId]) {
          return cache[nodeId];
        }

        var currentId = nodeId;
        var guard = 0;
        while (currentId && guard < 300) {
          if (cache[currentId]) {
            cache[nodeId] = cache[currentId];
            return cache[currentId];
          }

          var current = nodeDataById[currentId];
          if (!current) {
            break;
          }

          if (current.type === "layer") {
            var layerName = current.label || "Other";
            cache[currentId] = layerName;
            cache[nodeId] = layerName;
            return layerName;
          }

          currentId = current.parent || current.parent_id || null;
          guard += 1;
        }

        cache[nodeId] = "Other";
        return "Other";
      }

      function mount(prepared) {
        state.cy = cytoscape({
          container: ui.cy,
          elements: prepared.nodes.concat(prepared.edges),
          style: getStylesheet(),
          minZoom: 0.03,
          maxZoom: 5,
          wheelSensitivity: 0.16,
          selectionType: "single"
        });

        window.cy = state.cy;
      }

      function getStylesheet() {
        return [
          {
            selector: "node",
            style: {
              "label": "data(label)",
              "font-family": "'IBM Plex Sans', 'Inter', 'Segoe UI', system-ui, sans-serif",
              "font-size": "10px",
              "color": "#e2e8f0",
              "text-outline-color": "#020617",
              "text-outline-width": 2,
              "background-color": "data(bgColor)",
              "border-color": "data(borderColor)",
              "border-width": 1,
              "min-zoomed-font-size": 6
            }
          },
          {
            selector: "node[type='layer']",
            style: {
              "background-color": "data(bgColor)",
              "background-opacity": 0.85,
              "border-color": "data(borderColor)",
              "border-width": 2.5,
              "border-opacity": 0.9,
              "shape": "roundrectangle",
              "label": "data(label)",
              "font-size": "18px",
              "font-weight": "bold",
              "color": "data(borderColor)",
              "text-valign": "top",
              "text-halign": "center",
              "text-margin-y": 10,
              "padding": "35px",
              "text-outline-color": "#020617",
              "text-outline-width": 3
            }
          },
          {
            selector: "node[type='module']",
            style: {
              "background-color": "data(bgColor)",
              "background-opacity": 0.5,
              "border-color": "data(borderColor)",
              "border-width": 1.5,
              "border-opacity": 0.6,
              "shape": "roundrectangle",
              "label": "data(label)",
              "font-size": "11px",
              "font-weight": "600",
              "color": "data(borderColor)",
              "text-valign": "top",
              "text-halign": "center",
              "text-margin-y": 8,
              "padding": "20px",
              "text-outline-color": "#020617",
              "text-outline-width": 2
            }
          },
          {
            selector: "node[type='file']",
            style: {
              "background-color": "data(borderColor)",
              "background-opacity": 0.9,
              "border-color": "data(borderColor)",
              "border-width": 1,
              "width": 28,
              "height": 28,
              "shape": "roundrectangle",
              "label": "data(label)",
              "font-size": "8px",
              "color": "#cbd5e1",
              "text-valign": "bottom",
              "text-halign": "center",
              "text-margin-y": 6,
              "text-outline-color": "#020617",
              "text-outline-width": 1.5,
              "text-max-width": "90px",
              "text-wrap": "ellipsis"
            }
          },
          {
            selector: "node[type='symbol']",
            style: {
              "width": 12,
              "height": 12,
              "background-color": "data(borderColor)",
              "background-opacity": 0.7,
              "border-width": 0,
              "label": "data(label)",
              "font-size": "7px",
              "color": "#64748b",
              "text-valign": "bottom",
              "text-margin-y": 3,
              "text-outline-color": "#020617",
              "text-outline-width": 1,
              "display": "none"
            }
          },
          {
            selector: "edge",
            style: {
              "width": "data(edgeWidth)",
              "line-color": "data(edgeColor)",
              "target-arrow-color": "data(edgeColor)",
              "line-style": "data(edgeStyle)",
              "target-arrow-shape": "triangle",
              "curve-style": "bezier",
              "arrow-scale": 0.7,
              "opacity": 0.6
            }
          },
          {
            selector: "node:selected",
            style: {
              "border-width": 3,
              "border-color": "#38bdf8",
              "overlay-color": "#38bdf8",
              "overlay-opacity": 0.08
            }
          },
          {
            selector: "node.highlighted",
            style: {
              "border-width": 2.5,
              "border-color": "#fbbf24",
              "overlay-color": "#fbbf24",
              "overlay-opacity": 0.06
            }
          },
          {
            selector: "node.dimmed",
            style: { "opacity": 0.15 }
          },
          {
            selector: "edge.dimmed",
            style: { "opacity": 0.04 }
          },
          {
            selector: "edge.highlighted",
            style: { "opacity": 1, "width": 2.5 }
          },
          {
            selector: ":parent",
            style: { "background-clip": "none" }
          }
        ];
      }

      function wireControls() {
        ui.fit.addEventListener("click", function() {
          fitGraph();
        });

        ui.zin.addEventListener("click", function() {
          zoomBy(1.2);
        });

        ui.zout.addEventListener("click", function() {
          zoomBy(1 / 1.2);
        });

        ui.relayout.addEventListener("click", function() {
          clearHighlighting();
          hideDetail();
          runLayout();
        });

        ui.symbols.addEventListener("click", function() {
          state.symbols = !state.symbols;
          ui.symbols.classList.toggle("active", state.symbols);
          clearHighlighting();
          hideDetail();
          applyVisibility();
          runLayout();
        });

        ui.layersbtn.addEventListener("click", function() {
          state.layersOpen = !state.layersOpen;
          ui.layersbtn.classList.toggle("active", state.layersOpen);
          ui.layers.classList.toggle("open", state.layersOpen);
        });
      }

      function wireGraph() {
        if (!state.cy) {
          return;
        }

        state.cy.on("tap", "node", function(event) {
          var node = event.target;
          var connectedEdges = node.connectedEdges();
          var neighbors = connectedEdges.connectedNodes().union(node);

          state.cy.startBatch();
          state.cy.elements().removeClass("highlighted").removeClass("dimmed");
          state.cy.$(":selected").unselect();

          node.select();
          neighbors.addClass("highlighted");
          connectedEdges.addClass("highlighted");

          state.cy.nodes().not(neighbors).addClass("dimmed");
          state.cy.edges().not(connectedEdges).addClass("dimmed");
          state.cy.endBatch();

          showDetail(node);
        });

        state.cy.on("tap", function(event) {
          if (event.target !== state.cy) {
            return;
          }

          clearHighlighting();
          hideDetail();
        });
      }

      function showDetail(node) {
        var data = node.data() || {};
        var layerName = data.layerName || "Other";
        var palette = LAYER_COLORS[layerName] || LAYER_COLORS.Other;
        var typeValue = String(data.type || "unknown");
        var pathValue = data.path || data.id || "(unknown)";

        var outgoingImports = node.outgoers("edge[type='imports']");
        var incomingImports = node.incomers("edge[type='imports']");

        var html = [];
        html.push('<button id="detail-close" class="detail-close" title="Close">×</button>');
        html.push('<div class="detail-title">' + esc(data.label || data.id || "(unknown)") + "</div>");
        html.push('<div class="detail-path">' + esc(pathValue) + "</div>");
        html.push('<span class="type-badge" style="border-color:' + esc(palette.border) + ";color:" + esc(palette.border) + ";background:" + esc(withAlpha(palette.border, 0.16)) + ';">' + esc(typeValue) + "</span>");

        html.push('<div class="detail-section">');
        html.push('<div class="detail-section-title">Stats</div>');
        html.push(detailRow("LOC", valueOrDash(data.loc)));
        html.push(detailRow("Type", valueOrDash(data.type)));
        html.push(detailRow("Subtype", valueOrDash(data.subtype)));
        html.push(detailRow("Layer", valueOrDash(layerName)));
        html.push("</div>");

        html.push('<div class="detail-section">');
        html.push('<div class="detail-section-title">Imports</div>');
        html.push('<div class="conn-list">');
        if (!outgoingImports.length) {
          html.push('<div class="conn-item empty">No imports</div>');
        } else {
          outgoingImports.forEach(function(edge) {
            var targetNode = edge.target();
            var label = targetNode.data("label") || targetNode.id();
            html.push('<div class="conn-item">→ ' + esc(String(label)) + "</div>");
          });
        }
        html.push("</div>");
        html.push("</div>");

        html.push('<div class="detail-section">');
        html.push('<div class="detail-section-title">Imported by</div>');
        html.push('<div class="conn-list">');
        if (!incomingImports.length) {
          html.push('<div class="conn-item empty">No incoming imports</div>');
        } else {
          incomingImports.forEach(function(edge) {
            var sourceNode = edge.source();
            var label = sourceNode.data("label") || sourceNode.id();
            html.push('<div class="conn-item">← ' + esc(String(label)) + "</div>");
          });
        }
        html.push("</div>");
        html.push("</div>");

        ui.detail.innerHTML = html.join("");
        ui.detail.classList.add("open");

        var closeButton = byId("detail-close");
        if (closeButton) {
          closeButton.addEventListener("click", function() {
            clearHighlighting();
            hideDetail();
          });
        }
      }

      function hideDetail() {
        ui.detail.classList.remove("open");
      }

      function detailRow(key, value) {
        return '<div class="detail-row"><span class="detail-key">' + esc(key) + '</span><span class="detail-value">' + esc(value) + "</span></div>";
      }

      function clearHighlighting() {
        if (!state.cy) {
          return;
        }

        state.cy.startBatch();
        state.cy.elements().removeClass("highlighted").removeClass("dimmed");
        state.cy.$(":selected").unselect();
        state.cy.endBatch();
      }

      function buildLayerFilter(prepared) {
        if (!ui.layers) {
          return;
        }

        ui.layers.innerHTML = "";
        var title = document.createElement("div");
        title.className = "layers-title";
        title.textContent = "Layer Filter";
        ui.layers.appendChild(title);

        var layerList = [];
        var seen = Object.create(null);

        var snapshotLayers = (((state.graph || {}).snapshot || {}).layer_summary || []);
        if (Array.isArray(snapshotLayers) && snapshotLayers.length) {
          snapshotLayers.forEach(function(layer) {
            if (!layer || !layer.id) {
              return;
            }
            var label = layer.label || "Other";
            if (seen[layer.id]) {
              return;
            }
            seen[layer.id] = true;
            layerList.push({ id: String(layer.id), label: String(label) });
          });
        }

        if (!layerList.length) {
          prepared.nodes.forEach(function(node) {
            var data = (node && node.data) || {};
            if (data.type !== "layer" || !data.id) {
              return;
            }
            if (seen[data.id]) {
              return;
            }
            seen[data.id] = true;
            layerList.push({ id: String(data.id), label: String(data.label || "Other") });
          });
        }

        layerList.sort(function(a, b) {
          return a.label.localeCompare(b.label);
        });

        if (!layerList.length) {
          var empty = document.createElement("div");
          empty.className = "conn-item empty";
          empty.textContent = "No layers found";
          ui.layers.appendChild(empty);
          return;
        }

        layerList.forEach(function(layer) {
          var row = document.createElement("label");
          row.className = "layer-row";

          var check = document.createElement("input");
          check.className = "layer-check";
          check.type = "checkbox";
          check.checked = true;
          check.dataset.layerId = layer.id;

          var dot = document.createElement("span");
          dot.className = "layer-dot";
          dot.style.background = (LAYER_COLORS[layer.label] || LAYER_COLORS.Other).border;

          var text = document.createElement("span");
          text.textContent = layer.label;

          row.appendChild(check);
          row.appendChild(dot);
          row.appendChild(text);
          ui.layers.appendChild(row);

          check.addEventListener("change", function() {
            if (check.checked) {
              delete state.hiddenLayers[layer.id];
            } else {
              state.hiddenLayers[layer.id] = true;
            }

            clearHighlighting();
            hideDetail();
            applyVisibility();
            runLayout();
          });
        });
      }

      function getDescendants(cy, nodeId) {
        var result = [];
        var escapedNodeId = String(nodeId).replace(/"/g, "\\\"");
        var children = cy.nodes('[parent="' + escapedNodeId + '"]');
        children.forEach(function(child) {
          result.push(child);
          var sub = getDescendants(cy, child.id());
          result = result.concat(sub);
        });
        return result;
      }

      function hideLayerById(cy, layerId) {
        var layerNode = cy.getElementById(layerId);
        if (layerNode.length) {
          layerNode.style("display", "none");
        }
        var desc = getDescendants(cy, layerId);
        desc.forEach(function(d) { d.style("display", "none"); });
      }

      function applyVisibility() {
        if (!state.cy) {
          return;
        }

        var cy = state.cy;

        cy.startBatch();
        cy.nodes().style("display", "element");
        cy.edges().style("display", "element");

        if (!state.symbols) {
          cy.nodes("[type='symbol']").style("display", "none");
        }

        Object.keys(state.hiddenLayers).forEach(function(layerId) {
          if (state.hiddenLayers[layerId]) {
            hideLayerById(cy, layerId);
          }
        });

        cy.edges().forEach(function(edge) {
          var sourceVisible = edge.source().style("display") !== "none";
          var targetVisible = edge.target().style("display") !== "none";
          edge.style("display", sourceVisible && targetVisible ? "element" : "none");
        });

        cy.endBatch();
      }

      function runLayout() {
        if (!state.cy) {
          return;
        }

        var visible = state.cy.elements(":visible");
        var eles = visible.length ? visible : state.cy.elements();
        state.cy.layout(Object.assign({}, LAYOUT_OPTIONS, { eles: eles })).run();
      }

      function fitGraph() {
        if (!state.cy) {
          return;
        }

        var visible = state.cy.elements(":visible");
        if (visible.length) {
          state.cy.fit(visible, 50);
        } else {
          state.cy.fit(state.cy.elements(), 50);
        }
      }

      function zoomBy(factor) {
        if (!state.cy) {
          return;
        }

        var current = state.cy.zoom();
        var next = clamp(current * factor, state.cy.minZoom(), state.cy.maxZoom());

        state.cy.zoom({
          level: next,
          renderedPosition: {
            x: state.cy.width() / 2,
            y: state.cy.height() / 2
          }
        });
      }

      function drawStats(graph, prepared) {
        var snapshot = (graph && graph.snapshot) || {};
        var nodes = prepared.nodes || [];
        var edges = prepared.edges || [];

        var fileCount = numberOr(snapshot.total_files, countNodes(nodes, "file"));
        var symbolCount = numberOr(snapshot.total_symbols, countNodes(nodes, "symbol"));
        var edgeCount = numberOr(snapshot.total_edges, edges.length);
        var loc = numberOr(snapshot.total_loc, sumLoc(nodes));
        var language = getLanguage(snapshot, nodes);
        var analysisTime = numberOr(snapshot.analysis_duration_ms, 0);

        ui.stats.textContent =
          formatInt(fileCount) + " files | " +
          formatInt(symbolCount) + " symbols | " +
          formatInt(edgeCount) + " edges | " +
          formatInt(loc) + " LOC | " +
          language + " | " +
          formatInt(analysisTime) + "ms";
      }

      function countNodes(nodes, type) {
        var total = 0;
        nodes.forEach(function(node) {
          if (((node || {}).data || {}).type === type) {
            total += 1;
          }
        });
        return total;
      }

      function sumLoc(nodes) {
        var total = 0;
        nodes.forEach(function(node) {
          var data = (node && node.data) || {};
          if (data.type === "file") {
            total += Number(data.loc || 0);
          }
        });
        return total;
      }

      function getLanguage(snapshot, nodes) {
        if (snapshot && Array.isArray(snapshot.languages) && snapshot.languages.length) {
          return snapshot.languages.join(", ");
        }

        var languageSet = Object.create(null);
        nodes.forEach(function(node) {
          var metadata = (((node || {}).data || {}).metadata || {});
          if (metadata.language) {
            languageSet[String(metadata.language)] = true;
          }
        });

        var names = Object.keys(languageSet);
        if (!names.length) {
          return "unknown";
        }
        return names.join(", ");
      }

      function numberOr(value, fallback) {
        var n = Number(value);
        return Number.isFinite(n) ? n : fallback;
      }

      function formatInt(value) {
        return Number(value || 0).toLocaleString();
      }

      function valueOrDash(value) {
        if (value === null || value === undefined || value === "") {
          return "-";
        }
        return String(value);
      }

      function withAlpha(color, alpha) {
        var safeAlpha = clamp(Number(alpha), 0, 1);
        var hex = String(color || "").replace("#", "");
        if (hex.length !== 6) {
          return "rgba(56, 189, 248, " + safeAlpha + ")";
        }

        var r = parseInt(hex.slice(0, 2), 16);
        var g = parseInt(hex.slice(2, 4), 16);
        var b = parseInt(hex.slice(4, 6), 16);

        if (!Number.isFinite(r) || !Number.isFinite(g) || !Number.isFinite(b)) {
          return "rgba(56, 189, 248, " + safeAlpha + ")";
        }

        return "rgba(" + r + "," + g + "," + b + "," + safeAlpha + ")";
      }

      function setupLiveReload() {
        function connect() {
          try {
            var protocol = location.protocol === "https:" ? "wss://" : "ws://";
            var ws = new WebSocket(protocol + location.host);

            ws.onmessage = function(event) {
              if (event.data === "reload") {
                location.reload();
              }
            };

            ws.onclose = function() {
              setTimeout(connect, 2000);
            };

            ws.onerror = function() {
              try {
                ws.close();
              } catch (_error) {
                // ignore close errors
              }
            };
          } catch (_error) {
            setTimeout(connect, 2000);
          }
        }

        connect();
      }

      function renderInitError(error) {
        if (ui.loading) {
          ui.loading.style.display = "none";
        }

        var message = error && error.message ? error.message : String(error);
        if (ui.cy) {
          ui.cy.innerHTML = '<div class="error-message">' + esc(message) + "</div>";
        }

        console.error("Visualizer init error:", error);
      }

      function byId(id) {
        return document.getElementById(id);
      }

      function esc(value) {
        return String(value)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#39;");
      }

      function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
      }
    })();
  </script>
</body>
</html>`;
}
