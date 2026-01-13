/**
 * permissions.js
 * Central point for RBAC (Role-Based Access Control) rules.
 */

const Permissions = {
    // Define resources and allowed actions per role
    // This is a simple matrix.
    rules: {
        admin: {
            canManageBooks: true,
            canManageAuthors: true,
            canManageUsers: true,
            canConsult: true
        },
        auteur: {
            canManageBooks: true,   // uniquement ses propres livres
            canManageAuthors: false,
            canManageUsers: false,
            canConsult: true
        },
        user: {
            canManageBooks: false,
            canManageAuthors: false,
            canManageUsers: false,
            canConsult: true
        }
    },

    /**
     * Check if a role has a specific permission
     * @param {string} role - The user role (admin, user)
     * @param {string} action - The action key (e.g., 'canManageBooks')
     * @returns {boolean}
     */
    check: function (role, action) {
        if (!this.rules[role]) {
            console.error(`Role ${role} not defined in permissions.`);
            return false;
        }
        return !!this.rules[role][action];
    }
};

// Expose globally
window.Permissions = Permissions;
