function makeSleep(getRunning) {
  return function sleep(ms) {
    return new Promise(function(resolve, reject) {
      setTimeout(function() {
        if (!getRunning()) reject(new Error('aborted'));
        else resolve();
      }, ms);
    });
  };
}

function sortedCopy(arr) {
  return arr.slice().sort(function(a, b) { return a - b; });
}

var algoData = {
  bubble:    { name: 'Bubble Sort',    short: 'Bubble',    desc: 'Repeatedly compares adjacent elements and swaps them if wrong order. Simple but O(n²).',                best: 'O(n)',       worst: 'O(n²)',      avg: 'O(n²)',      space: 'O(1)'     },
  selection: { name: 'Selection Sort', short: 'Selection', desc: 'Finds the minimum element from unsorted part and places it at the beginning each iteration.',           best: 'O(n²)',      worst: 'O(n²)',      avg: 'O(n²)',      space: 'O(1)'     },
  insertion: { name: 'Insertion Sort', short: 'Insertion', desc: 'Builds sorted array one element at a time. Great for nearly sorted data.',                              best: 'O(n)',       worst: 'O(n²)',      avg: 'O(n²)',      space: 'O(1)'     },
  merge:     { name: 'Merge Sort',     short: 'Merge',     desc: 'Divides array in half, recursively sorts both halves, then merges them. Stable O(n log n).',           best: 'O(n log n)', worst: 'O(n log n)', avg: 'O(n log n)', space: 'O(n)'     },
  quick:     { name: 'Quick Sort',     short: 'Quick',     desc: 'Picks pivot, partitions array. Very fast in practice despite worst-case O(n²).',                       best: 'O(n log n)', worst: 'O(n²)',      avg: 'O(n log n)', space: 'O(log n)' },
};

var ALL_ALGOS = ['bubble', 'selection', 'insertion', 'merge', 'quick'];

var currentMode = 'visualizer';

function switchMode(mode) {
  currentMode = mode;
  vizSorting = false;
  cmpRunning = false;

  document.getElementById('modeVisualizer').style.display  = mode === 'visualizer'  ? '' : 'none';
  document.getElementById('modeComparison').style.display  = mode === 'comparison'  ? '' : 'none';

  document.getElementById('navVisualizer').classList.toggle('active', mode === 'visualizer');
  document.getElementById('navComparison').classList.toggle('active', mode === 'comparison');

  if (mode === 'comparison') {
    resetComparison();
  }
}

var array         = [];
var originalArray = [];
var vizSorting    = false;
var comparisons   = 0;
var swaps         = 0;
var startTime     = null;
var currentAlgo   = 'bubble';
var vizDelay      = 60;

var vizSleep = makeSleep(function() { return vizSorting; });

function selectAlgo(algo, btn) {
  if (vizSorting) return;
  currentAlgo = algo;
  document.querySelectorAll('.algo-btn').forEach(function(b) { b.classList.remove('active'); });
  btn.classList.add('active');
  var d = algoData[algo];
  document.getElementById('algoName').textContent  = d.name;
  document.getElementById('algoDesc').textContent  = d.desc;
  document.getElementById('bestCase').textContent  = d.best;
  document.getElementById('worstCase').textContent = d.worst;
  document.getElementById('avgCase').textContent   = d.avg;
  document.getElementById('spaceCase').textContent = d.space;
  generateArray();
}

function updateSpeed(v) {
  var labels = ['', 'Very Slow', 'Slow', 'Medium', 'Fast', 'Blazing'];
  var delays = [0, 200, 100, 40, 10, 2];
  document.getElementById('speedVal').textContent = labels[v];
  vizDelay = delays[v];
}

function generateArray() {
  vizSorting    = false;
  originalArray = [];
  document.getElementById('sortBtn').disabled = false;
  var size = parseInt(document.getElementById('sizeSlider').value, 10);
  array = [];
  for (var i = 0; i < size; i++) array.push(Math.floor(Math.random() * 90) + 10);
  comparisons = 0; swaps = 0;
  document.getElementById('compCount').textContent   = 0;
  document.getElementById('swapCount').textContent   = 0;
  document.getElementById('timeElapsed').textContent = '—';
  document.getElementById('arrSize').textContent     = size;
  document.getElementById('statusBar').textContent   = 'Array randomized. Ready to sort.';
  hideOutput();
  renderBars([], [], []);
}

