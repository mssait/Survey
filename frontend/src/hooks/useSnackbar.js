import { useState, useCallback } from 'react';

export function useSnackbar() {
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const showSuccess = useCallback((message) => {
    setSnackbar({ open: true, message, severity: 'success' });
  }, []);

  const showError = useCallback((message) => {
    setSnackbar({ open: true, message, severity: 'error' });
  }, []);

  const showInfo = useCallback((message) => {
    setSnackbar({ open: true, message, severity: 'info' });
  }, []);

  const hideSnackbar = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  return { snackbar, showSuccess, showError, showInfo, hideSnackbar };
}
