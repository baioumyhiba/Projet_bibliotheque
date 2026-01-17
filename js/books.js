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
            container.innerHTML = `<p style="color: red; padding: 20px;">Erreur lors du chargement: ${e.message}</p>`;
        }
    }
}

// Fonction principale pour charger les livres dans le workspace
async function loadBooks() {
    try {
        console.log("Loading books...");
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
        
        // Vérifier si des livres existent
        const livres = xmlData.getElementsByTagName('livre');
        console.log(`Found ${livres.length} books in XML`);
        
        if (livres.length === 0) {
            const workspace = document.getElementById('workspace');
            if (workspace) {
                workspace.innerHTML = '<p style="color: orange; padding: 20px;">Aucun livre trouvé dans le fichier XML.</p>';
            }
            return;
        }
        
        await loadXSLT(xmlData, "data/books.xsl?v=" + Date.now(), "workspace");
        
        // Charger les auteurs et remplacer les IDs par les noms
        await enrichAuthorNames();
        
        // Charger les catégories et remplacer les IDs par les noms
        await enrichCategories();
        
        // Initialiser les event listeners après le chargement
        setTimeout(() => {
            initializeBookListeners();
        }, 100);
    } catch (e) {
        console.error("Error loading books", e);
        const workspace = document.getElementById('workspace');
        if (workspace) {
            workspace.innerHTML = `<p style="color: red; padding: 20px;">Erreur lors du chargement des livres: ${e.message}</p>`;
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
                    nameSpan.textContent = 'Indisponible';
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
                        nameSpan.textContent = 'Indisponible';
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
                        el.textContent = 'Non spécifiée';
                    }
                } else {
                    if (loadingSpan) {
                        loadingSpan.style.display = 'none';
                    }
                    el.textContent = 'Non spécifiée';
                }
            } else {
                // Pas de catégories
                if (loadingSpan) {
                    loadingSpan.style.display = 'none';
                }
                el.textContent = 'Non spécifiée';
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
                    
                    // Mettre à jour la liste des livres de l'auteur dans authors.xml
                    if (bookId && auteur) {
                        // Si l'auteur a changé, retirer de l'ancien auteur et ajouter au nouveau
                        if (oldAuthorId && oldAuthorId !== auteur) {
                            await updateAuthorBooksList(oldAuthorId, bookId, 'remove');
                        }
                        // Ajouter au nouvel auteur (ou mettre à jour si c'est le même)
                        await updateAuthorBooksList(auteur, bookId, 'add');
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
                
                const t = xmlData.createElement('titre'); t.textContent = titre;
                const a = xmlData.createElement('authors'); 
                const au = xmlData.createElement('auteurRef'); au.setAttribute('id', auteur); a.appendChild(au);
                const d = xmlData.createElement('description'); d.textContent = desc;
                const im = xmlData.createElement('image'); im.textContent = img;
                const an = xmlData.createElement('anneePublication'); an.textContent = new Date().getFullYear();
                const dispo = xmlData.createElement('disponibilite'); dispo.textContent='true';
                const isbn = xmlData.createElement('isbn'); isbn.textContent = '';
                const cat = xmlData.createElement('categories');
                
                newLivre.appendChild(t);
                newLivre.appendChild(an);
                newLivre.appendChild(d);
                newLivre.appendChild(im);
                newLivre.appendChild(isbn);
                newLivre.appendChild(dispo);
                newLivre.appendChild(a);
                newLivre.appendChild(cat);
                xmlData.documentElement.appendChild(newLivre);
                
                // Mettre à jour la liste des livres de l'auteur
                if (auteur && newId) {
                    await updateAuthorBooksList(auteur, newId, 'add');
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
                alert(currentEditBook ? "Livre modifié avec succès et sauvegardé dans le fichier XML!" : "Livre ajouté avec succès et sauvegardé dans le fichier XML!");
            } else {
                alert(currentEditBook ? "Livre modifié avec succès! (Note: Le serveur de sauvegarde n'est pas disponible, les modifications seront perdues au rechargement)" : "Livre ajouté avec succès! (Note: Le serveur de sauvegarde n'est pas disponible, les modifications seront perdues au rechargement)");
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
                if (detailYearEl) detailYearEl.innerText = year || 'Non spécifiée';
                
                // Récupérer l'auteur
                if (detailAuthorEl) {
                    const authorRefs = book.getElementsByTagName('auteurRef');
                    const authorNames = [];
                    for (let j = 0; j < authorRefs.length; j++) {
                        const authorId = authorRefs[j].getAttribute('id');
                        if (authorId === 'INDISPO') {
                            authorNames.push('<span style="color: #dc3545; font-style: italic;">Indisponible</span>');
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
                                        const authorName = author.getElementsByTagName('nom')[0]?.textContent || 'Auteur inconnu';
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
                    detailCategoryEl.innerText = categoryNames.length > 0 ? categoryNames.join(', ') : 'Non spécifiée';
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
            alert("Erreur: La bibliothèque PDF n'est pas chargée. Veuillez recharger la page.");
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Récupérer le nom de l'auteur
        let auteurName = 'Auteur inconnu';
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
            auteurName = 'Indisponible';
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
        alert("Erreur lors de la génération du PDF. Veuillez réessayer.");
    }
}

async function openEditModal(titre="", auteur="", desc="", img=""){
    currentEditBook = titre;
    const modalTitle = document.getElementById('edit-modal-title');
    const editTitre = document.getElementById('edit-titre');
    const editAuteur = document.getElementById('edit-auteur');
    const editDesc = document.getElementById('edit-desc');
    const editImgFile = document.getElementById('edit-img-file');
    const modal = document.getElementById('edit-modal');
    const auteurLoading = document.getElementById('auteur-loading');
    
    if (modalTitle) modalTitle.innerText = titre ? "Modifier Livre" : "Ajouter Livre";
    if (editTitre) editTitre.value = titre;
    if (editDesc) editDesc.value = desc;
    currentImageData = img;
    if (editImgFile) editImgFile.value = "";
    
    // Charger les auteurs et remplir le select
    if (editAuteur) {
        editAuteur.innerHTML = '<option value="">Sélectionnez un auteur...</option>';
        if (auteurLoading) auteurLoading.style.display = 'block';
        
        try {
            // Charger les auteurs avec cache buster
            const cacheBuster = '?v=' + Date.now();
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
                        const option = document.createElement('option');
                        option.value = authorId;
                        option.textContent = nomEl.textContent;
                        editAuteur.appendChild(option);
                    }
                }
                
                // Sélectionner l'auteur actuel si on est en mode modification
                if (auteur) {
                    editAuteur.value = auteur;
                }
            }
        } catch (e) {
            console.error("Error loading authors", e);
        } finally {
            if (auteurLoading) auteurLoading.style.display = 'none';
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
    if(confirm(`Êtes-vous sûr de vouloir supprimer "${titre}" ?`)){
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
            alert("Livre supprimé avec succès et sauvegardé dans le fichier XML!");
        } else {
            alert("Livre supprimé avec succès! (Note: Le serveur de sauvegarde n'est pas disponible, les modifications seront perdues au rechargement)");
        }
        
        // Recharger la liste avec cache buster pour voir les modifications
        await loadBooks();
    }
}
