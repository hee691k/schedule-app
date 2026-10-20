// DOM要素の取得
const scheduleForm = document.getElementById('schedule-form');
const categoryForm = document.getElementById('category-form');
const newCategoryInput = document.getElementById('new-category-name');
const titleInput = document.getElementById('title');
const dateInput = document.getElementById('date');
const timeInput = document.getElementById('time');
const categorySelect = document.getElementById('category');
const scheduleList = document.getElementById('schedule-list');
const filterCategory = document.getElementById('filter-category');
const currentDateDisplay = document.getElementById('current-date-display');

// デフォルトのカテゴリー設定（色情報も一緒に管理）
const defaultCategories = [
  { id: 'work', name: '仕事', color: '#3498db' },
  { id: 'private', name: 'プライベート', color: '#2ecc71' },
  { id: 'important', name: '重要', color: '#e74c3c' },
  { id: 'other', name: 'その他', color: '#95a5a6' }
];

// ローカルストレージからデータ取得
let categories = JSON.parse(localStorage.getItem('categories')) || defaultCategories;
let schedules = JSON.parse(localStorage.getItem('schedules')) || [];

// 初期化処理
document.addEventListener('DOMContentLoaded', () => {
  // 今日の日付を初期値としてセット
  const today = new Date().toISOString().split('T')[0];
  dateInput.value = today;

  // ヘッダーに今日の日付を表示
  const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' };
  currentDateDisplay.textContent = new Date().toLocaleDateString('ja-JP', options);

  // 初回UI構築
  updateCategoryOptions();
  renderSchedules();
});

// 新しいカテゴリーの追加処理
categoryForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const categoryName = newCategoryInput.value.trim();
  if (!categoryName) return;

  // 重複チェック
  if (categories.some(cat => cat.name === categoryName)) {
    alert('そのカテゴリーは既に存在します');
    return;
  }

  // ランダムな色の生成（バッジ表示用）
  const colors = ['#9b59b6', '#34495e', '#e67e22', '#1abc9c', '#d35400', '#8e44ad'];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];

  const newCategory = {
    id: 'cat_' + Date.now(),
    name: categoryName,
    color: randomColor
  };

  categories.push(newCategory);
  localStorage.setItem('categories', JSON.stringify(categories));

  // 選択肢の更新と入力欄のクリア
  updateCategoryOptions();
  newCategoryInput.value = '';

  // 追加したカテゴリーをフォーム側で選択状態にする
  categorySelect.value = newCategory.id;
});

// 予定の追加処理
scheduleForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const newSchedule = {
    id: Date.now(),
    title: titleInput.value,
    date: dateInput.value,
    time: timeInput.value,
    categoryId: categorySelect.value
  };

  schedules.push(newSchedule);
  saveAndRender();

  // フォームクリア（日付は維持）
  titleInput.value = '';
  timeInput.value = '';
});

// 削除処理
scheduleList.addEventListener('click', (e) => {
  if (e.target.classList.contains('btn-delete')) {
    const id = Number(e.target.dataset.id);
    schedules = schedules.filter(item => item.id !== id);
    saveAndRender();
  }
});

// フィルター変更時
filterCategory.addEventListener('change', () => {
  renderSchedules();
});

// データの保存と再描画
function saveAndRender() {
  localStorage.setItem('schedules', JSON.stringify(schedules));
  renderSchedules();
}

// セレクトボックスのカテゴリー選択肢を動的生成
function updateCategoryOptions() {
  // フォーム用カテゴリーセレクトの更新
  categorySelect.innerHTML = categories.map(cat => 
    `<option value="${cat.id}">${escapeHTML(cat.name)}</option>`
  ).join('');

  // フィルター用カテゴリーセレクトの更新（「すべて」を先頭に保存状態も維持）
  const currentFilterValue = filterCategory.value || 'all';
  filterCategory.innerHTML = `
    <option value="all">すべて</option>
    ${categories.map(cat => `<option value="${cat.id}">${escapeHTML(cat.name)}</option>`).join('')}
  `;
  filterCategory.value = currentFilterValue;
}

// 予定一覧の描画関数
function renderSchedules() {
  scheduleList.innerHTML = '';

  const selectedFilter = filterCategory.value;

  // 絞り込み処理
  let filteredSchedules = schedules;
  if (selectedFilter !== 'all') {
    filteredSchedules = schedules.filter(item => item.categoryId === selectedFilter);
  }

  // 日時昇順でソート
  filteredSchedules.sort((a, b) => {
    const dateTimeA = new Date(`${a.date}T${a.time || '00:00'}`);
    const dateTimeB = new Date(`${b.date}T${b.time || '00:00'}`);
    return dateTimeA - dateTimeB;
  });

  if (filteredSchedules.length === 0) {
    scheduleList.innerHTML = '<li class="empty-message">予定はありません</li>';
    return;
  }

  // 要素の作成
  filteredSchedules.forEach(item => {
    const li = document.createElement('li');
    li.className = 'schedule-item';

    // カテゴリー情報取得（削除された等の理由で見つからない場合は「その他」）
    const categoryInfo = categories.find(cat => cat.id === item.categoryId) || {
      name: '未分類',
      color: '#95a5a6'
    };

    const formattedTime = item.time ? ` ${item.time}` : '';

    li.innerHTML = `
      <div class="item-info">
        <span class="badge" style="background-color: ${categoryInfo.color}">${escapeHTML(categoryInfo.name)}</span>
        <span class="item-title">${escapeHTML(item.title)}</span>
        <span class="item-datetime">📅 ${item.date}${formattedTime}</span>
      </div>
      <button class="btn-delete" data-id="${item.id}">削除</button>
    `;

    scheduleList.appendChild(li);
  });
}

// XSS対策のエスケープ関数
function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}