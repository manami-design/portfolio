// Public endpoint, not a secret credential.
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/maeqlolo';

async function contactDeliveryAdapter(values) {
  const response = await fetch(FORMSPREE_ENDPOINT, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    credentials: 'omit',
    redirect: 'error',
    // Formspree uses email as the notification's Reply-To address.
    body: JSON.stringify(values),
  });
  const result = await response.json();
  if (!response.ok || result?.ok !== true) throw new Error('Acceptance not confirmed');
  return { ok: true };
}
const contactForm = document.querySelector('#contact-form');
const contactSubmit = document.querySelector('#contact-submit');
const formStatus = document.querySelector('#form-status');
const contactFields = [...contactForm.querySelectorAll('input, textarea')];
const fieldLabels = { name: 'お名前', email: 'メールアドレス', subject: '件名', message: 'お問い合わせ内容' };
let validationRequested = false;
let sending = false;
let completed = false;

function validateField(field) {
  let error = '';
  if (!field.value.trim()) {
    error = `${fieldLabels[field.name]}を入力してください。`;
  } else if (field.type === 'email' && field.validity.typeMismatch) {
    error = 'メールアドレスの形式を確認してください（例：info@example.com）。';
  }
  const errorElement = document.querySelector(`#${field.name}-error`);
  errorElement.textContent = error;
  errorElement.hidden = !error;
  field.setAttribute('aria-invalid', String(Boolean(error)));
  return !error;
}

async function checkContactInputs() {
  if (sending || completed) return;
  validationRequested = true;
  const invalidFields = contactFields.filter(field => !validateField(field));
  formStatus.classList.toggle('has-errors', invalidFields.length > 0);
  if (invalidFields.length) {
    formStatus.textContent = `${invalidFields.length}項目の入力内容を確認してください。`;
    invalidFields[0].focus();
    return;
  }
  sending = true;
  contactSubmit.disabled = true;
  contactForm.setAttribute('aria-busy', 'true');
  contactFields.forEach(field => { field.readOnly = true; });
  formStatus.textContent = '送信中です。しばらくお待ちください。';
  try {
    const values = Object.fromEntries(contactFields.map(field => [field.name, field.value]));
    const result = await contactDeliveryAdapter(values);
    if (result?.ok !== true) throw new Error('Delivery was not confirmed');
    contactForm.reset();
    validationRequested = false;
    contactFields.forEach(field => { field.removeAttribute('aria-invalid'); });
    completed = true;
    formStatus.textContent = 'お問い合わせを送信しました。\n内容を確認のうえ、折り返しご連絡いたします。';
  } catch {
    // Keep every value so the user can retry without re-entering the message.
    const heading = document.createElement('span');
    heading.className = 'delivery-error-heading';
    const icon = document.createElement('span');
    icon.className = 'delivery-error-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = '!';
    heading.append(icon, '送信できませんでした。');
    const detail = document.createElement('span');
    detail.className = 'delivery-error-detail';
    detail.textContent = 'お手数ですが、時間をおいて再度お試しください。';
    formStatus.replaceChildren(heading, detail);
  } finally {
    sending = false;
    contactForm.setAttribute('aria-busy', 'false');
    contactFields.forEach(field => { field.readOnly = false; });
    contactSubmit.disabled = completed;
  }
}

// Prevent navigation; every submission uses the same guarded asynchronous handler.
contactForm.addEventListener('submit', event => {
  event.preventDefault();
  checkContactInputs();
});
contactSubmit.addEventListener('click', checkContactInputs);
contactFields.forEach(field => {
  field.addEventListener('blur', () => {
    if (field.value || validationRequested) validateField(field);
  });
  field.addEventListener('input', () => {
    if (sending) return;
    completed = false;
    contactSubmit.disabled = false;
    formStatus.textContent = '';
    formStatus.classList.remove('has-errors');
    if (field.hasAttribute('aria-invalid')) validateField(field);
  });
});
// With JavaScript unavailable, HTML keeps the non-submitting button disabled.
contactSubmit.disabled = false;
