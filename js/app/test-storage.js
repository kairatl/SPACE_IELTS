/**
 * LocalStorage history for reading (and future) tests.
 * Each entry: { date: number (ms), testId: string, score: number, band: number }
 */
(function (global) {
    var STORAGE_KEY = 'spaceIELTS_testHistory';

    /** @type {Record<string, string>} */
    var TEST_NAMES = {
        cam20_t1: 'Cambridge 20 - Test 1'
    };

    function loadRaw() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    function saveRaw(list) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    }

    /**
     * @param {{ date: number, testId: string, score: number, band: number }} entry
     */
    function saveTestResult(entry) {
        var list = loadRaw();
        var tid = entry.testId;
        list = list.filter(function (e) {
            return e.testId !== tid;
        });
        list.push({
            date: entry.date,
            testId: entry.testId,
            score: entry.score,
            band: entry.band
        });
        saveRaw(list);
    }

    function getTestHistory() {
        return loadRaw().sort(function (a, b) {
            return b.date - a.date;
        });
    }

    function getTestDisplayName(testId) {
        return TEST_NAMES[testId] || testId;
    }

    function getStats() {
        var list = loadRaw();
        var n = list.length;
        if (n === 0) return { completed: 0, averageBand: null };
        var sum = 0;
        list.forEach(function (e) {
            sum += Number(e.band) || 0;
        });
        return {
            completed: n,
            averageBand: Math.round((sum / n) * 10) / 10
        };
    }

    global.spaceIELTSTestStorage = {
        saveTestResult: saveTestResult,
        getTestHistory: getTestHistory,
        getTestDisplayName: getTestDisplayName,
        getStats: getStats,
        TEST_IDS: TEST_NAMES
    };
})(typeof window !== 'undefined' ? window : globalThis);
