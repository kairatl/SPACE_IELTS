/**
 * Universal reading test engine: loads JSON from /data/{testId}.json, renders by question type, validates answers.
 */

const DEFAULT_TEST_ID = 'cam20_t1';
const TEST_ID_PATTERN = /^[a-z0-9_-]+$/i;

function getTestIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const raw = (params.get('test') || '').trim();
    const candidate = raw || DEFAULT_TEST_ID;
    return TEST_ID_PATTERN.test(candidate) ? candidate : DEFAULT_TEST_ID;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatParagraphLetterBold(escapedPara) {
    return escapedPara.replace(/^([A-Z])\.\s/, '<strong class="passage-para-letter">$1.</strong> ');
}

function renderReadingPassage(part) {
    let html = '';
    if (part.passage_title) {
        html += `<h2 class="passage-panel-title">${escapeHtml(part.passage_title)}</h2>`;
    }
    if (part.passage_subtitle) {
        html += `<p class="passage-panel-subtitle">${escapeHtml(part.passage_subtitle)}</p>`;
    }
    const body = part.passage_text || '';
    const blocks = body.split(/\n+/).map((block) => block.trim()).filter(Boolean);
    blocks.forEach((para) => {
        const esc = escapeHtml(para);
        const inner = formatParagraphLetterBold(esc);
        html += `<p>${inner}</p>`;
    });
    return html;
}

function renderTextWithSections(text) {
    const parts = text.split(/\[\[([^\]]+)\]\]/);
    let html = '';
    for (let i = 0; i < parts.length; i++) {
        if (i % 2 === 0) {
            html += escapeHtml(parts[i]);
        } else {
            html += `<div class="section-title">${escapeHtml(parts[i])}</div>`;
        }
    }
    return html;
}

function renderGapFillParagraph(template, gapQuestions) {
    const gapByPlaceholder = {};
    gapQuestions.forEach((q) => {
        gapByPlaceholder[String(q.number)] = q;
    });
    const parts = template.split(/\{\{(\d+)\}\}/);
    let html = '';
    for (let i = 0; i < parts.length; i++) {
        if (i % 2 === 0) {
            html += renderTextWithSections(parts[i]);
        } else {
            const key = parts[i];
            const q = gapByPlaceholder[key];
            const n = q ? q.number : key;
            const nStr = String(n);
            html += `<span class="gap-slot-wrap" id="question-row-${nStr}"><span class="gap-q-num" data-q-number="${escapeHtml(nStr)}">${escapeHtml(nStr)}</span><input type="text" class="gap-input" id="q-${nStr}" autocomplete="off" spellcheck="false" aria-label="Question ${escapeHtml(nStr)}"></span>`;
        }
    }
    return html;
}

function buildGapFillFallback(gapQuestions) {
    const sorted = [...gapQuestions].sort((a, b) => a.number - b.number);
    return sorted.map((q) => q.note.replace(/___+/g, `{{${q.number}}}`)).join('\n\n');
}

function answersMatch(user, correct) {
    const u = user.trim();
    const c = String(correct).trim();
    if (/^\d+$/.test(c)) return u === c;
    return u.toLowerCase() === c.toLowerCase();
}

/** Official-style bands for 30–40; lower raw scores use a standard extension. */
function rawScoreToBand40(raw) {
    const r = Math.max(0, Math.min(40, Math.floor(Number(raw))));
    if (r >= 39) return 9.0;
    if (r >= 37) return 8.5;
    if (r >= 35) return 8.0;
    if (r >= 33) return 7.5;
    if (r >= 30) return 7.0;
    if (r >= 27) return 6.5;
    if (r >= 23) return 6.0;
    if (r >= 19) return 5.5;
    if (r >= 15) return 5.0;
    if (r >= 13) return 4.5;
    if (r >= 10) return 4.0;
    if (r >= 8) return 3.5;
    if (r >= 6) return 3.0;
    if (r >= 4) return 2.5;
    if (r >= 3) return 2.0;
    if (r >= 2) return 1.5;
    if (r >= 1) return 1.0;
    return 0;
}

function formatBandDisplay(band) {
    return Number(band).toFixed(1);
}

function formatCorrectAnswerDisplay(q) {
    const a = String(q.correct_answer).trim();
    if (q.type === 'true_false' || q.type === 'yes_no_not_given') return a.toUpperCase();
    return a;
}

function wrapHighlightInRoot(root, searchText, qNum) {
    if (!root || !searchText) return false;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    const nodes = [];
    let n;
    while ((n = walker.nextNode())) {
        nodes.push(n);
    }
    for (let i = 0; i < nodes.length; i++) {
        const textNode = nodes[i];
        if (!textNode.parentNode) continue;
        if (textNode.parentElement && textNode.parentElement.closest('.passage-highlight')) continue;
        const t = textNode.textContent;
        const idx = t.indexOf(searchText);
        if (idx === -1) continue;
        const parent = textNode.parentNode;
        const before = t.slice(0, idx);
        const after = t.slice(idx + searchText.length);
        const mark = document.createElement('mark');
        mark.className = 'passage-highlight';
        mark.setAttribute('data-question', String(qNum));
        mark.appendChild(document.createTextNode(searchText));
        const badge = document.createElement('span');
        badge.className = 'passage-highlight__badge';
        badge.textContent = '[' + qNum + ']';
        mark.appendChild(badge);
        if (after) {
            parent.insertBefore(document.createTextNode(after), textNode.nextSibling);
        }
        parent.insertBefore(mark, textNode.nextSibling);
        if (before) {
            textNode.textContent = before;
        } else {
            parent.removeChild(textNode);
        }
        return true;
    }
    return false;
}

