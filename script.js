// ЗАЩИТА ОТ КОПИРОВАНИЯ
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && (e.keyCode === 67 || e.keyCode === 85 || e.keyCode === 83 || e.keyCode === 73)) {
        e.preventDefault();
        return false;
    }
});
// БАЗА ДАННЫХ (Твои тексты + Параметры тестов)
const lessonsData = {
    1: {
        content: `<h1>Lesson 1: SUBJECT — ACTION VERB — OBJECT</h1>
These three ideas will appear constantly in everything you do next, so it is important to understand them clearly.

<b>Subject</b> — the person, thing, or entity that performs the main action in the sentence.
<b>Action verb</b> — the word that shows what the subject does.
<b>Object</b> — the person or thing that receives the action.

<b>A simple illustration</b>
Alex threw the rock.
Alex — subject
threw — action verb
the rock — object

The structure is clear:
Alex performs an action, and the action affects the rock.

<b>Changing roles changes meaning</b>
Now look at this sentence:
The rock hit Alex.
Here:
the rock is the subject
hit is the action verb
Alex is the object

Even though the same two elements are present (Alex and the rock), the meaning changes completely because their roles change.

<b>Key idea to remember</b>
Meaning in English depends on structure, not on words alone.
If you change the subject and the object, you change: who controls the action, who is affected by it, and often the entire interpretation of the sentence. Once this structure is solid, everything else becomes an expansion of it.`,
        exercises: [
            {
                type: 'word_order',
                question: 'Fix by swapping subject and object if needed: 1. The criminal arrested the police officer.',
                words: ['The', 'criminal', 'arrested', 'the', 'police', 'officer'],
                correct: 'The police officer arrested the criminal',
                explanation: 'The police officer arrested the criminal.'
            },
            {
                type: 'word_order',
                question: 'Fix by swapping subject and object if needed: 2. The virus infected the doctor.',
                words: ['The', 'virus', 'infected', 'the', 'doctor'],
                correct: 'The virus infected the doctor',
                explanation: 'This one was already correct — maybe the detective was confused!'
            },
            {
                type: 'word_order',
                question: 'Fix by swapping subject and object if needed: 3. The homework completed the lazy student.',
                words: ['The', 'homework', 'completed', 'the', 'lazy', 'student'],
                correct: 'The lazy student completed the homework',
                explanation: 'The lazy student completed the homework.'
            },
            {
                type: 'word_order',
                question: 'Fix by swapping subject and object if needed: 4. The cake ate the hungry child.',
                words: ['The', 'cake', 'ate', 'the', 'hungry', 'child'],
                correct: 'The hungry child ate the cake',
                explanation: 'The hungry child ate the cake.'
            }
        ]
    },
    2: {
        content: `<h1>Lesson 2: Present Simple & Past Simple</h1>
Tenses are one of the most important parts of IELTS.
Almost all other tenses are built on these two, so they must be understood first.
At this stage, do not focus on complex rules.
Your goal is to remember the structure and the basic meaning.

<b>Present Simple</b>
We use Present Simple to talk about: things that happen regularly, facts, routines and habits.
Structure:
Subject + Action Verb (1st form)

Examples:
<i>I walk to school.
People use fossil fuels.
This graph shows a steady increase.</i>

Key idea:
The action is true in general, not just right now.

<hr>

<b>Past Simple</b>
We use Past Simple to talk about: actions that happened at a specific time in the past, events that are finished.
Structure:
Subject + Action Verb (2nd form)

Examples:
<i>I walked to school yesterday.
The company increased production in 2020.
Pollution levels dropped last year.</i>

Key idea:
The action happened before now and is already complete.

<b>Why verb forms matter</b>
Look at the difference:
I walk to school.
→ a routine / something that happens regularly
I walked to school.
→ a finished action in the past

Notice how only the verb form changes, but the context of the whole sentence changes.
This is why verb forms are essential for clear meaning in IELTS.

<b>Important note (do not overthink yet)</b>
You may notice another tense:
I have walked to school.
This tense has a different purpose and a different structure.
We will study it later.
For now:
Do not mix tenses. Focus on memorising the structure and basic meaning.`,

        exercises: [
            {
                type: 'quiz',
                question: 'Habit: Read each pair. Circle the one that matches the description.',
                options: [
                    { t: 'a) I drink coffee every morning.', c: true },
                    { t: 'b) I drank coffee this morning.', c: false }
                ],
                explanation: 'a) Present Simple → regular habit / routine. b) is wrong — "this morning" is a finished, specific past time.'
            },
            {
                type: 'quiz',
                question: 'Finished past: Read each pair. Circle the one that matches the description.',
                options: [
                    { t: 'a) The company builds a new factory.', c: false },
                    { t: 'b) The company built a new factory last year.', c: true }
                ],
                explanation: 'b) Past Simple → completed action at a specific past time. a) is wrong — Present Simple doesn\'t fit with "last year".'
            },
            {
                type: 'quiz',
                question: 'General fact: Read each pair. Circle the one that matches the description.',
                options: [
                    { t: 'a) Ice melts at 0°C.', c: true },
                    { t: 'b) Ice melted yesterday.', c: false }
                ],
                explanation: 'a) Present Simple → scientific / general truth that is always true. b) is wrong — "yesterday" makes it a specific past event, not a general fact.'
            },
            {
                type: 'quiz',
                question: 'Routine: Read each pair. Circle the one that matches the description.',
                options: [
                    { t: 'a) We watch movies on Fridays.', c: true },
                    { t: 'b) We watched a movie last Friday.', c: false }
                ],
                explanation: 'a) Present Simple → repeated action / habit every Friday. b) is wrong — "last Friday" refers to one finished occasion in the past.'
            },
            {
                type: 'fill_blanks',
                question: 'Time Machine Story – Fill the Blanks. Complete this silly short story with Present Simple or Past Simple. Use context clues!',
                text: 'Yesterday my friend (1. invent) ___ a time machine. Now he (2. travel) ___ to different times every weekend. Last week he (3. go) ___ to the future and (4. see) ___ flying cars everywhere. But today he (5. stay) ___ in the present because the machine (6. need) ___ repairs. He usually (7. fix) ___ it himself, but yesterday it (8. break) ___ completely!',
                corrects: ['invented', 'travels', 'went', 'saw', 'stays', 'needs', 'fixes', 'broke'],
                explanation: 'Correct filled story: Yesterday my friend invented a time machine. Now he travels to different times every weekend. Last week he went to the future and saw flying cars everywhere. But today he stays in the present because the machine needs repairs. He usually fixes it himself, but yesterday it broke completely!'
            }
        ]
    },
    3: {
        content: `<h1>Lesson 3 — Irregular verbs (2nd form)</h1>
At this point, grammar becomes partly about memorisation.
This is normal — get used to it.
Not everything in English follows a single rule.
Verb forms are one of those areas where patterns exist, but memory is essential.

<b>Look at these sentences</b>
I walk to school. → I walked to school.
She eats breakfast. → She ate breakfast.
He runs every day. → He ran yesterday.
They study all night. → They studied all night.

Notice how the verb changes, but the sentence structure stays the same:
Subject + Verb (+ Object)
Only the verb form changes to show time.

<b>Two types of verb forms</b>
When verbs change into the past form, they follow two different patterns.

<b>1) Regular verbs</b>
Most verbs form the past simple by adding -ed.
Examples:
walk → walked
study → studied
work → worked
change → changed
These verbs are called regular verbs because they follow a predictable rule.

<b>2) Irregular verbs</b>
Some verbs do not follow the -ed rule.
Their past forms are different and must be memorised.
Examples:
run → ran
eat → ate
teach → taught
buy → bought
These are called irregular verbs.
There is no shortcut rule here.
The only way forward is familiarity and repetition.`,
        exercises: [
            {
                type: 'quiz',
                question: '1. Yesterday she ______ breakfast very quickly because she was late.',
                options: [
                    { t: 'a) eated', c: false },
                    { t: 'b) ate', c: true },
                    { t: 'c) eat', c: false },
                    { t: 'd) eateded', c: false }
                ],
                explanation: 'The correct answer is b) ate (irregular verb: eat → ate).'
            },
            {
                type: 'quiz',
                question: '2. Last weekend the kids ______ very fast in the park race.',
                options: [
                    { t: 'a) runned', c: false },
                    { t: 'b) ran', c: true },
                    { t: 'c) run', c: false },
                    { t: 'd) ranned', c: false }
                ],
                explanation: 'The correct answer is b) ran (irregular verb: run → ran).'
            },
            {
                type: 'quiz',
                question: '3. He ______ a new phone last month.',
                options: [
                    { t: 'a) buyed', c: false },
                    { t: 'b) bought', c: true },
                    { t: 'c) buy', c: false },
                    { t: 'd) buied', c: false }
                ],
                explanation: 'The correct answer is b) bought (irregular verb: buy → bought).'
            },
            {
                type: 'quiz',
                question: '4. They ______ English at school when they were children.',
                options: [
                    { t: 'a) teached', c: false },
                    { t: 'b) taught', c: true },
                    { t: 'c) teach', c: false },
                    { t: 'd) taughted', c: false }
                ],
                explanation: 'The correct answer is b) taught (irregular verb: teach → taught).'
            },
            {
                type: 'quiz',
                question: '5. I ______ my homework before dinner yesterday.',
                options: [
                    { t: 'a) doed', c: false },
                    { t: 'b) did', c: true },
                    { t: 'c) done', c: false },
                    { t: 'd) do', c: false }
                ],
                explanation: 'The correct answer is b) did (irregular verb: do → did).'
            },
            {
                type: 'quiz',
                question: '6. She ______ to the store and ______ some milk. (two verbs)',
                options: [
                    { t: 'a) go – buyed', c: false },
                    { t: 'b) went – bought', c: true },
                    { t: 'c) goed – bought', c: false },
                    { t: 'd) went – buy', c: false }
                ],
                explanation: 'The correct answer is b) went – bought (irregular verbs: go → went, buy → bought).'
            },
            {
                type: 'quiz',
                question: '7. The baby ______ all night last night.',
                options: [
                    { t: 'a) sleeped', c: false },
                    { t: 'b) slept', c: true },
                    { t: 'c) sleep', c: false },
                    { t: 'd) slep', c: false }
                ],
                explanation: 'The correct answer is b) slept (irregular verb: sleep → slept).'
            },
            {
                type: 'quiz',
                question: '8. We ______ the movie last Saturday and it was great!',
                options: [
                    { t: 'a) see', c: false },
                    { t: 'b) saw', c: true },
                    { t: 'c) seed', c: false },
                    { t: 'd) sawed', c: false }
                ],
                explanation: 'The correct answer is b) saw (irregular verb: see → saw).'
            },
            {
                type: 'quiz',
                question: '9. He ______ his keys and couldn\'t open the door.',
                options: [
                    { t: 'a) lose', c: false },
                    { t: 'b) lost', c: true },
                    { t: 'c) losed', c: false },
                    { t: 'd) loss', c: false }
                ],
                explanation: 'The correct answer is b) lost (irregular verb: lose → lost).'
            },
            {
                type: 'quiz',
                question: '10. Yesterday I ______ a book about space.',
                options: [
                    { t: 'a) read (sounds like "reed")', c: false },
                    { t: 'b) read (sounds like "red")', c: true },
                    { t: 'c) Both a and b are correct depending on pronunciation, but the past form is the same', c: false },
                    { t: 'd) readed', c: false }
                ],
                explanation: 'The correct answer is b) read (sounds like "red") (irregular verb: read → read, but pronounced differently in past).'
            }
        ]
    },
    4: {
    content: `<h1>Lesson 4 — Basic Prepositions</h1>
Prepositions serve the function of connecting words in a sentence. 
They are essential because a sentence's meaning can change entirely depending on which one you use.

<b>Look at the difference:</b>
Go <b>for</b> — Идти за (чем-то)
Go <b>to</b> — Идти куда-то

<b>How to use them:</b>
A preposition is normally followed by a noun, pronoun, or -ing form.
Structure: <b>Preposition + object</b>
Examples: <i>in the study / on the body / to the coach</i>

<b>1) Prepositions of Place</b>
• <b>in</b> — inside, within an area (в — внутри). <i>Ex: The research was conducted <b>in</b> Sweden.</i>
• <b>on</b> — surface (на поверхности). <i>Ex: Stress is placed <b>on</b> the body.</i>
• <b>at</b> — specific point/place (в конкретном месте). <i>Ex: She works <b>at</b> the university.</i>

<b>2) Prepositions of Time</b>
• <b>before</b> — earlier than (до). <i>Ex: Injuries occurred <b>before</b> the Olympics.</i>
• <b>after</b> — later than (после). <i>Ex: Recovery improved <b>after</b> the intervention.</i>
• <b>during</b> — within a period (во время). <i>Ex: Injuries increased <b>during</b> intense training.</i>

<b>3) Direction & Connection</b>
• <b>to</b> — direction/purpose (в / чтобы). <i>Ex: Access <b>to</b> digital information.</i>
• <b>for</b> — purpose/benefit (для). <i>Ex: Designed <b>for</b> coaches.</i>
• <b>of</b> — relation/belonging (чего-то). <i>Ex: The impact <b>of</b> injuries.</i>
• <b>with</b> — association (с / вместе). <i>Ex: Equated <b>with</b> overuse.</i>

<b>Common Academic Patterns (Don't make mistakes here!)</b>
❌ focus at... → ✅ <b>focus on</b>
❌ affect on... → ✅ <b>affect</b> (no preposition)
❌ impact at... → ✅ <b>impact on</b>

Prepositions are learned best through <b>patterns and collocations</b>, not by word-for-word translation. Memory and practice are your best tools here.`,
        exercises: [
          
    // 1. Fill in the blank
    {
        type: "fill_blanks",
        text: "The research was conducted ___ an academic institute in Almaty.",
        corrects: ["at"],
        explanation: "Мы используем 'at' для конкретного учреждения/организации."
    },
    {
        type: "fill_blanks",
        text: "Injuries can affect different aspects ___ physical development.",
        corrects: ["of"],
        explanation: "of показывает отношение / принадлежность."
    },
    {
        type: "fill_blanks",
        text: "Coaches need access ___ reliable digital information.",
        corrects: ["to"],
        explanation: "Правильное сочетание: access to something."
    },
    {
        type: "fill_blanks",
        text: "The study focused ___ athletes aged 12–15.",
        corrects: ["on"],
        explanation: "focus on = сосредоточивать внимание на чём-то."
    },
    {
        type: "fill_blanks",
        text: "Stress is placed ___ the body ___ intense training.",
        corrects: ["on", "during"],
        explanation: "Stress is placed on the body (на тело). during = во время."
    },
    {
        type: "fill_blanks",
        text: "Injury rates varied ___ different age groups.",
        corrects: ["across"],
        explanation: "vary across = различаться в пределах (групп, стран и т.д.)"
    },
    {
        type: "fill_blanks",
        text: "The platform was designed ___ parents and youth coaches.",
        corrects: ["for"],
        explanation: "designed for = создан для кого-то."
    },
    {
        type: "fill_blanks",
        text: "These results gained credit ___ the scientific community.",
        corrects: ["within"],
        explanation: "credit within = признание внутри определённой группы."
    },

    // 9. Word Order (дополнительное)
    {
        type: "word_order",
        question: "Составьте правильное предложение:",
        words: ["focused", "on", "The", "study", "youth", "athletes"],
        correct: "The study focused on youth athletes",
        explanation: "Remember: focus on + объект"
    },

    // 10. Quiz (множественный выбор)
    {
        type: "quiz",
        question: "Which preposition is correct?",
        options: [
            { t: "Injuries affect ___ performance.", c: false },           // wrong
            { t: "Injuries affect performance.", c: true },               // correct (no preposition)
            { t: "Injuries affect on performance.", c: false }
        ],
        explanation: "Глагол 'affect' в академическом английском НЕ требует предлога."
    },
    // Дополнительные эксклюзивные задания

{
    type: "fill_blanks",
    text: "Balance ___ training load and recovery is very important ___ young athletes.",
    corrects: ["between", "for"],
    explanation: "between (между двумя вещами) + for (для кого-то)"
},
{
    type: "fill_blanks",
    text: "The number of injuries increased significantly ___ the competition period.",
    corrects: ["during"],
    explanation: "during = в течение периода"
},
{
    type: "fill_blanks",
    text: "This discovery had a strong impact ___ the future of sports science.",
    corrects: ["on"],
    explanation: "have an impact on = оказывать влияние на"
},
{
    type: "fill_blanks",
    text: "All participants were examined ___ the beginning and ___ the end of the study.",
    corrects: ["at", "at"],
    explanation: "at the beginning / at the end"
},
{
    type: "word_order",
    question: "Составьте предложение:",
    words: ["access", "to", "important", "is", "Coaches", "need", "information"],
    correct: "Coaches need access to important information",
    explanation: "access to + something"
},
{
    type: "quiz",
    question: "Choose the correct sentence:",
    options: [
        { t: "The program was developed for the young athletes.", c: true },
        { t: "The program was developed to the young athletes.", c: false },
        { t: "The program was developed on the young athletes.", c: false }
    ],
    explanation: "designed / developed for someone = для кого-то"
}
]
        
    }
,
5: {
    content: `<h1>Lesson 5 — IELTS Writing Task 1: Analyzing Trends</h1>
<p><b>"There was an increase of 50% in sales of fast food."</b></p>

Этот пример объединяет всё, что мы учили ранее:
<ul>
  <li><b>Subject — Verb — Object:</b> There — was — an increase</li>
  <li><b>Past Simple:</b> "was" — это 2-я форма неправильного глагола "be"</li>
  <li><b>Prepositions:</b> использование "of" и "in" для связи данных</li>
</ul>

<p>Это один из базовых способов описать изменения в <b>Writing Task 1 (WT1)</b>. В этой части экзамена IELTS вам нужно описать график, выделяя сравнения, точки изменений и важные детали.</p>

<div style="text-align: center; margin: 20px 0;">
  <img src="https://www.ielts-mentor.com/images/writingsamples/graph-139-food-consumed-by-australian-teenagers.png" 
       alt="Australian Fast Food Graph" 
       style="max-width: 100%; height: auto; border: 1px solid #ccc; border-radius: 8px;">
  <p><i>График: Consumption of Fast Food by Australian Teenagers</i></p>
</div>

<h3>Как анализировать этот график?</h3>
<p>Здесь мы видим изменения в потреблении фастфуда среди австралийских подростков по трем позициям: <b>Pizza, Fish and Chips, Hamburgers</b>.</p>

<b>Основные моменты для описания (Main Body):</b>
<ol>
  <li><b>Fish and Chips:</b> Были самыми популярными в начале периода, но постепенно теряли актуальность к концу.</li>
  <li><b>Hamburgers & Pizza:</b> Показывают явный рост потребления.</li>
  <li><b>Детали:</b> Важно отметить сравнительно быстрый взлет гамбургеров и стабилизацию показателей пиццы в последние годы.</li>
</ol>

<p>То, что мы сейчас выделили — это и есть основа для написания <b>Main Body</b> в Writing Task 1. В следующем уроке мы разберем структуру WT1 и выучим базовые фразы для самостоятельного описания изменений.</p>`

}
    }
