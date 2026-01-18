const role = "admin";
let xmlData;
let currentEditBook = null;
let currentImageData = null; // Stocke l'image en Base64

async function addLivre(req, res) {
  const { title } = req.body;

  // 1️⃣ Sauvegarde du livre (XML / JSON / DB)
  // ...

  // 2️⃣ Notification (OBSERVER)
  await subject.notify('BOOK_ADDED', {
    title,
    users: ['user1', 'user2', 'user3']
  });

  res.json({ success: true });
}

module.exports = { addLivre };

// Fonction pour sauvegarder le XML sur le serveur
async function saveXMLToFile(filePath, xmlContent) {
    try {
        const response = await fetch('http://localhost:8000/save-xml', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                file: filePath,
                xml: xmlContent
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            return result.success === true;
        } else {
            console.error('Erreur serveur:', response.status, response.statusText);
            return false;
        }
    } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        return false;
    }
}

// Fonction pour créer un auteur dans authors.xml à partir d'un utilisateur
async function createAuthorFromUser(userAuthorId) {
    // userAuthorId est au format "U_3" (U_ + userId)
    const userId = userAuthorId.replace('U_', '');
    
    try {
        const cacheBuster = '?v=' + Date.now();
        // Charger users.xml pour obtenir le username
        const usersResp = await fetch('data/users/users.xml' + cacheBuster);
        if (!usersResp.ok) return false;
        const usersText = await usersResp.text();
        const usersDoc = new DOMParser().parseFromString(usersText, 'application/xml');
        
        const user = Array.from(usersDoc.getElementsByTagName('user')).find(u => 
            u.getElementsByTagName('id')[0]?.textContent === userId
        );
        if (!user) return false;
        
        const username = user.getElementsByTagName('username')[0]?.textContent;
        if (!username) return false;
        
        // Vérifier si l'auteur existe déjà dans authors.xml
        const authorsResp = await fetch('data/authors.xml' + cacheBuster);
        if (!authorsResp.ok) return false;
        const authorsText = await authorsResp.text();
        const authorsDoc = new DOMParser().parseFromString(authorsText, 'application/xml');
        
        // Vérifier si un auteur avec ce nom existe déjà
        const existingAuthors = authorsDoc.getElementsByTagName('auteur');
        for (let i = 0; i < existingAuthors.length; i++) {
            const author = existingAuthors[i];
            const nom = author.getElementsByTagName('nom')[0]?.textContent;
            if (nom === username) {
                // L'auteur existe déjà, pas besoin de créer
                return true;
            }
        }
        
        // Créer le nouvel auteur
        const auteurs = authorsDoc.querySelector('auteurs');
        const allAuthors = authorsDoc.querySelectorAll('auteur');
        let maxId = 0;
        for (let i = 0; i < allAuthors.length; i++) {
            const idAttr = allAuthors[i].getAttribute('id');
            if (idAttr && idAttr.startsWith('A')) {
                const num = parseInt(idAttr.substring(1));
                if (!isNaN(num) && num > maxId) {
                    maxId = num;
                }
            }
        }
        const newId = 'A' + (maxId + 1);
        
        const newAuthor = authorsDoc.createElement('auteur');
        newAuthor.setAttribute('id', newId);
        
        const nomEl = authorsDoc.createElement('nom');
        nomEl.textContent = username;
        const paysEl = authorsDoc.createElement('pays');
        paysEl.textContent = ''; // Pays par défaut vide, à remplir plus tard
        const livresEl = authorsDoc.createElement('livres');
        
        newAuthor.appendChild(nomEl);
        newAuthor.appendChild(paysEl);
        newAuthor.appendChild(livresEl);
        auteurs.appendChild(newAuthor);
        
        // Sauvegarder
        const serializer = new XMLSerializer();
        let updatedXml = serializer.serializeToString(authorsDoc);
        if (!updatedXml.startsWith('<?xml')) {
            updatedXml = '<?xml version="1.0" encoding="UTF-8"?>\n' + updatedXml;
        }
        
        return await saveXMLToFile('data/authors.xml', updatedXml);
    } catch (e) {
        console.error('Erreur lors de la création de l\'auteur depuis l\'utilisateur:', e);
        return false;
    }
}

// Fonction pour obtenir l'ID d'auteur depuis l'ID utilisateur
async function getAuthorIdFromUser(userAuthorId) {
    const userId = userAuthorId.replace('U_', '');
    
    try {
        const cacheBuster = '?v=' + Date.now();
        const usersResp = await fetch('data/users/users.xml' + cacheBuster);
        if (!usersResp.ok) return null;
        const usersText = await usersResp.text();
        const usersDoc = new DOMParser().parseFromString(usersText, 'application/xml');
        
        const user = Array.from(usersDoc.getElementsByTagName('user')).find(u => 
            u.getElementsByTagName('id')[0]?.textContent === userId
        );
        if (!user) return null;
        
        const username = user.getElementsByTagName('username')[0]?.textContent;
        if (!username) return null;
        
        // Chercher l'auteur dans authors.xml par nom
        const authorsResp = await fetch('data/authors.xml' + cacheBuster);
        if (!authorsResp.ok) return null;
        const authorsText = await authorsResp.text();
        const authorsDoc = new DOMParser().parseFromString(authorsText, 'application/xml');
        
        const authors = authorsDoc.getElementsByTagName('auteur');
        for (let i = 0; i < authors.length; i++) {
            const author = authors[i];
            const nom = author.getElementsByTagName('nom')[0]?.textContent;
            if (nom === username) {
                return author.getAttribute('id');
            }
        }
        
        return null;
    } catch (e) {
        console.error('Erreur lors de la recherche de l\'auteur:', e);
        return null;
    }
}