function applyReviewHighlightsForParts(parts) {
    const jobs = [];
    parts.forEach((part, partIndex) => {
        (part.questions || []).forEach((q) => {
            if (q.highlight_text) {
                jobs.push({ partIndex, q, len: (q.highlight_text || '').length });
            }
        });
    });
    jobs.sort((a, b) => b.len - a.len);
    jobs.forEach(({ partIndex, q }) => {
        const root = document.getElementById('passage-part-' + partIndex);
        if (!root) return;
        const ok = wrapHighlightInRoot(root, q.highlight_text, q.number);
        if (!ok && typeof console !== 'undefined' && console.warn) {
            console.warn('Highlight not found for Q' + q.number);
        }
    });
}

function removePassageHighlights() {
    document.querySelectorAll('mark.passage-highlight').forEach((mark) => {
        let plain = '';
        mark.childNodes.forEach((node) => {
            if (node.nodeType === Node.TEXT_NODE) plain += node.textContent;
        });
        mark.parentNode.replaceChild(document.createTextNode(plain), mark);
    });
}

function removeQuestionFeedbacks() {
    document.querySelectorAll('.question-feedback').forEach((el) => el.remove());
}

function injectWrongFeedbacks(allQuestions, isQuestionCorrectFn, escapeHtmlFn) {
    removeQuestionFeedbacks();
    allQuestions.forEach((q) => {
        if (isQuestionCorrectFn(q)) return;
        const row = document.getElementById('question-row-' + q.number);
        if (!row) return;
        const div = document.createElement('div');
        div.className = 'question-feedback question-feedback--wrong';
        const ans = escapeHtmlFn(formatCorrectAnswerDisplay(q));
        div.innerHTML =
            '<div class="question-feedback__row"><span class="question-feedback__x" aria-hidden="true">✕</span>' +
            '<span class="question-feedback__answer">Answer: ' +
            ans +
            '</span></div>';
        if (q.explanation) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'question-feedback__explain';
            btn.textContent = 'Explain more';
            const body = document.createElement('div');
            body.className = 'question-feedback__explain-body';
            body.hidden = true;
            body.textContent = q.explanation;
            btn.addEventListener('click', () => {
                body.hidden = !body.hidden;
            });
            div.appendChild(btn);
            div.appendChild(body);
        }
        if (row.classList.contains('gap-slot-wrap') && row.parentNode) {
            row.parentNode.insertBefore(div, row.nextSibling);
        } else {
            row.appendChild(div);
        }
    });
}

function updateFooterChipsAfterSubmit(allQuestions, isQuestionCorrectFn) {
    document.querySelectorAll('.q-num-chip').forEach((chip) => {
        const num = parseInt(chip.dataset.questionNum, 10);
        const q = allQuestions.find((x) => x.number === num);
        if (!q) return;
        chip.classList.remove('q-num-chip--correct', 'q-num-chip--wrong');
        chip.classList.add(isQuestionCorrectFn(q) ? 'q-num-chip--correct' : 'q-num-chip--wrong');
    });
}

function letterSelectOptions(letterCount) {
    const n = Math.min(26, Math.max(1, letterCount));
    let html = '';
    for (let i = 0; i < n; i++) {
        const L = String.fromCharCode(65 + i);
        html += `<option value="${L}">${L}</option>`;
    }
    return html;
}

function sectionLetterOptions() {
    return letterSelectOptions(7);
}

function minQuestionNumber(questionList) {
    return questionList.length ? Math.min(...questionList.map((q) => q.number)) : Infinity;
}

function getSectionParagraphIntroHtml(part) {
    if (part.section_match_paragraph_note) {
        return part.section_match_paragraph_note;
    }
    const n = part.section_paragraph_count || 7;
    const words = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
    const countWord = words[n] || String(n);
    const last = String.fromCharCode(64 + Math.min(n, 26));
    return `Reading Passage has ${countWord} paragraphs, <span class="instruction-text">A–${last}</span>.`;
}

function getSectionLetterRangeLabel(part) {
    const n = part.section_paragraph_count || 7;
    const last = String.fromCharCode(64 + Math.min(n, 26));
    return `A–${last}`;
}

function peopleLetterOptions() {
    return ['A', 'B', 'C'].map((L) => `<option value="${L}">${L}</option>`).join('');
}

/**
 * Maps JSON question `type` to UI/validation behaviour.
 * Used to branch rendering and checkAnswers(); extend when adding new JSON types.
 */
function getQuestionControlKind(type) {
    switch (type) {
        case 'true_false':
            return 'tf_buttons';
        case 'yes_no_not_given':
            return 'tri_state_radio';
        case 'gap_fill':
            return 'text_input';
        case 'multiple_choice':
            return 'radio_letters';
        case 'sentence_ending':
        case 'section_match':
        case 'people_match':
            return 'letter_select';
        default:
            return 'unknown';
    }
}

function bindTrueFalseButtons(containerEl) {
    const groups = containerEl.querySelectorAll('.tf-btn-group[data-tf-group]');
    groups.forEach((group) => {
        const btns = group.querySelectorAll('.tf-answer-btn');
        btns.forEach((btn) => {
            btn.addEventListener('click', () => {
                btns.forEach((b) => {
                    b.classList.remove('tf-answer-btn--selected');
                    b.setAttribute('aria-pressed', 'false');
                });
                btn.classList.add('tf-answer-btn--selected');
                btn.setAttribute('aria-pressed', 'true');
            });
        });
    });
}

function getTrueFalseSelectedValue(qNumber) {
    const group = document.getElementById(`fs-tf-${qNumber}`);
    if (!group) return '';
    const selected = group.querySelector('.tf-answer-btn--selected');
    if (!selected) return '';
    const raw = selected.getAttribute('data-tf-value') || selected.dataset.tfValue || '';
    return normalizeTfNgAnswer(raw);
}

