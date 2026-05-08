import React, { useState, useEffect, useRef } from 'react';

// ── Product type definitions ──────────────────────────────────────────────────
export const PRODUCT_TYPES = [
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
];

const TEMPLATES: Record<string, { key: string; label: string; placeholder: string }[]> = {
  engine_oil:         [{ key:'viscosity', label:'Viscosity', placeholder:'5W-30, 10W-40' }, { key:'oil_type', label:'Oil Type', placeholder:'synthetic, semi-synthetic, mineral' }, { key:'brand', label:'Brand', placeholder:'Castrol, Mobil 1' }, { key:'volume', label:'Volume', placeholder:'1L, 4L, 5L' }, { key:'specification', label:'Specification', placeholder:'API SN, ACEA A3/B4' }],
  transmission_oil:   [{ key:'atf_type', label:'ATF Type', placeholder:'Dexron VI, Mercon V' }, { key:'brand', label:'Brand', placeholder:'Castrol, Mobil' }, { key:'volume', label:'Volume', placeholder:'1L, 4L' }, { key:'specification', label:'Specification', placeholder:'ATF+4, FZ' }],
  reducer_oil:        [{ key:'viscosity', label:'Viscosity', placeholder:'75W-90, 80W-90' }, { key:'brand', label:'Brand', placeholder:'Mobil, Castrol' }, { key:'volume', label:'Volume', placeholder:'1L, 2L' }, { key:'specification', label:'Specification', placeholder:'GL-5, GL-4' }],
  brake_fluid:        [{ key:'dot_rating', label:'DOT Rating', placeholder:'DOT 3, DOT 4, DOT 5.1' }, { key:'brand', label:'Brand', placeholder:'Brembo, Bosch' }, { key:'volume', label:'Volume', placeholder:'500ml, 1L' }],
  brake_parts:        [{ key:'part_type', label:'Part Type', placeholder:'disc, drum, pad, caliper' }, { key:'brand', label:'Brand', placeholder:'Brembo, Bosch, ATE' }, { key:'part_number', label:'Part Number', placeholder:'BP123456' }, { key:'material', label:'Material', placeholder:'ceramic, semi-metallic, organic' }, { key:'position', label:'Position', placeholder:'front, rear' }],
  lights:             [{ key:'light_type', label:'Light Type', placeholder:'halogen, LED, xenon, HID' }, { key:'fitting', label:'Fitting / Bulb Code', placeholder:'H4, H7, H11, 9005' }, { key:'wattage', label:'Wattage', placeholder:'55W, 35W' }, { key:'color_temp', label:'Color Temp', placeholder:'6000K, 4300K' }, { key:'brand', label:'Brand', placeholder:'Philips, Osram' }],
  engine_parts:       [{ key:'part_name', label:'Part Name', placeholder:'piston, camshaft, crankshaft, belt' }, { key:'brand', label:'Brand', placeholder:'OEM, Mahle, Elring' }, { key:'part_number', label:'Part Number', placeholder:'EP456789' }, { key:'material', label:'Material', placeholder:'aluminum, steel' }, { key:'warranty', label:'Warranty', placeholder:'12 months' }],
  transmission_parts: [{ key:'part_name', label:'Part Name', placeholder:'clutch, gear, syncro ring' }, { key:'brand', label:'Brand', placeholder:'OEM, LuK, ZF' }, { key:'part_number', label:'Part Number', placeholder:'TP987654' }, { key:'warranty', label:'Warranty', placeholder:'12 months' }],
  filters:            [{ key:'filter_type', label:'Filter Type', placeholder:'oil, air, fuel, cabin' }, { key:'brand', label:'Brand', placeholder:'Mann, Bosch, Mahle' }, { key:'part_number', label:'Part Number', placeholder:'W 712/95' }],
  tires:              [{ key:'width', label:'Width (mm)', placeholder:'225' }, { key:'aspect_ratio', label:'Aspect Ratio', placeholder:'45' }, { key:'rim_diameter', label:'Rim Diameter (in)', placeholder:'17' }, { key:'load_index', label:'Load Index', placeholder:'91' }, { key:'speed_rating', label:'Speed Rating', placeholder:'V, W, Y' }, { key:'brand', label:'Brand', placeholder:'Michelin, Pirelli' }, { key:'season', label:'Season', placeholder:'summer, winter, all-season' }],
  batteries:          [{ key:'capacity_ah', label:'Capacity (Ah)', placeholder:'60, 70, 90' }, { key:'cca', label:'Cold Cranking Amps', placeholder:'540, 680' }, { key:'voltage', label:'Voltage', placeholder:'12V' }, { key:'brand', label:'Brand', placeholder:'Bosch, Varta, Exide' }, { key:'warranty', label:'Warranty', placeholder:'24 months' }],
  suspension_parts:   [{ key:'part_type', label:'Part Type', placeholder:'shock absorber, spring, arm, bushing' }, { key:'brand', label:'Brand', placeholder:'KYB, Monroe, Bilstein' }, { key:'part_number', label:'Part Number', placeholder:'' }, { key:'position', label:'Position', placeholder:'front-left, rear-right' }],
};

