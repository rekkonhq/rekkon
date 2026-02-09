export function getHtmlTemplate(): string {
  return `<!DOCTYPE html>
<html lang="en" data-view="Constellation">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Rekkon</title>
  <style>
    :root{--bg0:#030712;--bg1:#0a0f1a;--panel:rgba(3,8,20,.88);--line:rgba(148,163,184,.2);--txt:#dbeafe;--muted:#94a3b8}
    *{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#020408;color:var(--txt);font-family:"IBM Plex Sans","Segoe UI",system-ui,sans-serif}
    #constellation{position:fixed;inset:0;width:100vw;height:100vh;display:block;cursor:grab;touch-action:none}
    #constellation.dragging{cursor:grabbing}
    #stats{position:fixed;left:0;right:0;top:0;z-index:20;min-height:46px;padding:8px 12px;background:linear-gradient(to bottom,rgba(2,4,8,.85),rgba(2,4,8,.3),transparent);border-bottom:none;display:flex;align-items:center;justify-content:space-between;gap:10px;pointer-events:none}
    #stats-main{font:12px/1.3 "IBM Plex Mono","Cascadia Code",ui-monospace,monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    #stats-layers{display:flex;flex-wrap:wrap;gap:9px;font:11px/1.2 "IBM Plex Mono","Cascadia Code",ui-monospace,monospace;color:var(--muted)}
    .chip{display:inline-flex;align-items:center;gap:5px}.dot{width:8px;height:8px;border-radius:999px;box-shadow:0 0 6px rgba(255,255,255,.24)}
    #controls{position:fixed;right:12px;top:56px;z-index:24;width:min(300px,calc(100vw - 24px));max-height:calc(100vh - 70px);overflow:auto;background:var(--panel);border:1px solid rgba(100,130,180,.12);border-radius:12px;padding:10px;backdrop-filter:blur(8px)}
    .btns{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-bottom:10px}
    .btn{height:34px;border-radius:8px;border:1px solid rgba(148,163,184,.3);background:rgba(15,23,42,.92);color:var(--txt);cursor:pointer;font-size:12px}
    .btn:hover{border-color:rgba(96,165,250,.7);background:rgba(30,41,59,.95)}.btn.active{border-color:rgba(96,165,250,.85);background:rgba(59,130,246,.32)}
    .title{font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:rgba(148,163,184,.7);font-weight:700;margin:4px 0 8px}
    #layers{display:flex;flex-direction:column;gap:5px}.layer{display:flex;align-items:center;gap:8px;color:var(--muted);font-size:12px;user-select:none}
    .layer input{margin:0;width:14px;height:14px;accent-color:#60a5fa}
    #detail {
      position: fixed;
      right: 0;
      top: 0;
      height: 100vh;
      width: min(340px, 92vw);
      z-index: 30;
      transform: translateX(100%);
      transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);
      background: linear-gradient(195deg, rgba(8, 14, 28, 0.97), rgba(3, 7, 18, 0.99));
      border-left: 1px solid rgba(100, 130, 180, 0.12);
      overflow: auto;
      backdrop-filter: blur(16px);
    }
    #detail.open { transform: translateX(0); }

    #detail-close {
      position: absolute;
      top: 12px;
      right: 12px;
      height: 30px;
      width: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(100, 130, 180, 0.2);
      border-radius: 8px;
      background: rgba(10, 18, 35, 0.8);
      color: rgba(148, 175, 220, 0.6);
      cursor: pointer;
      font-size: 14px;
      transition: all 0.15s ease;
    }
    #detail-close:hover {
      border-color: rgba(100, 130, 180, 0.4);
      color: rgba(200, 215, 240, 0.9);
      background: rgba(15, 25, 45, 0.9);
    }

    #detail-body { padding: 16px 16px 24px; }
    .empty{color:var(--muted);font-size:12px;font-style:italic}

    .d-header {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding-bottom: 14px;
      border-bottom: 1px solid rgba(100, 130, 180, 0.1);
      margin-bottom: 14px;
    }

    .d-star-icon {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      flex-shrink: 0;
      margin-top: 2px;
      position: relative;
    }
    .d-star-icon::after {
      content: '';
      position: absolute;
      inset: -4px;
      border-radius: 50%;
      opacity: 0.3;
    }

    .d-title {
      font-size: 17px;
      font-weight: 600;
      line-height: 1.25;
      margin: 0;
      word-break: break-word;
      color: #e8eef8;
      letter-spacing: -0.01em;
    }

    .d-path {
      color: rgba(148, 175, 220, 0.5);
      font-size: 11px;
      line-height: 1.4;
      word-break: break-all;
      margin: 3px 0 0;
      font-family: "IBM Plex Mono", "Cascadia Code", ui-monospace, monospace;
    }

    .d-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      margin-top: 6px;
    }

    .d-metrics {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-top: 14px;
    }

    .d-metric {
      padding: 10px;
      border-radius: 8px;
      background: rgba(10, 18, 35, 0.6);
      border: 1px solid rgba(100, 130, 180, 0.08);
    }

    .d-metric-val {
      font-size: 20px;
      font-weight: 700;
      line-height: 1.1;
      color: #e8eef8;
      font-family: "IBM Plex Mono", "Cascadia Code", ui-monospace, monospace;
    }

    .d-metric-label {
      font-size: 9px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: rgba(148, 175, 220, 0.45);
      font-weight: 600;
      margin-top: 3px;
    }

    .d-divider {
      height: 1px;
      background: linear-gradient(to right, transparent, rgba(100, 130, 180, 0.15), transparent);
      margin: 16px 0;
    }

    .d-sec-title {
      font-size: 10px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: rgba(148, 175, 220, 0.5);
      font-weight: 700;
      margin-bottom: 8px;
    }

    .d-conn-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
      max-height: 200px;
      overflow: auto;
    }

    .d-conn-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 7px 10px;
      border-radius: 6px;
      background: rgba(10, 18, 35, 0.5);
      border: 1px solid rgba(100, 130, 180, 0.06);
      color: rgba(200, 215, 240, 0.85);
      font-size: 12px;
      font-family: "IBM Plex Mono", "Cascadia Code", ui-monospace, monospace;
      transition: border-color 0.12s ease, background 0.12s ease;
      cursor: default;
    }
    .d-conn-item:hover {
      border-color: rgba(100, 130, 180, 0.2);
      background: rgba(15, 25, 45, 0.6);
    }

    .d-conn-dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .d-empty {
      color: rgba(148, 175, 220, 0.3);
      font-size: 12px;
      font-style: italic;
      padding: 4px 0;
    }

    .d-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      min-height: 200px;
      color: rgba(148, 175, 220, 0.25);
      font-size: 12px;
      gap: 8px;
      text-align: center;
      padding: 40px 20px;
    }

    .d-placeholder-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 1px dashed rgba(100, 130, 180, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      opacity: 0.4;
    }
    #tooltip{position:fixed;z-index:33;pointer-events:none;max-width:280px;background:rgba(5,8,16,.92);border:1px solid rgba(100,130,180,.2);border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,.6),0 0 12px rgba(60,90,140,.08);padding:8px 10px;color:#dbeafe;font-size:12px;line-height:1.3;opacity:0;transform:translateY(4px);transition:opacity .12s ease,transform .12s ease;backdrop-filter:blur(8px)}
    #tooltip.open{opacity:1;transform:translateY(0)}
    #loading{position:fixed;inset:0;z-index:40;display:flex;align-items:center;justify-content:center;color:rgba(180,200,230,.8);font-size:13px;letter-spacing:.15em;text-transform:uppercase;background:radial-gradient(ellipse at center,rgba(5,10,25,.8),rgba(2,4,8,.95));font-family:"IBM Plex Sans","Segoe UI",system-ui,sans-serif;font-weight:300}
    @media (max-width:860px){#stats-layers{display:none}#controls{right:8px;top:54px;width:min(260px,calc(100vw - 16px))}#detail{width:100vw}}
  </style>
</head>
<body>
  <canvas id="constellation"></canvas>
  <div id="stats"><div id="stats-main">Loading graph...</div><div id="stats-layers"></div></div>
  <div id="controls">
    <div class="btns">
      <button id="fit" class="btn" type="button">Fit</button>
      <button id="zin" class="btn" type="button">+</button>
      <button id="zout" class="btn" type="button">-</button>
      <button id="edges" class="btn active" type="button">Edges</button>
    </div>
    <div class="title">Layer Filter</div>
    <div id="layers"></div>
  </div>
  <aside id="detail" aria-hidden="true">
    <button id="detail-close" type="button" title="Close panel">x</button>
    <div id="detail-body"><div class="d-placeholder"><div class="d-placeholder-icon">&#10022;</div>Click a star to inspect</div></div>
  </aside>
  <div id="tooltip"></div>
  <div id="loading">Mapping the sky...</div>
  <script>
    (function(){
      var LAYERS={
        API:{star:"#e5a84b",glow:"#e5a84b",neb:"rgba(229,168,75,0.05)"},
        UI:{star:"#5bb8d4",glow:"#5bb8d4",neb:"rgba(91,184,212,0.05)"},
        Pages:{star:"#9b7bd4",glow:"#9b7bd4",neb:"rgba(155,123,212,0.05)"},
        Core:{star:"#5ec46e",glow:"#5ec46e",neb:"rgba(94,196,110,0.05)"},
        Data:{star:"#6196d4",glow:"#6196d4",neb:"rgba(97,150,212,0.05)"},
        Hooks:{star:"#d478a8",glow:"#d478a8",neb:"rgba(212,120,168,0.05)"},
        Lib:{star:"#4db8a6",glow:"#4db8a6",neb:"rgba(77,184,166,0.05)"},
        Config:{star:"#d49355",glow:"#d49355",neb:"rgba(212,147,85,0.05)"},
        Types:{star:"#a48bd4",glow:"#a48bd4",neb:"rgba(164,139,212,0.05)"},
        Services:{star:"#d4c455",glow:"#d4c455",neb:"rgba(212,196,85,0.05)"},
        Tests:{star:"#7a8899",glow:"#7a8899",neb:"rgba(122,136,153,0.05)"},
        Other:{star:"#8a9bb0",glow:"#8a9bb0",neb:"rgba(138,155,176,0.05)"},
        State:{star:"#55c4d4",glow:"#55c4d4",neb:"rgba(85,196,212,0.05)"},
        Styles:{star:"#d48ca0",glow:"#d48ca0",neb:"rgba(212,140,160,0.05)"},
        Assets:{star:"#60aed4",glow:"#60aed4",neb:"rgba(96,174,212,0.05)"},
        Middleware:{star:"#d47a84",glow:"#d47a84",neb:"rgba(212,122,132,0.05)"}
      };
      var GOLDEN=Math.PI*2*(1-1/1.61803398875),MIN=0.3,MAX=5;
      var ui={
        c:id("constellation"),sm:id("stats-main"),sl:id("stats-layers"),layers:id("layers"),fit:id("fit"),zin:id("zin"),zout:id("zout"),edges:id("edges"),
        detail:id("detail"),dclose:id("detail-close"),dbody:id("detail-body"),tip:id("tooltip"),load:id("loading")
      };
      if(!ui.c)return;
      var ctx=ui.c.getContext("2d");if(!ctx)return;
      var s={
        files:[],edges:[],mods:[],byId:Object.create(null),counts:Object.create(null),visible:Object.create(null),
        stats:{files:0,symbols:0,edges:0,loc:0},edgesOn:true,hover:null,sel:null,dust:[],noiseCache:null,maxLoc:1,
        v:{scale:1,ox:0,oy:0},p:{down:false,drag:false,dx:0,dy:0,lx:0,ly:0},queued:false
      };
      bind();
      setInterval(function(){drawReq();},80);
      resize();setLoading(true,"Loading graph...");fetchGraph();live();

      function bind(){
        window.addEventListener("resize",function(){resize();drawReq();});
        ui.c.addEventListener("mousedown",down);window.addEventListener("mousemove",move);window.addEventListener("mouseup",up);
        ui.c.addEventListener("mouseleave",function(){if(!s.p.down){s.hover=null;tipHide();drawReq();}});
        ui.c.addEventListener("wheel",wheel,{passive:false});
        ui.fit.addEventListener("click",function(){fit();drawReq();});
        ui.zin.addEventListener("click",function(){zoom(ui.c.clientWidth/2,ui.c.clientHeight/2,1.2);});
        ui.zout.addEventListener("click",function(){zoom(ui.c.clientWidth/2,ui.c.clientHeight/2,1/1.2);});
        ui.edges.addEventListener("click",function(){s.edgesOn=!s.edgesOn;ui.edges.classList.toggle("active",s.edgesOn);drawReq();});
        ui.dclose.addEventListener("click",function(){s.sel=null;detailClose();drawReq();});
      }

      async function fetchGraph(){
        setLoading(true,"Loading graph...");
        try{
          var r=await fetch("/api/graph",{cache:"no-store"});if(!r.ok)throw new Error("Graph request failed ("+r.status+")");
          var g=await r.json();process(g);layersUI();statsUI();s.sel=null;detailClose();fit();drawReq();setLoading(false,"");
        }catch(e){setLoading(true,"Failed to load graph: "+(e&&e.message?e.message:String(e)));console.error(e);}
      }

      function process(g){
        var ns=(((g||{}).elements||{}).nodes||[]),es=(((g||{}).elements||{}).edges||[]);
        var nodeById=Object.create(null),cache=Object.create(null),modsById=Object.create(null),byId=Object.create(null);
        for(var i=0;i<ns.length;i++){var n=(ns[i]&&ns[i].data)||{};if(n.id)nodeById[n.id]=n;}
        for(var j=0;j<ns.length;j++){
          var m=(ns[j]&&ns[j].data)||{};if(m.type!=="module"||!m.id)continue;
          modsById[m.id]={id:m.id,label:String(m.label||m.file_path||m.id),layer:layerOf(m.id,nodeById,cache),files:[],x:0,y:0,r:30,ex:30,ey:30,w:0};
        }
        for(var k=0;k<ns.length;k++){
          var f=(ns[k]&&ns[k].data)||{};if(f.type!=="file"||!f.id)continue;
          var mid=parentId(f)||"module:orphan";
          if(!modsById[mid])modsById[mid]={id:mid,label:mid==="module:orphan"?"orphan-files":String(mid),layer:layerOf(f.id,nodeById,cache),files:[],x:0,y:0,r:30,ex:30,ey:30,w:0};
          var file={id:f.id,label:String(f.label||f.id),path:String(f.file_path||f.label||f.id),mid:mid,ml:modsById[mid].label,layer:layerOf(f.id,nodeById,cache),loc:num(f.loc,0),cx:num(f.complexity,0),ec:num(f.export_count,0),exp:Boolean(f.is_exported)||num(f.export_count,0)>0,im:[],dep:[],x:0,y:0};
          file.layer=classifyLayer(file.path);
          var jitterSeed=0;
          var idStr=String(f.id||"");
          for(var ci=0;ci<idStr.length;ci++)jitterSeed=((jitterSeed<<5)-jitterSeed+idStr.charCodeAt(ci))|0;
          file.jitter=((jitterSeed&0xFFFF)/32768)-1;
          modsById[mid].files.push(file);byId[file.id]=file;
        }
        var mods=Object.keys(modsById).map(function(x){return modsById[x];}).filter(function(m){return m.files.length>0;});
        var edges=[];
        for(var q=0;q<es.length;q++){
          var e=(es[q]&&es[q].data)||{};if(e.type!=="imports")continue;
          var sf=byId[e.source],tf=byId[e.target];if(!sf||!tf||sf.id===tf.id)continue;
          sf.im.push(tf.id);tf.dep.push(sf.id);edges.push({id:String(e.id||sf.id+"->"+tf.id),s:sf.id,t:tf.id,w:num(e.weight,1)});
          if(sf.mid!==tf.mid){modsById[sf.mid].w+=num(e.weight,1);modsById[tf.mid].w+=num(e.weight,1);}
        }
        for(var a=0;a<mods.length;a++){
          var vote=Object.create(null),md=mods[a];
          for(var b=0;b<md.files.length;b++){var ln=md.files[b].layer||"Other";vote[ln]=(vote[ln]||0)+1;}
          var rank=Object.keys(vote).sort(function(x,y){var d=vote[y]-vote[x];return d!==0?d:x.localeCompare(y);});
          if(rank.length)md.layer=rank[0];
        }
        mods.sort(function(x,y){if(y.w!==x.w)return y.w-x.w;if(y.files.length!==x.files.length)return y.files.length-x.files.length;return x.label.localeCompare(y.label);});
        layout(mods);
        var files=Object.keys(byId).map(function(x){return byId[x];}),counts=Object.create(null);
        s.maxLoc=1;
        for(var z=0;z<files.length;z++)if(files[z].loc>s.maxLoc)s.maxLoc=files[z].loc;
        for(var c=0;c<files.length;c++){var ln=files[c].layer||"Other";counts[ln]=(counts[ln]||0)+1;if(s.visible[ln]===undefined)s.visible[ln]=true;}
        var snap=(g||{}).snapshot||{};
        s.stats={files:num(snap.total_files,files.length),symbols:num(snap.total_symbols,countType(ns,"symbol")),edges:num(snap.total_edges,es.length),loc:num(snap.total_loc,files.reduce(function(t,f){return t+num(f.loc,0);},0))};
        s.files=files;s.edges=edges;s.mods=mods;s.byId=byId;s.counts=counts;s.hover=null;tipHide();
      }

      function layout(mods){
        var n=mods.length;if(!n)return;var base=Math.max(100,Math.sqrt(n)*55);
        for(var i=0;i<n;i++){
          var m=mods[i],ang=i*GOLDEN,rr=base*Math.sqrt((i+0.5)/n);
          m.x=Math.cos(ang)*rr;m.y=Math.sin(ang)*rr;m.r=15+Math.sqrt(m.files.length)*12;
          var minFx=Infinity,maxFx=-Infinity,minFy=Infinity,maxFy=-Infinity;
          for(var j=0;j<m.files.length;j++){
            var f=m.files[j],fa=j*GOLDEN,fr=m.r*Math.sqrt((j+0.5)/m.files.length)*0.75;
            f.x=m.x+Math.cos(fa)*fr;f.y=m.y+Math.sin(fa)*fr;f.ml=m.label;
            if(f.x<minFx)minFx=f.x;if(f.x>maxFx)maxFx=f.x;if(f.y<minFy)minFy=f.y;if(f.y>maxFy)maxFy=f.y;
          }
          if(m.files.length>1){m.ex=(maxFx-minFx)/2+25;m.ey=(maxFy-minFy)/2+25;}
          else{m.ex=m.r;m.ey=m.r;}
          m.ex=Math.max(m.ex,20);
          m.ey=Math.max(m.ey,20);
        }
      }

      function countType(ns,t){var c=0;for(var i=0;i<ns.length;i++){var d=(ns[i]&&ns[i].data)||{};if(d.type===t)c++;}return c;}

      function layersUI(){
        ui.layers.innerHTML="";
        var names=Object.keys(s.counts).sort(function(a,b){return a.localeCompare(b);});
        if(!names.length){var e=document.createElement("div");e.className="empty";e.textContent="No layers found.";ui.layers.appendChild(e);return;}
        for(var i=0;i<names.length;i++){
          var name=names[i];if(s.visible[name]===undefined)s.visible[name]=true;
          var row=document.createElement("label");row.className="layer";
          var cb=document.createElement("input");cb.type="checkbox";cb.checked=Boolean(s.visible[name]);cb.dataset.layer=name;
          var dot=document.createElement("span");dot.className="dot";dot.style.backgroundColor=palette(name).star;
          var txt=document.createElement("span");txt.textContent=name+" ("+s.counts[name]+")";
          row.appendChild(cb);row.appendChild(dot);row.appendChild(txt);ui.layers.appendChild(row);
          cb.addEventListener("change",function(ev){
            var t=ev.target;if(!t||!t.dataset)return;var ln=t.dataset.layer;s.visible[ln]=Boolean(t.checked);
            if(s.sel&&!layerOn(s.byId[s.sel].layer)){s.sel=null;detailClose();}if(s.hover&&!layerOn(s.byId[s.hover].layer)){s.hover=null;tipHide();}drawReq();
          });
        }
      }

      function statsUI(){
        ui.sm.textContent=fmt(s.stats.files)+" files | "+fmt(s.stats.symbols)+" symbols | "+fmt(s.stats.edges)+" edges | "+fmt(s.stats.loc)+" LOC";
        ui.sl.innerHTML="";
        var names=Object.keys(s.counts).sort(function(a,b){return s.counts[b]-s.counts[a];});
        for(var i=0;i<names.length;i++){
          var n=names[i],chip=document.createElement("span"),dot=document.createElement("span"),lab=document.createElement("span");
          chip.className="chip";dot.className="dot";dot.style.backgroundColor=palette(n).star;lab.textContent=n+": "+s.counts[n];chip.appendChild(dot);chip.appendChild(lab);ui.sl.appendChild(chip);
        }
      }

      function resize(){
        var dpr=window.devicePixelRatio||1,w=Math.max(1,window.innerWidth),h=Math.max(1,window.innerHeight);
        ui.c.width=Math.floor(w*dpr);ui.c.height=Math.floor(h*dpr);ui.c.style.width=w+"px";ui.c.style.height=h+"px";
        if(ctx.setTransform)ctx.setTransform(dpr,0,0,dpr,0,0);else ctx.scale(dpr,dpr);dust(w,h);
      }

      function dust(w,h){
        var count=Math.max(1500,Math.floor((w*h)/800));
        s.dust=[];var seed=173;
        function rng(){seed=(seed*9301+49297)%233280;return seed/233280;}
        for(var i=0;i<count;i++){
          var rx=rng(),ry=rng();
          if(rng()<0.3){
            rx=(rng()+rng()+rng())/3;
            ry=0.3+((rng()+rng())/2)*0.4;
          }
          var ra=rng(),rs=rng(),rc=rng(),brightness,size,temp,twinkle,twinklePhase;
          if(rs<0.40)brightness=0.012+ra*0.025;
          else if(rs<0.70)brightness=0.035+ra*0.05;
          else if(rs<0.90)brightness=0.08+ra*0.1;
          else if(rs<0.97)brightness=0.16+ra*0.15;
          else brightness=0.25+ra*0.25;
          if(rs<0.70)size=1;
          else if(rs<0.90)size=1+rng()*0.6;
          else if(rs<0.97)size=1.2+rng()*1.2;
          else size=1.8+rng()*1.8;
          if(rc<.7)temp=0;
          else if(rc<.85)temp=1;
          else temp=2;
          twinkle=rs>.92?(.3+rng()*.7):0;
          twinklePhase=rng()*Math.PI*2;
          s.dust.push({x:rx*w,y:ry*h,a:brightness,s:size,temp:temp,twinkle:twinkle,twinklePhase:twinklePhase});
        }
      }

      function fit(){
        var vf=visibleFiles();if(!vf.length)return;var minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
        for(var i=0;i<vf.length;i++){var f=vf[i];if(f.x<minX)minX=f.x;if(f.x>maxX)maxX=f.x;if(f.y<minY)minY=f.y;if(f.y>maxY)maxY=f.y;}
        var w=Math.max(1,maxX-minX),h=Math.max(1,maxY-minY),pad=160,cw=ui.c.clientWidth,ch=ui.c.clientHeight,sc=clamp(Math.min(cw/(w+pad),ch/(h+pad)),MIN,MAX);
        s.v.scale=sc;s.v.ox=cw/2-((minX+maxX)/2)*sc;s.v.oy=ch/2-((minY+maxY)/2)*sc;
      }

      function zoom(x,y,f){var p=s.v.scale,n=clamp(p*f,MIN,MAX);if(n===p)return;var wx=(x-s.v.ox)/p,wy=(y-s.v.oy)/p;s.v.scale=n;s.v.ox=x-wx*n;s.v.oy=y-wy*n;drawReq();}
      function drawReq(){if(s.queued)return;s.queued=true;requestAnimationFrame(function(){s.queued=false;draw();});}

      function draw(){
        var w=ui.c.clientWidth,h=ui.c.clientHeight;if(w<=0||h<=0)return;
        ctx.clearRect(0,0,w,h);bg(w,h);
        var vf=visibleFiles(),vis=Object.create(null);for(var i=0;i<vf.length;i++)vis[vf[i].id]=true;
        var fz=focus();nebula(vis);if(s.edgesOn)drawEdges(vis,fz);stars(vf,fz);labels(vf,fz);
      }

      function bg(w,h){
        var g=ctx.createRadialGradient(w*.3,h*.25,0,w*.5,h*.5,Math.max(w,h)*.95);
        g.addColorStop(0,"#050a18");
        g.addColorStop(.4,"#040810");
        g.addColorStop(1,"#020408");
        ctx.fillStyle=g;
        ctx.fillRect(0,0,w,h);
        if(!s.noiseCache||s.noiseCache.w!==w||s.noiseCache.h!==h){
          var noisePts=[];
          var noiseSeed=42;
          var noiseCount=Math.floor((w*h)/400);
          for(var ni=0;ni<noiseCount;ni++){
            noiseSeed=(noiseSeed*9301+49297)%233280;
            var nx=(noiseSeed/233280)*w;
            noiseSeed=(noiseSeed*9301+49297)%233280;
            var ny=(noiseSeed/233280)*h;
            noiseSeed=(noiseSeed*9301+49297)%233280;
            var na=(noiseSeed/233280);
            noisePts.push({x:nx,y:ny,light:na>0.5,a:0.008+(na%0.5)*0.015});
          }
          s.noiseCache={w:w,h:h,pts:noisePts};
        }
        for(var nj=0;nj<s.noiseCache.pts.length;nj++){
          var np=s.noiseCache.pts[nj];
          ctx.fillStyle=np.light
            ? "rgba(180,190,210,"+np.a.toFixed(4)+")"
            : "rgba(0,0,0,"+(np.a*1.5).toFixed(4)+")";
          ctx.fillRect(np.x,np.y,1,1);
        }
        // Milky Way band - a diagonal linear gradient band across the sky
        ctx.save();
        ctx.globalAlpha=1;
        var mwAngle=-0.35;
        var mwCos=Math.cos(mwAngle);
        var mwSin=Math.sin(mwAngle);
        var mwX1=w*0.15;
        var mwY1=h*0.1;
        var mwX2=w*0.85;
        var mwY2=h*0.9;
        var perpX=-mwSin;
        var perpY=mwCos;
        var bandWidth=Math.min(w,h)*0.35;
        var mwGrad=ctx.createLinearGradient(
          (mwX1+mwX2)/2+perpX*bandWidth,
          (mwY1+mwY2)/2+perpY*bandWidth,
          (mwX1+mwX2)/2-perpX*bandWidth,
          (mwY1+mwY2)/2-perpY*bandWidth
        );
        mwGrad.addColorStop(0,"rgba(100,115,150,0)");
        mwGrad.addColorStop(0.3,"rgba(120,135,170,0.012)");
        mwGrad.addColorStop(0.45,"rgba(140,155,190,0.025)");
        mwGrad.addColorStop(0.5,"rgba(150,165,200,0.03)");
        mwGrad.addColorStop(0.55,"rgba(140,155,190,0.025)");
        mwGrad.addColorStop(0.7,"rgba(120,135,170,0.012)");
        mwGrad.addColorStop(1,"rgba(100,115,150,0)");
        ctx.fillStyle=mwGrad;
        ctx.fillRect(0,0,w,h);
        ctx.restore();
        var time=Date.now()*.001;
        for(var i=0;i<s.dust.length;i++){
          var d=s.dust[i],alpha=d.a,color;
          if(d.twinkle>0){
            var twinkleAlpha=.5+.5*Math.sin(time*d.twinkle+d.twinklePhase);
            alpha=d.a*(.4+.6*twinkleAlpha);
          }
          if(d.temp===1)color="rgba(255,240,220,"+alpha.toFixed(4)+")";
          else if(d.temp===2)color="rgba(200,220,255,"+alpha.toFixed(4)+")";
          else color="rgba(255,255,255,"+alpha.toFixed(4)+")";
          if(d.s>1.2){
            if(d.a>0.08){
              var glowSize=d.s*2.5;
              var glowAlpha=alpha*0.15;
              var bgGlow=ctx.createRadialGradient(d.x,d.y,0,d.x,d.y,glowSize);
              bgGlow.addColorStop(0,color.replace(/[0-9.]+[)]$/,glowAlpha.toFixed(4)+")"));
              bgGlow.addColorStop(1,color.replace(/[0-9.]+[)]$/,"0)"));
              ctx.fillStyle=bgGlow;
              ctx.beginPath();
              ctx.arc(d.x,d.y,glowSize,0,Math.PI*2);
              ctx.fill();
            }
            ctx.fillStyle=color;
            ctx.beginPath();
            ctx.arc(d.x,d.y,d.s*.5,0,Math.PI*2);
            ctx.fill();
            if(d.a>0.15){
              ctx.fillStyle="rgba(255,255,255,"+(alpha*0.6).toFixed(4)+")";
              ctx.beginPath();
              ctx.arc(d.x,d.y,Math.max(0.4,d.s*0.2),0,Math.PI*2);
              ctx.fill();
            }
          }else{
            ctx.fillStyle=color;
            ctx.fillRect(d.x,d.y,1,1);
          }
        }
      }

      function nebula(vis){
        for(var i=0;i<s.mods.length;i++){
          var m=s.mods[i],n=0;
          for(var j=0;j<m.files.length;j++)if(vis[m.files[j].id])n++;
          if(!n)continue;
          var p=toScreen(m.x,m.y),rx=(m.ex||m.r)*s.v.scale,ry=(m.ey||m.r)*s.v.scale;
          if(rx<15)rx=15;
          if(ry<15)ry=15;
          var pl=palette(m.layer);
          var fileCount=m.files.length;
          var intensityScale=1.0/(1+fileCount*0.08);
          intensityScale=Math.max(0.35,Math.min(1.0,intensityScale));
          ctx.save();
          ctx.translate(p.x,p.y);
          var maxR=Math.max(rx,ry);
          ctx.scale(rx/maxR,ry/maxR);
          var hazeR=maxR*3.0;
          var g0=ctx.createRadialGradient(0,0,maxR*0.3,0,0,hazeR);
          g0.addColorStop(0,rgba(pl.star,0.03*intensityScale));
          g0.addColorStop(0.5,rgba(pl.star,0.012*intensityScale));
          g0.addColorStop(1,rgba(pl.star,0));
          ctx.fillStyle=g0;
          ctx.beginPath();
          ctx.arc(0,0,hazeR,0,Math.PI*2);
          ctx.fill();
          var outerR=maxR*2.2;
          var g1=ctx.createRadialGradient(0,0,maxR*.1,0,0,outerR);
          g1.addColorStop(0,rgba(pl.star,0.12*intensityScale));
          g1.addColorStop(0.4,rgba(pl.star,0.06*intensityScale));
          g1.addColorStop(0.7,rgba(pl.star,0.02*intensityScale));
          g1.addColorStop(1,rgba(pl.star,0));
          ctx.fillStyle=g1;
          ctx.beginPath();
          ctx.arc(0,0,outerR,0,Math.PI*2);
          ctx.fill();
          var g2=ctx.createRadialGradient(0,0,0,0,0,maxR*1.1);
          g2.addColorStop(0,rgba(pl.star,0.18*intensityScale));
          g2.addColorStop(0.3,rgba(pl.star,0.10*intensityScale));
          g2.addColorStop(0.6,rgba(pl.star,0.04*intensityScale));
          g2.addColorStop(1,rgba(pl.star,0));
          ctx.fillStyle=g2;
          ctx.beginPath();
          ctx.arc(0,0,maxR*1.1,0,Math.PI*2);
          ctx.fill();
          ctx.restore();
          var labelY=p.y-ry-16;
          if(n>0){
            var labelAlpha=clamp(.4+n*.05,.4,.75),fontSize=clamp(9+Math.sqrt(n)*1.5,9,14);
            ctx.font='500 '+fontSize+'px "IBM Plex Sans", "Segoe UI", system-ui, sans-serif';
            ctx.fillStyle=rgba(pl.star,labelAlpha);
            ctx.textAlign="center";
            ctx.textBaseline="middle";
            var label=m.label.toUpperCase(),spacing=2.5,totalWidth=0,charWidths=[];
            for(var ci=0;ci<label.length;ci++){
              var cw=ctx.measureText(label[ci]).width;
              charWidths.push(cw);
              totalWidth+=cw+(ci<label.length-1?spacing:0);
            }
            var startX=p.x-totalWidth/2;
            for(var cj=0;cj<label.length;cj++){
              ctx.fillText(label[cj],startX+charWidths[cj]/2,labelY);
              startX+=charWidths[cj]+spacing;
            }
            if(n>1){
              var anchorStartY=labelY+fontSize*0.6;
              var anchorEndY=p.y-ry*0.3;
              if(anchorEndY-anchorStartY>8){
                ctx.beginPath();
                ctx.moveTo(p.x,anchorStartY);
                ctx.lineTo(p.x,anchorEndY);
                ctx.strokeStyle=rgba(pl.star,labelAlpha*0.2);
                ctx.lineWidth=0.5;
                ctx.stroke();
                ctx.fillStyle=rgba(pl.star,labelAlpha*0.25);
                ctx.beginPath();
                ctx.arc(p.x,anchorEndY,1.5,0,Math.PI*2);
                ctx.fill();
              }
            }
          }
        }
      }

      function curvedLine(x1,y1,x2,y2){
        var mx=(x1+x2)/2;
        var my=(y1+y2)/2;
        var dx=x2-x1;
        var dy=y2-y1;
        var len=Math.sqrt(dx*dx+dy*dy);
        var offset=Math.min(len*0.08,20);
        var nx=-dy/(len||1);
        var ny=dx/(len||1);
        var sign=((Math.round(x1*7+y1*13)%2)===0)?1:-1;
        var cpx=mx+nx*offset*sign;
        var cpy=my+ny*offset*sign;
        ctx.beginPath();
        ctx.moveTo(x1,y1);
        ctx.quadraticCurveTo(cpx,cpy,x2,y2);
      }

      function drawEdges(vis,fz){
        var lineColor="148,175,220";
        for(var i=0;i<s.edges.length;i++){
          var e=s.edges[i];
          if(!vis[e.s]||!vis[e.t])continue;
          var sf=s.byId[e.s],tf=s.byId[e.t];
          if(!sf||!tf)continue;
          var a,w;
          if(fz.id){
            if(e.s===fz.id||e.t===fz.id){
              a=.65;w=1.3;
              var focusNode=s.byId[fz.id],focusColor=palette(focusNode.layer).star,sp=toScreen(sf.x,sf.y),tp=toScreen(tf.x,tf.y);
              ctx.lineWidth=w;
              ctx.strokeStyle=rgba(focusColor,a);
              curvedLine(sp.x,sp.y,tp.x,tp.y);
              ctx.stroke();
              continue;
            }else{a=.03;w=.3;}
          }else{
            var sameModule=sf.ml===tf.ml;
            a=sameModule ? .18 : .06;
            w=sameModule ? .7 : .35;
          }
          var sp2=toScreen(sf.x,sf.y),tp2=toScreen(tf.x,tf.y);
          ctx.lineWidth=w;
          ctx.strokeStyle="rgba("+lineColor+","+a.toFixed(3)+")";
          curvedLine(sp2.x,sp2.y,tp2.x,tp2.y);
          ctx.stroke();
        }
      }

      function drawSpikes(x,y,r,color,isHot,alpha){
        var len=r*(isHot?5:3.5),width=isHot?1.2:.6,angles=[Math.PI*.25,Math.PI*.75,Math.PI*1.25,Math.PI*1.75];
        ctx.save();
        ctx.globalAlpha=alpha*(isHot ? .6 : .35);
        ctx.strokeStyle=rgba(color,.7);
        ctx.lineWidth=width;
        for(var i=0;i<angles.length;i++){
          var a=angles[i],dx=Math.cos(a),dy=Math.sin(a);
          var grad=ctx.createLinearGradient(x+dx*r*.5,y+dy*r*.5,x+dx*len,y+dy*len);
          grad.addColorStop(0,rgba(color,.6));
          grad.addColorStop(.5,rgba(color,.2));
          grad.addColorStop(1,rgba(color,0));
          ctx.strokeStyle=grad;
          ctx.beginPath();
          ctx.moveTo(x+dx*r*.5,y+dy*r*.5);
          ctx.lineTo(x+dx*len,y+dy*len);
          ctx.stroke();
        }
        if(r>5.5){
          var shortLen=len*.4,shortAngles=[0,Math.PI*.5,Math.PI,Math.PI*1.5];
          ctx.globalAlpha=alpha*(isHot ? .35 : .15);
          ctx.lineWidth=width*.5;
          for(var j=0;j<shortAngles.length;j++){
            var sa=shortAngles[j],sdx=Math.cos(sa),sdy=Math.sin(sa);
            var sGrad=ctx.createLinearGradient(x+sdx*r*.5,y+sdy*r*.5,x+sdx*shortLen,y+sdy*shortLen);
            sGrad.addColorStop(0,rgba(color,.4));
            sGrad.addColorStop(1,rgba(color,0));
            ctx.strokeStyle=sGrad;
            ctx.beginPath();
            ctx.moveTo(x+sdx*r*.5,y+sdy*r*.5);
            ctx.lineTo(x+sdx*shortLen,y+sdy*shortLen);
            ctx.stroke();
          }
        }
        ctx.restore();
      }

      function stars(vf,fz){
        for(var i=0;i<vf.length;i++){
          var f=vf[i],on=!fz.id||fz.link[f.id],alpha=on?1:.12,p=toScreen(f.x,f.y),r=radius(f),pl=palette(f.layer),starColor=jitterColor(pl.star,f.jitter||0),isHot=fz.id===f.id||s.hover===f.id;
          f._x=p.x;f._y=p.y;f._r=r;
          ctx.save();
          ctx.globalAlpha=alpha;
          var glowR=r*(isHot?6:(r>4?4:3));
          var gg=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,glowR);
          gg.addColorStop(0,rgba(starColor,isHot ? .3 : .12));
          gg.addColorStop(.3,rgba(starColor,isHot ? .12 : .04));
          gg.addColorStop(1,rgba(starColor,0));
          ctx.fillStyle=gg;
          ctx.beginPath();
          ctx.arc(p.x,p.y,glowR,0,Math.PI*2);
          ctx.fill();
          var bodyG=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,r*1.2);
          bodyG.addColorStop(0,rgba("#ffffff",.9));
          bodyG.addColorStop(.3,rgba(starColor,.95));
          bodyG.addColorStop(.7,rgba(starColor,.5));
          bodyG.addColorStop(1,rgba(starColor,0));
          ctx.fillStyle=bodyG;
          ctx.beginPath();
          ctx.arc(p.x,p.y,r*1.2,0,Math.PI*2);
          ctx.fill();
          var coreR=Math.max(.6,r*.3);
          ctx.fillStyle="rgba(255,255,255,"+(isHot?"0.95":"0.85")+")";
          ctx.beginPath();
          ctx.arc(p.x,p.y,coreR,0,Math.PI*2);
          ctx.fill();
          if(r>3.5)drawSpikes(p.x,p.y,r,starColor,isHot,alpha);
          if(isHot&&s.hover===f.id){
            var pulseTime=Date.now()*.003,pulseR=r*(2+Math.sin(pulseTime)*.5),pulseAlpha=.15+Math.sin(pulseTime)*.05;
            ctx.strokeStyle=rgba(starColor,pulseAlpha);
            ctx.lineWidth=.5;
            ctx.beginPath();
            ctx.arc(p.x,p.y,pulseR,0,Math.PI*2);
            ctx.stroke();
          }
          if(s.sel===f.id){
            ctx.strokeStyle=rgba(pl.star,.6);
            ctx.lineWidth=.8;
            ctx.setLineDash([3,3]);
            ctx.beginPath();
            ctx.arc(p.x,p.y,r*2.5,0,Math.PI*2);
            ctx.stroke();
            ctx.setLineDash([]);
          }
          ctx.restore();
        }
      }

      function labels(vf,fz){
        var z=s.v.scale;
        ctx.textAlign="center";
        ctx.textBaseline="top";
        var candidates=[];
        for(var i=0;i<vf.length;i++){
          var f=vf[i];
          var r=f._r||radius(f);
          var on=!fz.id||fz.link[f.id];
          var importance=f.loc/s.maxLoc;
          var showThreshold;
          if(importance>0.5)showThreshold=0.7;
          else if(importance>0.2)showThreshold=1.2;
          else showThreshold=2.0;
          var isActive=s.hover===f.id||s.sel===f.id;
          var isConnected=fz.id&&fz.link[f.id];
          if(isConnected)showThreshold*=0.6;
          if(!isActive&&z<showThreshold)continue;
          var baseAlpha;
          if(isActive){
            baseAlpha=0.95;
          }else if(isConnected){
            baseAlpha=clamp((z-showThreshold*0.8)/(showThreshold*0.4),0.3,0.7);
          }else{
            baseAlpha=on?clamp((z-showThreshold)/(showThreshold*0.5),0.1,0.6):0.08;
          }
          if(baseAlpha<0.03)continue;
          var fontSize=isActive?11:(importance>0.3?10:9);
          var lx=f._x;
          var ly=f._y+r+4;
          candidates.push({
            f:f,
            x:lx,
            y:ly,
            alpha:baseAlpha,
            fontSize:fontSize,
            isActive:isActive,
            importance:importance,
            hw:f.label.length*fontSize*0.32,
            hh:fontSize*0.7
          });
        }
        candidates.sort(function(a,b){
          if(a.isActive!==b.isActive)return a.isActive?-1:1;
          return b.importance-a.importance;
        });
        var placed=[];
        for(var k=0;k<candidates.length;k++){
          var c=candidates[k];
          var lx2=c.x;
          var ly2=c.y;
          var collides=false;
          for(var p=0;p<placed.length;p++){
            var pl2=placed[p];
            if(Math.abs(lx2-pl2.x)<(c.hw+pl2.hw)&&Math.abs(ly2-pl2.y)<(c.hh+pl2.hh)){
              collides=true;
              break;
            }
          }
          if(collides&&!c.isActive){
            var altPositions=[
              {x:c.f._x,y:c.f._y-c.f._r-c.fontSize-2},
              {x:c.f._x+c.hw+8,y:c.f._y},
              {x:c.f._x-c.hw-8,y:c.f._y}
            ];
            var found=false;
            for(var a=0;a<altPositions.length;a++){
              var alt=altPositions[a];
              var altCollides=false;
              for(var q=0;q<placed.length;q++){
                if(Math.abs(alt.x-placed[q].x)<(c.hw+placed[q].hw)&&Math.abs(alt.y-placed[q].y)<(c.hh+placed[q].hh)){
                  altCollides=true;
                  break;
                }
              }
              if(!altCollides){
                lx2=alt.x;
                ly2=alt.y;
                found=true;
                break;
              }
            }
            if(!found){
              if(z<2.0)continue;
              c.alpha*=0.4;
            }
          }
          ctx.font=(c.isActive?'500 ':'')+c.fontSize+'px "IBM Plex Mono", "Cascadia Code", ui-monospace, monospace';
          ctx.fillStyle="rgba(255,255,255,"+c.alpha.toFixed(2)+")";
          ctx.fillText(c.f.label,lx2,ly2);
          placed.push({x:lx2,y:ly2,hw:c.hw,hh:c.hh});
        }
      }

      function focus(){
        var id=s.sel||s.hover;if(!id||!s.byId[id])return{id:null,link:Object.create(null)};
        var link=Object.create(null),f=s.byId[id];link[id]=true;for(var i=0;i<f.im.length;i++)link[f.im[i]]=true;for(var j=0;j<f.dep.length;j++)link[f.dep[j]]=true;return{id:id,link:link};
      }

      function visibleFiles(){var out=[];for(var i=0;i<s.files.length;i++)if(layerOn(s.files[i].layer))out.push(s.files[i]);return out;}
      function layerOn(name){if(s.visible[name]===undefined)return true;return Boolean(s.visible[name]);}

      function down(e){s.p.down=true;s.p.drag=false;s.p.dx=e.clientX;s.p.dy=e.clientY;s.p.lx=e.clientX;s.p.ly=e.clientY;}
      function move(e){
        if(s.p.down){
          var dx=e.clientX-s.p.lx,dy=e.clientY-s.p.ly,tx=e.clientX-s.p.dx,ty=e.clientY-s.p.dy;
          if(!s.p.drag&&Math.sqrt(tx*tx+ty*ty)>2){s.p.drag=true;ui.c.classList.add("dragging");}
          if(s.p.drag){s.v.ox+=dx;s.v.oy+=dy;tipHide();drawReq();}s.p.lx=e.clientX;s.p.ly=e.clientY;return;
        }
        hover(e.clientX,e.clientY);
      }
      function up(e){
        if(!s.p.down)return;var drag=s.p.drag;s.p.down=false;s.p.drag=false;ui.c.classList.remove("dragging");
        if(drag){hover(e.clientX,e.clientY);return;}
        var h=hit(e.clientX,e.clientY);if(h){s.sel=h.id;detailOpen(h);}else{s.sel=null;detailClose();}drawReq();
      }
      function wheel(e){e.preventDefault();zoom(e.clientX,e.clientY,Math.exp(-e.deltaY*.0015));}
      function hover(x,y){var h=hit(x,y),idn=h?h.id:null;if(s.hover!==idn){s.hover=idn;drawReq();}if(h)tipShow(h,x,y);else tipHide();}

      function hit(x,y){
        var vf=visibleFiles(),best=null,dist=Infinity;
        for(var i=0;i<vf.length;i++){var f=vf[i],p=toScreen(f.x,f.y),r=radius(f),hr=Math.max(6,r+4),dx=x-p.x,dy=y-p.y,d=Math.sqrt(dx*dx+dy*dy);if(d<=hr&&d<dist){best=f;dist=d;}}
        return best;
      }

      function tipShow(f,x,y){
        var pl=palette(f.layer),dotColor=pl.star;
        ui.tip.innerHTML='<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">'+
          '<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:'+dotColor+';box-shadow:0 0 4px '+dotColor+'"></span>'+
          '<strong>'+esc(f.label)+'</strong>'+
          '</div>'+
          '<span style="color:#8a9bb0;font-size:11px">'+fmt(f.loc)+' lines &middot; '+esc(f.layer)+'</span><br/>'+
          '<span style="color:#6b7d94;font-size:10px">'+f.im.length+' imports &middot; '+f.dep.length+' dependents</span>';
        var pad=14;
        ui.tip.style.left=(x+14)+"px";
        ui.tip.style.top=(y+14)+"px";
        ui.tip.classList.add("open");
        var r=ui.tip.getBoundingClientRect();
        if(r.right>window.innerWidth-pad)ui.tip.style.left=Math.max(pad,x-r.width-12)+"px";
        if(r.bottom>window.innerHeight-pad)ui.tip.style.top=Math.max(pad,y-r.height-12)+"px";
      }
      function tipHide(){ui.tip.classList.remove("open");}

      function detailOpen(f){
        var im=uniq(f.im.map(function(i){return s.byId[i];}).filter(Boolean));
        var dp=uniq(f.dep.map(function(i){return s.byId[i];}).filter(Boolean));
        var pl=palette(f.layer);
        var h="";
        h+='<div class="d-header">';
        h+='<div class="d-star-icon" style="background:radial-gradient(circle,'+esc(pl.star)+' 0%, transparent 70%);box-shadow:0 0 12px '+esc(pl.star)+'44,0 0 4px '+esc(pl.star)+'88"></div>';
        h+='<div>';
        h+='<h2 class="d-title">'+esc(f.label)+'</h2>';
        h+='<p class="d-path">'+esc(f.path)+'</p>';
        h+='<div class="d-badge" style="background:'+esc(pl.star)+'18;color:'+esc(pl.star)+'">'+
             '<span class="d-conn-dot" style="background:'+esc(pl.star)+'"></span>'+
             esc(f.layer)+' &middot; '+esc(f.ml)+'</div>';
        h+='</div></div>';
        h+='<div class="d-metrics">';
        h+=dMetric(fmt(f.loc),"Lines of Code");
        h+=dMetric(fmt(f.cx),"Complexity");
        h+=dMetric(fmt(f.im.length),"Imports");
        h+=dMetric(fmt(f.dep.length),"Dependents");
        h+='</div>';
        h+='<div style="margin-top:8px"><div class="d-metric" style="text-align:center">';
        h+='<div class="d-metric-val">'+fmt(f.ec)+'</div>';
        h+='<div class="d-metric-label">Exports</div>';
        h+='</div></div>';
        h+='<div class="d-divider"></div>';
        h+='<div class="d-sec-title">Imports</div>';
        h+='<div class="d-conn-list">';
        if(im.length){
          for(var i=0;i<im.length;i++){
            var ipl=palette(im[i].layer);
            h+='<div class="d-conn-item">'+
                 '<span class="d-conn-dot" style="background:'+esc(ipl.star)+';box-shadow:0 0 4px '+esc(ipl.star)+'66"></span>'+
                 esc(im[i].label)+'</div>';
          }
        }else{
          h+='<div class="d-empty">No file imports</div>';
        }
        h+='</div>';
        h+='<div class="d-divider"></div>';
        h+='<div class="d-sec-title">Dependents</div>';
        h+='<div class="d-conn-list">';
        if(dp.length){
          for(var j=0;j<dp.length;j++){
            var dpl=palette(dp[j].layer);
            h+='<div class="d-conn-item">'+
                 '<span class="d-conn-dot" style="background:'+esc(dpl.star)+';box-shadow:0 0 4px '+esc(dpl.star)+'66"></span>'+
                 esc(dp[j].label)+'</div>';
          }
        }else{
          h+='<div class="d-empty">No dependents</div>';
        }
        h+='</div>';
        ui.dbody.innerHTML=h;
        ui.detail.classList.add("open");
        ui.detail.setAttribute("aria-hidden","false");
      }
      function detailClose(){
        ui.detail.classList.remove("open");
        ui.detail.setAttribute("aria-hidden","true");
        ui.dbody.innerHTML='<div class="d-placeholder"><div class="d-placeholder-icon">&#10022;</div>Click a star to inspect</div>';
      }
      function dMetric(val,label){return '<div class="d-metric"><div class="d-metric-val">'+val+'</div><div class="d-metric-label">'+label+'</div></div>';}
      function uniq(arr){var map=Object.create(null);for(var i=0;i<arr.length;i++)map[arr[i].id]=arr[i];return Object.keys(map).map(function(k){return map[k];}).sort(function(a,b){return a.label.localeCompare(b.label);});}

      function live(){
        function c(){var ws;try{ws=new WebSocket("ws://"+location.host);}catch(_e){setTimeout(c,2000);return;}
          ws.onmessage=function(ev){if(ev.data==="reload")fetchGraph();};ws.onclose=function(){setTimeout(c,2000);};ws.onerror=function(){try{ws.close();}catch(_x){}};}
        c();
      }

      function radius(f){
        var loc=num(f.loc,1),mag=Math.pow(loc/s.maxLoc,.45),base=1.5+mag*6.5;
        if(f.exp)base*=1.15;
        var zs=.85+Math.min(.6,Math.pow(s.v.scale,.2));
        return clamp(base*zs,1.2,14);
      }
      function toScreen(x,y){return{x:x*s.v.scale+s.v.ox,y:y*s.v.scale+s.v.oy};}
      function parentId(n){if(!n)return null;return n.parent||n.parent_id||null;}
      function layerOf(idn,nodes,cache){
        if(!idn)return"Other";if(cache[idn])return cache[idn];var cur=idn,g=0;
        while(cur&&g<400){if(cache[cur]){cache[idn]=cache[cur];return cache[cur];}var n=nodes[cur];if(!n)break;if(n.type==="layer"){var l=String(n.label||"Other");cache[cur]=l;cache[idn]=l;return l;}cur=parentId(n);g+=1;}
        cache[idn]="Other";return"Other";
      }
      function classifyLayer(filePath){
        var p="/"+String(filePath||"").toLowerCase().replace(/\\\\/g,"/");
        var rules=[
          {re:/\\/(api|routes|server|endpoints)\\//i,layer:"API"},
          {re:/\\/(pages|app\\/(?!api))\\//i,layer:"Pages"},
          {re:/\\/components?\\//i,layer:"UI"},
          {re:/\\/hooks?\\//i,layer:"Hooks"},
          {re:/\\/(stores?|state|contexts?)\\//i,layer:"State"},
          {re:/\\/(lib|utils?|helpers?)\\//i,layer:"Lib"},
          {re:/\\/(types?|interfaces|models)\\//i,layer:"Types"},
          {re:/\\/(config|constants?|env)\\//i,layer:"Config"},
          {re:/\\/services?\\//i,layer:"Services"},
          {re:/\\/(middleware|guards?)\\//i,layer:"Middleware"},
          {re:/\\/(test|__tests__|spec|__mocks__)\\//i,layer:"Tests"},
          {re:/\\/(styles?|css|themes?)\\//i,layer:"Styles"},
          {re:/\\/(schemas?|validation|zod)\\//i,layer:"Data"},
          {re:/\\/(graph|builders?|analyzers?|parsers?)\\//i,layer:"Core"},
          {re:/\\/(commands?|cli)\\//i,layer:"Core"},
          {re:/\\/(languages?|grammars?)\\//i,layer:"Core"},
          {re:/\\/(server|http|ws)\\//i,layer:"API"},
          {re:/\\/(visualizer|views?|ui|display)\\//i,layer:"UI"}
        ];
        for(var i=0;i<rules.length;i++)if(rules[i].re.test(p))return rules[i].layer;
        var fname=p.split("/").pop()||"";
        if(fname.startsWith("use")&&(fname.endsWith(".ts")||fname.endsWith(".tsx")))return"Hooks";
        if(fname.endsWith(".test.ts")||fname.endsWith(".spec.ts"))return"Tests";
        if(fname.endsWith(".css")||fname.endsWith(".scss"))return"Styles";
        if(fname==="index.ts"||fname==="index.tsx")return"Core";
        if(fname.endsWith(".d.ts"))return"Types";
        return"Other";
      }
      function palette(name){return LAYERS[name]||LAYERS.Other;}
      function nebColor(v,a){var m=String(v).match(/^rgba\\((\\d+),(\\d+),(\\d+),[\\d.]+\\)$/);if(!m)return"rgba(148,163,184,"+a+")";return"rgba("+m[1]+","+m[2]+","+m[3]+","+a+")";}
      function rgba(hex,a){var h=String(hex||"").replace("#","");if(h.length!==6)return"rgba(148,163,184,"+a+")";var r=parseInt(h.slice(0,2),16),g=parseInt(h.slice(2,4),16),b=parseInt(h.slice(4,6),16);if(!Number.isFinite(r)||!Number.isFinite(g)||!Number.isFinite(b))return"rgba(148,163,184,"+a+")";return"rgba("+r+","+g+","+b+","+a+")";}
      function jitterColor(hex,jitter){
        var h=String(hex||"").replace("#","");
        if(h.length!==6)return hex;
        var r=parseInt(h.slice(0,2),16);
        var g=parseInt(h.slice(2,4),16);
        var b=parseInt(h.slice(4,6),16);
        var brightShift=1+jitter*0.15;
        var warmShift=jitter*12;
        r=clamp(Math.round(r*brightShift+warmShift),0,255);
        g=clamp(Math.round(g*brightShift),0,255);
        b=clamp(Math.round(b*brightShift-warmShift*0.5),0,255);
        return "#"+(r<16?"0":"")+r.toString(16)+(g<16?"0":"")+g.toString(16)+(b<16?"0":"")+b.toString(16);
      }
      function setLoading(on,msg){ui.load.style.display=on?"flex":"none";if(on)ui.load.textContent=msg||"Loading...";}
      function num(v,f){var n=Number(v);return Number.isFinite(n)?n:f;}function fmt(v){return Number(v||0).toLocaleString();}
      function clamp(v,min,max){return Math.max(min,Math.min(max,v));}
      function esc(v){return String(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");}
      function id(x){return document.getElementById(x);}
    })();
  </script>
</body>
</html>`;
}
