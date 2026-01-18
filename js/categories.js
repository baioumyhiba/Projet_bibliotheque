// Fonction principale pour charger les catégories
async function loadCategories() {
    try {
        const cacheBuster = '?v=' + Date.now();
        
        // Charger le XML des catégories
        const xmlResp = await fetch('data/categories.xml' + cacheBuster);
        if (!xmlResp.ok) throw new Error("Failed to load categories.xml");
        const xmlText = await xmlResp.text();
        const xmlDoc = new DOMParser().parseFromString(xmlText, 'application/xml');

        // Charger le XSL
        const xslResp = await fetch('data/categories.xsl' + cacheBuster);
        if (!xslResp.ok) throw new Error("Failed to load categories.xsl");
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
                
                // Initialiser les event listeners après la transformation
                setTimeout(() => {
                    initializeCategoryListeners();
                    // Appliquer les traductions aux nouveaux éléments créés
                    if (App && App.applyTranslations) {
                        App.applyTranslations();
                    }
                }, 100);
            }
        } else {
            console.error("XSLTProcessor not supported in this browser.");
        }
    } catch (e) {
        console.error("Categories loading failed", e);
        const workspace = document.getElementById('workspace');
        if (workspace) {
            workspace.innerHTML = `<p style="color: red;">${translate("categories.load.error", "Erreur lors du chargement des catégories")}.</p>`;
        }
    }
}

// Initialiser les event listeners pour les formulaires
function initializeCategoryListeners() {
    const categoryForm = document.getElementById('category-form');
    if (categoryForm && !categoryForm.hasAttribute('data-initialized')) {
        categoryForm.setAttribute('data-initialized', 'true');
        categoryForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await saveCategory();
        });
    }
}