interface KV { key: string; value: string }

interface Props {
  record: any;
  property: any;
  onChange?: (name: string, value: any) => void;
}

const s = {
  input: { border:'1px solid #d1d5db', borderRadius:4, padding:'6px 10px', fontSize:13, width:'100%', boxSizing:'border-box' as any },
  label: { fontSize:12, color:'#6b7280', fontWeight:500 as any, marginBottom:3, display:'block' },
  btn:   (color: string) => ({ padding:'5px 12px', cursor:'pointer', background:color==='blue'?'#e0f2fe':'#fee2e2', border:`1px solid ${color==='blue'?'#7dd3fc':'#fca5a5'}`, borderRadius:4, color:color==='blue'?'#0284c7':'#dc2626', fontSize:12 }),
};

const ProductAttributesField: React.FC<Props> = ({ record, property, onChange }) => {
  const productType: string = record?.params?.productType || '';
  const existing = record?.params?.[property.name];

  const toKV = (obj: any): KV[] => {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return [];
    return Object.entries(obj).map(([k, v]) => ({ key: k, value: String(v) }));
  };

  const initFields = (type: string, obj: any): KV[] => {
    if (!type || type === 'custom') return toKV(obj).length ? toKV(obj) : [{ key:'', value:'' }];
    const tpl = TEMPLATES[type] || [];
    const src = (obj && typeof obj === 'object') ? obj : {};
    return tpl.map(t => ({ key: t.key, value: src[t.key] || '' }));
  };

  const [fields, setFields] = useState<KV[]>(() => initFields(productType, existing));
  const prevType = useRef(productType);

  // Reset fields when product type changes
  useEffect(() => {
    if (prevType.current !== productType) {
      prevType.current = productType;
      setFields(initFields(productType, null));
    }
  }, [productType]);

  // Push assembled object up to AdminJS form state
  useEffect(() => {
    if (!onChange) return;
    const obj: Record<string, string> = {};
    fields.forEach(f => { if (f.key && f.value) obj[f.key] = f.value; });
    onChange(property.name, Object.keys(obj).length ? obj : null);
  }, [fields]);

  const update = (i: number, k: keyof KV, v: string) =>
    setFields(p => p.map((f, idx) => idx === i ? { ...f, [k]: v } : f));

  if (!productType) {
    return (
      <div style={{ padding:12, background:'#f9fafb', border:'1px dashed #d1d5db', borderRadius:4, color:'#9ca3af', fontSize:13 }}>
        ℹ️ Select a <strong>Product Type</strong> above to see attribute fields
      </div>
    );
  }

  const isCustom = productType === 'custom' || !TEMPLATES[productType];
  const template = TEMPLATES[productType] || [];

  return (
    <div style={{ background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:6, padding:14 }}>
      <div style={{ fontSize:12, color:'#6b7280', marginBottom:10, fontWeight:600 }}>
        ⚙️ Attributes — {PRODUCT_TYPES.find(t => t.value === productType)?.label || productType}
      </div>

      {isCustom ? (
        /* Custom: free key-value pairs */
        <div>
          {fields.map((f, i) => (
            <div key={i} style={{ display:'flex', gap:8, marginBottom:8, alignItems:'flex-end' }}>
              <div style={{ flex:1 }}>
                <label style={s.label}>Name</label>
                <input style={s.input} placeholder="e.g. material" value={f.key} onChange={e => update(i,'key',e.target.value)} />
              </div>
              <div style={{ flex:2 }}>
                <label style={s.label}>Value</label>
                <input style={s.input} placeholder="Value" value={f.value} onChange={e => update(i,'value',e.target.value)} />
              </div>
              <button type="button" style={s.btn('red')} onClick={() => setFields(p => p.filter((_,j) => j !== i))}>✕</button>
            </div>
          ))}
          <button type="button" style={s.btn('blue')} onClick={() => setFields(p => [...p, {key:'',value:''}])}>➕ Add Attribute</button>
        </div>
      ) : (
        /* Predefined: show template fields */
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px 16px' }}>
          {template.map((t, i) => (
            <div key={t.key}>
              <label style={s.label}>{t.label}</label>
              <input style={s.input} placeholder={t.placeholder} value={fields[i]?.value || ''} onChange={e => update(i,'value',e.target.value)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductAttributesField;
