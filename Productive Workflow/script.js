const board = document.getElementById('board');
const listTemplate = document.getElementById('listTemplate');
const cardTemplate = document.getElementById('cardTemplate');

const newListBtn = document.getElementById('newListBtn');
const resetBtn = document.getElementById('resetBtn');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const importFile = document.getElementById('importFile');

let draggedCard = null;
let draggedList = null;

/*############### HANDLING LISTS AND CARDS ########## */

function createList(title = 'Untitled List', cards = []){
    const frag = listTemplate.content.cloneNode(true);
    const listEl = frag.querySelector('.list');
    const titleInput = listEl.querySelector('.list-title');
    const deleteBtn = listEl.querySelector('.delete-list');
    const cardsContainer = listEl.querySelector('.cards');
    const addInput = listEl.querySelector('.add-card input');
    const addBtn = listEl.querySelector('.add-btn');
    const handle = listEl.querySelector('.handle');

    titleInput.value = title;

    cards.forEach(text => addCard(cardsContainer, text));

    //add card
    addBtn.addEventListener('click', () => {
        const v = addInput.value.trim();
        if (!v) return;
        addCard(cardsContainer, v);
        addInput.value = '';
        saveBoard();
    });
    addInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') addBtn.click();
    });

    //this will delete thr list
    deleteBtn.addEventListener('click', () => {
        if (confirm('Delete this list?')) {
        listEl.remove();
        saveBoard();
        }
    });

    titleInput.addEventListener('input', saveBoard);
    handle.setAttribute('draggable', 'true');
    handle.addEventListener('dragstart', e => {
        draggedList = listEl;
    setTimeout(() => listEl.classList.add('dragging'), 0);
        try { e.dataTransfer.setData('text/plain', ''); } catch (err) {}
    });

    handle.addEventListener('dragend', () => {
        if (draggedList) {
        draggedList.classList.remove('dragging');
        draggedList = null;
        saveBoard();
        }
    });
    //this handles card dropping
    cardsContainer.addEventListener('dragover', e => {
        e.preventDefault();
        if (!draggedCard) return;
        const after = getCardDragAfterElement(cardsContainer, e.clientY);
        if (after == null) cardsContainer.appendChild(draggedCard);
        else cardsContainer.insertBefore(draggedCard, after);
    });

    board.appendChild(listEl);
    saveBoard();

}

//this should create new card
function addCard(container, text){
    const frag = cardTemplate.content.cloneNode(true);
    const cardEl = frag.querySelector('.card');
    const textEl = cardEl.querySelector('.card-text');
    const deleteBtn = cardEl.querySelector('.delete-card');

    textEl.textContent = text;

    //this makes card draggable
    cardEl.setAttribute('draggable', 'true');
    cardEl.addEventListener('dragstart', e => {
        draggedCard = cardEl;
        setTimeout(() => cardEl.classList.add('dragging'), 0);
        try { e.dataTransfer.setData('text/plain', ''); } catch (err) {}
    });
    cardEl.addEventListener('dragend', () => {
        draggedCard = null;
        cardEl.classList.remove('dragging');
        saveBoard();
    });

    //this deletes the card
    deleteBtn.addEventListener('click', () => {
        cardEl.remove();
        saveBoard();
    });

    //this handles double clicking
    textEl.addEventListener('dblclick', () => {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'card-edit';
        input.value = textEl.textContent;

        textEl.replaceWith(input);
        input.focus();
        input.select();

        function commit() {
        const newVal = input.value.trim() || 'Untitled';
        textEl.textContent = newVal;
        input.replaceWith(textEl);
        saveBoard();
        }
        function cancel() {
        input.replaceWith(textEl);
        }

        input.addEventListener('blur', commit);
        input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') input.blur();
        if (e.key === 'Escape') { cancel(); }
        });
    });

    container.appendChild(cardEl);
}

function getCardDragAfterElement(container, y) {
    const draggable = [...container.querySelectorAll('.card:not(.dragging)')];
    return draggable.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
        } else {
        return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element || null;
}

function getListDragAfterElement(container, x) {
    const lists = [...container.querySelectorAll('.list:not(.dragging)')];
    return lists.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = x - box.left - box.width / 2;
        if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
        } else {
        return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element || null;
}

board.addEventListener('dragover', e => {
    e.preventDefault();

    if (draggedList) {
        const after = getListDragAfterElement(board, e.clientX);
        if (!after) board.appendChild(draggedList);
        else board.insertBefore(draggedList, after);
    }
});

/*############## SAVING AND LOADING ########### */

function saveBoard() {
    const data = [];
    document.querySelectorAll('.list').forEach(listEl => {
        const title = listEl.querySelector('.list-title').value;
        const cards = [...listEl.querySelectorAll('.card .card-text')].map(s => s.textContent);
        data.push({ title, cards });
    });
    localStorage.setItem('productiveBoard', JSON.stringify(data));
}

function loadBoard(){
    board.innerHTML = '';
    const saved = localStorage.getItem('productiveBoard');
    if (saved) {
        try {
        const data = JSON.parse(saved);
        data.forEach(list => createList(list.title, list.cards));
        } catch (err) {
        console.error('Failed to parse saved board', err);
        createDefault();
        }
    } else {
        createDefault();
    }

    setTimeout(() => saveBoard(), 50);
}

//DEAFULT CARDS
function createDefault(){
    /* OKAY, LISTEN
        Here you can put the deafult template.

        You can make default lists like I did "TODO, DOING, DONE"; as this is how I usualy organise and plan
        my workspace.

        But you can also leave this empty, so if users are using different approach, they
        can just have empty sheet upon "resetting", which makes it easier for them to create new lists!
    */

    createList('DONE',[]);
    createList('DOING',[])
    createList('TO DO',[])

}

function exportBoard(){
    saveBoard();
    const data = localStorage.getItem('productiveBoard') || '[]';
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'productive-workspace.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

function importBoardFile(file){
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
        const parsed = JSON.parse(e.target.result);
        if (!Array.isArray(parsed)) throw new Error('Invalid board format');
        localStorage.setItem('productiveBoard', JSON.stringify(parsed));
        loadBoard();
        alert('Board imported successfully.');
        } catch (err) {
        alert('Failed to import board: ' + err.message);
        }
    };
    reader.readAsText(file);
}

function resetBoard(){
    if (!confirm('Reset board to defaults? This will remove saved board from this browser.')) return;
    localStorage.removeItem('productiveBoard');
    board.innerHTML = '';
    createDefault();
    saveBoard();
}

newListBtn.addEventListener('click', () => createList());
resetBtn.addEventListener('click', resetBoard);

exportBtn.addEventListener('click', exportBoard);
importBtn.addEventListener('click', () => importFile.click());
importFile.addEventListener('change', (e) => {
    const f = e.target.files[0];
    if (f) importBoardFile(f);

    importFile.value = '';
});

//###########################################################

loadBoard();