function renderUnsupportedQuestions(questions, container) {
    if (!questions.length) return;
    const sec = document.createElement('section');
    sec.className = 'tf-block question-block';
    sec.innerHTML =
        '<h2 class="task-heading">Other question types</h2>' +
        '<p class="tf-boxes-hint">These items use types not yet implemented in the engine.</p>' +
        '<div class="unsupported-questions-list"></div>';
    const list = sec.querySelector('.unsupported-questions-list');
    questions.forEach((q) => {
        const item = document.createElement('div');
        item.className = 'tf-item';
        item.id = 'question-row-' + q.number;
        item.innerHTML = `<p class="tf-item-label">Question ${q.number}</p><p class="tf-statement">Unsupported type: <code>${escapeHtml(String(q.type))}</code></p>`;
        list.appendChild(item);
    });
    container.appendChild(sec);
}

function renderPartQuestions(part, container) {
    const questions = part.questions || [];
    const unsupported = questions.filter((q) => getQuestionControlKind(q.type) === 'unknown');

    const mcQuestions = questions.filter((q) => q.type === 'multiple_choice');
    const sentenceEndQuestions = questions.filter((q) => q.type === 'sentence_ending');
    const ynngQuestions = questions.filter((q) => q.type === 'yes_no_not_given');
    const tfQuestions = questions.filter((q) => q.type === 'true_false');
    const sectionQuestions = questions.filter((q) => q.type === 'section_match');
    const peopleQuestions = questions.filter((q) => q.type === 'people_match');
    const gapQuestions = questions.filter((q) => q.type === 'gap_fill');

    function appendGapFillBlock() {
        const gapTemplate = part.gap_fill_paragraph || buildGapFillFallback(gapQuestions);
        if (!gapQuestions.length || !gapTemplate) return;
        const gNums = gapQuestions.map((q) => q.number);
        const gMin = Math.min(...gNums);
        const gMax = Math.max(...gNums);
        const taskTitle = part.gap_fill_task_title || `Questions ${gMin}–${gMax}`;
        const gapLead = part.gap_fill_lead || 'Complete the notes below.';
        const gapInstr =
            part.gap_fill_instructions ||
            'Choose <span class="instruction-text">one word and/or a number only</span> from the passage for each answer.';
        const wrap = document.createElement('div');
        wrap.className = 'gap-fill-block';
        wrap.innerHTML = `
                    <h2 class="task-heading">${escapeHtml(taskTitle)}</h2>
                    <p class="gap-fill-lead">${escapeHtml(gapLead)}</p>
                    <p class="gap-fill-instructions">${gapInstr}</p>
                    <div class="gap-fill-body">${renderGapFillParagraph(gapTemplate, gapQuestions)}</div>
                `;
        container.appendChild(wrap);
    }

    function appendMCSection() {
        if (!mcQuestions.length) return;
        const nums = mcQuestions.map((q) => q.number);
        const mcMin = Math.min(...nums);
        const mcMax = Math.max(...nums);
        const sec = document.createElement('section');
        sec.className = 'tf-block question-block';
        const mcIntroHtml =
            part.mc_task_intro_html ||
            `
                    <p class="match-instructions"><span class="instruction-text">CHOOSE</span> THE CORRECT LETTER, <span class="instruction-text">A</span>, <span class="instruction-text">B</span>, <span class="instruction-text">C</span> OR <span class="instruction-text">D</span>.</p>
                    <p class="tf-boxes-hint">Write the correct letter in boxes on your answer sheet.</p>
                `;
        sec.innerHTML = `
                    <h2 class="task-heading">Questions ${mcMin}–${mcMax}</h2>
                    ${mcIntroHtml}
                    <div class="mc-questions-list"></div>
                `;
        container.appendChild(sec);
        const list = sec.querySelector('.mc-questions-list');
        mcQuestions.forEach((q) => {
            const n = q.number;
            const opts = (q.options || [])
                .map((opt) => {
                    const L = escapeHtml(opt.letter);
                    const t = escapeHtml(opt.text);
                    return `<label class="mc-option"><input type="radio" name="mc-${n}" value="${L}"> <span class="mc-letter"><span class="instruction-text">${L}</span></span> ${t}</label>`;
                })
                .join('');
            const item = document.createElement('div');
            item.className = 'tf-item';
            item.innerHTML = `
                        <p class="tf-item-label">Question ${n}</p>
                        <fieldset class="mc-fieldset" id="fs-mc-${n}" aria-labelledby="mc-prompt-${n}">
                            <p class="mc-prompt" id="mc-prompt-${n}">${escapeHtml(q.prompt || '')}</p>
                            <div class="mc-options">${opts}</div>
                        </fieldset>
                    `;
            item.id = 'question-row-' + n;
            list.appendChild(item);
        });
    }

    function appendSentenceEndingSection() {
        if (!sentenceEndQuestions.length) return;
        const endings = part.sentence_endings || [];
        const endingItems = endings.map((e) => `<li>${escapeHtml(e.text)}</li>`).join('');
        const nums = sentenceEndQuestions.map((q) => q.number);
        const seMin = Math.min(...nums);
        const seMax = Math.max(...nums);
        const letterCount = Math.max(7, endings.length);
        const rangeLabel = `A–${String.fromCharCode(64 + letterCount)}`;
        const sec = document.createElement('section');
        sec.className = 'tf-block question-block';
        sec.innerHTML = `
                    <h2 class="task-heading">Questions ${seMin}–${seMax}</h2>
                    <p class="match-instructions">Complete each sentence with the correct ending, <span class="instruction-text">${rangeLabel}</span>, below.</p>
                    <div class="endings-list-block">
                        <p>Endings</p>
                        <ol class="endings-lettered-list" type="A">${endingItems}</ol>
                    </div>
                    <div class="sentence-ending-questions-list"></div>
                `;
        container.appendChild(sec);
        const list = sec.querySelector('.sentence-ending-questions-list');
        sentenceEndQuestions.forEach((q) => {
            const n = q.number;
            const item = document.createElement('div');
            item.className = 'tf-item';
            item.innerHTML = `
                        <p class="tf-item-label">Question ${n}</p>
                        <p class="tf-statement">${escapeHtml(q.sentence_start)}</p>
                        <div class="tf-select-wrap">
                            <select id="q-${n}" aria-label="Question ${n}">
                                <option value="">Select...</option>
                                ${letterSelectOptions(letterCount)}
                            </select>
                        </div>
                    `;
            item.id = 'question-row-' + n;
            list.appendChild(item);
        });
    }

    function appendYnngSection() {
        if (!ynngQuestions.length) return;
        const nums = ynngQuestions.map((q) => q.number);
        const yMin = Math.min(...nums);
        const yMax = Math.max(...nums);
        const ynLeadHtml =
            part.ynng_instruction_lead ||
            'Do the following statements agree with the claims of the writer in Reading Passage?';
        const ynRulesHtml =
            part.ynng_rules_html ||
            `<ul class="tf-rules">
                        <li><span class="instruction-text">YES</span> if the statement agrees with the claims of the writer</li>
                        <li><span class="instruction-text">NO</span> if the statement contradicts the claims of the writer</li>
                        <li><span class="instruction-text">NOT GIVEN</span> if it is impossible to say what the writer thinks about this</li>
                    </ul>`;
        const sec = document.createElement('section');
        sec.className = 'tf-block question-block';
        sec.innerHTML = `
                    <h2 class="task-heading">Questions ${yMin}–${yMax}</h2>
                    <p class="tf-lead">${ynLeadHtml}</p>
                    <p class="tf-boxes-hint">In boxes on your answer sheet, write</p>
                    ${ynRulesHtml}
                    <div class="ynng-questions-list"></div>
                `;
        container.appendChild(sec);
        const list = sec.querySelector('.ynng-questions-list');
        ynngQuestions.forEach((q) => {
            const n = q.number;
            const item = document.createElement('div');
            item.className = 'tf-item';
            item.innerHTML = `
                        <p class="tf-item-label">Question ${n}</p>
                        <p class="tf-statement">${escapeHtml(q.statement)}</p>
                        <fieldset class="ynng-fieldset" id="fs-ynng-${n}" aria-label="Question ${n}">
                            <div class="ynng-options">
                                <label class="ynng-option"><input type="radio" name="ynng-${n}" value="YES"> <span class="instruction-text">YES</span></label>
                                <label class="ynng-option"><input type="radio" name="ynng-${n}" value="NO"> <span class="instruction-text">NO</span></label>
                                <label class="ynng-option"><input type="radio" name="ynng-${n}" value="NOT GIVEN"> <span class="instruction-text">NOT GIVEN</span></label>
                            </div>
                        </fieldset>
                    `;
            item.id = 'question-row-' + n;
            list.appendChild(item);
        });
    }

    function appendTrueFalseSection() {
        if (!tfQuestions.length) return;
        const tfNums = tfQuestions.map((q) => q.number);
        const tfMin = Math.min(...tfNums);
        const tfMax = Math.max(...tfNums);
        const tfSection = document.createElement('section');
        tfSection.className = 'tf-block question-block';
        tfSection.innerHTML = `
                    <h2 class="task-heading">Questions ${tfMin}–${tfMax}</h2>
                    <p class="tf-lead">Do the following statements agree with the information given in Reading Passage?</p>
                    <p class="tf-boxes-hint">In boxes <strong>${tfMin}–${tfMax}</strong> on your answer sheet, write</p>
                    <ul class="tf-rules">
                        <li><span class="instruction-text">TRUE</span> if the statement agrees with the information</li>
                        <li><span class="instruction-text">FALSE</span> if the statement contradicts the information</li>
                        <li><span class="instruction-text">NOT GIVEN</span> if there is no information on this</li>
                    </ul>
                    <div class="tf-questions-list"></div>
                `;
        container.appendChild(tfSection);
        const tfList = tfSection.querySelector('.tf-questions-list');
        tfQuestions.forEach((q) => {
            const n = q.number;
            const item = document.createElement('div');
            item.className = 'tf-item';
            item.innerHTML = `
                        <p class="tf-item-label">Question ${n}</p>
                        <p class="tf-statement">${escapeHtml(q.statement)}</p>
                        <div class="tf-btn-group" id="fs-tf-${n}" data-tf-group="${n}" role="group" aria-label="Question ${n}: TRUE, FALSE or NOT GIVEN">
                            <button type="button" class="tf-answer-btn" data-tf-value="TRUE" aria-pressed="false"><span class="instruction-text">TRUE</span></button>
                            <button type="button" class="tf-answer-btn" data-tf-value="FALSE" aria-pressed="false"><span class="instruction-text">FALSE</span></button>
                            <button type="button" class="tf-answer-btn" data-tf-value="NOT GIVEN" aria-pressed="false"><span class="instruction-text">NOT GIVEN</span></button>
                        </div>
                    `;
            item.id = 'question-row-' + n;
            tfList.appendChild(item);
        });
        bindTrueFalseButtons(tfSection);
    }

    function appendSectionMatchSection() {
        if (!sectionQuestions.length) return;
        const nums = sectionQuestions.map((q) => q.number);
        const smMin = Math.min(...nums);
        const smMax = Math.max(...nums);
        const sec = document.createElement('section');
        sec.className = 'tf-block question-block';
        const introPara = getSectionParagraphIntroHtml(part);
        const letterRange = getSectionLetterRangeLabel(part);
        const letterOpts = letterSelectOptions(part.section_paragraph_count || 7);
        const matchLine =
            part.section_match_question_line ||
            'Which section contains the following information?';
        sec.innerHTML = `
                    <h2 class="task-heading">Questions ${smMin}–${smMax}</h2>
                    <p class="match-instructions">${introPara}</p>
                    <p class="match-instructions">${escapeHtml(matchLine)}</p>
                    <p class="tf-boxes-hint">Write the correct letter, <span class="instruction-text">${letterRange}</span>, in boxes on your answer sheet.</p>
                    <p class="tf-boxes-hint"><strong>NB</strong> You may use any letter more than once.</p>
                    <div class="tf-questions-list"></div>
                `;
        container.appendChild(sec);
        const list = sec.querySelector('.tf-questions-list');
        sectionQuestions.forEach((q) => {
            const n = q.number;
            const item = document.createElement('div');
            item.className = 'tf-item';
            item.innerHTML = `
                        <p class="tf-item-label">Question ${n}</p>
                        <p class="tf-statement">${escapeHtml(q.statement)}</p>
                        <div class="tf-select-wrap">
                            <select id="q-${n}" aria-label="Question ${n}">
                                <option value="">Select...</option>
                                ${letterOpts}
                            </select>
                        </div>
                    `;
            item.id = 'question-row-' + n;
            list.appendChild(item);
        });
    }

    function appendPeopleMatchSection() {
        if (!peopleQuestions.length) return;
        const nums = peopleQuestions.map((q) => q.number);
        const pmMin = Math.min(...nums);
        const pmMax = Math.max(...nums);
        const peopleList = part.people_match_list || [];
        const peopleLines = peopleList
            .map((p) => `<li><span class="instruction-text">${escapeHtml(p.letter)}</span> ${escapeHtml(p.name)}</li>`)
            .join('');
        const sec = document.createElement('section');
        sec.className = 'tf-block question-block';
        sec.innerHTML = `
                    <h2 class="task-heading">Questions ${pmMin}–${pmMax}</h2>
                    <p class="match-instructions">Look at the following statements and the list of people below.</p>
                    <p class="match-instructions">Match each statement with the correct person, <span class="instruction-text">A</span>, <span class="instruction-text">B</span>, or <span class="instruction-text">C</span>.</p>
                    <p class="tf-boxes-hint"><strong>NB</strong> You may use any letter more than once.</p>
                    <div class="people-list-block">
                        <p>List of People</p>
                        <ul>${peopleLines}</ul>
                    </div>
                    <div class="tf-questions-list"></div>
                `;
        container.appendChild(sec);
        const list = sec.querySelector('.tf-questions-list');
        peopleQuestions.forEach((q) => {
            const n = q.number;
            const item = document.createElement('div');
            item.className = 'tf-item';
            item.innerHTML = `
                        <p class="tf-item-label">Question ${n}</p>
                        <p class="tf-statement">${escapeHtml(q.statement)}</p>
                        <div class="tf-select-wrap">
                            <select id="q-${n}" aria-label="Question ${n}">
                                <option value="">Select...</option>
                                ${peopleLetterOptions()}
                            </select>
                        </div>
                    `;
            item.id = 'question-row-' + n;
            list.appendChild(item);
        });
    }

    const orderedBlocks = [
        { list: gapQuestions, run: appendGapFillBlock },
        { list: mcQuestions, run: appendMCSection },
        { list: sentenceEndQuestions, run: appendSentenceEndingSection },
        { list: ynngQuestions, run: appendYnngSection },
        { list: tfQuestions, run: appendTrueFalseSection },
        { list: sectionQuestions, run: appendSectionMatchSection },
        { list: peopleQuestions, run: appendPeopleMatchSection }
    ]
        .filter((b) => b.list.length)
        .sort((a, b) => minQuestionNumber(a.list) - minQuestionNumber(b.list));

    orderedBlocks.forEach((b) => b.run());

    renderUnsupportedQuestions(unsupported, container);
}

