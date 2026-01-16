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
                    enrichBooks(booksDoc);
                }, 100);
            }
        } else {
            console.error("XSLTProcessor not supported in this browser.");
        }
    } catch (e) {
        console.error("Authors loading failed", e);
        const workspace = document.getElementById('workspace');
        if (workspace) {
            workspace.innerHTML = '<p style="color: red;">Erreur lors du chargement des auteurs.</p>';
        }
    }
}

// Fonction pour enrichir les informations des livres
function enrichBooks(booksDoc) {
    const livreItems = document.querySelectorAll('.livre-item');
    
    // Créer un map de tous les livres pour un accès rapide
    const booksMap = new Map();
    const allBooks = booksDoc.getElementsByTagName('livre');
    for (let i = 0; i < allBooks.length; i++) {
        const book = allBooks[i];
        const bookId = book.getAttribute('idLivre');
        if (bookId) {
            booksMap.set(bookId, book);
        }
    }
    
    livreItems.forEach(item => {
        const bookId = item.getAttribute('data-book-id');
        if (!bookId) return;
        
        const book = booksMap.get(bookId);
        const livreTitre = item.querySelector('.livre-titre');
        const detailsDiv = item.querySelector('.livre-details');
        
        if (book && livreTitre && detailsDiv) {
            const titreEl = book.getElementsByTagName('titre')[0];
            const anneeEl = book.getElementsByTagName('anneePublication')[0];
            const isbnEl = book.getElementsByTagName('isbn')[0];
            const disponibiliteEl = book.getElementsByTagName('disponibilite')[0];
            
            const titre = titreEl ? titreEl.textContent : 'Titre inconnu';
            const annee = anneeEl ? anneeEl.textContent : '';
            const isbn = isbnEl ? isbnEl.textContent : '';
            const disponibilite = disponibiliteEl ? disponibiliteEl.textContent : '';
            
            livreTitre.textContent = titre;
            
            let detailsHTML = '';
            if (annee) {
                detailsHTML += `<span class="livre-detail-item"><strong>Année:</strong> ${annee}</span>`;
            }
            if (isbn) {
                detailsHTML += `<span class="livre-detail-item"><strong>ISBN:</strong> ${isbn}</span>`;
            }
            if (disponibilite) {
                const disponibiliteText = disponibilite === 'true' ? '✅ Disponible' : '❌ Non disponible';
                detailsHTML += `<span class="livre-detail-item"><strong>Disponibilité:</strong> ${disponibiliteText}</span>`;
            }
            
            detailsDiv.innerHTML = detailsHTML || '<span class="livre-details">Aucune information supplémentaire</span>';
        } else if (livreTitre && detailsDiv) {
            livreTitre.textContent = `Livre ID: ${bookId}`;
            detailsDiv.innerHTML = '<span class="livre-details">(Livre non trouvé)</span>';
        }
    });
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
            .form-group input {
                width: 100%;
                padding: 12px;
                border: 2px solid #e1e5eb;
                border-radius: 6px;
                font-size: 1rem;
                box-sizing: border-box;
            }
            .form-group input:focus {
                outline: none;
                border-color: #4c95af;
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
                <label for="author-nom">Nom de l'auteur *</label>
                <input type="text" id="author-nom" name="nom" required>
            </div>
            <div class="form-group">
                <label for="author-pays">Pays *</label>
                <input type="text" id="author-pays" name="pays" required>
            </div>
            <div class="form-buttons">
                <button type="button" class="btn-cancel" onclick="closeModal()">Annuler</button>
                <button type="submit" class="btn-save">Enregistrer</button>
            </div>
        </form>
    `;
    
    showModal('Ajouter un nouvel auteur', formHTML);
}

// Fonction pour modifier un auteur
async function editAuthor(authorId) {
    try {
        // Charge le XML pour récupérer les données de l'auteur (avec cache buster)
        const cacheBuster = '?v=' + Date.now();
        const xmlResp = await fetch('data/authors.xml' + cacheBuster);
        if (!xmlResp.ok) throw new Error("Failed to load authors.xml");
        const xmlText = await xmlResp.text();
        const xmlDoc = new DOMParser().parseFromString(xmlText, 'application/xml');
        
        const author = xmlDoc.querySelector(`auteur[id="${authorId}"]`);
        if (!author) {
            alert("Auteur non trouvé");
            return;
        }
        
        const nom = author.querySelector('nom').textContent;
        const pays = author.querySelector('pays').textContent;
        
        const formHTML = `
            <form id="edit-author-form" onsubmit="saveAuthor(event, '${authorId}')">
                <div class="form-group">
                    <label for="author-nom">Nom de l'auteur *</label>
                    <input type="text" id="author-nom" name="nom" value="${nom}" required>
                </div>
                <div class="form-group">
                    <label for="author-pays">Pays *</label>
                    <input type="text" id="author-pays" name="pays" value="${pays}" required>
                </div>
                <div class="form-buttons">
                    <button type="button" class="btn-cancel" onclick="closeModal()">Annuler</button>
                    <button type="submit" class="btn-save">Enregistrer</button>
                </div>
            </form>
        `;
        
        showModal('Modifier l\'auteur', formHTML);
    } catch (e) {
        console.error("Error loading author for edit", e);
        alert("Erreur lors du chargement de l'auteur");
    }
}

// Fonction pour sauvegarder un auteur (ajout ou modification)
async function saveAuthor(event, authorId) {
    event.preventDefault();
    
    const nom = document.getElementById('author-nom').value;
    const pays = document.getElementById('author-pays').value;
    
    if (!nom || !pays) {
        alert("Veuillez remplir tous les champs");
        return;
    }
    
    try {
        // Charge le XML actuel (avec cache buster)
        const cacheBuster = '?v=' + Date.now();
        const xmlResp = await fetch('data/authors.xml' + cacheBuster);
        if (!xmlResp.ok) throw new Error("Failed to load authors.xml");
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
        
        if (saved) {
            alert(authorId ? "Auteur modifié avec succès et sauvegardé dans le fichier XML!" : "Auteur ajouté avec succès et sauvegardé dans le fichier XML!");
        } else {
            alert(authorId ? "Auteur modifié avec succès! (Note: Le serveur de sauvegarde n'est pas disponible, les modifications seront perdues au rechargement)" : "Auteur ajouté avec succès! (Note: Le serveur de sauvegarde n'est pas disponible, les modifications seront perdues au rechargement)");
        }
        
        // Fermer la modal
        closeModal();
        
        // Recharger la liste
        await loadAuthors();
        
    } catch (e) {
        console.error("Error saving author", e);
        alert("Erreur lors de la sauvegarde de l'auteur");
    }
}

// Fonction pour supprimer un auteur
async function deleteAuthor(authorId) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet auteur ?\nToutes les références à cet auteur dans les livres seront également supprimées.")) {
        return;
    }
    
    try {
        const cacheBuster = '?v=' + Date.now();
        const serializer = new XMLSerializer();
        
        // 1. Supprimer l'auteur de authors.xml
        const xmlResp = await fetch('data/authors.xml' + cacheBuster);
        if (!xmlResp.ok) throw new Error("Failed to load authors.xml");
        const xmlText = await xmlResp.text();
        const xmlDoc = new DOMParser().parseFromString(xmlText, 'application/xml');
        
        const author = xmlDoc.querySelector(`auteur[id="${authorId}"]`);
        if (author) {
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
            if (!booksResp.ok) throw new Error("Failed to load books.xml");
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
            
            if (authorsSaved) {
                alert("Auteur supprimé avec succès !\nToutes les références à cet auteur dans les livres ont été supprimées.");
            } else {
                alert("Auteur supprimé ! (Note: Le serveur de sauvegarde n'est pas disponible, les modifications seront perdues au rechargement)");
            }
            
            // Recharger la liste
            await loadAuthors();
        }
    } catch (e) {
        console.error("Error deleting author", e);
        alert("Erreur lors de la suppression de l'auteur");
    }
}
