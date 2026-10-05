import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, WifiOff, CheckCircle2, RefreshCw } from 'lucide-react';
import { C } from '../ui';

export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-white/5 ${className || ''}`}
      style={{
        backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0) 0, rgba(255,255,255,0.02) 20%, rgba(255,255,255,0.05) 60%, rgba(255,255,255,0))',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
        ...style
      }}
    />
  );
}

export function ErrorState({ title = 'Something went wrong', message, onRetry }: { title?: string, message: string, onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center rounded-xl border" style={{ borderColor: `${C.danger}30`, background: `${C.danger}05` }}>
      <div className="mb-3 p-3 rounded-full" style={{ background: `${C.danger}15`, color: C.danger }}>
        <AlertTriangle size={24} />
      </div>
      <h3 className="text-sm font-semibold mb-1" style={{ color: C.danger }}>{title}</h3>
      <p className="text-xs mb-4 max-w-xs" style={{ color: C.text3 }}>{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-colors"
          style={{ background: `${C.danger}20`, color: C.danger }}
        >
          <RefreshCw size={14} /> Retry
        </button>
      )}
    </div>
  );
}

export function OfflineBanner({ synced }: { synced?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-2 px-4 text-xs font-medium sticky top-0 z-50 w-full" style={{ background: C.warning, color: '#000' }}>
      <WifiOff size={14} />
      <span>You are currently offline. {synced ? `Last synced: ${synced}` : 'Changes will sync when reconnected.'}</span>
    </div>
  );
}

export function Toast({ title, message, type = 'info' }: { title: string, message?: string, type?: 'success' | 'error' | 'info' }) {
  const bg = type === 'success' ? C.success : type === 'error' ? C.danger : C.info;
  const icon = type === 'success' ? <CheckCircle2 size={18} /> : type === 'error' ? <AlertTriangle size={18} /> : <RefreshCw size={18} />;
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      className="fixed bottom-4 right-4 z-50 flex items-start gap-3 p-4 rounded-xl shadow-lg border"
      style={{ background: C.card2, borderColor: C.borderMd, width: 300 }}
    >
      <div style={{ color: bg }} className="mt-0.5">{icon}</div>
      <div className="flex-1">
        <h4 className="text-sm font-semibold mb-0.5" style={{ color: C.text }}>{title}</h4>
        {message && <p className="text-xs" style={{ color: C.text2 }}>{message}</p>}
      </div>
    </motion.div>
  );
}