function collectAllQuestions(parts) {
    return parts.flatMap((p) => p.questions || []);
}

function normalizeLetterAnswer(val) {
    return val.trim().toUpperCase();
}

function normalizeTfNgAnswer(val) {
    return val.trim().toUpperCase().replace(/\s+/g, ' ');
}

function isQuestionCorrect(q) {
    if (q.type === 'gap_fill') {
        const el = document.getElementById(`q-${q.number}`);
        if (!el) return false;
        return answersMatch(el.value, q.correct_answer);
    }
    if (q.type === 'multiple_choice') {
        const fs = document.getElementById(`fs-mc-${q.number}`);
        if (!fs) return false;
        const picked = fs.querySelector(`input[name="mc-${q.number}"]:checked`);
        const val = picked ? picked.value.trim().toUpperCase() : '';
        return val === String(q.correct_answer).trim().toUpperCase();
    }
    if (q.type === 'yes_no_not_given') {
        const fs = document.getElementById(`fs-ynng-${q.number}`);
        if (!fs) return false;
        const picked = fs.querySelector(`input[name="ynng-${q.number}"]:checked`);
        const val = picked ? normalizeTfNgAnswer(picked.value) : '';
        const expected = normalizeTfNgAnswer(String(q.correct_answer));
        return val === expected;
    }
    if (q.type === 'true_false') {
        const val = getTrueFalseSelectedValue(q.number);
        const expected = normalizeTfNgAnswer(String(q.correct_answer));
        return val === expected;
    }
    const el = document.getElementById(`q-${q.number}`);
    if (!el) return false;
    const val = normalizeLetterAnswer(el.value);
    return val === String(q.correct_answer).trim().toUpperCase();
}

