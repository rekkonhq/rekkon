import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fcoseBundle = loadFcoseBundle();

function loadFcoseBundle(): string {
  const candidates = [
    join(__dirname, 'fcose-bundle.js'),
    join(__dirname, '../../../src/server/fcose-bundle.js'),
  ];

  for (const candidate of candidates) {
    if (!existsSync(candidate)) {
      continue;
    }

    const source = readFileSync(candidate, 'utf-8');
    return source.replace(/<\/script/gi, '<\\/script');
  }

  return '';
}

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
    .b{width:34px;height:34px;border-radius:8px;border:1px solid var(--line2);background:#111827;color:var(--txt);cursor:pointer;font-size:12px;font-weight:700}
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
    <div id="top"><span id="logo">rekkon</span><div id="stats">Loading graph...</div></div>
    <div id="main">
      <div id="controls">
        <button class="b" id="fit" title="Fit view">FIT</button>
        <button class="b" id="zin" title="Zoom in">+</button>
        <button class="b" id="zout" title="Zoom out">-</button>
        <button class="b" id="relayout" title="Re-layout">LAY</button>
        <button class="b" id="symbols" title="Toggle symbols">SYM</button>
        <button class="b" id="layersbtn" title="Filter layers">LYR</button>
      </div>
      <div id="layers"></div>
      <div id="cy"></div>
      <div id="loading">Loading architecture graph...</div>
      <div id="detail"></div>
    </div>
  </div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/cytoscape/3.30.4/cytoscape.min.js"></script>
  <script>${fcoseBundle}</script>
  <script>
    (function() {
      var ui = {
        stats: byId("stats"),
        loading: byId("loading"),
        main: byId("main"),
        detail: byId("detail"),
        layers: byId("layers"),
        fit: byId("fit"),
        zin: byId("zin"),
        zout: byId("zout"),
        relayout: byId("relayout"),
        symbols: byId("symbols"),
        layersbtn: byId("layersbtn"),
        cy: byId("cy")
      };

      var state = {
        cy: null,
        graph: null,
        symbols: false,
        hidden: new Set(),
        layersOpen: false,
        fcoseReady: false
      };

      if (!window.cytoscape) {
        fatal("Failed to load Cytoscape from CDN.");
        return;
      }

      state.fcoseReady = registerFcose();

      var LAYER_COLORS = {
        Core: { bg: "#1a2332", border: "#22c55e" },
        Data: { bg: "#1a1a3a", border: "#8b5cf6" },
        Hooks: { bg: "#1a2938", border: "#3b82f6" },
        Styles: { bg: "#2a1a2a", border: "#ec4899" },
        UI: { bg: "#1a2a2a", border: "#06b6d4" },
        API: { bg: "#1a1a3a", border: "#8b5cf6" },
        Pages: { bg: "#1a2a2a", border: "#06b6d4" },
        Services: { bg: "#1a2332", border: "#22c55e" },
        State: { bg: "#1a1a3a", border: "#8b5cf6" },
        Middleware: { bg: "#1a2332", border: "#22c55e" },
        Config: { bg: "#1e1e2e", border: "#64748b" },
        Types: { bg: "#1e1e2e", border: "#64748b" },
        Tests: { bg: "#1e1e2e", border: "#64748b" },
        Assets: { bg: "#1e1e2e", border: "#64748b" },
        Other: { bg: "#1e1e2e", border: "#64748b" }
      };

      var EDGE_STYLES = {
        imports: { color: "#64748b", dashed: false },
        calls: { color: "#3b82f6", dashed: false },
        exports: { color: "#22c55e", dashed: false },
        renders: { color: "#a855f7", dashed: false },
        extends: { color: "#f59e0b", dashed: true },
        implements: { color: "#f59e0b", dashed: true },
        type_depends: { color: "#6b7280", dashed: true }
      };

      var LAYOUT_OPTIONS = {
        name: "fcose",
        quality: "default",
        animate: false,
        fit: true,
        padding: 40,
        nodeDimensionsIncludeLabels: true,
        uniformNodeDimensions: false,
        packComponents: true,
        nodeRepulsion: function(node) {
          return node.isParent() ? 12000 : 4500;
        },
        idealEdgeLength: function() {
          return 80;
        },
        edgeElasticity: function() {
          return 0.45;
        },
        gravity: 0.4,
        gravityRange: 3.8,
        gravityCompound: 1.5,
        gravityOverlapCompound: 2.0,
        nestingFactor: 0.1,
        numIter: 2500,
        tile: true,
        tilingPaddingVertical: 20,
        tilingPaddingHorizontal: 20
      };

      var COSE_FALLBACK_OPTIONS = {
        name: "cose",
        animate: false,
        fit: true,
        padding: 30,
        nodeRepulsion: function() {
          return 15000;
        },
        idealEdgeLength: function() {
          return 60;
        },
        edgeElasticity: function() {
          return 0.2;
        },
        gravity: 1.2,
        numIter: 3000,
        nodeDimensionsIncludeLabels: true,
        nestPadding: 20,
        componentSpacing: 60
      };

      try {
        init();
      } catch (error) {
        renderInitError(error);
      }
      live();

      function registerFcose() {
        var plugin = window.cytoscapeFcose;
        if (!plugin) {
          return false;
        }

        try {
          window.cytoscape.use(plugin.default || plugin);
          return true;
        } catch (error) {
          console.error("Failed to register fcose plugin, falling back to cose:", error);
          return false;
        }
      }

      async function init() {
        try {
          var res = await fetch("/api/graph", { cache: "no-store" });
          if (!res.ok) {
            throw new Error("Unable to load graph file (" + res.status + ")");
          }

          state.graph = await res.json();
          drawStats(state.graph.snapshot || {});

          var prepared = prepareElements(state.graph);
          mount(prepared.nodes, prepared.edges);
          buildLayers();
          wireControls();
          wireGraph();
          applyVisibility();
          layout();

          if (ui.loading) {
            ui.loading.style.display = "none";
          }
        } catch (error) {
          renderInitError(error);
        }
      }

      function mount(nodes, edges) {
        state.cy = cytoscape({
          container: ui.cy,
          elements: nodes.concat(edges),
          style: styleSheet(),
          minZoom: 0.04,
          maxZoom: 5,
          wheelSensitivity: 0.14
        });
      }

      function prepareElements(graph) {
        var rawNodes = (((graph || {}).elements || {}).nodes || []);
        var rawEdges = (((graph || {}).elements || {}).edges || []);

        var nodeDataById = {};
        rawNodes.forEach(function(node) {
          if (node && node.data && node.data.id) {
            nodeDataById[node.data.id] = node.data;
          }
        });

        var layerCache = {};
        var nodes = rawNodes.map(function(node) {
          var nextNode = Object.assign({}, node);
          var data = Object.assign({}, (node && node.data) || {});
          var layerName = resolveLayerName(data.id, nodeDataById, layerCache);
          var palette = LAYER_COLORS[layerName] || LAYER_COLORS.Other;
          data.bgColor = data.bgColor || palette.bg;
          data.borderColor = data.borderColor || palette.border;
          data.layerName = data.layerName || layerName;
          nextNode.data = data;
          return nextNode;
        });

        var edges = rawEdges.map(function(edge) {
          var nextEdge = Object.assign({}, edge);
          var data = Object.assign({}, (edge && edge.data) || {});
          var style = EDGE_STYLES[data.type] || EDGE_STYLES.imports;
          var weight = Number(data.weight || 1);
          data.edgeColor = data.edgeColor || style.color;
          data.edgeStyle = data.edgeStyle || (style.dashed ? "dashed" : "solid");
          data.edgeWidth = data.edgeWidth || Math.max(1, Math.min(4, 1 + weight * 0.45));
          nextEdge.data = data;
          return nextEdge;
        });

        return { nodes: nodes, edges: edges };
      }

      function resolveLayerName(nodeId, map, cache) {
        if (!nodeId) {
          return "Other";
        }
        if (cache[nodeId]) {
          return cache[nodeId];
        }

        var current = map[nodeId];
        var hops = 0;
        while (current && hops < 16) {
          if (current.type === "layer") {
            var label = current.label || "Other";
            cache[nodeId] = label;
            return label;
          }
          var parentId = current.parent || current.parent_id;
          if (!parentId) {
            break;
          }
          current = map[parentId];
          hops += 1;
        }

        cache[nodeId] = "Other";
        return "Other";
      }

      function styleSheet() {
        return [
          {
            selector: "node",
            style: {
              label: "data(label)",
              "font-family": "\\"IBM Plex Sans\\",\\"Segoe UI\\",sans-serif",
              "font-size": "10px",
              color: "#e2e8f0",
              "text-outline-color": "#0a0e1a",
              "text-outline-width": 1,
              "background-color": "data(bgColor)",
              "border-color": "data(borderColor)",
              "border-width": 1,
              shape: "ellipse"
            }
          },
          {
            selector: "node[type='layer']",
            style: {
              "background-color": "data(bgColor)",
              "border-color": "data(borderColor)",
              "border-width": 2,
              shape: "roundrectangle",
              label: "data(label)",
              "font-size": "16px",
              "font-weight": "bold",
              color: "#e2e8f0",
              "text-valign": "top",
              "text-halign": "center",
              "text-margin-y": -8,
              padding: "30px",
              "min-width": "120px",
              "min-height": "80px",
              "text-outline-color": "#0a0e1a",
              "text-outline-width": 2
            }
          },
          {
            selector: "node[type='module']",
            style: {
              "background-color": "data(bgColor)",
              "background-opacity": 0.6,
              "border-color": "data(borderColor)",
              "border-width": 1.5,
              shape: "roundrectangle",
              label: "data(label)",
              "font-size": "12px",
              color: "#cbd5e1",
              "text-valign": "top",
              "text-halign": "center",
              "text-margin-y": -6,
              padding: "20px",
              "min-width": "80px",
              "min-height": "50px",
              "text-outline-color": "#0a0e1a",
              "text-outline-width": 1.5
            }
          },
          {
            selector: "node[type='file']",
            style: {
              "background-color": "data(bgColor)",
              "border-color": "data(borderColor)",
              "border-width": 1,
              width: 30,
              height: 30,
              shape: "roundrectangle",
              label: "data(label)",
              "font-size": "9px",
              color: "#94a3b8",
              "text-valign": "bottom",
              "text-halign": "center",
              "text-margin-y": 5,
              "text-outline-color": "#0a0e1a",
              "text-outline-width": 1,
              "text-max-width": "80px",
              "text-wrap": "ellipsis"
            }
          },
          {
            selector: "node[type='symbol']",
            style: {
              width: 14,
              height: 14,
              "background-color": "data(bgColor)",
              "border-width": 0,
              label: "data(label)",
              "font-size": "7px",
              color: "#64748b",
              "text-valign": "bottom",
              "text-margin-y": 3,
              display: "none"
            }
          },
          {
            selector: "edge",
            style: {
              width: "data(edgeWidth)",
              "line-color": "data(edgeColor)",
              "target-arrow-color": "data(edgeColor)",
              "line-style": "data(edgeStyle)",
              "target-arrow-shape": "triangle",
              "curve-style": "bezier",
              "arrow-scale": 0.8,
              opacity: 0.65
            }
          },
          {
            selector: "node:selected",
            style: {
              "border-width": 3,
              "border-color": "#38bdf8",
              "background-opacity": 0.32,
              "overlay-color": "#38bdf8",
              "overlay-opacity": 0.1
            }
          },
          {
            selector: "node.highlighted",
            style: {
              "border-width": 2,
              "border-color": "#fbbf24",
              "background-opacity": 0.26
            }
          },
          {
            selector: "node.dimmed",
            style: {
              opacity: 0.2
            }
          },
          {
            selector: "edge.dimmed",
            style: {
              opacity: 0.06
            }
          },
          {
            selector: "edge.highlighted",
            style: {
              opacity: 1,
              width: 2.5
            }
          },
          {
            selector: ":parent",
            style: {
              "background-clip": "none"
            }
          }
        ];
      }

      function layout() {
        if (!state.cy) {
          return;
        }

        var visible = state.cy.elements(":visible");
        var target = visible.length ? visible : state.cy.elements();
        var options = state.fcoseReady ? LAYOUT_OPTIONS : COSE_FALLBACK_OPTIONS;
        state.cy.layout(Object.assign({}, options, { eles: target })).run();
      }

      function wireGraph() {
        var cy = state.cy;

        cy.on("tap", "node", function(event) {
          var node = event.target;
          var neighborhood = node.closedNeighborhood();
          var visibleNodes = neighborhood.nodes().union(node);
          var visibleEdges = neighborhood.edges();

          cy.startBatch();
          cy.elements().removeClass("highlighted").removeClass("dimmed").addClass("dimmed");
          visibleNodes.removeClass("dimmed").addClass("highlighted");
          visibleEdges.removeClass("dimmed").addClass("highlighted");

          var parent = node.parent();
          while (parent && parent.length > 0) {
            parent.removeClass("dimmed");
            parent = parent.parent();
          }

          node.select();
          cy.endBatch();
          showDetail(node);
        });

        cy.on("tap", function(event) {
          if (event.target !== cy) {
            return;
          }
          clearFocus();
          hideDetail();
        });
      }

      function clearFocus() {
        if (!state.cy) {
          return;
        }
        state.cy.elements().removeClass("highlighted").removeClass("dimmed");
        state.cy.$(":selected").unselect();
      }

      function showDetail(node) {
        var data = node.data() || {};
        var parts = [];
        parts.push('<button class="x" id="close">x</button>');
        parts.push('<div class="t">' + esc(data.label || node.id()) + "</div>");
        parts.push('<div class="s">' + esc((data.subtype || data.type || "unknown") + (data.file_path ? " | " + data.file_path : "")) + "</div>");
        parts.push('<div class="st">Metrics</div>');

        metric(parts, "Type", String(data.type || "unknown"));
        if (data.loc != null) {
          metric(parts, "LOC", String(data.loc));
        }
        if (data.complexity != null) {
          metric(parts, "Complexity", String(data.complexity));
        }
        if (data.export_count != null) {
          metric(parts, "Exports", String(data.export_count));
        }
        if (data.import_count != null) {
          metric(parts, "Imports", String(data.import_count));
        }

        var outgoing = node.outgoers("edge");
        var incoming = node.incomers("edge");
        if (outgoing.length || incoming.length) {
          parts.push('<div class="st">Connections</div>');
          outgoing.forEach(function(edge) {
            parts.push('<div class="c">-> ' + esc(String(edge.data("type") || "edge")) + " " + esc(String(edge.target().data("label") || edge.target().id())) + "</div>");
          });
          incoming.forEach(function(edge) {
            parts.push('<div class="c"><- ' + esc(String(edge.data("type") || "edge")) + " " + esc(String(edge.source().data("label") || edge.source().id())) + "</div>");
          });
        }

        if (data.metadata && typeof data.metadata === "object" && Object.keys(data.metadata).length) {
          parts.push('<div class="st">Metadata</div>');
          Object.keys(data.metadata).forEach(function(key) {
            metric(parts, key, val(data.metadata[key]));
          });
        }

        ui.detail.innerHTML = parts.join("");
        ui.detail.classList.add("show");
        byId("close").addEventListener("click", function() {
          clearFocus();
          hideDetail();
        });
      }

      function metric(parts, key, value) {
        parts.push('<div class="row"><span class="k">' + esc(key) + '</span><span class="val">' + esc(value) + "</span></div>");
      }

      function hideDetail() {
        ui.detail.classList.remove("show");
      }

      function buildLayers() {
        ui.layers.innerHTML = '<div class="lt">Layers</div>';
        var list = getLayerList();
        if (!list.length) {
          ui.layers.innerHTML += '<div class="lr">No layer nodes found</div>';
          return;
        }

        list.forEach(function(layer) {
          var color = (LAYER_COLORS[layer.label] || LAYER_COLORS.Other).border;
          var row = document.createElement("label");
          row.className = "lr";

          var checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.checked = true;
          checkbox.dataset.layerId = layer.id;

          var dot = document.createElement("span");
          dot.className = "dot";
          dot.style.backgroundColor = color;

          var text = document.createElement("span");
          text.textContent = layer.label;

          row.appendChild(checkbox);
          row.appendChild(dot);
          row.appendChild(text);
          ui.layers.appendChild(row);

          checkbox.addEventListener("change", function() {
            if (checkbox.checked) {
              state.hidden.delete(layer.id);
            } else {
              state.hidden.add(layer.id);
            }
            clearFocus();
            hideDetail();
            applyVisibility();
            layout();
          });
        });
      }

      function getLayerList() {
        var graph = state.graph || {};
        var fromSnapshot = ((graph.snapshot || {}).layer_summary || []).map(function(layer) {
          return { id: String(layer.id), label: String(layer.label) };
        });

        if (fromSnapshot.length) {
          return fromSnapshot.sort(function(a, b) {
            return a.label.localeCompare(b.label);
          });
        }

        var nodes = ((graph.elements || {}).nodes || []);
        return nodes
          .filter(function(node) {
            return node && node.data && node.data.type === "layer";
          })
          .map(function(node) {
            return { id: String(node.data.id), label: String(node.data.label) };
          })
          .sort(function(a, b) {
            return a.label.localeCompare(b.label);
          });
      }

      function applyVisibility() {
        var cy = state.cy;
        if (!cy) {
          return;
        }

        cy.startBatch();
        cy.nodes().style("display", "element");
        cy.edges().style("display", "element");

        if (!state.symbols) {
          cy.nodes("[type='symbol']").style("display", "none");
        }

        state.hidden.forEach(function(layerId) {
          var layerNode = cy.getElementById(layerId);
          if (layerNode && layerNode.length) {
            layerNode.union(layerNode.descendants()).style("display", "none");
          }
        });

        cy.edges().forEach(function(edge) {
          var sourceVisible = edge.source().style("display") !== "none";
          var targetVisible = edge.target().style("display") !== "none";
          edge.style("display", sourceVisible && targetVisible ? "element" : "none");
        });
        cy.endBatch();
      }

      function wireControls() {
        ui.fit.addEventListener("click", function() {
          var visible = state.cy.elements(":visible");
          if (visible.length) {
            state.cy.fit(visible, 40);
          } else {
            state.cy.fit(undefined, 40);
          }
        });

        ui.zin.addEventListener("click", function() {
          zoom(1.3);
        });

        ui.zout.addEventListener("click", function() {
          zoom(1 / 1.3);
        });

        ui.relayout.addEventListener("click", function() {
          clearFocus();
          hideDetail();
          layout();
        });

        ui.symbols.addEventListener("click", function() {
          state.symbols = !state.symbols;
          ui.symbols.classList.toggle("on", state.symbols);
          clearFocus();
          hideDetail();
          applyVisibility();
          layout();
        });

        ui.layersbtn.addEventListener("click", function() {
          state.layersOpen = !state.layersOpen;
          ui.layersbtn.classList.toggle("on", state.layersOpen);
          ui.layers.classList.toggle("open", state.layersOpen);
        });
      }

      function zoom(factor) {
        if (!state.cy) {
          return;
        }
        var level = clamp(state.cy.zoom() * factor, state.cy.minZoom(), state.cy.maxZoom());
        state.cy.zoom({
          level: level,
          renderedPosition: { x: state.cy.width() / 2, y: state.cy.height() / 2 }
        });
      }

      function drawStats(snapshot) {
        var languages = Array.isArray(snapshot.languages) && snapshot.languages.length ? snapshot.languages.join(", ") : "unknown";
        var ms = snapshot.analysis_duration_ms == null ? "?" : String(snapshot.analysis_duration_ms);
        ui.stats.innerHTML =
          '<span class="v">' + num(snapshot.total_files) + "</span> files | " +
          '<span class="v">' + num(snapshot.total_symbols) + "</span> symbols | " +
          '<span class="v">' + num(snapshot.total_edges) + "</span> edges | " +
          '<span class="v">' + num(snapshot.total_loc) + "</span> LOC | " +
          esc(languages) + " | " +
          '<span class="v">' + esc(ms) + "</span>ms";
      }

      function live() {
        try {
          var protocol = location.protocol === "https:" ? "wss:" : "ws:";
          var ws = new WebSocket(protocol + "//" + location.host);
          ws.onmessage = function(event) {
            if (event.data === "reload") {
              location.reload();
            }
          };
          ws.onerror = function() {
            try {
              ws.close();
            } catch (_) {
              // No-op.
            }
          };
          ws.onclose = function() {
            setTimeout(live, 2000);
          };
        } catch (_) {
          setTimeout(live, 2000);
        }
      }

      function renderInitError(error) {
        if (ui.loading) {
          ui.loading.style.display = "none";
        }

        var graphEl = byId("cy");
        var message = error && error.message ? error.message : String(error);
        if (graphEl) {
          graphEl.innerHTML =
            '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#f87171;font-size:14px;padding:20px;text-align:center;">' +
            "Failed to load graph: " +
            esc(message) +
            "</div>";
        } else {
          fatal("Failed to load graph: " + message);
        }
        console.error("Rekkon visualizer error:", error);
      }

      function fatal(message) {
        var loading = ui && ui.loading ? ui.loading : byId("loading");
        if (loading) {
          loading.style.display = "none";
        }

        var main = ui && ui.main ? ui.main : byId("main");
        if (!main) {
          console.error(message);
          return;
        }

        var node = document.createElement("div");
        node.className = "e";
        node.textContent = message;
        main.appendChild(node);
      }

      function val(value) {
        if (value == null) {
          return "";
        }
        if (typeof value === "string") {
          return value;
        }
        try {
          return JSON.stringify(value);
        } catch (_) {
          return String(value);
        }
      }

      function num(value) {
        var parsed = Number(value);
        return isFinite(parsed) ? parsed.toLocaleString() : "0";
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
