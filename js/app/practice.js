function getLesson(id) {
    return lessonsData[id];
}

function getExercises(id) {
    const lesson = getLesson(id);
    return lesson && Array.isArray(lesson.exercises) ? lesson.exercises : [];
}

function escapeHtml(str) {
    if (str == null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function exerciseQuestionHeading(ex, index) {
    if (ex.question && String(ex.question).trim()) return ex.question;
    if (ex.text) {
        const t = ex.text.replace(/\s+/g, ' ').trim();
        return t.length > 140 ? `${t.slice(0, 137)}…` : t;
    }
    return `Question ${index + 1}`;
}

function getCorrectAnswerDisplay(ex) {
    if (ex.type === 'word_order') return ex.correct || '';
    if (ex.type === 'quiz') {
        const right = ex.options.find((o) => o.c);
        return right ? right.t : '';
    }
    if (ex.type === 'fill_blanks') return (ex.corrects || []).join(' · ');
    return '';
}

function getUserAnswerDisplay(ex, state) {
    if (!state.answered) return null;
    if (ex.type === 'word_order') {
        return state.userAnswer != null ? state.userAnswer : '';
    }
    if (ex.type === 'quiz') {
        if (state.userAnswer == null) return null;
        const opt = ex.options[state.userAnswer];
        return opt ? opt.t : '';
    }
    if (ex.type === 'fill_blanks') {
        return (ex.corrects || [])
            .map((_, i) => (state.blankValues[i] || '').trim() || '—')
            .join(' · ');
    }
    return '';
}

function renderPracticeResults(area) {
    const exercises = getExercises(practice.currentId);
    const states = practice.exerciseStates;
    const total = exercises.length;
    let correctCount = 0;
    for (let i = 0; i < total; i++) {
        if (states[i] && states[i].isCorrect === true) correctCount++;
    }
    const pct =
        total === 0 ? 0 : Math.round((correctCount / total) * 100);

    let headline = '';
    let subline = '';
    if (pct === 100) {
        headline =
            'Outstanding — you cleared every item in this practice set.';
        subline =
            'That kind of accuracy is what builds confidence under exam conditions. Bring this focus into your next lesson.';
    } else if (pct >= 80) {
        headline = 'Strong work — you are very close to full mastery.';
        subline =
            'The list below is your personal revision sheet. Read each explanation and try saying the correct version aloud.';
    } else if (pct >= 50) {
        headline =
            'You are building momentum — gaps like these are normal at this stage.';
        subline =
            'Treat the review as a checklist, not a verdict: understanding why each answer works matters more than the number alone.';
    } else {
        headline =
            'This set pushed you — that is how skills actually stick.';
        subline =
            'Walk through each explanation slowly and compare your answer to the model. Small fixes here carry straight into clearer Task 1 and Task 2 writing.';
    }

    const mistakeItems = [];
    for (let i = 0; i < total; i++) {
        const ex = exercises[i];
        const state = states[i] || {};
        if (state.isCorrect === true) continue;

        const qTitle = escapeHtml(exerciseQuestionHeading(ex, i));
        const explanationText = escapeHtml(ex.explanation || '');

        let inner = '';

        if (ex.type === 'fill_blanks' && state.answered) {
            const wrongBlanks = [];
            (ex.corrects || []).forEach((correct, bi) => {
                const u = (state.blankValues[bi] || '').trim();
                if (u.toLowerCase() !== String(correct).toLowerCase()) {
                    wrongBlanks.push({
                        num: bi + 1,
                        user: u || '(empty)',
                        correct: String(correct),
                    });
                }
            });
            if (wrongBlanks.length > 0) {
                inner = `<ul class="practice-results__blank-list">${wrongBlanks
                    .map(
                        (w) =>
                            `<li><strong>Blank ${w.num}</strong> — Your answer: “${escapeHtml(w.user)}” · Correct: “${escapeHtml(w.correct)}”</li>`
                    )
                    .join('')}</ul>`;
            } else {
                inner = `<p class="practice-results__mono">${escapeHtml(
                    getUserAnswerDisplay(ex, state) || '—'
                )}</p>`;
            }
        } else if (ex.type === 'fill_blanks' && !state.answered) {
            inner = `<div class="practice-results__compare practice-results__compare--two-col">
                <div><span class="practice-results__label">Your answer</span><span class="practice-results__missing">Not submitted</span></div>
                <div><span class="practice-results__label">Correct</span><span class="practice-results__correct">“${escapeHtml(
                    (ex.corrects || []).join(' · ')
                )}”</span></div>
            </div>`;
        } else {
            const userDisp = state.answered
                ? getUserAnswerDisplay(ex, state)
                : null;
            const userBlock =
                userDisp === null || userDisp === ''
                    ? '<span class="practice-results__missing">Not submitted — tap “Check answer” before “Next” so we can record your attempt.</span>'
                    : `<span class="practice-results__your">“${escapeHtml(
                          String(userDisp)
                      )}”</span>`;
            const correctBlock = `“${escapeHtml(
                getCorrectAnswerDisplay(ex)
            )}”`;
            inner = `<div class="practice-results__compare practice-results__compare--two-col">
                <div><span class="practice-results__label">Your answer</span>${userBlock}</div>
                <div><span class="practice-results__label">Correct answer</span><span class="practice-results__correct">${correctBlock}</span></div>
            </div>`;
        }

        mistakeItems.push(`<li class="practice-results__mistake">
            <p class="practice-results__q">${qTitle}</p>
            ${inner}
            <p class="practice-results__explain"><span class="practice-results__explain-label">Explanation</span><span class="practice-results__explain-text">${explanationText || '—'}</span></p>
        </li>`);
    }

    const mistakesBlock =
        mistakeItems.length === 0
            ? `<p class="practice-results__none">Nothing to review — every answer matched the model. Come back to this lesson when you want a refresher.</p>`
            : `<h3 class="practice-results__mistakes-title">Items to review</h3>
            <ol class="practice-results__mistake-list">${mistakeItems.join(
                ''
            )}</ol>`;

    area.innerHTML = `<div class="practice-results">
        <p class="practice-results__eyebrow">Practice complete</p>
        <h2 class="practice-results__headline">${escapeHtml(headline)}</h2>
        <p class="practice-results__subline">${escapeHtml(subline)}</p>
        <p class="practice-results__score" role="status"><span class="practice-results__score-num">${correctCount}</span><span class="practice-results__score-sep">/</span><span class="practice-results__score-den">${total}</span> <span class="practice-results__score-label">correct</span></p>
        ${mistakesBlock}
        <p class="practice-results__tip">Tip: skim the lesson once more, then retry only the items above — short, targeted reviews beat long cram sessions.</p>
    </div>`;
    area.scrollIntoView({ behavior: 'smooth' });
}

function openLesson(id) {
    practice.currentId = id;
    const lesson = getLesson(id);
    document.getElementById('lesson-content-area').innerHTML = lesson.content;
    document.getElementById('landing-page').style.display = 'none';
    document.getElementById('lesson-page').style.display = 'block';
    document.getElementById('test-area').style.display = 'none';

    const exercises = getExercises(id);
    const practiceBtn = document.getElementById('practice-btn');
    practiceBtn.style.display = exercises.length > 0 ? 'block' : 'none';

    const numEl = document.getElementById('current-lesson-num');
    if (numEl) numEl.textContent = String(id);

    resetLessonProgress();
    window.scrollTo(0, 0);
}

function goBack() {
    document.getElementById('landing-page').style.display = 'block';
    document.getElementById('lesson-page').style.display = 'none';
    resetLessonProgress();
    window.scrollTo(0, 0);
}

function startPractice() {
    document.getElementById('practice-btn').style.display = 'none';
    const area = document.getElementById('test-area');
    area.style.display = 'block';

    const exercises = getExercises(practice.currentId);
    if (exercises.length === 0) {
        area.innerHTML =
            '<p class="test-title wg-muted-msg">No practice exercises for this lesson yet.</p>';
        return;
    }

    if (practice.exerciseStates.length === 0) {
        practice.exerciseStates = exercises.map(() => ({
            answered: false,
            userAnswer: null,
            isCorrect: null,
            selectedWords: [],
            blankValues: [],
        }));
    }

    loadExercise(area);
}

function loadExercise(area) {
    const exercises = getExercises(practice.currentId);
    if (practice.currentExercise >= exercises.length) {
        renderPracticeResults(area);
        return;
    }

    const ex = exercises[practice.currentExercise];
    const state = practice.exerciseStates[practice.currentExercise];
    const idx = practice.currentExercise;

    let html = `<div class="test-title">${ex.question || ''}</div>`;

    if (ex.type === 'word_order') {
        html += renderWordOrder(ex, state, idx);
    } else if (ex.type === 'quiz') {
        html += renderQuiz(ex, state, idx);
    } else if (ex.type === 'fill_blanks') {
        html += renderFillBlanks(ex, state, idx);
    }

    area.innerHTML = html;
    area.scrollIntoView({ behavior: 'smooth' });
}

function goToPreviousExercise() {
    if (practice.currentExercise > 0) {
        practice.currentExercise--;
        loadExercise(document.getElementById('test-area'));
    }
}

function goToNextExercise() {
    const exercises = getExercises(practice.currentId);
    if (practice.currentExercise < exercises.length) {
        practice.currentExercise++;
        loadExercise(document.getElementById('test-area'));
    }
}

function pickWord(el, word) {
    const state = practice.exerciseStates[practice.currentExercise];
    if (state.answered || el.classList.contains('used')) return;

    el.classList.add('used');
    state.selectedWords.push(word);
    updateAzone();
}

function removeWord(el) {
    const state = practice.exerciseStates[practice.currentExercise];
    if (state.answered) return;

    const word = el.innerText;
    const index = state.selectedWords.indexOf(word);
    if (index > -1) state.selectedWords.splice(index, 1);

    const poolItems = document.querySelectorAll('#wpool .word-item');
    poolItems.forEach((pi) => {
        if (pi.innerText === word) pi.classList.remove('used');
    });

    updateAzone();
}

function updateAzone() {
    const state = practice.exerciseStates[practice.currentExercise];
    const azone = document.getElementById('azone');
    if (!azone) return;
    azone.innerHTML = state.selectedWords
        .map(
            (w) =>
                `<div class="word-item" onclick="removeWord(this)">${w}</div>`
        )
        .join('');
}

function checkOrder() {
    const state = practice.exerciseStates[practice.currentExercise];
    const exercises = getExercises(practice.currentId);
    const ex = exercises[practice.currentExercise];
    const answer = state.selectedWords.join(' ');
    state.answered = true;
    state.isCorrect = answer === ex.correct;
    state.userAnswer = answer;

    const fb = document.getElementById('feedback');
    if (state.isCorrect) {
        fb.innerHTML = `<p class="correct">Excellent! You understand the structure.</p>`;
    } else {
        fb.innerHTML = `<p class="wrong">Try again. Think about the S-V-O order.</p>
                        <p>Correct: ${ex.correct}</p>
                        <p>${ex.explanation}</p>`;
    }
}

function selectQuizOption(index) {
    const state = practice.exerciseStates[practice.currentExercise];
    if (state.answered) return;

    const exercises = getExercises(practice.currentId);
    const ex = exercises[practice.currentExercise];
    state.answered = true;
    state.userAnswer = index;
    state.isCorrect = ex.options[index].c;

    loadExercise(document.getElementById('test-area'));
}

function checkBlanks() {
    const state = practice.exerciseStates[practice.currentExercise];
    const exercises = getExercises(practice.currentId);
    const ex = exercises[practice.currentExercise];

    state.blankValues = [];
    let allCorrect = true;

    ex.corrects.forEach((correct, i) => {
        const inp = document.getElementById(`blank${i}`);
        const value = inp ? inp.value.trim() : '';
        state.blankValues.push(value);

        if (value.toLowerCase() !== correct.toLowerCase()) {
            allCorrect = false;
        }
    });

    state.answered = true;
    state.isCorrect = allCorrect;

    loadExercise(document.getElementById('test-area'));
}