function checkAnswersVisual(allQuestions) {
    allQuestions.forEach((q) => {
        if (q.type === 'gap_fill') {
            const el = document.getElementById(`q-${q.number}`);
            if (!el) return;
            el.classList.remove('gap-input--correct', 'gap-input--wrong');
            const ok = answersMatch(el.value, q.correct_answer);
            el.classList.add(ok ? 'gap-input--correct' : 'gap-input--wrong');
            return;
        }
        if (q.type === 'multiple_choice') {
            const fs = document.getElementById(`fs-mc-${q.number}`);
            if (!fs) return;
            fs.classList.remove('mc-fieldset--correct', 'mc-fieldset--wrong');
            const picked = fs.querySelector(`input[name="mc-${q.number}"]:checked`);
            const val = picked ? picked.value.trim().toUpperCase() : '';
            const expected = String(q.correct_answer).trim().toUpperCase();
            const ok = val === expected;
            fs.classList.add(ok ? 'mc-fieldset--correct' : 'mc-fieldset--wrong');
            return;
        }
        if (q.type === 'yes_no_not_given') {
            const fs = document.getElementById(`fs-ynng-${q.number}`);
            if (!fs) return;
            fs.classList.remove('ynng-fieldset--correct', 'ynng-fieldset--wrong');
            const picked = fs.querySelector(`input[name="ynng-${q.number}"]:checked`);
            const val = picked ? normalizeTfNgAnswer(picked.value) : '';
            const expected = normalizeTfNgAnswer(String(q.correct_answer));
            const ok = val === expected;
            fs.classList.add(ok ? 'ynng-fieldset--correct' : 'ynng-fieldset--wrong');
            return;
        }
        if (q.type === 'true_false') {
            const group = document.getElementById(`fs-tf-${q.number}`);
            if (!group) return;
            group.classList.remove('tf-btn-group--correct', 'tf-btn-group--wrong');
            const val = getTrueFalseSelectedValue(q.number);
            const expected = normalizeTfNgAnswer(String(q.correct_answer));
            const ok = val === expected;
            group.classList.add(ok ? 'tf-btn-group--correct' : 'tf-btn-group--wrong');
            return;
        }
        const el = document.getElementById(`q-${q.number}`);
        if (!el) return;
        el.classList.remove('select-correct', 'select-wrong');
        const val = normalizeLetterAnswer(el.value);
        const expected = String(q.correct_answer).trim().toUpperCase();
        const ok = val === expected;
        el.classList.add(ok ? 'select-correct' : 'select-wrong');
    });
}

