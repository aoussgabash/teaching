(() => {
  'use strict';

  const root = document.getElementById('summary-root');
  const backLink = document.getElementById('back-link');
  const params = new URLSearchParams(location.search);
  const type = params.get('type') === 'lab' ? 'lab' : 'lecture';
  const number = String(Math.max(1, Math.min(12, Number(params.get('number') || 1)))).padStart(2, '0');
  const sourcePath = `../power-programming-2-${type}${number}.html`;
  const sourceUrl = new URL(sourcePath, location.href).href;
  const kindEn = type === 'lecture' ? 'Lecture' : 'Laboratory';
  const kindAr = type === 'lecture' ? 'المحاضرة' : 'المختبر';

  if (backLink) backLink.href = sourcePath;

  const references = [
    'A. Gabash, <em>Flexible Optimal Operations of Energy Supply Networks with Renewable Energy Generation and Battery Storage</em>. Saarbrücken, Germany: Südwestdeutscher Verlag für Hochschulschriften, 2014.',
    'S. J. Russell and P. Norvig, <em>Artificial Intelligence: A Modern Approach</em>, 4th Global ed. Harlow, U.K.: Pearson Education Limited, 2022.',
    'A. Gabash, “Energy Market Transition and Climate Change: A Review of TSOs–DSOs C+++ Framework from 1800 to Present,” <em>Energies</em>, vol. 16, no. 17, Art. no. 6139, 2023, doi: 10.3390/en16176139.',
    'S. J. D. Prince, <em>Understanding Deep Learning</em>. Cambridge, MA, USA: The MIT Press, 2023.',
    'A. Gabash, <em>AI Applications in Electrical Power Systems</em>, Version 1.0, 2026. [Online]. Available: https://aoussgabash.com'
  ];

  const clean = value => (value || '').replace(/\s+/g, ' ').trim();
  const text = node => clean(node?.textContent);
  const html = node => node?.innerHTML || '';
  const stripNumber = value => clean(value).replace(/^\d+[.)-]?\s*/, '').replace(/^[^\p{L}\p{N}]+/u, '');
  const pageNo = n => `<span class="page-no">${n}</span>`;
  const sectionTitle = (en, ar) => `<div class="section-title"><h2>${en}</h2><div class="ar" lang="ar" dir="rtl">${ar}</div></div>`;

  function pair(section) {
    if (!section) return {en:null,ar:null};
    const en = section.cloneNode(true);
    en.querySelectorAll('.arbox').forEach(node => node.remove());
    const ar = document.createElement('div');
    const headingEl = section.querySelector('h1,h2,h3,h4');
    if (headingEl) {
      const h = document.createElement(headingEl.tagName.toLowerCase());
      h.textContent = headingEl.textContent;
      ar.appendChild(h);
    }
    section.querySelectorAll('.arbox').forEach(node => ar.appendChild(node.cloneNode(true)));
    section.querySelectorAll('table').forEach(node => ar.appendChild(node.cloneNode(true)));
    section.querySelectorAll('pre,.eq').forEach(node => ar.appendChild(node.cloneNode(true)));
    return {en,ar};
  }

  function heading(section, language) {
    if (!section) return '';
    const raw = text(section.querySelector('h1,h2,h3,h4'));
    if (!raw) return '';
    const parts = raw.split('|');
    if (language === 'ar') return (parts[1] || parts[0]).trim();
    return (parts[0] || raw).trim();
  }

  