;
// === ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ДЛЯ СОХРАНЕНИЯ ПРОГРЕССА ===
let currentId = null;
let currentExercise = 0;
let exerciseStates = [];   // Здесь будем хранить состояние каждого упражнения

// Переключение страниц
function openLesson(id) {
    currentId = id;
    document.getElementById('lesson-content-area').innerHTML = lessonsData[id].content;
    document.getElementById('landing-page').style.display = 'none';
    document.getElementById('lesson-page').style.display = 'block';
    document.getElementById('test-area').style.display = 'none';
    document.getElementById('practice-btn').style.display = 'block';
    
    // Сбрасываем прогресс при новом заходе в урок
    resetLessonProgress();
    window.scrollTo(0, 0);
}

function goBack() {
    document.getElementById('landing-page').style.display = 'block';
    document.getElementById('lesson-page').style.display = 'none';
    resetLessonProgress();   // Полный сброс при выходе из урока
    window.scrollTo(0, 0);
}

// Полный сброс прогресса урока
function resetLessonProgress() {
    currentExercise = 0;
    exerciseStates = [];
}

// Запуск практики
function startPractice() {
    document.getElementById('practice-btn').style.display = 'none';
    const area = document.getElementById('test-area');
    area.style.display = 'block';
    
    // Если состояний ещё нет — инициализируем
    if (exerciseStates.length === 0) {
        const exercises = lessonsData[currentId].exercises;
        exerciseStates = exercises.map(() => ({
            answered: false,
            userAnswer: null,
            isCorrect: null,
            selectedWords: [],
            blankValues: []
        }));
    }
    
    loadExercise(area);
}

