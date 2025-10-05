//ONE BOARD

const board = document.getElementById('board');
const listTemplate = document.getElementById('listTemplate');
const cardTemplate = document.getElementById('cardTemplate');


//NAVIGATION LIST

const newListBtn = document.getElementById('newListBtn');
const resetBtn = document.getElementById('resetBtn');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const importFile = document.getElementById('importFile');

let draggedCard = null;
let draggedList = null;

//BOARD SWITCHER

const boardsContainer = document.getElementById('boards');
const addBoardBtn = document.getElementById('addBoardBtn');
const removeBoardBtn = document.getElementById('removeBoardBtn')

let boardsData = {};
let activeBoard = null;

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
    if (!activeBoard) return;

    const data = [];
    document.querySelectorAll('.list').forEach(listEl => {
        const title = listEl.querySelector('.list-title').value;
        const cards = [...listEl.querySelectorAll('.card .card-text')].map(s => s.textContent);
        data.push({ title, cards });
    });

    boardsData[activeBoard] = data;
    localStorage.setItem('productiveBoards', JSON.stringify({
        boards: boardsData,
        activeBoard: activeBoard
    }));
}

function loadBoard() {
    board.innerHTML = '';

    const newListBtn = createAddListButton();

    if (boardsData[activeBoard]) {
        boardsData[activeBoard].forEach(list => createList(list.title, list.cards, newListBtn));
    } else {
        createDefault(newListBtn);
        saveBoard();
    }
}

//BUTTON WHICH WILL BE NEXT TO THE CARDS
function createAddListButton() {
    const btn = document.createElement('button');
    btn.id = 'newListBtn';
    btn.className = 'new-list-btn';
    btn.textContent = '+';
    btn.addEventListener('click', () => createList());
    board.appendChild(btn);
    return btn;
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

function exportBoard() {
    saveAll(); // make sure all boards are saved
    const data = JSON.stringify({
        boards: boardsData,
        activeBoard: activeBoard
    });
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'productive-boards.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

function importBoardFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const parsed = JSON.parse(e.target.result);
            if (!parsed.boards || !parsed.activeBoard) throw new Error('Invalid board format');

            boardsData = parsed.boards;
            activeBoard = parsed.activeBoard;

            saveAll();
            renderBoardTabs();
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
    board.appendChild(newListBtn);
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

//SWITCHING BOARDS SCRIPT

function renderBoardTabs() {
    boardsContainer.innerHTML = '';
    Object.keys(boardsData).forEach(name => {
        const tab = document.createElement('button');
        tab.textContent = name;
        tab.className = 'board-tab' + (name === activeBoard ? ' active' : '');
        tab.addEventListener('click', () => {
            activeBoard = name;
            saveAll();
            renderBoardTabs();
            loadBoard();
        });
        boardsContainer.appendChild(tab);
    });
}

function addBoard(name) {
    if (boardsData[name]) {
        alert('Board with this name already exists!');
        return;
    }
    boardsData[name] = [
        {title: 'TO DO', cards: []},
        {title: 'DOING', cards: []},
        {title: 'DONE', cards: []}
    ];
    activeBoard = name;
    saveAll();
    renderBoardTabs();
    loadBoard();
}


function saveAll() {
    localStorage.setItem('productiveBoards', JSON.stringify({
        boards: boardsData,
        activeBoard: activeBoard
    }));
}

function loadAll() {
    const saved = localStorage.getItem('productiveBoards');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            boardsData = parsed.boards || {};
            activeBoard = parsed.activeBoard || Object.keys(boardsData)[0];
        } catch (err) {
            console.error('Failed to parse saved boards', err);
            boardsData = {};
            activeBoard = null;
        }
    }
    if (!activeBoard) {
        addBoard('Board 1');
    }
    renderBoardTabs();
    loadBoard();
}

addBoardBtn.addEventListener('click', () => {
    const name = prompt('Enter new board name:');
    if (name) addBoard(name.trim());
});

removeBoardBtn.addEventListener('click', () => {

    if (confirm('Are you sure you want to delete this board?')) {
        if(!activeBoard){
            alert('No active board to remove!')
            return;
        }

        delete boardsData[activeBoard];
        const remainingBoards = Object.keys(boardsData);
        activeBoard = remainingBoards[0] || null;

        saveAll();
        renderBoardTabs();
        loadAll();
    }
})

//###########################################################

loadAll();
