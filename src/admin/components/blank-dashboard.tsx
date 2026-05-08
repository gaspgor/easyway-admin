import React, { useEffect } from 'react';

const BlankDashboard = () => {
  useEffect(() => {
    window.location.href = '/admin/pages/Partners%20analytics';
  }, []);

  return <div>Redirecting to Partners analytics...</div>;
};

export default BlankDashboard;