function renderBars(active, compare, sorted) {
  active  = active  || [];
  compare = compare || [];
  sorted  = sorted  || [];
  var wrap = document.getElementById('barsWrap');
  var max  = Math.max.apply(null, array);
  wrap.innerHTML = '';
  for (var i = 0; i < array.length; i++) {
    var bar = document.createElement('div');
    bar.className = 'bar';
    bar.style.height = ((array[i] / max) * 90) + '%';
    if (sorted.indexOf(i)  !== -1) bar.classList.add('sorted');
    else if (active.indexOf(i)  !== -1) bar.classList.add('active');
    else if (compare.indexOf(i) !== -1) bar.classList.add('compare');
    wrap.appendChild(bar);
  }
}

function updateStats() {
  document.getElementById('compCount').textContent = comparisons;
  document.getElementById('swapCount').textContent = swaps;
  if (startTime) document.getElementById('timeElapsed').textContent = Date.now() - startTime;
}

async function startSort() {
  if (vizSorting) return;
  vizSorting  = true;
  comparisons = 0; swaps = 0;
  startTime   = Date.now();
  document.getElementById('sortBtn').disabled    = true;
  document.getElementById('statusBar').textContent = 'Running ' + algoData[currentAlgo].name + '...';
  try {
    await runVizAlgo(currentAlgo, array, vizSleep,
      function(a, c, s) { renderBars(a, c, s); },
      function() { updateStats(); }
    );
    if (vizSorting) {
      var sortedIdx = [];
      for (var i = 0; i < array.length; i++) sortedIdx.push(i);
      renderBars([], [], sortedIdx);
      var elapsed = Date.now() - startTime;
      document.getElementById('timeElapsed').textContent = elapsed;
      document.getElementById('statusBar').textContent   =
        '✓ Sorted! ' + comparisons + ' comparisons, ' + swaps + ' swaps in ' + elapsed + 'ms.';
      showOutput();
    }
  } catch(e) {
  } finally {
    if (vizSorting) {
      vizSorting = false;
      document.getElementById('sortBtn').disabled = false;
    }
  }
}

async function runVizAlgo(algo, arr, sleepFn, onRender, onStats) {
  if      (algo === 'bubble')    await _bubble(arr, sleepFn, onRender, onStats);
  else if (algo === 'selection') await _selection(arr, sleepFn, onRender, onStats);
  else if (algo === 'insertion') await _insertion(arr, sleepFn, onRender, onStats);
  else if (algo === 'merge')     await _mergeWrapper(arr, sleepFn, onRender, onStats);
  else if (algo === 'quick')     await _quickWrapper(arr, sleepFn, onRender, onStats);
}

async function _bubble(arr, sleepFn, onRender, onStats) {
  var n = arr.length, sortedSet = [];
  for (var i = 0; i < n - 1; i++) {
    for (var j = 0; j < n - i - 1; j++) {
      comparisons++;
      onRender([j, j+1], [], sortedSet); onStats();
      await sleepFn(vizDelay);
      if (arr[j] > arr[j+1]) { var t=arr[j]; arr[j]=arr[j+1]; arr[j+1]=t; swaps++; }
    }
    sortedSet.push(n - 1 - i);
  }
  sortedSet.push(0);
}

async function _selection(arr, sleepFn, onRender, onStats) {
  var n = arr.length, sortedSet = [];
  for (var i = 0; i < n - 1; i++) {
    var minIdx = i;
    for (var j = i + 1; j < n; j++) {
      comparisons++;
      onRender([j], [minIdx], sortedSet); onStats();
      await sleepFn(vizDelay);
      if (arr[j] < arr[minIdx]) minIdx = j;
    }
    if (minIdx !== i) { var t=arr[i]; arr[i]=arr[minIdx]; arr[minIdx]=t; swaps++; }
    sortedSet.push(i);
  }
  sortedSet.push(n - 1);
}

async function _insertion(arr, sleepFn, onRender, onStats) {
  var n = arr.length, sortedSet = [0];
  for (var i = 1; i < n; i++) {
    var key = arr[i], j = i - 1;
    while (j >= 0 && arr[j] > key) {
      comparisons++;
      onRender([j+1], [j], sortedSet); onStats();
      await sleepFn(vizDelay);
      arr[j+1] = arr[j]; swaps++; j--;
    }
    arr[j+1] = key;
    sortedSet.push(i);
  }
}