// Fonction pour mettre à jour la liste des livres d'un auteur dans authors.xml
async function updateAuthorBooksList(authorId, bookId, action = 'add') {
    try {
        // Charger authors.xml
        const cacheBuster = '?v=' + Date.now();
        const authorsResp = await fetch('data/authors.xml' + cacheBuster);
        if (!authorsResp.ok) {
            console.warn("Impossible de charger authors.xml pour mettre à jour la liste des livres");
            return false;
        }
        
        const authorsText = await authorsResp.text();
        const authorsDoc = new DOMParser().parseFromString(authorsText, 'application/xml');
        
        // Trouver l'auteur
        const author = authorsDoc.querySelector(`auteur[id="${authorId}"]`);
        if (!author) {
            console.error(`Auteur ${authorId} non trouvé dans authors.xml - impossible de mettre à jour la liste des livres`);
            // Afficher un avertissement à l'utilisateur
            alert(`Attention : L'auteur ${authorId} n'existe pas dans authors.xml. Veuillez d'abord créer cet auteur.`);
            return false;
        }
        
        // Trouver ou créer la section livres
        let livresSection = author.querySelector('livres');
        if (!livresSection) {
            livresSection = authorsDoc.createElement('livres');
            author.appendChild(livresSection);
        }
        
        if (action === 'add') {
            // Vérifier si le livre n'est pas déjà dans la liste
            const existingRef = livresSection.querySelector(`livreref[idLivre="${bookId}"]`);
            if (!existingRef) {
                const livreref = authorsDoc.createElement('livreref');
                livreref.setAttribute('idLivre', bookId);
                livresSection.appendChild(livreref);
            }
        } else if (action === 'remove') {
            // Retirer la référence du livre
            const livreref = livresSection.querySelector(`livreref[idLivre="${bookId}"]`);
            if (livreref) {
                livresSection.removeChild(livreref);
            }
        }
        
        // Convertir en XML string
        const serializer = new XMLSerializer();
        let updatedXml = serializer.serializeToString(authorsDoc);
        
        // Ajouter la déclaration XML si elle n'est pas présente
        if (!updatedXml.startsWith('<?xml')) {
            updatedXml = '<?xml version="1.0" encoding="UTF-8"?>\n' + updatedXml;
        }
        
        // Sauvegarder
        return await saveXMLToFile('data/authors.xml', updatedXml);
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la liste des livres de l\'auteur:', error);
        return false;
    }
}

async function loadXSLT(xml, xslFile, outputId){
    try {
        const xslResp = await fetch(xslFile);
        if (!xslResp.ok) throw new Error(`Failed to load ${xslFile}`);
        const xslText = await xslResp.text();
        const xslDoc = new DOMParser().parseFromString(xslText, 'application/xml');
        
        // Vérifier les erreurs de parsing
        const parserError = xslDoc.querySelector('parsererror');
        if (parserError) {
            console.error("XSL Parsing Error:", parserError.textContent);
            throw new Error("XSL parsing failed");
        }
        
        if(window.XSLTProcessor){
            const xsltProcessor = new XSLTProcessor();
            xsltProcessor.importStylesheet(xslDoc);
            const transformed = xsltProcessor.transformToFragment(xml, document);
            const container = document.getElementById(outputId);
            if (container) {
                container.innerHTML = "";
                container.appendChild(transformed);
                
                // Appliquer les traductions aux nouveaux éléments créés
                if (App && App.applyTranslations) {
                    App.applyTranslations();
                }
                
                // Vérifier si des livres ont été générés
                const booksContainer = container.querySelector('.books-container');
                const bookCards = container.querySelectorAll('.book-card');
                console.log(`Books loaded: ${bookCards.length} books found`);
                
                if (bookCards.length === 0) {
                    console.warn("No books found in the XML or XSL transformation failed");
                }
            } else {
                console.error("Container not found:", outputId);
            }
        } else { 
            console.error("XSLT not supported"); 
        }
    } catch (e) {
        console.error("Error loading XSLT", e);
        const container = document.getElementById(outputId);
        if (container) {
            container.innerHTML = `<p style="color: red; padding: 20px;">${translate("books.load.error", "Erreur lors du chargement")}: ${e.message}</p>`;
        }
    }
}

