import { ComponentLoader } from 'adminjs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Single shared ComponentLoader instance — imported by app.module.ts AND resource files
export const componentLoader = new ComponentLoader();

export const dashboardComponent = componentLoader.add(
  'Dashboard',
  path.join(__dirname, 'admin/components/dashboard'),
);

export const blankDashboardComponent = componentLoader.add(
  'BlankDashboard',
  path.join(__dirname, 'admin/components/blank-dashboard'),
);

export const readonlyPartnerFieldComponent = componentLoader.add(
  'ReadonlyPartnerField',
  path.join(__dirname, 'admin/components/readonly-partner-field'),
);

export const productAttributesComponent = componentLoader.add(
  'ProductAttributes',
  path.join(__dirname, 'admin/components/product-attributes'),
);