// Основная функция загрузки упражнения
function loadExercise(area) {
    if (currentExercise >= lessonsData[currentId].exercises.length) {
        area.innerHTML = '<div class="test-title">Congratulations! You completed the practice.</div>';
        return;
    }

    const ex = lessonsData[currentId].exercises[currentExercise];
    const state = exerciseStates[currentExercise];

    let html = `<div class="test-title">${ex.question || ''}</div>`;

    if (ex.type === 'word_order') {
        html += renderWordOrder(ex, state);
    } else if (ex.type === 'quiz') {
        html += renderQuiz(ex, state);
    } else if (ex.type === 'fill_blanks') {
        html += renderFillBlanks(ex, state);
    }

    area.innerHTML = html;
    area.scrollIntoView({ behavior: 'smooth' });
}

// ======================== RENDER FUNCTIONS ========================

function renderWordOrder(ex, state) {
    let words = [...ex.words];
    if (!state.answered) {
        words.sort(() => Math.random() - 0.5); // перемешиваем только если ещё не отвечали
    }

    return `
        <div class="answer-zone" id="azone">
            ${state.selectedWords.map(w => 
                `<div class="word-item" onclick="removeWord(this)">${w}</div>`
            ).join('')}
        </div>
        <div class="word-pool" id="wpool">
            ${words.map(w => {
                const isUsed = state.selectedWords.includes(w);
                return `<div class="word-item ${isUsed ? 'used' : ''}" 
                           onclick="pickWord(this, '${w}')">${w}</div>`;
            }).join('')}
        </div>
        <button class="practice-trigger" onclick="checkOrder()">CHECK ANSWER</button>
        <div id="feedback"></div>
        <div class="nav-buttons">
            ${currentExercise > 0 ? `<button class="practice-trigger" onclick="goToPreviousExercise()">BACK</button>` : ''}
            <button class="practice-trigger" onclick="goToNextExercise()">NEXT</button>
        </div>
    `;
}

