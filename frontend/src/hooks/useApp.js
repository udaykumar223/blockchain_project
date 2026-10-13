import { useState, useCallback } from 'react';
import { checkHealth } from '../services/api';

/**
 * Custom hook: toast notifications
 */
export function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((type, title, message) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}

/**
 * Custom hook: blockchain connection status
 */
export function useBlockchainStatus() {
  const [status, setStatus] = useState('checking');
  const [contractAddress, setContractAddress] = useState('');

  const check = useCallback(async () => {
    try {
      const res = await checkHealth();
      setStatus(res.blockchain === 'connected' ? 'connected' : 'disconnected');
      if (res.contractAddress) setContractAddress(res.contractAddress);
    } catch {
      setStatus('disconnected');
    }
  }, []);

  return { status, contractAddress, check };
}
