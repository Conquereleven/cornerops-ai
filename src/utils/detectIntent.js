const normalize = (value) =>
  value
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const includesAny = (message, keywords) =>
  keywords.some((keyword) => message.includes(keyword));

const intentRules = [
  {
    intent: 'human_handoff',
    category: 'support',
    worker: 'humanHandoffWorker',
    keywords: [
      'hablar con alguien',
      'hablar con una persona',
      'hablar con un humano',
      'agente humano',
      'human agent',
      'talk to someone',
      'real person',
      'representative',
    ],
  },
  {
    intent: 'b2b_lead',
    category: 'b2b',
    worker: 'b2bWorker',
    keywords: [
      'mayoreo',
      'caja',
      'cajas',
      'volumen',
      'wholesale',
      'bulk',
      'horeca',
      'restaurante',
      'restaurant',
      'distributor',
      'distribuidor',
      'tienda',
      'store',
      'supermarket',
      'supermercado',
      'cotizacion',
      'quote',
      'quotation',
    ],
  },
  {
    intent: 'order_status',
    category: 'orders',
    worker: 'ordersWorker',
    keywords: [
      'orden',
      'pedido',
      'order',
      'tracking',
      'entrega',
      'delivery',
      'pago',
      'payment',
      'status',
      'estatus',
    ],
  },
  {
    intent: 'product_search',
    category: 'sales',
    worker: 'salesWorker',
    keywords: [
      'precio',
      'price',
      'producto',
      'product',
      'comprar',
      'buy',
      'stock',
      'disponibilidad',
      'available',
      'catalogo',
      'catalog',
      'tajin',
      'valentina',
      'pulparindo',
      'pinata',
      'tomatillo',
      'chamoy',
      'tortilla',
      'chile',
      'salsa',
      'dulce',
    ],
  },
  {
    intent: 'support',
    category: 'support',
    worker: 'supportWorker',
    keywords: [
      'ayuda',
      'help',
      'horario',
      'hours',
      'ubicacion',
      'location',
      'direccion',
      'address',
      'politica',
      'policy',
      'devolucion',
      'return',
      'hola',
      'hello',
      'hi',
    ],
  },
];

const detectIntent = (message, context = {}) => {
  const normalizedMessage = normalize(typeof message === 'string' ? message : '');
  const matchedRule = intentRules.find((rule) =>
    includesAny(normalizedMessage, rule.keywords),
  );

  if (matchedRule) {
    return {
      intent: matchedRule.intent,
      worker: matchedRule.worker,
      category: matchedRule.category,
    };
  }

  if (
    context.lastIntent &&
    ['order_status', 'product_search', 'b2b_lead'].includes(context.lastIntent)
  ) {
    const continuation = intentRules.find(
      (rule) => rule.intent === context.lastIntent,
    );
    return {
      intent: continuation.intent,
      worker: continuation.worker,
      category: continuation.category,
    };
  }

  return {
    intent: 'unknown',
    worker: 'supportWorker',
    category: 'unknown',
  };
};

module.exports = {
  detectIntent,
};
