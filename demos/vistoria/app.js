/* Demonstração: vistoria diária de viaturas.
   Estado só em memória. Nenhum dado sai do navegador. */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtKm = (n) => n.toLocaleString('pt-BR');
  const hhmm = (d) => d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const diaMes = (d) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  const reduzido = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const movel = () => window.matchMedia('(max-width: 600px)').matches;

  /* ---------- Ícones (SVG de traço) ---------- */
  const ICONES = {
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    alerta: '<path d="M12 3.5l9.5 17h-19z"/><path d="M12 10v4.5M12 17.5v.01"/>',
    wifi: '<path d="M2.5 9a14 14 0 0 1 19 0"/><path d="M5.8 12.6a9 9 0 0 1 12.4 0"/><path d="M9 16.2a4.4 4.4 0 0 1 6 0"/><path d="M12 19.6v.01"/>',
    semWifi: '<path d="M2.5 9a14 14 0 0 1 6-3.2M13.5 5.6A14 14 0 0 1 21.5 9"/><path d="M5.8 12.6a9 9 0 0 1 3.4-2M16 11a9 9 0 0 1 2.2 1.6"/><path d="M9 16.2a4.4 4.4 0 0 1 6 0"/><path d="M12 19.6v.01"/><path d="M3.5 3.5l17 17"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
    voltar: '<path d="M15 5l-7 7 7 7"/>',
    seguir: '<path d="M9 5l7 7-7 7"/>',
    fechar: '<path d="M6 6l12 12M18 6L6 18"/>',
    relogio: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    enviar: '<path d="M4 12l16-8-6 16-2.5-6.5z"/><path d="M11.5 13.5L20 4"/>',
    sol: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
    lua: '<path d="M19.5 14.5A7.5 7.5 0 0 1 9.5 4.5a7.5 7.5 0 1 0 10 10z"/>',
    ferramenta: '<path d="M14.5 6.5a4 4 0 0 0 5 5L13 18a2 2 0 0 1-3-3z"/><path d="M14.5 6.5L17 4l3 3-2.5 2.5"/>',
  };
  const icone = (n, cls = 'ic') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICONES[n]}</svg>`;

  /* ---------- Dados fictícios ---------- */
  const MOTORISTA = 'R. Siqueira';
  const COMB = ['Reserva', '1/4', '1/2', '3/4', 'Cheio'];
  const ETAPAS = ['Quilometragem', 'Combustível', 'Documentos', 'Itens', 'Revisão'];
  const GRUPOS = [
    { id: 'pneus', nome: 'Pneus', itens: ['Pneus dianteiros', 'Pneus traseiros', 'Estepe', 'Calibragem'] },
    { id: 'luzes', nome: 'Luzes', itens: ['Faróis', 'Lanternas traseiras', 'Setas', 'Luz de freio'] },
    { id: 'sinal', nome: 'Sinalização e rádio', itens: ['Sirene', 'Giroflex', 'Rádio comunicador'] },
    { id: 'mec', nome: 'Mecânica', itens: ['Freios', 'Freio de mão', 'Nível do óleo', 'Água do radiador'] },
    { id: 'seg', nome: 'Segurança e limpeza', itens: ['Cintos de segurança', 'Extintor', 'Macaco e triângulo', 'Limpeza interna', 'Limpeza externa'] },
  ];
  const ITENS = GRUPOS.flatMap((g) => g.itens.map((nome, i) => ({ id: `${g.id}-${i}`, nome, grupo: g.id })));
  const DOCS = { crlv: 'CRLV', cartao: 'Cartão combustível' };
  const nomeItem = (id) => (id.startsWith('doc-') ? `${DOCS[id.slice(4)]} ausente` : ITENS.find((i) => i.id === id).nome);

  const VIATURAS = [
    { id: 'VTR-101', placa: 'QXT4B17', modelo: 'Picape 4x4' },
    { id: 'VTR-102', placa: 'LRM2C84', modelo: 'Sedã' },
    { id: 'VTR-103', placa: 'PZA7E03', modelo: 'Picape 4x4' },
    { id: 'VTR-104', placa: 'KJW5F61', modelo: 'SUV' },
    { id: 'VTR-105', placa: 'TNE9A42', modelo: 'Sedã' },
    { id: 'VTR-106', placa: 'HBU3D58', modelo: 'Furgão' },
    { id: 'VTR-107', placa: 'RYC6G20', modelo: 'Picape 4x4' },
    { id: 'VTR-108', placa: 'MFO1H97', modelo: 'SUV' },
  ];
  const KM_ONTEM = [48213, 61870, 35402, 72955, 52046, 28731, 44198, 19564];
  const viatura = (id) => VIATURAS.find((v) => v.id === id);

  const HOJE = new Date();
  const diasAtras = (n) => { const d = new Date(HOJE); d.setDate(d.getDate() - n); return d; };
  const mesmoDia = (a, b) => a.toDateString() === b.toDateString();
  const OUTROS = ['A. Moura', 'L. Prado', 'J. Teles', 'C. Andrade', 'M. Freitas'];

  let seq = 1;
  const registros = [];

  VIATURAS.forEach((v, idx) => {
    let km = KM_ONTEM[idx];
    for (let d = 1; d <= 5; d++) {
      registros.push({
        id: `r${seq++}`, vtr: v.id, data: diasAtras(d),
        hora: `${String(6 + ((idx + d) % 2)).padStart(2, '0')}:${String((idx * 7 + d * 11) % 60).padStart(2, '0')}`,
        motorista: OUTROS[(idx + d) % 5], km, combustivel: (idx + d) % 5 === 0 ? 1 : 2 + ((idx + d) % 3),
        problemas: [], status: 'aprovada', aprovadaEm: '07:30',
      });
      km -= 60 + ((idx * 37 + d * 53) % 140);
    }
  });
  const passado = (vtr, d) => registros.find((r) => r.vtr === vtr && mesmoDia(r.data, diasAtras(d)));
  passado('VTR-104', 2).problemas.push({ item: 'luzes-2', obs: 'Seta dianteira direita piscando rápido.', foto: null, resolvida: true });
  passado('VTR-101', 3).problemas.push({ item: 'pneus-3', obs: 'Pneu traseiro esquerdo com 24 psi.', foto: null, resolvida: true });
  passado('VTR-107', 1).problemas.push({ item: 'sinal-1', obs: 'Giroflex falhando no lado direito.', foto: null, resolvida: true });

  const hojeSeed = [
    { vtr: 'VTR-102', hora: '06:58', motorista: 'A. Moura', delta: 84, combustivel: 4, problemas: [], status: 'aprovada', aprovadaEm: '07:05' },
    { vtr: 'VTR-105', hora: '07:20', motorista: 'L. Prado', delta: 112, combustivel: 2, status: 'aguardando',
      problemas: [{ item: 'luzes-1', obs: 'Lanterna traseira esquerda queimada.', foto: null, resolvida: false }] },
    { vtr: 'VTR-107', hora: '07:41', motorista: 'J. Teles', delta: 57, combustivel: 0, status: 'aguardando',
      problemas: [
        { item: 'doc-crlv', obs: 'Documento não estava no porta-luvas.', foto: null, resolvida: false },
        { item: 'seg-3', obs: 'Bancos com barro e lixo no assoalho.', foto: null, resolvida: false },
      ] },
  ];
  hojeSeed.forEach((s) => {
    const idx = VIATURAS.findIndex((v) => v.id === s.vtr);
    registros.push({ id: `r${seq++}`, vtr: s.vtr, data: HOJE, hora: s.hora, motorista: s.motorista, km: KM_ONTEM[idx] + s.delta,
      combustivel: s.combustivel, problemas: s.problemas, status: s.status, aprovadaEm: s.aprovadaEm || null });
  });

  const ordenar = () => registros.sort((a, b) => (b.data - a.data) || b.hora.localeCompare(a.hora));
  ordenar();

  const ultimoRegistro = (vtr) => registros.find((r) => r.vtr === vtr);
  const registroHoje = (vtr) => registros.find((r) => r.vtr === vtr && mesmoDia(r.data, HOJE));

  /* ---------- Estado ---------- */
  const estado = {
    online: true,
    fila: [],
    transito: [],
    tela: 'viaturas', // viaturas | etapa | recibo
    atual: null,
    recibo: null,
    abertos: new Set(),
    histVtr: 'VTR-105',
  };

  /* ---------- Avisos para leitor de tela ---------- */
  function anunciar(txt) {
    const a = $('#aviso');
    a.textContent = '';
    setTimeout(() => { a.textContent = txt; }, 30);
  }

  /* =========================================================
     APP DO MOTORISTA
     ========================================================= */
  const corpo = $('#app-corpo');
  const cabeca = $('#app-cabeca');
  const acoes = $('#app-acoes');

  function saudacao() {
    const h = new Date().getHours();
    return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  }

  function placa(p) { return `<span class="placa" aria-label="Placa ${p.split('').join(' ')}">${p}</span>`; }

  function telaViaturas() {
    const itens = VIATURAS.map((v) => {
      const reg = registroHoje(v.id);
      const naFila = estado.fila.find((f) => f.vtr === v.id);
      const emTransito = estado.transito.find((f) => f.vtr === v.id);
      const ult = ultimoRegistro(v.id);
      let situacao = '<span class="estado estado--sinal">Vistoria pendente</span>';
      if (emTransito) situacao = `<span class="estado estado--sinal">${icone('enviar')}Enviando</span>`;
      else if (naFila) situacao = `<span class="estado estado--sinal">${icone('relogio')}Na fila do aparelho</span>`;
      else if (reg) situacao = `<span class="estado estado--ok">Vistoriada às ${reg.hora}</span>`;
      const feita = Boolean(reg || naFila || emTransito);
      return `<li>
        <button type="button" class="vtr${feita ? ' vtr--feita' : ''}" data-acao="escolher" data-vtr="${v.id}" ${feita ? 'disabled' : ''}>
          <span class="vtr__topo"><b class="vtr__id">${v.id}</b>${placa(v.placa)}</span>
          <span class="vtr__info">${v.modelo}, ${fmtKm(ult.km)} km</span>
          ${situacao}
          ${feita ? '' : icone('seguir', 'ic vtr__seta')}
        </button>
      </li>`;
    }).join('');
    const pendentes = VIATURAS.filter((v) => !registroHoje(v.id) && !estado.fila.find((f) => f.vtr === v.id) && !estado.transito.find((f) => f.vtr === v.id)).length;
    return `<h2 class="app__titulo" tabindex="-1">Qual viatura você vai vistoriar?</h2>
      <p class="app__sub">${pendentes === 0 ? 'Todas as viaturas já foram vistoriadas hoje.' : `${pendentes} de ${VIATURAS.length} viaturas ainda sem vistoria hoje.`}</p>
      <ul class="lista-vtr">${itens}</ul>`;
  }

  function cabecaInicio() {
    return `<div class="saudacao"><p><b>${saudacao()}, ${MOTORISTA}.</b></p><p>Unidade Demonstração, ${HOJE.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p></div>`;
  }

  function cabecaEtapa() {
    const a = estado.atual;
    const v = viatura(a.vtr);
    const passos = ETAPAS.map((_, i) => `<span class="${i < a.etapa ? 'feito' : i === a.etapa ? 'atual' : ''}"></span>`).join('');
    return `<div class="etapa-cabeca">
      <div class="etapa-cabeca__linha">
        <p class="etapa-cabeca__vtr"><b>${v.id}</b>${placa(v.placa)}</p>
        <button type="button" class="icone-btn" data-acao="cancelar" aria-label="Cancelar vistoria">${icone('fechar')}</button>
      </div>
      <p class="etapa-cabeca__texto">Etapa ${a.etapa + 1} de ${ETAPAS.length}: ${ETAPAS[a.etapa]}</p>
      <div class="passos" aria-hidden="true">${passos}</div>
    </div>`;
  }

  function erroEtapa() { return '<div class="erro-etapa" id="erro-etapa" role="alert" hidden></div>'; }

  function etapaKm() {
    const a = estado.atual;
    const ult = ultimoRegistro(a.vtr);
    return `<h2 class="app__titulo" tabindex="-1">Quilometragem</h2>
      <p class="app__sub">Última vistoria: <b>${fmtKm(ult.km)} km</b>, em ${diaMes(ult.data)} por ${ult.motorista}.</p>
      ${erroEtapa()}
      <label class="rotulo" for="km">Hodômetro agora</label>
      <div class="campo-km">
        <input id="km" name="km" inputmode="numeric" autocomplete="off" enterkeyhint="next" value="${esc(a.km)}" aria-describedby="km-ajuda km-erro">
        <span aria-hidden="true">km</span>
      </div>
      <p class="ajuda" id="km-ajuda">Digite o número do painel, sem casas decimais.</p>
      <p class="erro" id="km-erro" hidden></p>`;
  }

  function etapaComb() {
    const a = estado.atual;
    const niveis = COMB.map((n, i) => `<label class="nivel">
        <input type="radio" name="comb" value="${i}" ${a.comb === i ? 'checked' : ''}>
        <span class="nivel__barra" style="--h:${i}"></span>
        <span class="nivel__nome">${n}</span>
      </label>`).join('');
    return `<h2 class="app__titulo" tabindex="-1">Combustível</h2>
      <p class="app__sub">Olhe o marcador do painel com a viatura ligada.</p>
      ${erroEtapa()}
      <fieldset class="medidor" data-nivel="${a.comb ?? ''}">
        <legend class="rotulo">Nível do tanque</legend>
        <div class="medidor__barras">${niveis}</div>
      </fieldset>
      <p class="aviso-reserva" id="aviso-reserva" ${a.comb === 0 ? '' : 'hidden'}>${icone('alerta')}Abasteça antes de sair. O chefe de garagem verá o tanque na reserva.</p>`;
  }

  function opcoes(nome, valor, a, b) {
    return `<div class="opcoes">
      <label class="opcao opcao--ok"><input type="radio" name="${nome}" value="${a[0]}" ${valor === a[0] ? 'checked' : ''}><span>${icone('check')}${a[1]}</span></label>
      <label class="opcao opcao--problema"><input type="radio" name="${nome}" value="${b[0]}" ${valor === b[0] ? 'checked' : ''}><span>${icone('alerta')}${b[1]}</span></label>
    </div>`;
  }

  function etapaDocs() {
    const a = estado.atual;
    const linha = (id, ajuda) => `<li><fieldset class="item${a.docs[id] === false ? ' item--problema' : ''}" id="doc-${id}">
        <legend class="item__nome">${DOCS[id]}<span class="item__ajuda">${ajuda}</span></legend>
        ${opcoes(`doc-${id}`, a.docs[id] === null ? null : a.docs[id] ? 'sim' : 'nao', ['sim', 'Está'], ['nao', 'Não está'])}
      </fieldset></li>`;
    return `<h2 class="app__titulo" tabindex="-1">Documentos</h2>
      <p class="app__sub">Confira se os documentos estão na viatura.</p>
      ${erroEtapa()}
      <ul class="itens">
        ${linha('crlv', 'Documento do veículo, no porta-luvas')}
        ${linha('cartao', 'Cartão de abastecimento da frota')}
      </ul>`;
  }

  function fotoHtml(id) {
    const s = estado.atual.itens[id];
    if (s && s.foto) {
      return `<img class="foto__mini" src="${s.foto}" alt="Foto anexada do item ${esc(nomeItem(id))}">
        <div class="foto__dados"><span class="foto__nome">${esc(s.fotoNome)}</span>
        <button type="button" class="btn btn--texto" data-acao="remover-foto" data-item="${id}">Remover foto</button></div>`;
    }
    return `<label class="btn foto__botao">${icone('camera')}Anexar foto
        <input type="file" accept="image/*" class="arquivo" data-foto="${id}" aria-describedby="foto-dica-${id}">
      </label>
      <span class="foto__dica" id="foto-dica-${id}">Opcional. A imagem fica só neste navegador.</span>`;
  }

  function itemHtml(it) {
    const s = estado.atual.itens[it.id] || {};
    const prob = s.sit === 'problema';
    return `<li><fieldset class="item${prob ? ' item--problema' : ''}" id="item-${it.id}">
      <legend class="item__nome">${it.nome}</legend>
      ${opcoes(`item-${it.id}`, s.sit, ['ok', 'OK'], ['problema', 'Com problema'])}
      <div class="problema" id="prob-${it.id}" ${prob ? '' : 'hidden'}>
        <label class="rotulo" for="obs-${it.id}">O que você encontrou?</label>
        <textarea id="obs-${it.id}" data-obs="${it.id}" rows="2" maxlength="200" aria-describedby="obs-erro-${it.id}">${esc(s.obs || '')}</textarea>
        <p class="erro" id="obs-erro-${it.id}" hidden>Descreva o problema para o chefe de garagem.</p>
        <div class="foto" id="foto-${it.id}">${fotoHtml(it.id)}</div>
      </div>
    </fieldset></li>`;
  }

  function contagemItens() {
    return ITENS.filter((i) => estado.atual.itens[i.id]?.sit).length;
  }

  function etapaItens() {
    const grupos = GRUPOS.map((g) => {
      const its = ITENS.filter((i) => i.grupo === g.id);
      return `<section class="grupo" aria-labelledby="g-${g.id}">
        <div class="grupo__cabeca">
          <h3 id="g-${g.id}">${g.nome} <span class="grupo__conta" id="conta-${g.id}"></span></h3>
          <button type="button" class="btn btn--texto" data-acao="todos-ok" data-grupo="${g.id}">Marcar o resto como OK</button>
        </div>
        <ul class="itens">${its.map(itemHtml).join('')}</ul>
      </section>`;
    }).join('');
    return `<h2 class="app__titulo" tabindex="-1">Itens da viatura</h2>
      <p class="app__sub" id="contador"></p>
      ${erroEtapa()}
      ${grupos}`;
  }

  function atualizarContagens() {
    const c = $('#contador');
    if (!c) return;
    const n = contagemItens();
    const p = ITENS.filter((i) => estado.atual.itens[i.id]?.sit === 'problema').length;
    c.textContent = `${n} de ${ITENS.length} itens conferidos${p ? `, ${p} com problema` : ''}.`;
    GRUPOS.forEach((g) => {
      const its = ITENS.filter((i) => i.grupo === g.id);
      const feitos = its.filter((i) => estado.atual.itens[i.id]?.sit).length;
      const el = $(`#conta-${g.id}`);
      el.textContent = `${feitos} de ${its.length}`;
      el.classList.toggle('grupo__conta--completo', feitos === its.length);
    });
  }

  function problemasAtuais() {
    const a = estado.atual;
    const lista = [];
    Object.keys(DOCS).forEach((d) => { if (a.docs[d] === false) lista.push({ item: `doc-${d}`, obs: 'Documento não estava na viatura.', foto: null }); });
    ITENS.forEach((i) => {
      const s = a.itens[i.id];
      if (s?.sit === 'problema') lista.push({ item: i.id, obs: s.obs.trim(), foto: s.foto, fotoNome: s.fotoNome });
    });
    return lista;
  }

  function listaProblemas(lista, comBotao) {
    return `<ul class="probs">${lista.map((p, i) => `<li class="prob">
      ${p.foto ? `<img class="prob__foto" src="${p.foto}" alt="Foto: ${esc(nomeItem(p.item))}">` : `<span class="prob__semfoto" aria-hidden="true">${icone(p.item.startsWith('doc-') ? 'alerta' : 'camera')}</span>`}
      <div class="prob__texto"><b>${esc(nomeItem(p.item))}</b><span>${esc(p.obs)}</span>${p.foto ? '' : '<span class="prob__meta">Sem foto</span>'}</div>
      ${comBotao ? comBotao(p, i) : ''}
    </li>`).join('')}</ul>`;
  }

  function etapaRevisao() {
    const a = estado.atual;
    const ult = ultimoRegistro(a.vtr);
    const km = Number(a.km);
    const probs = problemasAtuais();
    const ok = ITENS.length - ITENS.filter((i) => a.itens[i.id]?.sit === 'problema').length;
    return `<h2 class="app__titulo" tabindex="-1">Revisão</h2>
      <p class="app__sub">Confira antes de enviar. Depois de enviada, a vistoria vai para aprovação do chefe de garagem.</p>
      <dl class="resumo">
        <div><dt>Quilometragem</dt><dd>${fmtKm(km)} km <span class="resumo__extra">+${fmtKm(km - ult.km)} desde a última</span></dd></div>
        <div><dt>Combustível</dt><dd>${medidorMini(a.comb)} ${COMB[a.comb]}</dd></div>
        <div><dt>Documentos</dt><dd>${Object.keys(DOCS).map((d) => `${DOCS[d]}: ${a.docs[d] ? 'está' : '<b class="txt-alerta">não está</b>'}`).join('<br>')}</dd></div>
        <div><dt>Itens</dt><dd>${ok} OK${probs.filter((p) => !p.item.startsWith('doc-')).length ? `, <b class="txt-alerta">${ITENS.length - ok} com problema</b>` : ''}</dd></div>
      </dl>
      ${probs.length ? `<h3 class="sub-h">Problemas relatados</h3>${listaProblemas(probs)}` : '<p class="tudo-ok">' + icone('check') + 'Nenhum problema encontrado.</p>'}
      ${estado.online ? '' : `<p class="nota-fila">${icone('semWifi')}Você está sem internet. Ao enviar, a vistoria fica guardada no aparelho e segue sozinha quando a conexão voltar.</p>`}`;
  }

  function reciboEstado(v) {
    if (v.situacao === 'fila') return { cls: 'fila', ic: 'relogio', titulo: 'Vistoria guardada no aparelho', texto: 'Sem internet agora. Ela será enviada assim que a conexão voltar; você pode seguir com o serviço.' };
    if (v.situacao === 'enviando') return { cls: 'enviando', ic: 'enviar', titulo: 'Enviando vistoria…', texto: 'Aguarde um instante.' };
    return { cls: 'ok', ic: 'check', titulo: 'Vistoria enviada', texto: `O painel do chefe de garagem recebeu às ${v.recebidaEm}. Ela aguarda aprovação.` };
  }

  function telaRecibo() {
    const v = estado.recibo;
    const r = reciboEstado(v);
    return `<div class="recibo">
      <span class="recibo__selo recibo__selo--${r.cls}" id="recibo-selo" aria-hidden="true">${icone(r.ic)}</span>
      <h2 class="app__titulo" tabindex="-1" id="recibo-titulo">${r.titulo}</h2>
      <p class="app__sub" id="recibo-texto">${r.texto}</p>
      <dl class="resumo">
        <div><dt>Viatura</dt><dd>${v.vtr} ${placa(viatura(v.vtr).placa)}</dd></div>
        <div><dt>Horário</dt><dd>${v.hora}</dd></div>
        <div><dt>Quilometragem</dt><dd>${fmtKm(v.km)} km</dd></div>
        <div><dt>Problemas</dt><dd>${v.problemas.length ? `<b class="txt-alerta">${v.problemas.length}</b>` : 'Nenhum'}</dd></div>
      </dl>
    </div>`;
  }

  function atualizarRecibo() {
    if (estado.tela !== 'recibo') return;
    const r = reciboEstado(estado.recibo);
    const selo = $('#recibo-selo');
    selo.className = `recibo__selo recibo__selo--${r.cls}`;
    selo.innerHTML = icone(r.ic);
    $('#recibo-titulo').textContent = r.titulo;
    $('#recibo-texto').textContent = r.texto;
  }

  function acoesHtml() {
    if (estado.tela === 'recibo') {
      return `<button type="button" class="btn btn--sinal btn--largo" data-acao="nova">Fazer outra vistoria</button>`;
    }
    const a = estado.atual;
    const ultima = a.etapa === ETAPAS.length - 1;
    const voltar = a.etapa === 0
      ? `<button type="button" class="btn" data-acao="cancelar">Cancelar</button>`
      : `<button type="button" class="btn" data-acao="voltar">${icone('voltar')}Voltar</button>`;
    const seguir = ultima
      ? `<button type="button" class="btn btn--sinal btn--largo" data-acao="enviar">${icone('enviar')}${estado.online ? 'Enviar vistoria' : 'Guardar na fila'}</button>`
      : `<button type="button" class="btn btn--sinal btn--largo" data-acao="continuar">Continuar${icone('seguir')}</button>`;
    return voltar + seguir;
  }

  function renderApp(focar = true) {
    const ativo = document.activeElement;
    const chave = ativo && corpo.contains(ativo) && ativo.dataset.vtr;
    if (estado.tela === 'viaturas') {
      cabeca.innerHTML = cabecaInicio();
      corpo.innerHTML = telaViaturas();
      acoes.hidden = true;
      acoes.innerHTML = '';
    } else if (estado.tela === 'etapa') {
      cabeca.innerHTML = cabecaEtapa();
      corpo.innerHTML = [etapaKm, etapaComb, etapaDocs, etapaItens, etapaRevisao][estado.atual.etapa]();
      acoes.hidden = false;
      acoes.innerHTML = acoesHtml();
      if (estado.atual.etapa === 3) atualizarContagens();
    } else {
      cabeca.innerHTML = '';
      corpo.innerHTML = telaRecibo();
      acoes.hidden = false;
      acoes.innerHTML = acoesHtml();
    }
    if (focar) {
      corpo.scrollTop = 0;
      if (movel()) window.scrollTo({ top: 0 });
      const h = $('h2', corpo);
      if (h) h.focus({ preventScroll: true });
    } else if (chave) {
      const b = $(`[data-vtr="${chave}"]`, corpo);
      if (b && !b.disabled) b.focus({ preventScroll: true });
    }
  }

  function mostrarErro(msg, foco) {
    const e = $('#erro-etapa');
    if (e) { e.innerHTML = `${icone('alerta')}<span>${msg}</span>`; e.hidden = false; }
    if (foco) { foco.focus(); foco.scrollIntoView({ block: 'center', behavior: reduzido() ? 'auto' : 'smooth' }); }
  }

  function validar() {
    const a = estado.atual;
    if (a.etapa === 0) {
      const input = $('#km');
      const err = $('#km-erro');
      const ult = ultimoRegistro(a.vtr).km;
      const km = Number(String(a.km).replace(/\D/g, ''));
      let msg = '';
      if (!a.km.trim()) msg = 'Digite a quilometragem do painel da viatura.';
      else if (!/^[\d.\s]+$/.test(a.km)) msg = 'Use só números.';
      else if (km < ult) msg = `O valor não pode ser menor que ${fmtKm(ult)} km, a última vistoria registrada.`;
      if (msg) {
        err.textContent = msg; err.hidden = false; input.setAttribute('aria-invalid', 'true'); input.focus();
        return false;
      }
      if (km - ult > 800 && !a.kmConfirmado) {
        a.kmConfirmado = true;
        err.textContent = `Confira: são ${fmtKm(km - ult)} km a mais que a última vistoria. Se estiver certo, toque em Continuar de novo.`;
        err.hidden = false; input.focus();
        return false;
      }
      a.km = String(km);
      return true;
    }
    if (a.etapa === 1) {
      if (a.comb === null) { mostrarErro('Escolha o nível do tanque.', $('input[name="comb"]')); return false; }
      return true;
    }
    if (a.etapa === 2) {
      const falta = Object.keys(DOCS).find((d) => a.docs[d] === null);
      if (falta) { mostrarErro(`Responda se o ${DOCS[falta]} está na viatura.`, $(`input[name="doc-${falta}"]`)); return false; }
      return true;
    }
    if (a.etapa === 3) {
      const faltam = ITENS.filter((i) => !a.itens[i.id]?.sit);
      if (faltam.length) {
        mostrarErro(`Faltam ${faltam.length} ${faltam.length === 1 ? 'item' : 'itens'}. O primeiro é ${faltam[0].nome}.`, $(`input[name="item-${faltam[0].id}"]`));
        return false;
      }
      const semObs = ITENS.find((i) => a.itens[i.id].sit === 'problema' && !a.itens[i.id].obs.trim());
      if (semObs) {
        $(`#obs-erro-${semObs.id}`).hidden = false;
        mostrarErro(`Descreva o problema em ${semObs.nome}.`, $(`#obs-${semObs.id}`));
        return false;
      }
      return true;
    }
    return true;
  }

  function cancelar() {
    if (estado.atual) Object.values(estado.atual.itens).forEach((s) => s.foto && URL.revokeObjectURL(s.foto));
    estado.atual = null;
    estado.tela = 'viaturas';
    renderApp();
  }

  function enviar() {
    const a = estado.atual;
    const v = {
      id: `r${seq++}`, vtr: a.vtr, data: new Date(), hora: hhmm(new Date()), motorista: MOTORISTA, km: Number(a.km),
      combustivel: a.comb, problemas: problemasAtuais().map((p) => ({ ...p, resolvida: false })),
      status: 'aguardando', aprovadaEm: null, situacao: estado.online ? 'enviando' : 'fila',
    };
    estado.atual = null;
    estado.recibo = v;
    estado.tela = 'recibo';
    if (estado.online) {
      renderApp();
      transmitir([v]);
    } else {
      estado.fila.push(v);
      renderApp();
      atualizarRede();
      anunciar('Vistoria guardada no aparelho. Será enviada quando a conexão voltar.');
    }
  }

  /* ---------- Eventos do app ---------- */
  const app = $('#app');

  app.addEventListener('click', (e) => {
    const b = e.target.closest('[data-acao]');
    if (!b || !app.contains(b)) return;
    const acao = b.dataset.acao;
    if (acao === 'escolher') {
      estado.atual = { vtr: b.dataset.vtr, etapa: 0, km: '', comb: null, docs: { crlv: null, cartao: null }, itens: {} };
      estado.tela = 'etapa';
      renderApp();
    } else if (acao === 'cancelar') {
      cancelar();
    } else if (acao === 'voltar') {
      estado.atual.etapa -= 1;
      renderApp();
    } else if (acao === 'continuar') {
      if (validar()) { estado.atual.etapa += 1; renderApp(); }
    } else if (acao === 'enviar') {
      enviar();
    } else if (acao === 'nova') {
      estado.recibo = null;
      estado.tela = 'viaturas';
      renderApp();
    } else if (acao === 'todos-ok') {
      ITENS.filter((i) => i.grupo === b.dataset.grupo && !estado.atual.itens[i.id]?.sit).forEach((i) => {
        estado.atual.itens[i.id] = { sit: 'ok', obs: '', foto: null, fotoNome: '' };
        const r = $(`input[name="item-${i.id}"][value="ok"]`);
        if (r) r.checked = true;
      });
      atualizarContagens();
      const e2 = $('#erro-etapa'); if (e2) e2.hidden = true;
    } else if (acao === 'remover-foto') {
      const s = estado.atual.itens[b.dataset.item];
      if (s.foto) URL.revokeObjectURL(s.foto);
      s.foto = null; s.fotoNome = '';
      const caixa = $(`#foto-${b.dataset.item}`);
      caixa.innerHTML = fotoHtml(b.dataset.item);
      $('input', caixa).focus();
    }
  });

  app.addEventListener('change', (e) => {
    const t = e.target;
    const a = estado.atual;
    if (!a) return;
    if (t.name === 'comb') {
      a.comb = Number(t.value);
      $('.medidor').dataset.nivel = t.value;
      $('#aviso-reserva').hidden = a.comb !== 0;
      $('#erro-etapa').hidden = true;
    } else if (t.name && t.name.startsWith('doc-')) {
      const d = t.name.slice(4);
      a.docs[d] = t.value === 'sim';
      $(`#doc-${d}`).classList.toggle('item--problema', !a.docs[d]);
      $('#erro-etapa').hidden = true;
    } else if (t.name && t.name.startsWith('item-')) {
      const id = t.name.slice(5);
      const s = a.itens[id] || (a.itens[id] = { sit: null, obs: '', foto: null, fotoNome: '' });
      s.sit = t.value;
      const prob = s.sit === 'problema';
      $(`#item-${id}`).classList.toggle('item--problema', prob);
      $(`#prob-${id}`).hidden = !prob;
      atualizarContagens();
      $('#erro-etapa').hidden = true;
    } else if (t.dataset.foto) {
      const id = t.dataset.foto;
      const f = t.files && t.files[0];
      if (!f) return;
      if (!f.type.startsWith('image/')) { anunciar('Escolha um arquivo de imagem.'); return; }
      const s = a.itens[id];
      if (s.foto) URL.revokeObjectURL(s.foto);
      s.foto = URL.createObjectURL(f);
      s.fotoNome = f.name;
      const caixa = $(`#foto-${id}`);
      caixa.innerHTML = fotoHtml(id);
      $('button', caixa).focus();
      anunciar(`Foto anexada ao item ${nomeItem(id)}.`);
    }
  });

  app.addEventListener('input', (e) => {
    const t = e.target;
    const a = estado.atual;
    if (!a) return;
    if (t.id === 'km') {
      a.km = t.value;
      a.kmConfirmado = false;
      t.removeAttribute('aria-invalid');
      $('#km-erro').hidden = true;
    } else if (t.dataset.obs) {
      a.itens[t.dataset.obs].obs = t.value;
      if (t.value.trim()) { $(`#obs-erro-${t.dataset.obs}`).hidden = true; $('#erro-etapa').hidden = true; }
    }
  });

  app.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.id === 'km') {
      e.preventDefault();
      if (validar()) { estado.atual.etapa += 1; renderApp(); }
    }
  });

  /* =========================================================
     CONEXÃO E FILA
     ========================================================= */
  function atualizarRede() {
    const on = estado.online;
    const n = estado.fila.length;
    $('#conexao').innerHTML = on ? `${icone('wifi')}Conectado` : `${icone('semWifi')}Sem internet`;
    $('#conexao').className = `conexao ${on ? 'conexao--on' : 'conexao--off'}`;
    $('#btn-rede').textContent = on ? 'Simular sem internet' : 'Reconectar';
    $('#btn-rede').setAttribute('aria-pressed', String(!on));
    const faixa = $('#faixa-offline');
    faixa.hidden = on;
    faixa.innerHTML = `${icone('semWifi')}<span>Sem internet: a vistoria será enviada quando a conexão voltar.${n ? ` <b>${n} na fila.</b>` : ''}</span>`;

    const canal = $('#canal');
    canal.classList.toggle('canal--off', !on);
    $('#canal-fila').innerHTML = estado.fila.map(() => '<span></span>').join('');
    $('#canal-rotulo').textContent = on ? 'Conectado' : n ? `Sem internet. ${n} ${n === 1 ? 'vistoria' : 'vistorias'} na fila` : 'Sem internet';

    if (estado.tela === 'etapa' && estado.atual.etapa === ETAPAS.length - 1) {
      corpo.innerHTML = etapaRevisao();
      acoes.innerHTML = acoesHtml();
    }
  }

  function animarCanal(n) {
    if (reduzido() || movel()) return;
    const canal = $('#canal');
    for (let i = 0; i < n; i++) {
      const p = document.createElement('span');
      p.className = 'pacote';
      p.style.transitionDelay = `${i * 140}ms`;
      canal.appendChild(p);
      void p.offsetWidth;
      p.classList.add('pacote--ir');
      setTimeout(() => p.remove(), 1100 + i * 140);
    }
  }

  function transmitir(lista) {
    lista.forEach((v) => { v.situacao = 'enviando'; estado.transito.push(v); });
    atualizarRecibo();
    animarCanal(lista.length);
    setTimeout(() => {
      lista.forEach(receber);
      estado.transito = estado.transito.filter((v) => !lista.includes(v));
      ordenar();
      estado.histVtr = lista[lista.length - 1].vtr;
      renderPainel();
      atualizarRede();
      atualizarRecibo();
      if (estado.tela === 'viaturas') renderApp(false);
      const nomes = lista.map((v) => v.vtr).join(', ');
      anunciar(`Painel recebeu a vistoria ${lista.length > 1 ? 'das viaturas' : 'da'} ${nomes}.`);
      marcarAba();
    }, reduzido() ? 300 : 900 + (lista.length - 1) * 140);
  }

  function receber(v) {
    v.situacao = 'recebida';
    v.recebidaEm = hhmm(new Date());
    v.novo = true;
    registros.push(v);
    setTimeout(() => {
      v.novo = false;
      const el = $(`#reg-${v.id}`);
      if (el) el.classList.remove('registro--novo');
    }, 2600);
  }

  $('#btn-rede').addEventListener('click', () => {
    estado.online = !estado.online;
    if (estado.online && estado.fila.length) {
      const lista = estado.fila.splice(0);
      atualizarRede();
      anunciar(`Conexão de volta. Enviando ${lista.length} ${lista.length === 1 ? 'vistoria' : 'vistorias'} da fila.`);
      transmitir(lista);
    } else {
      atualizarRede();
      anunciar(estado.online ? 'Conectado.' : 'Sem internet. As vistorias ficam na fila do aparelho.');
    }
    if (estado.tela === 'viaturas') renderApp(false);
  });

  /* =========================================================
     PAINEL DO CHEFE DE GARAGEM
     ========================================================= */
  const painel = $('#painel');

  function medidorMini(n) {
    return `<span class="mini-tanque${n === 0 ? ' mini-tanque--reserva' : ''}" role="img" aria-label="Combustível: ${COMB[n]}">${COMB.map((_, i) => `<i class="${i <= n ? 'cheio' : ''}"></i>`).join('')}</span>`;
  }

  function pendenciasAbertas() {
    const lista = [];
    registros.forEach((r) => r.problemas.forEach((p, i) => { if (!p.resolvida) lista.push({ r, p, i }); }));
    return lista;
  }

  function registroHtml(r) {
    const v = viatura(r.vtr);
    const aberto = estado.abertos.has(r.id);
    const n = r.problemas.length;
    const status = r.status === 'aprovada'
      ? `<span class="estado estado--ok registro__estado" tabindex="-1" id="est-${r.id}">Aprovada às ${r.aprovadaEm}</span>`
      : `<span class="estado estado--sinal registro__estado" tabindex="-1" id="est-${r.id}">Aguardando aprovação</span>`;
    return `<li class="registro${r.novo ? ' registro--novo' : ''}${r.status === 'aguardando' ? ' registro--aguardando' : ''}" id="reg-${r.id}">
      <div class="registro__linha">
        <p class="registro__vtr"><b>${v.id}</b>${placa(v.placa)}</p>
        ${status}
      </div>
      <p class="registro__info">
        <span>${esc(r.motorista)}, às ${r.hora}</span>
        <span>${fmtKm(r.km)} km</span>
        <span class="registro__comb">${medidorMini(r.combustivel)}${COMB[r.combustivel]}</span>
      </p>
      <div class="registro__acoes">
        ${n ? `<button type="button" class="btn btn--texto" data-acao="detalhes" data-id="${r.id}" aria-expanded="${aberto}" aria-controls="det-${r.id}">
            <span class="estado estado--alerta">${n} ${n === 1 ? 'problema' : 'problemas'}</span> <span class="ver">${aberto ? 'Ocultar detalhes' : 'Ver detalhes'}</span></button>`
          : `<span class="registro__ok">${icone('check')}Tudo OK</span>`}
        ${r.status === 'aguardando' ? `<button type="button" class="btn btn--sinal btn--curto" data-acao="aprovar" data-id="${r.id}">Aprovar</button>` : ''}
      </div>
      ${n ? `<div class="registro__detalhes" id="det-${r.id}" ${aberto ? '' : 'hidden'}>${listaProblemas(r.problemas)}</div>` : ''}
    </li>`;
  }

  function historicoHtml() {
    const lista = registros.filter((r) => r.vtr === estado.histVtr).slice(0, 6);
    return `<div class="tabela-rolagem"><table class="tabela tabela--hist">
      <caption class="sr-only">Últimas vistorias da ${estado.histVtr}</caption>
      <thead><tr><th scope="col">Data</th><th scope="col" class="num">Km</th><th scope="col">Tanque</th><th scope="col">Problemas</th><th scope="col">Situação</th></tr></thead>
      <tbody>${lista.map((r) => `<tr>
        <td>${mesmoDia(r.data, HOJE) ? 'Hoje' : diaMes(r.data)} <span class="hist__hora">${r.hora}</span></td>
        <td class="num">${fmtKm(r.km)}</td>
        <td>${medidorMini(r.combustivel)}</td>
        <td>${r.problemas.length ? `<span class="txt-alerta">${r.problemas.map((p) => esc(nomeItem(p.item))).join(', ')}</span>` : 'Nenhum'}</td>
        <td>${r.status === 'aprovada' ? 'Aprovada' : '<b>Aguardando</b>'}</td>
      </tr>`).join('')}</tbody>
    </table></div>`;
  }

  function renderPainel() {
    const ativo = document.activeElement;
    let restaurar = null;
    if (ativo && painel.contains(ativo)) {
      if (ativo.id) restaurar = `#${ativo.id}`;
      else if (ativo.dataset.acao) restaurar = `[data-acao="${ativo.dataset.acao}"][data-id="${ativo.dataset.id}"]`;
    }
    const hoje = registros.filter((r) => mesmoDia(r.data, HOJE));
    const vistoriadas = new Set(hoje.map((r) => r.vtr)).size;
    const aguardando = hoje.filter((r) => r.status === 'aguardando').length;
    const pend = pendenciasAbertas();

    painel.innerHTML = `
      <header class="painel-topo">
        <h2 id="painel-titulo">Painel do chefe de garagem</h2>
        <p>Unidade Demonstração, ${HOJE.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </header>
      <div class="indicadores">
        <p class="numero"><b>${vistoriadas}<small> de ${VIATURAS.length}</small></b><span>viaturas vistoriadas hoje</span></p>
        <p class="numero numero--sinal"><b>${aguardando}</b><span>aguardando sua aprovação</span></p>
        <p class="numero${pend.length ? ' numero--alerta' : ''}"><b>${pend.length}</b><span>pendências abertas</span></p>
      </div>

      <section class="bloco" aria-labelledby="h-hoje">
        <h3 id="h-hoje">Vistorias de hoje</h3>
        <ul class="registros">${hoje.map(registroHtml).join('')}</ul>
      </section>

      <section class="bloco bloco--pend" aria-labelledby="h-pend">
        <h3 id="h-pend" tabindex="-1">Pendências para a manutenção</h3>
        ${pend.length ? `<ul class="pendencias">${pend.map(({ r, p, i }) => `<li class="pendencia">
            <span class="pendencia__marca" aria-hidden="true"></span>
            <div><b>${r.vtr}: ${esc(nomeItem(p.item))}</b><span>${esc(p.obs)} Relatado por ${esc(r.motorista)} às ${r.hora}.</span></div>
            <button type="button" class="btn btn--curto" data-acao="resolver" data-id="${r.id}" data-i="${i}" aria-label="Marcar como resolvida: ${r.vtr}, ${esc(nomeItem(p.item))}">${icone('check')}Resolvida</button>
          </li>`).join('')}</ul>`
          : '<p class="vazio">Nenhuma pendência aberta. As que os motoristas relatarem aparecem aqui.</p>'}
      </section>

      <section class="bloco" aria-labelledby="h-hist">
        <div class="bloco__cabeca">
          <h3 id="h-hist">Histórico por viatura</h3>
          <label class="sr-only" for="hist-vtr">Viatura</label>
          <select id="hist-vtr" class="seletor">${VIATURAS.map((v) => `<option value="${v.id}" ${v.id === estado.histVtr ? 'selected' : ''}>${v.id} (${v.placa})</option>`).join('')}</select>
        </div>
        <div id="hist-tabela">${historicoHtml()}</div>
      </section>`;

    const cont = $('#aba-contagem');
    cont.textContent = aguardando;
    cont.hidden = aguardando === 0;
    $('[data-aba="painel"].aba').setAttribute('aria-label', `Painel do chefe, ${aguardando} aguardando aprovação`);

    if (restaurar) {
      const el = $(restaurar, painel);
      if (el) el.focus({ preventScroll: true });
    }
  }

  painel.addEventListener('click', (e) => {
    const b = e.target.closest('[data-acao]');
    if (!b) return;
    const r = registros.find((x) => x.id === b.dataset.id);
    if (b.dataset.acao === 'detalhes') {
      if (estado.abertos.has(r.id)) estado.abertos.delete(r.id); else estado.abertos.add(r.id);
      renderPainel();
    } else if (b.dataset.acao === 'aprovar') {
      r.status = 'aprovada';
      r.aprovadaEm = hhmm(new Date());
      renderPainel();
      $(`#est-${r.id}`).focus();
      anunciar(`Vistoria da ${r.vtr} aprovada.`);
    } else if (b.dataset.acao === 'resolver') {
      const p = r.problemas[Number(b.dataset.i)];
      p.resolvida = true;
      renderPainel();
      const prox = $('[data-acao="resolver"]', painel);
      (prox || $('#h-pend')).focus();
      anunciar(`Pendência resolvida: ${r.vtr}, ${nomeItem(p.item)}.`);
    }
  });

  painel.addEventListener('change', (e) => {
    if (e.target.id === 'hist-vtr') {
      estado.histVtr = e.target.value;
      $('#hist-tabela').innerHTML = historicoHtml();
    }
  });

  /* =========================================================
     ABAS (celular) E TEMA
     ========================================================= */
  function marcarAba() {
    if (!movel() || document.body.dataset.aba === 'painel') return;
    const c = $('#aba-contagem');
    c.classList.remove('aba__contagem--nova');
    void c.offsetWidth;
    c.classList.add('aba__contagem--nova');
  }

  $$('.aba').forEach((b) => b.addEventListener('click', () => {
    document.body.dataset.aba = b.dataset.aba;
    $$('.aba').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    window.scrollTo({ top: 0 });
  }));

  const btnTema = $('#btn-tema');
  function temaAtual() {
    const t = document.documentElement.dataset.tema;
    if (t) return t;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'escuro' : 'claro';
  }
  function rotuloTema() {
    const escuro = temaAtual() === 'escuro';
    btnTema.innerHTML = `${icone(escuro ? 'sol' : 'lua')}${escuro ? 'Usar tema claro' : 'Usar tema escuro'}`;
  }
  btnTema.addEventListener('click', () => {
    document.documentElement.dataset.tema = temaAtual() === 'escuro' ? 'claro' : 'escuro';
    rotuloTema();
  });

  /* ---------- Início ---------- */
  rotuloTema();
  atualizarRede();
  renderApp(false);
  renderPainel();
})();
