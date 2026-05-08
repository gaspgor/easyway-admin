import React, { useEffect, useState } from 'react';
import { ApiClient } from 'adminjs';

interface Props {
  record: any;
  property: any;
  onChange?: (name: string, value: any) => void;
}

const ReadonlyPartnerField: React.FC<Props> = ({ record, property, onChange }) => {
  const partnerId: string = record?.params?.[property.name] || '';
  const [label, setLabel] = useState<string>(partnerId ? 'Loading…' : '—');

  // Commit value into form state so it's included on submit
  useEffect(() => {
    if (partnerId && onChange) {
      onChange(property.name, partnerId);
    }
  }, [partnerId]);

  // Fetch partner name for human-readable display
  useEffect(() => {
    if (!partnerId) { setLabel('No partner context — please open this from a Partner record'); return; }
    const api = new ApiClient();
    api
      .recordAction({ resourceId: 'Partner', recordId: partnerId, actionName: 'show' })
      .then(({ data }: any) => {
        const name = data?.record?.params?.companyName;
        setLabel(name ? `🏢 ${name}` : `ID: ${partnerId}`);
      })
      .catch(() => setLabel(`ID: ${partnerId}`));
  }, [partnerId]);

  return (
    <div style={{ marginBottom: 24 }}>
      <label style={{ display: 'block', fontWeight: 600, fontSize: 12, color: '#606f89', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {property.label}
      </label>
      <div
        style={{
          padding: '8px 14px',
          background: '#f4f5f7',
          border: '1px solid #d0d4dc',
          borderRadius: 4,
          color: '#374151',
          fontSize: 14,
          cursor: 'not-allowed',
          userSelect: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span style={{ flex: 1 }}>{label}</span>
        <span style={{ fontSize: 11, color: '#9ca3af', fontStyle: 'italic' }}>auto-set</span>
      </div>
      {property.description && (
        <p style={{ margin: '4px 0 0', fontSize: 12, color: '#9ca3af' }}>{property.description}</p>
      )}
    </div>
  );
};

export default ReadonlyPartnerField;