// Fonction principale pour charger les livres dans le workspace
async function loadBooks() {
    try {
        // console.log("Loading books...");
        const xmlResp = await fetch("data/books.xml?v=" + Date.now());
        if (!xmlResp.ok) throw new Error("Failed to load books.xml");
        const xmlText = await xmlResp.text();
        xmlData = new DOMParser().parseFromString(xmlText, 'application/xml');
        
        // Vérifier les erreurs de parsing XML
        const parserError = xmlData.querySelector('parsererror');
        if (parserError) {
            console.error("XML Parsing Error:", parserError.textContent);
            throw new Error("XML parsing failed");
        }
        
        // Filtrer les livres si l'utilisateur est un auteur
        const currentUser = Auth.currentUser || Auth.checkSession();
        let filteredXmlData = xmlData;
        
        if (currentUser && currentUser.role === 'auteur') {
            // Obtenir l'ID de l'auteur correspondant à cet utilisateur
            const cacheBuster = '?v=' + Date.now();
            let authorId = null;
            const userAuthorId = 'U_' + currentUser.id; // ID utilisateur-auteur (format U_xxx)
            
            // Chercher l'auteur dans authors.xml par username
            try {
                const authorsResp = await fetch('data/authors.xml' + cacheBuster);
                if (authorsResp.ok) {
                    const authorsText = await authorsResp.text();
                    const authorsDoc = new DOMParser().parseFromString(authorsText, 'application/xml');
                    const authors = authorsDoc.getElementsByTagName('auteur');
                    
                    for (let i = 0; i < authors.length; i++) {
                        const author = authors[i];
                        const nom = author.getElementsByTagName('nom')[0]?.textContent;
                        if (nom === currentUser.username) {
                            authorId = author.getAttribute('id');
                            break;
                        }
                    }
                }
            } catch (e) {
                console.warn("Erreur lors de la recherche de l'auteur:", e);
            }
            
            // Toujours filtrer les livres pour un auteur (même si authorId n'est pas trouvé)
            const allLivres = xmlData.getElementsByTagName('livre');
            const filteredLivres = [];
            
            for (let i = 0; i < allLivres.length; i++) {
                const livre = allLivres[i];
                const auteurRefs = livre.getElementsByTagName('auteurRef');
                let belongsToAuthor = false;
                
                for (let j = 0; j < auteurRefs.length; j++) {
                    const auteurRef = auteurRefs[j];
                    const auteurRefId = auteurRef.getAttribute('id');
                    // Vérifier si le livre appartient à l'auteur via authorId (A1, A2, etc.) ou userAuthorId (U_3, etc.)
                    if ((authorId && auteurRefId === authorId) || auteurRefId === userAuthorId) {
                        belongsToAuthor = true;
                        break;
                    }
                }
                
                if (belongsToAuthor) {
                    filteredLivres.push(livre);
                }
            }
            
            // Créer un nouveau document XML avec seulement les livres filtrés
            if (filteredLivres.length > 0) {
                const newXmlDoc = xmlData.cloneNode(true);
                const livresElement = newXmlDoc.getElementsByTagName('livres')[0];
                // Supprimer tous les livres existants
                while (livresElement.firstChild) {
                    livresElement.removeChild(livresElement.firstChild);
                }
                // Ajouter seulement les livres filtrés
                filteredLivres.forEach(livre => {
                    const importedLivre = newXmlDoc.importNode(livre, true);
                    livresElement.appendChild(importedLivre);
                });
                filteredXmlData = newXmlDoc;
                console.log(`Auteur ${currentUser.username} (ID: ${authorId || userAuthorId}): ${filteredLivres.length} livre(s) filtré(s) sur ${allLivres.length} total`);
            } else {
                // Aucun livre trouvé pour cet auteur - créer un document XML vide pour permettre le rendu XSLT
                const newXmlDoc = xmlData.cloneNode(true);
                const livresElement = newXmlDoc.getElementsByTagName('livres')[0];
                // Supprimer tous les livres existants
                if (livresElement) {
                    while (livresElement.firstChild) {
                        livresElement.removeChild(livresElement.firstChild);
                    }
                }
                filteredXmlData = newXmlDoc;
                console.log(`Auteur ${currentUser.username} (ID: ${authorId || userAuthorId}): aucun livre trouvé`);
            }
        }
        
        // Vérifier si des livres existent
        const livres = filteredXmlData.getElementsByTagName('livre');
        console.log(`Found ${livres.length} books in XML`);
        
        // Charger le XSLT même s'il n'y a pas de livres (pour afficher le header avec le bouton)
        await loadXSLT(filteredXmlData, "data/books.xsl?v=" + Date.now(), "workspace");
        
        // Si aucun livre, ajouter un message après le chargement XSLT
        if (livres.length === 0) {
            const workspace = document.getElementById('workspace');
            if (workspace) {
                const booksContainer = workspace.querySelector('.books-container');
                if (booksContainer) {
                    booksContainer.innerHTML = '<p style="color: orange; padding: 20px; text-align: center; width: 100%;">' + translate("books.no.books") + 
                        (currentUser && currentUser.role === 'auteur' 
                            ? 'Vous n\'avez aucun livre dans la bibliothèque.' 
                            : 'Aucun livre trouvé dans le fichier XML.') + 
                        '</p>';
            }
            }
        }
        
        // Ajouter le bouton "Ajouter un livre" si l'utilisateur a la permission (admin ou auteur)
        // Note: currentUser est déjà déclaré plus haut dans la fonction
        // Utiliser setTimeout pour s'assurer que le DOM est complètement rendu
        const addButtonTimeout = setTimeout(() => {
            if (currentUser && Permissions.check(currentUser.role, 'canManageBooks')) {
                const workspace = document.getElementById('workspace');
                if (workspace) {
                    // Chercher d'abord dans workspace, puis dans tout le document
                    let booksHeader = workspace.querySelector('.books-header');
                    if (!booksHeader) {
                        booksHeader = document.querySelector('.books-header');
                    }
                    if (booksHeader) {
                        // Supprimer le bouton existant s'il existe (pour éviter les doublons)
                        const existingButton = booksHeader.querySelector('.btn-add-book');
                        if (existingButton) {
                            existingButton.remove();
                        }
                        // Créer et ajouter le nouveau bouton
                        const addButton = document.createElement('button');
                        addButton.className = 'btn-add-book';
                        addButton.textContent = translate("books.add");
                        addButton.onclick = function() { openAddModal(); };
                        booksHeader.appendChild(addButton);
                    }
                }
            }
        }, 100);
        
        // Charger les auteurs et remplacer les IDs par les noms
        await enrichAuthorNames();
        
        // Charger les catégories et remplacer les IDs par les noms
        await enrichCategories();
        
        // Initialiser les event listeners après le chargement
        setTimeout(() => {
            initializeBookListeners();
            // Appliquer les traductions aux nouveaux éléments créés
            if (App && App.applyTranslations) {
                App.applyTranslations();
            }
        }, 100);
    } catch (e) {
        console.error("Error loading books", e);
        const workspace = document.getElementById('workspace');
        if (workspace) {
            workspace.innerHTML = `<p style="color: red; padding: 20px;">${translate("books.load.error", "Erreur lors du chargement des livres")}: ${e.message}</p>`;
        }
    }
}

// Fonction pour enrichir les noms d'auteurs
async function enrichAuthorNames() {
    try {
        // Charger le fichier authors.xml (avec cache buster)
        const cacheBuster = '?v=' + Date.now();
        const authorsResp = await fetch('data/authors.xml' + cacheBuster);
        if (!authorsResp.ok) {
            console.warn("Could not load authors.xml");
            return;
        }
        const authorsText = await authorsResp.text();
        const authorsDoc = new DOMParser().parseFromString(authorsText, 'application/xml');
        
        // Créer un map des auteurs (ID -> nom)
        const authorsMap = new Map();
        const allAuthors = authorsDoc.getElementsByTagName('auteur');
        for (let i = 0; i < allAuthors.length; i++) {
            const author = allAuthors[i];
            const authorId = author.getAttribute('id');
            const nomEl = author.getElementsByTagName('nom')[0];
            if (authorId && nomEl) {
                authorsMap.set(authorId, nomEl.textContent);
            }
        }
        
        // Remplacer les IDs par les noms dans les cartes de livres
        const authorElements = document.querySelectorAll('.book-author');
        let unavailableCount = 0;
        
        authorElements.forEach(el => {
            const auteurId = el.getAttribute('data-auteur-id');
            const nameSpan = el.querySelector('.auteur-name');
            
            if (auteurId && nameSpan) {
                // Vérifier si c'est un auteur indisponible
                if (auteurId === 'INDISPO') {
                    nameSpan.textContent = translate("books.author.unavailable");
                    nameSpan.style.color = '#dc3545'; // Rouge pour indiquer l'indisponibilité
                    nameSpan.style.fontStyle = 'italic';
                    unavailableCount++;
                } else {
                const authorName = authorsMap.get(auteurId);
                if (authorName) {
                    nameSpan.textContent = authorName;
                        // Réinitialiser le style au cas où il était marqué comme indisponible avant
                        nameSpan.style.color = '';
                        nameSpan.style.fontStyle = '';
                } else {
                        // Auteur supprimé ou introuvable
                        nameSpan.textContent = translate("books.author.unavailable");
                        nameSpan.style.color = '#dc3545'; // Rouge pour indiquer l'indisponibilité
                        nameSpan.style.fontStyle = 'italic';
                        unavailableCount++;
                    }
                }
            }
        });
        
        console.log(`Author names enriched: ${authorsMap.size} authors loaded`);
        if (unavailableCount > 0) {
            console.warn(`${unavailableCount} auteur(s) indisponible(s) (supprimé(s))`);
        }
    } catch (e) {
        console.error("Error enriching author names", e);
    }
}

