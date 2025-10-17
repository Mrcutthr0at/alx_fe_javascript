let quotes = [];
const SERVER_URL = "https://jsonplaceholder.typicode.com/posts";

const quoteDisplay = document.getElementById("quoteDisplay");
const categorySelect = document.getElementById("categoryFilter");
const newQuoteBtn = document.getElementById("newQuote");
const notification = document.getElementById("notification");

function loadQuotes() {
  const storedQuotes = localStorage.getItem("quotes");
  quotes = storedQuotes ? JSON.parse(storedQuotes) : [
    { text: "The only limit is your mind.", category: "Motivation" },
    { text: "Design is intelligence made visible.", category: "Design" },
    { text: "Code is like humor. When you have to explain it, it’s bad.", category: "Programming" }
  ];
}

function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

function populateCategories() {
  const categories = [...new Set(quotes.map(q => q.category))];
  categorySelect.innerHTML = '<option value="all">All Categories</option>';
  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categorySelect.appendChild(option);
  });

  const savedFilter = localStorage.getItem("selectedCategory");
  if (savedFilter) {
    categorySelect.value = savedFilter;
    filterQuotes();
  }
}

function filterQuotes() {
  const selected = categorySelect.value;
  localStorage.setItem("selectedCategory", selected);

  const filtered = selected === "all"
    ? quotes
    : quotes.filter(q => q.category === selected);

  if (filtered.length === 0) {
    quoteDisplay.innerHTML = "<em>No quotes available for this category.</em>";
    return;
  }

  const randomQuote = filtered[Math.floor(Math.random() * filtered.length)];
  quoteDisplay.innerHTML = `"${randomQuote.text}" — <strong>${randomQuote.category}</strong>`;
  sessionStorage.setItem("lastQuote", JSON.stringify(randomQuote));
}

function showRandomQuote() {
  filterQuotes();
}

function createAddQuoteForm() {
  const formContainer = document.getElementById("addQuoteForm");

  const quoteInput = document.createElement("input");
  quoteInput.id = "newQuoteText";
  quoteInput.placeholder = "Enter a new quote";
  quoteInput.className = "form-group";

  const categoryInput = document.createElement("input");
  categoryInput.id = "newQuoteCategory";
  categoryInput.placeholder = "Enter quote category";
  categoryInput.className = "form-group";

  const addBtn = document.createElement("button");
  addBtn.textContent = "Add Quote";
  addBtn.onclick = addQuote;

  formContainer.appendChild(quoteInput);
  formContainer.appendChild(categoryInput);
  formContainer.appendChild(addBtn);
}

function addQuote() {
  const text = document.getElementById("newQuoteText").value.trim();
  const category = document.getElementById("newQuoteCategory").value.trim();

  if (!text || !category) {
    alert("Please enter both quote and category.");
    return;
  }

  const newQuote = { text, category };
  quotes.push(newQuote);
  saveQuotes();
  populateCategories();
  postQuoteToServer(newQuote);

  document.getElementById("newQuoteText").value = "";
  document.getElementById("newQuoteCategory").value = "";
  alert("Quote added successfully!");
}

function exportToJsonFile() {
  const blob = new Blob([JSON.stringify(quotes, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes.json";
  a.click();
  URL.revokeObjectURL(url);
}

function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function(event) {
    const importedQuotes = JSON.parse(event.target.result);
    quotes.push(...importedQuotes);
    saveQuotes();
    populateCategories();
    alert("Quotes imported successfully!");
  };
  fileReader.readAsText(event.target.files[0]);
}

function restoreLastQuote() {
  const last = sessionStorage.getItem("lastQuote");
  if (last) {
    const quote = JSON.parse(last);
    quoteDisplay.innerHTML = `"${quote.text}" — <strong>${quote.category}</strong>`;
  }
}

async function fetchQuotesFromServer() {
  const response = await fetch(SERVER_URL);
  const data = await response.json();
  return data.map(post => ({
    text: post.title,
    category: "Server"
  }));
}

async function postQuoteToServer(quote) {
  await fetch(SERVER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: quote.text, body: quote.category })
  });
}

async function syncQuotes() {
  const serverQuotes = await fetchQuotesFromServer();
  const localTexts = quotes.map(q => q.text);
  const newQuotes = serverQuotes.filter(q => !localTexts.includes(q.text));

  if (newQuotes.length > 0) {
    quotes.push(...newQuotes);
    saveQuotes();
    populateCategories();
    notifyConflict(newQuotes.length);
  }
}

function notifyConflict(count) {
  notification.textContent = "Quotes synced with server!";
  notification.style.display = "block";
}

loadQuotes();
populateCategories();
createAddQuoteForm();
restoreLastQuote();
newQuoteBtn.addEventListener("click", showRandomQuote);
document.getElementById("exportQuotes").addEventListener("click", exportToJsonFile);
setInterval(syncQuotes, 30000);