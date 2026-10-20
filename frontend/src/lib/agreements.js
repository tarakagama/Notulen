// Mengubah isi editor "Hasil Kesepakatan" menjadi daftar butir.
// Satu butir = satu item daftar paling dalam, atau satu paragraf di luar daftar.
export const normalizeText = (s) => String(s || '').replace(/\s+/g, ' ').trim();

export function extractAgreementItems(html) {
  if (!html) return [];
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const nodes = doc.body.querySelectorAll(':scope > p, li');
  const items = [];
  nodes.forEach((el) => {
    if (el.tagName === 'LI' && el.querySelector('ul, ol')) return; // induk: yang dihitung anak-anaknya
    const text = normalizeText(el.textContent);
    if (text) items.push(text);
  });
  return items;
}

// Menebak PIC dari teks: "(PIC: Budi)", "PIC Budi", atau "@Budi Santoso".
export function guessPicId(text, users) {
  const m = text.match(/(?:\(?\bPIC\b\s*[:-]?\s*|@)([^)\n,;.]+)/i);
  if (!m) return '';
  const wanted = m[1].trim().toLowerCase();
  if (!wanted) return '';
  const hit = users.find((u) => {
    const name = String(u.full_name || u.name || '').toLowerCase();
    return name && (name === wanted || name.startsWith(wanted) || wanted.startsWith(name));
  });
  return hit ? hit.id : '';
}