// Fonction pour enrichir les noms de catégories
async function enrichCategories() {
    try {
        // Charger le fichier categories.xml (avec cache buster)
        const cacheBuster = '?v=' + Date.now();
        const categoriesResp = await fetch('data/categories.xml' + cacheBuster);
        if (!categoriesResp.ok) {
            console.warn("Could not load categories.xml");
            return;
        }
        const categoriesText = await categoriesResp.text();
        const categoriesDoc = new DOMParser().parseFromString(categoriesText, 'application/xml');
        
        // Créer un map des catégories (ID -> libelle)
        const categoriesMap = new Map();
        const allCategories = categoriesDoc.getElementsByTagName('categorie');
        for (let i = 0; i < allCategories.length; i++) {
            const category = allCategories[i];
            const catId = category.getAttribute('id');
            const libelleEl = category.getElementsByTagName('libelle')[0];
            if (catId && libelleEl) {
                categoriesMap.set(catId, libelleEl.textContent);
            }
        }
        
        // Remplacer les IDs par les noms dans les cartes de livres
        const categoryElements = document.querySelectorAll('.categorie-names');
        
        categoryElements.forEach(el => {
            const categoriesData = el.getAttribute('data-categories');
            const loadingSpan = el.querySelector('.categorie-loading');
            
            if (categoriesData && categoriesData.trim() !== '') {
                // Récupérer les IDs de catégories (séparés par des virgules)
                const categoryIds = categoriesData.split(',').filter(id => id.trim() !== '');
                
                if (categoryIds.length > 0) {
                    const categoryNames = [];
                    categoryIds.forEach(catId => {
                        const catName = categoriesMap.get(catId.trim());
                        if (catName) {
                            categoryNames.push(catName);
                        } else {
                            // Si la catégorie n'est pas trouvée, afficher l'ID
                            categoryNames.push(catId.trim());
                        }
                    });
                    
                    if (categoryNames.length > 0) {
                        // Remplacer le contenu en cachant le span de chargement
                        if (loadingSpan) {
                            loadingSpan.style.display = 'none';
                        }
                        el.innerHTML = categoryNames.join(', ');
                    } else {
                        if (loadingSpan) {
                            loadingSpan.style.display = 'none';
                        }
                        el.textContent = translate("books.details.not.specified");
                    }
                } else {
                    if (loadingSpan) {
                        loadingSpan.style.display = 'none';
                    }
                    el.textContent = translate("books.details.not.specified");
                }
            } else {
                // Pas de catégories
                if (loadingSpan) {
                    loadingSpan.style.display = 'none';
                }
                el.textContent = translate("books.details.not.specified");
            }
        });
        
        console.log(`Categories enriched: ${categoriesMap.size} categories loaded`);
    } catch (e) {
        console.error("Error enriching categories", e);
    }
}

