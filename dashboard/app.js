const STATS_URL = '../secop_dashboard_stats.json';
const CHUNKS_URL = '../secop_antioquia_rag_chunks.json';
const PAGE_SIZE = 25;

let dashboardStats = [];
let chunks = [];
let filteredChunks = [];
let currentPage = 1;

let charts = {};

function parseValor(valorStr) {
  if (!valorStr || typeof valorStr !== 'string') return 0;
  const digits = valorStr.replace(/[^\d]/g, '');
  return parseInt(digits, 10) || 0;
}

function formatMoney(n) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n);
}

function aggregateChunks(data) {
  const byYear = {};
  const byCity = {};
  let totalValor = 0;

  for (const item of data) {
    const m = item.metadata || {};
    const year = m.ano || 'Sin año';
    const city = m.ciudad || 'Sin ciudad';
    byYear[year] = (byYear[year] || 0) + 1;
    byCity[city] = (byCity[city] || 0) + 1;
    totalValor += parseValor(m.valor);
  }

  const topCities = Object.entries(byCity)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12);

  return { byYear, topCities, totalValor };
}

function destroyChart(id) {
  if (charts[id]) {
    charts[id].destroy();
    delete charts[id];
  }
}

function chartDefaults() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        ticks: { color: '#8b9cb3' },
        grid: { color: 'rgba(45, 58, 79, 0.5)' },
      },
      y: {
        ticks: { color: '#8b9cb3' },
        grid: { color: 'rgba(45, 58, 79, 0.5)' },
      },
    },
  };
}

function renderSpendingChart(stats) {
  destroyChart('spending');
  const sorted = [...stats].sort((a, b) => Number(a.año) - Number(b.año));
  const ctx = document.getElementById('chart-spending');
  charts.spending = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: sorted.map((r) => r.año),
      datasets: [
        {
          label: 'Gasto total',
          data: sorted.map((r) => r.gasto_total),
          backgroundColor: 'rgba(59, 130, 246, 0.7)',
          borderColor: '#3b82f6',
          borderWidth: 1,
          borderRadius: 6,
        },
      ],
    },
    options: {
      ...chartDefaults(),
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label(ctx) {
              const row = sorted[ctx.dataIndex];
              return row.gasto_formateado || formatMoney(ctx.parsed.y);
            },
          },
        },
      },
      scales: {
        ...chartDefaults().scales,
        y: {
          ...chartDefaults().scales.y,
          ticks: {
            color: '#8b9cb3',
            callback(v) {
              if (v >= 1e12) return `$${(v / 1e12).toFixed(1)}B`;
              if (v >= 1e9) return `$${(v / 1e9).toFixed(0)}B`;
              if (v >= 1e6) return `$${(v / 1e6).toFixed(0)}M`;
              return formatMoney(v);
            },
          },
        },
      },
    },
  });
}

function renderChunksYearChart(byYear) {
  destroyChart('chunksYear');
  const entries = Object.entries(byYear).sort((a, b) => Number(a[0]) - Number(b[0]));
  const ctx = document.getElementById('chart-chunks-year');
  charts.chunksYear = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: entries.map(([y]) => y),
      datasets: [
        {
          label: 'Contratos',
          data: entries.map(([, c]) => c),
          backgroundColor: 'rgba(34, 197, 94, 0.7)',
          borderColor: '#22c55e',
          borderWidth: 1,
          borderRadius: 6,
        },
      ],
    },
    options: chartDefaults(),
  });
}

function renderCitiesChart(topCities) {
  destroyChart('cities');
  const ctx = document.getElementById('chart-cities');
  charts.cities = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: topCities.map(([c]) => c),
      datasets: [
        {
          label: 'Contratos',
          data: topCities.map(([, n]) => n),
          backgroundColor: 'rgba(245, 158, 11, 0.7)',
          borderColor: '#f59e0b',
          borderWidth: 1,
          borderRadius: 6,
        },
      ],
    },
    options: {
      ...chartDefaults(),
      indexAxis: 'y',
    },
  });
}

function renderStatsTable() {
  const tbody = document.getElementById('stats-table-body');
  const sorted = [...dashboardStats].sort((a, b) => Number(a.año) - Number(b.año));
  tbody.innerHTML = sorted
    .map(
      (row) => `<tr>
        <td>${escapeHtml(row.año)}</td>
        <td>${row.gasto_total.toLocaleString('es-CO')}</td>
        <td>${escapeHtml(row.gasto_formateado)}</td>
      </tr>`,
    )
    .join('');
}

function updateSummaryCards() {
  const agg = aggregateChunks(chunks);
  const years = new Set(chunks.map((c) => c.metadata?.ano).filter(Boolean));
  const cities = new Set(chunks.map((c) => c.metadata?.ciudad).filter(Boolean));

  document.getElementById('stat-contracts').textContent =
    chunks.length.toLocaleString('es-CO');
  document.getElementById('stat-cities').textContent = cities.size.toLocaleString('es-CO');
  document.getElementById('stat-years').textContent = years.size.toLocaleString('es-CO');
  document.getElementById('stat-total-valor').textContent = formatMoney(agg.totalValor);

  const latestStat = [...dashboardStats].sort(
    (a, b) => Number(b.año) - Number(a.año),
  )[0];
  if (latestStat) {
    document.getElementById('stat-latest-year').textContent = latestStat.año;
    document.getElementById('stat-latest-gasto').textContent =
      latestStat.gasto_formateado;
  }
}

