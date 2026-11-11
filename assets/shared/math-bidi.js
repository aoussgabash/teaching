/* Preserve mathematical reading order inside Arabic prose on every course page. */
(() => {
  'use strict';
  if (window.agMathBidiInstalled) return;
  window.agMathBidiInstalled = true;
  const style = document.createElement('style');
  style.id = 'ag-math-bidi-style';
  style.textContent = [
    '.ag-ltr-math,.math-inline{direction:ltr!important;unicode-bidi:isolate!important;display:inline-block;max-width:100%;text-align:left}',
    '.formula,.unit-equality,.math-display,mjx-container,math{direction:ltr!important;unicode-bidi:isolate!important}',
    '.ag-ltr-math{vertical-align:baseline}',
    '@media print{.ag-ltr-math,.math-inline{direction:ltr!important;unicode-bidi:isolate!important}}'
  ].join('\n');
  document.head.appendChild(style);
  const skip = 'script,style,noscript,textarea,input,pre,code,svg,math,mjx-container,.math-inline,.math-display,.formula,.unit-equality,.ag-ltr-math,[contenteditable="true"]';
  const island = '.math-inline,.ag-ltr-math,var,sub,sup,mjx-container:not([display="true"])';
  // Keep a complete function, ratio, subscript or TeX expression in one island.
  const token = /\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\]|[A-Za-z0-9\u0370-\u03ff\u1d00-\u1d7f\u2070-\u209f\u2100-\u214f][A-Za-z0-9\u0370-\u03ff\u1d00-\u1d7f\u2070-\u209f\u2100-\u214f\u{1d400}-\u{1d7ff}\s_.,:(){}\[\]\/\\|+−\-*=≈≠≤≥<>^%°·×÷√∇∂∞!]*|[\u{1d400}-\u{1d7ff}][A-Za-z0-9\u0370-\u03ff\u2070-\u209f\s_(){}\[\]\/+−\-*=≈≤≥^·×]*/gu;
  function rtl(element) {
    return getComputedStyle(element).direction === 'rtl';
  }
  function wrapText(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const p = node.parentElement;
        return p && !p.closest(skip) && rtl(p) && /[A-Za-z0-9\u0370-\u03ff\u2100-\u214f\u{1d400}-\u{1d7ff}]/u.test(node.data)
          ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      const value = node.data;
      token.lastIndex = 0;
      const matches = Array.from(value.matchAll(token));
      if (!matches.length) continue;
      const fragment = document.createDocumentFragment();
      let end = 0;
      for (const match of matches) {
        const text = match[0].trimEnd();
        if (!text) continue;
        fragment.appendChild(document.createTextNode(value.slice(end, match.index)));
        const span = document.createElement('bdi');
        span.className = 'ag-ltr-math';
        span.dir = 'ltr';
        span.textContent = text;
        fragment.appendChild(span);
        end = match.index + text.length;
      }
      fragment.appendChild(document.createTextNode(value.slice(end)));
      node.replaceWith(fragment);
    }
  }
  // Join separately marked e, (, t, ) into ONE direction-isolated function.
  function joinInline(root) {
    const elements = [root, ...root.querySelectorAll('*')];
    for (const parent of elements) {
      if (!parent.matches || parent.closest(skip) || !rtl(parent)) continue;
      // Keep parentheses at the Arabic/text boundary with the adjacent formula.
      for (const n of Array.from(parent.childNodes)) {
        if (n.nodeType !== 3 || !/[\u0600-\u06ff]/.test(n.data)) continue;
        const parts = n.data.match(/^([\s0-9_.,:;(){}\[\]\/|+−\-*=≈≠≤≥<>^%°·×÷√!]*)([\s\S]*?)([\s0-9_.,:;(){}\[\]\/|+−\-*=≈≠≤≥<>^%°·×÷√!]*)$/);
        if (!parts || (!parts[1] && !parts[3])) continue;
        if (parts[1]) parent.insertBefore(document.createTextNode(parts[1]), n);
        n.data = parts[2];
        if (parts[3]) parent.insertBefore(document.createTextNode(parts[3]), n.nextSibling);
      }
      const children = Array.from(parent.childNodes);
      let run = [];
      const flush = () => {
        const hasMath = run.some(n => n.nodeType === 1 && n.matches(island));
        if (hasMath && run.length > 1) {
          // Leading/trailing ordinary spaces belong to the Arabic sentence.
          while (run.length && run[0].nodeType === 3 && /^\s*$/.test(run[0].data)) run.shift();
          while (run.length && run[run.length - 1].nodeType === 3 && /^\s*$/.test(run[run.length - 1].data)) run.pop();
          if (run.length > 1) {
            const wrapper = document.createElement('bdi');
            wrapper.className = 'ag-ltr-math';
            wrapper.dir = 'ltr';
            parent.insertBefore(wrapper, run[0]);
            for (const n of run) wrapper.appendChild(n);
          }
        }
        run = [];
      };
      for (const node of children) {
        const simpleText = node.nodeType === 3 && /^[\s0-9_.,:;(){}\[\]\/|+−\-*=≈≠≤≥<>^%°·×÷√!]*$/.test(node.data);
        if (simpleText || (node.nodeType === 1 && node.matches(island))) run.push(node);
        else flush();
      }
      flush();
    }
  }
  function normalize(root) {
    if (!root || root.nodeType !== 1 || root.closest(skip)) return;
    wrapText(root);
    joinInline(root);
  }
  function start() {
    normalize(document.body);
    let queued = false;
    const roots = new Set();
    const observer = new MutationObserver(records => {
      for (const record of records) {
        const root = record.target.nodeType === 1 ? record.target : record.target.parentElement;
        if (root && !root.closest(skip)) roots.add(root);
      }
      if (!roots.size || queued) return;
      queued = true;
      queueMicrotask(() => {
        queued = false;
        observer.disconnect();
        for (const root of roots) normalize(root);
        roots.clear();
        observer.observe(document.body, {subtree:true, childList:true, characterData:true});
      });
    });
    observer.observe(document.body, {subtree:true, childList:true, characterData:true});
    window.addEventListener('beforeprint', () => normalize(document.body));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();