async function _mergeWrapper(arr, sleepFn, onRender, onStats) {
  await _mergeSort(arr, 0, arr.length - 1, sleepFn, onRender, onStats);
}
async function _mergeSort(arr, l, r, sleepFn, onRender, onStats) {
  if (l >= r) return;
  var m = Math.floor((l + r) / 2);
  await _mergeSort(arr, l, m, sleepFn, onRender, onStats);
  await _mergeSort(arr, m+1, r, sleepFn, onRender, onStats);
  await _merge(arr, l, m, r, sleepFn, onRender, onStats);
}
async function _merge(arr, l, m, r, sleepFn, onRender, onStats) {
  var left = arr.slice(l, m+1), right = arr.slice(m+1, r+1);
  var i = 0, j = 0, k = l;
  while (i < left.length && j < right.length) {
    comparisons++;
    onRender([k], [l+i, m+1+j], []); onStats();
    await sleepFn(vizDelay);
    if (left[i] <= right[j]) arr[k++] = left[i++];
    else { arr[k++] = right[j++]; swaps++; }
  }
  while (i < left.length)  arr[k++] = left[i++];
  while (j < right.length) arr[k++] = right[j++];
}

async function _quickWrapper(arr, sleepFn, onRender, onStats) {
  await _quickSort(arr, 0, arr.length - 1, sleepFn, onRender, onStats);
}
async function _quickSort(arr, low, high, sleepFn, onRender, onStats) {
  if (low < high) {
    var pi = await _partition(arr, low, high, sleepFn, onRender, onStats);
    await _quickSort(arr, low, pi-1, sleepFn, onRender, onStats);
    await _quickSort(arr, pi+1, high, sleepFn, onRender, onStats);
  }
}
async function _partition(arr, low, high, sleepFn, onRender, onStats) {
  var pivot = arr[high], i = low - 1;
  for (var j = low; j < high; j++) {
    comparisons++;
    onRender([j], [high], []); onStats();
    await sleepFn(vizDelay);
    if (arr[j] < pivot) { i++; var t=arr[i]; arr[i]=arr[j]; arr[j]=t; swaps++; }
  }
  var t=arr[i+1]; arr[i+1]=arr[high]; arr[high]=t; swaps++;
  return i + 1;
}

function validateCustomInput() {
  if (vizSorting) return true;
  var raw      = document.getElementById('customInput').value.trim();
  var hint     = document.getElementById('inputHint');
  var input    = document.getElementById('customInput');
  var applyBtn = document.getElementById('applyBtn');

  if (!raw) {
    input.classList.remove('error');
    hint.className = 'input-hint'; hint.style.color = '';
    hint.textContent = 'Enter numbers separated by commas (max 80)';
    applyBtn.disabled = false; return true;
  }
  var parts = raw.split(',').map(function(s){return s.trim();}).filter(function(s){return s!=='';});
  var nums  = parts.map(Number);

  if (nums.some(isNaN))                          { return setInputError(input, hint, applyBtn, '✕ Only numbers allowed, separated by commas'); }
  if (nums.length > 80)                          { return setInputError(input, hint, applyBtn, '✕ Max 80 numbers allowed (got ' + nums.length + ')'); }
  if (nums.length < 2)                           { return setInputError(input, hint, applyBtn, '✕ Enter at least 2 numbers'); }
  if (nums.some(function(n){return n<1||n>999;})) { return setInputError(input, hint, applyBtn, '✕ Numbers must be between 1 and 999'); }

  input.classList.remove('error');
  hint.className = 'input-hint'; hint.style.color = 'var(--accent)';
  hint.textContent = '✓ ' + nums.length + ' numbers ready — press Apply';
  applyBtn.disabled = false; return true;
}

function setInputError(input, hint, btn, msg) {
  input.classList.add('error');
  hint.className = 'input-hint err'; hint.textContent = msg;
  btn.disabled = true; return false;
}

function applyCustomInput() {
  if (vizSorting) return;
  var raw = document.getElementById('customInput').value.trim();
  if (!raw) { generateArray(); return; }
  if (!validateCustomInput()) return;
  var nums = raw.split(',').map(function(s){return Number(s.trim());}).filter(function(n){return !isNaN(n);});
  array = nums.slice();
  originalArray = nums.slice();
  document.getElementById('sizeSlider').value        = Math.min(Math.max(nums.length,10),80);
  document.getElementById('sizeVal').textContent     = nums.length;
  document.getElementById('arrSize').textContent     = nums.length;
  comparisons = 0; swaps = 0;
  document.getElementById('compCount').textContent   = 0;
  document.getElementById('swapCount').textContent   = 0;
  document.getElementById('timeElapsed').textContent = '—';
  document.getElementById('statusBar').textContent   = 'Custom array loaded (' + nums.length + ' elements). Sorting...';
  var hint = document.getElementById('inputHint');
  hint.className = 'input-hint'; hint.style.color = '';
  hint.textContent = 'Enter numbers separated by commas (max 80)';
  hideOutput(); renderBars([], [], []); startSort();
}

