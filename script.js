const menu = document.querySelector('#mobile-menu');
const toggle = document.querySelector('.menu-toggle');

function closeMenu() { menu.close(); }
toggle.addEventListener('click', () => {
  menu.showModal();
  toggle.setAttribute('aria-expanded', 'true');
  document.body.classList.add('menu-open');
});
document.querySelector('.menu-close').addEventListener('click', closeMenu);
menu.addEventListener('close', () => {
  toggle.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('menu-open');
  toggle.focus();
});
menu.querySelector('a[href$="#top"]').addEventListener('click', closeMenu);
matchMedia('(min-width: 768px)').addEventListener('change', event => {
  if (event.matches && menu.open) closeMenu();
});