function applyFilters() {
  const q = document.getElementById('search').value.trim().toLowerCase();
  const year = document.getElementById('filter-year').value;
  const city = document.getElementById('filter-city').value;

  filteredChunks = chunks.filter((item) => {
    const m = item.metadata || {};
    if (year && m.ano !== year) return false;
    if (city && m.ciudad !== city) return false;
    if (!q) return true;
    const haystack = [
      item.id,
      m.entidad,
      m.ciudad,
      m.valor,
      item.chunk_texto,
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });

  currentPage = 1;
  renderTable();
}

function populateFilters() {
  const years = [...new Set(chunks.map((c) => c.metadata?.ano).filter(Boolean))].sort(
    (a, b) => Number(b) - Number(a),
  );
  const cities = [...new Set(chunks.map((c) => c.metadata?.ciudad).filter(Boolean))].sort();

  const yearSel = document.getElementById('filter-year');
  const citySel = document.getElementById('filter-city');

  yearSel.innerHTML = '<option value="">Todos los años</option>';
  years.forEach((y) => {
    yearSel.innerHTML += `<option value="${y}">${y}</option>`;
  });

  citySel.innerHTML = '<option value="">Todas las ciudades</option>';
  cities.forEach((c) => {
    citySel.innerHTML += `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`;
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function renderTable() {
  const tbody = document.getElementById('contracts-body');
  const start = (currentPage - 1) * PAGE_SIZE;
  const page = filteredChunks.slice(start, start + PAGE_SIZE);

  tbody.innerHTML = page
    .map((item) => {
      const m = item.metadata || {};
      const url = m.url?.url || '#';
      const texto = item.chunk_texto || '';
      return `<tr>
        <td><code>${escapeHtml(item.id)}</code></td>
        <td>${escapeHtml(m.ano || '—')}</td>
        <td>${escapeHtml(m.ciudad || '—')}</td>
        <td class="text-cell" title="${escapeHtml(m.entidad || '')}">${escapeHtml(m.entidad || '—')}</td>
        <td>${escapeHtml(m.valor || '—')}</td>
        <td class="text-cell" title="${escapeHtml(texto)}">${escapeHtml(texto.slice(0, 120))}${texto.length > 120 ? '…' : ''}</td>
        <td>${url !== '#' ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener">Ver</a>` : '—'}</td>
      </tr>`;
    })
    .join('');

  const totalPages = Math.max(1, Math.ceil(filteredChunks.length / PAGE_SIZE));
  document.getElementById('page-info').textContent =
    `Página ${currentPage} de ${totalPages} · ${filteredChunks.length.toLocaleString('es-CO')} registros`;
  document.getElementById('btn-prev').disabled = currentPage <= 1;
  document.getElementById('btn-next').disabled = currentPage >= totalPages;
}

function setupTabs() {
  document.querySelectorAll('.file-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.file-tab').forEach((t) => t.classList.remove('active'));
      document.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.dataset.panel).classList.add('active');
    });
  });
}

async function loadData() {
  const loading = document.getElementById('loading');
  const content = document.getElementById('content');
  const errorEl = document.getElementById('error');

  try {
    const [statsRes, chunksRes] = await Promise.all([
      fetch(STATS_URL),
      fetch(CHUNKS_URL),
    ]);

    if (!statsRes.ok) throw new Error(`No se pudo cargar ${STATS_URL} (${statsRes.status})`);
    if (!chunksRes.ok) throw new Error(`No se pudo cargar ${CHUNKS_URL} (${chunksRes.status})`);

    dashboardStats = await statsRes.json();
    chunks = await chunksRes.json();
    filteredChunks = [...chunks];

    loading.hidden = true;
    content.hidden = false;

    updateSummaryCards();
    renderSpendingChart(dashboardStats);
    renderStatsTable();

    const agg = aggregateChunks(chunks);
    renderChunksYearChart(agg.byYear);
    renderCitiesChart(agg.topCities);

    populateFilters();
    renderTable();

    document.getElementById('search').addEventListener('input', applyFilters);
    document.getElementById('filter-year').addEventListener('change', applyFilters);
    document.getElementById('filter-city').addEventListener('change', applyFilters);
    document.getElementById('btn-prev').addEventListener('click', () => {
      currentPage--;
      renderTable();
    });
    document.getElementById('btn-next').addEventListener('click', () => {
      currentPage++;
      renderTable();
    });
  } catch (err) {
    loading.hidden = true;
    errorEl.hidden = false;
    errorEl.textContent =
      err.message +
      '. Ejecuta un servidor local desde la raíz del proyecto: python3 -m http.server 3000';
  }
}

setupTabs();
loadData();
