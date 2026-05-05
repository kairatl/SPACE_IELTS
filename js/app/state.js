/** In-memory state for the active lesson practice session */
var practice = {
    currentId: null,
    currentExercise: 0,
    exerciseStates: [],
};

function resetLessonProgress() {
    practice.currentExercise = 0;
    practice.exerciseStates = [];
}
