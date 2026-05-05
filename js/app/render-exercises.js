/**
 * HTML builders for exercise types. Kept separate from DOM event wiring for easier testing and reuse.
 * @param {number} exerciseIndex — 0-based index in the lesson's exercises array
 */

function renderWordOrder(ex, state, exerciseIndex) {
    let words = [...ex.words];
    if (!state.answered) {
        words.sort(() => Math.random() - 0.5);
    }

    return `
        <div class="answer-zone" id="azone">
            ${state.selectedWords
                .map(
                    (w) =>
                        `<div class="word-item" onclick="removeWord(this)">${w}</div>`
                )
                .join('')}
        </div>
        <div class="word-pool" id="wpool">
            ${words
                .map((w) => {
                    const isUsed = state.selectedWords.includes(w);
                    return `<div class="word-item ${isUsed ? 'used' : ''}" 
                           onclick="pickWord(this, '${w.replace(/'/g, "\\'")}')">${w}</div>`;
                })
                .join('')}
        </div>
        <button type="button" class="btn btn-signup wg-btn-block wg-exercise-check" onclick="checkOrder()">Check answer</button>
        <div id="feedback" class="wg-feedback"></div>
        <div class="nav-buttons">
            ${exerciseIndex > 0 ? `<button type="button" class="btn btn-ghost wg-nav-btn" onclick="goToPreviousExercise()">Back</button>` : ''}
            <button type="button" class="btn btn-signup wg-nav-btn" onclick="goToNextExercise()">Next</button>
        </div>
    `;
}

function renderQuiz(ex, state, exerciseIndex) {
    let html = '';
    ex.options.forEach((opt, index) => {
        const isSelected = state.userAnswer === index;
        const disabled = state.answered ? 'disabled' : '';
        const className = state.answered
            ? opt.c
                ? 'correct'
                : isSelected
                  ? 'wrong'
                  : ''
            : 'quiz-option';

        html += `
            <button type="button" class="${className}" ${disabled} 
                    onclick="selectQuizOption(${index})">
                ${opt.t}
            </button>`;
    });

    let feedback = '';
    if (state.answered) {
        feedback = `<div id="feedback" class="wg-feedback">
            <p class="${state.isCorrect ? 'correct' : 'wrong'}">
                ${state.isCorrect ? 'Correct!' : 'Wrong!'}
            </p>
            <p>${ex.explanation}</p>
        </div>`;
    }

    return (
        html +
        feedback +
        `
        <div class="nav-buttons">
            ${exerciseIndex > 0 ? `<button type="button" class="btn btn-ghost wg-nav-btn" onclick="goToPreviousExercise()">Back</button>` : ''}
            <button type="button" class="btn btn-signup wg-nav-btn" onclick="goToNextExercise()">Next</button>
        </div>`
    );
}

function renderFillBlanks(ex, state, exerciseIndex) {
    let text = ex.text;
    ex.corrects.forEach((_, i) => {
        const value = state.blankValues[i] || '';
        text = text.replace(
            '___',
            `<input id="blank${i}" class="blank-input" type="text" value="${String(value).replace(/"/g, '&quot;')}">`
        );
    });

    let feedback = '';
    if (state.answered) {
        feedback = `<div id="feedback" class="wg-feedback">
            <p class="${state.isCorrect ? 'correct' : 'wrong'}">
                ${state.isCorrect ? 'Perfect!' : 'Some are wrong.'}
            </p>
            <p>${ex.explanation}</p>
        </div>`;
    }

    return `
        <div class="story">${text}</div>
        <button type="button" class="btn btn-signup wg-btn-block wg-exercise-check" onclick="checkBlanks()">Check answer</button>
        ${feedback}
        <div class="nav-buttons">
            ${exerciseIndex > 0 ? `<button type="button" class="btn btn-ghost wg-nav-btn" onclick="goToPreviousExercise()">Back</button>` : ''}
            <button type="button" class="btn btn-signup wg-nav-btn" onclick="goToNextExercise()">Next</button>
        </div>
    `;
}
