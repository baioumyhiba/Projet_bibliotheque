// Fonction pour charger et afficher la page d'accueil
async function loadHomePage() {
    const workspace = document.getElementById('workspace');
    if (!workspace) return;

    workspace.innerHTML = `
        <div class="home-container">
            <!-- Répartition par catégorie -->
            <section class="home-section">
                <h3 class="section-title" data-i18n="home.category.title">Répartition par catégorie</h3>
                <div id="category-cards" class="category-cards-grid"></div>
            </section>

            <!-- Derniers livres ajoutés -->
            <section class="home-section">
                <h3 class="section-title" data-i18n="home.recent.title">Derniers livres ajoutés</h3>
                <div id="recent-books" class="books-grid"></div>
            </section>

            <!-- Suggestions de livres populaires -->
            <section class="home-section">
                <h3 class="section-title" data-i18n="home.popular.title">Suggestions de livres populaires</h3>
                <div id="popular-books" class="books-grid"></div>
            </section>
        </div>
    `;

    // Charger les données
    await Promise.all([
        loadCategoryCards(),
        loadRecentBooks(),
        loadPopularBooks()
    ]);
    
    // Appliquer les traductions aux nouveaux éléments créés
    if (App && App.applyTranslations) {
        App.applyTranslations();
    }
}

