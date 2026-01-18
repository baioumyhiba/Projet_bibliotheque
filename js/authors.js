async function loadAuthors() {
    try {
        // Ajouter un timestamp pour éviter le cache du navigateur
        const cacheBuster = '?v=' + Date.now();
        
        // Charge le XML des auteurs
        const xmlResp = await fetch('data/authors.xml' + cacheBuster);
        if (!xmlResp.ok) throw new Error("Failed to load authors.xml");
        const xmlText = await xmlResp.text();
        const xmlDoc = new DOMParser().parseFromString(xmlText, 'application/xml');

        // Charge le XML des livres
        const booksResp = await fetch('data/books.xml' + cacheBuster);
        if (!booksResp.ok) throw new Error("Failed to load books.xml");
        const booksText = await booksResp.text();
        const booksDoc = new DOMParser().parseFromString(booksText, 'application/xml');

            // Charge le XSL
        const xslResp = await fetch('data/authors.xsl' + cacheBuster);
        if (!xslResp.ok) throw new Error("Failed to load authors.xsl");
        const xslText = await xslResp.text();
        const xslDoc = new DOMParser().parseFromString(xslText, 'application/xml');

                    // Transformation XSLT
        if (window.XSLTProcessor) {
            const xsltProcessor = new XSLTProcessor();
            xsltProcessor.importStylesheet(xslDoc);
            
            const resultDocument = xsltProcessor.transformToFragment(xmlDoc, document);
            const workspace = document.getElementById('workspace');
            if (workspace) {
                workspace.innerHTML = '';
                workspace.appendChild(resultDocument);
                
                // Enrichir les livres après la transformation (petit délai pour s'assurer que le DOM est prêt)
                setTimeout(() => {
                    console.log('[loadAuthors] Appel de enrichBooks après délai');
                    // Appliquer les traductions d'abord
                    if (App && App.applyTranslations) {
                        App.applyTranslations();
                    }
                    // Puis enrichir les livres (après les traductions pour éviter que les traductions remplacent les noms)
                    setTimeout(() => {
                        enrichBooks(booksDoc);
                    }, 50);
                }, 150);
            }
        } else {
            console.error("XSLTProcessor not supported in this browser.");
        }
    } catch (e) {
        console.error("Authors loading failed", e);
        const workspace = document.getElementById('workspace');
        if (workspace) {
            workspace.innerHTML = `<p style="color: red;">${translate("authors.load.error", "Erreur lors du chargement des auteurs")}.</p>`;
        }
    }
}

