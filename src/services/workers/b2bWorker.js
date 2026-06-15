const { generateWorkerReply } = require('../aiResponseService');
const {
  createB2BLead,
  updateLead,
  findLatestLeadByUserId,
} = require('../../data/repositories/leadRepository');
const { extractMemoryData } = require('../memoryService');

const requiredFields = [
  'businessName',
  'emirate',
  'businessType',
  'requestedProducts',
  'estimatedVolume',
  'contactName',
  'email',
];

const normalizeExistingLead = (lead = {}) => ({
  ...lead,
  emirate: lead.emirate || lead.city,
  requestedProducts: lead.requestedProducts || lead.productsOfInterest || [],
  phone: lead.phone || lead.whatsapp,
});

const extractLeadData = (message) => {
  const memoryData = extractMemoryData(message);
  return {
    ...memoryData,
    ...(memoryData.emirate && { city: memoryData.emirate }),
    ...(memoryData.requestedProducts && {
      productsOfInterest: memoryData.requestedProducts,
    }),
    ...(memoryData.customerName && { contactName: memoryData.customerName }),
    ...(memoryData.phone && { whatsapp: memoryData.phone }),
  };
};

const handle = async ({
  message,
  userId,
  memory = {},
  language = 'es',
}) => {
  const extracted = extractLeadData(message);
  const existing = normalizeExistingLead(
    (await findLatestLeadByUserId(userId)) || {},
  );
  const combined = normalizeExistingLead({
    ...existing,
    ...memory,
    ...extracted,
    userId,
  });
  const missingFields = requiredFields.filter((field) => {
    const value = combined[field];
    return !value || (Array.isArray(value) && value.length === 0);
  });
  const leadData = {
    userId,
    businessName: combined.businessName,
    businessType: combined.businessType,
    city: combined.emirate,
    emirate: combined.emirate,
    contactName: combined.contactName,
    email: combined.email,
    phone: combined.phone,
    whatsapp: combined.phone,
    productsOfInterest: combined.requestedProducts,
    requestedProducts: combined.requestedProducts,
    estimatedVolume: combined.estimatedVolume,
    missingFields,
    status: missingFields.length ? 'needs_info' : 'qualified',
    source: 'ai_worker',
  };
  const lead = existing.id
    ? await updateLead(existing.id, leadData)
    : await createB2BLead(leadData);

  const labels = language === 'en'
    ? {
        businessName: 'business name',
        emirate: 'UAE emirate or city',
        businessType: 'business type',
        requestedProducts: 'requested products',
        estimatedVolume: 'estimated volume',
        contactName: 'contact name',
        email: 'email',
      }
    : {
        businessName: 'nombre del negocio',
        emirate: 'emirato o ciudad en UAE',
        businessType: 'tipo de negocio',
        requestedProducts: 'productos solicitados',
        estimatedVolume: 'volumen estimado',
        contactName: 'nombre de contacto',
        email: 'email',
      };
  const fallbackReply = missingFields.length
    ? (
      language === 'en'
        ? `I registered the B2B opportunity. To prepare the quotation I still need: ${missingFields.map((field) => labels[field]).join(', ')}.`
        : `Registré la oportunidad B2B. Para preparar la cotización aún necesito: ${missingFields.map((field) => labels[field]).join(', ')}.`
    )
    : (
      language === 'en'
        ? `Thank you. The B2B lead for ${lead.businessName} is qualified and ready for commercial follow-up and quotation.`
        : `Gracias. El lead B2B de ${lead.businessName} quedó calificado y listo para seguimiento comercial y cotización.`
    );

  const facts = {
    leadId: lead.id,
    businessName: leadData.businessName,
    businessType: leadData.businessType,
    emirate: leadData.emirate,
    requestedProducts: leadData.requestedProducts,
    estimatedVolume: leadData.estimatedVolume,
    missingFields,
    status: leadData.status,
  };
  const reply = await generateWorkerReply({
    worker: 'B2B worker',
    message,
    facts,
    instructions: 'Qualify the lead and clearly state the next step toward a quotation.',
    fallbackReply,
  });

  return {
    reply,
    metadata: {
      ...facts,
      leadCaptured: missingFields.length === 0,
      requiresHuman: false,
      memoryData: {
        businessName: leadData.businessName,
        businessType: leadData.businessType,
        customerName: leadData.contactName,
        email: leadData.email,
        phone: leadData.phone,
        emirate: leadData.emirate,
        requestedProducts: leadData.requestedProducts,
        estimatedVolume: leadData.estimatedVolume,
      },
    },
  };
};

module.exports = {
  handle,
  extractLeadData,
  requiredFields,
};
