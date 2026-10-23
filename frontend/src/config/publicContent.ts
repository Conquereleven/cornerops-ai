export const publicContent = {
  hero: "We design and build AI-powered systems that automate operations, connect teams and turn business complexity into scalable software.",
  capabilities: [
    [
      "Data & Intelligence",
      "Turn operational data into dashboards, signals and actionable intelligence.",
    ],
    [
      "Commerce Infrastructure",
      "Ordering, payments, marketplaces and digital commerce systems.",
    ],
    ["Integrations", "Connect existing tools into one operating ecosystem."],
  ],
  friction: [
    "Fragmented tools",
    "Manual order entry",
    "WhatsApp-heavy workflows",
    "Missed follow-ups",
    "Repetitive admin",
    "Slow RFQ & quotation flows",
    "Inventory blind spots",
    "Disconnected business data",
  ],
  industries: [
    "Logistics & Trade",
    "Construction & Infrastructure",
    "Distribution & Commerce",
    "Industry & Manufacturing",
    "Energy & Field Operations",
    "Hospitality",
  ],
  process: [
    [
      "Understand",
      "Find the bottleneck. Understand the people, tools and decisions around it.",
    ],
    [
      "Design",
      "Define the workflow, the experience and what success will look like.",
    ],
    ["Build", "Ship a focused system your team can test with real work."],
    [
      "Integrate",
      "Connect the stack, agree the controls and support the handover.",
    ],
    ["Improve", "Review what happens in practice and refine the system."],
  ],
  principles: [
    [
      "Systems that ship.",
      "Working software, usable workflows and a clear handover are the deliverables.",
    ],
    [
      "AI with a clear role.",
      "AI accelerates routine work while consequential actions stay under clear human control.",
    ],
    [
      "Your stack, connected.",
      "Build on the tools your team already uses, with integrations that keep context moving.",
    ],
  ],
  systems: [
    [
      "Commerce OS",
      "In development",
      "Connecting commercial records, order tracking and operational exceptions.",
    ],
    [
      "Command Center",
      "Internal system",
      "Daily briefs, work queues and intelligence built around operational evidence.",
    ],
  ],
  case: {
    title: "Tres Leches",
    framing:
      "Digital ordering infrastructure built around the way the business actually operates.",
    copy: "Tres Leches is a food business using WhatsApp as its primary sales channel. CornerTech AI designed a digital ordering system that connects customer ordering, payment and operational workflows into one structured experience.",
    layers: [
      "Ordering",
      "WhatsApp",
      "Payments",
      "Operations",
      "Customer Experience",
    ],
  },
} as const;