// Fonction pour enrichir les informations des livres
function enrichBooks(booksDoc) {
    console.log('[enrichBooks] Début de la fonction');
    const livreItems = document.querySelectorAll('.livre-item');
    console.log(`[enrichBooks] Trouvé ${livreItems.length} éléments .livre-item`);
    
    // Créer un map de tous les livres pour un accès rapide
    const booksMap = new Map();
    const allBooks = booksDoc.getElementsByTagName('livre');
    console.log(`[enrichBooks] Nombre de livres trouvés dans books.xml: ${allBooks.length}`);
    
    for (let i = 0; i < allBooks.length; i++) {
        const book = allBooks[i];
        const bookId = book.getAttribute('idLivre');
        if (bookId) {
            booksMap.set(bookId, book);
            console.log(`[enrichBooks] Livre chargé: ${bookId}`);
        } else {
            console.warn(`[enrichBooks] Livre #${i} n'a pas d'attribut idLivre`);
        }
    }
    
    console.log(`[enrichBooks] Map des livres: ${booksMap.size} livres`);
    console.log(`[enrichBooks] IDs des livres dans la map:`, Array.from(booksMap.keys()));
    
    livreItems.forEach((item, index) => {
        const bookId = item.getAttribute('data-book-id');
        if (!bookId) {
            console.warn(`[enrichBooks] Élément .livre-item #${index} n'a pas d'attribut data-book-id`);
            return;
        }
        
        const book = booksMap.get(bookId);
        const livreTitre = item.querySelector('.livre-titre');
        const detailsDiv = item.querySelector('.livre-details');
        
        if (!livreTitre) {
            console.warn(`[enrichBooks] Élément .livre-item #${index} (bookId: ${bookId}) n'a pas d'enfant .livre-titre`);
        }
        
        if (!detailsDiv) {
            console.warn(`[enrichBooks] Élément .livre-item #${index} (bookId: ${bookId}) n'a pas d'enfant .livre-details`);
        }
        
        if (book && livreTitre && detailsDiv) {
            const titreEl = book.getElementsByTagName('titre')[0];
            const anneeEl = book.getElementsByTagName('anneePublication')[0];
            const isbnEl = book.getElementsByTagName('isbn')[0];
            const disponibiliteEl = book.getElementsByTagName('disponibilite')[0];
            
            const titre = titreEl ? titreEl.textContent.trim() : translate("authors.unknown.title", "Titre inconnu");
            const annee = anneeEl ? anneeEl.textContent.trim() : '';
            const isbn = isbnEl ? isbnEl.textContent.trim() : '';
            const disponibilite = disponibiliteEl ? disponibiliteEl.textContent.trim() : '';
            
            // Retirer l'attribut data-i18n pour éviter que les traductions remplacent le texte
            livreTitre.removeAttribute('data-i18n');
            livreTitre.textContent = titre;
            console.log(`[enrichBooks] ✓ Livre ${bookId} -> ${titre}`);
            
            let detailsHTML = '';
            if (annee) {
                detailsHTML += `<span class="livre-detail-item"><strong>${translate("authors.year", "Année")}:</strong> ${annee}</span>`;
            }
            if (isbn) {
                detailsHTML += `<span class="livre-detail-item"><strong>${translate("authors.isbn", "ISBN")}:</strong> ${isbn}</span>`;
            }
            if (disponibilite) {
                const disponibiliteText = disponibilite === 'true' ? translate("authors.available", "✅ Disponible") : translate("authors.unavailable", "❌ Non disponible");
                detailsHTML += `<span class="livre-detail-item"><strong>${translate("authors.availability", "Disponibilité")}:</strong> ${disponibiliteText}</span>`;
            }
            
            detailsDiv.innerHTML = detailsHTML || `<span class="livre-details">${translate("authors.no.info", "Aucune information supplémentaire")}</span>`;
        } else if (livreTitre && detailsDiv) {
            // Retirer l'attribut data-i18n pour éviter que les traductions remplacent le texte
            livreTitre.removeAttribute('data-i18n');
            livreTitre.textContent = `${translate("books.id.label", "Livre ID")}: ${bookId}`;
            detailsDiv.innerHTML = `<span class="livre-details">${translate("authors.book.not.found", "(Livre non trouvé)")}</span>`;
            console.warn(`[enrichBooks] ✗ Livre ${bookId} non trouvé dans books.xml`);
        }
    });
    
    console.log(`[enrichBooks] Fonction terminée: ${livreItems.length} éléments traités`);
    
    // Réessayer une fois de plus après un court délai au cas où les éléments ne seraient pas encore dans le DOM
    if (livreItems.length === 0) {
        console.warn('[enrichBooks] Aucun élément .livre-item trouvé, nouvelle tentative dans 200ms');
        setTimeout(() => {
            console.log('[enrichBooks] Nouvelle tentative de chargement des livres');
            enrichBooks(booksDoc);
        }, 200);
    }
}

