import { Partner, PartnerStatus, PartnerSphere } from '../../entities/partner.entity.js';
import { PartnerAuth } from '../../entities/partner-auth.entity.js';
import { PartnerContact } from '../../entities/partner-contact.entity.js';
import { ActionResponse, After, Before, ValidationError } from 'adminjs';
import bcrypt from 'bcrypt';

const generateUsername = (companyName: string) => {
  const base = (companyName || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const randomStr = Math.floor(1000 + Math.random() * 9000).toString();
  return `${base}_${randomStr}`;
};

// ── Before hook: extract virtual props & validate ─────────────────────────
const extractVirtualPayload: Before = async (request) => {
  if (request.method === 'post' && request.payload) {
    request.payload._virtualProps = {
      partnerAuth: {},
      partnerContacts: [],
    };

    // Parse nested flat keys like `partnerAuth.password`, `partnerContacts.0.name`
    Object.keys(request.payload).forEach(key => {
      if (key.startsWith('partnerAuth.')) {
        const prop = key.split('.')[1];
        request.payload._virtualProps.partnerAuth[prop] = request.payload[key];
      }
      if (key.startsWith('partnerContacts.')) {
        const parts = key.split('.');
        const index = parseInt(parts[1], 10);
        const prop = parts[2];
        if (!request.payload._virtualProps.partnerContacts[index])
          request.payload._virtualProps.partnerContacts[index] = {};
        request.payload._virtualProps.partnerContacts[index][prop] = request.payload[key];
      }
    });

    request.payload._virtualProps.partnerContacts =
      request.payload._virtualProps.partnerContacts.filter(
        (c: any) => c && c.name && c.phone,
      );

    // ── Validation ──────────────────────────────────────────────────────────
    const errors: any = {};
    if (!request.payload.companyName)  errors.companyName  = { message: 'Business name is required' };
    if (!request.payload.companySphere) errors.companySphere = { message: 'Working sphere is required' };
    if (!request.payload.email)         errors.email         = { message: 'Email is required' };
    if (!request.payload.phone)         errors.phone         = { message: 'Phone number is required' };
    if (!request.payload._virtualProps.partnerAuth?.password)
      errors['partnerAuth.password'] = { message: 'Login password is required' };
    if (request.payload._virtualProps.partnerContacts.length === 0)
      errors.partnerContacts = { message: 'At least one contact person (name + phone) is required' };

    if (Object.keys(errors).length > 0)
      throw new ValidationError(errors, { message: 'Please fill in all required fields' });

    // Strip virtual keys so TypeORM doesn't crash
    Object.keys(request.payload).forEach(key => {
      if (key.startsWith('partnerAuth') || key.startsWith('partnerContacts'))
        delete request.payload[key];
    });
  }
  return request;
};

// ── After hook: create auth + contacts, set final status ─────────────────
const processNestedEntities: After<ActionResponse> = async (response, request) => {
  if (request.method === 'post' && response.record && !response.record.errors.length) {
    const partnerId = response.record.params.id;
    const vp = request.payload?._virtualProps;
    if (!vp) return response;

    let hasAuth = false;
    let hasContact = false;

    // 1. Create partner login credentials
    if (vp.partnerAuth?.password) {
      const auth = new PartnerAuth();
      auth.username = generateUsername(request.payload.companyName || 'partner');
      auth.passwordHash = await bcrypt.hash(vp.partnerAuth.password, 10);
      auth.partnerId = partnerId;
      await auth.save();
      hasAuth = true;
    }

    // 2. Create contact persons
    for (const c of vp.partnerContacts) {
      if (c?.name && c?.phone) {
        const contact = new PartnerContact();
        contact.name = c.name;
        contact.surname = c.surname || '';
        contact.phone = c.phone;
        contact.email = c.email || '';
        contact.address = c.address || '';
        contact.partnerId = partnerId;
        await contact.save();
        hasContact = true;
      }
    }

    // 3. Auto-determine status
    let finalStatus = PartnerStatus.UNFINISHED;
    const adminStatus = request.payload?.status;
    if (adminStatus === PartnerStatus.BLOCKED || adminStatus === PartnerStatus.ARCHIVED) {
      finalStatus = adminStatus;
    } else if (hasAuth && hasContact) {
      finalStatus = PartnerStatus.ACTIVE;
    }

    const partner = await Partner.findOne({ where: { id: partnerId } });
    if (partner) {
      partner.status = finalStatus as PartnerStatus;
      await partner.save();
      response.record.params.status = finalStatus;
    }
  }
  return response;
};

export const PartnerResourceOptions = {
  resource: Partner,
  options: {
    navigation: { name: 'Partners', icon: 'Store' },

    // ── List view columns ──────────────────────────────────────────────────
    listProperties: ['companyName', 'companySphere', 'email', 'phone', 'status', 'createdAt'],

    // ── Show (detail) view ─────────────────────────────────────────────────
    showProperties: [
      'id', 'companyName', 'companySphere',
      'email', 'phone', 'website', 'logoUrl',
      'description', 'rating', 'status',
      'createdAt', 'modifiedAt',
    ],

    // ── Create form — clean & focused ──────────────────────────────────────
    // After creation admin adds locations via Partner Locations section
    newProperties: [
      'companyName',
      'companySphere',
      'email',
      'phone',
      'website',
      'description',
      'logoUrl',
      'partnerAuth',
      'partnerContacts',
    ],

    // ── Edit form — all editable fields ───────────────────────────────────
    editProperties: [
      'companyName',
      'companySphere',
      'email',
      'phone',
      'website',
      'description',
      'logoUrl',
      'status',
      'partnerAuth',
      'partnerContacts',
    ],

    properties: {
      // ── Hidden / meta ────────────────────────────────────────────────────
      id:         { isVisible: { list: false, filter: false, show: true,  edit: false } },
      createdAt:  { isVisible: { list: true,  filter: true,  show: true,  edit: false } },
      modifiedAt: { isVisible: { list: false, filter: false, show: true,  edit: false } },
      rating:     { isVisible: { list: false, filter: false, show: true,  edit: false } },

      // ── Core fields ───────────────────────────────────────────────────────
      companyName: {
        description: 'Official registered business name',
      },
      companySphere: {
        description: 'What kind of business this partner operates',
        availableValues: [
          { value: PartnerSphere.SERVICE, label: '🔧 Service Center — Repairs & Maintenance' },
          { value: PartnerSphere.STORE,   label: '🛒 Store — Sells Car Parts & Products' },
          { value: PartnerSphere.BOTH,    label: '🏢 Both — Service Center AND Store' },
        ],
      },
      email:   { description: 'Partner login & communication email' },
      phone:   { description: 'Primary contact phone number' },
      website: { description: 'Optional business website URL' },
      logoUrl: { description: 'Direct URL to the partner logo image' },
      description: {
        type: 'textarea',
        description: 'Short description of the business shown to app users',
      },

      status: {
        description: 'Active is set automatically once auth + contact are created',
        availableValues: [
          { value: PartnerStatus.ACTIVE,     label: '✅ Active' },
          { value: PartnerStatus.UNFINISHED, label: '⏳ Unfinished — Setup Incomplete' },
          { value: PartnerStatus.BLOCKED,    label: '🚫 Blocked — Manually Suspended' },
          { value: PartnerStatus.ARCHIVED,   label: '📦 Archived — No Longer Operating' },
        ],
      },

      // ── Virtual: Login credentials section ───────────────────────────────
      partnerAuth: {
        type: 'mixed',
        description: '🔐 Partner App Login Credentials',
        isVisible: { list: false, filter: false, show: false, edit: true, new: true },
      },
      'partnerAuth.password': {
        type: 'password',
        description: 'Password the partner will use to log into the partner app',
        isVisible: { edit: true, new: true },
      },

      // ── Virtual: Contact persons section ──────────────────────────────────
      partnerContacts: {
        type: 'mixed',
        isArray: true,
        description: '👤 Contact Person(s) — at least one required (name + phone)',
        isVisible: { list: false, filter: false, show: false, edit: true, new: true },
      },
      'partnerContacts.name':    { type: 'string',   description: 'First name',     isVisible: { edit: true, new: true } },
      'partnerContacts.surname': { type: 'string',   description: 'Last name',      isVisible: { edit: true, new: true } },
      'partnerContacts.phone':   { type: 'string',   description: 'Mobile number',  isVisible: { edit: true, new: true } },
      'partnerContacts.email':   { type: 'string',   description: 'Contact email',  isVisible: { edit: true, new: true } },
    },

    actions: {
      new: {
        before: [extractVirtualPayload],
        after:  [processNestedEntities],
      },
      edit: {
        before: [extractVirtualPayload],
        after:  [processNestedEntities],
      },
      // ── Partner-scoped navigation actions ────────────────────────────────
      // These appear as buttons on the Partner show/list row and redirect to
      // filtered views of the partner's services, products, or locations.
      'manage-services': {
        actionType: 'record',
        icon: 'Wrench',
        label: '🔧 Services',
        component: false,
        isVisible: ({ record }) => {
          const sphere = record?.get('companySphere');
          return sphere === 'service' || sphere === 'both';
        },
        handler: async (request, response, context) => {
          const id = context.record?.id();
          return {
            redirectUrl: `/admin/resources/PartnerService/actions/list?filters.partnerId=${id}&newRecord[partnerId]=${id}`,
            record: context.record.toJSON(context.currentAdmin),
          };
        },
      },
      'manage-products': {
        actionType: 'record',
        icon: 'Package',
        label: '📦 Products',
        component: false,
        isVisible: ({ record }) => {
          const sphere = record?.get('companySphere');
          return sphere === 'store' || sphere === 'both';
        },
        handler: async (request, response, context) => {
          const id = context.record?.id();
          return {
            redirectUrl: `/admin/resources/PartnerProduct/actions/list?filters.partnerId=${id}&newRecord[partnerId]=${id}`,
            record: context.record.toJSON(context.currentAdmin),
          };
        },
      },
      'manage-locations': {
        actionType: 'record',
        icon: 'MapPin',
        label: '📍 Locations',
        component: false,
        handler: async (request, response, context) => {
          const id = context.record?.id();
          return {
            redirectUrl: `/admin/resources/PartnerLocation/actions/list?filters.partnerId=${id}`,
            record: context.record.toJSON(context.currentAdmin),
          };
        },
      },
    },
  },
};
