import React, { useState, useEffect, useRef, useCallback } from 'react';

export default function TutorialSpotlight({ step, steps, onNext, onPrev, onClose }) {
  const [targetRect, setTargetRect] = useState(null);
  const [cardPos, setCardPos] = useState({ top: 0, left: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [manualPos, setManualPos] = useState(null);
  const cardRef = useRef(null);

  const currentStep = steps[step];

  // --- renderBody: split on ** and wrap odd segments in <strong> ---
  function renderBody(text) {
    if (!text) return null;
    const parts = text.split('**');
    return parts.map((part, i) =>
      i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>
    );
  }

  // --- Target Detection ---
  useEffect(() => {
    let cancelled = false;
    let targetEl = null;

    const detect = () => {
      if (cancelled) return;

      // Find target element
      targetEl = null;
      if (currentStep.targetFn) {
        try { targetEl = currentStep.targetFn(); } catch (_) {}
      }
      if (!targetEl && currentStep.target) {
        targetEl = document.querySelector(currentStep.target);
      }

      if (targetEl) {
        targetEl.classList.add('spotlight-target', 'spotlight-pulse');

        // Scroll into view if below fold
        const rect = targetEl.getBoundingClientRect();
        if (rect.top < 0 || rect.bottom > window.innerHeight) {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Re-measure after scroll settles
          setTimeout(() => {
            if (!cancelled) {
              setTargetRect(targetEl.getBoundingClientRect());
            }
          }, 400);
        } else {
          setTargetRect(rect);
        }
      } else {
        setTargetRect(null);
      }
    };

    // 150ms delay for view transitions
    const timer = setTimeout(detect, 150);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (targetEl) {
        targetEl.classList.remove('spotlight-target', 'spotlight-pulse');
      }
    };
  }, [step, currentStep]);

  // --- Recalculate rect on scroll and resize ---
  useEffect(() => {
    const recalc = () => {
      let el = null;
      if (currentStep.targetFn) {
        try { el = currentStep.targetFn(); } catch (_) {}
      }
      if (!el && currentStep.target) {
        el = document.querySelector(currentStep.target);
      }
      if (el) {
        setTargetRect(el.getBoundingClientRect());
      }
    };

    window.addEventListener('scroll', recalc, true);
    window.addEventListener('resize', recalc);
    return () => {
      window.removeEventListener('scroll', recalc, true);
      window.removeEventListener('resize', recalc);
    };
  }, [step, currentStep]);

  // --- Reset manual drag position on step change ---
  useEffect(() => {
    setManualPos(null);
  }, [step]);

  // --- Auto-Positioning ---
  useEffect(() => {
    if (manualPos) {
      setCardPos(manualPos);
      return;
    }

    const cardW = 320;
    const cardH = cardRef.current ? cardRef.current.offsetHeight : 240;
    const margin = 16;
    const edge = 12;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    if (!targetRect) {
      // Center in viewport
      setCardPos({
        top: Math.max(edge, (vh - cardH) / 2),
        left: Math.max(edge, (vw - cardW) / 2),
      });
      return;
    }

    const preferred = currentStep.position || 'below';
    const attempts = [];

    // Build fallback order starting with preferred
    const order = [preferred];
    for (const dir of ['below', 'above', 'right', 'left']) {
      if (!order.includes(dir)) order.push(dir);
    }

    for (const dir of order) {
      let top, left;
      if (dir === 'below') {
        top = targetRect.bottom + margin;
        left = targetRect.left + targetRect.width / 2 - cardW / 2;
      } else if (dir === 'above') {
        top = targetRect.top - cardH - margin;
        left = targetRect.left + targetRect.width / 2 - cardW / 2;
      } else if (dir === 'right') {
        top = targetRect.top + targetRect.height / 2 - cardH / 2;
        left = targetRect.right + margin;
      } else if (dir === 'left') {
        top = targetRect.top + targetRect.height / 2 - cardH / 2;
        left = targetRect.left - cardW - margin;
      }

      // Clamp to viewport edges
      left = Math.max(edge, Math.min(left, vw - cardW - edge));
      top = Math.max(edge, Math.min(top, vh - cardH - edge));

      // Check if it fits without clipping
      const fits = top >= edge && top + cardH <= vh - edge && left >= edge && left + cardW <= vw - edge;
      attempts.push({ dir, top, left, fits });
      if (fits) break;
    }

    const best = attempts.find(a => a.fits) || attempts[0];
    setCardPos({ top: best.top, left: best.left, direction: best.dir });
  }, [targetRect, manualPos, step, currentStep]);

  // --- Click-Through Advance ---
  useEffect(() => {
    if (!currentStep.advanceOnClick) return;

    let el = null;
    const findAndAttach = () => {
      if (currentStep.targetFn) {
        try { el = currentStep.targetFn(); } catch (_) {}
      }
      if (!el && currentStep.target) {
        el = document.querySelector(currentStep.target);
      }
      if (el) {
        const handler = () => {
          setTimeout(onNext, 150);
        };
        el.addEventListener('click', handler, { once: true });
        return handler;
      }
      return null;
    };

    // Delay to match target detection timing
    let handler = null;
    const timer = setTimeout(() => {
      handler = findAndAttach();
    }, 200);

    return () => {
      clearTimeout(timer);
      if (el && handler) {
        el.removeEventListener('click', handler);
      }
    };
  }, [step, currentStep, onNext]);

  // --- Escape Key ---
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // --- Draggable Card (desktop only) ---
  const onMouseDown = useCallback((e) => {
    if (window.innerWidth <= 640) return;
    // Don't drag from buttons
    if (e.target.tagName === 'BUTTON') return;
    e.preventDefault();
    const cardEl = cardRef.current;
    if (!cardEl) return;
    const rect = cardEl.getBoundingClientRect();
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const onMove = (e) => {
      setManualPos({
        top: e.clientY - dragOffset.y,
        left: e.clientX - dragOffset.x,
      });
    };
    const onUp = () => setIsDragging(false);

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isDragging, dragOffset]);

  // --- Render ---
  const direction = cardPos.direction || currentStep.position || 'below';

  return (
    <>
      {/* Backdrop — blocks clicks behind spotlight */}
      <div className="spotlight-backdrop" />

      {/* Spotlight highlight over target */}
      {targetRect && (
        <div
          className="spotlight-highlight"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
          }}
        />
      )}

      {/* Floating card */}
      <div
        className="tutorial-card"
        ref={cardRef}
        data-direction={direction}
        style={{ top: cardPos.top, left: cardPos.left }}
        onMouseDown={onMouseDown}
      >
        <button className="tutorial-card-close" onClick={onClose}>&#10005;</button>
        <div className="tutorial-card-step">Step {step + 1} of {steps.length}</div>
        <div className="tutorial-card-title">{currentStep.title}</div>
        <div className="tutorial-card-body">{renderBody(currentStep.body)}</div>
        {currentStep.action && (
          <div className="tutorial-card-action">{currentStep.action}</div>
        )}
        <div className="tutorial-card-nav">
          {step > 0 && (
            <button className="btn-outline" onClick={onPrev}>&#8592; Back</button>
          )}
          {step < steps.length - 1 ? (
            <button className="btn-primary" onClick={onNext}>Next &#8594;</button>
          ) : (
            <button className="btn-primary" onClick={onClose}>Finish</button>
          )}
        </div>
        <div className="tutorial-progress">
          <div
            className="tutorial-progress-fill"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </>
  );
}