function initReadingTest() {
    const testParam = getTestIdFromUrl();
    const filePath = `data/${testParam}.json`;

    fetch(filePath)
        .then((res) => {
            if (!res.ok) throw new Error('Failed to load test: ' + res.status);
            return res.json();
        })
        .then((data) => {
            document.getElementById('test-title').innerText = data.title || 'Reading Practice';

            const parts = data.parts;
            if (!parts || !parts.length) {
                document.getElementById('left-panel').innerHTML =
                    '<p class="reading-passage" style="padding:40px">No passages configured.</p>';
                return;
            }

            const leftPanel = document.getElementById('left-panel');

            function setActivePart(index) {
                parts.forEach((_, j) => {
                    const p = document.getElementById(`passage-part-${j}`);
                    if (p) p.classList.toggle('active', j === index);
                    const qp = document.getElementById(`questions-part-${j}`);
                    if (qp) qp.classList.toggle('active', j === index);
                });
                document.querySelectorAll('.part-nav-block').forEach((block, j) => {
                    block.classList.toggle('part-nav-block--active', j === index);
                });
                document.querySelectorAll('.q-num-chip').forEach((chip) => {
                    const pi = parseInt(chip.dataset.partIndex, 10);
                    chip.classList.toggle('q-num-chip--in-active-part', pi === index);
                });
            }

            function scrollToQuestion(num) {
                requestAnimationFrame(() => {
                    const row = document.getElementById('question-row-' + num);
                    const el = row || document.getElementById('q-' + num);
                    if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                });
            }

            parts.forEach((part, i) => {
                const div = document.createElement('div');
                div.id = `passage-part-${i}`;
                div.className = 'passage-part reading-passage' + (i === 0 ? ' active' : '');
                div.innerHTML = renderReadingPassage(part);
                leftPanel.appendChild(div);
            });

            import('./vocabulary.js')
                .then((mod) => {
                    mod.attachVocabularyToPassagePanel(leftPanel);
                })
                .catch(() => {});

            const qRoot = document.getElementById('questions-container');
            qRoot.innerHTML = '';
            parts.forEach((part, i) => {
                const wrap = document.createElement('div');
                wrap.id = `questions-part-${i}`;
                wrap.className = 'questions-part' + (i === 0 ? ' active' : '');
                renderPartQuestions(part, wrap);
                qRoot.appendChild(wrap);
            });

            const allQuestions = collectAllQuestions(parts);
            const totalQuestions = allQuestions.length;

            function countCorrectAnswers() {
                return allQuestions.reduce((n, q) => n + (isQuestionCorrect(q) ? 1 : 0), 0);
            }

            function checkAnswers() {
                checkAnswersVisual(allQuestions);
            }

            const resultModal = document.getElementById('result-modal');
            const resultModalScore = document.getElementById('result-modal-score');
            const submitBtn = document.getElementById('submit-btn');
            const confirmModal = document.getElementById('confirm-modal');

            function showResultModal(correct, total, band) {
                const bandStr = formatBandDisplay(band);
                const incorrect = total - correct;
                resultModalScore.innerHTML = `Score: <strong>${correct}/${total}</strong> | Band: <strong>${bandStr}</strong><span class="result-modal__detail">Correct: ${correct} · Incorrect: ${incorrect}</span>`;
                resultModal.classList.add('result-modal--open');
                document.body.style.overflow = 'hidden';
            }

            function closeResultModal() {
                resultModal.classList.remove('result-modal--open');
                if (!confirmModal.classList.contains('confirm-modal--open')) {
                    document.body.style.overflow = '';
                }
            }

            function openConfirmModal() {
                confirmModal.classList.add('confirm-modal--open');
                document.body.style.overflow = 'hidden';
            }

            function closeConfirmModal() {
                confirmModal.classList.remove('confirm-modal--open');
                if (!resultModal.classList.contains('result-modal--open')) {
                    document.body.style.overflow = '';
                }
            }

            let timerIntervalId = null;

            function stopTimer() {
                if (timerIntervalId !== null) {
                    window.clearInterval(timerIntervalId);
                    timerIntervalId = null;
                }
            }

            let testHasFinished = false;

            async function runSubmittedTest() {
                if (testHasFinished) return;
                testHasFinished = true;
                closeConfirmModal();
                stopTimer();
                submitBtn.disabled = true;
                checkAnswers();
                document.body.classList.add('reading-review-mode');
                applyReviewHighlightsForParts(parts);
                injectWrongFeedbacks(allQuestions, isQuestionCorrect, escapeHtml);
                updateFooterChipsAfterSubmit(allQuestions, isQuestionCorrect);
                const correct = countCorrectAnswers();
                const band = rawScoreToBand40(correct);
                showResultModal(correct, totalQuestions, band);

                let isLoggedIn = false;
                try {
                    const mod = await import('./supabase-browser.js');
                    const supabase = await mod.getSupabaseBrowserClientAsync();
                    if (supabase) {
                        const {
                            data: { session }
                        } = await supabase.auth.getSession();
                        isLoggedIn = !!session;
                    }
                } catch (e) {
                    isLoggedIn = false;
                }

                if (isLoggedIn && window.spaceIELTSTestStorage) {
                    window.spaceIELTSTestStorage.saveTestResult({
                        date: Date.now(),
                        testParam,
                        score: correct,
                        band: band
                    });
                }

                const guestToast = document.getElementById('guest-result-toast');
                if (guestToast) {
                    guestToast.hidden = isLoggedIn;
                }
            }

            window.checkAnswers = runSubmittedTest;

            submitBtn.onclick = openConfirmModal;

            document.getElementById('confirm-modal-ok').onclick = () => {
                closeConfirmModal();
                void runSubmittedTest();
            };
            document.getElementById('confirm-modal-cancel').onclick = closeConfirmModal;
            confirmModal.addEventListener('click', (e) => {
                if (e.target === confirmModal) closeConfirmModal();
            });

            document.getElementById('result-modal-close').onclick = closeResultModal;
            resultModal.addEventListener('click', (e) => {
                if (e.target === resultModal) closeResultModal();
            });
            document.addEventListener('keydown', (e) => {
                if (e.key !== 'Escape') return;
                if (confirmModal.classList.contains('confirm-modal--open')) {
                    closeConfirmModal();
                    return;
                }
                if (resultModal.classList.contains('result-modal--open')) {
                    closeResultModal();
                }
            });

            const footer = document.getElementById('test-footer');
            footer.innerHTML = '';
            parts.forEach((part, partIndex) => {
                const nums = [...new Set((part.questions || []).map((q) => q.number))].sort((a, b) => a - b);
                const block = document.createElement('div');
                block.className = 'part-nav-block' + (partIndex === 0 ? ' part-nav-block--active' : '');
                block.dataset.partIndex = String(partIndex);
                block.setAttribute('role', 'button');
                block.tabIndex = 0;
                const title = 'Part ' + (partIndex + 1);
                block.innerHTML = `
                    <span class="part-nav-block__title">${escapeHtml(title)}</span>
                    <span class="part-nav-block__count">${nums.length} questions</span>
                    <div class="part-nav-block__nums"></div>
                `;
                const numsWrap = block.querySelector('.part-nav-block__nums');
                nums.forEach((num) => {
                    const chip = document.createElement('button');
                    chip.type = 'button';
                    chip.className =
                        'q-num-chip' + (partIndex === 0 ? ' q-num-chip--in-active-part' : '');
                    chip.textContent = String(num);
                    chip.dataset.partIndex = String(partIndex);
                    chip.dataset.questionNum = String(num);
                    chip.addEventListener('click', (e) => {
                        e.stopPropagation();
                        setActivePart(partIndex);
                        scrollToQuestion(num);
                    });
                    numsWrap.appendChild(chip);
                });
                block.addEventListener('click', (e) => {
                    if (e.target.closest('.q-num-chip')) return;
                    setActivePart(partIndex);
                });
                block.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (!e.target.closest('.q-num-chip')) setActivePart(partIndex);
                    }
                });
                footer.appendChild(block);
            });

            const timerEl = document.getElementById('reading-timer');
            const timerDigits = document.getElementById('timer-digits');
            let timeRemainingSec = 60 * 60;

            function formatHMS(totalSec) {
                const h = Math.floor(totalSec / 3600);
                const m = Math.floor((totalSec % 3600) / 60);
                const s = totalSec % 60;
                return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
            }

            function updateTimerVisual() {
                timerDigits.textContent = formatHMS(timeRemainingSec);
                timerEl.classList.toggle(
                    'reading-timer--warning',
                    timeRemainingSec <= 300 && timeRemainingSec >= 0
                );
            }

            function startReadingTimer() {
                timerIntervalId = window.setInterval(() => {
                    if (timeRemainingSec <= 0) {
                        if (timerIntervalId !== null) {
                            window.clearInterval(timerIntervalId);
                            timerIntervalId = null;
                        }
                        return;
                    }
                    timeRemainingSec -= 1;
                    updateTimerVisual();
                    if (timeRemainingSec === 0) {
                        if (timerIntervalId !== null) {
                            window.clearInterval(timerIntervalId);
                            timerIntervalId = null;
                        }
                        void runSubmittedTest();
                    }
                }, 1000);
            }

            function resetReadingTestForRetake() {
                const guestToast = document.getElementById('guest-result-toast');
                if (guestToast) guestToast.hidden = true;
                removePassageHighlights();
                removeQuestionFeedbacks();
                document.body.classList.remove('reading-review-mode');
                closeResultModal();
                closeConfirmModal();

                allQuestions.forEach((q) => {
                    if (q.type === 'gap_fill') {
                        const el = document.getElementById(`q-${q.number}`);
                        if (el) {
                            el.value = '';
                            el.classList.remove('gap-input--correct', 'gap-input--wrong');
                        }
                        return;
                    }
                    if (q.type === 'multiple_choice') {
                        const fs = document.getElementById(`fs-mc-${q.number}`);
                        if (fs) {
                            fs.querySelectorAll('input[type="radio"]').forEach((r) => {
                                r.checked = false;
                            });
                            fs.classList.remove('mc-fieldset--correct', 'mc-fieldset--wrong');
                        }
                        return;
                    }
                    if (q.type === 'yes_no_not_given') {
                        const fs = document.getElementById(`fs-ynng-${q.number}`);
                        if (fs) {
                            fs.querySelectorAll('input[type="radio"]').forEach((r) => {
                                r.checked = false;
                            });
                            fs.classList.remove('ynng-fieldset--correct', 'ynng-fieldset--wrong');
                        }
                        return;
                    }
                    if (q.type === 'true_false') {
                        const group = document.getElementById(`fs-tf-${q.number}`);
                        if (group) {
                            group.querySelectorAll('.tf-answer-btn').forEach((b) => {
                                b.classList.remove('tf-answer-btn--selected');
                                b.setAttribute('aria-pressed', 'false');
                            });
                            group.classList.remove('tf-btn-group--correct', 'tf-btn-group--wrong');
                        }
                        return;
                    }
                    const el = document.getElementById(`q-${q.number}`);
                    if (el) {
                        el.value = '';
                        el.classList.remove('select-correct', 'select-wrong');
                    }
                });

                document.querySelectorAll('.q-num-chip').forEach((chip) => {
                    chip.classList.remove('q-num-chip--correct', 'q-num-chip--wrong');
                });

                testHasFinished = false;
                submitBtn.disabled = false;
                stopTimer();
                timeRemainingSec = 60 * 60;
                updateTimerVisual();
                startReadingTimer();
                setActivePart(0);
            }

            startReadingTimer();

            const retakeParam = new URLSearchParams(window.location.search).get('retake');
            if (retakeParam && retakeParam === testParam) {
                resetReadingTestForRetake();
                history.replaceState({}, '', `test-reading?test=${encodeURIComponent(testParam)}`);
            }

            initReadingPanelResizer();
        })
        .catch((err) => {
            document.getElementById('test-title').innerText = 'Reading Practice';
            const left = document.getElementById('left-panel');
            if (left) {
                left.innerHTML =
                    '<p class="reading-passage" style="padding:40px">Could not load this test. Check the <code>?test=</code> id and that <code>data/' +
                    escapeHtml(testParam) +
                    '.json</code> exists.</p>';
            }
            const qc = document.getElementById('questions-container');
            if (qc) qc.innerHTML = '';
            if (typeof console !== 'undefined' && console.error) console.error(err);
        });
}

