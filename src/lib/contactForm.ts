type ProviderReply = { ok?: boolean; errors?: { field?: string; message?: string }[] };

export function enhanceForms() {
  document.querySelectorAll<HTMLFormElement>('form[data-enquiry-form]').forEach((form) => {
    if (form.dataset.enhanced) return;
    const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    const status = form.querySelector<HTMLElement>('[data-form-status]');
    if (!submit || !status) return;
    form.dataset.enhanced = 'true';
    let pending = false;
    const clearErrors = () => {
      form.querySelectorAll('[data-field-error]').forEach(el => el.remove());
      form.querySelectorAll('[aria-invalid]').forEach(el => {
        el.removeAttribute('aria-invalid');
        const ids = (el.getAttribute('aria-describedby') || '').split(' ').filter(id => !id.startsWith('enquiry-error-'));
        if (ids.length) el.setAttribute('aria-describedby', ids.join(' '));
        else el.removeAttribute('aria-describedby');
      });
    };
    form.addEventListener('input', clearErrors);
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (pending || !form.reportValidity()) return;
      pending = true;
      clearErrors();
      const body = new FormData(form);
      const fingerprint = JSON.stringify([...body.entries()]);
      const label = submit.textContent;
      submit.disabled = true;
      submit.textContent = 'Sending…';
      form.setAttribute('aria-busy', 'true');
      status.textContent = 'Sending your message…';
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), 15000);
      const uncertain = 'We could not confirm whether your message was received. Your entries are still here. Please email hello@jerseycbt.com to check before sending again.';
      try {
        const response = await fetch(form.action, { method: 'POST', body, headers: { Accept: 'application/json' }, signal: controller.signal });
        const data: ProviderReply | null = await response.json().catch(() => null);
        if (response.ok && data?.ok === true) {
          const unchanged = JSON.stringify([...new FormData(form).entries()]) === fingerprint;
          if (unchanged) form.reset();
          status.textContent = form.dataset.enquiryForm === 'appointment'
            ? 'Your request was accepted. I’ll reply to arrange a time; your appointment is not yet confirmed.'
            : 'Your message was accepted. I’ll reply using the contact details you provided.';
          if (!unchanged) status.textContent += ' You edited the form while it was sending, so those newer entries have been kept.';
          status.focus();
        } else if (response.status >= 400 && response.status < 500) {
          let first: HTMLElement | undefined;
          if (Array.isArray(data?.errors)) data.errors.forEach((error, index) => {
            if (!error || typeof error.field !== 'string') return;
            const field = form.elements.namedItem(error.field);
            if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) || field.type === 'hidden' || field.name === '_gotcha') return;
            const detail = document.createElement('span');
            detail.id = `enquiry-error-${form.dataset.enquiryForm}-${index}`;
            detail.dataset.fieldError = '';
            detail.className = 'field-error';
            detail.textContent = typeof error.message === 'string' ? error.message : 'Please check this field.';
            // Keep the error as a description, separate from the field's label.
            (field.closest('label') ?? field).after(detail);
            field.setAttribute('aria-invalid', 'true');
            field.setAttribute('aria-describedby', `${field.getAttribute('aria-describedby') || ''} ${detail.id}`.trim());
            first ??= field;
          });
          status.textContent = first ? 'Your message could not be accepted. Please check the marked fields. Your entries have been kept.' : 'Your message could not be accepted. Your entries have been kept. Please email hello@jerseycbt.com for help.';
          (first ?? status).focus();
        } else {
          status.textContent = uncertain;
          status.focus();
        }
      } catch {
        status.textContent = uncertain;
        status.focus();
      } finally {
        window.clearTimeout(timer);
        pending = false;
        submit.disabled = false;
        submit.textContent = label;
        form.removeAttribute('aria-busy');
      }
    });
  });
}
