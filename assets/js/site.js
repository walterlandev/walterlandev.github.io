/* Site do portfólio: monta as páginas a partir de window.PERFIL e window.PROJETOS.
   Sem dependências. Cada página indica o que é em <body data-pagina="...">. */
(function () {
  "use strict";

  var PERFIL = window.PERFIL || {};
  var PROJETOS = window.PROJETOS || [];
  var reduzirMovimento = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- utilidades ---------- */
  function esc(t) {
    return String(t == null ? "" : t)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function preenchido(v) {
    if (Array.isArray(v)) return v.length > 0;
    return v != null && String(v).trim() !== "";
  }
  function $(sel, raiz) { return (raiz || document).querySelector(sel); }
  function lista(arr) { return Array.isArray(arr) ? arr.filter(preenchido) : []; }

  var ICONES = {
    externo: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    codigo: '<path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14"/>',
    detalhes: '<path d="M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 16h6"/>',
    imprimir: '<path d="M7 9V3h10v6M7 17H4v-7h16v7h-3M7 14h10v7H7z"/>',
    email: '<rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="M3.5 6.5l8.5 6 8.5-6"/>',
    whatsapp: '<path d="M4 5h16v11H9.5L5 20v-4H4z"/><path d="M8 10.5h8"/>',
    instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5v.01"/>',
    linkedin: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 10.5V17M8 7.25v.5M12 17v-6.5M12 13.5a2.5 2.5 0 0 1 5 0V17"/>',
    github: '<circle cx="6" cy="5" r="2"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="7" r="2"/><path d="M6 7v10M18 9c0 4.5-6 4-11.2 8.6"/>',
    sol: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
    lua: '<path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z"/>',
    voltar: '<path d="M10 6l-6 6 6 6M4.5 12H20"/>',
  };
  function icone(nome) {
    return '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.75" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + (ICONES[nome] || "") + "</svg>";
  }

  /* ---------- tema claro/escuro ---------- */
  function temaAtual() {
    var t = document.documentElement.getAttribute("data-tema");
    if (t === "escuro" || t === "claro") return t;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "escuro" : "claro";
  }
  function iniciarTema() {
    var botao = $("[data-tema-botao]");
    if (!botao) return;
    function desenhar() {
      var escuro = temaAtual() === "escuro";
      botao.innerHTML = icone(escuro ? "sol" : "lua") + '<span class="sr-only">' +
        (escuro ? "Mudar para o tema claro" : "Mudar para o tema escuro") + "</span>";
      botao.setAttribute("title", escuro ? "Tema claro" : "Tema escuro");
    }
    botao.addEventListener("click", function () {
      var novo = temaAtual() === "escuro" ? "claro" : "escuro";
      document.documentElement.setAttribute("data-tema", novo);
      try { localStorage.setItem("tema", novo); } catch (e) { /* sem armazenamento: vale só nesta visita */ }
      desenhar();
    });
    if (window.matchMedia) {
      var mq = window.matchMedia("(prefers-color-scheme: dark)");
      if (mq.addEventListener) mq.addEventListener("change", desenhar);
    }
    desenhar();
  }

  /* ---------- partes comuns ---------- */
  function preencherComuns() {
    document.querySelectorAll("[data-perfil-nome]").forEach(function (n) { n.textContent = PERFIL.nome || ""; });
    var ano = $("[data-ano]");
    if (ano) ano.textContent = String(new Date().getFullYear());
  }

  function etiquetas(stack) {
    var itens = lista(stack);
    if (!itens.length) return "";
    return '<ul class="etiquetas" aria-label="Tecnologias">' +
      itens.map(function (s) { return '<li class="etiqueta">' + esc(s) + "</li>"; }).join("") + "</ul>";
  }

  function acoesProjeto(p, opcoes) {
    opcoes = opcoes || {};
    var html = "";
    if (preenchido(p.demo)) {
      html += '<a class="btn btn--sinal" href="' + esc(p.demo) + '">' + icone("externo") + "Abrir demonstração</a>";
    }
    if (preenchido(p.codigo)) {
      html += '<a class="btn" href="' + esc(p.codigo) + '" rel="noopener">' + icone("codigo") + "Código</a>";
    }
    if (!opcoes.semDetalhes) {
      html += '<a class="btn btn--texto" href="projeto.html?id=' + encodeURIComponent(p.id) + '">' +
        icone("detalhes") + 'Detalhes<span class="sr-only"> de ' + esc(p.titulo) + "</span></a>";
    }
    return html ? '<div class="acoes">' + html + "</div>" : "";
  }

  function canaisContato() {
    var c = [];
    if (preenchido(PERFIL.email)) c.push({ icone: "email", rotulo: "E-mail", texto: PERFIL.email, href: "mailto:" + PERFIL.email });
    if (preenchido(PERFIL.whatsapp)) {
      var dig = String(PERFIL.whatsapp).replace(/\D/g, "");
      if (dig) c.push({ icone: "whatsapp", rotulo: "WhatsApp", texto: dig.length === 13 ? "(" + dig.slice(2, 4) + ") " + dig.slice(4, 9) + "-" + dig.slice(9) : "+" + dig, href: "https://wa.me/" + dig, externo: true });
    }
    if (preenchido(PERFIL.linkedin)) c.push({ icone: "linkedin", rotulo: "LinkedIn", texto: semProtocolo(PERFIL.linkedin), href: PERFIL.linkedin, externo: true });
    if (preenchido(PERFIL.instagram)) {
      var ig = String(PERFIL.instagram).replace(/^@/, "");
      c.push({ icone: "instagram", rotulo: "Instagram", texto: "@" + ig, href: "https://www.instagram.com/" + encodeURIComponent(ig) + "/", externo: true });
    }
    if (preenchido(PERFIL.github)) c.push({ icone: "github", rotulo: "GitHub", texto: semProtocolo(PERFIL.github), href: PERFIL.github, externo: true });
    return c;
  }
  function semProtocolo(url) { return String(url).replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""); }

  /* ---------- números agregados (painel de operações) ---------- */
  function agregados() {
    var setores = {}, tecnologias = {};
    PROJETOS.forEach(function (p) {
      if (preenchido(p.setor)) setores[p.setor] = (setores[p.setor] || 0) + 1;
      lista(p.stack).forEach(function (s) { tecnologias[s.toLowerCase()] = true; });
    });
    var porSetor = Object.keys(setores).map(function (k) { return [k, setores[k]]; })
      .sort(function (a, b) { return b[1] - a[1] || a[0].localeCompare(b[0], "pt-BR"); });
    return {
      sistemas: PROJETOS.length,
      setores: porSetor.length,
      tecnologias: Object.keys(tecnologias).length,
      demos: PROJETOS.filter(function (p) { return preenchido(p.demo); }).length,
      porSetor: porSetor,
    };
  }

  function montarPainelOperacoes() {
    var alvo = $("[data-painel-operacoes]");
    if (!alvo) return;
    var a = agregados();
    var maior = a.porSetor.length ? a.porSetor[0][1] : 1;
    var indicadores = [
      [a.sistemas, a.sistemas === 1 ? "sistema no portfólio" : "sistemas no portfólio"],
      [a.setores, a.setores === 1 ? "setor atendido" : "setores atendidos"],
      [a.tecnologias, "tecnologias diferentes"],
      [a.demos, a.demos === 1 ? "demonstração para abrir" : "demonstrações para abrir"],
    ];
    alvo.innerHTML =
      '<div class="painel__cabeca"><span class="estado estado--ok">Painel de operações</span>' +
      '<span class="relogio" data-relogio aria-hidden="true"></span></div>' +
      '<dl class="indicadores">' + indicadores.map(function (i) {
        return '<div class="numero indicador"><dt><span>' + esc(i[1]) + '</span></dt><dd><b data-contar="' + i[0] + '">' + i[0] + "</b></dd></div>";
      }).join("") + "</dl>" +
      '<div class="setores"><h2 class="setores__titulo">Sistemas por setor</h2><ul>' +
      a.porSetor.map(function (s) {
        var pct = Math.round((s[1] / maior) * 100);
        return '<li><span class="setores__nome">' + esc(s[0]) + '</span><span class="setores__barra" aria-hidden="true">' +
          '<i style="--p:' + pct + '%"></i></span><span class="setores__qtd">' + s[1] + "</span></li>";
      }).join("") + "</ul></div>";

    var relogio = $("[data-relogio]", alvo);
    function tique() {
      var d = new Date();
      relogio.textContent = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    }
    tique();
    setInterval(tique, 1000);

    if (reduzirMovimento) return;
    alvo.classList.add("entrando");
    var nums = alvo.querySelectorAll("[data-contar]");
    var inicio = null, duracao = 900;
    function quadro(t) {
      if (inicio === null) inicio = t;
      var k = Math.min(1, (t - inicio) / duracao);
      var e = 1 - Math.pow(1 - k, 3);
      nums.forEach(function (n) { n.textContent = String(Math.round(Number(n.getAttribute("data-contar")) * e)); });
      if (k < 1) requestAnimationFrame(quadro);
    }
    nums.forEach(function (n) { n.textContent = "0"; });
    requestAnimationFrame(function () {
      alvo.classList.add("entrou");
      requestAnimationFrame(quadro);
    });
  }

  /* ---------- página inicial ---------- */
  function montarAbertura() {
    var t = $("[data-perfil-titulo]");
    if (t) t.textContent = PERFIL.titulo || "";
    var r = $("[data-perfil-resumo]");
    if (r) r.textContent = PERFIL.resumo || "";
  }

  function montarProjetos() {
    var alvoD = $("[data-projetos-destaque]");
    var alvoO = $("[data-projetos-outros]");
    if (!alvoD || !alvoO) return;
    var destaques = PROJETOS.filter(function (p) { return p.destaque; });
    var outros = PROJETOS.filter(function (p) { return !p.destaque; });

    alvoD.innerHTML = destaques.map(function (p, i) {
      var nums = (p.numeros || []).filter(function (n) { return n && preenchido(n[0]); });
      return '<article class="painel projeto-d' + (i === 0 ? " projeto-d--principal" : "") + '" aria-labelledby="pd-' + esc(p.id) + '">' +
        '<div class="projeto-d__texto">' +
        '<p class="setor">' + esc(p.setor) + atualizado(p) + "</p>" +
        '<h3 id="pd-' + esc(p.id) + '">' + esc(p.titulo) + "</h3>" +
        '<p class="projeto-d__resumo">' + esc(p.resumo) + "</p>" +
        (preenchido(p.problema) ? '<p class="projeto-d__problema"><strong>Antes:</strong> ' + esc(p.problema) + "</p>" : "") +
        etiquetas(p.stack) + acoesProjeto(p) +
        "</div>" +
        (nums.length ? '<dl class="projeto-d__numeros">' + nums.map(function (n) {
          return '<div class="numero"><dt><span>' + esc(n[1]) + "</span></dt><dd><b>" + esc(n[0]) + "</b></dd></div>";
        }).join("") + "</dl>" : "") +
        "</article>";
    }).join("");

    var blocoOutros = $("[data-bloco-outros]");
    if (!outros.length) { if (blocoOutros) blocoOutros.hidden = true; return; }
    alvoO.innerHTML = outros.map(function (p) {
      return '<li class="projeto-c">' +
        '<div class="projeto-c__cabeca"><p class="setor">' + esc(p.setor) + atualizado(p) + "</p>" +
        '<h4><a href="projeto.html?id=' + encodeURIComponent(p.id) + '">' + esc(p.titulo) + "</a></h4></div>" +
        '<p class="projeto-c__resumo">' + esc(p.resumo) + "</p>" +
        etiquetas(p.stack) +
        acoesProjeto(p, { semDetalhes: true }) +
        "</li>";
    }).join("");
  }

  function atualizado(p) {
    return preenchido(p.atualizado) ? ' <span class="atualizado">· atualizado em ' + esc(p.atualizado.toLowerCase()) + "</span>" : "";
  }

  function montarCurriculo() {
    var alvo = $("[data-curriculo]");
    if (!alvo) return;
    var html = "";

    // cabeçalho do currículo (aparece forte na impressão)
    var linhaContato = canaisContato().map(function (c) {
      return "<li><span>" + esc(c.rotulo) + ":</span> " + esc(c.texto) + "</li>";
    }).join("");
    html += '<div class="cv-identidade">' +
      '<p class="cv-nome">' + esc(PERFIL.nome) + "</p>" +
      '<p class="cv-titulo">' + esc(PERFIL.titulo) + (preenchido(PERFIL.cidade) ? ", " + esc(PERFIL.cidade) : "") + "</p>" +
      (linhaContato ? '<ul class="cv-contatos">' + linhaContato + "</ul>" : "") + "</div>";

    if (preenchido(PERFIL.resumo)) {
      html += '<section class="cv-bloco" aria-labelledby="cv-resumo"><h3 id="cv-resumo">Resumo</h3><p>' + esc(PERFIL.resumo) + "</p></section>";
    }

    var grupos = (PERFIL.competencias || []).filter(function (g) { return g && preenchido(g.grupo) && lista(g.itens).length; });
    if (grupos.length) {
      html += '<section class="cv-bloco" aria-labelledby="cv-comp"><h3 id="cv-comp">Competências</h3><dl class="cv-competencias">' +
        grupos.map(function (g) {
          return "<div><dt>" + esc(g.grupo) + "</dt><dd>" + lista(g.itens).map(esc).join(", ") + "</dd></div>";
        }).join("") + "</dl></section>";
    }

    var exp = (PERFIL.experiencia || []).filter(function (e) { return e && (preenchido(e.cargo) || preenchido(e.onde)); });
    if (exp.length) {
      html += '<section class="cv-bloco" aria-labelledby="cv-exp"><h3 id="cv-exp">Experiência</h3><ul class="cv-linha-tempo">' +
        exp.map(function (e) {
          return "<li><p class=\"cv-item__titulo\">" + esc(e.cargo) + (preenchido(e.onde) ? (preenchido(e.cargo) ? ", " : "") + esc(e.onde) : "") + "</p>" +
            (preenchido(e.periodo) ? '<p class="cv-item__periodo">' + esc(e.periodo) + "</p>" : "") +
            (preenchido(e.descricao) ? "<p>" + esc(e.descricao) + "</p>" : "") + "</li>";
        }).join("") + "</ul></section>";
    }

    var form = (PERFIL.formacao || []).filter(function (f) { return f && (preenchido(f.curso) || preenchido(f.instituicao)); });
    if (form.length) {
      html += '<section class="cv-bloco" aria-labelledby="cv-form"><h3 id="cv-form">Formação</h3><ul class="cv-linha-tempo">' +
        form.map(function (f) {
          return "<li><p class=\"cv-item__titulo\">" + esc(f.curso) + (preenchido(f.instituicao) ? (preenchido(f.curso) ? ", " : "") + esc(f.instituicao) : "") + "</p>" +
            (preenchido(f.periodo) ? '<p class="cv-item__periodo">' + esc(f.periodo) + "</p>" : "") + "</li>";
        }).join("") + "</ul></section>";
    }

    // projetos: só na versão impressa
    if (PROJETOS.length) {
      html += '<section class="cv-bloco so-impressao" aria-labelledby="cv-proj"><h3 id="cv-proj">Projetos</h3><ul class="cv-projetos">' +
        PROJETOS.map(function (p) {
          return "<li><strong>" + esc(p.titulo) + "</strong> (" + esc(p.setor) + "). " + esc(p.resumo) +
            (lista(p.stack).length ? ' <span class="cv-stack">' + lista(p.stack).map(esc).join(", ") + ".</span>" : "") + "</li>";
        }).join("") + "</ul></section>";
    }

    alvo.innerHTML = html;

    var botao = $("[data-imprimir]");
    if (botao) {
      botao.innerHTML = icone("imprimir") + "Imprimir / salvar PDF";
      botao.addEventListener("click", function () { window.print(); });
    }
  }

  function montarContato() {
    var alvo = $("[data-contato]");
    if (!alvo) return;
    var canais = canaisContato();
    if (!canais.length) { var s = $("#contato"); if (s) s.hidden = true; return; }
    alvo.innerHTML = canais.map(function (c) {
      return '<li><a class="canal" href="' + esc(c.href) + '"' + (c.externo ? ' rel="noopener"' : "") + ">" +
        '<span class="canal__icone">' + icone(c.icone) + "</span>" +
        '<span class="canal__texto"><span class="canal__rotulo">' + esc(c.rotulo) + "</span>" +
        '<span class="canal__valor">' + esc(c.texto) + "</span></span></a></li>";
    }).join("");
    var nav = document.querySelectorAll('a[href$="#contato"]');
    if (!canais.length) nav.forEach(function (n) { n.hidden = true; });
  }

  /* ---------- página de detalhe ---------- */
  function montarDetalhe() {
    var alvo = $("[data-detalhe]");
    if (!alvo) return;
    var id = "";
    try { id = new URLSearchParams(window.location.search).get("id") || ""; } catch (e) { id = ""; }
    var p = PROJETOS.filter(function (x) { return x.id === id; })[0];
    var voltar = '<a class="btn btn--texto voltar" href="index.html#projetos">' + icone("voltar") + "Voltar aos projetos</a>";

    if (!p) {
      document.title = "Projeto não encontrado | " + (PERFIL.nome || "Portfólio");
      alvo.innerHTML = voltar +
        '<div class="painel painel--plano aviso">' +
        "<h1>Projeto não encontrado</h1>" +
        "<p>" + (id ? "Não existe projeto com o código “" + esc(id) + "”." : "O endereço não diz qual projeto abrir.") +
        " Confira o link ou escolha um projeto na lista.</p>" +
        '<div class="acoes"><a class="btn btn--sinal" href="index.html#projetos">Ver todos os projetos</a>' +
        '<a class="btn" href="index.html">Ir para o início</a></div></div>';
      return;
    }

    document.title = p.titulo + " | " + (PERFIL.nome || "Portfólio");
    var meta = $('meta[name="description"]');
    if (meta && preenchido(p.resumo)) meta.setAttribute("content", p.resumo);

    var nums = (p.numeros || []).filter(function (n) { return n && preenchido(n[0]); });
    var solucao = lista(p.solucao);

    var html = voltar +
      '<header class="detalhe__cabeca">' +
      '<p class="setor">' + esc(p.setor) + atualizado(p) + "</p>" +
      "<h1>" + esc(p.titulo) + "</h1>" +
      (preenchido(p.resumo) ? '<p class="detalhe__resumo">' + esc(p.resumo) + "</p>" : "") +
      acoesProjeto(p, { semDetalhes: true }) +
      "</header>";

    if (nums.length) {
      html += '<section class="painel detalhe__numeros" aria-label="Números do projeto"><dl>' +
        nums.map(function (n) { return '<div class="numero"><dt><span>' + esc(n[1]) + "</span></dt><dd><b>" + esc(n[0]) + "</b></dd></div>"; }).join("") +
        "</dl></section>";
    }

    html += '<div class="detalhe__corpo">';
    if (preenchido(p.problema)) {
      html += '<section aria-labelledby="d-prob"><h2 id="d-prob">O problema</h2><p>' + esc(p.problema) + "</p></section>";
    }
    if (solucao.length) {
      html += '<section aria-labelledby="d-sol"><h2 id="d-sol">O que o sistema faz</h2><ul class="solucao">' +
        solucao.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ul></section>";
    }
    var recente = lista(p.recente);
    if (recente.length) {
      html += '<section aria-labelledby="d-rec"><h2 id="d-rec">Últimas entregas</h2>' +
        (preenchido(p.atualizado) ? '<p class="nota">' + esc(p.atualizado) + "</p>" : "") +
        '<ul class="solucao">' + recente.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ul></section>";
    }
    if (lista(p.stack).length) {
      html += '<section aria-labelledby="d-stack"><h2 id="d-stack">Tecnologias</h2>' + etiquetas(p.stack) + "</section>";
    }
    if (!preenchido(p.demo) && !preenchido(p.codigo)) {
      html += '<p class="nota">Este projeto ainda não tem demonstração pública nem código aberto.</p>';
    }
    html += "</div>";
    alvo.innerHTML = html;
  }

  /* ---------- início ---------- */
  function iniciar() {
    iniciarTema();
    preencherComuns();
    var pagina = document.body.getAttribute("data-pagina");
    if (pagina === "inicio") {
      montarAbertura();
      montarPainelOperacoes();
      montarProjetos();
      montarCurriculo();
      montarContato();
    } else if (pagina === "projeto") {
      montarDetalhe();
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();