// Website 2.0 review-preview copy (content@1 / tokens@1). Author copy only: no
// approval or evidence metadata is published. Commerce capabilities stay empty
// until each one has Founder publication approval.
export const websiteV2Content = {
  contentVersion: "content@1",
  tokensVersion: "tokens@1",
  routes: {
    home: {
      title: "CornerTech AI — Software built for real operations",
      description:
        "CornerTech AI designs, builds and integrates software and AI automation for operators in the UAE and GCC.",
      h1: "Software built for real operations.",
    },
    commerce: {
      title: "CornerTech Commerce — in development · CornerTech AI",
      description:
        "CornerTech Commerce is in development and not yet available. Talk to us about becoming a design partner.",
      h1: "CornerTech Commerce",
    },
    solutions: {
      title: "Engineering services · CornerTech AI",
      description:
        "Custom engineering, AI automation and systems integration, scoped to the way your operation works.",
      h1: "Engineering for the way your operation actually works.",
    },
  },
  navigation: {
    commerce: "Commerce",
    solutions: "Solutions",
    company: "Company",
    contact: "Contact",
  },
  frame: {
    brandLabel: "CornerTech AI home",
    skip: "Skip to content",
    cta: "Discuss a project",
    menu: "Menu",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    primaryNav: "Primary",
    footerNav: "Footer",
    footerSummary:
      "CornerTech AI — software engineering for operators in the UAE and GCC.",
    footerStatus:
      "CornerTech Commerce is in development. Engineering services are available.",
    copyright: "CornerTech AI",
    // Publication year is stable across prerender/hydration and year rollover.
    copyrightYear: 2026,
  },
  status: {
    available: "Available",
    inDevelopment: "In development",
    notYetAvailable: "In development — not yet available",
  },
  services: [
    {
      title: "Custom Engineering",
      summary:
        "Focused software for the workflow no product fits: operational consoles, internal tools and customer-facing ordering.",
      detail:
        "When no product fits, we design and build the focused system you need.",
      scope: [
        "Operational consoles and internal tools",
        "Customer-facing ordering experiences",
        "Data views for the decisions your team makes daily",
      ],
    },
    {
      title: "AI Automation",
      summary:
        "AI that reads requests and prepares the routine steps, with consequential actions kept under clear human control.",
      detail:
        "AI that reads incoming requests, prepares the routine steps and hands consequential decisions to a person.",
      scope: [
        "Request reading and triage",
        "Drafting routine responses and records",
        "A person decides on consequential actions",
      ],
    },
    {
      title: "Systems Integration",
      summary:
        "Connect the tools your team already uses so orders, records and context move without re-typing. Scoped per engagement.",
      detail:
        "Connect the tools you already use so records and context move without re-typing.",
      scope: [
        "Scoped per engagement after discovery",
        "Built on your existing tools where practical",
        "No pre-built connector promises",
      ],
    },
  ],
  illustration: {
    caption: "Illustration · synthetic data",
    meta: "Fictional names and IDs · not a running system",
    label:
      "Illustration with synthetic data: a fictional chat request from Sample Customer becomes a structured order record, its changes are kept as a history, and one order is set aside for a person to review. Concept only, not a running system.",
    foot: "Concept only. No live connections, real customers or product availability are shown.",
    request: {
      name: "01 Request",
      from: "Sample Customer · chat",
      text: "Two large trays for Thursday, same address as last time.",
    },
    record: {
      name: "02 Order record",
      id: "ORD-DEMO-0042",
      checks: [
        ["ok", "Customer matched"],
        ["ok", "Items recognized"],
        ["flag", "Address to confirm"],
      ],
    },
    history: {
      name: "03 Change history",
      events: [
        ["09:14", "received", "from chat"],
        ["09:14", "checked", "2 of 3"],
        ["09:15", "flagged", "address"],
      ],
    },
    queue: {
      name: "04 Needs a person",
      id: "ORD-DEMO-0042",
      text: "Address to confirm",
      note: "Needs a person",
    },
  },
  home: {
    hero: {
      eyebrow: "Software engineering · UAE & GCC",
      lede: "CornerTech AI designs, builds and integrates the systems operators run on — custom software, AI automation and connected tools, engineered around how your work actually happens.",
    },
    flagship: {
      eyebrow: "Flagship product",
      name: "CornerTech Commerce",
      copy: "An operating layer we are building for commerce orders and the exceptions around them. Not yet available.",
      link: "See what we're building",
    },
    services: {
      eyebrow: "Available now",
      title: "Three ways we work with operators.",
      copy: "Engineering services you can start today. Every engagement is scoped after we understand how your operation runs.",
      link: "How engagements work",
    },
    showcase: {
      eyebrow: "Flagship · In development",
      title:
        "CornerTech Commerce: one place for orders and the exceptions around them.",
      copy: "Many operators take orders through chat, calls and spreadsheets. We're building CornerTech Commerce to bring that intake into one structured record. It is in development and not yet available.",
    },
    process: {
      eyebrow: "How we work",
      title: "From the real bottleneck to working software.",
      copy: "The same five steps on every engagement, whatever we build.",
      steps: [
        ["Understand", "Find the bottleneck and the people, tools and decisions around it."],
        ["Design", "Define the workflow, the experience and what done looks like."],
        ["Build", "Ship a focused system your team can test with real work."],
        ["Integrate", "Connect the stack, agree the controls, support the handover."],
        ["Improve", "Review what happens in practice and refine."],
      ],
    },
    principles: {
      eyebrow: "Principles",
      title: "What we hold ourselves to.",
      items: [
        ["Systems that ship", "Working software, usable workflows and a clear handover are the deliverables."],
        ["AI with a clear role", "Routine work is accelerated; consequential actions stay under human control."],
        ["Your stack, connected", "Build on the tools your team already uses."],
        ["Status in plain words", "We say what is available and what is still in development."],
      ],
    },
    segments: {
      eyebrow: "Who we build for",
      title: "Built with operators in mind.",
      copy: "Our focus is operations-heavy businesses in the UAE and GCC, including:",
      items: [
        "Logistics & trade",
        "Distribution & commerce",
        "Hospitality & food",
        "Construction & infrastructure",
        "Industry & manufacturing",
        "Energy & field operations",
      ],
    },
    company: {
      eyebrow: "Company",
      title: "An engineering company, focused on the Gulf.",
      copy: "CornerTech AI is a software engineering company serving operators in the UAE and GCC. We build custom systems and AI automation for clients, and we're building CornerTech Commerce as our own product.",
      facts: [
        ["Focus", "UAE & GCC operators", ""],
        ["Services", "Available now", "available"],
        ["Flagship", "In development", "development"],
      ],
    },
    contact: {
      eyebrow: "Contact",
      title: "Choose the conversation you want to have.",
      project: {
        title: "Discuss a project",
        copy: "Tell us what you're running today and where it breaks. We'll reply to scope a first conversation.",
      },
      partner: {
        title: "Become a design partner",
        copy: "Help shape CornerTech Commerce by telling us how your orders flow today. This is a conversation, not a sign-up: it does not provide product access, pricing or a release date.",
        action: "Email us about design partnership",
        subject: "Design partner conversation",
      },
      note: "There is no enquiry form on this site. Email and WhatsApp are run by their own providers, and a message is sent only if you choose to send it.",
    },
  },
  commerce: {
    eyebrow: "Flagship product",
    lede: "An operating layer for commerce orders and the exceptions around them — designed for businesses whose orders arrive through chat, calls and spreadsheets.",
    partnerAction: "Become a design partner",
    glance: {
      title: "Status at a glance",
      rows: [
        ["Product", "In development"],
        ["Customer access", "Not available"],
        ["Pricing", "Not published"],
        ["Release date", "Not announced"],
        ["Design partners", "Conversations open"],
      ],
    },
    problem: {
      eyebrow: "The problem",
      title: "Orders don't arrive in one place.",
      items: [
        "An order is a chat message, then a note, then a row someone re-types.",
        "Payment confirmation lives in a different thread from the order.",
        "Exceptions — a missing address, a changed quantity — have no owner.",
        "Nobody can answer “what is waiting right now?” without asking around.",
      ],
    },
    idea: {
      eyebrow: "The idea",
      title: "One record per order, with a person for the exceptions.",
      copy: "This is the direction we are designing toward, shown as a concept with fictional data. It is not a list of available features.",
    },
    meaning: {
      eyebrow: "Maturity",
      title: "What “in development” means.",
      copy: "We are building it. It is not a product you can use today: there is no customer access, no published pricing and no release date. When that changes, this page will say so.",
    },
    partner: {
      eyebrow: "Design partners",
      title: "Shape it with us.",
      copy: "We want to learn from operators whose orders arrive through chat and manual entry. Becoming a design partner is a conversation — not product access, a purchase or a release date.",
    },
    now: {
      eyebrow: "Available now",
      title: "Need something working now?",
      copy: "Our engineering services are available today — custom systems, AI automation and integration, scoped to your operation.",
    },
  },
  solutions: {
    eyebrow: "Engineering services · Available now",
    lede: "Custom engineering, AI automation and systems integration — scoped after we understand the real workflow, built with your team, and handed over clearly.",
    overview: "Services",
    detail: {
      eyebrow: "What we do",
      title: "Three services, scoped to your operation.",
    },
    engagement: {
      eyebrow: "How engagements run",
      title: "What an engagement can look like.",
      label: "Illustrative engagement shape — not a client case",
      copy: "Phases, not a promise. Timing is agreed per project.",
      phases: [
        ["Understand", "Discovery", "Find the bottleneck and the people, tools and decisions around it."],
        ["Design", "Design checkpoint", "You agree the workflow, the experience and what done looks like."],
        ["Build", "First release", "A focused system your team tests with real work."],
        ["Integrate", "Integration & handover", "Connect the stack, agree the controls, document the handover."],
        ["Improve", "Review in practice", "See what happens once it runs, and refine."],
      ],
    },
    commitments: {
      eyebrow: "Commitments",
      title: "What we will and won't promise.",
      willTitle: "We will",
      wontTitle: "We won't",
      will: [
        "A clear scope before we build",
        "Working software you can test",
        "Human control over consequential actions",
        "A documented handover",
      ],
      wont: [
        "Outcome or ROI figures",
        "Credentials we don't hold",
        "Integrations we haven't scoped",
        "Access to products that aren't available",
      ],
    },
    faq: {
      eyebrow: "Questions",
      title: "Before you get in touch.",
      items: [
        ["Do you publish prices?", "No. Projects are scoped after a first conversation."],
        ["Can you work with our current tools?", "That is usually where we start; feasibility is confirmed during discovery."],
        ["Can we use CornerTech Commerce?", "Not yet. It is in development; you can talk to us about becoming a design partner."],
        ["Where do you work?", "Our focus is the UAE and GCC."],
      ],
    },
    start: {
      title: "Start with the bottleneck.",
      copy: "Tell us where work gets re-typed, delayed or lost. We'll reply to scope a first conversation.",
    },
  },
  commerceCapabilities: [] as readonly [],
} as const;
