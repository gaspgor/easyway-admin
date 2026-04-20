import { Partner, PartnerStatus, PartnerSphere } from '../../entities/partner.entity.js';
import { PartnerAuth } from '../../entities/partner-auth.entity.js';
import { PartnerContact } from '../../entities/partner-contact.entity.js';
import { PartnerProduct } from '../../entities/partner-product.entity.js';
import { PartnerService } from '../../entities/partner-service.entity.js';
import { ActionResponse, After, Before, ValidationError } from 'adminjs';
import bcrypt from 'bcrypt';

const generateUsername = (companyName: string) => {
  const base = (companyName || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const randomStr = Math.floor(1000 + Math.random() * 9000).toString();
  return `${base}_${randomStr}`;
};

const extractVirtualPayload: Before = async (request) => {
  if (request.method === 'post' && request.payload) {
     request.payload._virtualProps = {
        partnerAuth: {},
        partnerContacts: [],
        partnerProducts: [],
        partnerServices: [],
     };

     // AdminJS flattens payloads for arrays deeply (e.g. `partnerContacts.0.name`). We must construct the array logically.
     Object.keys(request.payload).forEach(key => {
        if (key.startsWith('partnerAuth.')) {
            const prop = key.split('.')[1];
            request.payload._virtualProps.partnerAuth[prop] = request.payload[key];
        }
        if (key.startsWith('partnerContacts.')) {
            const parts = key.split('.');
            const index = parseInt(parts[1], 10);
            const prop = parts[2];
            if (!request.payload._virtualProps.partnerContacts[index]) request.payload._virtualProps.partnerContacts[index] = {};
            request.payload._virtualProps.partnerContacts[index][prop] = request.payload[key];
        }
        if (key.startsWith('partnerProducts.')) {
            const parts = key.split('.');
            const index = parseInt(parts[1], 10);
            const prop = parts[2];
            if (!request.payload._virtualProps.partnerProducts[index]) request.payload._virtualProps.partnerProducts[index] = {};
            request.payload._virtualProps.partnerProducts[index][prop] = request.payload[key];
        }
        if (key.startsWith('partnerServices.')) {
            const parts = key.split('.');
            const index = parseInt(parts[1], 10);
            const prop = parts[2];
            if (!request.payload._virtualProps.partnerServices[index]) request.payload._virtualProps.partnerServices[index] = {};
            request.payload._virtualProps.partnerServices[index][prop] = request.payload[key];
        }
     });

     // Filter out purely empty structural array elements
     request.payload._virtualProps.partnerContacts = request.payload._virtualProps.partnerContacts.filter((c: any) => c && c.name && c.phone);
     request.payload._virtualProps.partnerProducts = request.payload._virtualProps.partnerProducts.filter((p: any) => p && p.name && p.price);
     request.payload._virtualProps.partnerServices = request.payload._virtualProps.partnerServices.filter((s: any) => s && s.name && s.price);

     // --- Backend Strict Rule Enforcement & Sanitization ---
     const sphere = request.payload.companySphere;
     const validationErrors: any = {};

     // Native Form Validation Overrides to cleanly Highlight Inputs RED instead of SQL crashing!
     if (!request.payload.companyName) validationErrors.companyName = { message: 'Company Name is strictly required!' };
     if (!sphere) validationErrors.companySphere = { message: 'Company Sphere is strictly required!' };
     if (!request.payload.companyType) validationErrors.companyType = { message: 'Company Type is strictly required!' };
     if (!request.payload.location) validationErrors.location = { message: 'Company Location is strictly required!' };
     if (!request.payload.email) validationErrors.email = { message: 'Company Email is strictly required!' };
     if (!request.payload.phone) validationErrors.phone = { message: 'Company Phone is strictly required!' };

     // Explicitly validate virtual Auth configuration
     const authPwd = request.payload._virtualProps.partnerAuth?.password;
     if (request.method === 'post' && !authPwd) {
         validationErrors['partnerAuth.password'] = { message: 'An Auth Password is strictly required!' };
     }

     if (request.payload._virtualProps.partnerContacts.length === 0) {
         validationErrors.partnerContacts = { message: 'You must provide at least one valid Contact Person with a Name and Phone!' };
     }

     if (sphere === PartnerSphere.SERVICE) {
         request.payload._virtualProps.partnerProducts = []; // Silent sanitization!
         if (request.payload._virtualProps.partnerServices.length === 0) {
             validationErrors.partnerServices = { message: 'You selected the Service Sphere. Services are strictly required!' };
         }
     } else if (sphere === PartnerSphere.STORE) {
         request.payload._virtualProps.partnerServices = []; // Silent sanitization!
         if (request.payload._virtualProps.partnerProducts.length === 0) {
             validationErrors.partnerProducts = { message: 'You selected the Store Sphere. Products are strictly required!' };
         }
     } else if (sphere === PartnerSphere.BOTH) {
         if (request.payload._virtualProps.partnerProducts.length === 0) {
             validationErrors.partnerProducts = { message: 'Sphere "Both" requires at least one Product!' };
         }
         if (request.payload._virtualProps.partnerServices.length === 0) {
             validationErrors.partnerServices = { message: 'Sphere "Both" requires at least one Service!' };
         }
     }

     if (Object.keys(validationErrors).length > 0) {
         throw new ValidationError(validationErrors, { message: 'Strict Validation Failed! Check the red highlighted fields.' });
     }

     // Strip virtual root keys from actual payload to bypass SQL mapping crash
     Object.keys(request.payload).forEach(key => {
        if (key.startsWith('partnerAuth') || key.startsWith('partnerContacts') || key.startsWith('partnerProducts') || key.startsWith('partnerServices')) {
            delete request.payload[key];
        }
     });
  }
  return request;
};

const processNestedEntities: After<ActionResponse> = async (response, request) => {
  if (request.method === 'post' && response.record && !response.record.errors.length) {
    const partnerId = response.record.params.id;
    const vp = request.payload?._virtualProps;
    const sphere = request.payload?.companySphere;

    if (!vp) return response;

    let hasAuth = false;
    let hasContact = false;
    let hasProducts = false;
    let hasServices = false;

    // 1. Auth Setup
    if (vp.partnerAuth && vp.partnerAuth.password) {
      const auth = new PartnerAuth();
      auth.username = generateUsername(request.payload.companyName || 'admin');
      auth.passwordHash = await bcrypt.hash(vp.partnerAuth.password, 10);
      auth.partnerId = partnerId;
      await auth.save();
      hasAuth = true;
    }

    // 2. Loop Through Multiple Contacts!
    for (const c of vp.partnerContacts) {
        if (c && c.name && c.phone) {
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

    // 3. Process Products structurally into Single PartnerProduct JSON Array row
    const solidProducts = vp.partnerProducts.filter((p: any) => p && p.name && p.price);
    if (solidProducts.length > 0) {
      const pp = new PartnerProduct();
      pp.products = solidProducts.map((p: any) => ({ name: p.name, price: Number(p.price), availability: p.availability === 'true' || p.availability === true }));
      pp.partnerId = partnerId;
      await pp.save();
      hasProducts = true;
    }

    // 4. Process Services structurally into Single PartnerService JSON Array row
    const solidServices = vp.partnerServices.filter((s: any) => s && s.name && s.price);
    if (solidServices.length > 0) {
      const ps = new PartnerService();
      ps.services = solidServices.map((s: any) => ({ name: s.name, price: Number(s.price), availability: s.availability === 'true' || s.availability === true }));
      ps.partnerId = partnerId;
      await ps.save();
      hasServices = true;
    }

    // --- Dynamic Status Calculator ---
    let finalStatus = PartnerStatus.UNFINISHED;
    const adminRequestedStatus = request.payload?.status;

    if (adminRequestedStatus === PartnerStatus.BLOCKED || adminRequestedStatus === PartnerStatus.ARCHIVED) {
        finalStatus = adminRequestedStatus;
    } else {
        // Automatic Calculation Constraints
        const validContact = hasContact;
        const validStore = (sphere === PartnerSphere.STORE && hasProducts);
        const validService = (sphere === PartnerSphere.SERVICE && hasServices);
        const validBoth = (sphere === PartnerSphere.BOTH && hasProducts && hasServices);

        if (hasAuth && validContact && (validStore || validService || validBoth)) {
            finalStatus = PartnerStatus.ACTIVE;
        }
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
    
    // Explicit Form Field Ordering Map
    editProperties: [
      'companyName',
      'companySphere',
      'companyType',
      'location',
      'email',
      'phone',
      'partnerServices',
      'partnerProducts',
      'partnerAuth',
      'partnerContacts',
    ],
    showProperties: [
      'id',
      'companyName',
      'companySphere',
      'companyType',
      'location',
      'email',
      'phone',
      'status',
      'createdAt',
      'modifiedAt'
    ],
    listProperties: [
      'companyName',
      'companySphere',
      'email',
      'phone',
      'status'
    ],

    properties: {
      id: { isVisible: { list: false, filter: false, show: true, edit: false } },
      createdAt: { isVisible: { list: true, filter: true, show: true, edit: false } },
      modifiedAt: { isVisible: { list: false, filter: false, show: true, edit: false } },
      status: {
        availableValues: [
          { value: PartnerStatus.ACTIVE, label: 'Active (Auto Setting Only)' },
          { value: PartnerStatus.ARCHIVED, label: 'Archived (Manual Override)' },
          { value: PartnerStatus.BLOCKED, label: 'Blocked (Manual Override)' },
          { value: PartnerStatus.UNFINISHED, label: 'Unfinished' },
        ],
      },
      
      // Beautiful Structurally Nested Fields!
      partnerAuth: {
        type: 'mixed',
        isVisible: { list: false, filter: false, show: false, edit: true },
      },
      'partnerAuth.password': { type: 'password', isVisible: { edit: true } },

      partnerContacts: {
        type: 'mixed',
        isArray: true,
        isVisible: { list: false, filter: false, show: false, edit: true },
      },
      'partnerContacts.name': { type: 'string', isVisible: { edit: true } },
      'partnerContacts.surname': { type: 'string', isVisible: { edit: true } },
      'partnerContacts.phone': { type: 'string', isVisible: { edit: true } },
      'partnerContacts.email': { type: 'string', isVisible: { edit: true } },
      'partnerContacts.address': { type: 'textarea', isVisible: { edit: true } },

      partnerProducts: {
        type: 'mixed',
        isArray: true,
        description: 'Provide IF Sphere is STORE or BOTH',
        isVisible: { list: false, filter: false, show: false, edit: true },
      },
      'partnerProducts.name': { type: 'string', isVisible: { edit: true } },
      'partnerProducts.price': { type: 'number', isVisible: { edit: true } },
      'partnerProducts.availability': { type: 'boolean', isVisible: { edit: true } },

      partnerServices: {
        type: 'mixed',
        isArray: true,
        description: 'Provide IF Sphere is SERVICE or BOTH',
        isVisible: { list: false, filter: false, show: false, edit: true },
      },
      'partnerServices.name': { type: 'string', isVisible: { edit: true } },
      'partnerServices.price': { type: 'number', isVisible: { edit: true } },
      'partnerServices.availability': { type: 'boolean', isVisible: { edit: true } },

    },
    actions: {
      new: {
        before: [extractVirtualPayload],
        after: [processNestedEntities],
      },
    },
  },
};
