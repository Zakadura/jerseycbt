export function observeAndLoad(el: HTMLElement, load: () => void) {
  if (!('IntersectionObserver' in window)) { load(); return; }
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        io.disconnect();
        load();
        return;
      }
    }
  }, { rootMargin: '200px' });
  io.observe(el);
}
