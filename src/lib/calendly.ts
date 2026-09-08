type CalendlyAPI = {
  initPopupWidget(options: { url: string }): void;
  initInlineWidget(options: { url: string; parentElement: HTMLElement }): void;
};
declare global { interface Window { Calendly?: CalendlyAPI } }
let inFlight: Promise<CalendlyAPI> | undefined;

export function loadCalendly(): Promise<CalendlyAPI> {
  if (window.Calendly && document.querySelector<HTMLLinkElement>('[data-calendly-style]')?.dataset.ready === 'true') return Promise.resolve(window.Calendly);
  if (inFlight) return inFlight;
  inFlight = new Promise<CalendlyAPI>((resolve, reject) => {
    const style = document.querySelector<HTMLLinkElement>('[data-calendly-style]') ?? document.createElement('link');
    style.rel = 'stylesheet';
    style.href = 'https://assets.calendly.com/assets/external/widget.css';
    style.dataset.calendlyStyle = '';
    const script = document.createElement('script');
    script.src = 'https://assets.calendly.com/assets/external/widget.js';
    script.async = true;
    const cleanup = () => { window.clearTimeout(timer); script.onload = null; script.onerror = null; style.onload = null; style.onerror = null; };
    const fail = () => { cleanup(); script.remove(); if (style.dataset.ready !== 'true') style.remove(); reject(new Error('Booking service unavailable')); };
    const timer = window.setTimeout(fail, 10000);
    const finish = () => { if (window.Calendly && style.dataset.ready === 'true') { cleanup(); resolve(window.Calendly); } };
    script.onload = () => { if (!window.Calendly) return fail(); finish(); };
    script.onerror = fail;
    style.onload = () => { style.dataset.ready = 'true'; finish(); };
    style.onerror = fail;
    if (!style.isConnected) document.head.append(style);
    if (!window.Calendly) document.head.append(script);
    finish();
  }).catch(error => { inFlight = undefined; throw error; });
  return inFlight;
}
