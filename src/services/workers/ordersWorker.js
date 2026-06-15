const { generateWorkerReply } = require('../aiResponseService');
const {
  findOrderByEmail,
  findOrderById,
} = require('../../data/repositories/orderRepository');

const extractOrderNumber = (message) => {
  const hashReference = message.match(/#[a-z0-9-]+/i);

  if (hashReference) {
    return hashReference[0];
  }

  const labelledReference = message.match(
    /(?:orden|pedido|order)\s*(?:n[uú]mero|number|no\.?)?\s*:?\s*([a-z0-9-]{3,})/i,
  );

  return labelledReference?.[1]?.replace(/^#/, '') || '';
};

const extractEmail = (message) =>
  message.match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i)?.[0] || '';

const handle = async ({ message, userId, memory = {}, language = 'es' }) => {
  const orderNumber =
    extractOrderNumber(message).replace(/^#/, '') || memory.orderId || '';
  const email = extractEmail(message) || memory.email || '';

  if (!orderNumber && !email) {
    return {
      reply: language === 'en'
        ? 'Please share your order number or the email used for the purchase so I can check its status.'
        : 'Compárteme el número de orden o el email usado en la compra para consultar su estado.',
      metadata: { orderId: null, requiresHuman: false },
    };
  }

  const order = orderNumber
    ? await findOrderById(orderNumber)
    : await findOrderByEmail(email);
  if (!order) {
    return {
      reply: language === 'en'
        ? `I could not find an order with ${orderNumber ? `number #${orderNumber}` : 'that email'}. Please verify the details, or I can escalate the request.`
        : `No encontré una orden con ${orderNumber ? `el número #${orderNumber}` : 'ese email'}. Confirma los datos o puedo escalar la consulta.`,
      metadata: {
        orderId: orderNumber || null,
        requiresHuman: false,
        found: false,
      },
    };
  }

  const itemSummary = order.items
    .map((item) => `${item.quantity} × ${item.name}`)
    .join(', ');
  const fallbackReply = language === 'en'
    ? `I found order #${order.id}. Status: ${order.status}; payment: ${order.paymentStatus}; delivery: ${order.deliveryStatus}. Items: ${itemSummary || 'not available'}. Estimated delivery: ${order.estimatedDelivery || 'to be confirmed'}.`
    : `Encontré tu orden #${order.id}. Estado: ${order.status}; pago: ${order.paymentStatus}; entrega: ${order.deliveryStatus}. Productos: ${itemSummary || 'no disponibles'}. Fecha estimada: ${order.estimatedDelivery || 'por confirmar'}.`;

  const facts = {
    orderId: order.id,
    status: order.status,
    paymentStatus: order.paymentStatus,
    deliveryStatus: order.deliveryStatus,
    items: order.items,
    estimatedDelivery: order.estimatedDelivery,
  };
  const reply = await generateWorkerReply({
    worker: 'orders worker',
    message,
    facts,
    instructions: 'Do not reveal customer names, email addresses, or unrelated order data.',
    fallbackReply,
  });
  return {
    reply,
    metadata: {
      ...facts,
      requiresHuman: false,
      found: true,
      belongsToUser: order.userId === userId,
      memoryData: { orderId: order.id, ...(email && { email }) },
    },
  };
};

module.exports = {
  handle,
  extractOrderNumber,
  extractEmail,
};