function showOutput() {
  var panel    = document.getElementById('arrayOutput');
  var inputEl  = document.getElementById('inputArrayDisplay');
  var outputEl = document.getElementById('outputArrayDisplay');
  inputEl.innerHTML = ''; outputEl.innerHTML = '';

  if (originalArray.length > 0) {
    originalArray.forEach(function(n, i) {
      var chip = document.createElement('span');
      chip.className = 'output-chip';
      chip.textContent = n;
      chip.style.animationDelay = (i * 18) + 'ms';
      inputEl.appendChild(chip);
    });
  } else {
    var lbl = document.createElement('span');
    lbl.className = 'output-chip'; lbl.style.fontStyle = 'italic';
    lbl.textContent = 'Random array'; inputEl.appendChild(lbl);
  }
  array.forEach(function(n, i) {
    var chip = document.createElement('span');
    chip.className = 'output-chip sorted-chip';
    chip.textContent = n;
    chip.style.animationDelay = (i * 18) + 'ms';
    outputEl.appendChild(chip);
  });
  panel.style.display = 'flex';
}

function hideOutput() {
  var panel = document.getElementById('arrayOutput');
  if (panel) panel.style.display = 'none';
}

function copyOutput() {
  var sorted = array.join(', ');
  navigator.clipboard.writeText(sorted).then(function() {
    var btn = document.getElementById('copyBtn');
    btn.textContent = '✓ Copied!'; btn.classList.add('copied');
    setTimeout(function(){ btn.textContent = '⎘ Copy'; btn.classList.remove('copied'); }, 2000);
  });
}

var cmpRunning  = false;
var cmpMode     = 'all';
var cmpDelay    = 40;
var cmpFinished = [];

function setCmpMode(mode) {
  cmpMode = mode;
  document.getElementById('cmpBtnAll').classList.toggle('active',    mode === 'all');
  document.getElementById('cmpBtnSelect').classList.toggle('active', mode === 'select');
  document.getElementById('cmpPickers').style.display = mode === 'select' ? 'flex' : 'none';
  resetComparison();
}

function updateCmpSpeed(v) {
  var labels = ['', 'Very Slow', 'Slow', 'Medium', 'Fast', 'Blazing'];
  var delays = [0, 120, 60, 25, 8, 1];
  document.getElementById('cmpSpeedVal').textContent = labels[v];
  cmpDelay = delays[v];
}

function getActiveAlgos() {
  if (cmpMode === 'all') return ALL_ALGOS.slice();
  var a1 = document.getElementById('cmpAlgo1').value;
  var a2 = document.getElementById('cmpAlgo2').value;
  return [a1, a2];
}

function resetComparison() {
  cmpRunning  = false;
  cmpFinished = [];
  document.getElementById('cmpRunBtn').disabled = false;
  document.getElementById('winnerBanner').style.display = 'none';
  buildArena();
}

function buildArena() {
  var algos  = getActiveAlgos();
  var arena  = document.getElementById('cmpArena');
  var size   = parseInt(document.getElementById('cmpSizeSlider').value, 10);
  var base   = [];
  for (var i = 0; i < size; i++) base.push(Math.floor(Math.random() * 90) + 10);

  arena.innerHTML = '';
  arena.className = 'cmp-arena ' + (algos.length === 5 ? 'grid-5' : 'grid-2');

  algos.forEach(function(algo) {
    var arr = base.slice();
    var panel = buildRacePanel(algo, arr);
    arena.appendChild(panel);
  });
}

