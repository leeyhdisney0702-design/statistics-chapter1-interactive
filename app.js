(function () {
  "use strict";

  var $ = function (selector, scope) { return (scope || document).querySelector(selector); };
  var $$ = function (selector, scope) { return Array.from((scope || document).querySelectorAll(selector)); };
  var round = function (number, digits) {
    var factor = Math.pow(10, digits || 0);
    return Math.round(number * factor) / factor;
  };

  function seededRandom(seed) {
    var state = seed >>> 0;
    return function () {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 4294967296;
    };
  }

  var rng = seededRandom(1012024);
  var heroDots = $("#heroDots");
  var dotColors = ["#86e7de", "#ff6b55", "#f5d76e", "#ffffff"];
  for (var dotIndex = 0; dotIndex < 24; dotIndex += 1) {
    var dot = document.createElement("i");
    dot.style.setProperty("--x", (8 + rng() * 84).toFixed(1) + "%");
    dot.style.setProperty("--y", (7 + rng() * 82).toFixed(1) + "%");
    dot.style.setProperty("--s", (8 + rng() * 11).toFixed(0) + "px");
    dot.style.setProperty("--c", dotColors[dotIndex % dotColors.length]);
    dot.style.setProperty("--d", (-rng() * 3).toFixed(2) + "s");
    heroDots.appendChild(dot);
  }

  var menuButton = $("#menuButton");
  var mobileNav = $("#mobileNav");
  menuButton.addEventListener("click", function () {
    var open = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!open));
    mobileNav.hidden = open;
  });
  $$("a", mobileNav).forEach(function (link) {
    link.addEventListener("click", function () {
      mobileNav.hidden = true;
      menuButton.setAttribute("aria-expanded", "false");
    });
  });

  var readingProgress = $("#readingProgress");
  function updateReadingProgress() {
    var scrollable = document.documentElement.scrollHeight - window.innerHeight;
    var value = scrollable > 0 ? window.scrollY / scrollable * 100 : 0;
    readingProgress.style.width = Math.max(0, Math.min(100, value)) + "%";
  }
  window.addEventListener("scroll", updateReadingProgress, { passive: true });
  updateReadingProgress();

  var reveals = $$(".reveal");
  if ("IntersectionObserver" in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    reveals.forEach(function (item) { revealObserver.observe(item); });
  } else {
    reveals.forEach(function (item) { item.classList.add("visible"); });
  }

  var storySteps = [
    { number: "24", title: "先忠實記錄觀察", body: "例如：24 位顧客的等候時間。此時只有一列數字，尚未回答好或壞、快或慢。" },
    { number: "4.8", title: "用方法濃縮訊號", body: "計算平均、中位數與分布，並檢查極端值。統計把個別紀錄整理成可比較的模式。" },
    { number: "+1", title: "把結果連回決策", body: "若尖峰平均等候超過目標，就多開一個櫃台。資訊的價值，在於它能支持具體行動。" }
  ];
  var storyOutput = $("#storyOutput");
  function showStory(index) {
    var item = storySteps[index];
    storyOutput.innerHTML = "<b>" + item.number + "</b><div><h3>" + item.title + "</h3><p>" + item.body + "</p></div>";
    $$('[data-story-step]').forEach(function (button, buttonIndex) {
      var active = buttonIndex === index;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }
  $$('[data-story-step]').forEach(function (button) {
    button.addEventListener("click", function () { showStory(Number(button.dataset.storyStep)); });
  });
  showStory(0);

  var methodContent = {
    descriptive: {
      kicker: "WHAT HAPPENED?",
      title: "把已有資料整理成看得懂的樣子",
      body: "用圖表、平均數、中位數或百分比，精準描述手上這一批資料；結論不超出資料本身。",
      example: "整理本班 42 位同學的考試成績，算出平均分數與分布。",
      heights: [34, 49, 75, 61, 87, 67, 55, 45, 72, 58]
    },
    inferential: {
      kicker: "WHAT MAY BE TRUE?",
      title: "用樣本，對更大的母體做有風險的判斷",
      body: "從樣本結果估計、預測或檢定母體特性，並用信賴區間或顯著水準表達不確定性。",
      example: "訪問 500 位學生，推估全校 50,000 人每週的飲料需求。",
      heights: [72, 54, 83, 63, 76, 58, 68, 50, 65, 56]
    }
  };
  function renderMethod(method) {
    var content = methodContent[method];
    $("#methodKicker").textContent = content.kicker;
    $("#methodTitle").textContent = content.title;
    $("#methodBody").textContent = content.body;
    $("#methodExample").textContent = content.example;
    var chart = $("#methodChart");
    chart.classList.toggle("inferential", method === "inferential");
    chart.innerHTML = "";
    content.heights.forEach(function (height, index) {
      var bar = document.createElement("i");
      bar.style.setProperty("--h", height + "%");
      bar.style.setProperty("--bar", method === "inferential" && index >= 6 ? "#ff6b55" : "#86e7de");
      chart.appendChild(bar);
    });
    $$('[data-method]').forEach(function (button) {
      var active = button.dataset.method === method;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", String(active));
    });
  }
  $$('[data-method]').forEach(function (button) {
    button.addEventListener("click", function () { renderMethod(button.dataset.method); });
  });
  renderMethod("descriptive");

  var populationRng = seededRandom(202409);
  var population = Array.from({ length: 100 }, function (_, index) {
    var seasonal = Math.sin(index * 0.74) * 0.72;
    return Math.max(0.4, round(4.7 + seasonal + (populationRng() - 0.5) * 4.2, 1));
  });
  var populationMean = population.reduce(function (sum, value) { return sum + value; }, 0) / population.length;
  var populationGrid = $("#populationGrid");
  population.forEach(function (value, index) {
    var person = document.createElement("i");
    person.dataset.index = String(index);
    person.title = "每週 " + value.toFixed(1) + " 杯";
    populationGrid.appendChild(person);
  });
  $("#populationMean").textContent = populationMean.toFixed(2) + " 杯";

  var sampleRun = 0;
  function resample() {
    sampleRun += 1;
    var size = Number($("#sampleSize").value);
    $("#sampleSizeOutput").textContent = String(size);
    var indices = population.map(function (_, index) { return index; });
    var sampleRng = seededRandom(9000 + sampleRun * 97 + size);
    for (var i = indices.length - 1; i > 0; i -= 1) {
      var j = Math.floor(sampleRng() * (i + 1));
      var temp = indices[i]; indices[i] = indices[j]; indices[j] = temp;
    }
    var selected = new Set(indices.slice(0, size));
    $$("i", populationGrid).forEach(function (person, index) { person.classList.toggle("selected", selected.has(index)); });
    var sampleValues = indices.slice(0, size).map(function (index) { return population[index]; });
    var mean = sampleValues.reduce(function (sum, value) { return sum + value; }, 0) / size;
    var error = mean - populationMean;
    $("#sampleMean").textContent = mean.toFixed(2) + " 杯";
    $("#sampleError").textContent = (error >= 0 ? "+" : "") + error.toFixed(2) + " 杯";
    var message = size < 20 ? "樣本偏小，重抽時平均數可能明顯跳動。" : size < 50 ? "樣本變大後，估計通常會更穩定，但仍不保證完全等於母體。" : "大樣本通常更穩定；抽樣方式是否具代表性仍同樣重要。";
    $("#samplingNote").textContent = message;
  }
  $("#sampleSize").addEventListener("input", resample);
  $("#resampleButton").addEventListener("click", resample);
  resample();

  var currency = new Intl.NumberFormat("zh-TW", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  function updateDecisionCase() {
    var cups = Number($("#cupsInput").value);
    var price = Number($("#priceInput").value);
    var cost = Number($("#costInput").value);
    $("#cupsOutput").textContent = cups.toFixed(2);
    $("#priceOutput").textContent = price.toFixed(2);
    $("#costOutput").textContent = cost.toFixed(2);
    var annualUnits = 50000 * 40 * cups;
    var profit = annualUnits * (price * 0.65 - cost) - 200000;
    var marginCups = 1.96 * 1.6 / Math.sqrt(500);
    var lowerProfit = 50000 * 40 * Math.max(0, cups - marginCups) * (price * 0.65 - cost) - 200000;
    var upperProfit = 50000 * 40 * (cups + marginCups) * (price * 0.65 - cost) - 200000;
    $("#profitResult").textContent = currency.format(profit);
    $("#profitRange").textContent = "以 95% 估計區間換算：約 " + currency.format(Math.min(lowerProfit, upperProfit)) + " ～ " + currency.format(Math.max(lowerProfit, upperProfit));
    var badge = $("#decisionBadge");
    var good = lowerProfit > 0;
    badge.textContent = good ? "區間下限仍獲利：可進一步談判" : profit > 0 ? "平均估計獲利，但下限有風險" : "目前條件不具吸引力";
    badge.classList.toggle("risky", !good);
  }
  ["cupsInput", "priceInput", "costInput"].forEach(function (id) { $("#" + id).addEventListener("input", updateDecisionCase); });
  updateDecisionCase();

  function updateConfidence(level) {
    var widths = { 90: 43, 95: 54, 99: 72 };
    var alpha = 100 - level;
    $("#intervalBand").style.width = widths[level] + "%";
    $("#intervalBand").style.left = (50 - widths[level] / 2) + "%";
    $("#confidenceText").textContent = level + "% 信賴水準 ↔ α = " + alpha + "%";
    $$('[data-confidence]').forEach(function (button) { button.classList.toggle("active", Number(button.dataset.confidence) === level); });
  }
  $$('[data-confidence]').forEach(function (button) {
    button.addEventListener("click", function () { updateConfidence(Number(button.dataset.confidence)); });
  });
  updateConfidence(95);

  var applications = {
    marketing: { index: "01", question: "哪一個廣告版本真的提高轉換率？", data: "A/B 兩組曝光、點擊與購買紀錄", method: "比例比較與假設檢定", action: "選擇有效版本，而非只看表面差異", takeaway: "差異存在，不代表差異大到足以排除隨機波動。" },
    finance: { index: "02", question: "投資組合的報酬，是否值得承擔波動？", data: "歷史報酬率、利率與市場指數", method: "平均報酬、標準差與情境模擬", action: "在報酬與風險之間配置資產", takeaway: "只看平均報酬會忽略達成這個平均所承擔的風險。" },
    hr: { index: "03", question: "離職率上升，是全面問題還是集中現象？", data: "年資、部門、工時、薪資與離職紀錄", method: "分群比較與迴歸分析", action: "把留才方案集中在高風險環節", takeaway: "模型能找出關聯，但不應把員工簡化成一個分數。" },
    operations: { index: "04", question: "要準備多少庫存，才不會缺貨又不過量？", data: "每日需求、交期與季節性紀錄", method: "需求分布、預測與安全庫存", action: "設定補貨點與服務水準", takeaway: "平均需求不足以應付尖峰；變異決定安全庫存。" },
    accounting: { index: "05", question: "哪些交易值得優先查核？", data: "傳票金額、時間、供應商與核准路徑", method: "異常值偵測與抽樣查核", action: "把稽核資源放在高風險紀錄", takeaway: "異常不一定是舞弊，而是需要更多證據的訊號。" },
    economics: { index: "06", question: "價格上升後，需求究竟會下降多少？", data: "價格、銷量、所得與替代品資訊", method: "彈性估計與迴歸模型", action: "評估定價、政策或市場衝擊", takeaway: "其他條件若同時改變，單純前後比較可能誤判因果。" }
  };
  function renderApplication(key) {
    var app = applications[key];
    $("#appIndex").textContent = app.index;
    $("#appQuestion").textContent = app.question;
    $("#appData").textContent = app.data;
    $("#appMethod").textContent = app.method;
    $("#appAction").textContent = app.action;
    $("#appTakeaway").textContent = "重點：" + app.takeaway;
    $$('[data-app]').forEach(function (button) { button.classList.toggle("active", button.dataset.app === key); });
  }
  $$('[data-app]').forEach(function (button) { button.addEventListener("click", function () { renderApplication(button.dataset.app); }); });
  renderApplication("marketing");

  var categories = ["飲品", "餐食", "文具", "日用品", "票券"];
  var baseAmounts = [95, 165, 72, 130, 220];
  var transactionRng = seededRandom(130240);
  var transactions = [];
  for (var transactionIndex = 1; transactionIndex <= 240; transactionIndex += 1) {
    var categoryIndex = Math.floor(transactionRng() * categories.length);
    var amount = baseAmounts[categoryIndex] * (0.55 + transactionRng() * 1.1);
    var issue = "";
    if (transactionIndex % 37 === 0) { amount *= 11; issue = "異常值"; }
    if (transactionIndex % 53 === 0) { issue = "重複"; }
    transactions.push({ id: "T" + String(transactionIndex).padStart(3, "0"), category: categories[categoryIndex], amount: round(amount, 0), issue: issue });
  }
  function renderTransactions(mode) {
    var cleaned = mode === "clean";
    var visible = cleaned ? transactions.filter(function (transaction) { return !transaction.issue; }) : transactions.slice();
    var total = visible.reduce(function (sum, transaction) { return sum + transaction.amount; }, 0);
    var issues = transactions.filter(function (transaction) { return transaction.issue; }).length;
    $("#recordCount").textContent = visible.length.toLocaleString("zh-TW");
    $("#averageOrder").textContent = "NT$ " + Math.round(total / visible.length).toLocaleString("zh-TW");
    $("#issueCount").textContent = cleaned ? "已移除 " + issues : String(issues);
    $("#chartModeLabel").textContent = cleaned ? "排除異常與重複" : "含異常與重複";
    var totals = categories.map(function (category) {
      return visible.filter(function (transaction) { return transaction.category === category; }).reduce(function (sum, transaction) { return sum + transaction.amount; }, 0);
    });
    var maxTotal = Math.max.apply(null, totals);
    $("#categoryChart").innerHTML = categories.map(function (category, index) {
      var width = maxTotal ? totals[index] / maxTotal * 100 : 0;
      return "<div class=\"bar-row\"><span>" + category + "</span><div class=\"bar-track\"><div class=\"bar-fill\" style=\"--w:" + width.toFixed(1) + "%\"></div></div><b>" + Math.round(totals[index] / 1000) + "k</b></div>";
    }).join("");
    $("#transactionRows").innerHTML = visible.slice(0, 7).map(function (transaction) {
      var status = transaction.issue || "正常";
      return "<tr><td>" + transaction.id + "</td><td>" + transaction.category + "</td><td>NT$ " + transaction.amount.toLocaleString("zh-TW") + "</td><td><span class=\"status-pill " + (transaction.issue ? "issue" : "") + "\">" + status + "</span></td></tr>";
    }).join("");
    var rawAverage = transactions.reduce(function (sum, transaction) { return sum + transaction.amount; }, 0) / transactions.length;
    var cleanValues = transactions.filter(function (transaction) { return !transaction.issue; });
    var cleanAverage = cleanValues.reduce(function (sum, transaction) { return sum + transaction.amount; }, 0) / cleanValues.length;
    $("#dataInsight").textContent = cleaned ? "清理後平均客單降低 " + Math.abs((rawAverage - cleanAverage) / rawAverage * 100).toFixed(1) + "%；少數極端值原本扭曲了日常消費輪廓。" : "原始資料保留 " + issues + " 筆異常或重複紀錄，平均數與品類排名都可能受影響。";
    $$('[data-data-mode]').forEach(function (button) { button.classList.toggle("active", button.dataset.dataMode === mode); });
  }
  $$('[data-data-mode]').forEach(function (button) { button.addEventListener("click", function () { renderTransactions(button.dataset.dataMode); }); });
  renderTransactions("raw");

  function median(values) {
    var sorted = values.slice().sort(function (a, b) { return a - b; });
    var middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
  }
  function analyzeNumbers() {
    var source = $("#numberInput").value.trim();
    var tokens = source.split(/[,;\s]+/).filter(Boolean);
    var values = tokens.map(Number).filter(function (value) { return Number.isFinite(value); });
    var ignored = tokens.length - values.length;
    if (values.length < 2) {
      $("#inputError").textContent = "請至少輸入 2 個有效數字。";
      return;
    }
    $("#inputError").textContent = ignored ? "已略過 " + ignored + " 個非數字欄位。" : "";
    var n = values.length;
    var mean = values.reduce(function (sum, value) { return sum + value; }, 0) / n;
    var variance = values.reduce(function (sum, value) { return sum + Math.pow(value - mean, 2); }, 0) / (n - 1);
    var sd = Math.sqrt(variance);
    var minimum = Math.min.apply(null, values);
    var maximum = Math.max.apply(null, values);
    $("#statN").textContent = String(n);
    $("#statMean").textContent = round(mean, 2).toLocaleString("zh-TW");
    $("#statMedian").textContent = round(median(values), 2).toLocaleString("zh-TW");
    $("#statSd").textContent = round(sd, 2).toLocaleString("zh-TW");
    $("#statMin").textContent = minimum.toLocaleString("zh-TW");
    $("#statMax").textContent = maximum.toLocaleString("zh-TW");
    var binCount = Math.min(8, Math.max(4, Math.ceil(Math.sqrt(n))));
    var range = maximum - minimum;
    var binWidth = range === 0 ? 1 : range / binCount;
    var bins = Array.from({ length: binCount }, function () { return 0; });
    values.forEach(function (value) {
      var index = range === 0 ? 0 : Math.min(binCount - 1, Math.floor((value - minimum) / binWidth));
      bins[index] += 1;
    });
    var maxBin = Math.max.apply(null, bins);
    $("#histogram").innerHTML = bins.map(function (count, index) {
      var low = minimum + index * binWidth;
      var label = range === 0 ? String(minimum) : round(low, 1) + "+";
      return "<div style=\"--h:" + (count / maxBin * 100).toFixed(1) + "%\" title=\"" + count + " 筆\"><span>" + label + "</span></div>";
    }).join("");
    var relativeSpread = Math.abs(mean) > 0 ? sd / Math.abs(mean) : 0;
    var spreadText = relativeSpread < 0.1 ? "數值相當集中" : relativeSpread < 0.3 ? "資料有中等程度的分散" : "資料分散幅度較大";
    $("#computerInterpretation").textContent = "快速解讀：平均為 " + round(mean, 2) + "、中位數為 " + round(median(values), 2) + "；" + spreadText + "。下一步應回到資料背景，判斷這些差異是否具有實務意義。";
  }
  $("#analyzeButton").addEventListener("click", analyzeNumbers);
  $("#numberInput").addEventListener("input", function () {
    window.clearTimeout(window.statInputTimer);
    window.statInputTimer = window.setTimeout(analyzeNumbers, 350);
  });
  $("#csvInput").addEventListener("change", function (event) {
    var file = event.target.files && event.target.files[0];
    if (!file) { return; }
    var reader = new FileReader();
    reader.onload = function () {
      var lines = String(reader.result).trim().split(/\r?\n/).filter(Boolean);
      var rows = lines.map(function (line) { return line.split(/[,;\t]/).map(function (cell) { return cell.trim(); }); });
      var columnCount = Math.max.apply(null, rows.map(function (row) { return row.length; }));
      var bestValues = [];
      for (var column = 0; column < columnCount; column += 1) {
        var numeric = rows.map(function (row) { return Number(row[column]); }).filter(function (value) { return Number.isFinite(value); });
        if (numeric.length > bestValues.length) { bestValues = numeric; }
      }
      if (bestValues.length < 2) {
        $("#inputError").textContent = "CSV 中找不到至少 2 筆的數值欄。";
        return;
      }
      $("#numberInput").value = bestValues.join(", ");
      analyzeNumbers();
    };
    reader.readAsText(file);
  });
  analyzeNumbers();
})();