// Charger et afficher les cartes de catégories
async function loadCategoryCards() {
    try {
        // Charger les catégories
        const categoriesResponse = await fetch(`data/categories.xml?v=${Date.now()}`);
        if (!categoriesResponse.ok) throw new Error("Erreur lors du chargement des catégories");
        const categoriesText = await categoriesResponse.text();
        const categoriesParser = new DOMParser();
        const categoriesDoc = categoriesParser.parseFromString(categoriesText, "application/xml");

        // Charger les livres
        const booksResponse = await fetch(`data/books.xml?v=${Date.now()}`);
        if (!booksResponse.ok) throw new Error("Erreur lors du chargement des livres");
        const booksText = await booksResponse.text();
        const booksParser = new DOMParser();
        const booksDoc = booksParser.parseFromString(booksText, "application/xml");

        // Extraire les catégories avec leurs noms
        const categoriesMap = new Map();
        const categoriesList = categoriesDoc.getElementsByTagName('categorie');
        for (let i = 0; i < categoriesList.length; i++) {
            const cat = categoriesList[i];
            const catId = cat.getAttribute('id');
            const catName = cat.getElementsByTagName('libelle')[0]?.textContent || catId;
            categoriesMap.set(catId, catName);
        }

        // Compter les livres par catégorie
        const categoryCount = new Map();
        const books = booksDoc.getElementsByTagName('livre');
        let totalBooks = 0;
        
        for (let i = 0; i < books.length; i++) {
            const book = books[i];
            const categoryRefs = book.getElementsByTagName('categorieRef');
            for (let j = 0; j < categoryRefs.length; j++) {
                const catId = categoryRefs[j].getAttribute('id');
                const count = categoryCount.get(catId) || 0;
                categoryCount.set(catId, count + 1);
                totalBooks++;
            }
        }

        // Couleurs pour les cartes
        const colors = [
            { bg: '#4c95af', border: '#3a7a8f', icon: '📚' },
            { bg: '#28a745', border: '#218838', icon: '📖' },
            { bg: '#ffc107', border: '#e0a800', icon: '📗' },
            { bg: '#dc3545', border: '#c82333', icon: '📕' },
            { bg: '#17a2b8', border: '#138496', icon: '📘' },
            { bg: '#6f42c1', border: '#5a32a3', icon: '📙' },
            { bg: '#fd7e14', border: '#e8680e', icon: '📓' }
        ];

        // Créer les cartes
        const container = document.getElementById('category-cards');
        if (!container) return;

        if (categoryCount.size === 0) {
            container.innerHTML = `<p class="empty-message">${translate("home.no.category", "Aucune catégorie trouvée")}</p>`;
            return;
        }

        let colorIndex = 0;
        container.innerHTML = Array.from(categoryCount.entries()).map(([catId, count]) => {
            const catName = categoriesMap.get(catId) || catId;
            const percentage = totalBooks > 0 ? ((count / totalBooks) * 100).toFixed(1) : 0;
            const color = colors[colorIndex % colors.length];
            colorIndex++;
            
            return `
                <div class="category-card" style="border-left: 5px solid ${color.border};">
                    <div class="category-icon" style="background: ${color.bg}20; color: ${color.bg};">
                        ${color.icon}
                    </div>
                    <div class="category-info">
                        <h4 class="category-name">${catName}</h4>
                        <p class="category-count">
                            <span class="count-number">${count}</span>
                            <span class="count-label">${count === 1 ? translate("home.book.singular", "livre") : translate("home.book.plural", "livres")}</span>
                        </p>
                        <div class="category-percentage">
                            <div class="percentage-bar">
                                <div class="percentage-fill" style="width: ${percentage}%; background: ${color.bg};"></div>
                            </div>
                            <span class="percentage-text">${percentage}%</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error("Erreur lors du chargement des catégories:", error);
        const container = document.getElementById('category-cards');
        if (container) {
            container.innerHTML = `<p class="empty-message" style="color: #dc3545;">${translate("common.error.loading", "Erreur lors du chargement")}</p>`;
        }
    }
}

// Charger les derniers livres ajoutés
async function loadRecentBooks() {
    try {
        const booksResponse = await fetch(`data/books.xml?v=${Date.now()}`);
        if (!booksResponse.ok) throw new Error("Erreur lors du chargement des livres");
        const booksText = await booksResponse.text();
        const booksParser = new DOMParser();
        const booksDoc = booksParser.parseFromString(booksText, "application/xml");

        const authorsResponse = await fetch(`data/authors.xml?v=${Date.now()}`);
        if (!authorsResponse.ok) throw new Error("Erreur lors du chargement des auteurs");
        const authorsText = await authorsResponse.text();
        const authorsParser = new DOMParser();
        const authorsDoc = authorsParser.parseFromString(authorsText, "application/xml");

        const books = Array.from(booksDoc.getElementsByTagName('livre'));
        
        // Trier par ID (les derniers sont ceux avec les IDs les plus élevés)
        books.sort((a, b) => {
            const idA = parseInt(a.getAttribute('idLivre').replace('L', '')) || 0;
            const idB = parseInt(b.getAttribute('idLivre').replace('L', '')) || 0;
            return idB - idA;
        });

        // Prendre les 6 derniers
        const recentBooks = books.slice(0, 6);

        // Récupérer les noms d'auteurs
        const authorsMap = new Map();
        const authors = authorsDoc.getElementsByTagName('auteur');
        for (let i = 0; i < authors.length; i++) {
            const author = authors[i];
            const authorId = author.getAttribute('id');
            const authorName = author.getElementsByTagName('nom')[0]?.textContent || translate("consultation.unknown.author", "Auteur inconnu");
            authorsMap.set(authorId, authorName);
        }

        // Afficher les livres
        const container = document.getElementById('recent-books');
        if (!container) return;

        if (recentBooks.length === 0) {
            container.innerHTML = `<p class="empty-message">${translate("home.no.books.recent", "Aucun livre récent")}</p>`;
            return;
        }

        container.innerHTML = recentBooks.map(book => {
            const bookId = book.getAttribute('idLivre');
            const title = book.getElementsByTagName('titre')[0]?.textContent || translate("consultation.unknown.title", "Sans titre");
            const description = book.getElementsByTagName('description')[0]?.textContent || '';
            const image = book.getElementsByTagName('image')[0]?.textContent || '';
            const year = book.getElementsByTagName('anneePublication')[0]?.textContent || '';
            
            const authorRefs = book.getElementsByTagName('auteurRef');
            const authorNames = [];
            for (let i = 0; i < authorRefs.length; i++) {
                const authorId = authorRefs[i].getAttribute('id');
                if (authorId === 'INDISPO') {
                    authorNames.push(`<span style="color: #dc3545; font-style: italic;">${translate("books.author.unavailable", "Indisponible")}</span>`);
                } else {
                    const authorName = authorsMap.get(authorId) || 'Auteur inconnu';
                    authorNames.push(authorName);
                }
            }
            const authorsText = authorNames.length > 0 ? authorNames.join(', ') : translate("consultation.unknown.author", "Auteur inconnu");

            const shortDescription = description.length > 120 ? description.substring(0, 120) + '...' : description;

            return `
                <div class="book-card-mini">
                    <div class="book-image-mini">
                        ${image ? `<img src="${image}" alt="${title}" onerror="this.src='images/default-book.jpg'">` : '<div class="no-image">📚</div>'}
                    </div>
                    <div class="book-info-mini">
                        <h4 class="book-title-mini">${title}</h4>
                        <p class="book-author-mini">${authorsText}</p>
                        ${year ? `<p class="book-year-mini">${year}</p>` : ''}
                        <p class="book-description-mini">${shortDescription}</p>
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error("Erreur lors du chargement des derniers livres:", error);
        const container = document.getElementById('recent-books');
        if (container) {
            container.innerHTML = `<p class="empty-message" style="color: #dc3545;">${translate("common.error.loading", "Erreur lors du chargement")}</p>`;
        }
    }
}

// Charger les suggestions de livres populaires
async function loadPopularBooks() {
    try {
        const booksResponse = await fetch(`data/books.xml?v=${Date.now()}`);
        if (!booksResponse.ok) throw new Error("Erreur lors du chargement des livres");
        const booksText = await booksResponse.text();
        const booksParser = new DOMParser();
        const booksDoc = booksParser.parseFromString(booksText, "application/xml");

        const authorsResponse = await fetch(`data/authors.xml?v=${Date.now()}`);
        if (!authorsResponse.ok) throw new Error("Erreur lors du chargement des auteurs");
        const authorsText = await authorsResponse.text();
        const authorsParser = new DOMParser();
        const authorsDoc = authorsParser.parseFromString(authorsText, "application/xml");

        const books = Array.from(booksDoc.getElementsByTagName('livre'));
        
        // Filtrer les livres disponibles et avec auteur disponible
        const availableBooks = books.filter(book => {
            const disponibilite = book.getElementsByTagName('disponibilite')[0]?.textContent === 'true';
            const authorRefs = book.getElementsByTagName('auteurRef');
            let hasAvailableAuthor = false;
            for (let i = 0; i < authorRefs.length; i++) {
                if (authorRefs[i].getAttribute('id') !== 'INDISPO') {
                    hasAvailableAuthor = true;
                    break;
                }
            }
            return disponibilite && hasAvailableAuthor;
        });

        // Mélanger pour varier les suggestions (simulation de popularité)
        const shuffled = availableBooks.sort(() => Math.random() - 0.5);
        const popularBooks = shuffled.slice(0, 6);

        // Récupérer les noms d'auteurs
        const authorsMap = new Map();
        const authors = authorsDoc.getElementsByTagName('auteur');
        for (let i = 0; i < authors.length; i++) {
            const author = authors[i];
            const authorId = author.getAttribute('id');
            const authorName = author.getElementsByTagName('nom')[0]?.textContent || translate("consultation.unknown.author", "Auteur inconnu");
            authorsMap.set(authorId, authorName);
        }

        // Afficher les livres
        const container = document.getElementById('popular-books');
        if (!container) return;

        if (popularBooks.length === 0) {
            container.innerHTML = `<p class="empty-message">${translate("home.no.books", "Aucun livre disponible pour le moment")}</p>`;
            return;
        }

        container.innerHTML = popularBooks.map(book => {
            const bookId = book.getAttribute('idLivre');
            const title = book.getElementsByTagName('titre')[0]?.textContent || translate("consultation.unknown.title", "Sans titre");
            const description = book.getElementsByTagName('description')[0]?.textContent || '';
            const image = book.getElementsByTagName('image')[0]?.textContent || '';
            const year = book.getElementsByTagName('anneePublication')[0]?.textContent || '';
            
            const authorRefs = book.getElementsByTagName('auteurRef');
            const authorNames = [];
            for (let i = 0; i < authorRefs.length; i++) {
                const authorId = authorRefs[i].getAttribute('id');
                if (authorId !== 'INDISPO') {
                    const authorName = authorsMap.get(authorId) || 'Auteur inconnu';
                    authorNames.push(authorName);
                }
            }
            const authorsText = authorNames.length > 0 ? authorNames.join(', ') : translate("consultation.unknown.author", "Auteur inconnu");

            const shortDescription = description.length > 120 ? description.substring(0, 120) + '...' : description;

            return `
                <div class="book-card-mini">
                    <div class="book-image-mini">
                        ${image ? `<img src="${image}" alt="${title}" onerror="this.src='images/default-book.jpg'">` : '<div class="no-image">📚</div>'}
                    </div>
                    <div class="book-info-mini">
                        <h4 class="book-title-mini">${title}</h4>
                        <p class="book-author-mini">${authorsText}</p>
                        ${year ? `<p class="book-year-mini">${year}</p>` : ''}
                        <p class="book-description-mini">${shortDescription}</p>
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error("Erreur lors du chargement des livres populaires:", error);
        const container = document.getElementById('popular-books');
        if (container) {
            container.innerHTML = `<p class="empty-message" style="color: #dc3545;">${translate("common.error.loading", "Erreur lors du chargement")}</p>`;
        }
    }
}

// Exposer la fonction globalement
window.loadHomePage = loadHomePage;

