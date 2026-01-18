// Fonction pour charger et afficher le profil de l'utilisateur connecté
async function loadProfile() {
    try {
        const currentUser = Auth.currentUser || Auth.checkSession();
        if (!currentUser) {
            window.location.href = "login.html";
            return;
        }

        const cacheBuster = '?v=' + Date.now();
        const xmlResp = await fetch('data/users/users.xml' + cacheBuster);
        if (!xmlResp.ok) throw new Error("Failed to load users.xml");
        const xmlText = await xmlResp.text();
        const xmlDoc = new DOMParser().parseFromString(xmlText, 'application/xml');

        // Trouver l'utilisateur connecté
        const users = xmlDoc.getElementsByTagName('user');
        let userElement = null;
        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            const userId = user.getElementsByTagName('id')[0]?.textContent;
            if (userId === currentUser.id) {
                userElement = user;
                break;
            }
        }

        if (!userElement) {
            throw new Error("Utilisateur non trouvé");
        }

        // Extraire les données de profil
        const profile = userElement.getElementsByTagName('profile')[0];
        const profileData = {
            nom: profile?.getElementsByTagName('nom')[0]?.textContent || '',
            prenom: profile?.getElementsByTagName('prenom')[0]?.textContent || '',
            telephone: profile?.getElementsByTagName('telephone')[0]?.textContent || '',
            dateNaissance: profile?.getElementsByTagName('dateNaissance')[0]?.textContent || '',
            bio: profile?.getElementsByTagName('bio')[0]?.textContent || ''
        };

        const username = userElement.getElementsByTagName('username')[0]?.textContent || '';
        const email = userElement.getElementsByTagName('email')[0]?.textContent || '';
        const role = userElement.getElementsByTagName('role')[0]?.textContent || '';

        // Charger le nom du rôle
        const rolesResp = await fetch('data/users/roles.xml' + cacheBuster);
        let roleName = role;
        if (rolesResp.ok) {
            const rolesText = await rolesResp.text();
            const rolesDoc = new DOMParser().parseFromString(rolesText, 'application/xml');
            const roles = rolesDoc.getElementsByTagName('role');
            for (let i = 0; i < roles.length; i++) {
                const r = roles[i];
                const rId = r.getElementsByTagName('id')[0]?.textContent;
                if (rId === role) {
                    roleName = r.getElementsByTagName('name')[0]?.textContent;
                    break;
                }
            }
        }

        // Afficher le profil
        const workspace = document.getElementById('workspace');
        if (workspace) {
            workspace.innerHTML = `
                <div class="profile-container">
                    <style>
                        .profile-container {
                            max-width: 900px;
                            margin: 0 auto;
                            padding: 20px;
                        }
                        .profile-header {
                            background: linear-gradient(135deg, #4c95af 0%, #131b48 100%);
                            color: white;
                            padding: 30px;
                            border-radius: 10px;
                            margin-bottom: 30px;
                            text-align: center;
                            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                        }
                        .profile-avatar {
                            width: 120px;
                            height: 120px;
                            border-radius: 50%;
                            background: white;
                            color: #4c95af;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 3rem;
                            font-weight: bold;
                            margin: 0 auto 15px;
                            border: 5px solid white;
                            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
                        }
                        .profile-name {
                            font-size: 2rem;
                            font-weight: 700;
                            margin-bottom: 10px;
                        }
                        .profile-username {
                            font-size: 1.1rem;
                            opacity: 0.9;
                            margin-bottom: 5px;
                        }
                        .profile-role {
                            display: inline-block;
                            padding: 6px 15px;
                            border-radius: 20px;
                            background: rgba(255, 255, 255, 0.2);
                            font-size: 0.9rem;
                            margin-top: 10px;
                        }
                        .profile-content {
                            display: grid;
                            grid-template-columns: 1fr 1fr;
                            gap: 20px;
                            margin-bottom: 20px;
                        }
                        .profile-section {
                            background: white;
                            padding: 25px;
                            border-radius: 8px;
                            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                        }
                        .profile-section h3 {
                            color: #131b48;
                            margin-bottom: 20px;
                            font-size: 1.3rem;
                            border-bottom: 2px solid #4c95af;
                            padding-bottom: 10px;
                        }
                        .profile-info {
                            margin-bottom: 15px;
                        }
                        .profile-info-label {
                            font-weight: 600;
                            color: #6c757d;
                            font-size: 0.9rem;
                            margin-bottom: 5px;
                        }
                        .profile-info-value {
                            color: #131b48;
                            font-size: 1rem;
                            word-break: break-word;
                        }
                        .profile-info-value:empty::before {
                            content: "Non renseigné";
                            color: #adb5bd;
                            font-style: italic;
                        }
                        .profile-bio {
                            grid-column: 1 / -1;
                        }
                        .profile-bio .profile-info-value {
                            line-height: 1.6;
                            white-space: pre-wrap;
                        }
                        .profile-actions {
                            text-align: center;
                            margin-top: 30px;
                        }
                        .btn-edit-profile {
                            background: #4c95af;
                            color: white;
                            border: none;
                            padding: 12px 30px;
                            border-radius: 6px;
                            font-size: 1rem;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.3s ease;
                        }
                        .btn-edit-profile:hover {
                            background: #3a7a8f;
                            transform: translateY(-2px);
                            box-shadow: 0 4px 8px rgba(76, 149, 175, 0.3);
                        }
                        @media (max-width: 768px) {
                            .profile-content {
                                grid-template-columns: 1fr;
                            }
                        }
                    </style>

                    <div class="profile-header">
                        <div class="profile-avatar">${(profileData.prenom || username).charAt(0).toUpperCase()}${(profileData.nom || '').charAt(0).toUpperCase() || username.charAt(1).toUpperCase()}</div>
                        <div class="profile-name">${profileData.prenom && profileData.nom ? `${profileData.prenom} ${profileData.nom}` : profileData.nom || profileData.prenom || username}</div>
                        <div class="profile-username">@${username}</div>
                        <div class="profile-role">${roleName}</div>
                    </div>

                    <div class="profile-content">
                        <div class="profile-section">
                            <h3 data-i18n="profile.contact">Informations de contact</h3>
                            <div class="profile-info">
                                <div class="profile-info-label" data-i18n="profile.email">Email</div>
                                <div class="profile-info-value">${email}</div>
                            </div>
                            <div class="profile-info">
                                <div class="profile-info-label" data-i18n="profile.phone">Téléphone</div>
                                <div class="profile-info-value">${profileData.telephone}</div>
                            </div>
                        </div>

                        <div class="profile-section">
                            <h3 data-i18n="profile.personal">Informations personnelles</h3>
                            <div class="profile-info">
                                <div class="profile-info-label" data-i18n="profile.name">Nom</div>
                                <div class="profile-info-value">${profileData.nom}</div>
                            </div>
                            <div class="profile-info">
                                <div class="profile-info-label" data-i18n="profile.firstname">Prénom</div>
                                <div class="profile-info-value">${profileData.prenom}</div>
                            </div>
                            <div class="profile-info">
                                <div class="profile-info-label" data-i18n="profile.birthdate">Date de naissance</div>
                                <div class="profile-info-value">${profileData.dateNaissance}</div>
                            </div>
                        </div>

                        <div class="profile-section profile-bio">
                            <h3 data-i18n="profile.bio">Biographie</h3>
                            <div class="profile-info">
                                <div class="profile-info-value">${profileData.bio}</div>
                            </div>
                        </div>
                    </div>

                    <div class="profile-actions">
                        <button class="btn-edit-profile" onclick="openEditProfileModal()" data-i18n="profile.edit">Modifier mon profil</button>
                    </div>
                </div>
            `;
        }

        // Initialiser les listeners si nécessaire
        initializeProfileListeners();
        
        // Appliquer les traductions aux nouveaux éléments créés
        if (App && App.applyTranslations) {
            App.applyTranslations();
        }
    } catch (e) {
        console.error("Error loading profile", e);
        const workspace = document.getElementById('workspace');
        if (workspace) {
            workspace.innerHTML = `<p style="color: red;">${translate("profile.load.error", "Erreur lors du chargement du profil")}.</p>`;
        }
    }
}