// Fonction pour sauvegarder le XML sur le serveur
async function saveCategoriesXMLToFile(filePath, xmlContent) {
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

// Afficher le formulaire d'ajout
function showAddCategoryForm() {
    showCategoryModal('', '', '');
}

// Modifier une catégorie
async function editCategory(categoryId) {
    try {
        const cacheBuster = '?v=' + Date.now();
        const xmlResp = await fetch('data/categories.xml' + cacheBuster);
        if (!xmlResp.ok) throw new Error("Failed to load categories.xml");
        const xmlText = await xmlResp.text();
        const xmlDoc = new DOMParser().parseFromString(xmlText, 'application/xml');

        const categories = xmlDoc.getElementsByTagName('categorie');
        let categoryElement = null;
        for (let i = 0; i < categories.length; i++) {
            if (categories[i].getAttribute('id') === categoryId) {
                categoryElement = categories[i];
                break;
            }
        }

        if (categoryElement) {
            const libelle = categoryElement.getElementsByTagName('libelle')[0]?.textContent || '';
            showCategoryModal(categoryId, '', libelle);
        }
    } catch (e) {
        console.error("Error loading category for edit", e);
        alert(translate("categories.load.error", "Erreur lors du chargement de la catégorie"));
    }
}

// Afficher le modal
function showCategoryModal(categoryId = '', title = '', libelle = '') {
    // Utiliser les traductions pour le titre si non fourni
    if (!title) {
        title = categoryId ? translate("categories.edit.title", "Modifier la catégorie") : translate("categories.add.title", "Ajouter une catégorie");
    }
    let modal = document.getElementById('category-modal');
    if (!modal) {
        // Créer le modal s'il n'existe pas
        modal = document.createElement('div');
        modal.id = 'category-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2 id="category-modal-title">${title}</h2>
                    <button class="modal-close" onclick="closeCategoryModal()">&#215;</button>
                </div>
                <form id="category-form">
                    <div class="form-group">
                        <label for="category-libelle" data-i18n="categories.label">Libellé *</label>
                        <input type="text" id="category-libelle" required="required" data-i18n-placeholder="categories.label.placeholder"/>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn-cancel" onclick="closeCategoryModal()" data-i18n="common.cancel">Annuler</button>
                        <button type="submit" class="btn-save" data-i18n="common.save">Enregistrer</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
        initializeCategoryListeners();
        // Appliquer les traductions après la création du modal
        if (App && App.applyTranslations) {
            App.applyTranslations();
        }
    }

    const modalTitle = document.getElementById('category-modal-title');
    const libelleInput = document.getElementById('category-libelle');
    
    if (modalTitle) modalTitle.textContent = title;
    if (libelleInput) libelleInput.value = libelle;
    
    // Stocker l'ID de la catégorie pour la sauvegarde
    modal.setAttribute('data-category-id', categoryId);
    
    modal.style.display = 'block';
    
    // Fermer la modal en cliquant sur l'overlay
    modal.onclick = function(e) {
        if (e.target === modal) {
            closeCategoryModal();
        }
    };
}

// Fermer le modal
function closeCategoryModal() {
    const modal = document.getElementById('category-modal');
    if (modal) {
        modal.style.display = 'none';
        const form = document.getElementById('category-form');
        if (form) form.reset();
    }
}

// Sauvegarder une catégorie
async function saveCategory() {
    try {
        const modal = document.getElementById('category-modal');
        const categoryId = modal ? modal.getAttribute('data-category-id') : '';
        const libelleInput = document.getElementById('category-libelle');
        
        if (!libelleInput || !libelleInput.value.trim()) {
            alert(translate("categories.label.required", "Le libellé est obligatoire"));
            return;
        }

        const libelle = libelleInput.value.trim();
        
        // Charger le XML actuel
        const cacheBuster = '?v=' + Date.now();
        const xmlResp = await fetch('data/categories.xml' + cacheBuster);
        if (!xmlResp.ok) throw new Error("Failed to load categories.xml");
        const xmlText = await xmlResp.text();
        const xmlDoc = new DOMParser().parseFromString(xmlText, 'application/xml');

        if (categoryId) {
            // Modifier une catégorie existante
            const categories = xmlDoc.getElementsByTagName('categorie');
            let categoryElement = null;
            for (let i = 0; i < categories.length; i++) {
                if (categories[i].getAttribute('id') === categoryId) {
                    categoryElement = categories[i];
                    break;
                }
            }

            if (categoryElement) {
                const libelleEl = categoryElement.getElementsByTagName('libelle')[0];
                if (libelleEl) {
                    libelleEl.textContent = libelle;
                } else {
                    const newLibelle = xmlDoc.createElement('libelle');
                    newLibelle.textContent = libelle;
                    categoryElement.appendChild(newLibelle);
                }
            }
        } else {
            // Ajouter une nouvelle catégorie
            const categoriesElement = xmlDoc.getElementsByTagName('categories')[0];
            if (categoriesElement) {
                // Générer un nouvel ID
                const allCategories = xmlDoc.getElementsByTagName('categorie');
                let maxId = 0;
                for (let i = 0; i < allCategories.length; i++) {
                    const idAttr = allCategories[i].getAttribute('id');
                    if (idAttr && idAttr.startsWith('C')) {
                        const num = parseInt(idAttr.substring(1));
                        if (!isNaN(num) && num > maxId) {
                            maxId = num;
                        }
                    }
                }
                const newId = 'C' + (maxId + 1);

                const newCategory = xmlDoc.createElement('categorie');
                newCategory.setAttribute('id', newId);
                
                const libelleEl = xmlDoc.createElement('libelle');
                libelleEl.textContent = libelle;
                newCategory.appendChild(libelleEl);
                
                categoriesElement.appendChild(newCategory);
            }
        }

        // Convertir en XML string
        const serializer = new XMLSerializer();
        let updatedXml = serializer.serializeToString(xmlDoc);
        
        // Ajouter la déclaration XML si elle n'est pas présente
        if (!updatedXml.startsWith('<?xml')) {
            updatedXml = '<?xml version="1.0" encoding="UTF-8"?>\n' + updatedXml;
        }
        
        // Sauvegarder sur le serveur
        const saved = await saveCategoriesXMLToFile('data/categories.xml', updatedXml);
        
        if (saved) {
            alert(categoryId ? translate("categories.save.success") : translate("categories.add.success"));
        } else {
            alert((categoryId ? translate("categories.save.success") : translate("categories.add.success")) + " " + translate("categories.server.unavailable"));
        }

        closeCategoryModal();
        
        // Recharger la liste
        await loadCategories();
    } catch (e) {
        console.error("Error saving category", e);
        alert(translate("categories.save.error", "Erreur lors de la sauvegarde de la catégorie"));
    }
}

// Supprimer avec confirmation
function deleteCategoryConfirm(categoryId) {
    if (confirm(translate("categories.delete.confirm", "Êtes-vous sûr de vouloir supprimer cette catégorie ?\n\nNote: Cette action peut affecter les livres associés à cette catégorie."))) {
        deleteCategory(categoryId);
    }
}

// Supprimer une catégorie
async function deleteCategory(categoryId) {
    try {
        // Charger le XML actuel
        const cacheBuster = '?v=' + Date.now();
        const xmlResp = await fetch('data/categories.xml' + cacheBuster);
        if (!xmlResp.ok) throw new Error("Failed to load categories.xml");
        const xmlText = await xmlResp.text();
        const xmlDoc = new DOMParser().parseFromString(xmlText, 'application/xml');

        const categories = xmlDoc.getElementsByTagName('categorie');
        let categoryElement = null;
        for (let i = 0; i < categories.length; i++) {
            if (categories[i].getAttribute('id') === categoryId) {
                categoryElement = categories[i];
                break;
            }
        }

        if (categoryElement && categoryElement.parentNode) {
            categoryElement.parentNode.removeChild(categoryElement);
        }

        // Convertir en XML string
        const serializer = new XMLSerializer();
        let updatedXml = serializer.serializeToString(xmlDoc);
        
        // Ajouter la déclaration XML si elle n'est pas présente
        if (!updatedXml.startsWith('<?xml')) {
            updatedXml = '<?xml version="1.0" encoding="UTF-8"?>\n' + updatedXml;
        }
        
        // Sauvegarder sur le serveur
        const saved = await saveCategoriesXMLToFile('data/categories.xml', updatedXml);
        
        if (saved) {
            alert(translate("categories.delete.success"));
        } else {
            alert(translate("categories.delete.success") + " " + translate("categories.server.unavailable"));
        }
        
        // Recharger la liste
        await loadCategories();
    } catch (e) {
        console.error("Error deleting category", e);
        alert(translate("categories.delete.error", "Erreur lors de la suppression de la catégorie"));
    }
}