// Fonction pour afficher une modal
function showModal(title, formHTML) {
    // Créer la modal si elle n'existe pas
    let modal = document.getElementById('author-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'author-modal';
        modal.className = 'modal-overlay';
        document.body.appendChild(modal);
    }
    
    modal.innerHTML = `
        <style>
            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                animation: fadeIn 0.3s ease;
            }
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            .modal-content {
                background: #ffffff;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
                max-width: 600px;
                width: 90%;
                max-height: 90vh;
                overflow-y: auto;
                animation: slideIn 0.3s ease;
            }
            @keyframes slideIn {
                from { transform: translateY(-50px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
            }
            .modal-header h3 {
                color: #131b48;
                margin: 0;
                font-size: 1.5rem;
            }
            .modal-close {
                background: none;
                border: none;
                font-size: 1.5rem;
                color: #6c757d;
                cursor: pointer;
                padding: 0;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: all 0.3s ease;
            }
            .modal-close:hover {
                background-color: #f8f9fa;
                color: #131b48;
            }
            .form-group {
                margin-bottom: 20px;
            }
            .form-group label {
                display: block;
                margin-bottom: 8px;
                color: #131b48;
                font-weight: 600;
            }
            .form-group input,
            .form-group select {
                width: 100%;
                padding: 12px;
                border: 2px solid #e1e5eb;
                border-radius: 6px;
                font-size: 1rem;
                box-sizing: border-box;
                background-color: #ffffff;
                transition: all 0.3s ease;
                appearance: none;
                -webkit-appearance: none;
                -moz-appearance: none;
            }
            .form-group input:focus,
            .form-group select:focus {
                outline: none;
                border-color: #4c95af;
                box-shadow: 0 0 0 3px rgba(76, 149, 175, 0.1);
            }
            .form-group select {
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236c757d' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
                background-repeat: no-repeat;
                background-position: right 12px center;
                padding-right: 40px;
                cursor: pointer;
            }
            .form-group select:hover {
                border-color: #4c95af;
            }
            .form-group select option {
                padding: 10px;
                background-color: #ffffff;
                color: #131b48;
            }
            .form-group select option:hover {
                background-color: #f8f9fa;
            }
            .form-group select option[value="__NEW__"] {
                font-weight: 600;
                color: #4c95af;
                border-top: 1px solid #e1e5eb;
                padding-top: 12px;
                margin-top: 5px;
            }
            .form-group label {
                display: flex;
                align-items: center;
                gap: 5px;
            }
            .form-group small {
                display: block;
                margin-top: 5px;
                color: #6c757d;
                font-size: 0.85rem;
            }
            .form-buttons {
                display: flex;
                gap: 10px;
                justify-content: flex-end;
                margin-top: 20px;
            }
            .btn-save, .btn-cancel {
                padding: 10px 20px;
                border: none;
                border-radius: 6px;
                font-size: 1rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            .btn-save {
                background-color: #4c95af;
                color: white;
            }
            .btn-save:hover {
                background-color: #3a7a8f;
            }
            .btn-cancel {
                background-color: #6c757d;
                color: white;
            }
            .btn-cancel:hover {
                background-color: #5a6268;
            }
        </style>
        <div class="modal-content">
            <div class="modal-header">
                <h3>${title}</h3>
                <button class="modal-close" onclick="closeModal()">&times;</button>
            </div>
            ${formHTML}
        </div>
    `;
    
    modal.style.display = 'flex';
    
    // Fermer la modal en cliquant sur l'overlay
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });
}

