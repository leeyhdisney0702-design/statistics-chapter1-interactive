(function () {
  "use strict";

  var $ = function (selector, scope) { return (scope || document).querySelector(selector); };
  var $$ = function (selector, scope) { return Array.from((scope || document).querySelectorAll(selector)); };
  var round = function (value, digits) { var p = Math.pow(10, digits || 0); return Math.round(value * p) / p; };
  var sum = function (values) { return values.reduce(function (total, value) { return total + value; }, 0); };
  function mean(values) { return sum(values) / values.length; }
  function sorted(values) { return values.slice().sort(function (a, b) { return a - b; }); }
  function median(values) { var data = sorted(values); var middle = Math.floor(data.length / 2); return data.length % 2 ? data[middle] : (data[middle - 1] + data[middle]) / 2; }
  function variance(values) { var average = mean(values); return values.reduce(function (total, value) { return total + Math.pow(value - average, 2); }, 0) / (values.length - 1); }
  function sd(values) { return Math.sqrt(variance(values)); }
  function modes(values) {
    var counts = {};
    values.forEach(function (value) { counts[value] = (counts[value] || 0) + 1; });
    var maximum = Math.max.apply(null, Object.values(counts));
    if (maximum === 1) { return []; }
    return Object.keys(counts).filter(function (key) { return counts[key] === maximum; }).map(Number).sort(function (a, b) { return a - b; });
  }
  function percentile(values, p) {
    var data = sorted(values);
    var location = (data.length + 1) * p / 100;
    if (location <= 1) { return { value: data[0], location: location }; }
    if (location >= data.length) { return { value: data[data.length - 1], location: location }; }
    var lowerPosition = Math.floor(location);
    var fraction = location - lowerPosition;
    var lower = data[lowerPosition - 1];
    var upper = data[lowerPosition];
    return { value: lower + fraction * (upper - lower), location: location };
  }
  function seededRandom(seed) {
    var state = seed >>> 0;
    return function () { state = (state * 1664525 + 1013904223) >>> 0; return state / 4294967296; };
  }

  var menuButton = $("#menuButton");
  var mobileNav = $("#mobileNav");
  var chapterSelect = $("#chapterSelect");
  chapterSelect.addEventListener("change", function () {
    window.location.assign(chapterSelect.value);
  });
  menuButton.addEventListener("click", function () {
    var open = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!open));
    mobileNav.hidden = open;
  });
  $$("a", mobileNav).forEach(function (link) { link.addEventListener("click", function () { mobileNav.hidden = true; menuButton.setAttribute("aria-expanded", "false"); }); });

  function updateReadingProgress() {
    var scrollable = document.documentElement.scrollHeight - window.innerHeight;
    $("#readingProgress").style.width = (scrollable > 0 ? Math.min(100, Math.max(0, window.scrollY / scrollable * 100)) : 0) + "%";
  }
  window.addEventListener("scroll", updateReadingProgress, { passive: true });
  updateReadingProgress();

  var reveals = $$(".reveal");
  if ("IntersectionObserver" in window) {
    var revealObserver = new IntersectionObserver(function (entries) { entries.forEach(function (entry) { if (entry.isIntersecting) { entry.target.classList.add("visible"); revealObserver.unobserve(entry.target); } }); }, { threshold: .07 });
    reveals.forEach(function (item) { revealObserver.observe(item); });
  } else { reveals.forEach(function (item) { item.classList.add("visible"); }); }

  var baseData = [0, 7, 12, 5, 33, 14, 8, 0, 9, 22];
  var heroData = sorted(baseData);
  var heroMax = Math.max.apply(null, heroData);
  heroData.forEach(function (value, index) {
    var dot = document.createElement("i");
    dot.style.setProperty("--x", (7 + value / heroMax * 86) + "%");
    dot.style.setProperty("--y", ((index % 3) * 24 - 24) + "px");
    $("#heroNumberLine").appendChild(dot);
  });
  $("#heroMean").textContent = mean(heroData).toFixed(1);
  $("#heroMedian").textContent = median(heroData).toFixed(1);
  $("#heroSd").textContent = sd(heroData).toFixed(1);

  var storyItems = [
    { number: "11.0", title: "中央：這批資料的典型水準", body: "平均數、中位數與眾數從不同角度回答『通常是多少』；選擇要配合資料分布。" },
    { number: "10.8", title: "變異：觀測值彼此差多遠", body: "標準差把每筆資料離平均的距離濃縮成同一單位的數字，用來比較一致性與風險。" },
    { number: "P75", title: "位置：一筆資料排在哪裡", body: "百分位數與四分位數讓單一分數回到整體排序中，排名才有比較基準。" },
    { number: "+.87", title: "關係：兩個變數是否一起移動", body: "相關係數描述線性方向與強度；R²則描述線性模型能解釋多少變異。" }
  ];
  function renderStory(index) {
    var item = storyItems[index];
    $("#storyOutput").innerHTML = "<b>" + item.number + "</b><div><h3>" + item.title + "</h3><p>" + item.body + "</p></div>";
    $$('[data-story-step]').forEach(function (button, buttonIndex) { var active = buttonIndex === index; button.classList.toggle("active", active); button.setAttribute("aria-pressed", String(active)); });
  }
  $$('[data-story-step]').forEach(function (button) { button.addEventListener("click", function () { renderStory(Number(button.dataset.storyStep)); }); });
  renderStory(0);

  var centerMethods = {
    mean: { kicker: "BALANCE POINT", title: "把所有觀測值納入計算", body: "平均數使用每一筆資料，因此資訊完整，但也容易被極端值拉動。", formula: "x̄ = Σx / n", use: "區間或比例資料，且分布沒有嚴重偏斜時。" },
    median: { kicker: "ORDERED MIDDLE", title: "先排序，再找正中央的位置", body: "中位數只在意順序與中央位置，對少數極端值較有抵抗力。", formula: "Median = 中間位置", use: "偏斜分布、有極端值，或順序資料。" },
    mode: { kicker: "MOST FREQUENT", title: "找出現次數最多的值或類別", body: "眾數可以用在名目資料，但不一定落在數值分布的中央。", formula: "Mode = arg max f(x)", use: "類別資料，或想知道最常見選項時。" }
  };
  function renderCenterMethod(key) {
    var item = centerMethods[key];
    $("#centerKicker").textContent = item.kicker; $("#centerTitle").textContent = item.title; $("#centerBody").textContent = item.body; $("#centerFormula").textContent = item.formula; $("#centerUse").textContent = item.use;
    $$('[data-center-method]').forEach(function (button) { var active = button.dataset.centerMethod === key; button.classList.toggle("active", active); button.setAttribute("aria-selected", String(active)); });
  }
  $$('[data-center-method]').forEach(function (button) { button.addEventListener("click", function () { renderCenterMethod(button.dataset.centerMethod); }); });
  renderCenterMethod("mean");

  function renderOutlierLab() {
    var outlier = Number($("#outlierValue").value);
    var data = baseData.map(function (value) { return value === 33 ? outlier : value; });
    var ordered = sorted(data); var maximum = Math.max.apply(null, ordered);
    $("#outlierOutput").textContent = String(outlier);
    $("#centerNumberStrip").innerHTML = ordered.map(function (value, index) {
      var height = 18 + value / maximum * 150;
      var classes = [];
      if (index === 4 || index === 5) { classes.push("median"); }
      if (value === maximum) { classes.push("outlier"); }
      return '<i class="' + classes.join(" ") + '" style="--h:' + height.toFixed(1) + 'px"><span>' + value + '</span></i>';
    }).join("");
    var average = mean(data); var middle = median(data); var dataModes = modes(data);
    $("#meanValue").textContent = average.toFixed(1); $("#medianValue").textContent = middle.toFixed(1); $("#modeValue").textContent = dataModes.length ? dataModes.join("、") : "無"; $("#centerGap").textContent = (average - middle >= 0 ? "+" : "") + (average - middle).toFixed(1);
    var shift = average - mean(baseData);
    $("#outlierInsight").textContent = outlier === 33 ? "原始資料中平均數為 11.0，中位數為 8.5。開始拖動最大值，觀察兩者反應。" : "最大值增加後，平均數上升了 " + shift.toFixed(1) + "；中位數仍是 " + middle.toFixed(1) + "。這就是中位數對極端值較不敏感的原因。";
  }
  $("#outlierValue").addEventListener("input", renderOutlierLab);
  $("#resetOutlier").addEventListener("click", function () { $("#outlierValue").value = "33"; renderOutlierLab(); });
  renderOutlierLab();

  var currency = new Intl.NumberFormat("zh-TW", { style: "currency", currency: "TWD", maximumFractionDigits: 0 });
  function signedPercent(value) { return (value >= 0 ? "+" : "−") + Math.abs(value).toFixed(0) + "%"; }
  function updateGrowth() {
    var r1 = Number($("#return1").value); var r2 = Number($("#return2").value);
    $("#return1Output").textContent = signedPercent(r1); $("#return2Output").textContent = signedPercent(r2);
    var final = 10000 * (1 + r1 / 100) * (1 + r2 / 100);
    var arithmetic = (r1 + r2) / 2;
    var geometric = Math.sqrt(Math.max(0, (1 + r1 / 100) * (1 + r2 / 100))) - 1;
    $("#finalValue").textContent = currency.format(final);
    $("#returnCompare").textContent = "算術平均報酬 " + signedPercent(arithmetic) + "；幾何平均報酬 " + signedPercent(geometric * 100) + "。";
    $("#returnBadge").textContent = Math.abs(arithmetic - geometric * 100) > 1 ? "複利情境應看幾何平均" : "兩種平均相近";
  }
  ["return1", "return2"].forEach(function (id) { $("#" + id).addEventListener("input", updateGrowth); });
  updateGrowth();

  var dataA = [4,4,4,4,4,50]; var dataB = [4,8,15,24,39,50];
  function renderDistribution(id, metricsId, values) {
    var counts = {};
    $("#" + id).innerHTML = values.map(function (value) { counts[value] = (counts[value] || 0) + 1; return '<i style="--x:' + (value / 54 * 100).toFixed(2) + '%;--stack:' + ((counts[value] - 1) * 22) + 'px" title="' + value + '"></i>'; }).join("");
    $("#" + metricsId).innerHTML = "<div><span>全距</span><b>46</b></div><div><span>變異數</span><b>" + variance(values).toFixed(1) + "</b></div><div><span>標準差</span><b>" + sd(values).toFixed(1) + "</b></div>";
  }
  renderDistribution("distributionA", "metricsA", dataA); renderDistribution("distributionB", "metricsB", dataB);

  var activeRule = "empirical";
  function updateRule() {
    var k = Number($("#kValue").value); var coverage;
    $("#kOutput").textContent = k + "σ";
    if (activeRule === "empirical") {
      coverage = { 1: 68, 2: 95, 3: 99.7, 4: 99.99 }[k];
      $("#coverageValue").textContent = "約 " + coverage + "%";
      $("#coverageText").textContent = "鐘形分布中，約 " + coverage + "% 的觀測值落在平均左右 " + k + " 個標準差內。";
    } else {
      coverage = k === 1 ? 0 : (1 - 1 / (k * k)) * 100;
      $("#coverageValue").textContent = k === 1 ? "無有效下限" : "至少 " + coverage.toFixed(1) + "%";
      $("#coverageText").textContent = k === 1 ? "柴比雪夫定理在 k > 1 時才給出有用的比例下限。" : "不論分布形狀，至少 " + coverage.toFixed(1) + "% 的觀測值落在平均左右 " + k + " 個標準差內。";
    }
    var width = Math.min(88, 20 + k * 17);
    $("#coverageBand").style.setProperty("--width", width + "%"); $("#coverageBand").style.setProperty("--left", (50 - width / 2) + "%");
  }
  $$('[data-rule]').forEach(function (button) { button.addEventListener("click", function () { activeRule = button.dataset.rule; $$('[data-rule]').forEach(function (item) { item.classList.toggle("active", item === button); }); updateRule(); }); });
  $("#kValue").addEventListener("input", updateRule); updateRule();

  var percentileData = [0,0,5,7,8,9,12,14,22,33];
  function updatePercentile() {
    var p = Number($("#percentileInput").value); var result = percentile(percentileData, p); var minimum = percentileData[0]; var maximum = percentileData[percentileData.length - 1];
    $("#percentileOutput").textContent = String(p); $("#percentileName").textContent = "P" + p; $("#percentileValue").textContent = round(result.value, 2).toString();
    $("#percentileExplain").textContent = "近似位置 L = " + result.location.toFixed(2) + "；約有 " + p + "% 的資料不高於這個位置。";
    $("#percentileRuler").innerHTML = percentileData.map(function (value, index) { var isNear = Math.abs(index + 1 - result.location) < .6; return '<i class="' + (isNear ? "active" : "") + '" style="--x:' + (4 + (value - minimum) / (maximum - minimum) * 92).toFixed(2) + '%"><span>' + value + '</span></i>'; }).join("");
    var q1 = percentile(percentileData, 25).value; var q2 = percentile(percentileData, 50).value; var q3 = percentile(percentileData, 75).value;
    $("#q1Value").textContent = q1.toFixed(2); $("#q2Value").textContent = q2.toFixed(2); $("#q3Value").textContent = q3.toFixed(2); $("#iqrValue").textContent = (q3 - q1).toFixed(2);
    var scale = function (value) { return (2 + (value - minimum) / (maximum - minimum) * 96) + "%"; };
    $("#boxplot").style.setProperty("--q1", scale(q1)); $("#boxplot").style.setProperty("--median", scale(q2)); $("#boxplot").style.setProperty("--iqr", ((q3 - q1) / (maximum - minimum) * 96) + "%");
  }
  $("#percentileInput").addEventListener("input", updatePercentile); updatePercentile();

  var scatterSeed = 4401;
  function updateScatter() {
    var trend = Number($("#slopeInput").value); var noise = Number($("#noiseInput").value); var rng = seededRandom(scatterSeed); var points = [];
    for (var i = 1; i <= 24; i += 1) { points.push({ x: i, y: 55 + trend * (i - 12) / 2 + (rng() - .5) * noise * 10 }); }
    var xs = points.map(function (point) { return point.x; }); var ys = points.map(function (point) { return point.y; }); var xMean = mean(xs); var yMean = mean(ys);
    var covariance = points.reduce(function (total, point) { return total + (point.x - xMean) * (point.y - yMean); }, 0) / (points.length - 1);
    var xVariance = variance(xs); var slope = xVariance ? covariance / xVariance : 0; var intercept = yMean - slope * xMean; var correlation = sd(xs) && sd(ys) ? covariance / (sd(xs) * sd(ys)) : 0;
    var minY = Math.min.apply(null, ys.concat([intercept + slope, intercept + slope * 24])); var maxY = Math.max.apply(null, ys.concat([intercept + slope, intercept + slope * 24])); var paddingY = Math.max(8, (maxY - minY) * .12); minY -= paddingY; maxY += paddingY;
    var xScale = function (value) { return 48 + (value - 1) / 23 * 560; }; var yScale = function (value) { return 320 - (value - minY) / (maxY - minY) * 280; };
    var grid = ""; for (var gridIndex = 0; gridIndex <= 5; gridIndex += 1) { var gx = 48 + gridIndex * 112; var gy = 40 + gridIndex * 56; grid += '<line class="grid-line" x1="' + gx + '" y1="40" x2="' + gx + '" y2="320"></line><line class="grid-line" x1="48" y1="' + gy + '" x2="608" y2="' + gy + '"></line>'; }
    var circles = points.map(function (point) { return '<circle class="point" cx="' + xScale(point.x).toFixed(1) + '" cy="' + yScale(point.y).toFixed(1) + '" r="6"></circle>'; }).join("");
    var line = '<line class="regression-line" x1="' + xScale(1) + '" y1="' + yScale(intercept + slope) + '" x2="' + xScale(24) + '" y2="' + yScale(intercept + slope * 24) + '"></line>';
    $("#scatterPlot").innerHTML = grid + '<line class="axis-line" x1="48" y1="320" x2="608" y2="320"></line><line class="axis-line" x1="48" y1="40" x2="48" y2="320"></line>' + line + circles;
    $("#slopeOutput").textContent = trend > 0 ? "正向" : trend < 0 ? "負向" : "無趨勢"; $("#noiseOutput").textContent = noise < 3 ? "低" : noise < 7 ? "中低" : noise < 10 ? "中高" : "高";
    $("#correlationValue").textContent = correlation.toFixed(3); $("#rSquaredValue").textContent = (correlation * correlation * 100).toFixed(1) + "%"; $("#regressionEquation").textContent = "ŷ = " + intercept.toFixed(1) + (slope >= 0 ? " + " : " − ") + Math.abs(slope).toFixed(2) + "x";
  }
  ["slopeInput", "noiseInput"].forEach(function (id) { $("#" + id).addEventListener("input", updateScatter); });
  $("#newScatter").addEventListener("click", function () { scatterSeed += 97; updateScatter(); }); updateScatter();

  function updateBreakeven() {
    var price = Number($("#priceInput").value); var variable = Number($("#variableInput").value); var fixed = Number($("#fixedInput").value); var contribution = price - variable;
    $("#priceOutput").textContent = "$" + price.toLocaleString("zh-TW"); $("#variableOutput").textContent = "$" + variable.toLocaleString("zh-TW"); $("#fixedOutput").textContent = "$" + fixed.toLocaleString("zh-TW");
    if (contribution <= 0) { $("#breakevenUnits").textContent = "無法達成"; $("#breakevenText").textContent = "售價沒有高於單位變動成本，每多賣一件都不會回收固定成本。"; $("#breakevenBadge").textContent = "先調整價格或成本"; return; }
    var units = Math.ceil(fixed / contribution); $("#breakevenUnits").textContent = units.toLocaleString("zh-TW") + " 件"; $("#breakevenText").textContent = "每件貢獻 $" + contribution.toLocaleString("zh-TW") + "；從第 " + (units + 1).toLocaleString("zh-TW") + " 件起開始產生正利潤。"; $("#breakevenBadge").textContent = "單位貢獻為售價的 " + (contribution / price * 100).toFixed(0) + "%";
  }
  ["priceInput", "variableInput", "fixedInput"].forEach(function (id) { $("#" + id).addEventListener("input", updateBreakeven); }); updateBreakeven();

  var quizItems = [
    { question: "少數豪宅讓房價分布嚴重右偏，要描述典型房價，優先看什麼？", options: ["平均數", "中位數", "全距"], correct: 1, feedback: "中位數對少數極高房價較不敏感，較能代表典型位置。" },
    { question: "比較兩支球桿擊球距離的一致性，應優先比較什麼？", options: ["標準差", "眾數", "第 90 百分位"], correct: 0, feedback: "標準差較小表示擊球距離更集中，也就是一致性較高。" },
    { question: "想知道銷售量能解釋多少成本變異，該看什麼？", options: ["相關係數的正負", "判定係數 R²", "中位數"], correct: 1, feedback: "R²能解讀為線性模型所解釋的變異比例。" }
  ];
  var quizIndex = 0; var answered = false;
  function renderQuiz() {
    var item = quizItems[quizIndex]; answered = false; $("#quizQuestion").textContent = item.question; $("#quizFeedback").textContent = "選一個答案，再查看理由。"; $("#nextQuiz").hidden = true;
    $("#quizOptions").innerHTML = item.options.map(function (option, index) { return '<button type="button" data-quiz-option="' + index + '">' + option + '</button>'; }).join("");
    $$('[data-quiz-option]').forEach(function (button) { button.addEventListener("click", function () { if (answered) { return; } answered = true; var choice = Number(button.dataset.quizOption); $$('[data-quiz-option]').forEach(function (optionButton, index) { optionButton.disabled = true; if (index === item.correct) { optionButton.classList.add("correct"); } }); if (choice !== item.correct) { button.classList.add("wrong"); } $("#quizFeedback").textContent = (choice === item.correct ? "答對了。" : "再想一下。") + item.feedback; $("#nextQuiz").hidden = false; }); });
  }
  $("#nextQuiz").addEventListener("click", function () { quizIndex = (quizIndex + 1) % quizItems.length; renderQuiz(); }); renderQuiz();
})();