function renderQuiz(ex, state) {
    let html = '';
    ex.options.forEach((opt, index) => {
        const isSelected = state.userAnswer === index;
        const disabled = state.answered ? 'disabled' : '';
        const className = state.answered 
            ? (opt.c ? 'correct' : (isSelected ? 'wrong' : '')) 
            : 'quiz-option';

        html += `
            <button class="${className}" ${disabled} 
                    onclick="selectQuizOption(${index})">
                ${opt.t}
            </button>`;
    });

    let feedback = '';
    if (state.answered) {
        feedback = `<div id="feedback">
            <p class="${state.isCorrect ? 'correct' : 'wrong'}">
                ${state.isCorrect ? 'Correct!' : 'Wrong!'}
            </p>
            <p>${ex.explanation}</p>
        </div>`;
    }

    return html + feedback + `
        <div class="nav-buttons">
            ${currentExercise > 0 ? `<button class="practice-trigger" onclick="goToPreviousExercise()">BACK</button>` : ''}
            <button class="practice-trigger" onclick="goToNextExercise()">NEXT</button>
        </div>`;
}

function renderFillBlanks(ex, state) {
    let text = ex.text;
    ex.corrects.forEach((_, i) => {
        const value = state.blankValues[i] || '';
        text = text.replace('___', `<input id="blank${i}" class="blank-input" type="text" value="${value}">`);
    });

    let feedback = '';
    if (state.answered) {
        feedback = `<div id="feedback">
            <p class="${state.isCorrect ? 'correct' : 'wrong'}">
                ${state.isCorrect ? 'Perfect!' : 'Some are wrong.'}
            </p>
            <p>${ex.explanation}</p>
        </div>`;
    }

    return `
        <div class="story">${text}</div>
        <button class="practice-trigger" onclick="checkBlanks()">CHECK ANSWER</button>
        ${feedback}
        <div class="nav-buttons">
            ${currentExercise > 0 ? `<button class="practice-trigger" onclick="goToPreviousExercise()">BACK</button>` : ''}
            <button class="practice-trigger" onclick="goToNextExercise()">NEXT</button>
        </div>
    `;
}

