const mockLeads = [
  {
    id: 'lead-001',
    userId: 'b2b-1',
    businessName: 'Desert Greens Café',
    city: 'Dubai',
    businessType: 'Café',
    productsOfInterest: ['Tajín', 'Salsas mexicanas'],
    estimatedVolume: '48 unidades al mes',
    contact: 'buyer@desertgreens.example',
    missingFields: [],
    status: 'qualified',
    createdAt: '2026-06-13T08:30:00Z',
    updatedAt: '2026-06-13T08:30:00Z',
  },
  {
    id: 'lead-002',
    userId: 'b2b-2',
    businessName: 'La Mesa Restaurant',
    city: 'Abu Dhabi',
    businessType: 'Restaurant',
    productsOfInterest: ['Tortillas'],
    estimatedVolume: '',
    contact: '',
    missingFields: ['estimatedVolume', 'contact'],
    status: 'needs_info',
    createdAt: '2026-06-13T09:15:00Z',
    updatedAt: '2026-06-13T09:15:00Z',
  },
];

module.exports = mockLeads;
