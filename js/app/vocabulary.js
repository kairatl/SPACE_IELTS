/**
 * Local vocabulary (Reading + Dashboard). Free APIs only.
 */

export const VOCAB_STORAGE_KEY = 'user_vocabulary';

export function readVocabulary() {
    try {
        const raw = localStorage.getItem(VOCAB_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export function writeVocabulary(items) {
    localStorage.setItem(VOCAB_STORAGE_KEY, JSON.stringify(items));
}

export function addVocabularyItem(item) {
    const items = readVocabulary();
    items.unshift(item);
    writeVocabulary(items);
}

export function removeVocabularyItem(id) {
    writeVocabulary(readVocabulary().filter((x) => x.id !== id));
}

/** Custom folders + manual entries (separate from reading `user_vocabulary`). */
export const MANUAL_FOLDERS_KEY = 'user_manual_vocab';

export function readManualFoldersState() {
    try {
        const raw = localStorage.getItem(MANUAL_FOLDERS_KEY);
        if (!raw) return { folders: [] };
        const p = JSON.parse(raw);
        if (p && Array.isArray(p.folders)) return { folders: p.folders };
        return { folders: [] };
    } catch {
        return { folders: [] };
    }
}

function writeManualFoldersState(state) {
    localStorage.setItem(MANUAL_FOLDERS_KEY, JSON.stringify({ folders: state.folders || [] }));
}

export function createManualFolder(name) {
    const state = readManualFoldersState();
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const label = String(name || '').trim() || 'New folder';
    state.folders.unshift({
        id,
        name: label,
        createdAt: new Date().toISOString(),
        words: []
    });
    writeManualFoldersState(state);
    return id;
}

export function deleteManualFolder(folderId) {
    const state = readManualFoldersState();
    state.folders = state.folders.filter((f) => f.id !== folderId);
    writeManualFoldersState(state);
}

export function addManualWordToFolder(folderId, payload) {
    const word = String(payload.word || '').trim();
    if (!word) return false;
    const state = readManualFoldersState();
    const folder = state.folders.find((f) => f.id === folderId);
    if (!folder) return false;
    if (!Array.isArray(folder.words)) folder.words = [];
    folder.words.unshift({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
        type: 'manual',
        word,
        translation: String(payload.translation || '').trim(),
        definition: String(payload.definition || '').trim(),
        addedAt: new Date().toISOString()
    });
    writeManualFoldersState(state);
    return true;
}

export function removeManualWordFromFolder(folderId, wordId) {
    const state = readManualFoldersState();
    const folder = state.folders.find((f) => f.id === folderId);
    if (!folder || !Array.isArray(folder.words)) return;
    folder.words = folder.words.filter((w) => w.id !== wordId);
    writeManualFoldersState(state);
}

function extractEnglishWord(selection) {
    const t = selection.toString().trim();
    if (!t) return null;
    const m = t.match(/[A-Za-z]+(?:['-][A-Za-z]+)*/);
    return m ? m[0] : null;
}

function getContextSentence(range, passageRoot) {
    let node = range.commonAncestorContainer;
    if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
    const p = node && node.closest ? node.closest('p') : null;
    if (!p || !passageRoot.contains(p)) {
        const frag = range.toString().replace(/\s+/g, ' ').trim();
        return frag || '';
    }
    const full = p.textContent.replace(/\s+/g, ' ').trim();
    const frag = range.toString().replace(/\s+/g, ' ').trim();
    const sentences = full.split(/(?<=[.!?])\s+/).filter(Boolean);
    if (!frag) return full;
    const needle = frag.length > 24 ? frag.slice(0, 24) : frag;
    for (const s of sentences) {
        if (s.includes(needle)) return s;
    }
    const firstTok = frag.split(/\s+/)[0] || '';
    if (firstTok) {
        const low = firstTok.toLowerCase();
        for (const s of sentences) {
            if (s.toLowerCase().includes(low)) return s;
        }
    }
    return full;
}

function parseDictionaryEntry(data) {
    const entry = Array.isArray(data) && data[0] ? data[0] : null;
    if (!entry) {
        return { transcription: '', definition: '', synonyms: [] };
    }
    let transcription = typeof entry.phonetic === 'string' ? entry.phonetic : '';
    const phonetics = entry.phonetics || [];
    for (const ph of phonetics) {
        if (ph && ph.text) {
            transcription = ph.text;
            break;
        }
    }
    const defs = [];
    const syns = new Set();
    (entry.meanings || []).forEach((m) => {
        (m.synonyms || []).forEach((s) => syns.add(s));
        (m.definitions || []).forEach((d) => {
            if (d.definition) defs.push(d.definition);
            (d.synonyms || []).forEach((s) => syns.add(s));
        });
    });
    return {
        transcription,
        definition: defs[0] || '',
        synonyms: [...syns].slice(0, 16)
    };
}

async function fetchDictionary(word) {
    const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;
    const res = await fetch(url);
    if (!res.ok) return { transcription: '', definition: '', synonyms: [] };
    const data = await res.json();
    return parseDictionaryEntry(data);
}

async function fetchRussian(word) {
    const q = encodeURIComponent(word);
    try {
        const res = await fetch(`https://lingva.ml/api/v1/en/ru/${q}`);
        if (res.ok) {
            const j = await res.json();
            if (j && typeof j.translation === 'string' && j.translation.trim()) {
                return j.translation.trim();
            }
        }
    } catch {
        /* try fallback */
    }
    try {
        const res = await fetch(
            `https://api.mymemory.translated.net/get?q=${q}&langpair=en|ru`
        );
        if (res.ok) {
            const j = await res.json();
            const t = j.responseData && j.responseData.translatedText;
            if (typeof t === 'string' && t.trim()) return t.trim();
        }
    } catch {
        /* ignore */
    }
    return '';
}

export async function buildVocabEntry(word, context) {
    const w = String(word).trim();
    const [dict, translationRu] = await Promise.all([fetchDictionary(w), fetchRussian(w)]);
    return {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
        word: w,
        transcription: dict.transcription,
        definition: dict.definition,
        synonyms: dict.synonyms,
        translationRu,
        context: context || '',
        addedAt: new Date().toISOString()
    };
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text == null ? '' : String(text);
    return div.innerHTML;
}

function ensureToastHost() {
    let el = document.getElementById('vocab-toast-host');
    if (!el) {
        el = document.createElement('div');
        el.id = 'vocab-toast-host';
        el.setAttribute('aria-live', 'polite');
        document.body.appendChild(el);
    }
    return el;
}

function showVocabToast(message, isError) {
    const host = ensureToastHost();
    const t = document.createElement('p');
    t.className = 'vocab-toast' + (isError ? ' vocab-toast--error' : '');
    t.textContent = message;
    host.innerHTML = '';
    host.appendChild(t);
    window.clearTimeout(showVocabToast._tid);
    showVocabToast._tid = window.setTimeout(() => {
        t.remove();
    }, 3200);
}

const HL_YELLOW = 'ielts-hl-yellow';
const HL_UNDER = 'ielts-hl-underline';

function getPassageBlockElement(node) {
    if (!node) return null;
    const el = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return null;
    return el.closest('p, h2, h3');
}

function isSamePassageBlock(range) {
    const a = getPassageBlockElement(range.startContainer);
    const b = getPassageBlockElement(range.endContainer);
    return !!(a && b && a === b);
}

function wrapRangeInTag(range, tagName, className) {
    if (range.collapsed || !String(range.toString()).trim()) return false;
    if (!isSamePassageBlock(range)) {
        showVocabToast('Select within one paragraph or heading to highlight.', true);
        return false;
    }
    const wrapper = document.createElement(tagName);
    wrapper.className = className;
    const r = range.cloneRange();
    try {
        r.surroundContents(wrapper);
        return true;
    } catch {
        try {
            const frag = r.extractContents();
            if (!frag.textContent.trim() && frag.childNodes.length === 0) return false;
            wrapper.appendChild(frag);
            r.insertNode(wrapper);
            return true;
        } catch {
            showVocabToast('Could not apply highlight here.', true);
            return false;
        }
    }
}

function unwrapHighlightsInRange(range, scopeEl) {
    const sel = `mark.${HL_YELLOW}, span.${HL_UNDER}`;
    const nodes = [...scopeEl.querySelectorAll(sel)];
    const toUnwrap = nodes.filter((el) => {
        try {
            return range.intersectsNode(el);
        } catch {
            return false;
        }
    });
    const parents = new Set();
    toUnwrap.forEach((el) => {
        const parent = el.parentNode;
        if (!parent) return;
        parents.add(parent);
        while (el.firstChild) {
            parent.insertBefore(el.firstChild, el);
        }
        parent.removeChild(el);
    });
    parents.forEach((p) => p.normalize());
    return toUnwrap.length > 0;
}

function passageRangeForAction(leftPanel, savedRange) {
    const activePart = leftPanel.querySelector('.passage-part.active');
    if (!activePart) return null;
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
        const r = sel.getRangeAt(0);
        if (activePart.contains(r.commonAncestorContainer)) {
            return r.cloneRange();
        }
    }
    if (savedRange) {
        const r = savedRange.cloneRange();
        if (activePart.contains(r.commonAncestorContainer)) {
            return r;
        }
    }
    return null;
}

/**
 * Passage selection toolbar: yellow highlighter, eraser, Add to Vocab (#left-panel only).
 * @param {HTMLElement} leftPanel
 */
export function attachVocabularyToPassagePanel(leftPanel) {
    if (!leftPanel || leftPanel.dataset.vocabAttached === '1') return;
    leftPanel.dataset.vocabAttached = '1';

    const legacy = document.getElementById('vocab-selection-float-btn');
    if (legacy) legacy.remove();

    let toolbar = document.getElementById('passage-selection-toolbar');
    if (!toolbar) {
        toolbar = document.createElement('div');
        toolbar.id = 'passage-selection-toolbar';
        toolbar.className = 'ielts-passage-toolbar';
        toolbar.setAttribute('role', 'toolbar');
        toolbar.setAttribute('aria-label', 'Passage tools');
        toolbar.innerHTML = `
            <button type="button" class="ielts-passage-toolbar__btn" data-action="yellow" aria-label="Yellow highlighter" title="Yellow highlighter">🖌️</button>
            <button type="button" class="ielts-passage-toolbar__btn" data-action="eraser" aria-label="Clear highlight" title="Clear highlight">🧼</button>
            <button type="button" class="ielts-passage-toolbar__btn ielts-passage-toolbar__btn--vocab" data-action="vocab" aria-label="Add to vocabulary" title="Add to vocabulary">📖</button>
        `;
        document.body.appendChild(toolbar);
    } else {
        toolbar.querySelector('[data-action="underline"]')?.remove();
    }
    toolbar.removeAttribute('hidden');
    toolbar.classList.remove('ielts-passage-toolbar--open');
    toolbar.setAttribute('aria-hidden', 'true');

    let pendingWord = '';
    let pendingContext = '';
    /** @type {Range | null} */
    let savedRange = null;
    let vocabBusy = false;

    function hideToolbar() {
        toolbar.classList.remove('ielts-passage-toolbar--open');
        toolbar.setAttribute('aria-hidden', 'true');
        pendingWord = '';
        pendingContext = '';
        savedRange = null;
        const vocabBtn = toolbar.querySelector('[data-action="vocab"]');
        if (vocabBtn) vocabBtn.disabled = false;
    }

    function positionToolbar(range) {
        const rect = range.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) {
            hideToolbar();
            return;
        }
        void toolbar.offsetWidth;
        const gap = 8;
        const th = toolbar.offsetHeight || 40;
        const tw = toolbar.offsetWidth || 200;
        let left = rect.left + rect.width / 2;
        let top = rect.top - th - gap;
        if (top < 8) {
            top = rect.bottom + gap;
        }
        left = Math.max(tw / 2 + 8, Math.min(left, window.innerWidth - tw / 2 - 8));
        top = Math.min(top, window.innerHeight - th - 8);
        toolbar.style.left = `${left}px`;
        toolbar.style.top = `${top}px`;
        toolbar.style.transform = 'translateX(-50%)';
        toolbar.classList.add('ielts-passage-toolbar--open');
        toolbar.setAttribute('aria-hidden', 'false');
    }

    function onSelectionMaybeUpdate() {
        window.requestAnimationFrame(() => {
            const sel = window.getSelection();
            if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
                hideToolbar();
                return;
            }
            const range = sel.getRangeAt(0);
            if (!leftPanel.contains(range.commonAncestorContainer)) {
                hideToolbar();
                return;
            }
            const activePart = leftPanel.querySelector('.passage-part.active');
            if (!activePart || !activePart.contains(range.commonAncestorContainer)) {
                hideToolbar();
                return;
            }
            if (!String(range.toString()).trim()) {
                hideToolbar();
                return;
            }
            pendingWord = extractEnglishWord(sel) || '';
            pendingContext = getContextSentence(range, activePart);
            savedRange = range.cloneRange();
            const vocabBtn = toolbar.querySelector('[data-action="vocab"]');
            if (vocabBtn) {
                vocabBtn.disabled = !pendingWord;
                vocabBtn.title = pendingWord
                    ? 'Add to vocabulary'
                    : 'Select an English word to add to vocabulary';
            }
            positionToolbar(range);
        });
    }

    function onDocumentClickHideToolbar(e) {
        if (!toolbar.classList.contains('ielts-passage-toolbar--open')) return;
        if (toolbar.contains(e.target)) return;
        const s = window.getSelection();
        if (s && s.rangeCount > 0 && !s.isCollapsed) return;
        hideToolbar();
    }

    function onSelectionChangeHideToolbar() {
        window.requestAnimationFrame(() => {
            if (vocabBusy) return;
            const sel = window.getSelection();
            if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
                if (toolbar.classList.contains('ielts-passage-toolbar--open')) {
                    hideToolbar();
                }
                return;
            }
            const range = sel.getRangeAt(0);
            const activePart = leftPanel.querySelector('.passage-part.active');
            if (!activePart || !activePart.contains(range.commonAncestorContainer)) {
                hideToolbar();
            }
        });
    }

    leftPanel.addEventListener('mouseup', onSelectionMaybeUpdate);
    document.addEventListener('selectionchange', onSelectionChangeHideToolbar);
    document.addEventListener('click', onDocumentClickHideToolbar);
    leftPanel.addEventListener('scroll', hideToolbar, true);

    toolbar.addEventListener('mousedown', (e) => {
        const act = e.target.closest('[data-action]');
        if (!act) return;
        e.preventDefault();
        e.stopPropagation();

        const activePartEl = leftPanel.querySelector('.passage-part.active');
        if (!activePartEl) return;

        const action = act.dataset.action;

        if (action === 'vocab') {
            if (!pendingWord) {
                showVocabToast('Select an English word to add to vocabulary.', true);
                return;
            }
            vocabBusy = true;
            act.disabled = true;
            void buildVocabEntry(pendingWord, pendingContext)
                .then((entry) => {
                    addVocabularyItem(entry);
                    showVocabToast(`“${entry.word}” added to My Vocabulary`);
                })
                .catch(() => {
                    showVocabToast('Could not save this word. Try again.', true);
                })
                .finally(() => {
                    vocabBusy = false;
                    act.disabled = false;
                    hideToolbar();
                    const s = window.getSelection();
                    if (s) s.removeAllRanges();
                });
            return;
        }

        const r = passageRangeForAction(leftPanel, savedRange);
        if (!r || r.collapsed || !String(r.toString()).trim()) {
            return;
        }
        const clone = r.cloneRange();

        if (action === 'yellow') {
            wrapRangeInTag(clone, 'mark', HL_YELLOW);
        } else if (action === 'eraser') {
            const did = unwrapHighlightsInRange(clone, activePartEl);
            if (!did) {
                showVocabToast('No highlight in this selection.', true);
            }
        }

        hideToolbar();
    });
}

function autoItemMatchesSearch(item, ql) {
    if (!ql) return true;
    const hay = [
        item.word,
        item.definition,
        item.translationRu,
        item.transcription,
        item.context,
        ...(Array.isArray(item.synonyms) ? item.synonyms : [])
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
    return hay.includes(ql);
}

function manualWordMatchesSearch(w, ql) {
    if (!ql) return true;
    const hay = [w.word, w.translation, w.definition].filter(Boolean).join(' ').toLowerCase();
    return hay.includes(ql);
}

function dateGroupLabel(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return 'Unknown date';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const day = new Date(d);
    day.setHours(0, 0, 0, 0);
    if (day.getTime() === today.getTime()) return 'Today';
    if (day.getTime() === yesterday.getTime()) return 'Yesterday';
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function groupAutoItemsByDate(items) {
    const order = [];
    const map = new Map();
    items.forEach((it) => {
        const label = dateGroupLabel(it.addedAt);
        if (!map.has(label)) {
            map.set(label, []);
            order.push(label);
        }
        map.get(label).push(it);
    });
    return order.map((label) => ({ label, items: map.get(label) }));
}

function appendReadingFlipCard(grid, item, container) {
    const card = document.createElement('article');
    card.className = 'vocab-flip-card vocab-flip-card--compact';
    card.dataset.id = item.id;

    const synList = Array.isArray(item.synonyms) ? item.synonyms : [];
    const synHtml =
        synList.length > 0
            ? `<p class="vocab-flip-syn"><span class="vocab-flip-label">Synonyms</span> ${escapeHtml(
                  synList.join(', ')
              )}</p>`
            : '';

    const trans = item.transcription
        ? `<p class="vocab-flip-ipa">${escapeHtml(item.transcription)}</p>`
        : '';
    const def = item.definition
        ? `<p class="vocab-flip-def">${escapeHtml(item.definition)}</p>`
        : '<p class="vocab-flip-def vocab-flip-muted">No definition found.</p>';
    const ru = item.translationRu
        ? `<p class="vocab-flip-ru">${escapeHtml(item.translationRu)}</p>`
        : '';
    const ctx = item.context
        ? `<p class="vocab-flip-ctx"><span class="vocab-flip-label">Context</span> ${escapeHtml(
              item.context
          )}</p>`
        : '';

    card.innerHTML = `
            <div class="vocab-flip-inner">
                <div class="vocab-flip-face vocab-flip-front">
                    <p class="vocab-flip-word">${escapeHtml(item.word)}</p>
                    ${trans}
                    <span class="vocab-flip-hint">Click to flip</span>
                </div>
                <div class="vocab-flip-face vocab-flip-back">
                    ${def}
                    ${ru}
                    ${synHtml}
                    ${ctx}
                    <button type="button" class="btn btn-ghost vocab-flip-delete">Delete</button>
                </div>
            </div>
        `;

    const inner = card.querySelector('.vocab-flip-inner');
    card.addEventListener('click', (ev) => {
        if (ev.target.closest('.vocab-flip-delete')) return;
        inner.classList.toggle('vocab-flip-inner--flipped');
    });

    const del = card.querySelector('.vocab-flip-delete');
    del.addEventListener('click', (ev) => {
        ev.stopPropagation();
        removeVocabularyItem(item.id);
        renderVocabularyDashboard(container);
    });

    grid.appendChild(card);
}

function buildFolderCard(folder, container) {
    const card = document.createElement('article');
    card.className = 'vocab-folder-card';
    card.dataset.folderId = folder.id;

    const header = document.createElement('header');
    header.className = 'vocab-folder-card__head';

    const title = document.createElement('h4');
    title.className = 'vocab-folder-card__title';
    title.textContent = folder.name;

    const meta = document.createElement('span');
    meta.className = 'vocab-folder-card__count';
    const n = (folder.words && folder.words.length) || 0;
    meta.textContent = `${n} word${n === 1 ? '' : 's'}`;

    const delF = document.createElement('button');
    delF.type = 'button';
    delF.className = 'btn btn-ghost vocab-folder-card__delete-folder';
    delF.textContent = 'Delete';
    delF.addEventListener('click', () => {
        if (window.confirm('Delete this folder and all words inside?')) {
            deleteManualFolder(folder.id);
            renderVocabularyDashboard(container);
        }
    });

    header.appendChild(title);
    header.appendChild(meta);
    header.appendChild(delF);

    const form = document.createElement('form');
    form.className = 'vocab-manual-form';
    const formTitle = document.createElement('p');
    formTitle.className = 'vocab-manual-form__title';
    formTitle.textContent = 'Add word manually';

    const labelW = document.createElement('label');
    labelW.className = 'vocab-manual-field';
    labelW.innerHTML = '<span>Word</span>';
    const inpW = document.createElement('input');
    inpW.name = 'word';
    inpW.required = true;
    inpW.className = 'vocab-manual-input';
    inpW.autocomplete = 'off';
    labelW.appendChild(inpW);

    const labelT = document.createElement('label');
    labelT.className = 'vocab-manual-field';
    labelT.innerHTML = '<span>Translation</span>';
    const inpT = document.createElement('input');
    inpT.name = 'translation';
    inpT.className = 'vocab-manual-input';
    inpT.autocomplete = 'off';
    labelT.appendChild(inpT);

    const labelD = document.createElement('label');
    labelD.className = 'vocab-manual-field';
    labelD.innerHTML = '<span>Definition</span>';
    const taD = document.createElement('textarea');
    taD.name = 'definition';
    taD.className = 'vocab-manual-textarea';
    taD.rows = 2;
    labelD.appendChild(taD);

    const submit = document.createElement('button');
    submit.type = 'submit';
    submit.className = 'btn btn-signup vocab-manual-submit';
    submit.textContent = 'Add word';

    form.appendChild(formTitle);
    form.appendChild(labelW);
    form.appendChild(labelT);
    form.appendChild(labelD);
    form.appendChild(submit);

    form.addEventListener('submit', (ev) => {
        ev.preventDefault();
        const fd = new FormData(form);
        const ok = addManualWordToFolder(folder.id, {
            word: fd.get('word'),
            translation: fd.get('translation'),
            definition: fd.get('definition')
        });
        if (!ok) {
            showVocabToast('Enter a word to add.', true);
            return;
        }
        form.reset();
        renderVocabularyDashboard(container);
    });

    const list = document.createElement('ul');
    list.className = 'vocab-manual-list';
    (folder.words || []).forEach((w) => {
        const li = document.createElement('li');
        li.className = 'vocab-manual-list__item';

        const top = document.createElement('div');
        top.className = 'vocab-manual-list__top';

        const wordSpan = document.createElement('span');
        wordSpan.className = 'vocab-manual-list__word';
        wordSpan.textContent = w.word;

        const rm = document.createElement('button');
        rm.type = 'button';
        rm.className = 'btn btn-ghost vocab-manual-list__remove';
        rm.textContent = 'Remove';
        rm.addEventListener('click', () => {
            removeManualWordFromFolder(folder.id, w.id);
            renderVocabularyDashboard(container);
        });

        top.appendChild(wordSpan);
        top.appendChild(rm);

        const metaSpan = document.createElement('span');
        metaSpan.className = 'vocab-manual-list__meta';
        const defShort = (w.definition || '').trim();
        const defPreview =
            defShort.length > 100 ? `${defShort.slice(0, 100)}…` : defShort || '—';
        metaSpan.textContent = `${w.translation || '—'} · ${defPreview}`;

        li.appendChild(top);
        li.appendChild(metaSpan);
        list.appendChild(li);
    });

    card.appendChild(header);
    card.appendChild(form);
    card.appendChild(list);
    return card;
}

/**
 * Dashboard: search, Auto-Saved (reading) by date, Custom Folders + manual words.
 * @param {HTMLElement} container
 */
export function renderVocabularyDashboard(container) {
    if (!container) return;

    const prevInput = container.querySelector('.vocab-dash-search');
    const qRaw = prevInput ? prevInput.value : container.getAttribute('data-vocab-search') || '';
    const q = String(qRaw).trim();
    container.setAttribute('data-vocab-search', q);
    const ql = q.toLowerCase();

    container.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'vocab-dash';
    container.appendChild(wrap);

    const searchWrap = document.createElement('div');
    searchWrap.className = 'vocab-dash-search-wrap';
    const searchInput = document.createElement('input');
    searchInput.type = 'search';
    searchInput.className = 'vocab-dash-search';
    searchInput.placeholder = 'Search reading saves and folder words…';
    searchInput.value = q;
    searchInput.setAttribute('aria-label', 'Search vocabulary');
    searchInput.addEventListener('input', () => {
        container.setAttribute('data-vocab-search', searchInput.value);
        renderVocabularyDashboard(container);
    });
    searchWrap.appendChild(searchInput);
    wrap.appendChild(searchWrap);

    const autoSection = document.createElement('section');
    autoSection.className = 'vocab-dash-section';
    const autoH = document.createElement('h3');
    autoH.className = 'vocab-dash-section-title';
    autoH.textContent = 'Auto-Saved (Reading)';
    autoSection.appendChild(autoH);

    const autoAll = readVocabulary();
    const autoFiltered = ql ? autoAll.filter((it) => autoItemMatchesSearch(it, ql)) : autoAll;

    if (!autoFiltered.length) {
        const empty = document.createElement('p');
        empty.className = 'vocab-dash-empty';
        empty.textContent = autoAll.length
            ? 'No reading saves match your search.'
            : 'No words yet. Use “Add to Vocab” on a reading passage.';
        autoSection.appendChild(empty);
    } else {
        groupAutoItemsByDate(autoFiltered).forEach(({ label, items }) => {
            const gh = document.createElement('h4');
            gh.className = 'vocab-dash-date-group';
            gh.textContent = label;
            autoSection.appendChild(gh);
            const grid = document.createElement('div');
            grid.className = 'vocab-auto-grid';
            items.forEach((item) => appendReadingFlipCard(grid, item, container));
            autoSection.appendChild(grid);
        });
    }
    wrap.appendChild(autoSection);

    const folderSection = document.createElement('section');
    folderSection.className = 'vocab-dash-section';
    const folderHead = document.createElement('div');
    folderHead.className = 'vocab-dash-section-head';
    const folderH = document.createElement('h3');
    folderH.className = 'vocab-dash-section-title';
    folderH.textContent = 'Custom Folders';
    const createBtn = document.createElement('button');
    createBtn.type = 'button';
    createBtn.className = 'btn btn-signup vocab-dash-create-folder';
    createBtn.textContent = 'Create Folder';
    createBtn.addEventListener('click', () => {
        const name = window.prompt('Folder name', 'New folder');
        if (name === null) return;
        createManualFolder(name);
        renderVocabularyDashboard(container);
    });
    folderHead.appendChild(folderH);
    folderHead.appendChild(createBtn);
    folderSection.appendChild(folderHead);

    const foldersWrap = document.createElement('div');
    foldersWrap.className = 'vocab-folder-grid';

    const state = readManualFoldersState();
    const folders = state.folders || [];

    const displayFolders = !ql
        ? folders.map((f) => ({ ...f, words: [...(f.words || [])] }))
        : folders
              .map((f) => {
                  const nameHit = f.name.toLowerCase().includes(ql);
                  const allWords = f.words || [];
                  if (nameHit) return { ...f, words: [...allWords] };
                  return {
                      ...f,
                      words: allWords.filter((w) => manualWordMatchesSearch(w, ql))
                  };
              })
              .filter(
                  (f) =>
                      (f.words && f.words.length > 0) ||
                      (!ql ? true : f.name.toLowerCase().includes(ql))
              );

    if (!folders.length) {
        const emptyF = document.createElement('p');
        emptyF.className = 'vocab-dash-empty';
        emptyF.textContent = 'Create a folder to add your own words.';
        folderSection.appendChild(emptyF);
    } else if (!displayFolders.length) {
        const emptyF = document.createElement('p');
        emptyF.className = 'vocab-dash-empty';
        emptyF.textContent = 'No folders match your search.';
        folderSection.appendChild(emptyF);
    } else {
        displayFolders.forEach((f) => {
            foldersWrap.appendChild(buildFolderCard(f, container));
        });
        folderSection.appendChild(foldersWrap);
    }

    wrap.appendChild(folderSection);
}