// Fonction pour fermer la modal
function closeModal() {
    const modal = document.getElementById('author-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

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

// Fonction pour afficher le formulaire d'ajout
function showAddAuthorForm() {
    const formHTML = `
        <form id="add-author-form" onsubmit="saveAuthor(event, null)">
            <div class="form-group">
                <label for="author-nom">${translate("authors.name", "Nom de l'auteur *")}</label>
                <input type="text" id="author-nom" name="nom" required>
            </div>
            <div class="form-group">
                <label for="author-pays">${translate("authors.country", "Pays *")}</label>
                <input type="text" id="author-pays" name="pays" required>
            </div>
            <div class="form-buttons">
                <button type="button" class="btn-cancel" onclick="closeModal()">${translate("common.cancel", "Annuler")}</button>
                <button type="submit" class="btn-save">${translate("common.save", "Enregistrer")}</button>
            </div>
        </form>
    `;
    
    showModal(translate("authors.add.title", "Ajouter un nouvel auteur"), formHTML);
    
    // Appliquer les traductions après la création du modal
    if (App && App.applyTranslations) {
        App.applyTranslations();
    }
}

// Fonction pour modifier un auteur
async function editAuthor(authorId) {
    try {
        // Charge le XML pour récupérer les données de l'auteur (avec cache buster)
        const cacheBuster = '?v=' + Date.now();
        const xmlResp = await fetch('data/authors.xml' + cacheBuster);
        if (!xmlResp.ok) throw new Error(translate("authors.error.load.xml", "Failed to load authors.xml"));
        const xmlText = await xmlResp.text();
        const xmlDoc = new DOMParser().parseFromString(xmlText, 'application/xml');
        
        const author = xmlDoc.querySelector(`auteur[id="${authorId}"]`);
        if (!author) {
            alert(translate("authors.not.found", "Auteur non trouvé"));
            return;
        }
        
        const nom = author.querySelector('nom').textContent;
        const pays = author.querySelector('pays').textContent;
        
        const formHTML = `
            <form id="edit-author-form" onsubmit="saveAuthor(event, '${authorId}')">
                <div class="form-group">
                    <label for="author-nom">${translate("authors.name", "Nom de l'auteur *")}</label>
                    <input type="text" id="author-nom" name="nom" value="${nom}" required>
                </div>
                <div class="form-group">
                    <label for="author-pays">${translate("authors.country", "Pays *")}</label>
                    <input type="text" id="author-pays" name="pays" value="${pays}" required>
                </div>
                <div class="form-buttons">
                    <button type="button" class="btn-cancel" onclick="closeModal()">${translate("common.cancel", "Annuler")}</button>
                    <button type="submit" class="btn-save">${translate("common.save", "Enregistrer")}</button>
                </div>
            </form>
        `;
        
        showModal(translate("authors.edit.title", "Modifier l'auteur"), formHTML);
        
        // Appliquer les traductions après la création du modal
        if (App && App.applyTranslations) {
            App.applyTranslations();
        }
    } catch (e) {
        console.error("Error loading author for edit", e);
        alert(translate("authors.load.error.edit", "Erreur lors du chargement de l'auteur"));
    }
}

// Fonction pour sauvegarder un auteur (ajout ou modification)
async function saveAuthor(event, authorId) {
    event.preventDefault();
    
    const nom = document.getElementById('author-nom').value.trim();
    const pays = document.getElementById('author-pays').value.trim();
    
    if (!nom || !pays) {
        alert(translate("authors.fill.all", "Veuillez remplir tous les champs"));
        return;
    }
    
    try {
        // Charge le XML actuel (avec cache buster)
        const cacheBuster = '?v=' + Date.now();
        const xmlResp = await fetch('data/authors.xml' + cacheBuster);
        if (!xmlResp.ok) throw new Error(translate("authors.error.load.xml", "Failed to load authors.xml"));
        const xmlText = await xmlResp.text();
        const xmlDoc = new DOMParser().parseFromString(xmlText, 'application/xml');
        
        if (authorId) {
            // Modification
            const author = xmlDoc.querySelector(`auteur[id="${authorId}"]`);
            if (author) {
                author.querySelector('nom').textContent = nom;
                author.querySelector('pays').textContent = pays;
            }
        } else {
            // Ajout
            const auteurs = xmlDoc.querySelector('auteurs');
            // Trouver le plus grand ID existant pour éviter les conflits
            const allAuthors = xmlDoc.querySelectorAll('auteur');
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
            const newAuthor = xmlDoc.createElement('auteur');
            newAuthor.setAttribute('id', newId);
            
            const nomEl = xmlDoc.createElement('nom');
            nomEl.textContent = nom;
            const paysEl = xmlDoc.createElement('pays');
            paysEl.textContent = pays;
            const livresEl = xmlDoc.createElement('livres');
            
            newAuthor.appendChild(nomEl);
            newAuthor.appendChild(paysEl);
            newAuthor.appendChild(livresEl);
            auteurs.appendChild(newAuthor);
            
            // Créer aussi un utilisateur avec le rôle "auteur" dans users.xml
            try {
                const usersResp = await fetch('data/users/users.xml' + cacheBuster);
                if (usersResp.ok) {
                    const usersText = await usersResp.text();
                    const usersDoc = new DOMParser().parseFromString(usersText, 'application/xml');
                    
                    // Vérifier si un utilisateur avec ce nom existe déjà
                    const existingUsers = usersDoc.getElementsByTagName('user');
                    let userExists = false;
                    for (let i = 0; i < existingUsers.length; i++) {
                        const usernameEl = existingUsers[i].getElementsByTagName('username')[0];
                        if (usernameEl && usernameEl.textContent.trim().toLowerCase() === nom.trim().toLowerCase()) {
                            userExists = true;
                            break;
                        }
                    }
                    
                    // Si l'utilisateur n'existe pas, le créer
                    if (!userExists) {
                        // Trouver le plus grand ID d'utilisateur
                        let maxUserId = 0;
                        for (let i = 0; i < existingUsers.length; i++) {
                            const idEl = existingUsers[i].getElementsByTagName('id')[0];
                            if (idEl) {
                                const id = parseInt(idEl.textContent);
                                if (!isNaN(id) && id > maxUserId) {
                                    maxUserId = id;
                                }
                            }
                        }
                        const newUserId = maxUserId + 1;
                        
                        // Créer le nouvel utilisateur
                        const newUser = usersDoc.createElement('user');
                        
                        const idEl = usersDoc.createElement('id');
                        idEl.textContent = newUserId;
                        newUser.appendChild(idEl);
                        
                        const usernameEl = usersDoc.createElement('username');
                        usernameEl.textContent = nom;
                        newUser.appendChild(usernameEl);
                        
                        const passwordEl = usersDoc.createElement('password');
                        passwordEl.textContent = nom.toLowerCase().replace(/\s+/g, '') + '123'; // Mot de passe par défaut
                        newUser.appendChild(passwordEl);
                        
                        const emailEl = usersDoc.createElement('email');
                        emailEl.textContent = nom.toLowerCase().replace(/\s+/g, '') + '@gmail.com';
                        newUser.appendChild(emailEl);
                        
                        const roleEl = usersDoc.createElement('role');
                        roleEl.textContent = 'auteur';
                        newUser.appendChild(roleEl);
                        
                        // Ajouter un profil minimal
                        const profileEl = usersDoc.createElement('profile');
                        
                        const nomEl = usersDoc.createElement('nom');
                        nomEl.textContent = nom;
                        profileEl.appendChild(nomEl);
                        
                        const prenomEl = usersDoc.createElement('prenom');
                        prenomEl.textContent = '';
                        profileEl.appendChild(prenomEl);
                        
                        const telephoneEl = usersDoc.createElement('telephone');
                        telephoneEl.textContent = '';
                        profileEl.appendChild(telephoneEl);
                        
                        const dateNaissanceEl = usersDoc.createElement('dateNaissance');
                        dateNaissanceEl.textContent = '';
                        profileEl.appendChild(dateNaissanceEl);
                        
                        const bioEl = usersDoc.createElement('bio');
                        bioEl.textContent = '';
                        profileEl.appendChild(bioEl);
                        
                        newUser.appendChild(profileEl);
                        
                        // Ajouter au document
                        const root = usersDoc.documentElement;
                        root.appendChild(newUser);
                        
                        // Sauvegarder users.xml
                        const usersSerializer = new XMLSerializer();
                        let updatedUsersXml = usersSerializer.serializeToString(usersDoc);
                        if (!updatedUsersXml.includes('<?xml')) {
                            updatedUsersXml = '<?xml version="1.0" encoding="UTF-8"?>' + updatedUsersXml;
                        }
                        
                        await saveXMLToFile('data/users/users.xml', updatedUsersXml);
                    }
                }
            } catch (userError) {
                console.error('Erreur lors de la création de l\'utilisateur pour l\'auteur:', userError);
                // Ne pas bloquer la sauvegarde de l'auteur si la création de l'utilisateur échoue
            }
        }
        
        // Convertir en XML string avec formatage
        const serializer = new XMLSerializer();
        let updatedXml = serializer.serializeToString(xmlDoc);
        
        // Ajouter la déclaration XML si elle n'est pas présente
        if (!updatedXml.startsWith('<?xml')) {
            updatedXml = '<?xml version="1.0" encoding="UTF-8"?>\n' + updatedXml;
        }
        
        // Sauvegarder sur le serveur
        const saved = await saveXMLToFile('data/authors.xml', updatedXml);
        
        // Envoyer une notification via le pattern Observer (même si saved est false, l'action a été faite)
        try {
            if (window.NotificationCenter) {
                const eventType = authorId ? 'AUTHOR_MODIFIED' : 'AUTHOR_ADDED';
                console.log('Envoi notification:', eventType, nom);
                await window.NotificationCenter.notify({
                    eventType: eventType,
                    data: { name: nom }
                });
                console.log('Notification envoyée avec succès');
            } else {
                console.error('NotificationCenter n\'est pas disponible');
            }
        } catch (error) {
            console.error('Erreur lors de l\'envoi de la notification:', error);
        }
        
        if (saved) {
            alert(authorId ? translate("authors.edit.success") : translate("authors.add.success"));
        } else {
            alert((authorId ? translate("authors.edit.success") : translate("authors.add.success")) + " " + translate("authors.server.unavailable"));
        }
        
        // Fermer la modal
        closeModal();
        
        // Recharger la liste
        await loadAuthors();
        
    } catch (e) {
        console.error("Error saving author", e);
        alert(translate("authors.save.error", "Erreur lors de la sauvegarde de l'auteur"));
    }
}

// Fonction pour supprimer un auteur
async function deleteAuthor(authorId) {
    if (!confirm(translate("authors.delete.confirm", "Êtes-vous sûr de vouloir supprimer cet auteur ?\nToutes les références à cet auteur dans les livres seront également supprimées."))) {
        return;
    }
    
    try {
        const cacheBuster = '?v=' + Date.now();
        const serializer = new XMLSerializer();
        
        // 1. Supprimer l'auteur de authors.xml
        const xmlResp = await fetch('data/authors.xml' + cacheBuster);
        if (!xmlResp.ok) throw new Error(translate("authors.error.load.xml", "Failed to load authors.xml"));
        const xmlText = await xmlResp.text();
        const xmlDoc = new DOMParser().parseFromString(xmlText, 'application/xml');
        
        const author = xmlDoc.querySelector(`auteur[id="${authorId}"]`);
        let authorName = authorId; // Fallback
        if (author) {
            const nomEl = author.querySelector('nom');
            if (nomEl) {
                authorName = nomEl.textContent;
            }
            author.parentNode.removeChild(author);
            
            // Convertir en XML string
            let updatedXml = serializer.serializeToString(xmlDoc);
            
            // Ajouter la déclaration XML si elle n'est pas présente
            if (!updatedXml.startsWith('<?xml')) {
                updatedXml = '<?xml version="1.0" encoding="UTF-8"?>\n' + updatedXml;
            }
            
            // Sauvegarder authors.xml
            const authorsSaved = await saveXMLToFile('data/authors.xml', updatedXml);
            
            // 2. Remplacer toutes les références à cet auteur dans books.xml par "INDISPO"
            const booksResp = await fetch('data/books.xml' + cacheBuster);
            if (!booksResp.ok) throw new Error(translate("books.error.load.xml", "Failed to load books.xml"));
            const booksText = await booksResp.text();
            const booksDoc = new DOMParser().parseFromString(booksText, 'application/xml');
            
            // Trouver tous les livres qui référencent cet auteur
            const allBooks = booksDoc.getElementsByTagName('livre');
            let booksUpdated = false;
            
            for (let i = 0; i < allBooks.length; i++) {
                const book = allBooks[i];
                const authorsSection = book.querySelector('authors');
                
                if (authorsSection) {
                    // Trouver toutes les références à cet auteur
                    const authorRefs = authorsSection.querySelectorAll(`auteurRef[id="${authorId}"]`);
                    
                    // Remplacer chaque référence par "INDISPO" au lieu de la supprimer
                    authorRefs.forEach(ref => {
                        ref.setAttribute('id', 'INDISPO');
                        booksUpdated = true;
                    });
                }
            }
            
            // Sauvegarder books.xml si des modifications ont été faites
            if (booksUpdated) {
                let updatedBooksXml = serializer.serializeToString(booksDoc);
                if (!updatedBooksXml.startsWith('<?xml')) {
                    updatedBooksXml = '<?xml version="1.0" encoding="UTF-8"?>\n' + updatedBooksXml;
                }
                await saveXMLToFile('data/books.xml', updatedBooksXml);
            }
            
            // Envoyer une notification via le pattern Observer (même si saved est false)
            try {
                if (window.NotificationCenter) {
                    console.log('Envoi notification AUTHOR_DELETED:', authorName);
                    await window.NotificationCenter.notify({
                        eventType: 'AUTHOR_DELETED',
                        data: { name: authorName }
                    });
                    console.log('Notification envoyée avec succès');
                } else {
                    console.error('NotificationCenter n\'est pas disponible');
                }
            } catch (error) {
                console.error('Erreur lors de l\'envoi de la notification:', error);
            }
            
            if (authorsSaved) {
                alert(translate("authors.delete.success", "Auteur supprimé avec succès !\nToutes les références à cet auteur dans les livres ont été supprimées."));
            } else {
                alert(translate("authors.delete.success", "Auteur supprimé !") + " " + translate("authors.server.unavailable"));
            }
            
            // Recharger la liste
            await loadAuthors();
        }
    } catch (e) {
        console.error("Error deleting author", e);
        alert(translate("authors.delete.error", "Erreur lors de la suppression de l'auteur"));
    }
}

// Exposer globalement les fonctions pour les appels onclick dans XSL
window.showAddAuthorForm = showAddAuthorForm;
window.editAuthor = editAuthor;
window.deleteAuthor = deleteAuthor;
window.closeModal = closeModal;
window.saveAuthor = saveAuthor;
