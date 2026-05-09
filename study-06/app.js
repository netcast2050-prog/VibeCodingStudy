const STORAGE_KEY = "shopping-list-items";

const itemInput = document.getElementById("item-input");
const addForm = document.getElementById("add-form");
const itemList = document.getElementById("item-list");
const emptyMessage = document.getElementById("empty-message");
const summary = document.getElementById("summary");
const clearCheckedBtn = document.getElementById("clear-checked");

let items = loadItems();

function loadItems() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveItems() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function render() {
    itemList.innerHTML = "";

    items.forEach((item) => {
        const li = document.createElement("li");
        li.className = "item" + (item.checked ? " checked" : "");
        li.dataset.id = item.id;

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = item.checked;
        checkbox.addEventListener("change", () => toggleItem(item.id));

        const text = document.createElement("span");
        text.className = "item-text";
        text.textContent = item.text;

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "delete-btn";
        deleteBtn.type = "button";
        deleteBtn.textContent = "✕";
        deleteBtn.setAttribute("aria-label", "삭제");
        deleteBtn.addEventListener("click", () => deleteItem(item.id));

        li.append(checkbox, text, deleteBtn);
        itemList.appendChild(li);
    });

    const total = items.length;
    const checked = items.filter((i) => i.checked).length;
    summary.textContent =
        total === 0
            ? "아이템 0개"
            : `아이템 ${total}개 · 완료 ${checked}개`;

    emptyMessage.classList.toggle("hidden", total > 0);
    clearCheckedBtn.disabled = checked === 0;
}

function addItem(text) {
    const trimmed = text.trim();
    if (!trimmed) return;

    items.push({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        text: trimmed,
        checked: false,
    });
    saveItems();
    render();
}

function toggleItem(id) {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    item.checked = !item.checked;
    saveItems();
    render();
}

function deleteItem(id) {
    items = items.filter((i) => i.id !== id);
    saveItems();
    render();
}

function clearChecked() {
    if (!items.some((i) => i.checked)) return;
    items = items.filter((i) => !i.checked);
    saveItems();
    render();
}

addForm.addEventListener("submit", (e) => {
    e.preventDefault();
    addItem(itemInput.value);
    itemInput.value = "";
    itemInput.focus();
});

clearCheckedBtn.addEventListener("click", clearChecked);

render();