// Initialiser les event listeners pour les formulaires et boutons
function initializeBookListeners() {
    // Event listener pour le formulaire d'édition (s'il existe)
    const editForm = document.getElementById('edit-form');
    if (editForm && !editForm.hasAttribute('data-initialized')) {
        editForm.setAttribute('data-initialized', 'true');
        editForm.addEventListener('submit', async function(e){
            e.preventDefault();
            const titre = document.getElementById('edit-titre')?.value;
            const auteur = document.getElementById('edit-auteur')?.value;
            const desc = document.getElementById('edit-desc')?.value;
            const img = currentImageData;
            const annee = document.getElementById('edit-annee')?.value || new Date().getFullYear().toString();
            const isbn = document.getElementById('edit-isbn')?.value || '';
            const disponibilite = document.getElementById('edit-disponibilite')?.value || 'true';
            const categoriesSelect = document.getElementById('edit-categories');
            const selectedCategories = Array.from(categoriesSelect?.selectedOptions || []).map(opt => opt.value).filter(v => v);

            if(currentEditBook){ // Modifier
                const livre = Array.from(xmlData.getElementsByTagName('livre'))
                    .find(l => l.getElementsByTagName('titre')[0]?.textContent === currentEditBook);
                if (livre) {
                    const bookId = livre.getAttribute('idLivre');
                    const oldAuthorRef = livre.getElementsByTagName('authors')[0]?.getElementsByTagName('auteurRef')[0];
                    const oldAuthorId = oldAuthorRef ? oldAuthorRef.getAttribute('id') : null;
                    
                    if (livre.getElementsByTagName('titre')[0]) livre.getElementsByTagName('titre')[0].textContent = titre;
                    
                    // Gérer l'auteur - créer la section authors si elle n'existe pas
                    let authorsSection = livre.querySelector('authors');
                    if (!authorsSection) {
                        authorsSection = xmlData.createElement('authors');
                        livre.appendChild(authorsSection);
                    }
                    
                    // Trouver ou créer le premier auteurRef
                    let auteurRef = authorsSection.querySelector('auteurRef');
                    if (!auteurRef) {
                        auteurRef = xmlData.createElement('auteurRef');
                        authorsSection.appendChild(auteurRef);
                    }
                    auteurRef.setAttribute('id', auteur);
                    
                    if (livre.getElementsByTagName('description')[0]) livre.getElementsByTagName('description')[0].textContent = desc;
                    if (livre.getElementsByTagName('image')[0]) livre.getElementsByTagName('image')[0].textContent = img;
                    
                    // Mettre à jour l'année de publication
                    if (livre.getElementsByTagName('anneePublication')[0]) {
                        livre.getElementsByTagName('anneePublication')[0].textContent = annee;
                    } else {
                        const anneeEl = xmlData.createElement('anneePublication');
                        anneeEl.textContent = annee;
                        livre.appendChild(anneeEl);
                    }
                    
                    // Mettre à jour l'ISBN
                    if (livre.getElementsByTagName('isbn')[0]) {
                        livre.getElementsByTagName('isbn')[0].textContent = isbn;
                    } else {
                        const isbnEl = xmlData.createElement('isbn');
                        isbnEl.textContent = isbn;
                        livre.appendChild(isbnEl);
                    }
                    
                    // Mettre à jour la disponibilité
                    if (livre.getElementsByTagName('disponibilite')[0]) {
                        livre.getElementsByTagName('disponibilite')[0].textContent = disponibilite;
                    } else {
                        const dispoEl = xmlData.createElement('disponibilite');
                        dispoEl.textContent = disponibilite;
                        livre.appendChild(dispoEl);
                    }
                    
                    // Gérer les catégories
                    let categoriesSection = livre.querySelector('categories');
                    if (!categoriesSection) {
                        categoriesSection = xmlData.createElement('categories');
                        livre.appendChild(categoriesSection);
                    }
                    // Supprimer toutes les catégories existantes
                    while (categoriesSection.firstChild) {
                        categoriesSection.removeChild(categoriesSection.firstChild);
                    }
                    // Ajouter les nouvelles catégories sélectionnées
                    selectedCategories.forEach(catId => {
                        const categorieRef = xmlData.createElement('categorieRef');
                        categorieRef.setAttribute('id', catId);
                        categoriesSection.appendChild(categorieRef);
                    });
                    
                    // Mettre à jour la liste des livres de l'auteur dans authors.xml
                    if (bookId && auteur) {
                        // Si c'est un utilisateur auteur (U_xxx), convertir en ID d'auteur
                        let finalAuthorId = auteur;
                        let finalOldAuthorId = oldAuthorId;
                        
                        if (auteur.startsWith('U_')) {
                            await createAuthorFromUser(auteur);
                            const authorId = await getAuthorIdFromUser(auteur);
                            if (authorId) finalAuthorId = authorId;
                        }
                        if (oldAuthorId && oldAuthorId.startsWith('U_')) {
                            const authorId = await getAuthorIdFromUser(oldAuthorId);
                            if (authorId) finalOldAuthorId = authorId;
                        }
                        
                        // Mettre à jour l'auteurRef dans le livre avec l'ID final
                        const auteurRef = livre.querySelector('authors auteurRef');
                        if (auteurRef) {
                            auteurRef.setAttribute('id', finalAuthorId);
                        }
                        
                        // Si l'auteur a changé, retirer de l'ancien auteur et ajouter au nouveau
                        if (finalOldAuthorId && finalOldAuthorId !== finalAuthorId) {
                            if (!finalOldAuthorId.startsWith('U_')) {
                                await updateAuthorBooksList(finalOldAuthorId, bookId, 'remove');
                            }
                        }
                        // Ajouter au nouvel auteur (ou mettre à jour si c'est le même)
                        if (finalAuthorId && !finalAuthorId.startsWith('U_')) {
                            await updateAuthorBooksList(finalAuthorId, bookId, 'add');
                        }
                    }
                }
            } else { // Ajouter
                const newLivre = xmlData.createElement('livre');
                // Générer un ID unique pour le nouveau livre
                const allLivres = xmlData.getElementsByTagName('livre');
                // Trouver le plus grand ID existant
                let maxId = 0;
                for (let i = 0; i < allLivres.length; i++) {
                    const idAttr = allLivres[i].getAttribute('idLivre');
                    if (idAttr && idAttr.startsWith('L')) {
                        const num = parseInt(idAttr.substring(1));
                        if (!isNaN(num) && num > maxId) {
                            maxId = num;
                        }
                    }
                }
                const newId = 'L' + (maxId + 1);
                newLivre.setAttribute('idLivre', newId);
                
                // Si c'est un utilisateur auteur (U_xxx), convertir en ID d'auteur (A1, A2, etc.)
                let finalAuthorId = auteur;
                if (auteur.startsWith('U_')) {
                    // Créer l'auteur dans authors.xml d'abord
                    await createAuthorFromUser(auteur);
                    // Obtenir l'ID d'auteur créé
                    const authorId = await getAuthorIdFromUser(auteur);
                    if (authorId) {
                        finalAuthorId = authorId;
                    } else {
                        console.warn(`Impossible de créer l'auteur depuis l'utilisateur ${auteur}, utilisation de l'ID original`);
                    }
                }
                
                const t = xmlData.createElement('titre'); t.textContent = titre;
                const a = xmlData.createElement('authors'); 
                const au = xmlData.createElement('auteurRef'); au.setAttribute('id', finalAuthorId); a.appendChild(au);
                const d = xmlData.createElement('description'); d.textContent = desc;
                const im = xmlData.createElement('image'); im.textContent = img;
                const an = xmlData.createElement('anneePublication'); an.textContent = annee;
                const dispo = xmlData.createElement('disponibilite'); dispo.textContent = disponibilite;
                const isbnEl = xmlData.createElement('isbn'); isbnEl.textContent = isbn;
                const cat = xmlData.createElement('categories');
                // Ajouter les catégories sélectionnées
                selectedCategories.forEach(catId => {
                    const categorieRef = xmlData.createElement('categorieRef');
                    categorieRef.setAttribute('id', catId);
                    cat.appendChild(categorieRef);
                });
                
                newLivre.appendChild(t);
                newLivre.appendChild(an);
                newLivre.appendChild(d);
                newLivre.appendChild(im);
                newLivre.appendChild(isbnEl);
                newLivre.appendChild(dispo);
                newLivre.appendChild(a);
                newLivre.appendChild(cat);
                xmlData.documentElement.appendChild(newLivre);
                
                // Mettre à jour la liste des livres de l'auteur
                // Utiliser finalAuthorId qui est déjà l'ID d'auteur (A1, A2, etc.)
                if (finalAuthorId && newId && !finalAuthorId.startsWith('U_')) {
                    await updateAuthorBooksList(finalAuthorId, newId, 'add');
                }
            }

            // Convertir en XML string avec formatage
            const serializer = new XMLSerializer();
            let updatedXml = serializer.serializeToString(xmlData);
            
            // Ajouter la déclaration XML si elle n'est pas présente
            if (!updatedXml.startsWith('<?xml')) {
                updatedXml = '<?xml version="1.0" encoding="UTF-8"?>\n' + updatedXml;
            }
            
            // Sauvegarder sur le serveur
            const saved = await saveXMLToFile('data/books.xml', updatedXml);
            
            // Envoyer une notification via le pattern Observer (même si saved est false, l'action a été faite)
            try {
                if (window.NotificationCenter) {
                    const eventType = currentEditBook ? 'BOOK_MODIFIED' : 'BOOK_ADDED';
                    console.log('Envoi notification:', eventType, titre);
                    await window.NotificationCenter.notify({
                        eventType: eventType,
                        data: { title: titre }
                    });
                    console.log('Notification envoyée avec succès');
                } else {
                    console.error('NotificationCenter n\'est pas disponible');
                }
            } catch (error) {
                console.error('Erreur lors de l\'envoi de la notification:', error);
            }
            
            if (saved) {
                alert(currentEditBook ? translate("books.edit.success") : translate("books.save.success"));
            } else {
                alert((currentEditBook ? translate("books.edit.success") : translate("books.save.success")) + " " + translate("books.server.unavailable"));
            }

            currentEditBook = null;
            closeEditModal();

            // Recharger la liste avec cache buster pour voir les modifications
            await loadBooks();
        });
    }
    
    // Event listener pour le fichier image (s'il existe)
    const editImgFile = document.getElementById('edit-img-file');
    if (editImgFile && !editImgFile.hasAttribute('data-initialized')) {
        editImgFile.setAttribute('data-initialized', 'true');
        editImgFile.addEventListener('change', function(e){
            const file = e.target.files[0];
            if(file){
                const reader = new FileReader();
                reader.onload = function(evt){ currentImageData = evt.target.result; }
                reader.readAsDataURL(file); // Convertit en Base64
            }
        });
    }
}

