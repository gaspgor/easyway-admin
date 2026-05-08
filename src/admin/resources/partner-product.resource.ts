import { PartnerProduct } from '../../entities/partner-product.entity.js';
import { Before, ValidationError } from 'adminjs';
import { readonlyPartnerFieldComponent, productAttributesComponent } from '../../component-loader.js';

// ── Before hook ──────────────────────────────────────────────────────────────
const buildProductPayload: Before = async (request) => {
  if (request.method === 'post' && request.payload) {
    const payload = request.payload;

    // Inject partnerId from URL query when coming from partner context
    if (!payload.partnerId && (request as any).query?.partnerId) {
      payload.partnerId = (request as any).query.partnerId;
    }

    // ── 1. compatibleVehicles — array of {make, model, year, additionalSpecification}
    // AdminJS sends: compatibleVehicles.0.make, compatibleVehicles.0.model …
    const cvMap: Record<number, any> = {};
    Object.keys(payload).forEach(key => {
      const m = key.match(/^compatibleVehicles\.(\d+)\.(.+)$/);
      if (m) {
        const idx = parseInt(m[1]);
        if (!cvMap[idx]) cvMap[idx] = {};
        cvMap[idx][m[2]] = payload[key];
        delete payload[key];
      }
    });
    const compatibleVehicles = Object.values(cvMap).filter((e: any) => e.make || e.model);
    payload.compatibleVehicles = compatibleVehicles.length ? compatibleVehicles : null;

    // ── 2. locationIds — array of PartnerLocation UUIDs
    const locMap: Record<number, string> = {};
    Object.keys(payload).forEach(key => {
      const m = key.match(/^locationIds\.(\d+)$/);
      if (m) { locMap[parseInt(m[1])] = payload[key]; delete payload[key]; }
    });
    const locationIds = Object.values(locMap).filter(Boolean);
    payload.locationIds = locationIds.length ? locationIds : null;

    // ── 3. attributes — custom component pushes a JSON object via onChange
    // If somehow sent as flat keys, rebuild the object
    if (!payload.attributes || typeof payload.attributes !== 'object') {
      const attrMap: Record<string, string> = {};
      Object.keys(payload).forEach(key => {
        const m = key.match(/^attributes\.(.+)$/);
        if (m) { attrMap[m[1]] = payload[key]; delete payload[key]; }
      });
      payload.attributes = Object.keys(attrMap).length ? attrMap : null;
    }

    // ── 4. Validate required fields
    const errors: any = {};
    if (!payload.partnerId)   errors.partnerId   = { message: 'Partner is required' };
    if (!payload.name)        errors.name        = { message: 'Product name is required' };
    if (!payload.price)       errors.price       = { message: 'Price is required' };
    if (!payload.productType) errors.productType = { message: 'Product type is required' };
    if (Object.keys(errors).length > 0)
      throw new ValidationError(errors, { message: 'Please fill in all required fields' });
  }
  return request;
};

