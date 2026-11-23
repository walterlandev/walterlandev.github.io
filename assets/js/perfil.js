// Dados pessoais do portfólio. Campo vazio ("") = não aparece no site.
// É o ÚNICO lugar para trocar nome, contatos, formação e experiência.
window.PERFIL = {
  nome: "Walterlan Alves dos Santos",
  titulo: "Desenvolvedor Full-Stack",
  resumo:
    "Construo sistemas que fazem operações reais funcionarem: gestão financeira de associações, " +
    "controle de estações de tratamento de água, vistoria de viaturas, obras e medições. Do levantamento " +
    "com quem usa até o sistema em produção, com React, PHP, Node.js, Flutter e automações com agentes de IA.",
  cidade: "Guarabira — PB",
  email: "wasgba@live.com",
  whatsapp: "5583996227422",   // só dígitos com DDI
  linkedin: "",                // falta o endereço do perfil, ex.: "https://www.linkedin.com/in/seu-perfil"
  instagram: "walterlan_was",
  github: "https://github.com/walterlandev",
  formacao: [
    // { curso: "", instituicao: "", periodo: "" }
  ],
  experiencia: [
    {
      cargo: "Desenvolvedor Full-Stack",
      onde: "Freelancer",
      periodo: "",
      descricao: "Sistemas sob medida em produção para associação de classe, saneamento, segurança pública e construção civil: " +
        "levantamento com quem usa, desenvolvimento, testes, implantação e suporte.",
    },
  ],
  competencias: [
    { grupo: "Frontend", itens: ["React", "Next.js", "TypeScript", "Vite", "Tailwind CSS", "PWA (offline)", "JavaScript"] },
    { grupo: "Backend e dados", itens: ["PHP 8", "Node.js", "Express", "Socket.io", "MySQL / MariaDB", "Firebase", "APIs REST"] },
    { grupo: "Mobile", itens: ["Flutter", "Dart", "Geração de PDF no app"] },
    { grupo: "Automação e IA", itens: ["Agentes de IA no desenvolvimento", "Automações com LLM", "WhatsApp (Baileys, Playwright)", "Python"] },
    { grupo: "Entrega", itens: ["Hostinger", "Vercel", "GitHub Actions", "Testes automatizados", "Integração PIX / Mercado Pago", "E-mail (SMTP)"] },
  ],
};
