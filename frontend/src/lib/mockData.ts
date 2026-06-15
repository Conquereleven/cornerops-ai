import type { B2BLead, Conversation, Order, Product } from './types';

export const mockOrders: Order[] = [
  { id: '123', userId: '1', customerName: 'Rodrigo Morales', status: 'preparing', paymentStatus: 'paid', deliveryStatus: 'pending_pickup', items: [{ sku: 'TAJIN-142G', name: 'Tajín Clásico 142g', quantity: 2 }], estimatedDelivery: '2026-06-18', createdAt: '2026-06-13T10:00:00Z' },
  { id: '119', userId: '2', customerName: 'Aisha Khan', status: 'shipped', paymentStatus: 'paid', deliveryStatus: 'in_transit', items: [{ sku: 'VAL-370ML', name: 'Salsa Valentina 370ml', quantity: 6 }], estimatedDelivery: '2026-06-16', createdAt: '2026-06-11T08:30:00Z' },
];

export const mockProducts: Product[] = [
  { sku: 'TAJIN-142G', name: 'Tajín Clásico 142g', category: 'Condiments', priceAED: 12, stock: 40, description: 'Mexican chili-lime seasoning.', languages: ['es', 'en'], b2bAvailable: true },
  { sku: 'VAL-370ML', name: 'Salsa Valentina 370ml', category: 'Hot Sauces', priceAED: 14, stock: 22, description: 'Classic Mexican hot sauce.', languages: ['es', 'en'], b2bAvailable: true },
  { sku: 'PULP-20PK', name: 'Pulparindo Original 20 pack', category: 'Mexican Candy', priceAED: 24, stock: 18, description: 'Spicy tamarind candy.', languages: ['es', 'en'], b2bAvailable: true },
];

export const mockLeads: B2BLead[] = [
  { id: 'lead-001', businessName: 'Desert Greens Café', city: 'Dubai', businessType: 'Café', productsOfInterest: ['Tajín', 'Salsas'], estimatedVolume: '48 unidades al mes', contact: 'buyer@desertgreens.example', missingFields: [], status: 'qualified', createdAt: '2026-06-13T08:30:00Z' },
  { id: 'lead-002', businessName: 'La Mesa Restaurant', city: 'Abu Dhabi', businessType: 'Restaurant', productsOfInterest: ['Tortillas'], missingFields: ['estimatedVolume', 'contact'], status: 'needs_info', createdAt: '2026-06-13T09:15:00Z' },
];

export const mockConversations: Conversation[] = [
  { id: 'conv-demo-001', userId: '1', status: 'active', lastMessage: '¿Cuál es el estado de mi orden #123?', worker: 'ordersWorker', intent: 'order_status', messageCount: 6, updatedAt: new Date().toISOString() },
  { id: 'conv-demo-002', userId: 'b2b-1', status: 'needs_human', lastMessage: 'Necesito una cotización para mi restaurante.', worker: 'b2bWorker', intent: 'b2b_lead', messageCount: 4, updatedAt: new Date(Date.now() - 420000).toISOString() },
];