function buildRacePanel(algo, arr) {
  var panel = document.createElement('div');
  panel.className = 'race-panel';
  panel.id = 'panel-' + algo;

  var header = document.createElement('div');
  header.className = 'race-header';

  var nameEl = document.createElement('div');
  nameEl.className = 'race-name';
  nameEl.textContent = algoData[algo].name;

  var badge = document.createElement('div');
  badge.className = 'race-badge';
  badge.id = 'badge-' + algo;
  badge.textContent = 'Ready';

  header.appendChild(nameEl);
  header.appendChild(badge);

  var barsEl = document.createElement('div');
  barsEl.className = 'race-bars';
  barsEl.id = 'bars-' + algo;

  var statsEl = document.createElement('div');
  statsEl.className = 'race-stats';
  statsEl.innerHTML =
    '<div class="race-stat"><div class="rs-label">Comps</div><div class="rs-val" id="comp-' + algo + '">0</div></div>' +
    '<div class="race-stat"><div class="rs-label">Swaps</div><div class="rs-val" id="swap-' + algo + '">0</div></div>' +
    '<div class="race-stat"><div class="rs-label">Time ms</div><div class="rs-val" id="time-' + algo + '">—</div></div>';

  panel.appendChild(header);
  panel.appendChild(barsEl);
  panel.appendChild(statsEl);

  renderRaceBars(algo, arr, [], [], []);
  return panel;
}

function renderRaceBars(algo, arr, active, compare, sorted) {
  active  = active  || [];
  compare = compare || [];
  sorted  = sorted  || [];
  var wrap = document.getElementById('bars-' + algo);
  if (!wrap) return;
  var max = Math.max.apply(null, arr);
  wrap.innerHTML = '';
  for (var i = 0; i < arr.length; i++) {
    var bar = document.createElement('div');
    bar.className = 'bar';
    bar.style.height = ((arr[i] / max) * 88) + '%';
    if (sorted.indexOf(i)  !== -1) bar.classList.add('sorted');
    else if (active.indexOf(i)  !== -1) bar.classList.add('active');
    else if (compare.indexOf(i) !== -1) bar.classList.add('compare');
    wrap.appendChild(bar);
  }
}

async function runComparison() {
  if (cmpRunning) return;
  cmpRunning  = true;
  cmpFinished = [];
  document.getElementById('cmpRunBtn').disabled = true;
  document.getElementById('winnerBanner').style.display = 'none';

  var algos = getActiveAlgos();
  var size  = parseInt(document.getElementById('cmpSizeSlider').value, 10);
  var base  = [];
  for (var i = 0; i < size; i++) base.push(Math.floor(Math.random() * 90) + 10);

  var arena = document.getElementById('cmpArena');
  arena.innerHTML = '';
  arena.className = 'cmp-arena ' + (algos.length === 5 ? 'grid-5' : 'grid-2');
  algos.forEach(function(algo) {
    arena.appendChild(buildRacePanel(algo, base.slice()));
  });

  var promises = algos.map(function(algo) {
    return raceOne(algo, base.slice());
  });

  await Promise.all(promises);

  if (cmpRunning) showWinner();
  cmpRunning = false;
  document.getElementById('cmpRunBtn').disabled = false;
}

async function raceOne(algo, arr) {
  var comp = 0, sw = 0;
  var t0   = Date.now();

  setBadge(algo, 'running', 'Running...');

  var sleepFn = makeSleep(function() { return cmpRunning; });

  var myComp = 0, mySw = 0;

  function onRender(active, compare, sorted) {
    renderRaceBars(algo, arr, active, compare, sorted);
  }
  function onStats() {
    var ce = document.getElementById('comp-' + algo);
    var se = document.getElementById('swap-' + algo);
    var te = document.getElementById('time-' + algo);
    if (ce) ce.textContent = myComp;
    if (se) se.textContent = mySw;
    if (te) te.textContent = Date.now() - t0;
  }

  try {
    await runRaceAlgo(algo, arr, sleepFn, onRender, onStats,
      function(c, s) { myComp = c; mySw = s; });
  } catch(e) {
    setBadge(algo, '', 'Stopped');
    return;
  }

  var elapsed = Date.now() - t0;
  var sortedIdx = [];
  for (var i = 0; i < arr.length; i++) sortedIdx.push(i);
  renderRaceBars(algo, arr, [], [], sortedIdx);

  var te = document.getElementById('time-' + algo);
  if (te) te.textContent = elapsed;

  cmpFinished.push({ algo: algo, elapsed: elapsed, comp: myComp, sw: mySw });
  var rank = cmpFinished.length;
  var label = rank === 1 ? '1st' : (rank === 2 ? '2nd' : (rank === 3 ? '3rd' : rank + 'th'));
  setBadge(algo, rank === 1 ? 'winner' : '', label);
}

