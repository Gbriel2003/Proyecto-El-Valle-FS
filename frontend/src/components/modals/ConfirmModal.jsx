import { AlertTriangle, AlertCircle, Info, CheckCircle, X } from 'lucide-react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Aceptar',
  cancelText = 'Cancelar',
  variant = 'danger' // 'danger', 'warning', 'info', 'success'
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const config = {
    danger: {
      Icon: AlertTriangle,
      color: 'text-red-600',
      bgIcon: 'bg-red-100',
      btnConfirm: 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20',
      border: 'border-red-500'
    },
    warning: {
      Icon: AlertCircle,
      color: 'text-orange-500',
      bgIcon: 'bg-orange-100',
      btnConfirm: 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20',
      border: 'border-orange-500'
    },
    info: {
      Icon: Info,
      color: 'text-valle-green',
      bgIcon: 'bg-valle-green/10',
      btnConfirm: 'bg-valle-green hover:bg-valle-green-dark text-white shadow-valle-green/20',
      border: 'border-valle-green'
    },
    success: {
      Icon: CheckCircle,
      color: 'text-valle-green',
      bgIcon: 'bg-valle-green/10',
      btnConfirm: 'bg-valle-green hover:bg-valle-green-dark text-valle-gold shadow-valle-green/20',
      border: 'border-valle-green'
    }
  };

  const { Icon, color, bgIcon, btnConfirm } = config[variant] || config.danger;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-scale-up border border-slate-200">
        
        {/* Encabezado con Ícono */}
        <div className="flex justify-between items-start p-6 pb-2">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${bgIcon}`}>
            <Icon size={24} className={color} />
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-xl transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 pt-2">
          <h3 className="text-xl font-black text-slate-800 mb-3">{title}</h3>
          
          <div className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed font-medium">
            {message}
          </div>
        </div>

        {/* Acciones */}
        <div className="p-6 pt-4 bg-slate-50/80 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 bg-white border border-slate-250 hover:bg-slate-50 hover:text-slate-800 transition shadow-xs cursor-pointer w-full sm:w-auto text-center"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition shadow-md w-full sm:w-auto text-center cursor-pointer flex items-center justify-center gap-2 ${btnConfirm}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
