(function () {
  "use strict";

  var $ = function (selector, scope) { return (scope || document).querySelector(selector); };
  var $$ = function (selector, scope) { return Array.from((scope || document).querySelectorAll(selector)); };
  function seededRandom(seed) { var state = seed >>> 0; return function () { state = (state * 1664525 + 1013904223) >>> 0; return state / 4294967296; }; }
  function mean(values) { return values.reduce(function (total, value) { return total + value; }, 0) / values.length; }

  var menuButton = $("#menuButton"); var mobileNav = $("#mobileNav"); var chapterSelect = $("#chapterSelect");
  chapterSelect.addEventListener("change", function () { window.location.assign(chapterSelect.value); });
  menuButton.addEventListener("click", function () { var open = menuButton.getAttribute("aria-expanded") === "true"; menuButton.setAttribute("aria-expanded", String(!open)); mobileNav.hidden = open; });
  $$("a", mobileNav).forEach(function (link) { link.addEventListener("click", function () { mobileNav.hidden = true; menuButton.setAttribute("aria-expanded", "false"); }); });
  function updateReadingProgress() { var scrollable = document.documentElement.scrollHeight - window.innerHeight; $("#readingProgress").style.width = (scrollable > 0 ? Math.min(100, Math.max(0, window.scrollY / scrollable * 100)) : 0) + "%"; }
  window.addEventListener("scroll", updateReadingProgress, { passive: true }); updateReadingProgress();
  var reveals = $$(".reveal");
  if ("IntersectionObserver" in window) { var observer = new IntersectionObserver(function (entries) { entries.forEach(function (entry) { if (entry.isIntersecting) { entry.target.classList.add("visible"); observer.unobserve(entry.target); } }); }, { threshold: .07 }); reveals.forEach(function (item) { observer.observe(item); }); } else { reveals.forEach(function (item) { item.classList.add("visible"); }); }

  var heroRng = seededRandom(5050); var heroSelected = new Set();
  while (heroSelected.size < 20) { heroSelected.add(Math.floor(heroRng() * 80)); }
  for (var heroIndex = 0; heroIndex < 80; heroIndex += 1) { var heroPerson = document.createElement("i"); heroPerson.classList.toggle("selected", heroSelected.has(heroIndex)); $("#heroPopulation").appendChild(heroPerson); }

  var storyItems = [
    { number: "?", title: "問題：先定義想知道什麼", body: "把模糊好奇轉成可測量問題，才能判斷需要觀察、實驗或詢問。" },
    { number: "N", title: "母體：結論想代表哪些人", body: "目標母體必須明確到時間、地點與對象，否則『大家』可能只是方便取得的人。" },
    { number: "n", title: "樣本：用可說明的計畫選人", body: "抽樣方法決定每個人是否有機會被選中，也決定樣本能否涵蓋重要群體。" },
    { number: "≈", title: "推論：把不確定性一起報告", body: "樣本結果不是母體真值；結論必須保留抽樣誤差與非抽樣偏差的界線。" }
  ];
  function renderStory(index) { var item = storyItems[index]; $("#storyOutput").innerHTML = "<b>" + item.number + "</b><div><h3>" + item.title + "</h3><p>" + item.body + "</p></div>"; $$('[data-story-step]').forEach(function (button, buttonIndex) { var active = buttonIndex === index; button.classList.toggle("active", active); button.setAttribute("aria-pressed", String(active)); }); }
  $$('[data-story-step]').forEach(function (button) { button.addEventListener("click", function () { renderStory(Number(button.dataset.storyStep)); }); }); renderStory(0);

  var methods = {
    observe: { kicker: "OBSERVATIONAL", title: "記錄自然發生的行為", body: "不主動改變條件，直接觀察並記錄。成本通常較低，但關聯不一定能解讀為因果。", example: "記錄顧客在商店中實際停留的時間。", visual: '<div class="observe-scene"><i></i><i></i><i></i></div>' },
    experiment: { kicker: "EXPERIMENTAL", title: "主動改變條件，再比較結果", body: "透過隨機分派與控制條件隔離處理效果；因果解釋較有力，但成本與倫理限制較高。", example: "隨機讓兩組顧客看到不同版面，比較完成購買的比例。", visual: '<div class="experiment-scene"><div>控制組</div><b>VS</b><div>處理組</div></div>' },
    survey: { kicker: "SELF-REPORTED", title: "直接詢問經驗、態度與特徵", body: "可以取得無法直接觀察的資訊，但題目措辭、無回應與記憶誤差都可能造成偏差。", example: "詢問學生對校園餐飲的滿意度與改善建議。", visual: '<div class="survey-scene"><i style="--w:88%"></i><i style="--w:64%"></i><i style="--w:76%"></i><i style="--w:42%"></i></div>' }
  };
  function renderMethod(key) { var item = methods[key]; $("#methodKicker").textContent = item.kicker; $("#methodTitle").textContent = item.title; $("#methodBody").textContent = item.body; $("#methodExample").textContent = item.example; $("#methodVisual").innerHTML = item.visual; $$('[data-method]').forEach(function (button) { var active = button.dataset.method === key; button.classList.toggle("active", active); button.setAttribute("aria-selected", String(active)); }); }
  $$('[data-method]').forEach(function (button) { button.addEventListener("click", function () { renderMethod(button.dataset.method); }); }); renderMethod("observe");

  var activeQuestion = "neutral";
  var questionVersions = {
    neutral: { text: "「你對目前的校園餐飲服務滿意程度為何？」", values: [8,17,31,29,15], insight: "中性問法不暗示『應該』滿意或不滿意，回答分布較能反映受訪者本身的判斷。" },
    leading: { text: "「你是否同意我們方便又實惠的校園餐飲值得肯定？」", values: [3,7,18,41,31], insight: "正面形容詞與『是否同意』會暗示期待答案；即使回收率相同，測量仍可能偏向正面。" }
  };
  function renderSurvey() {
    var invited = Number($("#invitedInput").value); var completed = Number($("#completedInput").value);
    $("#completedInput").max = String(invited); if (completed > invited) { completed = invited; $("#completedInput").value = String(completed); }
    var rate = invited ? completed / invited * 100 : 0; var item = questionVersions[activeQuestion];
    $("#invitedOutput").textContent = invited.toLocaleString("zh-TW"); $("#completedOutput").textContent = completed.toLocaleString("zh-TW"); $("#responseRate").textContent = rate.toFixed(0) + "%"; $("#responseMeter").style.setProperty("--w", rate + "%"); $("#questionText").textContent = item.text;
    var labels = ["非常不滿", "不滿", "普通", "滿意", "非常滿意"];
    $("#answerBars").innerHTML = item.values.map(function (value, index) { return '<div class="answer-row"><span>' + labels[index] + '</span><div class="answer-track"><i style="--w:' + value + '%"></i></div><b>' + value + '%</b></div>'; }).join("");
    $("#surveyInsight").textContent = "回收率為 " + rate.toFixed(1) + "%；" + item.insight;
  }
  ["invitedInput", "completedInput"].forEach(function (id) { $("#" + id).addEventListener("input", renderSurvey); });
  $$('[data-question]').forEach(function (button) { button.addEventListener("click", function () { activeQuestion = button.dataset.question; $$('[data-question]').forEach(function (item) { item.classList.toggle("active", item === button); }); renderSurvey(); }); }); renderSurvey();

  var methodQuizItems = [
    { question: "想知道新版結帳頁是否『造成』轉換率提升，最適合哪種方法？", options: ["直接觀察", "隨機實驗", "滿意度調查"], correct: 1, feedback: "隨機分派兩種頁面能更有力地隔離版面造成的效果。" },
    { question: "想知道通勤者選擇交通工具的理由，最直接的方法是？", options: ["調查", "只數車流", "實驗操弄票價"], correct: 0, feedback: "理由與態度無法單靠外部觀察取得，需向通勤者詢問。" },
    { question: "想描述公園目前有多少人在跑步，不需要改變任何條件，適合？", options: ["實驗", "直接觀察", "電話調查"], correct: 1, feedback: "對當下可見行為，直接觀察最單純。" }
  ];
  var methodQuizIndex = 0; var methodAnswered = false;
  function renderMethodQuiz() { var item = methodQuizItems[methodQuizIndex]; methodAnswered = false; $("#methodQuizQuestion").textContent = item.question; $("#methodQuizFeedback").textContent = "選擇最適合的方法。"; $("#nextMethodQuiz").hidden = true; $("#methodQuizOptions").innerHTML = item.options.map(function (option, index) { return '<button type="button" data-method-option="' + index + '">' + option + '</button>'; }).join(""); $$('[data-method-option]').forEach(function (button) { button.addEventListener("click", function () { if (methodAnswered) { return; } methodAnswered = true; var choice = Number(button.dataset.methodOption); $$('[data-method-option]').forEach(function (optionButton, index) { optionButton.disabled = true; if (index === item.correct) { optionButton.classList.add("correct"); } }); if (choice !== item.correct) { button.classList.add("wrong"); } $("#methodQuizFeedback").textContent = (choice === item.correct ? "答對了。" : "這不是最佳選擇。") + item.feedback; $("#nextMethodQuiz").hidden = false; }); }); }
  $("#nextMethodQuiz").addEventListener("click", function () { methodQuizIndex = (methodQuizIndex + 1) % methodQuizItems.length; renderMethodQuiz(); }); renderMethodQuiz();

  var frames = {
    complete: { coverage: 100, excluded: 0, risk: "低", width: 82, height: 76, shift: 0, label: "完整抽樣母體", insight: "完整名單仍可能有抽樣誤差，但至少每一類目標成員都在抽樣框中。" },
    online: { coverage: 68, excluded: 320, risk: "高", width: 62, height: 63, shift: 12, label: "線上會員", insight: "不常上網者完全沒有被選中的機會；即使抽很多會員，也不會自動代表所有人。" },
    weekday: { coverage: 54, excluded: 460, risk: "高", width: 54, height: 72, shift: -16, label: "平日到店者", insight: "上班族或只在週末出現的人被低度涵蓋，可能讓消費習慣估計產生系統性偏差。" }
  };
  function renderFrame(key) { var item = frames[key]; $("#sampledRing").style.setProperty("--w", item.width + "%"); $("#sampledRing").style.setProperty("--h", item.height + "%"); $("#sampledRing").style.setProperty("--shift", item.shift + "%"); $("#frameLabel").textContent = item.label; $("#coverageRate").textContent = item.coverage + "%"; $("#excludedCount").textContent = item.excluded.toLocaleString("zh-TW") + " 人"; $("#frameRisk").textContent = item.risk; $("#frameInsight").textContent = item.insight; $$('[data-frame]').forEach(function (button) { button.classList.toggle("active", button.dataset.frame === key); }); }
  $$('[data-frame]').forEach(function (button) { button.addEventListener("click", function () { renderFrame(button.dataset.frame); }); }); renderFrame("complete");

  var planContent = {
    simple: { kicker: "SIMPLE RANDOM SAMPLE", title: "從完整名單中逐一隨機抽取", body: "每個同大小的樣本組合都有相同機會，概念最直接，但需要完整個體名單。" },
    stratified: { kicker: "STRATIFIED RANDOM SAMPLE", title: "每一層都保留代表席次", body: "先依重要特徵分層，再從各層隨機抽取；適合需要層內推論或層間比較。" },
    cluster: { kicker: "CLUSTER SAMPLE", title: "先抽整群，再調查群內成員", body: "以班級、門市或社區等自然群組為抽樣單位；名單昂貴或地域分散時較有效率。" }
  };
  var currentPlan = "simple"; var sampleRun = 1;
  for (var personIndex = 0; personIndex < 80; personIndex += 1) { var person = document.createElement("i"); person.dataset.group = String(Math.floor(personIndex / 20)); person.dataset.cluster = String(personIndex % 8); $("#populationGrid").appendChild(person); }
  function renderPlanCopy(key) { currentPlan = key; var item = planContent[key]; $("#planKicker").textContent = item.kicker; $("#planTitle").textContent = item.title; $("#planBody").textContent = item.body; $$('[data-plan]').forEach(function (button) { button.classList.toggle("active", button.dataset.plan === key); }); drawSample(); }
  function shuffledIndices(seed) { var values = Array.from({ length: 80 }, function (_, index) { return index; }); var rng = seededRandom(seed); for (var i = values.length - 1; i > 0; i -= 1) { var j = Math.floor(rng() * (i + 1)); var temp = values[i]; values[i] = values[j]; values[j] = temp; } return values; }
  function drawSample() {
    sampleRun += 1; var selected = []; var chosenClusters = [];
    if (currentPlan === "simple") { selected = shuffledIndices(5200 + sampleRun).slice(0, 20); }
    if (currentPlan === "stratified") { for (var group = 0; group < 4; group += 1) { var groupIndices = shuffledIndices(5300 + sampleRun + group * 31).filter(function (index) { return Math.floor(index / 20) === group; }); selected = selected.concat(groupIndices.slice(0, 5)); } }
    if (currentPlan === "cluster") { chosenClusters = shuffledIndices(5400 + sampleRun).filter(function (index) { return index < 8; }).slice(0, 2); selected = Array.from({ length: 80 }, function (_, index) { return index; }).filter(function (index) { return chosenClusters.indexOf(index % 8) >= 0; }); }
    var selectedSet = new Set(selected); var groupSet = new Set(selected.map(function (index) { return Math.floor(index / 20); }));
    $$("i", $("#populationGrid")).forEach(function (node, index) { node.classList.toggle("selected", selectedSet.has(index)); node.classList.toggle("cluster-selected", currentPlan === "cluster" && selectedSet.has(index)); });
    $("#sampleSizeResult").textContent = String(selected.length); $("#strataCount").textContent = groupSet.size + " / 4"; $("#clusterCount").textContent = currentPlan === "cluster" ? chosenClusters.length + " / 8" : "個別抽取";
    $("#planInsight").textContent = currentPlan === "simple" ? "簡單隨機抽樣不保證每次都均衡涵蓋四層；它保證的是抽取機會。" : currentPlan === "stratified" ? "每層固定抽 5 人，因此四層都有代表；適合比較各層。" : "這次抽中兩個完整集群，共 20 人；成本較低，但同群成員可能彼此相似。";
  }
  $$('[data-plan]').forEach(function (button) { button.addEventListener("click", function () { renderPlanCopy(button.dataset.plan); }); }); $("#drawSample").addEventListener("click", drawSample); renderPlanCopy("simple");

  var populationRng = seededRandom(5505); var numericPopulation = Array.from({ length: 300 }, function () { return 50 + (populationRng() - .5) * 34 + (populationRng() - .5) * 16; }); var adjustment = 50 - mean(numericPopulation); numericPopulation = numericPopulation.map(function (value) { return value + adjustment; }); var repeatRun = 0;
  function simulateSamples() {
    repeatRun += 1; var n = Number($("#sampleSizeInput").value); var rng = seededRandom(5600 + repeatRun * 101 + n); var estimates = [];
    for (var run = 0; run < 60; run += 1) { var values = []; for (var draw = 0; draw < n; draw += 1) { values.push(numericPopulation[Math.floor(rng() * numericPopulation.length)]); } estimates.push(mean(values)); }
    var stacks = {}; $("#samplingDistribution").querySelectorAll("b").forEach(function (node) { node.remove(); });
    estimates.forEach(function (estimate) { var bucket = Math.round(estimate * 2) / 2; stacks[bucket] = (stacks[bucket] || 0) + 1; var point = document.createElement("b"); point.style.setProperty("--x", Math.max(1, Math.min(99, (estimate - 35) / 30 * 100)) + "%"); point.style.setProperty("--y", (12 + (stacks[bucket] - 1) * 13) + "px"); point.title = estimate.toFixed(2); $("#samplingDistribution").appendChild(point); });
    var errors = estimates.map(function (estimate) { return Math.abs(estimate - 50); }); $("#sampleSizeOutput").textContent = String(n); $("#meanError").textContent = mean(errors).toFixed(2); $("#minimumEstimate").textContent = Math.min.apply(null, estimates).toFixed(2); $("#maximumEstimate").textContent = Math.max.apply(null, estimates).toFixed(2);
  }
  $("#sampleSizeInput").addEventListener("input", simulateSamples); $("#repeatSamples").addEventListener("click", simulateSamples); simulateSamples();

  var errorContent = {
    measurement: { kicker: "MEASUREMENT", title: "記錄值與真實值不一致", cause: "設備失準、輸入錯誤、題意被誤解", risk: "所有樣本都可能朝同一方向偏移", fix: "校正設備、預試問卷、驗證資料流程" },
    nonresponse: { kicker: "NONRESPONSE", title: "被選中的人沒有完成回答", cause: "聯絡不到、拒答、問卷過長", risk: "回答者與未回答者可能有系統差異", fix: "追訪、縮短問卷、比較回應者結構" },
    selection: { kicker: "SELECTION BIAS", title: "某些目標成員沒有被選中的機會", cause: "抽樣框不完整、自願參加、只在方便地點招募", risk: "樣本從一開始就無法代表目標母體", fix: "重建抽樣框、分層涵蓋、避免自願樣本" }
  };
  function renderError(key) { var item = errorContent[key]; $("#errorKicker").textContent = item.kicker; $("#errorTitle").textContent = item.title; $("#errorCause").textContent = item.cause; $("#errorRisk").textContent = item.risk; $("#errorFix").textContent = item.fix; $$('[data-error]').forEach(function (button) { button.classList.toggle("active", button.dataset.error === key); }); }
  $$('[data-error]').forEach(function (button) { button.addEventListener("click", function () { renderError(button.dataset.error); }); }); renderError("measurement");

  function updateBias() {
    var supporterResponse = Number($("#groupAResponse").value) / 100; var otherResponse = Number($("#groupBResponse").value) / 100; var observed = (0.6 * supporterResponse) / (0.6 * supporterResponse + 0.4 * otherResponse) * 100; var bias = observed - 60;
    $("#groupAOutput").textContent = Math.round(supporterResponse * 100) + "%"; $("#groupBOutput").textContent = Math.round(otherResponse * 100) + "%"; $("#observedSupport").textContent = observed.toFixed(1) + "%"; $("#observedBar").style.setProperty("--w", observed + "%"); $("#biasAmount").textContent = (bias >= 0 ? "+" : "") + bias.toFixed(1) + " 個百分點";
    $("#biasInsight").textContent = Math.abs(bias) < .5 ? "兩群回應率相同，這個簡化模型下沒有無回應偏差。" : "兩群回應率不同，使樣本中的群體比例改變。增加相同模式的回覆數，只會讓錯誤估計更穩定。";
  }
  ["groupAResponse", "groupBResponse"].forEach(function (id) { $("#" + id).addEventListener("input", updateBias); }); updateBias();
})();
