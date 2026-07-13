import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronRight, ChevronLeft, X, SkipForward } from 'lucide-react';

export default function TourGuiado({ steps, run, onFinish, onOpenMenu }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [spotlightStyle, setSpotlightStyle] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' });
  const tooltipRef = useRef(null);

  const step = steps[currentStep];
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const positionElements = useCallback(() => {
    if (!step) return;
    const target = document.querySelector(step.target);

    if (!target || target.offsetParent === null) {
      // Target not visible — open sidebar on mobile and retry
      if (isMobile && onOpenMenu) {
        onOpenMenu(true);
        // Retry after sidebar animation
        setTimeout(() => {
          const retryTarget = document.querySelector(step.target);
          if (retryTarget && retryTarget.offsetParent !== null) {
            placeElements(retryTarget);
          } else {
            centerTooltip();
          }
        }, 350);
        return;
      }
      centerTooltip();
      return;
    }

    placeElements(target);
  }, [step, isMobile, onOpenMenu]);

  const centerTooltip = () => {
    setSpotlightStyle(null);
    const w = Math.min(300, window.innerWidth - 32);
    setTooltipPos({
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: w,
    });
  };

  const placeElements = (target) => {
    const rect = target.getBoundingClientRect();
    const pad = 6;

    setSpotlightStyle({
      top: rect.top - pad,
      left: rect.left - pad,
      width: rect.width + pad * 2,
      height: rect.height + pad * 2,
    });

    const mobile = window.innerWidth < 768;
    const tooltipW = mobile ? Math.min(280, window.innerWidth - 32) : 310;
    const tooltipH = 170;

    const spaceRight = window.innerWidth - rect.right;
    const spaceLeft = rect.left;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    let style = { position: 'fixed', width: tooltipW };

    if (!mobile && spaceRight > tooltipW + 20) {
      style.left = rect.right + 12;
      style.top = Math.max(12, Math.min(rect.top, window.innerHeight - tooltipH - 12));
    } else if (!mobile && spaceLeft > tooltipW + 20) {
      style.left = rect.left - tooltipW - 12;
      style.top = Math.max(12, Math.min(rect.top, window.innerHeight - tooltipH - 12));
    } else if (spaceBelow > tooltipH + 20) {
      style.top = rect.bottom + 12;
      style.left = Math.max(16, Math.min(rect.left + rect.width / 2 - tooltipW / 2, window.innerWidth - tooltipW - 16));
    } else if (spaceAbove > tooltipH + 20) {
      style.top = rect.top - tooltipH - 12;
      style.left = Math.max(16, Math.min(rect.left + rect.width / 2 - tooltipW / 2, window.innerWidth - tooltipW - 16));
    } else {
      // Fallback: place below the sidebar item but ensure visibility
      style.top = Math.min(rect.bottom + 8, window.innerHeight - tooltipH - 16);
      style.left = Math.max(16, Math.min(rect.right + 8, window.innerWidth - tooltipW - 16));
    }

    setTooltipPos(style);
  };

  useEffect(() => {
    if (run) {
      setCurrentStep(0);
      // On mobile, open sidebar when tour starts
      if (isMobile && onOpenMenu) {
        onOpenMenu(true);
      }
    }
  }, [run]);

  useEffect(() => {
    if (!run || !step) return;

    const timer = setTimeout(positionElements, isMobile ? 400 : 80);
    const handleResize = () => positionElements();
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [run, currentStep, step, positionElements]);

  if (!run || !step || steps.length === 0) return null;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(s => s + 1);
      if (isMobile && onOpenMenu) onOpenMenu(true);
    } else {
      if (isMobile && onOpenMenu) onOpenMenu(false);
      onFinish();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(s => s - 1);
      if (isMobile && onOpenMenu) onOpenMenu(true);
    }
  };

  const handleClose = () => {
    if (isMobile && onOpenMenu) onOpenMenu(false);
    onFinish();
  };

  const isLast = currentStep === steps.length - 1;
  const isFirst = currentStep === 0;
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="fixed inset-0 z-[10000]">
      {/* Overlay */}
      {spotlightStyle ? (
        <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
          <defs>
            <mask id="tour-spotlight-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              <rect
                x={spotlightStyle.left}
                y={spotlightStyle.top}
                width={spotlightStyle.width}
                height={spotlightStyle.height}
                rx="10" ry="10"
                fill="black"
              />
            </mask>
          </defs>
          <rect
            x="0" y="0" width="100%" height="100%"
            fill="rgba(15, 23, 42, 0.55)"
            mask="url(#tour-spotlight-mask)"
            style={{ pointerEvents: 'auto' }}
          />
        </svg>
      ) : (
        <div className="absolute inset-0 bg-slate-900/55" />
      )}

      {/* Spotlight border */}
      {spotlightStyle && (
        <div
          className="fixed rounded-xl border-2 border-valle-gold/50 transition-all duration-300 ease-out pointer-events-none"
          style={{
            top: spotlightStyle.top,
            left: spotlightStyle.left,
            width: spotlightStyle.width,
            height: spotlightStyle.height,
          }}
        />
      )}

      {/* Tooltip */}
      <div ref={tooltipRef} className="animate-fade-in-up" style={{ ...tooltipPos, zIndex: 10001 }}>
        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 16px 40px -8px rgba(0,0,0,0.25)' }}>
          {/* Header */}
          <div className="bg-valle-green px-4 py-2.5 flex items-center justify-between">
            <span className="text-white font-bold text-xs tracking-wide">
              Paso {currentStep + 1} de {steps.length}
            </span>
            <button
              onClick={handleClose}
              className="text-white/50 hover:text-white transition p-0.5 rounded cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>

          {/* Progress bar */}
          <div className="h-[3px] bg-slate-100">
            <div
              className="h-full bg-valle-gold transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Content */}
          <div className="px-4 py-3.5">
            <p className="text-slate-600 text-[13px] leading-relaxed">
              {step.content}
            </p>
          </div>

          {/* Actions */}
          <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={handleClose}
              className="text-slate-400 hover:text-slate-600 text-[11px] font-medium transition flex items-center gap-1 cursor-pointer"
            >
              <SkipForward size={11} />
              Saltar
            </button>

            <div className="flex items-center gap-1.5">
              {!isFirst && (
                <button
                  onClick={handleBack}
                  className="flex items-center gap-0.5 px-3 py-1.5 text-valle-green font-semibold text-[12px] rounded-lg hover:bg-valle-green/10 transition cursor-pointer"
                >
                  <ChevronLeft size={13} />
                  Atrás
                </button>
              )}
              <button
                onClick={handleNext}
                className="flex items-center gap-0.5 px-4 py-1.5 bg-valle-green text-white font-semibold text-[12px] rounded-lg hover:bg-valle-green-dark transition cursor-pointer"
              >
                {isLast ? 'Finalizar' : 'Siguiente'}
                {!isLast && <ChevronRight size={13} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