async function runRaceAlgo(algo, arr, sleepFn, onRender, onStats, setCounters) {
  var c = 0, s = 0;
  function bump(dc, ds) { c += dc; s += ds; setCounters(c, s); }

  if (algo === 'bubble') {
    var n = arr.length, sortedSet = [];
    for (var i = 0; i < n-1; i++) {
      for (var j = 0; j < n-i-1; j++) {
        bump(1, 0); onRender([j, j+1], [], sortedSet); onStats();
        await sleepFn(cmpDelay);
        if (arr[j] > arr[j+1]) { var t=arr[j]; arr[j]=arr[j+1]; arr[j+1]=t; bump(0,1); }
      }
      sortedSet.push(n-1-i);
    }
    sortedSet.push(0);

  } else if (algo === 'selection') {
    var n = arr.length, sortedSet = [];
    for (var i = 0; i < n-1; i++) {
      var minIdx = i;
      for (var j = i+1; j < n; j++) {
        bump(1,0); onRender([j], [minIdx], sortedSet); onStats();
        await sleepFn(cmpDelay);
        if (arr[j] < arr[minIdx]) minIdx = j;
      }
      if (minIdx !== i) { var t=arr[i]; arr[i]=arr[minIdx]; arr[minIdx]=t; bump(0,1); }
      sortedSet.push(i);
    }
    sortedSet.push(n-1);

  } else if (algo === 'insertion') {
    var n = arr.length, sortedSet = [0];
    for (var i = 1; i < n; i++) {
      var key = arr[i], j = i-1;
      while (j >= 0 && arr[j] > key) {
        bump(1,0); onRender([j+1],[j],sortedSet); onStats();
        await sleepFn(cmpDelay);
        arr[j+1] = arr[j]; bump(0,1); j--;
      }
      arr[j+1] = key; sortedSet.push(i);
    }

  } else if (algo === 'merge') {
    await rMergeSort(arr, 0, arr.length-1, sleepFn, onRender, onStats, bump);

  } else if (algo === 'quick') {
    await rQuickSort(arr, 0, arr.length-1, sleepFn, onRender, onStats, bump);
  }
}

async function rMergeSort(arr, l, r, sleepFn, onRender, onStats, bump) {
  if (l >= r) return;
  var m = Math.floor((l+r)/2);
  await rMergeSort(arr, l, m, sleepFn, onRender, onStats, bump);
  await rMergeSort(arr, m+1, r, sleepFn, onRender, onStats, bump);
  var left = arr.slice(l, m+1), right = arr.slice(m+1, r+1);
  var i=0, j=0, k=l;
  while (i<left.length && j<right.length) {
    bump(1,0); onRender([k],[l+i,m+1+j],[]); onStats();
    await sleepFn(cmpDelay);
    if (left[i]<=right[j]) arr[k++]=left[i++];
    else { arr[k++]=right[j++]; bump(0,1); }
  }
  while (i<left.length)  arr[k++]=left[i++];
  while (j<right.length) arr[k++]=right[j++];
}

async function rQuickSort(arr, low, high, sleepFn, onRender, onStats, bump) {
  if (low < high) {
    var pi = await rPartition(arr, low, high, sleepFn, onRender, onStats, bump);
    await rQuickSort(arr, low, pi-1, sleepFn, onRender, onStats, bump);
    await rQuickSort(arr, pi+1, high, sleepFn, onRender, onStats, bump);
  }
}
async function rPartition(arr, low, high, sleepFn, onRender, onStats, bump) {
  var pivot=arr[high], i=low-1;
  for (var j=low; j<high; j++) {
    bump(1,0); onRender([j],[high],[]); onStats();
    await sleepFn(cmpDelay);
    if (arr[j]<pivot) { i++; var t=arr[i]; arr[i]=arr[j]; arr[j]=t; bump(0,1); }
  }
  var t=arr[i+1]; arr[i+1]=arr[high]; arr[high]=t; bump(0,1);
  return i+1;
}

function setBadge(algo, cls, text) {
  var badge = document.getElementById('badge-' + algo);
  if (!badge) return;
  badge.className = 'race-badge' + (cls ? ' ' + cls : '');
  badge.textContent = text;
}

function showWinner() {
  if (cmpFinished.length === 0) return;
  var winner = cmpFinished[0];
  var banner = document.getElementById('winnerBanner');
  banner.innerHTML =
    '<h2>' + algoData[winner.algo].name + '</h2>' +
    '<p>Finished first in ' + winner.elapsed + 'ms &nbsp;·&nbsp; ' +
    winner.comp + ' comparisons &nbsp;·&nbsp; ' + winner.sw + ' swaps</p>' +
    '<button onclick="document.getElementById(\'winnerBanner\').style.display=\'none\'">✕ Close</button>';
  banner.style.display = 'block';
}

generateArray();
