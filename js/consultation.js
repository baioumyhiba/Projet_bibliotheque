// Fonction pour charger la page de consultation
async function loadConsultation() {
    const workspace = document.getElementById('workspace');
    if (!workspace) return;

    workspace.innerHTML = `
        <div class="consultation-container">
            <!-- Barre de recherche -->
            <section class="search-section">
                <div class="search-container">
                    <input type="text" 
                           id="search-input" 
                           class="search-input" 
                           placeholder=""
                           data-i18n-placeholder="consultation.search.placeholder"
                           autocomplete="off">
                    <button class="search-btn" onclick="performSearch()">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="M21 21l-4.35-4.35"></path>
                        </svg>
                    </button>
                </div>
                <div id="search-suggestions" class="search-suggestions"></div>
            </section>

            <!-- Historiques -->
            <div class="history-container">
                <!-- Historique de recherche -->
                <section class="history-section">
                    <div class="history-header">
                        <h3 class="history-title" data-i18n="consultation.search.title">Historique de recherche</h3>
                        <button class="clear-history-btn" onclick="clearSearchHistory()" data-i18n-title="consultation.clear.history" title="Effacer l'historique">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    </div>
                    <div id="search-history" class="history-list"></div>
                </section>

                <!-- Historique de téléchargements -->
                <section class="history-section">
                    <div class="history-header">
                        <h3 class="history-title" data-i18n="consultation.download.title">Historique de téléchargements</h3>
                        <button class="clear-history-btn" onclick="clearDownloadHistory()" data-i18n-title="consultation.clear.history" title="Effacer l'historique">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    </div>
                    <div id="download-history" class="history-list"></div>
                </section>
            </div>

            <!-- Résultats de recherche -->
            <section class="results-section">
                <div id="search-results" class="search-results"></div>
                
                <!-- Zone de détails du livre -->
                <div id="book-details" class="book-details-modal">
                    <div class="detail-header">
                        <h3 id="detail-title"></h3>
                        <button class="detail-close" onclick="closeDetails()" data-i18n="common.close">✕ Fermer</button>
                    </div>
                    <div class="detail-content">
                        <img id="detail-img" class="detail-image" src="" alt=""/>
                        <div class="detail-info">
                            <div class="detail-meta">
                                <div class="detail-meta-item">
                                    <span class="detail-meta-label" data-i18n="books.details.author">Auteur :</span>
                                    <span class="detail-meta-value" id="detail-author"></span>
                                </div>
                                <div class="detail-meta-item">
                                    <span class="detail-meta-label" data-i18n="books.details.year">Année :</span>
                                    <span class="detail-meta-value" id="detail-year"></span>
                                </div>
                                <div class="detail-meta-item">
                                    <span class="detail-meta-label" data-i18n="books.details.category">Catégorie :</span>
                                    <span class="detail-meta-value" id="detail-category"></span>
                                </div>
                            </div>
                            <div class="detail-text" id="detail-desc"></div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    `;

    // Charger les historiques
    loadSearchHistory();
    loadDownloadHistory();

    // Charger tous les livres par défaut
    await loadAllBooks();
    
    // Appliquer les traductions aux nouveaux éléments créés
    if (App && App.applyTranslations) {
        App.applyTranslations();
    }

    // Ajouter les event listeners
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });

        searchInput.addEventListener('input', () => {
            const query = searchInput.value.trim();
            if (query.length > 0) {
                showSearchSuggestions(query);
            } else {
                hideSearchSuggestions();
                // Si le champ de recherche est vide, recharger tous les livres
                loadAllBooks();
            }
        });
    }
}

