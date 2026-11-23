/* Demonstração do painel da associação. Dados fictícios, estado só em memória. */
(function () {
  "use strict";

  /* ---------- utilidades ---------- */
  const $ = (sel, raiz) => (raiz || document).querySelector(sel);
  const $$ = (sel, raiz) => Array.from((raiz || document).querySelectorAll(sel));
  const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const real = (v) => moeda.format(v).replace(/ /g, " ");
  const el = (tag, attrs, filhos) => {
    const n = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      if (k === "texto") n.textContent = attrs[k];
      else if (k === "classe") n.className = attrs[k];
      else if (k.startsWith("on")) n.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] !== false && attrs[k] != null) n.setAttribute(k, attrs[k] === true ? "" : attrs[k]);
    }
    (filhos || []).forEach((f) => f != null && n.append(f));
    return n;
  };
  const reduzMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // gerador previsível, para os telefones fictícios serem sempre os mesmos
  let semente = 20261123;
  const sorte = () => { semente = (semente * 1103515245 + 12345) % 2147483648; return semente / 2147483648; };
  const digitos = (n) => Array.from({ length: n }, () => Math.floor(sorte() * 10)).join("");

  /* ---------- dados fictícios ---------- */
  const MESES = [
    { id: "2026-09", nome: "setembro", rotulo: "Setembro de 2026" },
    { id: "2026-10", nome: "outubro", rotulo: "Outubro de 2026" },
    { id: "2026-11", nome: "novembro", rotulo: "Novembro de 2026" },
  ];
  const MES_ATUAL = "2026-11";
  const VALOR = { Ativo: 100, Reserva: 100, Pensionista: 50 };
  const CIDADES = ["João Pessoa", "Campina Grande", "Patos", "Sousa", "Cajazeiras", "Guarabira", "Santa Rita", "Bayeux", "Cabedelo"];

  // [nome, posto, categoria, pagamentos set/out/nov (1 = pago), nascimento]
  const BASE = [
    ["Adriana Tavares Lins", "1º Sargento", "Ativo", "111", "1979-03-14"],
    ["Bruno Henrique Farias", "Cabo", "Ativo", "110", "1990-07-02"],
    ["Carla Menezes Duarte", "3º Sargento", "Ativo", "111", "1985-11-25"],
    ["Cícero Alves Brandão", "Subtenente", "Reserva", "111", "1964-01-30"],
    ["Daniela Rocha Queiroga", "Soldado", "Ativo", "100", "1996-05-18"],
    ["Edvaldo Pereira Nóbrega", "2º Sargento", "Reserva", "111", "1968-09-09"],
    ["Fabiana Correia Leite", "Pensionista", "Pensionista", "111", "1971-12-03"],
    ["Genival Soares Dantas", "Cabo", "Ativo", "110", "1983-04-21"],
    ["Hélio Batista Guedes", "1º Sargento", "Reserva", "111", "1962-08-15"],
    ["Iara Cavalcanti Moura", "Soldado", "Ativo", "111", "1998-02-27"],
    ["Jailson Ferreira Lucena", "3º Sargento", "Ativo", "000", "1988-10-11"],
    ["Joseane Araújo Pessoa", "Pensionista", "Pensionista", "110", "1966-06-06"],
    ["Kléber Nunes Medeiros", "2º Sargento", "Ativo", "111", "1981-01-19"],
    ["Luciana Barros Agra", "Cabo", "Ativo", "111", "1992-11-24"],
    ["Marcos Antônio Vilar", "Subtenente", "Ativo", "101", "1975-03-03"],
    ["Maria do Socorro Freire", "Pensionista", "Pensionista", "111", "1958-07-28"],
    ["Nivaldo Gomes Torres", "Soldado", "Ativo", "110", "1994-09-13"],
    ["Patrícia Lacerda Diniz", "3º Sargento", "Ativo", "111", "1987-12-01"],
    ["Rafael Monteiro Costa", "Soldado", "Ativo", "100", "1999-04-08"],
    ["Renata Siqueira Bezerra", "1º Sargento", "Ativo", "111", "1980-05-22"],
    ["Severino Lima Albuquerque", "Subtenente", "Reserva", "110", "1960-02-12"],
    ["Tatiane Morais Arruda", "Cabo", "Ativo", "111", "1991-08-30"],
    ["Ubiratan Costa Melo", "2º Sargento", "Reserva", "111", "1965-10-17"],
    ["Valéria Pontes Galdino", "Pensionista", "Pensionista", "111", "1969-11-26"],
    ["Wellington Sobral Cunha", "Cabo", "Ativo", "110", "1989-06-14"],
  ];

  const associados = BASE.map((b, i) => {
    const pag = {};
    MESES.forEach((m, k) => {
      pag[m.id] = b[3][k] === "1" ? { data: `${String(4 + Math.floor(sorte() * 10)).padStart(2, "0")}/${m.id.slice(5)}/2026`, por: "extrato PIX" } : null;
    });
    return {
      id: i + 1,
      nome: b[0],
      posto: b[1],
      categoria: b[2],
      valor: VALOR[b[2]],
      pag,
      nascimento: b[4],
      telefone: `(83) 9${digitos(4)}-${digitos(4)}`,
      matricula: `D-${String(100 + Math.floor(sorte() * 900))}${i}`,
      admissao: 2004 + Math.floor(sorte() * 20),
      cidade: CIDADES[Math.floor(sorte() * CIDADES.length)],
      semWhatsapp: b[0] === "Genival Soares Dantas",
    };
  });
  const porId = (id) => associados.find((a) => a.id === id);
  const primeiroNome = (a) => a.nome.split(" ")[0];
  const emAberto = (a) => MESES.filter((m) => !a.pag[m.id]);
  const emDia = (a) => emAberto(a).length === 0;
  const devido = (a) => emAberto(a).length * a.valor;
  const listaMeses = (ms) => {
    if (!ms.length) return "nenhum mês";
    const nomes = ms.map((m) => m.nome);
    const texto = nomes.length === 1 ? nomes[0] : nomes.slice(0, -1).join(", ") + " e " + nomes[nomes.length - 1];
    return texto + " de 2026";
  };

  /* ---------- estado ---------- */
  const estado = {
    tarefas: [
      { id: 1, texto: "Lançar a folha de outubro", feita: true },
      { id: 2, texto: "Conferir o extrato PIX de novembro", feita: false },
      { id: 3, texto: "cobranca", feita: false },
      { id: 4, texto: "Aprovar 2 contas a pagar do mês", feita: false },
      { id: 5, texto: "Enviar parabéns aos 3 aniversariantes da semana", feita: false },
    ],
    atividade: [
      { hora: "Hoje, 08:42", texto: "Extrato PIX de novembro importado: 16 pagamentos conciliados." },
      { hora: "Ontem, 17:10", texto: "Conta de energia da sede aprovada pelo tesoureiro." },
      { hora: "20/11, 10:05", texto: "Parabéns enviados a 2 associados." },
    ],
    escolhidos: new Set(),
    lista: [],          // ids da lista revisada
    envio: null,
    historico: [],
  };

  /* ---------- aviso rápido ---------- */
  let avisoTempo;
  function avisar(texto) {
    const a = $("#aviso");
    a.textContent = texto;
    a.classList.add("aviso--visivel");
    clearTimeout(avisoTempo);
    avisoTempo = setTimeout(() => a.classList.remove("aviso--visivel"), 3200);
  }
  function registrar(texto) {
    const d = new Date();
    estado.atividade.unshift({ hora: `Hoje, ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`, texto });
    estado.atividade = estado.atividade.slice(0, 6);
  }

  /* ---------- navegação ---------- */
  const TITULOS = { inicio: "Início", associados: "Associados", mensalidades: "Mensalidades", mensagens: "Mensagens" };
  function irPara(secao, focar) {
    if (!TITULOS[secao]) secao = "inicio";
    $$(".secao-app").forEach((s) => { s.hidden = s.dataset.secao !== secao; });
    $$(".menu__lista a").forEach((a) => {
      if (a.dataset.ir === secao) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    $("#titulo-secao").textContent = TITULOS[secao];
    document.title = `${TITULOS[secao]} | Painel da associação (demonstração)`;
    fecharMenu();
    renderizar(secao);
    if (focar) $("#titulo-secao").focus({ preventScroll: true });
    if (focar) window.scrollTo({ top: 0, behavior: reduzMovimento ? "auto" : "smooth" });
  }
  window.addEventListener("hashchange", () => irPara(location.hash.slice(1), true));

  const botaoMenu = $("#botao-menu");
  function fecharMenu() {
    botaoMenu.setAttribute("aria-expanded", "false");
    document.body.classList.remove("menu-aberto");
    $("#menu").style.top = ""; $("#menu").style.maxHeight = "";
  }
  window.addEventListener("scroll", () => {
    if (!document.body.classList.contains("menu-aberto")) return;
    const topo = Math.round($(".barra").getBoundingClientRect().bottom);
    $("#menu").style.top = `${topo}px`; $("#menu").style.maxHeight = `calc(100vh - ${topo}px)`;
  }, { passive: true });
  window.matchMedia("(min-width: 901px)").addEventListener("change", (e) => { if (e.matches) fecharMenu(); });
  botaoMenu.addEventListener("click", () => {
    const abrir = botaoMenu.getAttribute("aria-expanded") !== "true";
    botaoMenu.setAttribute("aria-expanded", String(abrir));
    const topo = Math.round($(".barra").getBoundingClientRect().bottom);
    const menu = $("#menu");
    menu.style.top = `${topo}px`;
    menu.style.maxHeight = `calc(100vh - ${topo}px)`;
    document.body.classList.toggle("menu-aberto", abrir);
    if (abrir) $(".menu__lista a").focus();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && document.body.classList.contains("menu-aberto")) { fecharMenu(); botaoMenu.focus(); }
  });

  /* ---------- tema ---------- */
  const botaoTema = $("#botao-tema");
  const escuroSistema = window.matchMedia("(prefers-color-scheme: dark)");
  function temaAtualEscuro() {
    const t = document.documentElement.getAttribute("data-tema");
    return t ? t === "escuro" : escuroSistema.matches;
  }
  function pintarBotaoTema() {
    const escuro = temaAtualEscuro();
    botaoTema.setAttribute("aria-pressed", String(escuro));
    $("span", botaoTema).textContent = "Tema escuro";
  }
  botaoTema.addEventListener("click", () => {
    document.documentElement.setAttribute("data-tema", temaAtualEscuro() ? "claro" : "escuro");
    pintarBotaoTema();
  });
  escuroSistema.addEventListener("change", pintarBotaoTema);

  /* ---------- início ---------- */
  function renderInicio() {
    const ativos = associados.length;
    const dia = associados.filter(emDia).length;
    const previsto = associados.reduce((s, a) => s + a.valor, 0);
    const recebido = associados.reduce((s, a) => s + (a.pag[MES_ATUAL] ? a.valor : 0), 0);
    const pagantes = associados.filter((a) => a.pag[MES_ATUAL]).length;
    $("#ind-ativos").textContent = ativos;
    $("#ind-emdia").textContent = dia;
    $("#ind-atraso").textContent = ativos - dia;
    $("#ind-recebido").textContent = real(recebido);
    $("#ind-previsto").textContent = real(previsto);
    $("#ind-barra").style.width = `${Math.round((recebido / previsto) * 100)}%`;
    $("#ind-nota").textContent = `${pagantes} de ${ativos} associados pagaram novembro. Vencimento no dia 10.`;

    const pend = ativos - dia;
    const ul = $("#tarefas");
    ul.replaceChildren();
    estado.tarefas.forEach((t) => {
      const id = `tarefa-${t.id}`;
      const texto = t.texto === "cobranca"
        ? (pend ? `Cobrar ${pend} ${pend === 1 ? "associado" : "associados"} com mensalidade em aberto` : "Cobrança do mês: ninguém em aberto")
        : t.texto;
      const caixa = el("input", { type: "checkbox", id, checked: t.feita });
      caixa.addEventListener("change", () => { t.feita = caixa.checked; renderInicio(); });
      const li = el("li", { classe: "tarefa" + (t.feita ? " tarefa--feita" : "") }, [
        caixa, el("label", { for: id, texto }),
      ]);
      if (t.texto === "cobranca" && pend && !t.feita) {
        li.append(el("a", { href: "#mensagens", classe: "tarefa__ir", texto: "Abrir mensagens" }));
      }
      ul.append(li);
    });
    const feitas = estado.tarefas.filter((t) => t.feita).length;
    $("#tarefas-resumo").textContent = `${feitas} de ${estado.tarefas.length} feitas`;

    const ol = $("#atividade");
    ol.replaceChildren(...estado.atividade.map((a) => el("li", null, [el("span", { classe: "atividade__hora", texto: a.hora }), el("span", { texto: a.texto })])));
  }

  function renderContadorMenu() {
    const pend = associados.filter((a) => !emDia(a)).length;
    const c = $("#menu-atraso");
    c.textContent = pend || "";
    c.hidden = !pend;
    c.setAttribute("aria-label", `${pend} associados em atraso`);
  }

  /* ---------- associados ---------- */
  const normal = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  function situacao(a) {
    const ms = emAberto(a);
    return ms.length
      ? el("span", { classe: "estado estado--alerta", texto: `${ms.length} ${ms.length === 1 ? "mês" : "meses"} em atraso` })
      : el("span", { classe: "estado estado--ok", texto: "Em dia" });
  }
  function renderAssociados() {
    const termo = normal($("#busca").value.trim());
    const filtro = $("#filtro-situacao").value;
    const lista = associados.filter((a) => {
      if (filtro === "emdia" && !emDia(a)) return false;
      if (filtro === "atraso" && emDia(a)) return false;
      return !termo || normal(a.nome + " " + a.posto).includes(termo);
    });
    $("#lista-associados").replaceChildren(...lista.map((a) => el("tr", null, [
      el("td", { "data-rotulo": "Nome", classe: "celula-nome" }, [el("b", { texto: a.nome }), el("small", { texto: `Matrícula ${a.matricula}` })]),
      el("td", { "data-rotulo": "Posto", texto: a.posto }),
      el("td", { "data-rotulo": "Categoria", texto: a.categoria }),
      el("td", { "data-rotulo": "Telefone", texto: a.telefone, classe: "celula-fone" }),
      el("td", { "data-rotulo": "Situação" }, [situacao(a)]),
      el("td", { classe: "celula-acao" }, [el("button", { type: "button", classe: "btn btn--pequeno", "aria-label": `Ver ficha de ${a.nome}`, texto: "Ver ficha", onclick: () => abrirFicha(a.id) })]),
    ])));
    $("#vazio-associados").hidden = lista.length > 0;
    $("#conta-associados").textContent = `${lista.length} de ${associados.length} associados`;
  }
  $("#busca").addEventListener("input", renderAssociados);
  $("#filtro-situacao").addEventListener("change", renderAssociados);

  /* ---------- ficha ---------- */
  const ficha = $("#ficha");
  let fichaId = null;
  function abrirFicha(id) {
    const a = porId(id);
    fichaId = id;
    $("#ficha-posto").textContent = `${a.posto}, ${a.categoria.toLowerCase()}`;
    $("#ficha-nome").textContent = a.nome;
    const [y, m, d] = a.nascimento.split("-");
    const dados = [
      ["Matrícula", a.matricula], ["Telefone", a.telefone + (a.semWhatsapp ? " (sem WhatsApp)" : "")],
      ["Nascimento", `${d}/${m}/${y}`], ["Associado desde", String(a.admissao)],
      ["Cidade", a.cidade], ["Mensalidade", real(a.valor)],
    ];
    $("#ficha-dados").replaceChildren(...dados.flatMap(([k, v]) => [el("div", null, [el("dt", { texto: k }), el("dd", { texto: v })])]));
    $("#ficha-meses").replaceChildren(...MESES.map((mes) => {
      const p = a.pag[mes.id];
      return el("li", null, [
        el("span", { texto: mes.rotulo }),
        p ? el("span", { classe: "estado estado--ok", texto: `Pago em ${p.data}` }) : el("span", { classe: "estado estado--alerta", texto: "Em aberto" }),
      ]);
    }));
    $("#ficha-cobrar").hidden = false;
    ficha.showModal();
  }
  $("#ficha-fechar").addEventListener("click", () => ficha.close());
  $("#ficha-fechar-x").addEventListener("click", () => ficha.close());
  ficha.addEventListener("click", (e) => { if (e.target === ficha) ficha.close(); });
  $("#ficha-cobrar").addEventListener("click", () => {
    ficha.close();
    if (estado.envio && estado.envio.rodando) { avisar("Há um envio em andamento. Espere terminar para escrever outra mensagem."); return; }
    estado.escolhidos = new Set([fichaId]);
    $('input[name="publico"][value="escolher"]').checked = true;
    mostrarEtapa("compor");
    location.hash = "#mensagens";
  });

  /* ---------- mensalidades ---------- */
  const selMes = $("#mes-ref");
  MESES.forEach((m) => selMes.append(el("option", { value: m.id, texto: m.rotulo, selected: m.id === MES_ATUAL })));
  function renderMensalidades() {
    const mes = MESES.find((m) => m.id === selMes.value);
    const mostrar = $('input[name="mostrar"]:checked').value;
    const pagos = associados.filter((a) => a.pag[mes.id]);
    const total = associados.reduce((s, a) => s + a.valor, 0);
    const recebido = pagos.reduce((s, a) => s + a.valor, 0);

    const resumo = $("#resumo-mes");
    resumo.replaceChildren(
      el("p", null, [el("b", { texto: `${pagos.length}` }), document.createTextNode(` de ${associados.length} pagaram`)]),
      el("p", null, [el("b", { texto: real(recebido) }), document.createTextNode(" recebidos")]),
      el("p", { classe: "resumo-mes__aberto" }, [el("b", { texto: real(total - recebido) }), document.createTextNode(" em aberto")]),
    );

    const lista = associados.filter((a) => mostrar === "todos" || (mostrar === "pagos" ? a.pag[mes.id] : !a.pag[mes.id]));
    $("#legenda-mensalidades").textContent = `Mensalidades de ${mes.rotulo.toLowerCase()}`;
    $("#lista-mensalidades").replaceChildren(...lista.map((a) => {
      const p = a.pag[mes.id];
      return el("tr", { classe: p ? "" : "linha-aberta" }, [
        el("td", { "data-rotulo": "Associado", classe: "celula-nome" }, [el("b", { texto: a.nome }), el("small", { texto: a.posto })]),
        el("td", { "data-rotulo": "Categoria", texto: a.categoria }),
        el("td", { "data-rotulo": "Valor", classe: "num", texto: real(a.valor) }),
        el("td", { "data-rotulo": "Situação" }, [p
          ? el("span", { classe: "estado estado--ok", texto: `Pago em ${p.data}` })
          : el("span", { classe: "estado estado--alerta", texto: "Em aberto" })]),
        el("td", { classe: "celula-acao" }, [p
          ? (p.nesta ? el("button", { type: "button", classe: "btn btn--pequeno btn--texto", "aria-label": `Desfazer a baixa de ${a.nome}`, texto: "Desfazer", onclick: () => desfazer(a.id, mes) }) : el("span", { classe: "celula-origem", texto: `Baixa por ${p.por}` }))
          : el("button", { type: "button", classe: "btn btn--sinal btn--pequeno", "aria-label": `Dar baixa na mensalidade de ${a.nome}`, texto: "Dar baixa", onclick: () => darBaixa(a.id, mes) })]),
      ]);
    }));
    const vazio = $("#vazio-mensalidades");
    vazio.hidden = lista.length > 0;
    vazio.textContent = mostrar === "abertos" ? `Todos pagaram ${mes.nome}. Nada a cobrar neste mês.` : "Ninguém pagou este mês ainda.";
  }
  function hoje() { const d = new Date(); return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`; }
  function darBaixa(id, mes) {
    const a = porId(id);
    a.pag[mes.id] = { data: hoje(), por: "secretaria", nesta: true };
    registrar(`Baixa de ${mes.nome} registrada para ${a.nome} (${real(a.valor)}).`);
    avisar(`Baixa registrada: ${a.nome}, ${mes.nome}.`);
    atualizarTudo();
    focarLinha(id);
  }
  function desfazer(id, mes) {
    const a = porId(id);
    a.pag[mes.id] = null;
    registrar(`Baixa de ${mes.nome} desfeita para ${a.nome}.`);
    avisar(`Baixa desfeita: ${a.nome}, ${mes.nome}.`);
    atualizarTudo();
    focarLinha(id);
  }
  function focarLinha(id) {
    const a = porId(id);
    const botao = $$("#lista-mensalidades button").find((b) => (b.getAttribute("aria-label") || "").endsWith(a.nome));
    if (botao) botao.focus(); else $("#resumo-mes").setAttribute("tabindex", "-1"), $("#resumo-mes").focus();
  }
  selMes.addEventListener("change", renderMensalidades);
  $$('input[name="mostrar"]').forEach((r) => r.addEventListener("change", renderMensalidades));

  /* ---------- mensagens ---------- */
  const TEXTO_PADRAO = "Olá, {nome}! Consta em aberto a mensalidade de {meses}, no total de {valor}. Você pode pagar pelo PIX da associação. Se já pagou, desconsidere esta mensagem.\n\nSecretaria da Associação Demonstração";
  const texto = $("#texto");
  texto.value = TEXTO_PADRAO;

  const publico = () => $('input[name="publico"]:checked').value;
  function destinatarios() {
    const p = publico();
    if (p === "pendentes") return associados.filter((a) => !emDia(a));
    if (p === "todos") return associados.slice();
    return associados.filter((a) => estado.escolhidos.has(a.id));
  }
  const montarTexto = (modelo, a) => modelo
    .replace(/\{nome\}/g, primeiroNome(a))
    .replace(/\{meses\}/g, listaMeses(emAberto(a)))
    .replace(/\{valor\}/g, real(devido(a)));

  function renderEscolha() {
    const termo = normal($("#busca-escolha").value.trim());
    const ul = $("#escolha-lista");
    ul.replaceChildren(...associados.filter((a) => !termo || normal(a.nome).includes(termo)).map((a) => {
      const id = `escolha-${a.id}`;
      const c = el("input", { type: "checkbox", id, checked: estado.escolhidos.has(a.id) });
      c.addEventListener("change", () => {
        if (c.checked) estado.escolhidos.add(a.id); else estado.escolhidos.delete(a.id);
        renderContasPublico(); renderPrevia();
      });
      return el("li", null, [c, el("label", { for: id }, [el("span", { texto: a.nome }), situacao(a)])]);
    }));
  }
  function renderContasPublico() {
    const pend = associados.filter((a) => !emDia(a)).length;
    $("#conta-pendentes").textContent = `${pend} ${pend === 1 ? "pessoa" : "pessoas"}, cada uma com seus meses e valor`;
    $("#conta-todos").textContent = `${associados.length} pessoas`;
    const n = estado.escolhidos.size;
    $("#conta-escolhidos").textContent = n ? `${n} ${n === 1 ? "marcada" : "marcadas"}` : "nenhuma marcada";
    $("#escolha").hidden = publico() !== "escolher";
  }
  function renderPrevia() {
    const sel = $("#previa-quem");
    const lista = estado.envio || !$("#etapa-revisar").hidden ? estado.lista.map(porId) : destinatarios();
    const atual = Number(sel.value);
    const base = lista.length ? lista : [associados[0]];
    sel.replaceChildren(...base.map((a) => el("option", { value: a.id, texto: lista.length ? `Prévia de ${primeiroNome(a)} ${a.nome.split(" ").slice(-1)}` : "Exemplo (ninguém na lista)" })));
    if (base.some((a) => a.id === atual)) sel.value = String(atual);
    const a = porId(Number(sel.value));
    $("#previa-inicial").textContent = a.nome[0];
    $("#previa-nome").textContent = a.nome;
    $("#previa-fone").textContent = a.telefone;
    const t = montarTexto(texto.value, a).trim();
    $("#previa-texto").textContent = t || "Escreva o texto para ver a prévia.";
    $("#previa-balao").classList.toggle("balao--vazio", !t);
    $("#texto-conta").textContent = `${texto.value.length} de 600 letras.`;
  }
  $("#previa-quem").addEventListener("change", renderPrevia);
  texto.addEventListener("input", renderPrevia);
  $("#busca-escolha").addEventListener("input", renderEscolha);
  $$('input[name="publico"]').forEach((r) => r.addEventListener("change", () => { renderContasPublico(); renderPrevia(); }));
  $$(".variavel").forEach((b) => b.addEventListener("click", () => {
    const v = b.dataset.var;
    const i = texto.selectionStart ?? texto.value.length;
    const f = texto.selectionEnd ?? texto.value.length;
    texto.setRangeText(v, i, f, "end");
    texto.focus();
    renderPrevia();
  }));

  function mostrarEtapa(etapa) {
    $("#etapa-compor").hidden = etapa !== "compor";
    $("#etapa-revisar").hidden = etapa !== "revisar";
    $("#etapa-enviar").hidden = etapa !== "enviar";
    $$(".etapas li").forEach((li) => {
      const ordem = ["compor", "revisar", "enviar"];
      const passou = ordem.indexOf(li.dataset.etapa) < ordem.indexOf(etapa);
      li.classList.toggle("etapa--feita", passou);
      if (li.dataset.etapa === etapa) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
    });
    if (etapa === "compor") { renderContasPublico(); renderEscolha(); }
    renderPrevia();
  }

  $("#etapa-compor").addEventListener("submit", (e) => {
    e.preventDefault();
    const erro = $("#erro-compor");
    const lista = destinatarios();
    let msg = "";
    if (!texto.value.trim()) msg = "Escreva o texto da mensagem antes de montar a lista.";
    else if (!lista.length) msg = publico() === "escolher" ? "Marque pelo menos uma pessoa para receber." : "Ninguém está com mensalidade em aberto. Escolha outro público.";
    erro.hidden = !msg;
    erro.textContent = msg;
    if (msg) return;
    estado.lista = lista.map((a) => a.id);
    $("#agenda").hidden = true;
    $("#abrir-agenda").setAttribute("aria-expanded", "false");
    mostrarEtapa("revisar");
    renderRevisao();
    $("#revisao-titulo").focus();
  });
  $("#voltar-texto").addEventListener("click", () => { mostrarEtapa("compor"); texto.focus(); });

  function renderRevisao() {
    const ul = $("#revisao-lista");
    ul.replaceChildren(...estado.lista.map((id) => {
      const a = porId(id);
      return el("li", { classe: "item-envio" }, [
        el("div", { classe: "item-envio__quem" }, [el("b", { texto: a.nome }), el("small", { texto: a.telefone })]),
        el("p", { classe: "item-envio__texto", texto: montarTexto(texto.value, a) }),
        el("button", { type: "button", classe: "btn btn--pequeno", "aria-label": `Tirar ${a.nome} da lista`, onclick: () => tirar(id) }, [
          svgX(), document.createTextNode("Tirar"),
        ]),
      ]);
    }));
    const n = estado.lista.length;
    const total = estado.lista.reduce((s, id) => s + devido(porId(id)), 0);
    $("#revisao-conta").textContent = n
      ? `${n} ${n === 1 ? "mensagem" : "mensagens"} na lista${publico() === "pendentes" ? `, somando ${real(total)} em aberto` : ""}.`
      : "A lista está vazia. Acrescente alguém para continuar.";
    $("#aprovar").disabled = !n;
    $("#abrir-agenda").disabled = !n;
    const fora = associados.filter((a) => !estado.lista.includes(a.id));
    const sel = $("#acrescentar-quem");
    sel.replaceChildren(...fora.map((a) => el("option", { value: a.id, texto: `${a.nome} (${emDia(a) ? "em dia" : "em atraso"})` })));
    sel.disabled = !fora.length;
    $("#acrescentar").disabled = !fora.length;
    renderPrevia();
  }
  function svgX() {
    const ns = "http://www.w3.org/2000/svg";
    const s = document.createElementNS(ns, "svg");
    s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("aria-hidden", "true"); s.setAttribute("fill", "none");
    s.setAttribute("stroke", "currentColor"); s.setAttribute("stroke-width", "2"); s.setAttribute("stroke-linecap", "round");
    const p = document.createElementNS(ns, "path"); p.setAttribute("d", "M7 7l10 10M17 7L7 17"); s.append(p);
    return s;
  }
  function tirar(id) {
    const idx = estado.lista.indexOf(id);
    estado.lista.splice(idx, 1);
    avisar(`${porId(id).nome} saiu da lista.`);
    renderRevisao();
    const botoes = $$("#revisao-lista button");
    (botoes[Math.min(idx, botoes.length - 1)] || $("#acrescentar-quem")).focus();
  }
  $("#acrescentar").addEventListener("click", () => {
    const id = Number($("#acrescentar-quem").value);
    if (!id) return;
    estado.lista.push(id);
    avisar(`${porId(id).nome} entrou na lista.`);
    renderRevisao();
    $("#acrescentar-quem").focus();
  });

  // agendamento
  const pad = (n) => String(n).padStart(2, "0");
  const isoData = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  $("#abrir-agenda").addEventListener("click", () => {
    const ag = $("#agenda");
    const abrir = ag.hidden;
    ag.hidden = !abrir;
    $("#abrir-agenda").setAttribute("aria-expanded", String(abrir));
    if (abrir) {
      const amanha = new Date(); amanha.setDate(amanha.getDate() + 1);
      const dataCampo = $("#agenda-data");
      dataCampo.min = isoData(new Date());
      if (!dataCampo.value) dataCampo.value = isoData(amanha);
      dataCampo.focus();
    }
  });
  $("#confirmar-agenda").addEventListener("click", () => {
    const d = $("#agenda-data").value, h = $("#agenda-hora").value;
    const erro = $("#erro-agenda");
    let msg = "";
    if (!d || !h) msg = "Informe a data e a hora.";
    else if (h < "08:00" || h > "19:00") msg = "Escolha um horário entre 8h e 19h.";
    else if (new Date(`${d}T${h}`) <= new Date()) msg = "Escolha uma data e hora no futuro.";
    erro.hidden = !msg; erro.textContent = msg;
    if (msg) return;
    const [y, m, dia] = d.split("-");
    const quando = `${dia}/${m}/${y} às ${h}`;
    estado.historico.unshift({ tipo: "agendado", texto: `Agendado para ${quando}`, detalhe: `${estado.lista.length} ${estado.lista.length === 1 ? "mensagem" : "mensagens"}`, quando });
    registrar(`Envio de ${estado.lista.length} mensagens agendado para ${quando}.`);
    avisar(`Agendado para ${quando}.`);
    renderHistorico();
    estado.lista = [];
    mostrarEtapa("compor");
    $("#historico-titulo").setAttribute("tabindex", "-1");
    $("#historico-titulo").focus();
  });

  // envio simulado
  function renderEnvio() {
    const e = estado.envio;
    const feitos = e.itens.filter((i) => i.st === "ok" || i.st === "falha").length;
    $("#andamento-texto").textContent = e.rodando
      ? `Enviando ${Math.min(feitos + 1, e.itens.length)} de ${e.itens.length}. Próxima em instantes.`
      : `${feitos} de ${e.itens.length} processadas.`;
    const barra = $("#andamento-barra");
    barra.setAttribute("aria-valuemax", e.itens.length);
    barra.setAttribute("aria-valuenow", feitos);
    $("span", barra).style.width = `${(feitos / e.itens.length) * 100}%`;
    const rotulo = { fila: "Na fila", enviando: "Enviando", ok: "Enviada", falha: "Falhou: número sem WhatsApp", parado: "Não enviada (envio parado)" };
    const classe = { fila: "", enviando: "estado--sinal", ok: "estado--ok", falha: "estado--alerta", parado: "" };
    $("#envio-lista").replaceChildren(...e.itens.map((i) => {
      const a = porId(i.id);
      return el("li", { classe: `item-envio item-envio--${i.st}` }, [
        el("div", { classe: "item-envio__quem" }, [el("b", { texto: a.nome }), el("small", { texto: a.telefone })]),
        el("span", { classe: `estado ${classe[i.st]} item-envio__estado`, texto: rotulo[i.st] + (i.hora ? ` às ${i.hora}` : "") }),
      ]);
    }));
  }
  $("#aprovar").addEventListener("click", () => {
    estado.envio = { itens: estado.lista.map((id) => ({ id, st: "fila" })), rodando: true, modelo: texto.value, inicio: new Date() };
    $("#relatorio").hidden = true;
    $("#acoes-fim").hidden = true;
    $("#parar").hidden = false;
    $("#envio-titulo").textContent = "Enviando um por um";
    mostrarEtapa("enviar");
    renderEnvio();
    $("#envio-titulo").focus();
    proximo();
  });
  function proximo() {
    const e = estado.envio;
    if (!e || !e.rodando) return;
    const item = e.itens.find((i) => i.st === "fila");
    if (!item) return concluir();
    item.st = "enviando";
    renderEnvio();
    e.tempo = setTimeout(() => {
      const d = new Date();
      item.st = porId(item.id).semWhatsapp ? "falha" : "ok";
      item.hora = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
      renderEnvio();
      proximo();
    }, 1000 + Math.floor(Math.random() * 1000));
  }
  $("#parar").addEventListener("click", () => {
    const e = estado.envio;
    if (!e || !e.rodando) return;
    clearTimeout(e.tempo);
    e.itens.forEach((i) => { if (i.st === "fila" || i.st === "enviando") i.st = "parado"; });
    concluir(true);
  });
  function concluir(parado) {
    const e = estado.envio;
    e.rodando = false;
    const ok = e.itens.filter((i) => i.st === "ok").length;
    const falhas = e.itens.filter((i) => i.st === "falha");
    const naoEnv = e.itens.filter((i) => i.st === "parado").length;
    renderEnvio();
    $("#parar").hidden = true;
    $("#envio-titulo").textContent = parado ? "Envio parado" : "Envio concluído";
    $("#andamento-texto").textContent = parado ? "O envio foi parado antes do fim." : "Todas as mensagens da lista foram processadas.";
    const rel = $("#relatorio");
    rel.replaceChildren(...[
      el("div", { classe: "relatorio__numeros" }, [
        el("p", { classe: "numero numero--ok" }, [el("b", { texto: String(ok) }), el("span", { texto: ok === 1 ? "enviada" : "enviadas" })]),
        el("p", { classe: falhas.length ? "numero numero--alerta" : "numero" }, [el("b", { texto: String(falhas.length) }), el("span", { texto: falhas.length === 1 ? "falhou" : "falharam" })]),
        naoEnv ? el("p", { classe: "numero" }, [el("b", { texto: String(naoEnv) }), el("span", { texto: "não enviadas" })]) : null,
      ]),
      falhas.length ? el("p", { classe: "relatorio__falhas", texto: `Sem WhatsApp: ${falhas.map((i) => porId(i.id).nome).join(", ")}. Atualize o telefone na ficha ou cobre por outro meio.` }) : null,
    ].filter(Boolean));
    rel.hidden = false;
    $("#acoes-fim").hidden = false;
    const d = new Date();
    estado.historico.unshift({ tipo: "enviado", texto: parado ? "Envio parado" : "Envio concluído", detalhe: `${ok} ${ok === 1 ? "enviada" : "enviadas"}, ${falhas.length} com falha${naoEnv ? `, ${naoEnv} não enviadas` : ""}`, quando: `hoje, ${pad(d.getHours())}:${pad(d.getMinutes())}` });
    registrar(`Mensagens enviadas pelo WhatsApp: ${ok} de ${e.itens.length}.`);
    renderHistorico();
    $("#envio-titulo").focus();
  }
  $("#nova-mensagem").addEventListener("click", () => {
    estado.envio = null;
    estado.lista = [];
    mostrarEtapa("compor");
    texto.focus();
  });

  function renderHistorico() {
    const ul = $("#historico");
    ul.replaceChildren(...estado.historico.map((h) => el("li", { classe: `historico__item historico__item--${h.tipo}` }, [
      el("span", { classe: `estado ${h.tipo === "agendado" ? "estado--sinal" : "estado--ok"}`, texto: h.texto }),
      el("small", { texto: h.tipo === "agendado" ? h.detalhe : `${h.detalhe}, ${h.quando}` }),
    ])));
    $("#historico-vazio").hidden = estado.historico.length > 0;
  }

  /* ---------- geral ---------- */
  function renderizar(secao) {
    if (secao === "inicio") renderInicio();
    if (secao === "associados") renderAssociados();
    if (secao === "mensalidades") renderMensalidades();
    if (secao === "mensagens") {
      if (!estado.envio && $("#etapa-revisar").hidden) mostrarEtapa("compor"); else renderPrevia();
    }
  }
  function atualizarTudo() {
    renderContadorMenu();
    const atual = location.hash.slice(1) || "inicio";
    renderizar(TITULOS[atual] ? atual : "inicio");
  }

  pintarBotaoTema();
  renderContadorMenu();
  renderHistorico();
  irPara(location.hash.slice(1) || "inicio", false);
})();