async function showDetails(title, img, desc) {
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
    
    // Charger les métadonnées si les éléments existent
    if (detailAuthor || detailYear || detailCategory) {
        await loadBookMetadata(title, detailAuthor, detailYear, detailCategory);
    }
    
    detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Fonction pour charger les métadonnées du livre (auteur, année, catégorie)
async function loadBookMetadata(title, detailAuthorEl, detailYearEl, detailCategoryEl) {
    try {
        // Charger les livres
        const booksResponse = await fetch(`data/books.xml?v=${Date.now()}`);
        if (!booksResponse.ok) return;
        const booksText = await booksResponse.text();
        const booksParser = new DOMParser();
        const booksDoc = booksParser.parseFromString(booksText, "application/xml");
        
        // Trouver le livre par titre
        const books = booksDoc.getElementsByTagName('livre');
        for (let i = 0; i < books.length; i++) {
            const book = books[i];
            const bookTitle = book.getElementsByTagName('titre')[0]?.textContent || '';
            if (bookTitle === title) {
                // Récupérer l'année
                const year = book.getElementsByTagName('anneePublication')[0]?.textContent || '';
                if (detailYearEl) detailYearEl.innerText = year || translate("books.details.not.specified");
                
                // Récupérer l'auteur
                if (detailAuthorEl) {
                    const authorRefs = book.getElementsByTagName('auteurRef');
                    const authorNames = [];
                    for (let j = 0; j < authorRefs.length; j++) {
                        const authorId = authorRefs[j].getAttribute('id');
                        if (authorId === 'INDISPO') {
                            authorNames.push(`<span style="color: #dc3545; font-style: italic;">${translate("books.author.unavailable")}</span>`);
                        } else {
                            // Charger le nom de l'auteur
                            try {
                                const authorsResponse = await fetch(`data/authors.xml?v=${Date.now()}`);
                                if (authorsResponse.ok) {
                                    const authorsText = await authorsResponse.text();
                                    const authorsParser = new DOMParser();
                                    const authorsDoc = authorsParser.parseFromString(authorsText, "application/xml");
                                    const author = authorsDoc.querySelector(`auteur[id="${authorId}"]`);
                                    if (author) {
                                        const authorName = author.getElementsByTagName('nom')[0]?.textContent || translate("consultation.unknown.author");
                                        authorNames.push(authorName);
                                    }
                                }
                            } catch (e) {
                                console.warn("Erreur lors du chargement de l'auteur:", e);
                            }
                        }
                    }
                    detailAuthorEl.innerHTML = authorNames.length > 0 ? authorNames.join(', ') : 'Non spécifié';
                }
                
                // Récupérer les catégories
                if (detailCategoryEl) {
                    const categoryRefs = book.getElementsByTagName('categorieRef');
                    const categoryNames = [];
                    for (let j = 0; j < categoryRefs.length; j++) {
                        const catId = categoryRefs[j].getAttribute('id');
                        // Charger le nom de la catégorie
                        try {
                            const categoriesResponse = await fetch(`data/categories.xml?v=${Date.now()}`);
                            if (categoriesResponse.ok) {
                                const categoriesText = await categoriesResponse.text();
                                const categoriesParser = new DOMParser();
                                const categoriesDoc = categoriesParser.parseFromString(categoriesText, "application/xml");
                                const category = categoriesDoc.querySelector(`categorie[id="${catId}"]`);
                                if (category) {
                                    const catName = category.getElementsByTagName('libelle')[0]?.textContent || catId;
                                    categoryNames.push(catName);
                                }
                            }
                        } catch (e) {
                            console.warn("Erreur lors du chargement de la catégorie:", e);
                            categoryNames.push(catId);
                        }
                    }
                    detailCategoryEl.innerText = categoryNames.length > 0 ? categoryNames.join(', ') : translate("books.details.not.specified");
                }
                break;
            }
        }
    } catch (e) {
        console.error("Erreur lors du chargement des métadonnées:", e);
    }
}


function closeDetails() { 
    // Chercher par ID d'abord
    let detail = document.getElementById('book-details');
    // Si non trouvé, chercher par classe (pour la page de consultation)
    if (!detail) {
        detail = document.querySelector('.book-details-modal');
    }
    if (detail) {
        detail.classList.remove('show');
        detail.style.display = 'none';
    }
}

// Fonction pour télécharger un livre en PDF
async function downloadBookPDF(titre, imageUrl, description, auteurId) {
    try {
        // Vérifier si jsPDF est disponible
        if (typeof window.jspdf === 'undefined') {
            alert(translate("books.pdf.error"));
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Récupérer le nom de l'auteur
        let auteurName = translate("consultation.unknown.author");
        if (auteurId && auteurId !== 'INDISPO') {
            try {
                const cacheBuster = '?v=' + Date.now();
                const authorsResp = await fetch('data/authors.xml' + cacheBuster);
                if (authorsResp.ok) {
                    const authorsText = await authorsResp.text();
                    const authorsDoc = new DOMParser().parseFromString(authorsText, 'application/xml');
                    const author = authorsDoc.querySelector(`auteur[id="${auteurId}"]`);
                    if (author) {
                        const nomEl = author.querySelector('nom');
                        if (nomEl) {
                            auteurName = nomEl.textContent;
                        }
                    }
                }
            } catch (e) {
                console.warn("Impossible de charger le nom de l'auteur", e);
            }
        } else if (auteurId === 'INDISPO') {
            auteurName = translate("books.author.unavailable");
        }

        // Configuration du PDF
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 20;
        const maxWidth = pageWidth - (margin * 2);
        let yPosition = margin;

        // Titre du livre
        doc.setFontSize(20);
        doc.setFont(undefined, 'bold');
        doc.text(titre, margin, yPosition, { maxWidth });
        yPosition += 15;

        // Auteur
        doc.setFontSize(14);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(`Auteur: ${auteurName}`, margin, yPosition, { maxWidth });
        yPosition += 20;

        // Image du livre
        if (imageUrl && !imageUrl.startsWith('data:image/svg')) {
            try {
                // Charger l'image
                const img = new Image();
                img.crossOrigin = 'anonymous';
                
                await new Promise((resolve) => {
                    const timeout = setTimeout(() => {
                        console.warn("Timeout lors du chargement de l'image");
                        resolve(); // Continuer sans l'image
                    }, 5000);
                    
                    img.onload = () => {
                        clearTimeout(timeout);
                        try {
                            // Convertir l'image en base64
                            const canvas = document.createElement('canvas');
                            const ctx = canvas.getContext('2d');
                            
                            // Limiter la taille de l'image pour le PDF
                            const maxImgWidth = 400;
                            const maxImgHeight = 300;
                            let imgWidth = img.width;
                            let imgHeight = img.height;
                            
                            if (imgWidth > maxImgWidth || imgHeight > maxImgHeight) {
                                const ratio = Math.min(maxImgWidth / imgWidth, maxImgHeight / imgHeight);
                                imgWidth = imgWidth * ratio;
                                imgHeight = imgHeight * ratio;
                            }
                            
                            canvas.width = imgWidth;
                            canvas.height = imgHeight;
                            ctx.drawImage(img, 0, 0, imgWidth, imgHeight);
                            const imgData = canvas.toDataURL('image/jpeg', 0.8);
                            
                            // Dimensions de l'image dans le PDF (en mm)
                            const pdfImgWidth = Math.min(80, maxWidth);
                            const pdfImgHeight = (imgHeight / imgWidth) * pdfImgWidth;
                            
                            // Vérifier si on a besoin d'une nouvelle page
                            if (yPosition + pdfImgHeight > doc.internal.pageSize.getHeight() - margin - 20) {
                                doc.addPage();
                                yPosition = margin;
                            }
                            
                            doc.addImage(imgData, 'JPEG', margin, yPosition, pdfImgWidth, pdfImgHeight);
                            yPosition += pdfImgHeight + 10;
                            resolve();
                        } catch (e) {
                            console.warn("Erreur lors de l'ajout de l'image", e);
                            resolve(); // Continuer sans l'image
                        }
                    };
                    img.onerror = () => {
                        clearTimeout(timeout);
                        console.warn("Impossible de charger l'image:", imageUrl);
                        resolve(); // Continuer sans l'image
                    };
                    img.src = imageUrl;
                });
            } catch (e) {
                console.warn("Erreur lors du traitement de l'image", e);
            }
        }

        // Description
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, 'normal');
        
        // Diviser la description en lignes pour qu'elle tienne dans la page
        const descriptionLines = doc.splitTextToSize(description || 'Aucune description disponible.', maxWidth);
        
        // Vérifier si on a besoin d'une nouvelle page
        const lineHeight = 7;
        if (yPosition + (descriptionLines.length * lineHeight) > doc.internal.pageSize.getHeight() - margin) {
            doc.addPage();
            yPosition = margin;
        }
        
        doc.text(descriptionLines, margin, yPosition, { maxWidth });
        
        // Footer
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(10);
            doc.setTextColor(150, 150, 150);
            doc.text(
                `Page ${i} sur ${pageCount} - Bibliothèque Numérique`,
                pageWidth / 2,
                doc.internal.pageSize.getHeight() - 10,
                { align: 'center' }
            );
        }

        // Télécharger le PDF
        const fileName = titre.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.pdf';
        doc.save(fileName);
        
        // Enregistrer dans l'historique de téléchargements si la fonction existe
        if (typeof saveDownloadToHistory === 'function') {
            saveDownloadToHistory(titre);
        }
        
    } catch (error) {
        console.error("Erreur lors de la génération du PDF", error);
            alert(translate("books.pdf.generate.error"));
    }
}

