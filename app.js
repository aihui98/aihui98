/* 화면 코드. 단어 추가는 words.js에서만 합니다. */
(function () {
  'use strict';
  const PAGE_SIZE = 30;
  function makeDays(batches) {
    const days = [];
    const allWords = [];
    for (const batch of batches) {
      for (const word of batch.words) allWords.push(word);
    }
    // 추가 파일의 경계와 관계없이 마지막 Day부터 30개를 채웁니다.
    for (let i = 0; i < allWords.length; i += PAGE_SIZE) {
      const words = allWords.slice(i, i + PAGE_SIZE);
      days.push({number: days.length + 1, start: i + 1,
        end: i + words.length, words: words});
    }
    return days;
  }
  // 데이터 분할 검증 및 향후 데이터 추가 시 사용하는 작은 순수 함수.
  window.Vocab = {makeDays: makeDays};
  const app = document.getElementById('app');
  const controls = document.getElementById('controls');
  const fields = ['kanji', 'furigana', 'meaning', 'example', 'translation'];
  const labels = {kanji:'한자', furigana:'후리가나', meaning:'뜻', example:'예문', translation:'예문 해석'};
  const visible = {kanji:true, furigana:true, meaning:true, example:true, translation:true};
  const batches = window.VOCAB_BATCHES;
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function link(text, href, className) {
    const node = el('a', className, text);
    node.href = href;
    return node;
  }
  function showError() {
    app.replaceChildren(el('p', 'error', '단어 데이터를 읽지 못했습니다. 압축을 모두 푼 뒤 index.html과 words.js가 같은 폴더에 있는지 확인해 주세요.'));
  }
  if (!Array.isArray(batches) || !batches.length || batches.some(function (batch) {
    return !Array.isArray(batch.words) || batch.words.some(function (word) {
      return fields.some(function (field) { return typeof word[field] !== 'string' || !word[field].trim(); });
    });
  })) { showError(); return; }
  const days = makeDays(batches);
  if (!days.length) { showError(); return; }
  const total = days[days.length - 1].end;
  function maskField(node, field) {
    const masked = !visible[field];
    node.classList.toggle('is-masked', masked);
    // CSS와 접근성 트리에서 함께 숨깁니다. 칸의 높이는 유지합니다.
    node.querySelector('.field-content').setAttribute('aria-hidden', String(masked));
    if (masked) node.setAttribute('aria-label', labels[field] + ' 숨김');
    else node.removeAttribute('aria-label');
  }
  function fieldNode(field, text, word) {
    const node = el('div', 'field ' + field);
    node.dataset.field = field;
    const content = el('div', 'field-content', text);
    if (field === 'kanji' || field === 'furigana' || field === 'example') content.lang = 'ja';
    if (field === 'meaning' && word.note) {
      content.appendChild(el('span', 'note' + (word.note.includes('확인 필요') ? ' review' : ''), word.note));
    }
    node.appendChild(content);
    maskField(node, field);
    return node;
  }
  function nav(day, bottom) {
    const wrapper = el('div', bottom ? 'bottom-nav' : '');
    const node = el('nav', 'day-nav');
    node.setAttribute('aria-label', bottom ? '아래 Day 이동' : '위 Day 이동');
    node.appendChild(day.number > 1 ? link('← 이전', '#day-' + (day.number - 1)) : el('span', 'disabled', '← 이전'));
    node.appendChild(el('span', 'day-position', 'Day ' + day.number + ' / ' + days.length));
    node.appendChild(day.number < days.length ? link('다음 →', '#day-' + (day.number + 1)) : el('span', 'disabled', '다음 →'));
    wrapper.appendChild(node);
    if (bottom) wrapper.appendChild(link('전체 Day 목록', '#', 'list-return'));
    return wrapper;
  }
  function showList() {
    controls.hidden = true;
    const intro = el('section', 'intro');
    intro.appendChild(el('div', 'eyebrow', 'MY JAPANESE NOTEBOOK'));
    intro.appendChild(el('h1', '', '오늘도, 한 단어씩.'));
    intro.appendChild(el('p', '', '총 ' + total + '개 · ' + days.length + ' Days'));
    intro.appendChild(el('p', '', 'Day를 고르고, 원하는 항목을 가리며 읽어 보세요.'));
    const list = el('nav', 'day-list');
    list.setAttribute('aria-label', '전체 Day 목록');
    days.forEach(function (day) {
      const a = link('', '#day-' + day.number, 'day-link');
      const description = el('span');
      description.appendChild(el('span', 'day-label', 'Day ' + day.number));
      description.appendChild(el('span', 'day-range', day.start + '–' + day.end + ' · ' + day.words.length + '개'));
      a.appendChild(description);
      const arrow = el('span', 'arrow', '↗');
      arrow.setAttribute('aria-hidden','true');
      a.appendChild(arrow);
      list.appendChild(a);
    });
    app.replaceChildren(intro, list);
    document.title = '일본어 단어장';
  }
  function showDay(day) {
    controls.hidden = false;
    const heading = el('section', 'study-heading');
    heading.appendChild(link('← 전체 Day 목록', '#', 'back-link'));
    const row = el('div', 'day-title-row');
    row.appendChild(el('h1', '', 'Day ' + day.number));
    row.appendChild(el('p', '', day.start + '–' + day.end + ' · ' + day.words.length + '개'));
    heading.appendChild(row);
    const list = el('div', 'word-list');
    day.words.forEach(function (word, i) {
      const card = el('article', 'word-card');
      card.setAttribute('aria-label', '단어 ' + (day.start + i));
      card.appendChild(el('p', 'word-number', String(day.start + i).padStart(3, '0')));
      ['kanji', 'furigana', 'meaning'].forEach(function (field) { card.appendChild(fieldNode(field, word[field], word)); });
      const examples = el('div', 'example-group');
      examples.appendChild(fieldNode('example', word.example, word));
      examples.appendChild(fieldNode('translation', word.translation, word));
      card.appendChild(examples);
      list.appendChild(card);
    });
    app.replaceChildren(heading, nav(day, false), list, nav(day, true));
    document.title = 'Day ' + day.number + ' · 일본어 단어장';
  }
  function render(moveFocus) {
    const match = /^#day-([1-9]\d*)$/.exec(window.location.hash);
    const day = match && days[Number(match[1]) - 1];
    if (day) showDay(day); else showList();
    if (moveFocus) {
      const heading = app.querySelector('h1');
      heading.tabIndex = -1;
      heading.focus({preventScroll:true});
    }
    window.scrollTo(0, 0);
  }
  controls.querySelectorAll('button[data-field]').forEach(function (button) {
    button.addEventListener('click', function () {
      const field = button.dataset.field;
      visible[field] = !visible[field];
      button.setAttribute('aria-pressed', String(visible[field]));
      button.querySelector('span').textContent = visible[field] ? 'ON' : 'OFF';
      app.querySelectorAll('.field[data-field="' + field + '"]').forEach(function (node) { maskField(node, field); });
    });
  });
  window.addEventListener('hashchange', function () { render(true); });
  render(false);
}());
