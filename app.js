// Interface du quiz. Aucune requête réseau, aucun traceur. Progression dans localStorage uniquement.
(function () {
  "use strict";
  var Q = window.QUESTIONS || [];
  var L = window.QuizLogic;
  var N = Q.length;
  var STORE_KEY = "questduCode.v1";
  var app = document.getElementById("app");
  var state = { i: 0, answers: {}, pending: [], revealed: false, lastSel: null };

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  function loadBest() {
    try {
      var raw = window.localStorage.getItem(STORE_KEY);
      if (!raw) return null;
      var d = JSON.parse(raw);
      return d && typeof d.best === "number" ? d : null;
    } catch (e) {
      return null;
    }
  }

  function saveResult(score, missedIds) {
    try {
      var prev = loadBest();
      var best = prev && prev.best > score ? prev.best : score;
      window.localStorage.setItem(STORE_KEY, JSON.stringify({
        best: best,
        last: { score: score, total: N, missed: missedIds, date: new Date().toISOString().slice(0, 10) }
      }));
      return best;
    } catch (e) {
      return score;
    }
  }

  function optionText(q, idx) {
    return q.options[idx];
  }

  function listText(q, idxs) {
    if (!idxs || !idxs.length) return "aucune réponse";
    return idxs.map(function (k) { return q.options[k]; }).join(" ; ");
  }

  function sourceBlock(q) {
    var box = el("div", "source");
    box.appendChild(el("p", "ref", "Source : article " + q.source.article + " du Code de la route (édition du 27/10/2026)"));
    box.appendChild(el("blockquote", "", "« " + q.source.quote + " »"));
    var a = el("a", "", "Lire l'article " + q.source.article + " sur Légifrance");
    a.href = q.source.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    box.appendChild(a);
    return box;
  }

  function renderProgress() {
    var wrap = el("div");
    var row = el("div", "progress");
    row.appendChild(el("span", "", "Question " + (state.i + 1) + " sur " + N));
    row.appendChild(el("span", "", Object.keys(state.answers).length + " répondue(s)"));
    wrap.appendChild(row);
    var bar = el("div", "bar");
    var fill = el("div");
    fill.style.width = ((state.i) / N * 100) + "%";
    bar.appendChild(fill);
    wrap.appendChild(bar);
    return wrap;
  }

  function renderQuestion() {
    app.innerHTML = "";
    var q = Q[state.i];
    var card = el("article", "card");
    card.setAttribute("data-id", q.id);
    app.appendChild(renderProgress());
    card.appendChild(el("p", "theme", q.theme));
    card.appendChild(el("h2", "question", q.question));

    var multi = q.correct.length > 1;
    var list = el("ul", "options");
    var sel = state.revealed ? state.lastSel : (multi ? state.pending : []);

    q.options.forEach(function (text, idx) {
      var li = el("li");
      var b = el("button", "opt");
      b.type = "button";
      b.appendChild(el("span", "mark"));
      b.appendChild(el("span", "", text));
      var picked = sel.indexOf(idx) !== -1;
      b.setAttribute("aria-pressed", picked ? "true" : "false");
      if (state.revealed) {
        b.disabled = true;
        var isOk = q.correct.indexOf(idx) !== -1;
        if (isOk) b.classList.add("ok");
        if (picked && !isOk) b.classList.add("ko");
      } else {
        b.addEventListener("click", function () {
          if (multi) {
            var at = state.pending.indexOf(idx);
            if (at === -1) state.pending.push(idx); else state.pending.splice(at, 1);
            renderQuestion();
          } else {
            answer(q, [idx]);
          }
        });
      }
      li.appendChild(b);
      list.appendChild(li);
    });
    card.appendChild(list);

    if (!state.revealed && multi) {
      var validate = el("button", "btn", "Valider mes réponses");
      validate.type = "button";
      validate.disabled = state.pending.length === 0;
      validate.addEventListener("click", function () { answer(q, state.pending.slice()); });
      var act = el("div", "actions");
      act.appendChild(validate);
      card.appendChild(act);
      card.appendChild(el("p", "", "Plusieurs réponses sont possibles : coche toutes celles qui conviennent."));
    }

    if (state.revealed) {
      var fb = el("div", "feedback");
      var ok = L.isCorrect(q, state.lastSel);
      fb.appendChild(el("p", "verdict " + (ok ? "ok" : "ko"), ok ? "Bonne réponse" : "Mauvaise réponse"));
      if (!ok) fb.appendChild(el("p", "", "Ta réponse : " + listText(q, state.lastSel) + ". Bonne réponse : " + listText(q, q.correct) + "."));
      fb.appendChild(el("p", "expl", q.explanation));
      fb.appendChild(sourceBlock(q));
      var nav = el("div", "actions");
      var last = state.i === N - 1;
      var next = el("button", "btn", last ? "Voir mon score" : "Question suivante");
      next.type = "button";
      next.addEventListener("click", function () {
        state.i++;
        state.revealed = false;
        state.pending = [];
        state.lastSel = null;
        if (state.i >= N) renderEnd(); else renderQuestion();
        window.scrollTo(0, 0);
      });
      nav.appendChild(next);
      fb.appendChild(nav);
      card.appendChild(fb);
    }
    app.appendChild(card);
  }

  function answer(q, selected) {
    state.answers[q.id] = selected;
    state.lastSel = selected;
    state.revealed = true;
    renderQuestion();
  }

  function renderEnd() {
    app.innerHTML = "";
    var score = L.score(Q, state.answers);
    var missedIds = L.missed(Q, state.answers);
    var best = saveResult(score, missedIds);
    var card = el("section", "card end");
    card.appendChild(el("h2", "", "Ton score"));
    card.appendChild(el("p", "score", score + " / " + N));
    var passed = L.passed(score);
    var marker = el("p", "marker");
    marker.appendChild(document.createTextNode("Seuil : "));
    marker.appendChild(el("strong", "", L.PASS_MARK + " bonnes réponses sur " + N));
    marker.appendChild(document.createTextNode(" (seuil de l'examen du code, service-public.fr). "));
    marker.appendChild(document.createTextNode(passed ? "Tu es au-dessus du seuil sur cet entraînement." : "Tu es sous le seuil sur cet entraînement."));
    card.appendChild(marker);
    card.appendChild(el("p", "best", "Meilleur score sur cet appareil : " + best + " / " + N + "."));

    if (missedIds.length) {
      card.appendChild(el("h2", "", "Questions à revoir (" + missedIds.length + ")"));
      var ul = el("ul", "missed");
      missedIds.forEach(function (id) {
        var q = Q.filter(function (x) { return x.id === id; })[0];
        var li = el("li");
        li.appendChild(el("p", "q", q.question));
        li.appendChild(el("p", "a", "Ta réponse : " + listText(q, state.answers[q.id]) + ". Bonne réponse : " + listText(q, q.correct) + "."));
        li.appendChild(el("p", "", q.explanation));
        var s = el("p", "src", "Article " + q.source.article + " : ");
        var a = el("a", "", "Lire sur Légifrance");
        a.href = q.source.url; a.target = "_blank"; a.rel = "noopener noreferrer";
        s.appendChild(a);
        li.appendChild(s);
        ul.appendChild(li);
      });
      card.appendChild(ul);
    } else {
      card.appendChild(el("p", "", "Aucune erreur sur cette série."));
    }

    var restart = el("button", "btn ghost restart", "Recommencer les 40 questions");
    restart.type = "button";
    restart.addEventListener("click", function () {
      state = { i: 0, answers: {}, pending: [], revealed: false, lastSel: null };
      renderQuestion();
      window.scrollTo(0, 0);
    });
    card.appendChild(restart);

    var cta = el("div", "cta-block");
    var pass = el("a", "cta", "Pass complet : 4,99 €, une seule fois, sans abonnement");
    pass.href = "#PASS_URL";
    cta.appendChild(pass);
    cta.appendChild(el("p", "cta-note", "Le pass ajoute plus de questions."));
    // Le bouton reste caché tant que le pass n'est pas en vente.
    if (pass.getAttribute("href").charAt(0) !== "#") card.appendChild(cta);

    app.appendChild(card);
    window.scrollTo(0, 0);
  }

  if (N === 0) {
    app.appendChild(el("p", "card", "Les questions ne sont pas chargées. Recharge la page."));
  } else {
    renderQuestion();
  }
})();