async function openEditModal(titre="", auteur="", desc="", img="", annee="", isbn="", categories="", disponibilite=""){
    currentEditBook = titre;
    const modalTitle = document.getElementById('edit-modal-title');
    const editTitre = document.getElementById('edit-titre');
    const editAuteur = document.getElementById('edit-auteur');
    const editDesc = document.getElementById('edit-desc');
    const editImgFile = document.getElementById('edit-img-file');
    const editAnnee = document.getElementById('edit-annee');
    const editIsbn = document.getElementById('edit-isbn');
    const editCategories = document.getElementById('edit-categories');
    const editDisponibilite = document.getElementById('edit-disponibilite');
    const modal = document.getElementById('edit-modal');
    const auteurLoading = document.getElementById('auteur-loading');
    
    // Si on est en mode édition, charger les valeurs depuis xmlData
    if (titre && xmlData) {
        const livre = Array.from(xmlData.getElementsByTagName('livre'))
            .find(l => l.getElementsByTagName('titre')[0]?.textContent === titre);
        if (livre) {
            // Charger les valeurs depuis le XML si elles ne sont pas passées en paramètre
            if (!auteur) {
                const auteurRef = livre.getElementsByTagName('auteurRef')[0];
                if (auteurRef) auteur = auteurRef.getAttribute('id');
            }
            if (!desc) {
                const descEl = livre.getElementsByTagName('description')[0];
                if (descEl) desc = descEl.textContent;
            }
            if (!img) {
                const imgEl = livre.getElementsByTagName('image')[0];
                if (imgEl) img = imgEl.textContent;
            }
            if (!annee) {
                const anneeEl = livre.getElementsByTagName('anneePublication')[0];
                if (anneeEl) annee = anneeEl.textContent;
            }
            if (!isbn) {
                const isbnEl = livre.getElementsByTagName('isbn')[0];
                if (isbnEl) isbn = isbnEl.textContent;
            }
            if (!disponibilite) {
                const dispoEl = livre.getElementsByTagName('disponibilite')[0];
                if (dispoEl) disponibilite = dispoEl.textContent;
            }
            if (!categories) {
                const categoriesEls = livre.getElementsByTagName('categorieRef');
                const catIds = [];
                for (let i = 0; i < categoriesEls.length; i++) {
                    const catId = categoriesEls[i].getAttribute('id');
                    if (catId) catIds.push(catId);
                }
                categories = catIds.join(',');
            }
        }
    }
    
    if (modalTitle) modalTitle.innerText = titre ? translate("books.edit.title") : translate("books.add.title");
    if (editTitre) editTitre.value = titre;
    if (editDesc) editDesc.value = desc;
    if (editAnnee) editAnnee.value = annee || new Date().getFullYear().toString();
    if (editIsbn) editIsbn.value = isbn || '';
    if (editDisponibilite) editDisponibilite.value = disponibilite || 'true';
    currentImageData = img;
    if (editImgFile) editImgFile.value = "";
    
    // Charger les auteurs et remplir le select
    if (editAuteur) {
        editAuteur.innerHTML = `<option value="">${translate("books.author.select")}</option>`;
        if (auteurLoading) auteurLoading.style.display = 'block';
        
        try {
            const cacheBuster = '?v=' + Date.now();
            const authorsMap = new Map(); // ID -> Nom
            
            // 1. Charger les auteurs depuis authors.xml
            const authorsResp = await fetch('data/authors.xml' + cacheBuster);
            if (authorsResp.ok) {
                const authorsText = await authorsResp.text();
                const authorsDoc = new DOMParser().parseFromString(authorsText, 'application/xml');
                const allAuthors = authorsDoc.getElementsByTagName('auteur');
                
                for (let i = 0; i < allAuthors.length; i++) {
                    const author = allAuthors[i];
                    const authorId = author.getAttribute('id');
                    const nomEl = author.getElementsByTagName('nom')[0];
                    if (authorId && nomEl) {
                        authorsMap.set(authorId, nomEl.textContent);
                    }
                }
            }
            
            // 2. Charger les utilisateurs avec le rôle "auteur" depuis users.xml
            try {
                const usersResp = await fetch('data/users/users.xml' + cacheBuster);
                if (usersResp.ok) {
                    const usersText = await usersResp.text();
                    const usersDoc = new DOMParser().parseFromString(usersText, 'application/xml');
                    const users = usersDoc.getElementsByTagName('user');
                    
                    for (let i = 0; i < users.length; i++) {
                        const user = users[i];
                        const role = user.getElementsByTagName('role')[0]?.textContent;
                        if (role === 'auteur') {
                            const username = user.getElementsByTagName('username')[0]?.textContent;
                            if (username) {
                                // Créer un ID temporaire pour les utilisateurs auteur (par exemple, préfixe "U_")
                                const userId = user.getElementsByTagName('id')[0]?.textContent;
                                const userAuthorId = 'U_' + userId; // Préfixe pour distinguer des IDs d'auteurs
                                authorsMap.set(userAuthorId, username);
                            }
                        }
                    }
                }
            } catch (e) {
                console.warn("Erreur lors du chargement des utilisateurs auteurs:", e);
            }
            
            // 3. Remplir le select avec tous les auteurs
            const sortedEntries = Array.from(authorsMap.entries()).sort((a, b) => a[1].localeCompare(b[1]));
            sortedEntries.forEach(([authorId, authorName]) => {
                const option = document.createElement('option');
                option.value = authorId;
                option.textContent = authorName;
                        editAuteur.appendChild(option);
            });
                
                // Sélectionner l'auteur actuel si on est en mode modification
                if (auteur) {
                    editAuteur.value = auteur;
            } else if (!titre) {
                // Si c'est un ajout (pas de titre), vérifier si l'utilisateur est un auteur
                // et pré-sélectionner automatiquement son ID
                const currentUser = Auth.currentUser || Auth.checkSession();
                if (currentUser && currentUser.role === 'auteur') {
                    // Chercher d'abord par ID utilisateur (U_xxx)
                    const userAuthorId = 'U_' + currentUser.id;
                    if (authorsMap.has(userAuthorId)) {
                        editAuteur.value = userAuthorId;
                    } else {
                        // Sinon, chercher par username dans authors.xml
                        // (cela a déjà été fait dans la map, mais cherchons l'ID auteur correspondant)
                        const authorId = await getAuthorIdFromUser(userAuthorId);
                        if (authorId && authorsMap.has(authorId)) {
                            editAuteur.value = authorId;
                        } else {
                            // Si l'auteur n'existe pas encore, sélectionner l'ID utilisateur quand même
                            // Il sera créé automatiquement lors de la sauvegarde
                            editAuteur.value = userAuthorId;
                        }
                    }
                }
            }
        } catch (e) {
            console.error("Error loading authors", e);
        } finally {
            if (auteurLoading) auteurLoading.style.display = 'none';
        }
    }
    
    // Charger les catégories et remplir le select
    if (editCategories) {
        try {
            const cacheBuster = '?v=' + Date.now();
            const categoriesResp = await fetch('data/categories.xml' + cacheBuster);
            if (categoriesResp.ok) {
                const categoriesText = await categoriesResp.text();
                const categoriesDoc = new DOMParser().parseFromString(categoriesText, 'application/xml');
                const allCategories = categoriesDoc.getElementsByTagName('categorie');
                
                editCategories.innerHTML = '';
                
                for (let i = 0; i < allCategories.length; i++) {
                    const category = allCategories[i];
                    const catId = category.getAttribute('id');
                    const libelleEl = category.getElementsByTagName('libelle')[0];
                    if (catId && libelleEl) {
                        const option = document.createElement('option');
                        option.value = catId;
                        option.textContent = libelleEl.textContent;
                        editCategories.appendChild(option);
                    }
                }
                
                // Sélectionner les catégories si on est en mode modification
                if (categories) {
                    const categoryIds = categories.split(',').map(id => id.trim()).filter(id => id);
                    for (let i = 0; i < editCategories.options.length; i++) {
                        if (categoryIds.includes(editCategories.options[i].value)) {
                            editCategories.options[i].selected = true;
                        }
                    }
                }
            }
        } catch (e) {
            console.error("Error loading categories", e);
        }
    }
    
    if (modal) {
        modal.style.display = 'block';
        // Fermer la modal en cliquant sur l'overlay
        modal.onclick = function(e) {
            if (e.target === modal) {
                closeEditModal();
            }
        };
    }
}
function closeEditModal(){ 
    const modal = document.getElementById('edit-modal');
    if (modal) modal.style.display = 'none'; 
}
function openAddModal(){ openEditModal(); }

