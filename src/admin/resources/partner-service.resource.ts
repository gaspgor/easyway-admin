import { PartnerService } from '../../entities/partner-service.entity.js';
import { Before, ValidationError } from 'adminjs';
import { readonlyPartnerFieldComponent } from '../../component-loader.js';

// ── Before hook: build carBasedPrices & locationIds from flat form keys ──
const buildServicePayload: Before = async (request) => {
  if (request.method === 'post' && request.payload) {
    const payload = request.payload;

    // Inject partnerId from URL query if admin is coming from a partner context
    if (!payload.partnerId && (request as any).query?.partnerId) {
      payload.partnerId = (request as any).query.partnerId;
    }

    // ── 1. Build carBasedPrices array from flat keys ──────────────────────
    // AdminJS sends: carBasedPrices.0.make, carBasedPrices.0.model, carBasedPrices.0.price …
    const carPriceMap: Record<number, any> = {};
    Object.keys(payload).forEach((key) => {
      const m = key.match(/^carBasedPrices\.(\d+)\.(.+)$/);
      if (m) {
        const idx = parseInt(m[1]);
        const prop = m[2];
        if (!carPriceMap[idx]) carPriceMap[idx] = {};
        carPriceMap[idx][prop] = payload[key];
        delete payload[key];
      }
    });
    const carBasedPrices = Object.values(carPriceMap)
      .filter((e: any) => e.make || e.price)
      .map((e: any) => ({
        make: e.make || null,
        model: e.model || null,
        price: e.price ? Number(e.price) : null,
      }));
    payload.carBasedPrices = carBasedPrices.length ? carBasedPrices : null;

    // ── 2. Build locationIds array from flat keys ─────────────────────────
    // AdminJS sends: locationIds.0, locationIds.1 … (each is a PartnerLocation UUID)
    const locationIdsMap: Record<number, string> = {};
    Object.keys(payload).forEach((key) => {
      const m = key.match(/^locationIds\.(\d+)$/);
      if (m) {
        const idx = parseInt(m[1]);
        locationIdsMap[idx] = payload[key];
        delete payload[key];
      }
    });
    const locationIds = Object.values(locationIdsMap).filter(Boolean);
    payload.locationIds = locationIds.length ? locationIds : null;

    // ── 3. Validate required fields ───────────────────────────────────────
    const errors: any = {};
    if (!payload.partnerId)  errors.partnerId  = { message: 'Partner is required' };
    if (!payload.name)       errors.name       = { message: 'Service name is required' };
    if (!payload.basePrice)  errors.basePrice  = { message: 'Base price is required' };
    if (Object.keys(errors).length > 0)
      throw new ValidationError(errors, { message: 'Please fill in all required fields' });
  }
  return request;
};

export const PartnerServiceResourceOptions = {
  resource: PartnerService,
  options: {
    navigation: false,
    sort: { sortBy: 'createdAt', direction: 'desc' },

    listProperties: ['partnerId', 'name', 'basePrice', 'currency', 'isActive', 'createdAt'],
    showProperties: ['id', 'partnerId', 'name', 'description', 'basePrice', 'currency',
                     'estimatedDurationMinutes', 'isActive', 'locationIds', 'carBasedPrices', 'createdAt', 'updatedAt'],
    newProperties:  ['partnerId', 'name', 'description', 'basePrice', 'currency',
                     'estimatedDurationMinutes', 'isActive', 'locationIds', 'carBasedPrices'],
    editProperties: ['partnerId', 'name', 'description', 'basePrice', 'currency',
                     'estimatedDurationMinutes', 'isActive', 'locationIds', 'carBasedPrices'],
    filterProperties: ['partnerId', 'name', 'isActive'],

    properties: {
      id:         { isVisible: { list: false, filter: false, show: true, edit: false, new: false } },
      createdAt:  { isVisible: { list: true,  filter: true,  show: true, edit: false, new: false } },
      updatedAt:  { isVisible: { list: false, filter: false, show: true, edit: false, new: false } },

      // ── Partner selector ─────────────────────────────────────────────────
      partnerId: {
        reference: 'Partner',
        description: '🏢 Select the Partner this service belongs to',
        isVisible: { list: true, filter: true, show: true, edit: true, new: true },
        components: {
          // In new form: show as locked readonly display (value pre-filled from URL)
          new: readonlyPartnerFieldComponent,
        },
      },

      // ── Core fields ───────────────────────────────────────────────────────
      name:        { description: 'Service name shown to customers' },
      description: { type: 'textarea', description: 'Optional — short description' },
      basePrice: {
        description: 'Default price (applies when no car-specific price is set)',
      },
      currency: {
        description: 'Currency code (e.g. USD, AMD)',
        availableValues: [
          { value: 'AMD', label: '🇦🇲 AMD' },
          { value: 'USD', label: '🇺🇸 USD' },
          { value: 'EUR', label: '🇪🇺 EUR' },
          { value: 'RUB', label: '🇷🇺 RUB' },
        ],
      },
      estimatedDurationMinutes: { description: 'Estimated duration in minutes' },
      isActive: { description: 'Toggle to show/hide this service in the app' },

      // ── Location selector (array of PartnerLocation refs) ─────────────────
      locationIds: {
        isArray: true,
        reference: 'PartnerLocation',
        description: '📍 Select branch locations where this service is offered',
        isVisible: { list: false, filter: false, show: true, edit: true, new: true },
      },

      // ── Car-based pricing builder ─────────────────────────────────────────
      carBasedPrices: {
        type: 'mixed',
        isArray: true,
        description: '🚗 Car-specific prices (optional — add rows for each car make/model)',
        isVisible: { list: false, filter: false, show: true, edit: true, new: true },
      },
      'carBasedPrices.make': {
        type: 'string',
        description: 'Car brand (e.g. Toyota, BMW). Leave empty for all makes.',
      },
      'carBasedPrices.model': {
        type: 'string',
        description: 'Model (e.g. Camry). Leave empty for all models of the selected make.',
      },
      'carBasedPrices.price': {
        type: 'number',
        description: 'Price for this car type',
      },
    },

    actions: {
      new: { before: [buildServicePayload] },
      edit: { before: [buildServicePayload] },
    },
  },
};
