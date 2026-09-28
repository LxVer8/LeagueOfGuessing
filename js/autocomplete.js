// ============================================================
//  autocomplete.js — Champion search box
//  Load order: 10
// ============================================================

let autocompleteIndex = -1;

function hideAutocomplete() {
  els.autocomplete.classList.remove('visible');
  els.autocomplete.innerHTML = '';
  autocompleteIndex = -1;
}

function showAutocomplete(query) {
  const q = normalizeName(query);
  if (!q) { hideAutocomplete(); return; }

  const matches = state.allChampions
    .filter((c) =>
      normalizeName(c.names.en).includes(q) ||
      normalizeName(c.names.es).includes(q) ||
      normalizeName(c.key).includes(q)
    )
    .slice(0, 8);

  if (matches.length === 0) { hideAutocomplete(); return; }

  els.autocomplete.innerHTML = matches
    .map((c, i) => {
      const iconUrl = `${DDRAGON_CDN}/${state.version}/img/champion/${c.key}.png`;
      return `<li data-key="${c.key}" data-index="${i}">
        <img src="${iconUrl}" alt="">
        <span>${escapeHtml(displayChampionName(c))}</span>
      </li>`;
    })
    .join('');

  els.autocomplete.classList.add('visible');
  autocompleteIndex = -1;
}

function commitAutocompleteSelection(li) {
  const key = li.dataset.key;
  const champ = findChampionByKey(key);
  if (!champ) return;
  els.championInput.value = displayChampionName(champ);
  state.selectedChampionKey = champ.key;
  hideAutocomplete();
}

function handleAutocompleteKeydown(e) {
  const items = els.autocomplete.querySelectorAll('li');
  if (!els.autocomplete.classList.contains('visible') || items.length === 0) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    autocompleteIndex = (autocompleteIndex + 1) % items.length;
    updateAutocompleteHighlight(items);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    autocompleteIndex = (autocompleteIndex - 1 + items.length) % items.length;
    updateAutocompleteHighlight(items);
  } else if (e.key === 'Enter') {
    if (autocompleteIndex >= 0) {
      e.preventDefault();
      commitAutocompleteSelection(items[autocompleteIndex]);
    }
  } else if (e.key === 'Escape') {
    hideAutocomplete();
  }
}

function updateAutocompleteHighlight(items) {
  items.forEach((li, i) => li.classList.toggle('active', i === autocompleteIndex));
  if (autocompleteIndex >= 0 && items[autocompleteIndex]) {
    items[autocompleteIndex].scrollIntoView({ block: 'nearest' });
  }
}