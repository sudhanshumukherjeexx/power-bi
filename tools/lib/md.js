/* A small Markdown renderer for build-time pages (the Toolkit). Content is ours, so it supports exactly what
   the guides use and nothing else:
     # headings (ids from the text), paragraphs, **bold**, *italic*, `code`, [links](url)
     - / 1. lists (nested by two-space indent), - [ ] checklists, | tables |, > quotes and callouts
     ```lang fenced code, ```tree decision trees (indented lines), ```diagram text diagrams, ---
     ::: name args   a build-time macro, replaced by the HTML the caller returns
   Relative links are written from the site root and prefixed with opts.root for pages in subfolders. */
'use strict';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slug = s => String(s).toLowerCase().replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function render(src, opts = {}) {
  const root = opts.root || '';
  const headings = [];
  const used = new Set();
  let ck = 0;
  const href = u => /^(https?:|mailto:|#)/.test(u) ? u : root + u;
  const inline = t => {
    const keep = [];
    const hold = h => { keep.push(h); return `\u0000${keep.length - 1}\u0000`; };
    t = t.replace(/\\\|/g, '|');
    t = t.replace(/`([^`]+)`/g, (_, c) => hold(`<code>${esc(c)}</code>`));
    t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, txt, u) => {
      const ext = /^https?:/.test(u);
      return hold(`<a href="${esc(href(u))}"${ext ? ' rel="noopener" target="_blank" class="ext"' : ''}>${inline(txt)}</a>`);
    });
    t = esc(t);
    t = t.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?!\*)/g, '$1<i>$2</i>');
    return t.replace(/\u0000(\d+)\u0000/g, (_, i) => keep[+i]);
  };
  const hid = text => { let id = slug(text) || 'section', n = 2; const base = id; while (used.has(id)) id = `${base}-${n++}`; used.add(id); return id; };

  const L = src.replace(/\r\n/g, '\n').split('\n');
  let h = '', i = 0;
  const para = [];
  const flush = () => { if (para.length) { h += `<p>${inline(para.join(' '))}</p>\n`; para.length = 0; } };
  const isList = l => /^\s*([-*]|\d+\.)\s/.test(l);

  function list(start) {
    /* nested list from indentation; returns html and the next line index */
    const items = [];
    let j = start;
    const indent = l => l.match(/^\s*/)[0].length;
    const base = indent(L[j]);
    const ordered = /^\s*\d+\./.test(L[j]);
    while (j < L.length && L[j].trim() && (isList(L[j]) || indent(L[j]) > base)) {
      const ind = indent(L[j]);
      if (ind > base && items.length) {
        if (isList(L[j])) { const sub = list(j); items[items.length - 1].sub += sub.html; j = sub.next; }
        else { items[items.length - 1].text += ' ' + L[j].trim(); j++; }
        continue;
      }
      if (ind < base) break;
      items.push({ text: L[j].replace(/^\s*([-*]|\d+\.)\s/, ''), sub: '' });
      j++;
    }
    const check = items.length && items.every(x => /^\[[ x]\]/.test(x.text));
    const tag = ordered ? 'ol' : 'ul';
    const body = items.map(x => {
      const c = x.text.match(/^\[([ x])\]\s*(.*)/);
      if (c) return `<li><label><input type="checkbox" data-ck="${opts.id || 'page'}:${ck++}"${c[1] === 'x' ? ' checked' : ''}> <span>${inline(c[2])}</span></label>${x.sub}</li>`;
      return `<li>${inline(x.text)}${x.sub}</li>`;
    }).join('');
    return { html: `<${tag}${check ? ' class="checklist"' : ''}>${body}</${tag}>`, next: j };
  }

  function tree(lines) {
    /* indented lines → nested lists; "→ " lines are actions */
    const rows = lines.filter(l => l.trim()).map(l => ({ d: Math.floor(l.match(/^\s*/)[0].length / 2), t: l.trim() }));
    let out = '', depth = -1;
    for (const r of rows) {
      if (r.d > depth) { out += '<ul>'.repeat(r.d - depth); }
      else { out += '</li>'; if (r.d < depth) out += '</ul></li>'.repeat(depth - r.d); }
      const act = /^(→|->)\s*/.test(r.t);
      out += `<li${act ? ' class="act"' : ''}>${inline(r.t.replace(/^(→|->)\s*/, act ? '→ ' : ''))}`;
      depth = r.d;
    }
    out += '</li>' + '</ul></li>'.repeat(Math.max(depth, 0)) + '</ul>';
    return `<div class="tree">${out}</div>`;
  }

  while (i < L.length) {
    const l = L[i];
    const fence = l.match(/^```\s*([\w-]*)/);
    if (fence) {
      flush();
      const lang = fence[1];
      const buf = [];
      i++;
      while (i < L.length && !/^```\s*$/.test(L[i])) buf.push(L[i++]);
      i++;
      if (lang === 'tree') h += tree(buf) + '\n';
      else if (lang === 'diagram') h += `<pre class="diagram" role="img" aria-label="${esc(opts.diagramLabel || 'Diagram')}">${esc(buf.join('\n'))}</pre>\n`;
      else h += `<div class="codewrap"><span class="lang">${esc(lang || 'text')}</span><button class="cp" type="button" data-copycode>Copy</button><pre><code>${esc(buf.join('\n'))}</code></pre></div>\n`;
      continue;
    }
    const macro = l.match(/^:::\s*([\w-]+)\s*(.*)$/);
    if (macro) {
      flush();
      if (!opts.macro) throw new Error(`macro "${macro[1]}" used but no macro handler given`);
      h += opts.macro(macro[1], macro[2].trim()) + '\n';
      i++;
      continue;
    }
    const hd = l.match(/^(#{1,4})\s+(.*)/);
    if (hd) {
      flush();
      const n = hd[1].length;
      const id = hid(hd[2]);
      headings.push({ level: n, id, text: hd[2].replace(/[*`]/g, '') });
      h += `<h${n} id="${id}">${inline(hd[2])}</h${n}>\n`;
      i++;
      continue;
    }
    if (/^---+\s*$/.test(l)) { flush(); h += '<hr>\n'; i++; continue; }
    if (/^\|/.test(l)) {
      flush();
      const rows = [];
      while (i < L.length && /^\|/.test(L[i])) rows.push(L[i++]);
      const cells = r => r.replace(/\\\|/g, '\u0001').replace(/^\||\|\s*$/g, '').split('|').map(c => c.replace(/\u0001/g, '\\|').trim());
      const head = cells(rows[0]);
      const body = rows.slice(/^\|[\s:|-]+\|?\s*$/.test(rows[1] || '') ? 2 : 1).map(cells);
      h += `<div class="tblscroll"><table class="tbl"><thead><tr>${head.map(c => `<th scope="col">${inline(c)}</th>`).join('')}</tr></thead><tbody>${body.map(r => `<tr>${r.map(c => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>\n`;
      continue;
    }
    if (/^>/.test(l)) {
      flush();
      const buf = [];
      while (i < L.length && /^>/.test(L[i])) buf.push(L[i++].replace(/^>\s?/, ''));
      const kind = (buf[0].match(/^\*\*(Note|Warning|Tip|Senior|Why|Rule)\b/) || [])[1];
      const inner = render(buf.join('\n'), Object.assign({}, opts, { macro: null })).html;
      h += kind ? `<div class="callout ${kind.toLowerCase()}" role="note">${inner}</div>\n` : `<blockquote>${inner}</blockquote>\n`;
      continue;
    }
    if (isList(l)) { flush(); const r = list(i); h += r.html + '\n'; i = r.next; continue; }
    if (!l.trim()) { flush(); i++; continue; }
    para.push(l.trim());
    i++;
  }
  flush();
  return { html: h, headings };
}

/* front matter: a JSON object between --- lines at the top of the file */
function parse(text, file) {
  text = text.replace(/\r\n/g, '\n');
  const m = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) throw new Error(`${file}: missing front matter (a JSON object between --- lines)`);
  let meta;
  try { meta = JSON.parse(m[1]); } catch (e) { throw new Error(`${file}: front matter is not valid JSON: ${e.message}`); }
  return { meta, body: text.slice(m[0].length) };
}

module.exports = { render, parse, esc, slug };
