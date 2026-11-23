/* Medições de obra — demonstração com dados fictícios, estado só em memória. */
(function () {
  "use strict";

  const DIAMETROS = ['1/2"', '3/4"', '1"', '1 1/2"', '2"'];
  const TIPOS_HID = ["Água fria", "Água quente", "Esgoto"];
  const SERVICOS = [
    { id: "furacao", nome: "Furação", letra: "F" },
    { id: "pintura", nome: "Pintura", letra: "P" },
    { id: "hidraulica", nome: "Hidráulica", letra: "H" },
  ];
  const ESTADO_TXT = { nada: "não iniciada", andamento: "em andamento", ok: "concluída" };

  const n0 = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
  const n1 = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const n2 = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const pct = (p) => n0.format(Math.round(p * 100)) + "%";
  const dataBR = (iso) => iso.split("-").reverse().join("/");
  const hojeISO = () => {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const $ = (sel, raiz = document) => raiz.querySelector(sel);

  let seq = 1;
  const novoId = () => "m" + seq++;

  // ---------- Dados fictícios ----------
  function rng(semente) {
    let a = semente >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const limitar = (v) => Math.max(0, Math.min(1, v));

  function criarObra(cfg) {
    const r = rng(cfg.semente);
    const obra = { id: cfg.id, nome: cfg.nome, local: cfg.local, inicio: cfg.inicio, colunas: cfg.colunas, peDireito: cfg.peDireito, pavimentos: [] };
    for (let p = 1; p <= cfg.pavimentos; p++) {
      const pav = { n: p, nome: p + "º pavimento", curto: p + "º pav.", nivel: p * cfg.peDireito, aptos: [] };
      for (let c = 1; c <= cfg.colunas; c++) {
        const apto = {
          id: String(p * 100 + c),
          pav: p,
          plano: {
            furos: Object.fromEntries(DIAMETROS.map((d, i) => [d, Math.round(cfg.furos[i] * (c === 1 || c === cfg.colunas ? 1.15 : 1))])),
            comodos: cfg.comodos.map(([nome, area]) => ({ nome, area })),
            demaos: 2,
            pontos: Object.fromEntries(TIPOS_HID.map((t, i) => [t, cfg.pontos[i]])),
          },
          med: { furacao: [], pintura: [], hidraulica: [] },
          fotos: [],
        };
        // Andares de baixo andam na frente; furação vem antes da hidráulica, que vem antes da pintura.
        const base = 1.65 - (p - 1) * (1.6 / cfg.pavimentos) + (r() - 0.5) * 0.25;
        semear(apto, limitar(base), limitar(base - 0.25 + (r() - 0.5) * 0.2), limitar(base - 0.55 + (r() - 0.5) * 0.2), r);
        pav.aptos.push(apto);
      }
      obra.pavimentos.push(pav);
    }
    return obra;
  }

  function dataSemente(r) {
    const dia = 3 + Math.floor(r() * 18);
    return "2026-11-" + String(dia).padStart(2, "0");
  }

  function semear(apto, fFur, fHid, fPin, r) {
    const pl = apto.plano;
    DIAMETROS.forEach((d) => {
      const q = Math.round(pl.furos[d] * fFur);
      if (q > 0) apto.med.furacao.push({ id: novoId(), data: dataSemente(r), diametro: d, qtd: q, prof: d === '2"' || d === '1 1/2"' ? 20 : 15 });
    });
    TIPOS_HID.forEach((t) => {
      const q = Math.round(pl.pontos[t] * fHid);
      if (q > 0) apto.med.hidraulica.push({ id: novoId(), data: dataSemente(r), tipo: t, qtd: q });
    });
    const etapas = Math.round(pl.comodos.length * pl.demaos * fPin);
    for (let i = 0; i < etapas; i++) {
      const demao = Math.floor(i / pl.comodos.length) + 1;
      const cm = pl.comodos[i % pl.comodos.length];
      apto.med.pintura.push({ id: novoId(), data: dataSemente(r), comodo: cm.nome, demao, m2: cm.area });
    }
  }

  const obras = [
    criarObra({
      id: "residencial", nome: "Residencial Exemplo — Bloco A", local: "Obra fictícia, 6 pavimentos tipo com 4 apartamentos",
      inicio: "2026-03-02", colunas: 4, pavimentos: 6, peDireito: 2.88, semente: 7,
      furos: [24, 16, 10, 6, 4],
      comodos: [["Sala", 38.5], ["Quarto 1", 29.2], ["Quarto 2", 26.4], ["Cozinha", 22.8], ["Banheiro", 18.6], ["Área de serviço", 12.3]],
      pontos: [12, 6, 8],
    }),
    criarObra({
      id: "edificio", nome: "Edifício Modelo", local: "Obra fictícia, 9 pavimentos tipo com 2 apartamentos",
      inicio: "2026-01-12", colunas: 2, pavimentos: 9, peDireito: 3.06, semente: 21,
      furos: [34, 22, 14, 8, 6],
      comodos: [["Sala", 52.4], ["Suíte", 36.1], ["Quarto 1", 30.8], ["Quarto 2", 28.6], ["Cozinha", 27.5], ["Banheiro social", 19.4], ["Banheiro da suíte", 17.9], ["Área de serviço", 14.2]],
      pontos: [18, 9, 12],
    }),
  ];

  // ---------- Cálculos ----------
  function somaPor(lista, chave, valor) {
    const s = {};
    lista.forEach((m) => { s[m[chave]] = (s[m[chave]] || 0) + valor(m); });
    return s;
  }
  function furosExec(a) { return somaPor(a.med.furacao, "diametro", (m) => m.qtd); }
  function metrosExec(a) { return somaPor(a.med.furacao, "diametro", (m) => (m.qtd * m.prof) / 100); }
  function pontosExec(a) { return somaPor(a.med.hidraulica, "tipo", (m) => m.qtd); }
  function pinturaPorComodo(a) {
    const s = {};
    a.med.pintura.forEach((m) => {
      s[m.comodo] = s[m.comodo] || {};
      s[m.comodo][m.demao] = (s[m.comodo][m.demao] || 0) + m.m2;
    });
    return s;
  }
  function m2Pintados(a) { return a.med.pintura.reduce((t, m) => t + m.m2, 0); }
  function m2Previstos(a) { return a.plano.comodos.reduce((t, c) => t + c.area, 0) * a.plano.demaos; }
  const somaObj = (o) => Object.values(o).reduce((t, v) => t + v, 0);

  function progressoCapado(prev, exec) {
    const total = somaObj(prev);
    if (!total) return 0;
    let feito = 0;
    Object.keys(prev).forEach((k) => { feito += Math.min(exec[k] || 0, prev[k]); });
    return feito / total;
  }
  function progresso(a, servico) {
    if (servico === "furacao") return progressoCapado(a.plano.furos, furosExec(a));
    if (servico === "hidraulica") return progressoCapado(a.plano.pontos, pontosExec(a));
    const pc = pinturaPorComodo(a);
    let feito = 0;
    a.plano.comodos.forEach((c) => {
      for (let d = 1; d <= a.plano.demaos; d++) feito += Math.min((pc[c.nome] && pc[c.nome][d]) || 0, c.area);
    });
    return feito / m2Previstos(a);
  }
  function estado(p) { return p <= 0 ? "nada" : p >= 0.999 ? "ok" : "andamento"; }
  function aptoConcluido(a) { return SERVICOS.every((s) => progresso(a, s.id) >= 0.999); }

  // ---------- Estado da tela ----------
  const ui = { obra: obras[0], sel: { tipo: "apto", id: "301" }, aba: "furacao" };
  const todosAptos = (obra) => obra.pavimentos.flatMap((p) => p.aptos);
  const achaApto = (id) => todosAptos(ui.obra).find((a) => a.id === id);
  const achaPav = (n) => ui.obra.pavimentos.find((p) => p.n === n);

  // ---------- Ícones ----------
  const ICONE = {
    lixo: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    mais: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
    camera: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="12" cy="13" r="3.5" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    voltar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    impressora: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 9V3h10v6M7 17H4v-8h16v8h-3M7 14h10v7H7z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
  };

  // ---------- Obra e totais ----------
  function renderObras() {
    $("#lista-obras").innerHTML = obras.map((o) => `
      <label class="opcao-obra">
        <input type="radio" name="obra" value="${o.id}" ${o === ui.obra ? "checked" : ""}>
        <span>${esc(o.nome)}</span>
      </label>`).join("");
  }

  function renderCabecalho() {
    const o = ui.obra;
    $("#titulo-obra").textContent = o.nome;
    const aptos = todosAptos(o);
    $("#meta-obra").textContent = `${o.local}. Início em ${dataBR(o.inicio)}.`;
    let furos = 0, metros = 0, m2 = 0, m2p = 0, pts = 0;
    aptos.forEach((a) => {
      furos += somaObj(furosExec(a)); metros += somaObj(metrosExec(a));
      m2 += m2Pintados(a); m2p += m2Previstos(a); pts += somaObj(pontosExec(a));
    });
    const concl = aptos.filter(aptoConcluido).length;
    $("#totais").innerHTML = `
      <div class="total"><dt>Furos executados</dt><dd>${n0.format(furos)}</dd><dd class="total__sub">${n1.format(metros)} m perfurados</dd></div>
      <div class="total"><dt>Pintura</dt><dd>${n0.format(m2)} m²</dd><dd class="total__sub">de ${n0.format(m2p)} m² previstos</dd></div>
      <div class="total"><dt>Pontos hidráulicos</dt><dd>${n0.format(pts)}</dd><dd class="total__sub">instalados</dd></div>
      <div class="total total--destaque"><dt>Apartamentos concluídos</dt><dd>${concl}<small>/${aptos.length}</small></dd><dd class="total__sub">nos três serviços</dd></div>`;
  }

  // ---------- Corte do prédio ----------
  function rotuloApto(a) {
    const partes = SERVICOS.map((s) => {
      const p = progresso(a, s.id);
      return `${s.nome}: ${ESTADO_TXT[estado(p)]}${p > 0 && p < 0.999 ? " (" + pct(p) + ")" : ""}`;
    });
    return `Apartamento ${a.id}, ${a.pav}º pavimento. ${partes.join("; ")}.`;
  }

  function htmlApto(a) {
    const ativo = ui.sel.tipo === "apto" && ui.sel.id === a.id;
    const barras = SERVICOS.map((s) => {
      const p = progresso(a, s.id);
      return `<span class="barra barra--${estado(p)}"><i>${s.letra}</i><span class="barra__trilho"><span style="width:${Math.max(p > 0 ? 6 : 0, p * 100)}%"></span></span></span>`;
    }).join("");
    return `<button type="button" class="apto${ativo ? " is-ativo" : ""}${aptoConcluido(a) ? " apto--pronto" : ""}" data-apto="${a.id}" aria-label="${esc(rotuloApto(a))}" ${ativo ? 'aria-current="true"' : ""}>
      <span class="apto__num" aria-hidden="true">${a.id}</span><span class="apto__barras" aria-hidden="true">${barras}</span></button>`;
  }

  function renderCorte() {
    const o = ui.obra;
    const cols = o.colunas;
    const andares = [...o.pavimentos].reverse().map((p) => {
      const ativo = ui.sel.tipo === "pav" && ui.sel.id === p.n;
      return `<div class="pav" role="group" aria-label="${p.nome}">
        <button type="button" class="cota${ativo ? " is-ativo" : ""}" data-pav="${p.n}" aria-label="Resumo do ${p.nome}, nível mais ${n2.format(p.nivel)} metros" ${ativo ? 'aria-current="true"' : ""}>
          <svg viewBox="0 0 12 8" aria-hidden="true"><path d="M0 0h12L6 8z"/></svg>
          <span class="cota__nivel">+${n2.format(p.nivel)}</span><span class="cota__nome">${p.curto}</span>
        </button>
        <div class="pav__aptos">${p.aptos.map(htmlApto).join("")}</div>
      </div>`;
    }).join("");
    $("#corte").style.setProperty("--cols", cols);
    $("#corte").innerHTML = `
      <div class="corte__cobertura" aria-hidden="true"><span class="cota cota--fixa"><span class="cota__nome">Cobertura</span></span><div class="cobertura"><span class="caixa-dagua"></span></div></div>
      ${andares}
      <div class="pav pav--terreo" aria-hidden="true">
        <span class="cota cota--fixa"><svg viewBox="0 0 12 8"><path d="M0 0h12L6 8z"/></svg><span class="cota__nivel">±0,00</span><span class="cota__nome">Térreo</span></span>
        <div class="pilotis">${'<span class="pilar"></span>'.repeat(cols + 1)}</div>
      </div>
      <div class="terreno" aria-hidden="true"><span class="cota cota--fixa"></span><div class="terreno__solo"></div></div>`;
  }

  // ---------- Painel de detalhe ----------
  function chipsEstado(a) {
    return `<ul class="chips">${SERVICOS.map((s) => {
      const p = progresso(a, s.id), e = estado(p);
      const cls = e === "ok" ? "estado--ok" : e === "andamento" ? "estado--sinal" : "estado--nada";
      return `<li class="estado ${cls}">${s.nome}: ${ESTADO_TXT[e]}${e === "andamento" ? ", " + pct(p) : ""}</li>`;
    }).join("")}</ul>`;
  }

  function renderDetalhe() {
    const box = $("#detalhe");
    if (ui.sel.tipo === "pav") { box.innerHTML = htmlPavimento(achaPav(ui.sel.id)); return; }
    const a = achaApto(ui.sel.id);
    const abas = [...SERVICOS.map((s) => ({ id: s.id, nome: s.nome })), { id: "fotos", nome: `Fotos${a.fotos.length ? " (" + a.fotos.length + ")" : ""}` }];
    box.innerHTML = `
      <div class="detalhe__cabeca">
        <div>
          <p class="detalhe__onde"><button type="button" class="link-pav" data-pav="${a.pav}">${a.pav}º pavimento</button></p>
          <h2 id="titulo-detalhe" class="detalhe__titulo">Apartamento ${a.id}</h2>
        </div>
        ${chipsEstado(a)}
      </div>
      <div class="abas" role="tablist" aria-label="Serviços do apartamento ${a.id}">
        ${abas.map((t) => `<button type="button" role="tab" class="aba" id="aba-${t.id}" aria-controls="conteudo-aba" aria-selected="${ui.aba === t.id}" tabindex="${ui.aba === t.id ? 0 : -1}" data-aba="${t.id}">${t.nome}</button>`).join("")}
      </div>
      <div class="aba-conteudo" id="conteudo-aba" role="tabpanel" aria-labelledby="aba-${ui.aba}">
        ${ui.aba === "furacao" ? htmlFuracao(a) : ui.aba === "pintura" ? htmlPintura(a) : ui.aba === "hidraulica" ? htmlHidraulica(a) : htmlFotos(a)}
      </div>`;
  }

  function linhaProgresso(p) {
    const e = estado(p);
    return `<span class="mini mini--${e}" aria-hidden="true"><span style="width:${Math.min(100, p * 100)}%"></span></span>`;
  }

  function htmlHistorico(a, servico, descrever) {
    const lista = [...a.med[servico]].sort((x, y) => (x.data < y.data ? 1 : x.data > y.data ? -1 : 0));
    if (!lista.length) return `<p class="vazio">Nenhuma medição lançada neste serviço. Use o formulário acima para lançar a primeira.</p>`;
    return `<ol class="historico">${lista.map((m) => `
      <li><time datetime="${m.data}">${dataBR(m.data)}</time><span>${descrever(m)}</span>
        <button type="button" class="btn-icone" data-excluir="${m.id}" data-servico="${servico}" aria-label="Excluir medição de ${dataBR(m.data)}: ${esc(descrever(m).replace(/<[^>]+>/g, ""))}">${ICONE.lixo}</button></li>`).join("")}</ol>`;
  }

  function campoData() {
    return `<div class="campo"><label for="f-data">Data</label><input id="f-data" name="data" type="date" required value="${hojeISO()}" max="${hojeISO()}"></div>`;
  }
  function rodapeForm(texto) {
    return `<div class="form__rodape"><p class="form__erro" id="f-erro" role="alert"></p><button type="submit" class="btn btn--sinal">${ICONE.mais}${texto}</button></div>`;
  }

  function htmlFuracao(a) {
    const ex = furosExec(a), mt = metrosExec(a);
    const linhas = DIAMETROS.map((d) => {
      const prev = a.plano.furos[d], e = ex[d] || 0;
      return `<tr><th scope="row">${d}</th><td class="num">${prev}</td><td class="num">${e}${e > prev ? ' <span class="acima">acima do previsto</span>' : ""}</td><td class="num">${n2.format(mt[d] || 0)}</td><td class="col-barra">${linhaProgresso(prev ? e / prev : 0)}</td></tr>`;
    }).join("");
    return `
      <div class="rolagem"><table class="tabela">
        <caption class="sr-only">Furação por diâmetro no apartamento ${a.id}</caption>
        <thead><tr><th scope="col">Diâmetro</th><th scope="col" class="num">Previsto</th><th scope="col" class="num">Executado</th><th scope="col" class="num">Metros</th><th scope="col" class="col-barra"><span class="sr-only">Andamento</span></th></tr></thead>
        <tbody>${linhas}</tbody>
        <tfoot><tr><th scope="row">Total</th><td class="num">${somaObj(a.plano.furos)}</td><td class="num">${somaObj(ex)}</td><td class="num">${n2.format(somaObj(mt))}</td><td class="col-barra"></td></tr></tfoot>
      </table></div>
      <form class="form" data-form="furacao" novalidate>
        <h3 class="h-form">Lançar medição de furação</h3>
        <div class="form__campos">
          <div class="campo"><label for="f-diam">Diâmetro</label><select id="f-diam" name="diametro">${DIAMETROS.map((d) => `<option value='${d}'>${d}</option>`).join("")}</select></div>
          <div class="campo"><label for="f-qtd">Furos</label><input id="f-qtd" name="qtd" type="number" inputmode="numeric" min="1" max="500" step="1" required></div>
          <div class="campo"><label for="f-prof">Profundidade (cm)</label><input id="f-prof" name="prof" type="number" inputmode="decimal" min="1" max="100" step="0.5" value="15" required></div>
          ${campoData()}
        </div>
        ${rodapeForm("Lançar medição")}
      </form>
      <h3 class="h-form">Medições lançadas</h3>
      ${htmlHistorico(a, "furacao", (m) => `<b>${m.qtd} furos</b> de ${m.diametro}, ${n1.format(m.prof)} cm`)}`;
  }

  function htmlPintura(a) {
    const pc = pinturaPorComodo(a);
    const linhas = a.plano.comodos.map((c) => {
      const feitas = [];
      let pintado = 0;
      for (let d = 1; d <= a.plano.demaos; d++) {
        const v = (pc[c.nome] && pc[c.nome][d]) || 0;
        pintado += Math.min(v, c.area);
        if (v >= c.area - 0.001) feitas.push(d);
      }
      return `<tr><th scope="row">${c.nome}</th><td class="num">${n1.format(c.area)}</td><td class="num">${feitas.length} de ${a.plano.demaos}</td><td class="col-barra">${linhaProgresso(pintado / (c.area * a.plano.demaos))}</td></tr>`;
    }).join("");
    const opcoes = a.plano.comodos.map((c) => `<option value="${esc(c.nome)}" data-area="${c.area}">${esc(c.nome)}</option>`).join("");
    return `
      <div class="rolagem"><table class="tabela">
        <caption class="sr-only">Pintura por cômodo no apartamento ${a.id}</caption>
        <thead><tr><th scope="col">Cômodo</th><th scope="col" class="num">Área (m²)</th><th scope="col" class="num">Demãos</th><th scope="col" class="col-barra"><span class="sr-only">Andamento</span></th></tr></thead>
        <tbody>${linhas}</tbody>
        <tfoot><tr><th scope="row">Total pintado</th><td class="num" colspan="2">${n1.format(m2Pintados(a))} de ${n1.format(m2Previstos(a))} m²</td><td class="col-barra"></td></tr></tfoot>
      </table></div>
      <form class="form" data-form="pintura" novalidate>
        <h3 class="h-form">Lançar medição de pintura</h3>
        <div class="form__campos">
          <div class="campo"><label for="f-comodo">Cômodo</label><select id="f-comodo" name="comodo">${opcoes}</select></div>
          <div class="campo"><label for="f-demao">Demão</label><select id="f-demao" name="demao">${Array.from({ length: a.plano.demaos }, (_, i) => `<option value="${i + 1}">${i + 1}ª demão</option>`).join("")}</select></div>
          <div class="campo"><label for="f-qtd">Área pintada (m²)</label><input id="f-qtd" name="m2" type="number" inputmode="decimal" min="0.1" max="500" step="0.1" value="${a.plano.comodos[0].area}" required></div>
          ${campoData()}
        </div>
        ${rodapeForm("Lançar medição")}
      </form>
      <h3 class="h-form">Medições lançadas</h3>
      ${htmlHistorico(a, "pintura", (m) => `<b>${n1.format(m.m2)} m²</b> em ${esc(m.comodo)}, ${m.demao}ª demão`)}`;
  }

  function htmlHidraulica(a) {
    const ex = pontosExec(a);
    const linhas = TIPOS_HID.map((t) => {
      const prev = a.plano.pontos[t], e = ex[t] || 0;
      return `<tr><th scope="row">${t}</th><td class="num">${prev}</td><td class="num">${e}${e > prev ? ' <span class="acima">acima do previsto</span>' : ""}</td><td class="col-barra">${linhaProgresso(prev ? e / prev : 0)}</td></tr>`;
    }).join("");
    return `
      <div class="rolagem"><table class="tabela">
        <caption class="sr-only">Pontos hidráulicos no apartamento ${a.id}</caption>
        <thead><tr><th scope="col">Rede</th><th scope="col" class="num">Previstos</th><th scope="col" class="num">Instalados</th><th scope="col" class="col-barra"><span class="sr-only">Andamento</span></th></tr></thead>
        <tbody>${linhas}</tbody>
        <tfoot><tr><th scope="row">Total</th><td class="num">${somaObj(a.plano.pontos)}</td><td class="num">${somaObj(ex)}</td><td class="col-barra"></td></tr></tfoot>
      </table></div>
      <form class="form" data-form="hidraulica" novalidate>
        <h3 class="h-form">Lançar pontos instalados</h3>
        <div class="form__campos">
          <div class="campo"><label for="f-tipo">Rede</label><select id="f-tipo" name="tipo">${TIPOS_HID.map((t) => `<option>${t}</option>`).join("")}</select></div>
          <div class="campo"><label for="f-qtd">Pontos</label><input id="f-qtd" name="qtd" type="number" inputmode="numeric" min="1" max="100" step="1" required></div>
          ${campoData()}
        </div>
        ${rodapeForm("Lançar medição")}
      </form>
      <h3 class="h-form">Medições lançadas</h3>
      ${htmlHistorico(a, "hidraulica", (m) => `<b>${m.qtd} ${m.qtd === 1 ? "ponto" : "pontos"}</b> de ${m.tipo.toLowerCase()}`)}`;
  }

  function htmlFotos(a) {
    const miniaturas = a.fotos.length
      ? `<ul class="fotos">${a.fotos.map((f, i) => `
          <li><figure><img src="${f.url}" alt="Foto ${i + 1} do apartamento ${a.id}: ${esc(f.nome)}" loading="lazy"><figcaption><span>${esc(f.nome)}</span><time datetime="${f.data}">${dataBR(f.data)}</time></figcaption></figure>
          <button type="button" class="btn-icone btn-icone--foto" data-foto="${i}" aria-label="Remover foto ${esc(f.nome)}">${ICONE.lixo}</button></li>`).join("")}</ul>`
      : `<p class="vazio">Nenhuma foto neste apartamento. Adicione fotos do serviço executado para anexar ao registro.</p>`;
    return `
      <div class="enviar-foto">
        <label class="btn btn--sinal" for="f-fotos">${ICONE.camera}Adicionar fotos</label>
        <input id="f-fotos" class="sr-only" type="file" accept="image/*" multiple>
        <p class="dica">As fotos ficam só neste navegador e somem ao recarregar a página.</p>
      </div>
      ${miniaturas}`;
  }

  function htmlPavimento(p) {
    const linhas = p.aptos.map((a) => `<tr>
      <th scope="row"><button type="button" class="link-apto" data-apto="${a.id}">Apto ${a.id}</button></th>
      ${SERVICOS.map((s) => { const v = progresso(a, s.id); return `<td class="num"><span class="pct pct--${estado(v)}">${pct(v)}</span></td>`; }).join("")}
    </tr>`).join("");
    let furos = 0, metros = 0, m2 = 0, pts = 0;
    p.aptos.forEach((a) => { furos += somaObj(furosExec(a)); metros += somaObj(metrosExec(a)); m2 += m2Pintados(a); pts += somaObj(pontosExec(a)); });
    return `
      <div class="detalhe__cabeca">
        <div>
          <p class="detalhe__onde">Nível +${n2.format(p.nivel)} m</p>
          <h2 id="titulo-detalhe" class="detalhe__titulo">${p.nome}</h2>
        </div>
      </div>
      <p class="resumo-pav">${n0.format(furos)} furos (${n1.format(metros)} m), ${n0.format(m2)} m² pintados e ${n0.format(pts)} pontos hidráulicos neste andar.</p>
      <div class="rolagem"><table class="tabela">
        <caption class="sr-only">Andamento por apartamento no ${p.nome}</caption>
        <thead><tr><th scope="col">Apartamento</th>${SERVICOS.map((s) => `<th scope="col" class="num">${s.nome}</th>`).join("")}</tr></thead>
        <tbody>${linhas}</tbody>
      </table></div>
      <p class="dica">Escolha um apartamento para lançar medições.</p>`;
  }

  // ---------- Ações ----------
  function avisar(txt) {
    const el = $("#aviso");
    el.textContent = txt;
    el.classList.add("is-visivel");
    clearTimeout(avisar.t);
    avisar.t = setTimeout(() => el.classList.remove("is-visivel"), 3800);
  }

  function renderTudo() { renderCabecalho(); renderCorte(); renderDetalhe(); }

  function destacarApto(id) {
    const el = $(`.apto[data-apto="${id}"]`);
    if (!el) return;
    el.classList.remove("is-atualizado");
    void el.offsetWidth;
    el.classList.add("is-atualizado");
  }

  const reduzMovimento = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function levarAoDetalhe() {
    if (window.matchMedia("(max-width: 959px)").matches) {
      $("#detalhe").scrollIntoView({ behavior: reduzMovimento() ? "auto" : "smooth", block: "start" });
    }
  }

  function selecionarApto(id, focarDetalhe) {
    ui.sel = { tipo: "apto", id };
    renderCorte(); renderDetalhe();
    if (focarDetalhe) { levarAoDetalhe(); $("#detalhe").focus({ preventScroll: true }); }
    else $(`#corte [data-apto="${id}"]`).focus();
  }
  function selecionarPav(n, focarDetalhe) {
    ui.sel = { tipo: "pav", id: n };
    renderCorte(); renderDetalhe();
    if (focarDetalhe) { levarAoDetalhe(); $("#detalhe").focus({ preventScroll: true }); }
    else $(`#corte [data-pav="${n}"]`).focus();
  }

  function erroForm(form, msg, campo) {
    $("#f-erro", form).textContent = msg;
    if (campo) { campo.setAttribute("aria-invalid", "true"); campo.setAttribute("aria-describedby", "f-erro"); campo.focus(); }
  }

  function lancar(form) {
    const a = achaApto(ui.sel.id);
    const tipo = form.dataset.form;
    form.querySelectorAll("[aria-invalid]").forEach((c) => c.removeAttribute("aria-invalid"));
    const dataEl = form.elements.data;
    if (!dataEl.value) return erroForm(form, "Informe a data da medição.", dataEl);
    if (dataEl.value > hojeISO()) return erroForm(form, "A data da medição não pode ser futura.", dataEl);
    const num = (el) => Number(String(el.value).replace(",", "."));
    let msg;
    if (tipo === "furacao") {
      const q = num(form.elements.qtd), prof = num(form.elements.prof);
      if (!Number.isInteger(q) || q < 1 || q > 500) return erroForm(form, "Informe a quantidade de furos, de 1 a 500.", form.elements.qtd);
      if (!(prof > 0 && prof <= 100)) return erroForm(form, "Informe a profundidade em centímetros, até 100.", form.elements.prof);
      const d = form.elements.diametro.value;
      a.med.furacao.push({ id: novoId(), data: dataEl.value, diametro: d, qtd: q, prof });
      msg = `${q} furos de ${d} lançados no apartamento ${a.id}.`;
    } else if (tipo === "pintura") {
      const m2 = num(form.elements.m2);
      if (!(m2 > 0 && m2 <= 500)) return erroForm(form, "Informe a área pintada em m², até 500.", form.elements.m2);
      const comodo = form.elements.comodo.value, demao = Number(form.elements.demao.value);
      a.med.pintura.push({ id: novoId(), data: dataEl.value, comodo, demao, m2: Math.round(m2 * 10) / 10 });
      msg = `${n1.format(m2)} m² de pintura lançados em ${comodo}, apartamento ${a.id}.`;
    } else {
      const q = num(form.elements.qtd);
      if (!Number.isInteger(q) || q < 1 || q > 100) return erroForm(form, "Informe a quantidade de pontos, de 1 a 100.", form.elements.qtd);
      const t = form.elements.tipo.value;
      a.med.hidraulica.push({ id: novoId(), data: dataEl.value, tipo: t, qtd: q });
      msg = `${q} ${q === 1 ? "ponto" : "pontos"} de ${t.toLowerCase()} lançados no apartamento ${a.id}.`;
    }
    const valores = { diametro: form.elements.diametro && form.elements.diametro.value, comodo: form.elements.comodo && form.elements.comodo.selectedIndex, tipo: form.elements.tipo && form.elements.tipo.value };
    renderTudo();
    destacarApto(a.id);
    avisar(msg);
    // Mantém as escolhas para lançar a próxima medição mais rápido.
    const novo = $(`form[data-form="${tipo}"]`);
    if (novo) {
      if (valores.diametro) novo.elements.diametro.value = valores.diametro;
      if (valores.tipo) novo.elements.tipo.value = valores.tipo;
      if (valores.comodo != null) { novo.elements.comodo.selectedIndex = valores.comodo; novo.elements.m2.value = a.plano.comodos[valores.comodo].area; }
      const alvo = novo.elements.qtd || novo.elements.m2;
      alvo.focus({ preventScroll: true });
    }
  }

  function excluirMedicao(servico, id) {
    const a = achaApto(ui.sel.id);
    a.med[servico] = a.med[servico].filter((m) => m.id !== id);
    renderTudo();
    avisar(`Medição excluída do apartamento ${a.id}.`);
    const prox = $("#detalhe .btn-icone[data-excluir]") || $("#detalhe form");
    if (prox) prox.focus();
  }

  function adicionarFotos(input) {
    const a = achaApto(ui.sel.id);
    const arquivos = [...input.files].filter((f) => f.type.startsWith("image/"));
    if (!arquivos.length) { avisar("Escolha arquivos de imagem."); return; }
    arquivos.forEach((f) => a.fotos.push({ url: URL.createObjectURL(f), nome: f.name, data: hojeISO() }));
    renderDetalhe();
    avisar(`${arquivos.length} ${arquivos.length === 1 ? "foto adicionada" : "fotos adicionadas"} ao apartamento ${a.id}.`);
    $('label[for="f-fotos"]').focus();
  }

  // ---------- Relatório ----------
  function htmlRelatorio() {
    const o = ui.obra;
    const aptos = todosAptos(o);
    const furosPrev = {}, furosEx = {}, metros = {};
    DIAMETROS.forEach((d) => { furosPrev[d] = 0; furosEx[d] = 0; metros[d] = 0; });
    aptos.forEach((a) => {
      const fe = furosExec(a), me = metrosExec(a);
      DIAMETROS.forEach((d) => { furosPrev[d] += a.plano.furos[d]; furosEx[d] += fe[d] || 0; metros[d] += me[d] || 0; });
    });
    const tPrev = somaObj(furosPrev), tEx = somaObj(furosEx), tM = somaObj(metros);
    const geral = DIAMETROS.map((d) => `<tr><th scope="row">${d}</th><td class="num">${n0.format(furosPrev[d])}</td><td class="num">${n0.format(furosEx[d])}</td><td class="num">${n2.format(metros[d])}</td><td class="num">${pct(furosPrev[d] ? Math.min(1, furosEx[d] / furosPrev[d]) : 0)}</td></tr>`).join("");

    const porPav = o.pavimentos.map((p) => {
      const fe = {}, me = {};
      DIAMETROS.forEach((d) => { fe[d] = 0; me[d] = 0; });
      p.aptos.forEach((a) => { const f = furosExec(a), m = metrosExec(a); DIAMETROS.forEach((d) => { fe[d] += f[d] || 0; me[d] += m[d] || 0; }); });
      return { p, fe, me };
    });
    const tabelaPav = porPav.map(({ p, fe, me }) => DIAMETROS.map((d, i) => `<tr class="${i === 0 ? "inicio-grupo" : ""}">
        ${i === 0 ? `<th scope="rowgroup" rowspan="${DIAMETROS.length + 1}">${p.nome}</th>` : ""}
        <td>${d}</td><td class="num">${n0.format(fe[d])}</td><td class="num">${n2.format(me[d])}</td></tr>`).join("") +
      `<tr class="subtotal"><td>Subtotal</td><td class="num">${n0.format(somaObj(fe))}</td><td class="num">${n2.format(somaObj(me))}</td></tr>`).join("");

    const outros = o.pavimentos.map((p) => {
      let m2 = 0, m2p = 0, pts = 0, ptsp = 0, fotos = 0;
      p.aptos.forEach((a) => { m2 += m2Pintados(a); m2p += m2Previstos(a); pts += somaObj(pontosExec(a)); ptsp += somaObj(a.plano.pontos); fotos += a.fotos.length; });
      return `<tr><th scope="row">${p.nome}</th><td class="num">${n1.format(m2)}</td><td class="num">${n1.format(m2p)}</td><td class="num">${pts}</td><td class="num">${ptsp}</td><td class="num">${p.aptos.filter(aptoConcluido).length} de ${p.aptos.length}</td><td class="num">${fotos}</td></tr>`;
    }).join("");
    let m2T = 0, m2pT = 0, ptsT = 0, ptspT = 0, fotosT = 0;
    aptos.forEach((a) => { m2T += m2Pintados(a); m2pT += m2Previstos(a); ptsT += somaObj(pontosExec(a)); ptspT += somaObj(a.plano.pontos); fotosT += a.fotos.length; });
    const agora = new Date();

    return `
      <div class="relatorio__barra app-sem-impressao">
        <button type="button" class="btn" id="btn-voltar">${ICONE.voltar}Voltar às medições</button>
        <button type="button" class="btn btn--sinal" id="btn-imprimir">${ICONE.impressora}Imprimir ou salvar em PDF</button>
      </div>
      <article class="folha">
        <header class="folha__cabeca">
          <div>
            <p class="folha__empresa">Construtora Demonstração</p>
            <h1 id="titulo-relatorio" class="folha__titulo">Relatório de medições</h1>
            <p class="folha__obra">${esc(o.nome)}</p>
          </div>
          <dl class="folha__dados">
            <div><dt>Emitido em</dt><dd>${agora.toLocaleDateString("pt-BR")} às ${agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</dd></div>
            <div><dt>Pavimentos</dt><dd>${o.pavimentos.length} tipo, ${aptos.length} apartamentos</dd></div>
            <div><dt>Início da obra</dt><dd>${dataBR(o.inicio)}</dd></div>
          </dl>
        </header>

        <section class="folha__secao">
          <h2>Furação na obra inteira</h2>
          <div class="rolagem" tabindex="0" role="region" aria-label="Tabela, role para o lado se precisar"><table class="tabela tabela--folha">
            <thead><tr><th scope="col">Diâmetro</th><th scope="col" class="num">Furos previstos</th><th scope="col" class="num">Furos executados</th><th scope="col" class="num">Metros perfurados</th><th scope="col" class="num">Andamento</th></tr></thead>
            <tbody>${geral}</tbody>
            <tfoot><tr><th scope="row">Total</th><td class="num">${n0.format(tPrev)}</td><td class="num">${n0.format(tEx)}</td><td class="num">${n2.format(tM)}</td><td class="num">${pct(progressoCapado(furosPrev, furosEx))}</td></tr></tfoot>
          </table></div>
        </section>

        <section class="folha__secao">
          <h2>Furação por pavimento</h2>
          <div class="rolagem" tabindex="0" role="region" aria-label="Tabela, role para o lado se precisar"><table class="tabela tabela--folha tabela--grupos">
            <thead><tr><th scope="col">Pavimento</th><th scope="col">Diâmetro</th><th scope="col" class="num">Furos</th><th scope="col" class="num">Metros</th></tr></thead>
            <tbody>${tabelaPav}</tbody>
          </table></div>
        </section>

        <section class="folha__secao">
          <h2>Pintura, hidráulica e fotos por pavimento</h2>
          <div class="rolagem" tabindex="0" role="region" aria-label="Tabela, role para o lado se precisar"><table class="tabela tabela--folha tabela--larga">
            <thead><tr><th scope="col">Pavimento</th><th scope="col" class="num">Pintura (m²)</th><th scope="col" class="num">Prevista (m²)</th><th scope="col" class="num">Pontos</th><th scope="col" class="num">Previstos</th><th scope="col" class="num">Aptos concluídos</th><th scope="col" class="num">Fotos</th></tr></thead>
            <tbody>${outros}</tbody>
            <tfoot><tr><th scope="row">Total</th><td class="num">${n1.format(m2T)}</td><td class="num">${n1.format(m2pT)}</td><td class="num">${ptsT}</td><td class="num">${ptspT}</td><td class="num">${aptos.filter(aptoConcluido).length} de ${aptos.length}</td><td class="num">${fotosT}</td></tr></tfoot>
          </table></div>
        </section>

        <footer class="folha__rodape">
          <p>Metros perfurados = furos × profundidade informada em cada medição. Pintura prevista considera ${2} demãos por cômodo.</p>
          <div class="assinaturas"><span>Responsável pela medição</span><span>Engenheiro da obra</span></div>
        </footer>
      </article>`;
  }

  let ultimoFoco = null;
  function abrirRelatorio() {
    ultimoFoco = document.activeElement;
    const rel = $("#relatorio");
    rel.innerHTML = htmlRelatorio();
    rel.hidden = false;
    document.body.classList.add("vendo-relatorio");
    window.scrollTo(0, 0);
    $("#titulo-relatorio").setAttribute("tabindex", "-1");
    $("#titulo-relatorio").focus();
    document.title = `Relatório de medições, ${ui.obra.nome} | Demonstração`;
  }
  function fecharRelatorio() {
    $("#relatorio").hidden = true;
    document.body.classList.remove("vendo-relatorio");
    document.title = "Medições de obra | Demonstração";
    (ultimoFoco && document.contains(ultimoFoco) ? ultimoFoco : $("#btn-relatorio")).focus();
  }

  // Imprimir direto da tela de medições também sai o relatório.
  let relatorioTemporario = false;
  window.addEventListener("beforeprint", () => {
    if (!document.body.classList.contains("vendo-relatorio")) {
      $("#relatorio").innerHTML = htmlRelatorio();
      $("#relatorio").hidden = false;
      relatorioTemporario = true;
    }
  });
  window.addEventListener("afterprint", () => {
    if (relatorioTemporario) { $("#relatorio").hidden = true; relatorioTemporario = false; }
  });

  // ---------- Tema ----------
  function temaAtual() {
    const t = document.documentElement.dataset.tema;
    if (t) return t;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "escuro" : "claro";
  }
  function atualizarBotaoTema() {
    const escuro = temaAtual() === "escuro";
    const b = $("#btn-tema");
    b.setAttribute("aria-pressed", String(escuro));
    $("span", b).textContent = "Tema escuro";
  }

  // ---------- Eventos ----------
  // No celular o painel fica abaixo do corte: levar o foco até ele. No computador, quem clica
  // no corte continua no corte; quem clica dentro do painel vai ao painel novo.
  function focoNoDetalhe(el) {
    return !el.closest("#corte") || window.matchMedia("(max-width: 959px)").matches;
  }
  document.addEventListener("click", (ev) => {
    const t = ev.target.closest("button, [data-apto], [data-pav]");
    if (!t) return;
    if (t.matches("[data-apto]")) { selecionarApto(t.dataset.apto, focoNoDetalhe(t)); return; }
    if (t.matches("[data-pav]")) { selecionarPav(Number(t.dataset.pav), focoNoDetalhe(t)); return; }
    if (t.matches("[data-aba]")) { ui.aba = t.dataset.aba; renderDetalhe(); $(`#aba-${ui.aba}`).focus(); return; }
    if (t.matches("[data-excluir]")) { excluirMedicao(t.dataset.servico, t.dataset.excluir); return; }
    if (t.matches("[data-foto]")) {
      const a = achaApto(ui.sel.id);
      const [f] = a.fotos.splice(Number(t.dataset.foto), 1);
      URL.revokeObjectURL(f.url);
      renderDetalhe();
      avisar(`Foto ${f.nome} removida.`);
      $('label[for="f-fotos"]').focus();
      return;
    }
    if (t.id === "btn-relatorio") { abrirRelatorio(); return; }
    if (t.id === "btn-voltar") { fecharRelatorio(); return; }
    if (t.id === "btn-imprimir") { window.print(); return; }
    if (t.id === "btn-tema") {
      document.documentElement.dataset.tema = temaAtual() === "escuro" ? "claro" : "escuro";
      atualizarBotaoTema();
    }
  });

  document.addEventListener("keydown", (ev) => {
    const aba = ev.target.closest('[role="tab"]');
    if (aba && ["ArrowRight", "ArrowLeft", "Home", "End"].includes(ev.key)) {
      const abas = [...document.querySelectorAll('[role="tab"]')];
      let i = abas.indexOf(aba);
      i = ev.key === "Home" ? 0 : ev.key === "End" ? abas.length - 1 : (i + (ev.key === "ArrowRight" ? 1 : -1) + abas.length) % abas.length;
      ui.aba = abas[i].dataset.aba;
      renderDetalhe();
      $(`#aba-${ui.aba}`).focus();
      ev.preventDefault();
    }
    if (ev.key === "Escape" && document.body.classList.contains("vendo-relatorio")) fecharRelatorio();
  });

  document.addEventListener("submit", (ev) => {
    const form = ev.target.closest("form[data-form]");
    if (!form) return;
    ev.preventDefault();
    lancar(form);
  });

  document.addEventListener("change", (ev) => {
    if (ev.target.name === "obra") {
      ui.obra = obras.find((o) => o.id === ev.target.value);
      const primeiro = ui.obra.pavimentos[Math.min(2, ui.obra.pavimentos.length - 1)].aptos[0];
      ui.sel = { tipo: "apto", id: primeiro.id };
      renderTudo();
      avisar(`Obra ${ui.obra.nome} aberta.`);
    }
    if (ev.target.id === "f-comodo") {
      const area = ev.target.selectedOptions[0].dataset.area;
      $("#f-qtd").value = area;
    }
    if (ev.target.id === "f-fotos") adicionarFotos(ev.target);
  });

  renderObras();
  renderTudo();
  atualizarBotaoTema();
})();