// ======================== НАВИГАЦИЯ ========================

function goToPreviousExercise() {
    if (currentExercise > 0) {
        currentExercise--;
        loadExercise(document.getElementById('test-area'));
    }
}

function goToNextExercise() {
    if (currentExercise < lessonsData[currentId].exercises.length - 1) {
        currentExercise++;
        loadExercise(document.getElementById('test-area'));
    } else if (currentExercise === lessonsData[currentId].exercises.length - 1) {
        // последний упражнение — показываем поздравление
        currentExercise++;
        loadExercise(document.getElementById('test-area'));
    }
}

// ======================== ОБРАБОТЧИКИ ОТВЕТОВ ========================

function pickWord(el, word) {
    const state = exerciseStates[currentExercise];
    if (state.answered || el.classList.contains('used')) return;

    el.classList.add('used');
    state.selectedWords.push(word);
    updateAzone();
}

function removeWord(el) {
    const state = exerciseStates[currentExercise];
    if (state.answered) return;

    const word = el.innerText;
    const index = state.selectedWords.indexOf(word);
    if (index > -1) state.selectedWords.splice(index, 1);

    const poolItems = document.querySelectorAll('#wpool .word-item');
    poolItems.forEach(pi => {
        if (pi.innerText === word) pi.classList.remove('used');
    });

    updateAzone();
}

