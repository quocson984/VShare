'use client';

import { useEffect } from 'react';

export default function InitApp() {
  useEffect(() => {
    // Call init API to update booking statuses
    fetch('/api/init-db', { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          console.log('App initialized successfully');
        }
      })
      .catch(err => {
        console.error('Failed to initialize app:', err);
      });
  }, []);

  return null;
}
