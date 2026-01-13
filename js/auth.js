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
            if (!responseUsers.ok) throw new Error("Impossible de charger users.xml");
            const textUsers = await responseUsers.text();
            const parser = new DOMParser();
            const xmlUsers = parser.parseFromString(textUsers, "application/xml");

            // 2. Find User
            // Using XPath for academic demonstration, or simpler querySelector
            const users = xmlUsers.getElementsByTagName('user');
            let foundUser = null;

            for (let i = 0; i < users.length; i++) {
                const u = users[i];
                const uName = u.getElementsByTagName('username')[0].textContent;
                const uPass = u.getElementsByTagName('password')[0].textContent;

                if (uName === username && uPass === password) {
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
                throw new Error("Identifiants incorrects");
            }

            // 3. Load Roles XML to get role details
            const responseRoles = await fetch('data/users/roles.xml');
            if (!responseRoles.ok) throw new Error("Impossible de charger roles.xml");
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
        sessionStorage.removeItem('user');
        window.location.reload();
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
    }
};

// Expose globally
window.Auth = Auth;
