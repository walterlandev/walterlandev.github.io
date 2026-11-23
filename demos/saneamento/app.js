/* Demo: controle operacional de estações de tratamento de água.
   Dados fictícios, estado só em memória. */
(function () {
  "use strict";

  // ---------- Faixas de referência ----------
  var FAIXA = {
    cloro: { min: 0.2, max: 2.0, atMin: 0.3, atMax: 1.8, unid: "mg/L", nome: "cloro residual" },
    turbidez: { max: 5.0, at: 4.0, unid: "NTU", nome: "turbidez" },
    ph: { min: 6.0, max: 9.5, atMin: 6.3, atMax: 9.2, unid: "", nome: "pH" }
  };
  var NIVEL_PESO = { ok: 0, atencao: 1, fora: 2 };
  var SIT_TEXTO = { ok: "Normal", atencao: "Atenção", fora: "Fora da faixa" };
  var SIT_CLASSE = { ok: "estado--ok", atencao: "estado--sinal", fora: "estado--alerta" };

  // ---------- Utilidades ----------
  var nf = function (n, casas) {
    return n.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
  };
  var pad = function (n) { return String(n).padStart(2, "0"); };
  var hhmm = function (d) { return pad(d.getHours()) + ":" + pad(d.getMinutes()); };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var el = function (tag, attrs, html) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    if (html != null) e.innerHTML = html;
    return e;
  };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var mesmoDia = function (a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); };

  // Gerador pseudoaleatório com semente: os dados fictícios são sempre os mesmos.
  function semente(s) {
    return function () { s |= 0; s = s + 0x6D2B79F5 | 0; var t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  var rnd = semente(2026);
  var arred = function (v, c) { var p = Math.pow(10, c); return Math.round(v * p) / p; };

  function nivelCloro(v) {
    if (v < FAIXA.cloro.min || v > FAIXA.cloro.max) return "fora";
    if (v < FAIXA.cloro.atMin || v > FAIXA.cloro.atMax) return "atencao";
    return "ok";
  }
  function nivelTurb(v) { return v > FAIXA.turbidez.max ? "fora" : v >= FAIXA.turbidez.at ? "atencao" : "ok"; }
  function nivelPh(v) {
    if (v < FAIXA.ph.min || v > FAIXA.ph.max) return "fora";
    if (v < FAIXA.ph.atMin || v > FAIXA.ph.atMax) return "atencao";
    return "ok";
  }
  function avaliar(l) {
    var n = { cloro: nivelCloro(l.cloro), turbidez: nivelTurb(l.turbidez), ph: nivelPh(l.ph) };
    var pior = "ok";
    Object.keys(n).forEach(function (k) { if (NIVEL_PESO[n[k]] > NIVEL_PESO[pior]) pior = n[k]; });
    return { niveis: n, pior: pior };
  }
  function motivos(l, nivel) {
    var n = avaliar(l).niveis, m = [];
    if (n.cloro === nivel) m.push("cloro " + nf(l.cloro, 2) + " mg/L");
    if (n.turbidez === nivel) m.push("turbidez " + nf(l.turbidez, 1) + " NTU");
    if (n.ph === nivel) m.push("pH " + nf(l.ph, 1));
    return m;
  }

  // ---------- Dados fictícios ----------
  var agora = new Date();
  var horaBase = new Date(agora); horaBase.setMinutes(0, 0, 0);

  var perfis = [
    { nome: "Estação 01", tipo: "Convencional", cap: 120, cloro: 1.1, turb: 0.8, ph: 7.2, vazao: 96 },
    { nome: "Estação 02", tipo: "Convencional", cap: 85, cloro: 0.9, turb: 1.2, ph: 7.0, vazao: 64 },
    { nome: "Estação 03", tipo: "Filtração direta", cap: 40, cloro: 1.3, turb: 0.6, ph: 7.4, vazao: 31 },
    { nome: "Estação 04", tipo: "Convencional", cap: 60, cloro: 0.55, turb: 1.9, ph: 6.9, vazao: 47, fim: { cloro: [0.42, 0.36, 0.31, 0.27] } },
    { nome: "Estação 05", tipo: "Poços e desinfecção", cap: 25, cloro: 1.0, turb: 0.4, ph: 7.6, vazao: 19 },
    { nome: "Estação 06", tipo: "Convencional", cap: 150, cloro: 1.2, turb: 2.4, ph: 7.1, vazao: 128, fim: { turbidez: [3.1, 4.2, 5.6, 6.3] }, picos: { 7: { turbidez: 5.4 } } }
  ];

  var estacoes = perfis.map(function (p, i) {
    var leituras = [];
    for (var k = 23; k >= 0; k--) {
      var t = new Date(horaBase.getTime() - k * 3600 * 1000);
      var dia = Math.sin((t.getHours() - 6) / 24 * Math.PI * 2); // variação ao longo do dia
      var l = {
        t: t,
        cloro: arred(Math.max(0.05, p.cloro + dia * 0.12 + (rnd() - 0.5) * 0.18), 2),
        turbidez: arred(Math.max(0.1, p.turb + (rnd() - 0.5) * p.turb * 0.5), 1),
        ph: arred(p.ph + (rnd() - 0.5) * 0.3, 1),
        vazao: Math.round(p.vazao * (0.92 + dia * 0.06 + rnd() * 0.06))
      };
      var idx = 23 - k;
      if (p.picos && p.picos[idx]) Object.assign(l, p.picos[idx]);
      if (p.fim) Object.keys(p.fim).forEach(function (campo) {
        var arr = p.fim[campo], pos = idx - (24 - arr.length);
        if (pos >= 0) l[campo] = arr[pos];
      });
      leituras.push(l);
    }
    return { id: i, nome: p.nome, tipo: p.tipo, cap: p.cap, leituras: leituras };
  });

  var estoque = [
    { nome: "Hipoclorito de cálcio 65%", uso: "desinfecção", unid: "kg", saldo: 1240, cons: 38 },
    { nome: "Sulfato de alumínio líquido", uso: "coagulação", unid: "kg", saldo: 9800, cons: 1450 },
    { nome: "Cal hidratada", uso: "correção de pH", unid: "kg", saldo: 2100, cons: 165 },
    { nome: "Policloreto de alumínio", uso: "coagulação", unid: "kg", saldo: 3600, cons: 120 },
    { nome: "Fluossilicato de sódio", uso: "fluoretação", unid: "kg", saldo: 310, cons: 14 },
    { nome: "Polímero auxiliar", uso: "floculação", unid: "kg", saldo: 180, cons: 6.5 }
  ];

  var selecionada = 5;
  var lancadas = []; // leituras lançadas nesta sessão

  function situacao(est) { return avaliar(est.leituras[est.leituras.length - 1]).pior; }
  function ultima(est) { return est.leituras[est.leituras.length - 1]; }

  // ---------- Cabeçalho e tema ----------
  function iniciarTopo() {
    var dataTxt = agora.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
    $("#data-hoje").textContent = dataTxt;
    var raiz = document.documentElement, btn = $("#btn-tema"), txt = $("#btn-tema-texto");
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    function atual() { return raiz.getAttribute("data-tema") || (mq.matches ? "escuro" : "claro"); }
    function rotular() {
      var prox = atual() === "escuro" ? "claro" : "escuro";
      txt.textContent = "Tema " + prox;
      btn.setAttribute("aria-label", "Mudar para o tema " + prox);
    }
    btn.addEventListener("click", function () {
      var novo = atual() === "escuro" ? "claro" : "escuro";
      raiz.setAttribute("data-tema", novo);
      try { localStorage.setItem("tema", novo); } catch (e) {}
      rotular();
    });
    rotular();
    var relogio = function () { var d = new Date(); $("#celular-hora").textContent = hhmm(d); };
    relogio(); setInterval(relogio, 30000);
  }

  // ---------- Indicadores ----------
  function renderIndicadores() {
    var cont = { ok: 0, atencao: 0, fora: 0 }, somaCloro = 0, maiorTurb = null, hoje = 0, ultimaHora = null;
    estacoes.forEach(function (e) {
      cont[situacao(e)]++;
      var u = ultima(e);
      somaCloro += u.cloro;
      if (!maiorTurb || u.turbidez > maiorTurb.v) maiorTurb = { v: u.turbidez, est: e.nome };
      e.leituras.forEach(function (l) {
        if (mesmoDia(l.t, agora)) hoje++;
        if (!ultimaHora || l.t > ultimaHora) ultimaHora = l.t;
      });
    });
    var notas = [];
    if (cont.atencao) notas.push('<span class="estado estado--sinal">' + cont.atencao + " em atenção</span>");
    if (cont.fora) notas.push('<span class="estado estado--alerta">' + cont.fora + " fora da faixa</span>");
    if (!notas.length) notas.push('<span class="estado estado--ok">Todas dentro da faixa</span>');
    var turbFora = maiorTurb.v > FAIXA.turbidez.max;
    $("#indicadores").innerHTML =
      '<div class="ind"><span class="ind__rotulo">Estações normais agora</span>' +
        '<span class="ind__valor">' + cont.ok + '<small>de ' + estacoes.length + '</small></span>' +
        '<span class="ind__nota" style="display:flex;flex-wrap:wrap;gap:4px 14px">' + notas.join("") + "</span></div>" +
      '<div class="ind"><span class="ind__rotulo">Cloro residual médio</span>' +
        '<span class="ind__valor">' + nf(somaCloro / estacoes.length, 2) + '<small>mg/L</small></span>' +
        '<span class="ind__nota">faixa de 0,2 a 2,0</span></div>' +
      '<div class="ind' + (turbFora ? " ind--alerta" : "") + '"><span class="ind__rotulo">Maior turbidez</span>' +
        '<span class="ind__valor">' + nf(maiorTurb.v, 1) + '<small>NTU</small></span>' +
        '<span class="ind__nota">' + esc(maiorTurb.est) + (turbFora ? ", acima de 5,0" : "") + "</span></div>" +
      '<div class="ind"><span class="ind__rotulo">Leituras hoje</span>' +
        '<span class="ind__valor">' + hoje + "</span>" +
        '<span class="ind__nota">última às ' + hhmm(ultimaHora) + "</span></div>";
    $("#hora-atualizacao").textContent = hhmm(ultimaHora);
  }

  // ---------- Lista de estações ----------
  function renderEstacoes(destacar) {
    var ul = $("#lista-estacoes");
    ul.innerHTML = "";
    estacoes.forEach(function (e) {
      var u = ultima(e), av = avaliar(u), sit = av.pior;
      var v = function (campo, txt) { return av.niveis[campo] === "fora" ? '<span class="fora">' + txt + "</span>" : txt; };
      var li = el("li");
      var b = el("button", { type: "button", class: "estacao" + (destacar === e.id ? " recem" : ""), "data-sit": sit, "aria-pressed": String(e.id === selecionada) });
      b.innerHTML =
        '<span class="estacao__barra" aria-hidden="true"></span>' +
        '<span><span class="estacao__nome">' + esc(e.nome) + '</span>' +
        '<span class="estacao__valores">' + v("cloro", "Cloro " + nf(u.cloro, 2)) + "&ensp; " + v("turbidez", nf(u.turbidez, 1) + " NTU") + "&ensp; " + v("ph", "pH " + nf(u.ph, 1)) + "</span></span>" +
        '<span class="estacao__sit estado ' + SIT_CLASSE[sit] + '">' + SIT_TEXTO[sit] + "</span>";
      b.setAttribute("aria-label", e.nome + ", " + SIT_TEXTO[sit] + ". Última leitura às " + hhmm(u.t) + ": cloro " + nf(u.cloro, 2) + " miligramas por litro, turbidez " + nf(u.turbidez, 1) + " NTU, pH " + nf(u.ph, 1) + ".");
      b.addEventListener("click", function () { selecionar(e.id); });
      li.appendChild(b);
      ul.appendChild(li);
    });
  }
  function selecionar(id) {
    selecionada = id;
    Array.prototype.forEach.call(document.querySelectorAll(".estacao"), function (b, i) { b.setAttribute("aria-pressed", String(i === id)); });
    cursor = null;
    renderGrafico();
    $("#f-estacao").value = String(id);
  }

  // ---------- Gráfico (SVG à mão) ----------
  var svgNS = "http://www.w3.org/2000/svg";
  var cursor = null, geo = null, recemIdx = null;
  function s(tag, attrs, txt) {
    var e = document.createElementNS(svgNS, tag);
    Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    if (txt != null) e.textContent = txt;
    return e;
  }

  function renderGrafico() {
    var est = estacoes[selecionada], L = est.leituras;
    var svg = $("#grafico-svg"), caixa = $("#grafico");
    var W = Math.max(280, Math.round(caixa.clientWidth));
    var estreito = W < 520;
    var pL = estreito ? 34 : 44, pR = 10, h = estreito ? 104 : 128, topo1 = 24, gap = 40, topo2 = topo1 + h + gap, base = topo2 + h, H = base + 26;
    var largura = W - pL - pR, passo = largura / (L.length - 1);
    var x = function (i) { return pL + i * passo; };

    var maxCl = Math.max(2.6, Math.max.apply(null, L.map(function (l) { return l.cloro; })) * 1.1);
    var maxTu = Math.max(7, Math.max.apply(null, L.map(function (l) { return l.turbidez; })) * 1.15);
    var yC = function (v) { return topo1 + h - (v / maxCl) * h; };
    var yT = function (v) { return topo2 + h - (v / maxTu) * h; };

    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    svg.setAttribute("width", W); svg.setAttribute("height", H);
    svg.setAttribute("tabindex", "0");
    svg.innerHTML = "";
    $("#t-grafico").textContent = est.nome + ": últimas 24 leituras";

    function painel(titulo, unid, topoP, y, max, faixaMin, faixaMax, marcas, campo, casas, classeLinha, nivelFn) {
      var g = s("g");
      g.appendChild(s("text", { x: pL, y: topoP - 9, class: "g-titulo" }, titulo));
      var tt = g.lastChild; tt.appendChild(s("tspan", { class: "g-unid", dx: 6 }, unid));
      g.appendChild(s("rect", { x: pL, y: y(faixaMax), width: largura, height: y(faixaMin) - y(faixaMax), class: "g-faixa" }));
      [faixaMin, faixaMax].forEach(function (v) { if (v > 0) g.appendChild(s("line", { x1: pL, x2: pL + largura, y1: y(v), y2: y(v), class: "g-limite" })); });
      g.appendChild(s("line", { x1: pL, x2: pL + largura, y1: topoP + h, y2: topoP + h, class: "g-eixo" }));
      marcas.forEach(function (v) {
        if (v > max) return;
        g.appendChild(s("text", { x: pL - 6, y: y(v) + 4, "text-anchor": "end", class: "g-texto" }, nf(v, casas)));
      });
      var d = L.map(function (l, i) { return (i ? "L" : "M") + x(i).toFixed(1) + " " + y(l[campo]).toFixed(1); }).join(" ");
      g.appendChild(s("path", { d: d, class: "g-linha " + classeLinha }));
      L.forEach(function (l, i) {
        var fora = nivelFn(l[campo]) === "fora", ult = i === L.length - 1;
        if (fora || ult || i === recemIdx) {
          g.appendChild(s("circle", { cx: x(i), cy: y(l[campo]), r: ult || i === recemIdx ? 4.5 : 3.5, class: "g-ponto" + (fora ? " g-ponto--fora" : "") + (ult ? " g-ponto--ultimo" : "") }));
        }
      });
      svg.appendChild(g);
    }
    painel("Cloro residual", "mg/L", topo1, yC, maxCl, FAIXA.cloro.min, FAIXA.cloro.max, [0.2, 1, 2], "cloro", 1, "g-linha--cloro", nivelCloro);
    painel("Turbidez", "NTU", topo2, yT, maxTu, 0, FAIXA.turbidez.max, [0, 5], "turbidez", 0, "g-linha--turb", nivelTurb);

    // eixo de horas
    var cada = estreito ? 6 : 3;
    L.forEach(function (l, i) {
      if ((L.length - 1 - i) % cada === 0) svg.appendChild(s("text", { x: x(i), y: base + 18, "text-anchor": "middle", class: "g-texto" }, pad(l.t.getHours()) + "h"));
    });

    var grupoCursor = s("g", { id: "g-cursor" });
    svg.appendChild(grupoCursor);
    svg.appendChild(s("rect", { x: pL - passo / 2, y: topo1 - 4, width: largura + passo, height: base - topo1 + 8, class: "g-alvo" }));
    geo = { pL: pL, passo: passo, x: x, yC: yC, yT: yT, topo1: topo1, base: base, W: W, n: L.length };

    // descrição acessível e tabela alternativa
    var cl = L.map(function (l) { return l.cloro; }), tu = L.map(function (l) { return l.turbidez; });
    var nFora = L.filter(function (l) { return avaliar(l).pior === "fora"; }).length;
    $("#grafico-desc").textContent = est.nome + ", de " + hhmm(L[0].t) + " a " + hhmm(L[L.length - 1].t) +
      ". Cloro residual entre " + nf(Math.min.apply(null, cl), 2) + " e " + nf(Math.max.apply(null, cl), 2) + " mg/L (faixa 0,2 a 2,0). " +
      "Turbidez entre " + nf(Math.min.apply(null, tu), 1) + " e " + nf(Math.max.apply(null, tu), 1) + " NTU (limite 5,0). " +
      (nFora ? nFora + (nFora > 1 ? " leituras fora da faixa." : " leitura fora da faixa.") : "Nenhuma leitura fora da faixa.");
    var tb = $("#tabela-leituras tbody"); tb.innerHTML = "";
    L.slice().reverse().forEach(function (l) {
      var n = avaliar(l).niveis;
      var c = function (campo, txt) { return '<td class="num' + (n[campo] === "fora" ? " fora" : "") + '">' + txt + "</td>"; };
      tb.insertAdjacentHTML("beforeend", "<tr><td>" + hhmm(l.t) + (mesmoDia(l.t, agora) ? "" : " <small>(ontem)</small>") + "</td>" +
        c("cloro", nf(l.cloro, 2)) + c("turbidez", nf(l.turbidez, 1)) + c("ph", nf(l.ph, 1)) + '<td class="num">' + nf(l.vazao, 0) + "</td></tr>");
    });
    if (cursor != null) mostrarCursor(cursor);
  }

  function mostrarCursor(i) {
    var est = estacoes[selecionada], l = est.leituras[i], g = $("#g-cursor"), dica = $("#grafico-dica");
    if (!l || !geo) return;
    cursor = i;
    g.innerHTML = "";
    var cx = geo.x(i);
    g.appendChild(s("line", { x1: cx, x2: cx, y1: geo.topo1 - 4, y2: geo.base, class: "g-cursor" }));
    var n = avaliar(l).niveis;
    g.appendChild(s("circle", { cx: cx, cy: geo.yC(l.cloro), r: 5, class: "g-ponto" + (n.cloro === "fora" ? " g-ponto--fora" : "") }));
    g.appendChild(s("circle", { cx: cx, cy: geo.yT(l.turbidez), r: 5, class: "g-ponto" + (n.turbidez === "fora" ? " g-ponto--fora" : ""), style: "stroke:var(--tinta-2)" }));
    var v = function (campo, txt) { return n[campo] === "fora" ? '<span class="fora">' + txt + " (fora)</span>" : txt; };
    dica.innerHTML = "<b>" + hhmm(l.t) + (mesmoDia(l.t, agora) ? "" : " de ontem") + "</b><br>" +
      "Cloro: " + v("cloro", nf(l.cloro, 2) + " mg/L") + "<br>Turbidez: " + v("turbidez", nf(l.turbidez, 1) + " NTU") +
      "<br>pH: " + v("ph", nf(l.ph, 1)) + "<br>Vazão: " + nf(l.vazao, 0) + " L/s";
    dica.hidden = false;
    var larg = dica.offsetWidth;
    var esquerda = cx + 14 + larg > geo.W ? cx - 14 - larg : cx + 14;
    dica.style.left = Math.max(0, esquerda) + "px";
    dica.style.top = (geo.topo1 + 8) + "px";
  }
  function esconderCursor() { cursor = null; var g = $("#g-cursor"); if (g) g.innerHTML = ""; $("#grafico-dica").hidden = true; }

  function iniciarGrafico() {
    var svg = $("#grafico-svg");
    function indice(ev) {
      var r = svg.getBoundingClientRect(), px = (ev.clientX - r.left) * (geo.W / r.width);
      return Math.min(geo.n - 1, Math.max(0, Math.round((px - geo.pL) / geo.passo)));
    }
    svg.addEventListener("pointermove", function (ev) { if (geo) mostrarCursor(indice(ev)); });
    svg.addEventListener("pointerdown", function (ev) { if (geo) mostrarCursor(indice(ev)); });
    svg.addEventListener("pointerleave", function (ev) { if (ev.pointerType === "mouse") esconderCursor(); });
    svg.addEventListener("keydown", function (ev) {
      var n = geo.n, i = cursor == null ? n - 1 : cursor;
      if (ev.key === "ArrowLeft") i = Math.max(0, i - 1);
      else if (ev.key === "ArrowRight") i = Math.min(n - 1, i + 1);
      else if (ev.key === "Home") i = 0;
      else if (ev.key === "End") i = n - 1;
      else if (ev.key === "Escape") { esconderCursor(); return; }
      else return;
      ev.preventDefault();
      mostrarCursor(i);
    });
    svg.addEventListener("focus", function () { if (cursor == null) mostrarCursor(geo.n - 1); });
    svg.addEventListener("blur", esconderCursor);
    var t;
    var aoRedimensionar = function () { clearTimeout(t); t = setTimeout(renderGrafico, 60); };
    if ("ResizeObserver" in window) new ResizeObserver(aoRedimensionar).observe($("#grafico"));
    else window.addEventListener("resize", aoRedimensionar);
  }

  // ---------- Lançamento ----------
  var form = $("#form-leitura");
  function lerNumero(txt) {
    txt = String(txt).trim().replace(/\s/g, "");
    if (!txt) return { vazio: true };
    if (!/^\d+([.,]\d+)?$/.test(txt)) return { invalido: true };
    return { v: parseFloat(txt.replace(",", ".")) };
  }
  function validarCampo(nome, aoEnviar) {
    var input = form.elements[nome], campo = input.closest(".campo"), msg = campo.querySelector(".campo__msg");
    var r = lerNumero(input.value), nivel = "", texto = "";
    if (r.vazio) { if (aoEnviar) { nivel = "erro"; texto = "Informe " + ({ cloro: "o cloro residual", turbidez: "a turbidez", ph: "o pH", vazao: "a vazão" })[nome] + "."; } }
    else if (r.invalido) { nivel = "erro"; texto = "Use só números, com vírgula para decimais. Exemplo: 1,2."; }
    else {
      var v = r.v;
      if (nome === "cloro") {
        if (v > 10) { nivel = "erro"; texto = "Valor improvável para cloro residual. Confira o aparelho."; }
        else if (v < FAIXA.cloro.min) { nivel = "fora"; texto = "Abaixo de 0,2 mg/L: a rede fica sem proteção. Aumente a dosagem e colete de novo."; }
        else if (v > FAIXA.cloro.max) { nivel = "fora"; texto = "Acima de 2,0 mg/L: excesso de cloro. Reduza a dosagem."; }
        else if (v < FAIXA.cloro.atMin) { nivel = "atencao"; texto = "Perto do mínimo de 0,2 mg/L. Acompanhe a próxima leitura."; }
        else if (v > FAIXA.cloro.atMax) { nivel = "atencao"; texto = "Perto do máximo de 2,0 mg/L."; }
        else { nivel = "ok"; texto = "Dentro da faixa de 0,2 a 2,0 mg/L."; }
      } else if (nome === "turbidez") {
        if (v > 1000) { nivel = "erro"; texto = "Valor improvável. Confira a leitura do turbidímetro."; }
        else if (v > FAIXA.turbidez.max) { nivel = "fora"; texto = "Acima de 5,0 NTU: verifique filtros e decantadores antes de liberar a água."; }
        else if (v >= FAIXA.turbidez.at) { nivel = "atencao"; texto = "Perto do limite de 5,0 NTU."; }
        else { nivel = "ok"; texto = "Dentro do limite de 5,0 NTU."; }
      } else if (nome === "ph") {
        if (v > 14) { nivel = "erro"; texto = "O pH vai de 0 a 14."; }
        else if (v < FAIXA.ph.min) { nivel = "fora"; texto = "Abaixo de 6,0: água ácida. Ajuste a dosagem de cal."; }
        else if (v > FAIXA.ph.max) { nivel = "fora"; texto = "Acima de 9,5: água alcalina. Reduza a dosagem de cal."; }
        else if (v < FAIXA.ph.atMin || v > FAIXA.ph.atMax) { nivel = "atencao"; texto = "Perto do limite da faixa de 6,0 a 9,5."; }
        else { nivel = "ok"; texto = "Dentro da faixa de 6,0 a 9,5."; }
      } else if (nome === "vazao") {
        var cap = estacoes[+form.elements.estacao.value].cap;
        if (v <= 0) { nivel = "erro"; texto = "A vazão precisa ser maior que zero."; }
        else if (v > cap * 1.15) { nivel = "atencao"; texto = "Acima da capacidade da estação (" + cap + " L/s). Confira o medidor."; }
        else { nivel = "ok"; texto = "Capacidade da estação: " + cap + " L/s."; }
      }
    }
    if (nivel) campo.setAttribute("data-nivel", nivel); else campo.removeAttribute("data-nivel");
    msg.textContent = texto;
    input.setAttribute("aria-invalid", String(nivel === "erro" || nivel === "fora"));
    return { nivel: nivel, valor: r.v };
  }
  function validarHora(aoEnviar) {
    var input = form.elements.hora, campo = input.closest(".campo"), msg = $("#m-hora"), txt = "";
    if (!input.value) { if (aoEnviar) txt = "Informe a hora da coleta."; }
    else {
      var p = input.value.split(":"), d = new Date(agora); d.setHours(+p[0], +p[1], 0, 0);
      if (d.getTime() > Date.now() + 60000) txt = "A hora não pode ser depois de agora (" + hhmm(new Date()) + ").";
      else {
        var est = estacoes[+form.elements.estacao.value];
        if (d < est.leituras[0].t) txt = "Essa hora fica antes das 24 leituras exibidas.";
      }
    }
    if (txt) { campo.setAttribute("data-nivel", "erro"); input.setAttribute("aria-invalid", "true"); }
    else { campo.removeAttribute("data-nivel"); input.removeAttribute("aria-invalid"); }
    msg.textContent = txt;
    return !txt;
  }
  var PARAMS = ["cloro", "turbidez", "ph", "vazao"];
  function atualizarBotao() {
    var algumFora = PARAMS.some(function (n) { return form.elements[n].closest(".campo").getAttribute("data-nivel") === "fora"; });
    var btn = $("#btn-salvar");
    btn.classList.toggle("btn--alerta", algumFora);
    btn.classList.toggle("btn--sinal", !algumFora);
    btn.textContent = algumFora ? "Salvar leitura fora da faixa" : "Salvar leitura";
  }
  function horaAgora() { var d = new Date(); form.elements.hora.value = hhmm(d); }

  function iniciarFormulario() {
    var sel = form.elements.estacao;
    estacoes.forEach(function (e) { sel.appendChild(el("option", { value: e.id }, esc(e.nome + " (" + e.tipo + ")"))); });
    sel.value = String(selecionada);
    horaAgora();
    PARAMS.forEach(function (n) {
      form.elements[n].addEventListener("input", function () { validarCampo(n, false); atualizarBotao(); $("#retorno-leitura").textContent = ""; });
      form.elements[n].addEventListener("blur", function () { if (form.elements[n].value) validarCampo(n, false); });
    });
    form.elements.hora.addEventListener("input", function () { validarHora(false); });
    sel.addEventListener("change", function () {
      if (form.elements.vazao.value) validarCampo("vazao", false);
      validarHora(false);
      selecionar(+sel.value);
    });

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var okHora = validarHora(true);
      var res = {}, primeiroErro = null;
      PARAMS.forEach(function (n) {
        res[n] = validarCampo(n, true);
        if (res[n].nivel === "erro" && !primeiroErro) primeiroErro = form.elements[n];
      });
      atualizarBotao();
      var ret = $("#retorno-leitura");
      if (!okHora || primeiroErro) {
        ret.className = "retorno retorno--alerta";
        ret.textContent = "Corrija os campos marcados para salvar.";
        (okHora ? primeiroErro : form.elements.hora).focus();
        return;
      }
      var id = +form.elements.estacao.value, est = estacoes[id];
      var p = form.elements.hora.value.split(":"), t = new Date(agora); t.setHours(+p[0], +p[1], 0, 0);
      var l = { t: t, cloro: res.cloro.valor, turbidez: res.turbidez.valor, ph: res.ph.valor, vazao: res.vazao.valor, lancada: true };
      est.leituras.push(l);
      est.leituras.sort(function (a, b) { return a.t - b.t; });
      est.leituras = est.leituras.slice(-24);
      lancadas.push({ est: est.nome, l: l });

      var sit = situacao(est), av = avaliar(l);
      selecionada = id;
      recemIdx = est.leituras.indexOf(l);
      cursor = null;
      renderIndicadores(); renderEstacoes(id); renderGrafico();
      mostrarCursor(recemIdx);
      var foraTxt = motivos(l, "fora");
      ret.className = "retorno " + (av.pior === "fora" ? "retorno--alerta" : "retorno--ok");
      ret.textContent = "Leitura das " + hhmm(t) + " salva na " + est.nome + ". " +
        (av.pior === "fora" ? "Fora da faixa: " + foraTxt.join(", ") + ". Ocorrência registrada no boletim." : "Situação da estação: " + SIT_TEXTO[sit].toLowerCase() + ".");
      PARAMS.forEach(function (n) {
        form.elements[n].value = "";
        var c = form.elements[n].closest(".campo"); c.removeAttribute("data-nivel"); c.querySelector(".campo__msg").textContent = "";
        form.elements[n].removeAttribute("aria-invalid");
      });
      atualizarBotao();
      horaAgora();
      if (window.matchMedia("(max-width: 1039px)").matches) {
        $("#grafico").scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
      }
    });

    Array.prototype.forEach.call(document.querySelectorAll("[data-exemplo]"), function (b) {
      b.addEventListener("click", function () {
        var ok = b.getAttribute("data-exemplo") === "ok";
        var est = estacoes[+form.elements.estacao.value];
        var vals = ok ? { cloro: "1,15", turbidez: "0,9", ph: "7,2", vazao: String(Math.round(est.cap * 0.8)) }
                      : { cloro: "0,12", turbidez: "6,8", ph: "7,0", vazao: String(Math.round(est.cap * 0.85)) };
        PARAMS.forEach(function (n) { form.elements[n].value = vals[n]; validarCampo(n, false); });
        horaAgora(); validarHora(false);
        atualizarBotao();
        $("#retorno-leitura").textContent = "";
        $("#btn-salvar").focus();
      });
    });
  }

  // ---------- Estoque ----------
  var LIM_ALERTA = 7, LIM_ATENCAO = 15;
  function sitEstoque(p) { var d = p.saldo / p.cons; return d < LIM_ALERTA ? "fora" : d < LIM_ATENCAO ? "atencao" : "ok"; }
  function renderEstoque(destacar) {
    var tb = $("#tabela-estoque tbody"); tb.innerHTML = "";
    estoque.forEach(function (p, i) {
      var dias = p.saldo / p.cons, sit = sitEstoque(p);
      var fim = new Date(agora.getTime() + dias * 86400000);
      var nota = sit === "fora" ? "compre já, acaba em " : sit === "atencao" ? "programe compra, acaba em " : "até ";
      var tr = el("tr", destacar === i ? { class: "recem" } : null);
      tr.innerHTML =
        "<td>" + esc(p.nome) + '<span class="sub">' + esc(p.uso) + "</span></td>" +
        '<td class="num" data-rotulo="Saldo">' + nf(p.saldo, 0) + " " + p.unid + "</td>" +
        '<td class="num" data-rotulo="Consumo/dia">' + nf(p.cons, p.cons % 1 ? 1 : 0) + " " + p.unid + "</td>" +
        '<td><div class="dias" data-sit="' + sit + '">' +
          '<div class="dias__trilho" aria-hidden="true"><div class="dias__barra" style="width:' + Math.min(100, dias / 45 * 100).toFixed(0) + '%"></div></div>' +
          '<span class="dias__texto">' + nf(dias, dias < 10 ? 1 : 0) + " dias" + (sit !== "ok" ? '<span class="sr-only"> (' + (sit === "fora" ? "alerta" : "atenção") + ")</span>" : "") +
          "<small>" + nota + fim.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) + "</small></span></div></td>";
      tb.appendChild(tr);
    });
  }
  function iniciarEstoque() {
    var dlg = $("#dlg-entrada"), f = $("#form-entrada"), sel = f.elements.produto, qtd = f.elements.qtd;
    estoque.forEach(function (p, i) { sel.appendChild(el("option", { value: i }, esc(p.nome))); });
    sel.addEventListener("change", function () { $("#e-unid").textContent = estoque[+sel.value].unid; });
    var abrir = $("#btn-entrada");
    abrir.addEventListener("click", function () {
      var urg = estoque.reduce(function (m, p, i) { return p.saldo / p.cons < estoque[m].saldo / estoque[m].cons ? i : m; }, 0);
      sel.value = String(urg); qtd.value = ""; f.elements.nota.value = "";
      qtd.closest(".campo").removeAttribute("data-nivel"); $("#m-qtd").textContent = "";
      if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
      qtd.focus();
    });
    $("#btn-cancelar").addEventListener("click", function () { dlg.close(); });
    dlg.addEventListener("close", function () { abrir.focus(); });
    f.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var r = lerNumero(qtd.value), campo = qtd.closest(".campo");
      if (r.vazio || r.invalido || r.v <= 0) {
        campo.setAttribute("data-nivel", "erro");
        $("#m-qtd").textContent = r.vazio ? "Informe a quantidade recebida." : "Use um número maior que zero. Exemplo: 500.";
        qtd.setAttribute("aria-invalid", "true"); qtd.focus(); return;
      }
      qtd.removeAttribute("aria-invalid");
      var i = +sel.value, p = estoque[i];
      p.saldo += r.v;
      renderEstoque(i);
      var nota = f.elements.nota.value.trim();
      $("#retorno-estoque").className = "retorno retorno--ok";
      $("#retorno-estoque").textContent = "Entrada de " + nf(r.v, r.v % 1 ? 1 : 0) + " " + p.unid + " de " + p.nome.toLowerCase() + " registrada" +
        (nota ? " (NF " + nota + ")" : "") + ". Saldo agora: " + nf(p.saldo, 0) + " " + p.unid + ", " + nf(p.saldo / p.cons, 1) + " dias.";
      dlg.close();
    });
  }

  // ---------- Boletim ----------
  function gerarBoletim() {
    var b = $("#boletim"), gerado = new Date();
    var cont = { ok: 0, atencao: 0, fora: 0 }, total = 0, ocorr = [];
    var linhas = estacoes.map(function (e) {
      var hoje = e.leituras.filter(function (l) { return mesmoDia(l.t, agora); });
      if (!hoje.length) hoje = e.leituras.slice(-1);
      total += hoje.length;
      var sit = situacao(e); cont[sit]++;
      hoje.forEach(function (l) {
        var m = motivos(l, "fora");
        if (m.length) ocorr.push({ t: l.t, est: e.nome, txt: m.join(", "), lancada: l.lancada });
      });
      var cl = hoje.map(function (l) { return l.cloro; }), tu = hoje.map(function (l) { return l.turbidez; });
      var media = function (arr) { return arr.reduce(function (a, b) { return a + b; }, 0) / arr.length; };
      return "<tr><td>" + esc(e.nome) + "</td><td class=\"num\">" + hoje.length + "</td>" +
        '<td class="num' + (cl.some(function (v) { return nivelCloro(v) === "fora"; }) ? " fora" : "") + '">' + nf(Math.min.apply(null, cl), 2) + " a " + nf(Math.max.apply(null, cl), 2) + "</td>" +
        '<td class="num' + (Math.max.apply(null, tu) > 5 ? " fora" : "") + '">' + nf(Math.max.apply(null, tu), 1) + "</td>" +
        '<td class="num">' + nf(media(hoje.map(function (l) { return l.ph; })), 1) + "</td>" +
        '<td class="num">' + nf(media(hoje.map(function (l) { return l.vazao; })), 0) + "</td>" +
        '<td><span class="estado ' + SIT_CLASSE[sit] + '">' + SIT_TEXTO[sit] + "</span></td></tr>";
    }).join("");
    ocorr.sort(function (a, b) { return a.t - b.t; });
    var est = estoque.filter(function (p) { return sitEstoque(p) !== "ok"; });

    b.innerHTML =
      '<header class="boletim__topo"><div><h3>Boletim operacional do dia</h3><p>Regional Demonstração, ' +
        agora.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }) + "</p></div>" +
        "<p>Gerado às " + hhmm(gerado) + "<br>Dados fictícios de demonstração</p></header>" +
      '<dl class="boletim__resumo">' +
        "<div><dt>Estações normais</dt><dd>" + cont.ok + " de " + estacoes.length + "</dd></div>" +
        "<div><dt>Leituras do dia</dt><dd>" + total + "</dd></div>" +
        "<div><dt>Ocorrências</dt><dd>" + ocorr.length + "</dd></div>" +
        "<div><dt>Produtos para comprar</dt><dd>" + est.length + "</dd></div></dl>" +
      "<h4>Qualidade da água por estação</h4>" +
      '<div class="rolagem-tabela"><table class="tabela"><thead><tr><th scope="col">Estação</th><th scope="col" class="num">Leituras</th>' +
        '<th scope="col" class="num">Cloro (mg/L)</th><th scope="col" class="num">Turbidez máx. (NTU)</th><th scope="col" class="num">pH médio</th>' +
        '<th scope="col" class="num">Vazão média (L/s)</th><th scope="col">Situação</th></tr></thead><tbody>' + linhas + "</tbody></table></div>" +
      "<h4>Ocorrências fora da faixa</h4>" +
      (ocorr.length ? "<ul>" + ocorr.map(function (o) { return "<li><b>" + hhmm(o.t) + "</b>, " + esc(o.est) + ": " + esc(o.txt) + (o.lancada ? " (lançada nesta sessão)" : "") + "</li>"; }).join("") + "</ul>"
                    : "<p>Nenhuma leitura fora da faixa hoje.</p>") +
      "<h4>Estoque de produtos químicos</h4>" +
      (est.length ? "<ul>" + est.map(function (p) { return "<li>" + esc(p.nome) + ": " + nf(p.saldo, 0) + " " + p.unid + ", " + nf(p.saldo / p.cons, 1) + " dias de consumo" + (sitEstoque(p) === "fora" ? " (comprar já)" : " (programar compra)") + "</li>"; }).join("") + "</ul>"
                  : "<p>Todos os produtos com mais de " + LIM_ATENCAO + " dias de consumo.</p>") +
      '<div class="boletim__assina"><span>Operador responsável</span><span>Supervisor da regional</span></div>' +
      '<div class="boletim__acoes"><button type="button" class="btn btn--sinal" id="btn-imprimir">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 9V3h10v6M7 17H4v-7h16v7h-3M7 14h10v7H7z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>' +
        "Imprimir ou salvar em PDF</button></div>";
    b.hidden = false;
    $("#btn-boletim").lastChild.textContent = " Gerar de novo";
    $("#btn-imprimir").addEventListener("click", function () { window.print(); });
    b.setAttribute("tabindex", "-1");
    b.focus({ preventScroll: true });
    b.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  }

  // ---------- Início ----------
  iniciarTopo();
  renderIndicadores();
  renderEstacoes();
  iniciarFormulario();
  renderGrafico();
  iniciarGrafico();
  renderEstoque();
  iniciarEstoque();
  $("#btn-boletim").addEventListener("click", gerarBoletim);
})();
