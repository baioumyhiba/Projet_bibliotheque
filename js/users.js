// Fonction principale pour charger les utilisateurs
async function loadUsers() {
    try {
        const cacheBuster = '?v=' + Date.now();
        
        // Charger le XML des utilisateurs
        const xmlResp = await fetch('data/users/users.xml' + cacheBuster);
        if (!xmlResp.ok) throw new Error("Failed to load users.xml");
        const xmlText = await xmlResp.text();
        const xmlDoc = new DOMParser().parseFromString(xmlText, 'application/xml');

        // Charger le XML des rôles pour enrichir l'affichage
        const rolesResp = await fetch('data/users/roles.xml' + cacheBuster);
        const rolesText = await rolesResp.ok ? await rolesResp.text() : '';
        const rolesDoc = rolesText ? new DOMParser().parseFromString(rolesText, 'application/xml') : null;

        // Charger le XSL
        const xslResp = await fetch('data/users/users.xsl' + cacheBuster);
        if (!xslResp.ok) throw new Error("Failed to load users.xsl");
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
                
                // Enrichir les rôles après la transformation
                setTimeout(() => {
                    enrichRoles(rolesDoc);
                    initializeUserListeners();
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
        console.error("Users loading failed", e);
        const workspace = document.getElementById('workspace');
        if (workspace) {
            workspace.innerHTML = `<p style="color: red;">${translate("users.load.error", "Erreur lors du chargement des utilisateurs")}.</p>`;
        }
    }
}

// Fonction pour enrichir les noms de rôles
function enrichRoles(rolesDoc) {
    if (!rolesDoc) return;
    
    const roleItems = document.querySelectorAll('[data-role-id]');
    const rolesMap = new Map();
    
    const roles = rolesDoc.getElementsByTagName('role');
    for (let i = 0; i < roles.length; i++) {
        const role = roles[i];
        const roleId = role.getElementsByTagName('id')[0]?.textContent;
        const roleName = role.getElementsByTagName('name')[0]?.textContent;
        if (roleId && roleName) {
            rolesMap.set(roleId, roleName);
        }
    }
    
    roleItems.forEach(item => {
        const roleId = item.getAttribute('data-role-id');
        const roleName = rolesMap.get(roleId) || roleId;
        item.textContent = roleName;
    });
}

// Fonction pour sauvegarder le XML sur le serveur
async function saveUsersXMLToFile(filePath, xmlContent) {
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

// Initialiser les event listeners
function initializeUserListeners() {
    // Bouton Ajouter utilisateur
    const addBtn = document.getElementById('add-user-btn');
    if (addBtn && !addBtn.hasAttribute('data-initialized')) {
        addBtn.setAttribute('data-initialized', 'true');
        addBtn.addEventListener('click', showAddUserForm);
    }

    // Formulaire d'édition/ajout
    const editForm = document.getElementById('user-edit-form');
    if (editForm && !editForm.hasAttribute('data-initialized')) {
        editForm.setAttribute('data-initialized', 'true');
        editForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const userId = editForm.getAttribute('data-user-id');
            await saveUser(e, userId);
        });
    }

    // Bouton de fermeture du modal
    const closeModalBtn = document.querySelector('.close-user-modal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeUserModal);
    }
}

// Afficher le formulaire d'ajout
function showAddUserForm() {
    showUserModal('', '', '', '', '', 'Ajouter un utilisateur');
}

// Afficher le formulaire d'édition
async function editUser(userId) {
    try {
        const cacheBuster = '?v=' + Date.now();
        const xmlResp = await fetch('data/users/users.xml' + cacheBuster);
        if (!xmlResp.ok) throw new Error("Failed to load users.xml");
        const xmlText = await xmlResp.text();
        const xmlDoc = new DOMParser().parseFromString(xmlText, 'application/xml');
        
        const user = Array.from(xmlDoc.getElementsByTagName('user')).find(u => 
            u.getElementsByTagName('id')[0]?.textContent === userId
        );
        
        if (!user) {
            alert(translate("users.not.found", "Utilisateur non trouvé"));
            return;
        }
        
        const username = user.getElementsByTagName('username')[0]?.textContent || '';
        const email = user.getElementsByTagName('email')[0]?.textContent || '';
        const password = user.getElementsByTagName('password')[0]?.textContent || '';
        const role = user.getElementsByTagName('role')[0]?.textContent || '';
        
        showUserModal(username, email, password, role, userId, 'Modifier l\'utilisateur');
    } catch (e) {
        console.error("Error loading user:", e);
        alert(translate("users.load.error.edit", "Erreur lors du chargement de l'utilisateur"));
    }
}

// Afficher le modal
function showUserModal(username = '', email = '', password = '', role = 'user', userId = '', title = 'Gérer l\'utilisateur') {
    let modal = document.getElementById('user-modal');
    if (!modal) {
        // Créer le modal s'il n'existe pas
        const modalHTML = `
            <div id="user-modal" class="user-modal" style="display: none;">
                <div class="modal-content-user">
                    <div class="modal-header-user">
                        <h3 id="user-modal-title">${title}</h3>
                        <span class="close-user-modal">&times;</span>
                    </div>
                    <form id="user-edit-form" class="user-edit-form">
                        <div class="form-group">
                            <label>Nom d'utilisateur:</label>
                            <input type="text" id="user-username" required minlength="3">
                        </div>
                        <div class="form-group">
                            <label>Email:</label>
                            <input type="email" id="user-email" required>
                        </div>
                        <div class="form-group">
                            <label>Mot de passe:</label>
                            <input type="password" id="user-password" ${userId ? '' : 'required'} minlength="6">
                            ${userId ? '<small>Laisser vide pour ne pas changer</small>' : ''}
                        </div>
                        <div class="form-group">
                            <label>Rôle:</label>
                            <select id="user-role" required>
                                <option value="user">Utilisateur</option>
                                <option value="auteur">Auteur</option>
                                <option value="admin">Administrateur</option>
                            </select>
                        </div>
                        <div class="modal-buttons-user">
                            <button type="submit" class="btn-submit-user">Enregistrer</button>
                            <button type="button" class="btn-cancel-user" onclick="closeUserModal()">Annuler</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
    const modalTitle = document.getElementById('user-modal-title');
    const form = document.getElementById('user-edit-form');
    const usernameInput = document.getElementById('user-username');
    const emailInput = document.getElementById('user-email');
    const passwordInput = document.getElementById('user-password');
    const roleSelect = document.getElementById('user-role');
    
    if (modalTitle) modalTitle.textContent = title;
    if (usernameInput) usernameInput.value = username;
    if (emailInput) emailInput.value = email;
    if (passwordInput) passwordInput.value = password;
    if (roleSelect) roleSelect.value = role;
    if (form) {
        form.setAttribute('data-user-id', userId);
        form.removeAttribute('data-initialized');
    }
    
    // Réutiliser la variable modal déclarée plus haut
    modal = document.getElementById('user-modal');
    if (modal) {
        modal.style.display = 'block';
        initializeUserListeners();
    }
}

// Fermer le modal
function closeUserModal() {
    const modal = document.getElementById('user-modal');
    if (modal) {
        modal.style.display = 'none';
        const form = document.getElementById('user-edit-form');
        if (form) form.reset();
    }
}

// Sauvegarder un utilisateur (ajout ou modification)
async function saveUser(event, userId) {
    event.preventDefault();
    
    const username = document.getElementById('user-username').value.trim();
    const email = document.getElementById('user-email').value.trim();
    const password = document.getElementById('user-password').value;
    const role = document.getElementById('user-role').value;
    
    if (!username || !email || !role) {
        alert(translate("users.fill.required", "Veuillez remplir tous les champs obligatoires"));
        return;
    }
    
    if (!userId && !password) {
        alert(translate("users.password.required", "Le mot de passe est obligatoire pour un nouvel utilisateur"));
        return;
    }
    
    try {
        const cacheBuster = '?v=' + Date.now();
        const xmlResp = await fetch('data/users/users.xml' + cacheBuster);
        if (!xmlResp.ok) throw new Error("Failed to load users.xml");
        const xmlText = await xmlResp.text();
        const xmlDoc = new DOMParser().parseFromString(xmlText, 'application/xml');
        
        // Vérifier l'unicité du username et email
        const users = xmlDoc.getElementsByTagName('user');
        for (let i = 0; i < users.length; i++) {
            const u = users[i];
            const uId = u.getElementsByTagName('id')[0]?.textContent;
            const uName = u.getElementsByTagName('username')[0]?.textContent;
            const uEmail = u.getElementsByTagName('email')[0]?.textContent;
            
            // Si c'est une modification, ignorer l'utilisateur courant
            if (userId && uId === userId) continue;
            
            if (uName === username) {
                alert(translate("users.username.exists", "Ce nom d'utilisateur est déjà utilisé"));
                return;
            }
            if (uEmail === email) {
                alert(translate("users.email.exists", "Cet email est déjà utilisé"));
                return;
            }
        }
        
        if (userId) {
            // Modification
            const user = Array.from(users).find(u => 
                u.getElementsByTagName('id')[0]?.textContent === userId
            );
            
            if (user) {
                user.getElementsByTagName('username')[0].textContent = username;
                user.getElementsByTagName('email')[0].textContent = email;
                if (password) {
                    user.getElementsByTagName('password')[0].textContent = password;
                }
                user.getElementsByTagName('role')[0].textContent = role;
            }
        } else {
            // Ajout
            const usersRoot = xmlDoc.querySelector('users');
            // Trouver le plus grand ID
            let maxId = 0;
            for (let i = 0; i < users.length; i++) {
                const uId = parseInt(users[i].getElementsByTagName('id')[0]?.textContent || '0');
                if (uId > maxId) maxId = uId;
            }
            const newId = maxId + 1;
            
            const newUser = xmlDoc.createElement('user');
            
            const idEl = xmlDoc.createElement('id');
            idEl.textContent = newId.toString();
            const usernameEl = xmlDoc.createElement('username');
            usernameEl.textContent = username;
            const passwordEl = xmlDoc.createElement('password');
            passwordEl.textContent = password;
            const emailEl = xmlDoc.createElement('email');
            emailEl.textContent = email;
            const roleEl = xmlDoc.createElement('role');
            roleEl.textContent = role;
            
            newUser.appendChild(idEl);
            newUser.appendChild(usernameEl);
            newUser.appendChild(passwordEl);
            newUser.appendChild(emailEl);
            newUser.appendChild(roleEl);
            
            usersRoot.appendChild(newUser);
        }
        
        // Convertir en XML string
        const serializer = new XMLSerializer();
        let updatedXml = serializer.serializeToString(xmlDoc);
        
        // Ajouter la déclaration XML si nécessaire
        if (!updatedXml.startsWith('<?xml')) {
            updatedXml = '<?xml version="1.0" encoding="UTF-8"?>\n' + updatedXml;
        }
        
        // S'assurer que la déclaration xmlns est présente
        if (!updatedXml.includes('xmlns:xsi')) {
            const usersTag = updatedXml.indexOf('<users');
            if (usersTag !== -1) {
                const usersTagEnd = updatedXml.indexOf('>', usersTag);
                if (usersTagEnd !== -1) {
                    updatedXml = updatedXml.substring(0, usersTagEnd) + 
                               ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="users.xsd"' + 
                               updatedXml.substring(usersTagEnd);
                }
            }
        }
        
        // Sauvegarder
        const saved = await saveUsersXMLToFile('data/users/users.xml', updatedXml);
        
        if (saved) {
            alert(userId ? translate("users.save.success") : translate("users.add.success"));
        } else {
            alert((userId ? translate("users.save.success") : translate("users.add.success")) + " " + translate("users.server.unavailable"));
        }
        
        closeUserModal();
        await loadUsers();
        
    } catch (e) {
        console.error("Error saving user", e);
        alert(translate("users.save.error", "Erreur lors de la sauvegarde de l'utilisateur"));
    }
}

// Supprimer un utilisateur
async function deleteUser(userId) {
    const currentUser = Auth.currentUser || Auth.checkSession();
    
    // Empêcher la suppression de soi-même
    if (currentUser && currentUser.id === userId) {
        alert(translate("users.delete.self", "Vous ne pouvez pas supprimer votre propre compte !"));
        return;
    }
    
    if (!confirm(translate("users.delete.confirm", "Êtes-vous sûr de vouloir supprimer cet utilisateur ?"))) {
        return;
    }
    
    try {
        const cacheBuster = '?v=' + Date.now();
        const xmlResp = await fetch('data/users/users.xml' + cacheBuster);
        if (!xmlResp.ok) throw new Error("Failed to load users.xml");
        const xmlText = await xmlResp.text();
        const xmlDoc = new DOMParser().parseFromString(xmlText, 'application/xml');
        
        const users = xmlDoc.getElementsByTagName('user');
        const user = Array.from(users).find(u => 
            u.getElementsByTagName('id')[0]?.textContent === userId
        );
        
        if (user) {
            user.parentNode.removeChild(user);
            
            // Convertir en XML string
            const serializer = new XMLSerializer();
            let updatedXml = serializer.serializeToString(xmlDoc);
            
            // Ajouter la déclaration XML si nécessaire
            if (!updatedXml.startsWith('<?xml')) {
                updatedXml = '<?xml version="1.0" encoding="UTF-8"?>\n' + updatedXml;
            }
            
            // S'assurer que la déclaration xmlns est présente
            if (!updatedXml.includes('xmlns:xsi')) {
                const usersTag = updatedXml.indexOf('<users');
                if (usersTag !== -1) {
                    const usersTagEnd = updatedXml.indexOf('>', usersTag);
                    if (usersTagEnd !== -1) {
                        updatedXml = updatedXml.substring(0, usersTagEnd) + 
                                   ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="users.xsd"' + 
                                   updatedXml.substring(usersTagEnd);
                    }
                }
            }
            
            // Sauvegarder
            const saved = await saveUsersXMLToFile('data/users/users.xml', updatedXml);
            
            if (saved) {
                alert(translate("users.delete.success"));
            } else {
                alert(translate("users.delete.success") + " " + translate("users.server.unavailable"));
            }
            
            await loadUsers();
        }
    } catch (e) {
        console.error("Error deleting user", e);
        alert(translate("users.delete.error", "Erreur lors de la suppression de l'utilisateur"));
    }
}

// Exposer globalement
window.editUser = editUser;
window.deleteUser = deleteUser;
window.closeUserModal = closeUserModal;

