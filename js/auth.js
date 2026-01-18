/**
 * auth.js
 * Handles login, XML parsing for users/roles, and session management.
 */

const Auth = {
    currentUser: null,

    /**
     * Attempt to log in the user.
     * @param {string} username 
     * @param {string} password 
     * @returns {Promise<Object>} The user object or throws error.
     */
    login: async function (username, password) {
        try {
            // 1. Load Users XML
            const responseUsers = await fetch('data/users/users.xml');
            if (!responseUsers.ok) throw new Error(translate("auth.error.load.users", "Impossible de charger users.xml"));
            const textUsers = await responseUsers.text();
            const parser = new DOMParser();
            const xmlUsers = parser.parseFromString(textUsers, "application/xml");

            // 2. Find User
            // Using XPath for academic demonstration, or simpler querySelector
            const users = xmlUsers.getElementsByTagName('user');
            let foundUser = null;

            for (let i = 0; i < users.length; i++) {
                const u = users[i];
                const usernameEl = u.getElementsByTagName('username')[0];
                const passwordEl = u.getElementsByTagName('password')[0];
                
                if (!usernameEl || !passwordEl) continue;
                
                const uName = usernameEl.textContent.trim();
                const uPass = passwordEl.textContent.trim();

                if (uName === username.trim() && uPass === password.trim()) {
                    foundUser = {
                        id: u.getElementsByTagName('id')[0].textContent,
                        username: uName,
                        email: u.getElementsByTagName('email')[0].textContent,
                        role: u.getElementsByTagName('role')[0].textContent
                    };
                    break;
                }
            }

            if (!foundUser) {
                throw new Error(translate("auth.error.invalid.credentials", "Identifiants incorrects"));
            }

            // 3. Load Roles XML to get role details
            const responseRoles = await fetch('data/users/roles.xml');
            if (!responseRoles.ok) throw new Error(translate("auth.error.load.roles", "Impossible de charger roles.xml"));
            const textRoles = await responseRoles.text();
            const xmlRoles = parser.parseFromString(textRoles, "application/xml");

            const roles = xmlRoles.getElementsByTagName('role');
            let roleName = foundUser.role; // Fallback

            for (let i = 0; i < roles.length; i++) {
                const r = roles[i];
                const rId = r.getElementsByTagName('id')[0].textContent;
                if (rId === foundUser.role) {
                    roleName = r.getElementsByTagName('name')[0].textContent;
                    break;
                }
            }

            foundUser.roleName = roleName;
            this.currentUser = foundUser;

            // Save to session
            sessionStorage.setItem('user', JSON.stringify(foundUser));

            return foundUser;

        } catch (error) {
            console.error("Login Error:", error);
            throw error;
        }
    },

    /**
     * Log out the current user.
     */
    logout: function () {
        this.currentUser = null;
        sessionStorage.clear(); // Efface TOUTE session utilisateur (propre !)
        // Redirection automatique vers login.html après déconnexion
        window.location.href = 'login.html';
    },

    /**
     * Check if user is already logged in (session).
     */
    checkSession: function () {
        const stored = sessionStorage.getItem('user');
        if (stored) {
            this.currentUser = JSON.parse(stored);
            return this.currentUser;
        }
        return null;
    },

    /**
     * Register a new user.
     * @param {string} username 
     * @param {string} email 
     * @param {string} password 
     * @param {string} role - Le rôle de l'utilisateur (par défaut: 'user')
     * @returns {Promise<Object>} The new user object or throws error.
     */
    register: async function (username, email, password, role = 'user') {
        try {
            // 1. Load Users XML
            const responseUsers = await fetch('data/users/users.xml?v=' + Date.now());
            if (!responseUsers.ok) throw new Error(translate("auth.error.load.users", "Impossible de charger users.xml"));
            const textUsers = await responseUsers.text();
            const parser = new DOMParser();
            const xmlUsers = parser.parseFromString(textUsers, "application/xml");

            // 2. Vérifier si le username existe déjà
            const users = xmlUsers.getElementsByTagName('user');
            for (let i = 0; i < users.length; i++) {
                const u = users[i];
                const uName = u.getElementsByTagName('username')[0].textContent;
                const uEmail = u.getElementsByTagName('email')[0].textContent;
                
                if (uName === username) {
                    throw new Error(translate("auth.error.username.exists", "Ce nom d'utilisateur est déjà utilisé"));
                }
                if (uEmail === email) {
                    throw new Error(translate("auth.error.email.exists", "Cet email est déjà utilisé"));
                }
            }

            // 3. Trouver le prochain ID disponible
            let maxId = 0;
            for (let i = 0; i < users.length; i++) {
                const userId = parseInt(users[i].getElementsByTagName('id')[0].textContent);
                if (userId > maxId) {
                    maxId = userId;
                }
            }
            const newId = maxId + 1;

            // 4. Valider le rôle (seuls 'user' et 'auteur' sont autorisés pour l'inscription)
            const allowedRoles = ['user', 'auteur'];
            if (!allowedRoles.includes(role)) {
                role = 'user'; // Rôle par défaut si invalide
            }

            // 5. Créer le nouvel utilisateur avec le rôle choisi
            const newUser = xmlUsers.createElement('user');
            
            const idEl = xmlUsers.createElement('id');
            idEl.textContent = newId;
            newUser.appendChild(idEl);
            
            const usernameEl = xmlUsers.createElement('username');
            usernameEl.textContent = username;
            newUser.appendChild(usernameEl);
            
            const passwordEl = xmlUsers.createElement('password');
            passwordEl.textContent = password;
            newUser.appendChild(passwordEl);
            
            const emailEl = xmlUsers.createElement('email');
            emailEl.textContent = email;
            newUser.appendChild(emailEl);
            
            const roleEl = xmlUsers.createElement('role');
            roleEl.textContent = role; // Utiliser le rôle sélectionné
            newUser.appendChild(roleEl);

            // 6. Ajouter le nouvel utilisateur au XML
            const root = xmlUsers.documentElement;
            root.appendChild(newUser);

            // 7. Convertir en string XML avec formatage correct
            const serializer = new XMLSerializer();
            let updatedXml = serializer.serializeToString(xmlUsers);
            
            // S'assurer que la déclaration XML est présente avec l'encodage UTF-8
            if (!updatedXml.includes('<?xml')) {
                updatedXml = '<?xml version="1.0" encoding="UTF-8"?>\n' + updatedXml;
            } else {
                // Remplacer la déclaration XML si nécessaire pour inclure l'encodage
                updatedXml = updatedXml.replace(/<\?xml[^>]*\?>/, '<?xml version="1.0" encoding="UTF-8"?>');
            }
            
            // S'assurer que la déclaration xmlns est présente
            if (!updatedXml.includes('xmlns:xsi')) {
                const usersTag = updatedXml.indexOf('<users');
                if (usersTag !== -1) {
                    const usersTagEnd = updatedXml.indexOf('>', usersTag);
                    if (usersTagEnd !== -1) {
                        const usersOpenTag = updatedXml.substring(usersTag, usersTagEnd);
                        if (!usersOpenTag.includes('xmlns:xsi')) {
                            updatedXml = updatedXml.substring(0, usersTagEnd) + 
                                       ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="users.xsd"' + 
                                       updatedXml.substring(usersTagEnd);
                        }
                    }
                }
            }

            // 8. Sauvegarder via le serveur
            const saveResponse = await fetch('http://localhost:8000/save-xml', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    file: 'data/users/users.xml',
                    xml: updatedXml
                })
            });

            if (!saveResponse.ok) {
                const errorText = await saveResponse.text();
                throw new Error(translate("auth.error.save", "Erreur lors de la sauvegarde: ") + errorText);
            }

            // 9. Retourner les informations du nouvel utilisateur
            return {
                id: newId.toString(),
                username: username,
                email: email,
                role: role
            };

        } catch (error) {
            console.error("Register Error:", error);
            throw error;
        }
    }
};

// Expose globally
window.Auth = Auth;
