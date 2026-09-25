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
    if (!section) return {en:null,ar:null}; const en = section.querySelector('.en') || section; const ar = section.querySelector('.ar,.arbox') || null; return {en, ar};
  }

  function heading(section, language = 'en') {
    return stripNumber(text(pair(section)[language]?.querySelector('h2,h3')));
  }

  function findSection(sections, terms) {
    return sections.find(section => {
      const value = `${heading(section, 'en')} ${heading(section, 'ar')}`.toLowerCase();
      return terms.some(term => value.includes(term.toLowerCase()));
    }) || null;
  }

  function uniqueSections(items) {
    return items.filter((item, index) => item && items.indexOf(item) === index);
  }

  function paragraphs(container, limit = 2) {
    const direct = [...(container?.querySelectorAll(':scope > p') || [])];
    const all = direct.length ? direct : [...(container?.querySelectorAll('p') || [])];
    return all.slice(0, limit).map(p => `<p>${p.innerHTML}</p>`).join('');
  }

  function list(container, limit = 6, ordered = false) {
    const items = [...(container?.querySelectorAll('li') || [])].slice(0, limit);
    if (!items.length) return '';
    const tag = ordered ? 'ol' : 'ul';
    return `<${tag}>${items.map(item => `<li>${item.innerHTML}</li>`).join('')}</${tag}>`;
  }

  function callout(container) {
    const item = container?.querySelector('.highlight,.callout,.note,.result');
    return item ? `<div class="callout">${item.innerHTML}</div>` : '';
  }

  function scientificMedia(container, limit = 3) {
    if (!container) return '';
    const selector = [
      '.math-block','.equation','.formula','.formula-box','math','mjx-container',
      'figure','table','svg','img:not(.icon):not(.logo)'
    ].join(',');
    const nodes = [...container.querySelectorAll(selector)].filter(node => {
      return !node.parentElement?.closest(selector) || node.parentElement?.closest(selector) === node;
    }).slice(0, limit);

    return nodes.map(original => {
      const clone = original.cloneNode(true);
      clone.querySelectorAll?.('img[src],source[src],video[src]').forEach(media => {
        const src = media.getAttribute('src');
        if (src) media.setAttribute('src', new URL(src, sourceUrl).href);
      });
      clone.querySelectorAll?.('a[href]').forEach(link => {
        const href = link.getAttribute('href');
        if (href && !href.startsWith('#') && !href.startsWith('javascript:')) link.setAttribute('href', new URL(href, sourceUrl).href);
      });
      if (clone.matches?.('img')) {
        const alt = clone.getAttribute('alt') || '';
        return `<figure>${clone.outerHTML}${alt ? `<figcaption>${alt}</figcaption>` : ''}</figure>`;
      }
      if (clone.matches?.('svg')) return `<figure>${clone.outerHTML}</figure>`;
      if (clone.matches?.('table')) return `<div class="table-wrap">${clone.outerHTML}</div>`;
      if (clone.matches?.('math,mjx-container')) return `<div class="math-block">${clone.outerHTML}</div>`;
      return clone.outerHTML;
    }).join('');
  }

  function cards(container, isArabic = false, limit = 6) {
    const nodes = [...(container?.querySelectorAll('.mini-card,.pair,.card,.step,.feature,.application-card') || [])].slice(0, limit);
    if (nodes.length) {
      return nodes.map(node => {
        const title = node.querySelector('strong,.tag,h3,h4');
        const body = node.querySelector('p');
        return `<div class="concept${isArabic ? ' ar' : ''}"><strong>${html(title) || stripNumber(text(node)).slice(0, 80)}</strong>${body ? `<span>${body.innerHTML}</span>` : ''}</div>`;
      }).join('');
    }
    const items = [...(container?.querySelectorAll('li') || [])].slice(0, limit);
    return items.map(item => `<div class="concept${isArabic ? ' ar' : ''}"><span>${item.innerHTML}</span></div>`).join('');
  }

  function panel(section, language, fallbackTitle, options = {}) {
    const container = pair(section)[language];
    const isArabic = language === 'ar';
    const title = heading(section, language) || fallbackTitle;
    const body = [
      paragraphs(container, options.paragraphs ?? 2),
      list(container, options.items ?? 5, options.ordered),
      callout(container),
      scientificMedia(container, options.media ?? 2)
    ].join('');
    return `<div class="panel${isArabic ? ' ar' : ''}"${isArabic ? ' lang="ar" dir="rtl"' : ''}><h3>${title}</h3>${body || `<p>${isArabic ? 'راجع صفحة الموقع الكاملة لهذا القسم.' : 'See the complete website page for this section.'}</p>`}</div>`;
  }

  function renderError(message) {
    root.innerHTML = `<section class="page" style="display:grid;place-items:center;text-align:center"><div><h1>Summary unavailable</h1><p>${message}</p><p class="rtl">تعذر إنشاء الملخص من صفحة المصدر.</p><p><a href="${sourcePath}">Open source page | فتح صفحة المصدر</a></p></div></section>`;
  }

  async function build() {
    try {
      const response = await fetch(sourcePath, {cache: 'no-store'});
      if (!response.ok) throw new Error(`Source page returned ${response.status}`);
      const sourceText = await response.text();
      const doc = new DOMParser().parseFromString(sourceText, 'text/html');
      const hero = doc.querySelector('.hero');
      const titleEn = text(hero?.querySelector('h1')) || `${kindEn} ${number}`;
      const titleAr = text(hero?.querySelector('.hero-ar,.ar')) || `${kindAr} ${number}`;
      const subtitle = html(hero?.querySelector('.subtitle')) || 'Programming in Electrical Power II<br>البرمجة في الطاقة 2';
      const allSections = [...doc.querySelectorAll('main > section, main .box')].filter(section => section.querySelector('.en,.ar,.arbox') || section.matches('.box'));
      if (!allSections.length) throw new Error('No bilingual course sections were found');

      const objectives = findSection(allSections, ['learning objectives','learning outcomes','objectives','أهداف التعلم','مخرجات التعلم']) || allSections[0];
      const review = findSection(allSections, ['review questions','questions','أسئلة المراجعة','تمارين']);
      const summary = findSection(allSections, ['summary','conclusion','key takeaways','الخلاصة','أهم النقاط']);
      const example = findSection(allSections, ['worked example','example','case study','مثال','حالة دراسية']);
      const challenges = findSection(allSections, ['challenge','limitation','safety','التحديات','القيود','السلامة']);
      const applications = findSection(allSections, ['application','power system','workflow','results','تطبيقات','نظام الطاقة','سير العمل','النتائج']);

      const contentSections = allSections.filter(section => ![objectives, review, summary].includes(section));
      const foundations = uniqueSections(contentSections.slice(0, 2));
      const core = uniqueSections(contentSections.slice(2, 6));
      const practice = uniqueSections([example, applications, challenges, ...contentSections.slice(6)]).slice(0, 3);

      document.title = `${kindEn} ${number} Summary - ${titleEn}`;

      let page = 1;
      const pages = [];
      pages.push(`
        <section class="page cover">
          <div>
            <div class="brand"><span>Power</span> Programming</div>
            <div class="kicker">${kindEn} Summary | ملخص ${kindAr}</div>
            <h1>${titleEn}</h1>
            <div class="ar-title" lang="ar" dir="rtl">${titleAr}</div>
            <div class="subtitle">${subtitle || 'Programming in Electrical Power II<br>البرمجة في الطاقة 2'}</div>
            <div class="meta-grid">
              <div class="meta"><small>Document | الوثيقة</small><strong>${kindEn} ${number} Summary</strong></div>
              <div class="meta"><small>Source | المصدر</small><strong>Interactive course website</strong></div>
              <div class="meta"><small>Language | اللغة</small><strong>English & Arabic</strong></div>
              <div class="meta"><small>Version | الإصدار</small><strong>1.0 · 2026</strong></div>
            </div>
          </div>
          <div class="cover-footer">
            <div><div>Prepared by | إعداد</div><div class="author">Dr.-Ing. Aouss Gabash</div></div>
            <div style="text-align:right"><div>Full interactive content</div><a href="${sourceUrl}">${sourceUrl}</a></div>
          </div>${pageNo(page++)}
        </section>`);

      const objectivesPair = pair(objectives);
      pages.push(`
        <section class="page">
          ${sectionTitle('Learning Outcomes and Foundations','مخرجات التعلم والأسس')}
          <div class="bilingual">
            <div class="panel"><h3>Learning Outcomes</h3>${list(objectivesPair.en, 7)}</div>
            <div class="panel ar" lang="ar" dir="rtl"><h3>مخرجات التعلم</h3>${list(objectivesPair.ar, 7)}</div>
          </div>
          ${foundations.map(section => `<div style="height:14px"></div><div class="bilingual">${panel(section,'en','Foundation')}${panel(section,'ar','الأساس')}</div>`).join('')}
          ${pageNo(page++)}
        </section>`);

      if (core.length) {
        pages.push(`
          <section class="page">
            ${sectionTitle('Key Concepts and Methods','المفاهيم والطرائق الأساسية')}
            ${core.map(section => {
              const p = pair(section);
              const cardContent = `${cards(p.en,false,4)}${cards(p.ar,true,4)}`;
              return `<div style="margin-bottom:16px"><div class="bilingual">${panel(section,'en','Key Concept',{paragraphs:1,items:4,media:2})}${panel(section,'ar','مفهوم أساسي',{paragraphs:1,items:4,media:2})}</div>${cardContent ? `<div class="concept-grid" style="margin-top:10px">${cardContent}</div>` : ''}</div>`;
            }).join('')}
            ${pageNo(page++)}
          </section>`);
      }

      if (practice.length) {
        pages.push(`
          <section class="page">
            ${sectionTitle(type === 'lab' ? 'Laboratory Workflow and Results' : 'Applications and Worked Example',type === 'lab' ? 'سير عمل المختبر والنتائج' : 'التطبيقات والمثال المحلول')}
            ${practice.map(section => `<div style="margin-bottom:16px" class="example"><div class="bilingual">${panel(section,'en',type === 'lab' ? 'Laboratory Step' : 'Application',{paragraphs:3,items:6,media:3})}${panel(section,'ar',type === 'lab' ? 'خطوة مخبرية' : 'تطبيق',{paragraphs:3,items:6,media:3})}</div></div>`).join('')}
            ${pageNo(page++)}
          </section>`);
      }

      const summaryPair = pair(summary || contentSections.at(-1));
      const reviewPair = pair(review);
      pages.push(`
        <section class="page">
          ${sectionTitle('Key Takeaways and Review','أهم النقاط والمراجعة')}
          <div class="takeaways">
            <div class="takeaway"><h3>Key Takeaways</h3>${list(summaryPair.en,7) || paragraphs(summaryPair.en,3)}</div>
            <div class="takeaway ar" lang="ar" dir="rtl"><h3>أهم النقاط</h3>${list(summaryPair.ar,7) || paragraphs(summaryPair.ar,3)}</div>
          </div>
          <div style="height:16px"></div>
          <div class="bilingual">
            <div class="panel"><h3>Review Questions</h3>${list(reviewPair.en,8,true) || '<p>Review the objectives and explain the main concepts in your own words.</p>'}</div>
            <div class="panel ar" lang="ar" dir="rtl"><h3>أسئلة المراجعة</h3>${list(reviewPair.ar,8,true) || '<p>راجع الأهداف واشرح المفاهيم الرئيسة بأسلوبك الخاص.</p>'}</div>
          </div>${pageNo(page++)}
        </section>`);

      pages.push(`
        <section class="page">
          ${sectionTitle('References','المراجع')}
          <ol class="references">${references.map(ref => `<li>${ref}</li>`).join('')}</ol>
          <div style="height:20px"></div>
          <div class="online">
            <h2>Continue Learning Online</h2><h2 class="ar" lang="ar" dir="rtl">تابع التعلم عبر الموقع</h2>
            <p>The website is the complete, current, and interactive academic reference.</p>
            <p class="ar" lang="ar" dir="rtl">الموقع هو المرجع الأكاديمي الكامل والمحدّث والتفاعلي.</p>
            <p><a href="${sourceUrl}">${sourceUrl}</a></p>
          </div>
          <p class="source-note">This summary is generated directly from the corresponding course page. Update the source page first so the summary remains synchronized. | يُولّد هذا الملخص مباشرةً من صفحة المقرر المقابلة، لذلك يجب تحديث صفحة المصدر أولًا ليبقى الملخص متزامنًا.</p>
          ${pageNo(page++)}
        </section>`);

      root.innerHTML = pages.join('');
    } catch (error) {
      console.error(error);
      renderError(error.message);
    }
  }

  build();
})();
