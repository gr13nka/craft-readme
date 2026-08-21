/*
 * A GitHub-flavored-markdown subset, rendered to an HTML string.
 *
 * Enough of GFM to render a real README faithfully: headings, paragraphs,
 * lists, fenced code, blockquotes, tables, rules, and inline emphasis / code /
 * links / images. Crucially it passes raw HTML through — every README uses
 * <div align="center">, <img>, <picture> — while still processing the markdown
 * nested inside those blocks, exactly as GitHub does.
 *
 * This renders the user's own README to an image, not untrusted input; it
 * favours faithful output over defensive escaping.
 */

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* Inline: code, images, links (a badge is an image inside a link), bold, italic. */
export function inline(text) {
  const code = [];
  let s = text.replace(/`([^`]+)`/g, (_, c) => { code.push('<code>' + esc(c) + '</code>'); return ' \x00' + (code.length - 1) + '\x00 '; });
  s = esc(s);
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (_, a, u) => '<img alt="' + a + '" src="' + u + '">');
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (_, t, u) => '<a href="' + u + '">' + t + '</a>');
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*])\*([^*\s][^*]*?)\*(?!\*)/g, '$1<em>$2</em>');
  s = s.replace(/(^|[^\w])_([^_]+)_(?![\w])/g, '$1<em>$2</em>');
  s = s.replace(/\x00(\d+)\x00/g, (_, n) => code[Number(n)]);
  return s;
}

const cells = (row) => row.replace(/^\s*\|?|\|?\s*$/g, '').split('|').map((c) => c.trim());
const isDivider = (l) => /^\s*\|?[\s:|-]*-[\s:|-]*\|?\s*$/.test(l) && l.includes('-');
const isRawHTML = (l) => /^\s*<\/?[a-zA-Z!][^>]*>/.test(l);
const itemRe = /^(\s*)(?:[-*+]|\d+[.)])\s+(.*)$/;

export function renderMarkdown(source) {
  const lines = String(source).replace(/\r\n?/g, '\n').split('\n');
  const out = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    if (isRawHTML(line)) { out.push(line); i++; continue; }

    const fence = line.match(/^\s*```(.*)$/);
    if (fence) {
      const body = [];
      i++;
      while (i < lines.length && !/^\s*```/.test(lines[i])) body.push(lines[i++]);
      i++;
      out.push('<pre><code>' + esc(body.join('\n')) + '</code></pre>');
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length;
      out.push('<h' + level + '>' + inline(heading[2].replace(/\s+#+\s*$/, '').trim()) + '</h' + level + '>');
      i++;
      continue;
    }

    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) { out.push('<hr>'); i++; continue; }

    if (line.includes('|') && isDivider(lines[i + 1] ?? '')) {
      const head = cells(line).map((c) => '<th>' + inline(c) + '</th>').join('');
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) {
        rows.push('<tr>' + cells(lines[i]).map((c) => '<td>' + inline(c) + '</td>').join('') + '</tr>');
        i++;
      }
      out.push('<table><thead><tr>' + head + '</tr></thead><tbody>' + rows.join('') + '</tbody></table>');
      continue;
    }

    if (/^\s*>/.test(line)) {
      const body = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) body.push(lines[i++].replace(/^\s*>\s?/, ''));
      out.push('<blockquote>' + body.map((t) => inline(t.trim())).join('<br>') + '</blockquote>');
      continue;
    }

    if (itemRe.test(line)) {
      const list = renderList(lines, i);
      out.push(list.html);
      i = list.next;
      continue;
    }

    const body = [];
    while (
      i < lines.length && lines[i].trim()
      && !isRawHTML(lines[i])
      && !/^\s*(#{1,6}\s|>|```)/.test(lines[i])
      && !itemRe.test(lines[i])
      && !/^\s*([-*_])(\s*\1){2,}\s*$/.test(lines[i])
      && !(lines[i].includes('|') && isDivider(lines[i + 1] ?? ''))
    ) body.push(lines[i++]);
    if (body.length) out.push('<p>' + inline(body.join(' ')) + '</p>');
    else i++;
  }

  return out.join('\n');
}

/* Indentation-aware list: a deeper indent nests a sub-list inside the last item. */
function renderList(lines, start) {
  const baseIndent = lines[start].match(/^(\s*)/)[1].length;
  const ordered = /^\s*\d+[.)]/.test(lines[start]);
  const parts = [];
  let i = start;
  while (i < lines.length && lines[i].trim() && itemRe.test(lines[i])) {
    const m = lines[i].match(itemRe);
    const indent = m[1].length;
    if (indent < baseIndent) break;
    if (indent > baseIndent) {
      const sub = renderList(lines, i);
      parts[parts.length - 1] = parts[parts.length - 1].replace(/<\/li>$/, sub.html + '</li>');
      i = sub.next;
      continue;
    }
    parts.push('<li>' + inline(m[2]) + '</li>');
    i++;
  }
  const tag = ordered ? 'ol' : 'ul';
  return { html: '<' + tag + '>' + parts.join('') + '</' + tag + '>', next: i };
}
