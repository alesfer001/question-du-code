// Logique pure du quiz : aucun accès au DOM, testable avec node.
(function (root) {
  "use strict";
  var PASS_MARK = 35;

  function sortedCopy(a) {
    return a.slice().sort(function (x, y) { return x - y; });
  }

  function isCorrect(question, selected) {
    if (!selected || !question) return false;
    var want = sortedCopy(question.correct);
    var got = sortedCopy(selected);
    if (want.length !== got.length) return false;
    for (var k = 0; k < want.length; k++) {
      if (want[k] !== got[k]) return false;
    }
    return true;
  }

  function score(questions, answers) {
    var n = 0;
    for (var i = 0; i < questions.length; i++) {
      var q = questions[i];
      if (answers && answers[q.id] && isCorrect(q, answers[q.id])) n++;
    }
    return n;
  }

  function passed(s) {
    return s >= PASS_MARK;
  }

  function missed(questions, answers) {
    var ids = [];
    for (var i = 0; i < questions.length; i++) {
      var q = questions[i];
      if (!(answers && answers[q.id] && isCorrect(q, answers[q.id]))) ids.push(q.id);
    }
    return ids;
  }

  var api = { PASS_MARK: PASS_MARK, isCorrect: isCorrect, score: score, passed: passed, missed: missed };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.QuizLogic = api;
})(typeof window !== "undefined" ? window : globalThis);