// Supprimer avec confirmation
function deleteBookConfirm(titre){
    const confirmMsg = translate("books.delete.confirm", `Êtes-vous sûr de vouloir supprimer "${titre}" ?`).replace("{title}", titre);
    if(confirm(confirmMsg)){
        deleteBook(titre);
    }
}

async function deleteBook(titre){
    if (!xmlData) return;
    const livres = Array.from(xmlData.getElementsByTagName('livre'));
    const livre = livres.find(l => l.getElementsByTagName('titre')[0]?.textContent === titre);
    if(livre){
        const bookId = livre.getAttribute('idLivre');
        const authorRef = livre.getElementsByTagName('authors')[0]?.getElementsByTagName('auteurRef')[0];
        const authorId = authorRef ? authorRef.getAttribute('id') : null;
        
        xmlData.documentElement.removeChild(livre);
        
        // Retirer le livre de la liste de l'auteur
        if (bookId && authorId) {
            await updateAuthorBooksList(authorId, bookId, 'remove');
        }
        
        // Convertir en XML string avec formatage
        const serializer = new XMLSerializer();
        let updatedXml = serializer.serializeToString(xmlData);
        
        // Ajouter la déclaration XML si elle n'est pas présente
        if (!updatedXml.startsWith('<?xml')) {
            updatedXml = '<?xml version="1.0" encoding="UTF-8"?>\n' + updatedXml;
        }
        
        // Sauvegarder sur le serveur
        const saved = await saveXMLToFile('data/books.xml', updatedXml);
        
        // Envoyer une notification via le pattern Observer (même si saved est false)
        try {
            if (window.NotificationCenter) {
                console.log('Envoi notification BOOK_DELETED:', titre);
                await window.NotificationCenter.notify({
                    eventType: 'BOOK_DELETED',
                    data: { title: titre }
                });
                console.log('Notification envoyée avec succès');
            } else {
                console.error('NotificationCenter n\'est pas disponible');
            }
        } catch (error) {
            console.error('Erreur lors de l\'envoi de la notification:', error);
        }
        
        if (saved) {
            alert(translate("books.delete.success"));
        } else {
            alert(translate("books.delete.success") + " " + translate("books.server.unavailable"));
        }
        
        // Recharger la liste avec cache buster pour voir les modifications
        await loadBooks();
    }
}
