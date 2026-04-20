import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const admin = require('firebase-admin');

console.log("admin keys:", Object.keys(admin));
console.log("admin.apps:", admin.apps);
console.log("admin.default:", admin.default ? Object.keys(admin.default) : 'undefined');