function initReadingPanelResizer() {
    const resizer = document.getElementById('resizer');
    const leftPanel = document.getElementById('left-panel');
    const rightPanel = document.getElementById('right-panel');
    if (!resizer || !leftPanel || !rightPanel) return;

    let isResizing = false;

    function isDesktopSplitLayout() {
        return window.matchMedia('(min-width: 1024px)').matches;
    }

    function applySplitPanels(pct) {
        const p = Math.max(20, Math.min(80, pct));
        leftPanel.style.flex = '0 0 ' + p + '%';
        leftPanel.style.width = p + '%';
        leftPanel.style.maxWidth = p + '%';
        const rightPct = 100 - p;
        rightPanel.style.flex = '0 0 calc(' + rightPct + '% - 8px)';
        rightPanel.style.width = 'calc(' + rightPct + '% - 8px)';
        rightPanel.style.maxWidth = 'calc(' + rightPct + '% - 8px)';
    }

    function resetSplitPanels() {
        leftPanel.style.width = '';
        leftPanel.style.flex = '';
        leftPanel.style.maxWidth = '';
        rightPanel.style.width = '';
        rightPanel.style.flex = '';
        rightPanel.style.maxWidth = '';
    }

    resizer.addEventListener('mousedown', (e) => {
        if (!isDesktopSplitLayout()) return;
        e.preventDefault();
        isResizing = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    });

    document.addEventListener('mouseup', () => {
        if (!isResizing) return;
        isResizing = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isResizing || !isDesktopSplitLayout()) return;
        const pct = (e.clientX / window.innerWidth) * 100;
        if (pct > 20 && pct < 80) {
            applySplitPanels(pct);
        }
    });

    window.addEventListener('resize', () => {
        if (!isDesktopSplitLayout()) {
            resetSplitPanels();
        }
    });
}

initReadingTest();