// Fonction pour charger et afficher tous les livres
async function loadAllBooks() {
    try {
        // Charger les livres
        const booksResponse = await fetch(`data/books.xml?v=${Date.now()}`);
        if (!booksResponse.ok) throw new Error("Erreur lors du chargement des livres");
        const booksText = await booksResponse.text();
        const booksParser = new DOMParser();
        const booksDoc = booksParser.parseFromString(booksText, "application/xml");

        // Charger les auteurs
        const authorsResponse = await fetch(`data/authors.xml?v=${Date.now()}`);
        if (!authorsResponse.ok) throw new Error("Erreur lors du chargement des auteurs");
        const authorsText = await authorsResponse.text();
        const authorsParser = new DOMParser();
        const authorsDoc = authorsParser.parseFromString(authorsText, "application/xml");

        // Créer une map des auteurs
        const authorsMap = new Map();
        const authors = authorsDoc.getElementsByTagName('auteur');
        for (let i = 0; i < authors.length; i++) {
            const author = authors[i];
            const authorId = author.getAttribute('id');
            const authorName = author.getElementsByTagName('nom')[0]?.textContent || '';
            authorsMap.set(authorId, authorName);
        }

        // Créer une liste de résultats avec tous les livres
        const books = booksDoc.getElementsByTagName('livre');
        const results = [];
        for (let i = 0; i < books.length; i++) {
            results.push({
                type: 'book',
                book: books[i],
                matchType: 'all'
            });
        }

        // Afficher tous les livres
        await displaySearchResults(results, authorsMap, '');
    } catch (error) {
        console.error("Erreur lors du chargement des livres:", error);
        const resultsContainer = document.getElementById('search-results');
        if (resultsContainer) {
            resultsContainer.innerHTML = `<p class="error-message">${translate("consultation.error.loading.books", "Erreur lors du chargement des livres. Veuillez réessayer.")}</p>`;
        }
    }
}

// Fonction pour effectuer une recherche
async function performSearch() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;

    const query = searchInput.value.trim();
    if (!query) {
        alert(translate("consultation.search.empty", "Veuillez entrer un terme de recherche"));
        return;
    }

    // Enregistrer dans l'historique
    saveSearchToHistory(query);

    // Effectuer la recherche
    await searchBooksAndAuthors(query);
}

// Fonction pour rechercher dans les livres et auteurs
async function searchBooksAndAuthors(query) {
    try {
        // Charger les livres
        const booksResponse = await fetch(`data/books.xml?v=${Date.now()}`);
        if (!booksResponse.ok) throw new Error("Erreur lors du chargement des livres");
        const booksText = await booksResponse.text();
        const booksParser = new DOMParser();
        const booksDoc = booksParser.parseFromString(booksText, "application/xml");

        // Charger les auteurs
        const authorsResponse = await fetch(`data/authors.xml?v=${Date.now()}`);
        if (!authorsResponse.ok) throw new Error("Erreur lors du chargement des auteurs");
        const authorsText = await authorsResponse.text();
        const authorsParser = new DOMParser();
        const authorsDoc = authorsParser.parseFromString(authorsText, "application/xml");

        // Créer une map des auteurs
        const authorsMap = new Map();
        const authors = authorsDoc.getElementsByTagName('auteur');
        for (let i = 0; i < authors.length; i++) {
            const author = authors[i];
            const authorId = author.getAttribute('id');
            const authorName = author.getElementsByTagName('nom')[0]?.textContent || '';
            authorsMap.set(authorId, authorName);
        }

        // Normaliser la requête de recherche (insensible à la casse, accents)
        const normalizedQuery = normalizeString(query);

        // Rechercher dans les livres
        const results = [];
        const books = booksDoc.getElementsByTagName('livre');
        
        for (let i = 0; i < books.length; i++) {
            const book = books[i];
            const title = book.getElementsByTagName('titre')[0]?.textContent || '';
            const description = book.getElementsByTagName('description')[0]?.textContent || '';
            
            // Vérifier si le titre correspond
            if (normalizeString(title).includes(normalizedQuery)) {
                results.push({
                    type: 'book',
                    book: book,
                    matchType: 'title'
                });
            }
            // Vérifier si la description correspond
            else if (normalizeString(description).includes(normalizedQuery)) {
                results.push({
                    type: 'book',
                    book: book,
                    matchType: 'description'
                });
            }
            // Vérifier les auteurs
            else {
                const authorRefs = book.getElementsByTagName('auteurRef');
                for (let j = 0; j < authorRefs.length; j++) {
                    const authorId = authorRefs[j].getAttribute('id');
                    if (authorId !== 'INDISPO') {
                        const authorName = authorsMap.get(authorId);
                        if (authorName && normalizeString(authorName).includes(normalizedQuery)) {
                            results.push({
                                type: 'book',
                                book: book,
                                matchType: 'author'
                            });
                            break; // Un seul résultat par livre
                        }
                    }
                }
            }
        }

        // Afficher les résultats
        displaySearchResults(results, authorsMap, query);

    } catch (error) {
        console.error("Erreur lors de la recherche:", error);
        const resultsContainer = document.getElementById('search-results');
        if (resultsContainer) {
            resultsContainer.innerHTML = `<p class="error-message">${translate("consultation.error.loading", "Erreur lors de la recherche. Veuillez réessayer.")}</p>`;
        }
    }
}