export const PartnerProductResourceOptions = {
  resource: PartnerProduct,
  options: {
    navigation: false,
    sort: { sortBy: 'createdAt', direction: 'desc' },

    listProperties: ['partnerId', 'productType', 'name', 'price', 'currency', 'stock', 'isActive', 'isUniversal', 'createdAt'],
    showProperties: ['id', 'partnerId', 'productType', 'name', 'description', 'price', 'currency',
                     'stock', 'isActive', 'isUniversal', 'locationIds', 'compatibleVehicles', 'attributes', 'createdAt', 'updatedAt'],
    newProperties:  ['partnerId', 'productType', 'name', 'description', 'price', 'currency',
                     'stock', 'isActive', 'isUniversal', 'locationIds', 'compatibleVehicles', 'attributes'],
    editProperties: ['partnerId', 'productType', 'name', 'description', 'price', 'currency',
                     'stock', 'isActive', 'isUniversal', 'locationIds', 'compatibleVehicles', 'attributes'],
    filterProperties: ['partnerId', 'productType', 'name', 'isActive', 'isUniversal'],

    properties: {
      id:         { isVisible: { list: false, filter: false, show: true,  edit: false, new: false } },
      createdAt:  { isVisible: { list: true,  filter: true,  show: true,  edit: false, new: false } },
      updatedAt:  { isVisible: { list: false, filter: false, show: true,  edit: false, new: false } },

      // ── Partner selector (locked on new) ─────────────────────────────────
      partnerId: {
        reference: 'Partner',
        description: '🏢 Select the Partner this product belongs to',
        isVisible: { list: true, filter: true, show: true, edit: true, new: true },
        components: { new: readonlyPartnerFieldComponent },
      },

      // ── Product type selector ─────────────────────────────────────────────
      productType: {
        description: '📦 Product category — determines which attribute fields are shown',
        availableValues: [
          { value: 'engine_oil',         label: '🛢️ Engine Oil' },
          { value: 'transmission_oil',   label: '⚙️ Transmission Oil' },
          { value: 'reducer_oil',        label: '🔩 Reducer / Differential Oil' },
          { value: 'brake_fluid',        label: '🔴 Brake Fluid' },
          { value: 'brake_parts',        label: '🛑 Brake Parts (pads, discs, calipers)' },
          { value: 'lights',             label: '💡 Lights & Bulbs' },
          { value: 'engine_parts',       label: '🔧 Engine Parts' },
          { value: 'transmission_parts', label: '⚙️ Transmission / Clutch Parts' },
          { value: 'filters',            label: '🔷 Filters (oil, air, fuel, cabin)' },
          { value: 'tires',              label: '🔵 Tires' },
          { value: 'batteries',          label: '🔋 Batteries' },
          { value: 'suspension_parts',   label: '🔩 Suspension Parts' },
          { value: 'custom',             label: '⚡ Custom / Other' },
        ],
      },

      // ── Core fields ───────────────────────────────────────────────────────
      name:        { description: 'Product name shown to customers' },
      description: { type: 'textarea', description: 'Optional — shown in the app product detail' },
      price:       { description: 'Selling price' },
      currency: {
        availableValues: [
          { value: 'AMD', label: '🇦🇲 AMD' },
          { value: 'USD', label: '🇺🇸 USD' },
          { value: 'EUR', label: '🇪🇺 EUR' },
          { value: 'RUB', label: '🇷🇺 RUB' },
        ],
      },
      stock:       { description: 'Current inventory count (0 = out of stock)' },
      isActive:    { description: 'Toggle ON to show this product in the app' },
      isUniversal: { description: '✅ ON = fits all cars. AI can still recommend the best-matching variant.' },

      // ── Location selector ─────────────────────────────────────────────────
      locationIds: {
        isArray: true,
        reference: 'PartnerLocation',
        description: '📍 Select branch locations where this product is sold',
        isVisible: { list: false, filter: false, show: true, edit: true, new: true },
      },

      // ── Compatible vehicles — [{make, model, year, additionalSpecification}]
      compatibleVehicles: {
        type: 'mixed',
        isArray: true,
        description: '🚗 Compatible vehicles (leave empty if Universal). Add one row per make group.',
        isVisible: { list: false, filter: false, show: true, edit: true, new: true },
      },
      'compatibleVehicles.make': {
        type: 'string',
        description: 'Car brand (e.g. Toyota)',
      },
      'compatibleVehicles.model': {
        type: 'string',
        description: 'Models — comma separated (e.g. Camry, Corolla, RAV4)',
      },
      'compatibleVehicles.year': {
        type: 'string',
        description: 'Years / ranges — comma separated (e.g. 2013, 2015-2018, 2020)',
      },
      'compatibleVehicles.additionalSpecification': {
        type: 'string',
        description: 'Trim / grade (e.g. GR, GR Sport, SE, XLE)',
      },

      // ── Dynamic attributes — custom component ─────────────────────────────
      attributes: {
        type: 'mixed',
        description: '⚙️ Technical specs — fields change based on Product Type',
        isVisible: { list: false, filter: false, show: true, edit: true, new: true },
        components: {
          new:  productAttributesComponent,
          edit: productAttributesComponent,
        },
      },
    },

    actions: {
      new:  { before: [buildProductPayload] },
      edit: { before: [buildProductPayload] },
    },
  },
};