function updateAzone() {
    const state = exerciseStates[currentExercise];
    document.getElementById('azone').innerHTML = state.selectedWords
        .map(w => `<div class="word-item" onclick="removeWord(this)">${w}</div>`)
        .join('');
}

function checkOrder() {
    const state = exerciseStates[currentExercise];
    const ex = lessonsData[currentId].exercises[currentExercise];
    const answer = state.selectedWords.join(' ');
    state.answered = true;
    state.isCorrect = (answer === ex.correct);
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
    const state = exerciseStates[currentExercise];
    if (state.answered) return;

    const ex = lessonsData[currentId].exercises[currentExercise];
    state.answered = true;
    state.userAnswer = index;
    state.isCorrect = ex.options[index].c;

    loadExercise(document.getElementById('test-area')); // перерисовываем с результатом
}

function checkBlanks() {
    const state = exerciseStates[currentExercise];
    const ex = lessonsData[currentId].exercises[currentExercise];
    
    state.blankValues = [];
    let allCorrect = true;

    ex.corrects.forEach((correct, i) => {
        const inp = document.getElementById(`blank${i}`);
        const value = inp.value.trim();
        state.blankValues.push(value);

        if (value.toLowerCase() !== correct.toLowerCase()) {
            allCorrect = false;
        }
    });

    state.answered = true;
    state.isCorrect = allCorrect;

    loadExercise(document.getElementById('test-area')); // перерисовываем с фидбеком
}
