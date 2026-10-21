/* Shared PDF language controls. Include on every course part. */
(() => {
  'use strict';
  const arabic = /[\u0600-\u06ff]/;
  const arSelector = '[lang="ar"],.ar,.arbox,.rtl';
  let mode = 'bilingual';
  let printRoot;
  let originalTitle;
  const style = document.createElement('style');
  style.textContent = `
    #course-ar-print { display:none; }
    @media print {
      body.course-ar-printing > :not(#course-ar-print) { display:none!important; }
      body.course-ar-printing > #course-ar-print { display:block!important; }
      #course-ar-print { direction:rtl; text-align:right; color:#111; background:white; }
      #course-ar-print .pair,#course-ar-print .bilingual { display:block!important; }
      #course-ar-print .pair > *,#course-ar-print .bilingual > * { width:auto!important; border:0!important; padding-inline:0!important; }
      #course-ar-print pre,#course-ar-print code,#course-ar-print .formula,#course-ar-print .equation,
      #course-ar-print svg,#course-ar-print mjx-container { direction:ltr; unicode-bidi:isolate; }
      #course-ar-print pre { text-align:left; }
      #course-ar-print .actions,#course-ar-print button,#course-ar-print .no-print { display:none!important; }
      #course-ar-print .print-meta { display:block!important; }
      #course-ar-print .hero .ar { float:none!important; }
    }`;
  document.head.append(style);

  function arabicCopy(source) {
    const copy = source.cloneNode(true);
    copy.querySelectorAll('script').forEach(n => n.remove());
    // Remove only paired translations, keeping shared equations, code and figures.
    copy.querySelectorAll('.pair,.bilingual').forEach(pair => {
      const children = [...pair.children];
      if (!children.some(n => n.matches(arSelector))) return;
      children.filter(n => !n.matches(arSelector)).forEach(n => {
        if (n.matches('figure,svg,pre,table,.formula,.equation')) return;
        n.querySelectorAll('figure,pre,table,.formula,.equation').forEach(media => pair.append(media));
        n.remove();
      });
    });
    copy.querySelectorAll(arSelector).forEach(n => {
      const prev = n.previousElementSibling;
      if (prev && !arabic.test(prev.textContent) && prev.matches('p,h1,h2,h3,h4,[lang="en"]')) prev.remove();
    });
    copy.querySelectorAll('p').forEach(n => {
      if (arabic.test(n.textContent) || n.closest('#references,.references,.pdf-references') || /Reference:|DOI:/.test(n.textContent)) return;
      const siblings = [...n.parentElement.children];
      if (siblings.some(x => x !== n && x.matches(arSelector))) n.remove();
    });
    const labels = {'Ancient':'العصور القديمة','Temperature scale':'مقياس الحرارة','Steam governor':'منظم البخار','Coulomb’s law':'قانون كولوم','Galvani experiments':'تجارب غالفاني','Metric system':'النظام المتري','Voltaic pile':'بطارية فولتا','Current & magnetism':'التيار والمغناطيسية','Ohm’s law':'قانون أوم','Induction':'التحريض','Self-induction':'التحريض الذاتي','Gauss–Weber measurement':'قياسات غاوس وويبر','Dynamo-electric principle':'مبدأ الدينامو','Joule heating':'تسخين جول','Equivalent-network theorem':'نظرية الشبكة المكافئة','Kirchhoff’s laws':'قانونا كيرشوف','Absolute temperature scale':'مقياس الحرارة المطلقة','Electromagnetic field theory':'نظرية الحقل الكهرطيسي','Metre Convention':'اتفاقية المتر','Electric power systems':'أنظمة القدرة الكهربائية','Electron':'الإلكترون','EM waves':'الأمواج الكهرطيسية','Thévenin theorem':'نظرية ثيفنن','MKS → electrical units':'MKS ← الوحدات الكهربائية','Power factor':'معامل الاستطاعة','AC Network Analyzer':'محلل شبكات التيار المتناوب','Power-System Programming':'البرمجة في أنظمة القدرة','Birth of SI':'نشأة النظام الدولي','SI redefinition':'إعادة تعريف النظام الدولي'};
    copy.querySelectorAll('.year').forEach(n => {
      const walk = document.createTreeWalker(n,NodeFilter.SHOW_TEXT);
      let text;
      while ((text = walk.nextNode())) {
        const value = text.data.trim();
        if (labels[value]) text.data = labels[value];
        else if (/^\d{4}s$/.test(value)) text.data = 'عقد ' + value.slice(0,4);
      }
    });
    // Inline bilingual headings/captions retain their Arabic half and its markup.
    copy.querySelectorAll('h1,h2,h3,h4,p,li,th,td,figcaption,strong,b,span,small,.eyebrow,.note,.print-meta > div,svg text').forEach(n => {
      if (n.closest('pre,code,.formula,.equation,mjx-container,#references ol,.references')) return;
      const value = n.textContent;
      if (n.matches('strong,b,span') && n.querySelector('span,strong,b')) return;
      const bar = value.indexOf('|');
      if (n.querySelector('.origin,.age')) return;
      if (bar < 0 || arabic.test(value.slice(0,bar)) || !arabic.test(value.slice(bar+1))) return;
      const walker = document.createTreeWalker(n,NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        const index = node.data.indexOf('|');
        if (index < 0) continue;
        const range = document.createRange();
        range.setStart(n,0); range.setEnd(node,index+1); range.deleteContents();
        break;
      }
    });
    // Separate Arabic heading spans are common in the history timeline.
    copy.querySelectorAll('h1,h2,h3,h4,.note').forEach(n => {
      if (!n.querySelector(arSelector)) return;
      [...n.childNodes].forEach(child => {
        if (child.nodeType === Node.TEXT_NODE && /[A-Za-z]/.test(child.textContent) && !arabic.test(child.textContent)) child.remove();
      });
    });
    copy.querySelectorAll('details').forEach(n => n.open = true);
    return copy;
  }
  function cleanup() {
    printRoot?.remove(); printRoot = null;
    document.body.classList.remove('course-ar-printing');
    if (originalTitle !== undefined) document.title = originalTitle;
    originalTitle = undefined; mode = 'bilingual';
  }
  window.addEventListener('beforeprint', () => {
    if (mode !== 'ar' || printRoot) return;
    const source = document.querySelector('main');
    if (!source) return;
    printRoot = document.createElement('div'); printRoot.id = 'course-ar-print';
    printRoot.lang = 'ar'; printRoot.dir = 'rtl';
    printRoot.append(arabicCopy(source));
    document.body.append(printRoot);
    document.body.classList.add('course-ar-printing');
    originalTitle = document.title;
    document.title = (source.querySelector('.hero .ar')?.textContent.trim() || originalTitle) + ' - العربية';
  });
  window.addEventListener('afterprint', cleanup);
  document.querySelectorAll('button[onclick*="window.print"],button#print,button.pdfbtn').forEach(button => {
    const next = document.createElement('button');
    next.type = 'button'; next.className = button.className;
    next.textContent = 'تحميل PDF بالعربية'; next.lang = 'ar'; next.dir = 'rtl';
    next.title = 'نسخة عربية — اختر حفظ بصيغة PDF في نافذة الطباعة';
    next.dataset.pdfLanguage = 'ar';
    next.addEventListener('click', async () => {
      cleanup();
      if (document.fonts?.ready) await document.fonts.ready;
      if (window.MathJax?.startup?.promise) await window.MathJax.startup.promise;
      mode = 'ar';
      try { window.print(); } catch (error) { cleanup(); throw error; }
    });
    button.textContent = 'تحميل PDF باللغتين | Arabic & English';
    button.dataset.pdfLanguage = 'bilingual';
    button.addEventListener('click', cleanup, true);
    button.after(next);
  });
})();