// Fonction pour sauvegarder le profil
async function saveProfileXML(filePath, xmlContent) {
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

// Ouvrir le modal d'édition du profil
async function openEditProfileModal() {
    const currentUser = Auth.currentUser || Auth.checkSession();
    if (!currentUser) return;

    try {
        const cacheBuster = '?v=' + Date.now();
        const xmlResp = await fetch('data/users/users.xml' + cacheBuster);
        if (!xmlResp.ok) throw new Error("Failed to load users.xml");
        const xmlText = await xmlResp.text();
        const xmlDoc = new DOMParser().parseFromString(xmlText, 'application/xml');

        const users = xmlDoc.getElementsByTagName('user');
        let userElement = null;
        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            const userId = user.getElementsByTagName('id')[0]?.textContent;
            if (userId === currentUser.id) {
                userElement = user;
                break;
            }
        }

        if (!userElement) {
            throw new Error("Utilisateur non trouvé");
        }

        const profile = userElement.getElementsByTagName('profile')[0];
        const profileData = {
            nom: profile?.getElementsByTagName('nom')[0]?.textContent || '',
            prenom: profile?.getElementsByTagName('prenom')[0]?.textContent || '',
            telephone: profile?.getElementsByTagName('telephone')[0]?.textContent || '',
            dateNaissance: profile?.getElementsByTagName('dateNaissance')[0]?.textContent || '',
            bio: profile?.getElementsByTagName('bio')[0]?.textContent || ''
        };

        const username = userElement.getElementsByTagName('username')[0]?.textContent || '';
        const email = userElement.getElementsByTagName('email')[0]?.textContent || '';

        showProfileModal(username, email, profileData);
    } catch (e) {
        console.error("Error loading profile for edit", e);
        alert(translate("profile.load.error.edit", "Erreur lors du chargement du profil"));
    }
}