// Fonction pour normaliser une chaîne (insensible à la casse et accents)
function normalizeString(str) {
    return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

// Fonction pour afficher les résultats de recherche
async function displaySearchResults(results, authorsMap, query) {
    // Charger les catégories pour les afficher
    let categoriesMap = new Map();
    try {
        const categoriesResponse = await fetch(`data/categories.xml?v=${Date.now()}`);
        if (categoriesResponse.ok) {
            const categoriesText = await categoriesResponse.text();
            const categoriesParser = new DOMParser();
            const categoriesDoc = categoriesParser.parseFromString(categoriesText, "application/xml");
            const categories = categoriesDoc.getElementsByTagName('categorie');
            for (let i = 0; i < categories.length; i++) {
                const cat = categories[i];
                const catId = cat.getAttribute('id');
                const catName = cat.getElementsByTagName('libelle')[0]?.textContent || catId;
                categoriesMap.set(catId, catName);
            }
        }
    } catch (e) {
        console.warn("Erreur lors du chargement des catégories:", e);
    }
    const resultsContainer = document.getElementById('search-results');
    if (!resultsContainer) return;

    if (results.length === 0) {
        resultsContainer.innerHTML = `
            <div class="no-results">
                <p>${translate("consultation.no.results", "Aucun résultat trouvé")}${query ? ` ${translate("consultation.no.results.for", "pour")} "<strong>${query}</strong>"` : ''}</p>
            </div>
        `;
        return;
    }

    // Afficher un titre différent selon qu'il s'agit d'une recherche ou de tous les livres
    const headerTitle = query ? `Résultats de recherche : "${query}"` : 'Tous les livres';
    const headerSubtitle = query ? `${results.length} résultat${results.length > 1 ? 's' : ''} trouvé${results.length > 1 ? 's' : ''}` : `${results.length} livre${results.length > 1 ? 's' : ''} disponible${results.length > 1 ? 's' : ''}`;

    resultsContainer.innerHTML = `
        <div class="results-header">
            <h3>${headerTitle}</h3>
            <p class="results-count">${headerSubtitle}</p>
        </div>
        <div class="results-grid">
            ${results.map(result => {
                const book = result.book;
                const bookId = book.getAttribute('idLivre');
                const title = book.getElementsByTagName('titre')[0]?.textContent || 'Sans titre';
                const description = book.getElementsByTagName('description')[0]?.textContent || '';
                const image = book.getElementsByTagName('image')[0]?.textContent || '';
                const year = book.getElementsByTagName('anneePublication')[0]?.textContent || '';
                const isbn = book.getElementsByTagName('isbn')[0]?.textContent || '';
                const disponibilite = book.getElementsByTagName('disponibilite')[0]?.textContent === 'true';

                const authorRefs = book.getElementsByTagName('auteurRef');
                const authorNames = [];
                let authorId = null;
                for (let i = 0; i < authorRefs.length; i++) {
                    const authId = authorRefs[i].getAttribute('id');
                    if (authId === 'INDISPO') {
                        authorNames.push(translate("books.author.unavailable", "Indisponible"));
                    } else {
                        const authorName = authorsMap.get(authId) || translate("consultation.unknown.author", "Auteur inconnu");
                        authorNames.push(authorName);
                        if (!authorId) authorId = authId;
                    }
                }
                const authorsText = authorNames.length > 0 ? authorNames.join(', ') : translate("consultation.unknown.author", "Auteur inconnu");

                // Récupérer les catégories
                const categoryRefs = book.getElementsByTagName('categorieRef');
                const categoryNames = [];
                for (let i = 0; i < categoryRefs.length; i++) {
                    const catId = categoryRefs[i].getAttribute('id');
                    const catName = categoriesMap.get(catId) || catId;
                    categoryNames.push(catName);
                }
                const categoriesText = categoryNames.length > 0 ? categoryNames.join(', ') : 'Non spécifiée';

                const shortDescription = description.length > 150 ? description.substring(0, 150) + '...' : description;

                return `
                    <div class="result-card">
                        <div class="result-image">
                            ${image ? `<img src="${image}" alt="${title}" onerror="this.parentElement.innerHTML='<div class=\\'no-image\\'>📚</div>'">` : '<div class="no-image">📚</div>'}
                        </div>
                        <div class="result-info">
                            <h4 class="result-title">${title}</h4>
                            <p class="result-author">${authorsText}</p>
                            ${year ? `<p class="result-year">${year}</p>` : ''}
                            <p class="result-description">${shortDescription}</p>
                            <div class="result-actions">
                                <button class="result-btn details-btn" onclick="showDetailsWithMeta('${title.replace(/'/g, "\\'")}', '${image.replace(/'/g, "\\'")}', '${description.replace(/'/g, "\\'")}', '${authorsText.replace(/'/g, "\\'")}', '${year || ''}', '${categoriesText}')">
                                    Détails
                                </button>
                                <button class="result-btn download-btn" onclick="downloadBookPDF('${title.replace(/'/g, "\\'")}', '${image.replace(/'/g, "\\'")}', '${description.replace(/'/g, "\\'")}', '${authorId || ''}')">
                                    Télécharger PDF
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// Fonction pour afficher les suggestions de recherche
function showSearchSuggestions(query) {
    // Cette fonction peut être étendue pour afficher des suggestions en temps réel
    // Pour l'instant, on garde simple
}

// Fonction pour masquer les suggestions
function hideSearchSuggestions() {
    const suggestions = document.getElementById('search-suggestions');
    if (suggestions) {
        suggestions.innerHTML = '';
    }
}

// GESTION DE L'HISTORIQUE DE RECHERCHE

// Obtenir la clé de stockage pour l'historique de recherche de l'utilisateur
function getSearchHistoryKey() {
    const currentUser = Auth.currentUser || Auth.checkSession();
    if (!currentUser || !currentUser.id) {
        return 'searchHistory_guest';
    }
    return `searchHistory_${currentUser.id}`;
}

// Charger l'historique de recherche
function loadSearchHistory() {
    const historyContainer = document.getElementById('search-history');
    if (!historyContainer) return;

    const history = getSearchHistory();
    
    if (history.length === 0) {
        historyContainer.innerHTML = `<p class="empty-history">${translate("consultation.no.search.history", "Aucune recherche récente")}</p>`;
        return;
    }

    historyContainer.innerHTML = history.map(item => `
        <div class="history-item" onclick="searchFromHistory('${item.replace(/'/g, "\\'")}')">
            <span class="history-icon">🔍</span>
            <span class="history-text">${item}</span>
        </div>
    `).join('');
}

// Sauvegarder une recherche dans l'historique
function saveSearchToHistory(query) {
    let history = getSearchHistory();
    
    // Retirer si déjà présent
    history = history.filter(item => item.toLowerCase() !== query.toLowerCase());
    
    // Ajouter au début
    history.unshift(query);
    
    // Limiter à 10 recherches
    history = history.slice(0, 10);
    
    // Sauvegarder avec la clé spécifique à l'utilisateur
    const key = getSearchHistoryKey();
    localStorage.setItem(key, JSON.stringify(history));
    
    // Recharger l'affichage
    loadSearchHistory();
}

// Récupérer l'historique de recherche
function getSearchHistory() {
    try {
        const key = getSearchHistoryKey();
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        return [];
    }
}

// Rechercher depuis l'historique
function searchFromHistory(query) {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.value = query;
        performSearch();
    }
}

// Effacer l'historique de recherche
function clearSearchHistory() {
    if (confirm(translate("consultation.clear.search.confirm", "Voulez-vous vraiment effacer l'historique de recherche ?"))) {
        const key = getSearchHistoryKey();
        localStorage.removeItem(key);
        loadSearchHistory();
    }
}

// GESTION DE L'HISTORIQUE DE TÉLÉCHARGEMENTS

// Obtenir la clé de stockage pour l'historique de téléchargements de l'utilisateur
function getDownloadHistoryKey() {
    const currentUser = Auth.currentUser || Auth.checkSession();
    if (!currentUser || !currentUser.id) {
        return 'downloadHistory_guest';
    }
    return `downloadHistory_${currentUser.id}`;
}

// Charger l'historique de téléchargements
function loadDownloadHistory() {
    const historyContainer = document.getElementById('download-history');
    if (!historyContainer) return;

    const history = getDownloadHistory();
    
    if (history.length === 0) {
        historyContainer.innerHTML = `<p class="empty-history">${translate("consultation.no.download.history", "Aucun téléchargement récent")}</p>`;
        return;
    }

    historyContainer.innerHTML = history.map(item => `
        <div class="history-item">
            <span class="history-icon">📥</span>
            <div class="history-content">
                <span class="history-text">${item.title}</span>
                <span class="history-date">${formatDate(item.date)}</span>
            </div>
        </div>
    `).join('');
}

// Sauvegarder un téléchargement dans l'historique
function saveDownloadToHistory(title) {
    let history = getDownloadHistory();
    
    // Ajouter au début
    history.unshift({
        title: title,
        date: new Date().toISOString()
    });
    
    // Limiter à 20 téléchargements
    history = history.slice(0, 20);
    
    // Sauvegarder avec la clé spécifique à l'utilisateur
    const key = getDownloadHistoryKey();
    localStorage.setItem(key, JSON.stringify(history));
    
    // Recharger l'affichage
    loadDownloadHistory();
}

// Récupérer l'historique de téléchargements
function getDownloadHistory() {
    try {
        const key = getDownloadHistoryKey();
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        return [];
    }
}

// Effacer l'historique de téléchargements
function clearDownloadHistory() {
    if (confirm(translate("consultation.clear.history.confirm", "Voulez-vous vraiment effacer l'historique de téléchargements ?"))) {
        const key = getDownloadHistoryKey();
        localStorage.removeItem(key);
        loadDownloadHistory();
    }
}

// Formater une date
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
    if (hours < 24) return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
    if (days < 7) return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
    
    return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Fonction pour afficher les détails avec métadonnées
async function showDetailsWithMeta(title, img, desc, author, year, category) {
    // Chercher par ID d'abord
    let detail = document.getElementById('book-details');
    // Si non trouvé, chercher par classe (pour la page de consultation)
    if (!detail) {
        detail = document.querySelector('.book-details-modal');
    }
    if (!detail) return;
    
    detail.classList.add('show');
    detail.style.display = 'block';
    
    const detailTitle = document.getElementById('detail-title');
    const detailImg = document.getElementById('detail-img');
    const detailDesc = document.getElementById('detail-desc');
    const detailAuthor = document.getElementById('detail-author');
    const detailYear = document.getElementById('detail-year');
    const detailCategory = document.getElementById('detail-category');
    
    if (detailTitle) detailTitle.innerText = title;
    if (detailImg) {
        detailImg.src = img;
        detailImg.onerror = function() {
            this.src = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\'%3E%3Crect fill=\'%23e9ecef\' width=\'200\' height=\'200\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dy=\'.3em\' fill=\'%236c757d\' font-family=\'Arial\' font-size=\'14\'%3ELivre%3C/text%3E%3C/svg%3E';
        };
    }
    if (detailDesc) detailDesc.innerText = desc;
    if (detailAuthor) detailAuthor.innerHTML = author || translate("books.details.not.specified", "Non spécifié");
    if (detailYear) detailYear.innerText = year || translate("books.details.not.specified", "Non spécifiée");
    if (detailCategory) detailCategory.innerText = category || translate("books.details.not.specified", "Non spécifiée");
    
    detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Exposer les fonctions globalement
window.loadConsultation = loadConsultation;
window.loadAllBooks = loadAllBooks;
window.performSearch = performSearch;
window.searchFromHistory = searchFromHistory;
window.clearSearchHistory = clearSearchHistory;
window.clearDownloadHistory = clearDownloadHistory;
window.saveDownloadToHistory = saveDownloadToHistory;
window.showDetailsWithMeta = showDetailsWithMeta;