// Afficher le modal de profil
function showProfileModal(username, email, profileData) {
    let modal = document.getElementById('profile-modal');
    if (!modal) {
        const modalHTML = `
            <div id="profile-modal" class="profile-modal" style="display: none;">
                <div class="modal-content-profile">
                    <div class="modal-header-profile">
                        <h3>Modifier mon profil</h3>
                        <span class="close-profile-modal">&times;</span>
                    </div>
                    <form id="profile-edit-form" class="profile-edit-form">
                        <div class="form-group">
                            <label>Nom d'utilisateur:</label>
                            <input type="text" id="profile-username" readonly>
                        </div>
                        <div class="form-group">
                            <label>Email:</label>
                            <input type="email" id="profile-email" required>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Nom:</label>
                                <input type="text" id="profile-nom">
                            </div>
                            <div class="form-group">
                                <label>Prénom:</label>
                                <input type="text" id="profile-prenom">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Téléphone:</label>
                            <input type="tel" id="profile-telephone" data-i18n-placeholder="profile.phone.placeholder">
                        </div>
                        <div class="form-group">
                            <label>Date de naissance:</label>
                            <input type="date" id="profile-dateNaissance">
                        </div>
                        <div class="form-group">
                            <label>Biographie:</label>
                            <textarea id="profile-bio" rows="4" data-i18n-placeholder="profile.bio.placeholder"></textarea>
                        </div>
                        <div class="modal-buttons-profile">
                            <button type="button" class="btn-cancel-profile" onclick="closeProfileModal()" data-i18n="common.cancel">Annuler</button>
                            <button type="submit" class="btn-submit-profile" data-i18n="common.save">Enregistrer</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        modal = document.getElementById('profile-modal');
        // Appliquer les traductions après la création du modal
        if (App && App.applyTranslations) {
            App.applyTranslations();
        }
    }

    // Remplir le formulaire
    document.getElementById('profile-username').value = username;
    document.getElementById('profile-email').value = email;
    document.getElementById('profile-nom').value = profileData.nom || '';
    document.getElementById('profile-prenom').value = profileData.prenom || '';
    document.getElementById('profile-telephone').value = profileData.telephone || '';
    document.getElementById('profile-dateNaissance').value = profileData.dateNaissance || '';
    document.getElementById('profile-bio').value = profileData.bio || '';

    // Réinitialiser le formulaire
    const form = document.getElementById('profile-edit-form');
    if (form) {
        form.removeAttribute('data-initialized');
    }

    modal.style.display = 'block';
    initializeProfileListeners();
}

// Fermer le modal
function closeProfileModal() {
    const modal = document.getElementById('profile-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Initialiser les event listeners
function initializeProfileListeners() {
    // Bouton de fermeture
    const closeBtn = document.querySelector('.close-profile-modal');
    if (closeBtn && !closeBtn.hasAttribute('data-initialized')) {
        closeBtn.setAttribute('data-initialized', 'true');
        closeBtn.addEventListener('click', closeProfileModal);
    }

    // Formulaire de profil
    const form = document.getElementById('profile-edit-form');
    if (form && !form.hasAttribute('data-initialized')) {
        form.setAttribute('data-initialized', 'true');
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            await saveProfile(e);
        });
    }

    // Fermer en cliquant sur l'overlay
    const modal = document.getElementById('profile-modal');
    if (modal) {
        modal.onclick = function(e) {
            if (e.target === modal) {
                closeProfileModal();
            }
        };
    }
}

// Sauvegarder le profil
async function saveProfile(event) {
    event.preventDefault();
    
    const currentUser = Auth.currentUser || Auth.checkSession();
    if (!currentUser) {
        alert(translate("profile.user.not.connected", "Erreur : Utilisateur non connecté"));
        return;
    }

    const email = document.getElementById('profile-email').value.trim();
    const nom = document.getElementById('profile-nom').value.trim();
    const prenom = document.getElementById('profile-prenom').value.trim();
    const telephone = document.getElementById('profile-telephone').value.trim();
    const dateNaissance = document.getElementById('profile-dateNaissance').value;
    const bio = document.getElementById('profile-bio').value.trim();

    if (!email) {
        alert(translate("profile.email.required", "L'email est obligatoire"));
        return;
    }

    try {
        const cacheBuster = '?v=' + Date.now();
        const xmlResp = await fetch('data/users/users.xml' + cacheBuster);
        if (!xmlResp.ok) throw new Error("Failed to load users.xml");
        const xmlText = await xmlResp.text();
        const xmlDoc = new DOMParser().parseFromString(xmlText, 'application/xml');

        // Trouver l'utilisateur
        const users = xmlDoc.getElementsByTagName('user');
        let userElement = null;
        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            const userId = user.getElementsByTagName('id')[0]?.textContent;
            if (userId === currentUser.id) {
                userElement = user;
                break;
            }
        }

        if (!userElement) {
            throw new Error("Utilisateur non trouvé");
        }

        // Vérifier l'unicité de l'email (sauf pour l'utilisateur actuel)
        const allUsers = xmlDoc.getElementsByTagName('user');
        for (let i = 0; i < allUsers.length; i++) {
            const u = allUsers[i];
            const uId = u.getElementsByTagName('id')[0]?.textContent;
            const uEmail = u.getElementsByTagName('email')[0]?.textContent;
            if (uId !== currentUser.id && uEmail === email) {
                alert(translate("profile.email.exists", "Cet email est déjà utilisé par un autre utilisateur"));
                return;
            }
        }

        // Mettre à jour l'email
        userElement.getElementsByTagName('email')[0].textContent = email;

        // Trouver ou créer l'élément profile
        let profile = userElement.getElementsByTagName('profile')[0];
        if (!profile) {
            profile = xmlDoc.createElement('profile');
            userElement.appendChild(profile);
        }

        // Fonction helper pour créer/mettre à jour un élément
        function updateProfileElement(parent, tagName, value) {
            let el = parent.getElementsByTagName(tagName)[0];
            if (!el) {
                el = xmlDoc.createElement(tagName);
                parent.appendChild(el);
            }
            el.textContent = value;
        }

        // Mettre à jour les champs de profil
        updateProfileElement(profile, 'nom', nom);
        updateProfileElement(profile, 'prenom', prenom);
        updateProfileElement(profile, 'telephone', telephone);
        updateProfileElement(profile, 'dateNaissance', dateNaissance);
        updateProfileElement(profile, 'bio', bio);

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
        const saved = await saveProfileXML('data/users/users.xml', updatedXml);
        
        if (saved) {
            alert(translate("profile.save.success", "Profil modifié avec succès !"));
            closeProfileModal();
            // Recharger le profil
            await loadProfile();
            // Mettre à jour les informations de session
            const updatedUser = Auth.checkSession();
            if (updatedUser) {
                updatedUser.email = email;
                sessionStorage.setItem('user', JSON.stringify(updatedUser));
            }
        } else {
            alert(translate("profile.save.error.server", "Erreur lors de la sauvegarde du profil. Les modifications seront perdues au rechargement."));
        }
    } catch (e) {
        console.error("Error saving profile", e);
        alert(translate("profile.save.error", "Erreur lors de la sauvegarde du profil"));
    }
}

// Exposer globalement
window.openEditProfileModal = openEditProfileModal;
window.closeProfileModal = closeProfileModal;

