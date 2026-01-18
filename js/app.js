

const App = {
    
    currentLang: localStorage.getItem('selectedLang') || 'fr', // Charge la langue sauvegardée ou 'fr' par défaut
    translations: {},

    init: async function () {
        // 1. Check Auth
        const user = Auth.checkSession();

        // 2. Load Language (Defaut set to 'fr')
        await this.loadLanguage(this.currentLang);

        if (user) {
            this.showDashboard(user);
        } else {
            this.showLogin();
        }

        // Bind Global Events
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', this.handleLogin.bind(this));
        }
    },

    /**
     * unified function to load and switch language
     * @param {string} lang 
     */
    loadLanguage: async function (lang) {
        this.currentLang = lang;
        // Sauvegarder la langue dans localStorage
        localStorage.setItem('selectedLang', lang);
        
        // Update html lang attribute
        document.documentElement.setAttribute('lang', lang);
        // Manage direction for RTL languages
        document.documentElement.dir = (lang === 'ar') ? 'rtl' : 'ltr';

        // Mettre à jour le sélecteur de langue pour refléter la langue actuelle
        const langSelect = document.getElementById('language-select');
        if (langSelect) {
            langSelect.value = lang;
        }

        try {
            const resp = await fetch(`lang/${lang}.json`);
            if (!resp.ok) throw new Error(`Could not load language file: ${lang}.json`);
            this.translations = await resp.json();

            // Apply translations to all elements
            this.applyTranslations();

            // If user is logged in, re-render menu to update its text
            if (Auth.currentUser) {
                await this.renderMenu(Auth.currentUser.role);
            }

        } catch (e) {
            console.error("Language loading failed:", e);
            alert(translate("app.error.language.load", "Erreur de chargement de la langue (vérifiez que vous utilisez un serveur local). \nError: ") + e.message);
        }
    },

    /**
     * Applies loaded translations to the DOM
     */
    applyTranslations: function () {
        // 1. Text Content (data-i18n)
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (this.translations[key]) {
                el.textContent = this.translations[key];
            }
        });

        // 2. Placeholders (data-i18n-placeholder)
        const inputs = document.querySelectorAll('[data-i18n-placeholder]');
        inputs.forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (this.translations[key]) {
                el.setAttribute('placeholder', this.translations[key]);
            }
        });

        // 3. Titles/Tooltips (data-i18n-title)
        const titleElements = document.querySelectorAll('[data-i18n-title]');
        titleElements.forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            if (this.translations[key]) {
                el.setAttribute('title', this.translations[key]);
            }
        });

        // 4. Tooltip text content (data-i18n-tooltip)
        const tooltipElements = document.querySelectorAll('[data-i18n-tooltip]');
        tooltipElements.forEach(el => {
            const key = el.getAttribute('data-i18n-tooltip');
            if (this.translations[key]) {
                el.textContent = this.translations[key];
                console.log(`Tooltip updated: ${key} = ${this.translations[key]}`);
            } else {
                console.warn(`Translation missing for tooltip key: ${key}`);
            }
        });
    },

    switchLang: async function (lang) {
        // Re-use loadLanguage to avoid duplication
        await this.loadLanguage(lang);
    },

    /**
     * Helper function to get translation
     * @param {string} key - Translation key
     * @param {string} defaultValue - Default value if translation not found
     * @returns {string} Translated text
     */
    translate: function (key, defaultValue = '') {
        return this.translations[key] || defaultValue || key;
    },

    handleLogin: async function (e) {
        e.preventDefault();
        const userIn = document.getElementById('username').value;
        const passIn = document.getElementById('password').value;
        const msgEl = document.getElementById('login-message');

        try {
            const user = await Auth.login(userIn, passIn);
            msgEl.textContent = "";
            // Redirection automatique vers dashboard.html après connexion
            window.location.href = "dashboard.html";
        } catch (err) {
            msgEl.textContent = this.translations['login.error'] || "Error";
            msgEl.style.color = 'red';
        }
    },

    showLogin: function () {
        document.getElementById('login-section').style.display = 'block';
        document.getElementById('dashboard-section').style.display = 'none';
        const menuContainer = document.getElementById('main-menu');
        if (menuContainer) menuContainer.innerHTML = '';
    },

    showDashboard: async function (user) {
        const loginSection = document.getElementById('login-section');
        if (loginSection) loginSection.style.display = 'none';
        const dashSection = document.getElementById('dashboard-section');
        if (dashSection) dashSection.style.display = 'block';

        // Update Welcome Message - Afficher uniquement le nom d'utilisateur
        const userRoleDisplay = document.getElementById('user-role-display');
        if (userRoleDisplay) userRoleDisplay.textContent = user.username || user.email || translate("user.label", "Utilisateur");

        // Render Menu via XSLT
        await this.renderMenu(user.role);
        
        // ✅ CHARGER LES NOTIFICATIONS ICI
        if (typeof window.loadNotifications === 'function') {
            setTimeout(() => {
                window.loadNotifications();
            }, 200);
        }
        
        // Réinitialiser les event listeners des notifications après un court délai
        setTimeout(() => {
            if (typeof initNotifications === 'function') {
                initNotifications();
            }
        }, 300);

        // Afficher le message de bienvenue uniquement si on est sur la page d'accueil
        this.toggleWelcomeMessage(!window.location.hash || window.location.hash === '');
    },
    
    toggleWelcomeMessage: function (show) {
        const welcomeSection = document.getElementById('welcome-section');
        if (welcomeSection) {
            welcomeSection.style.display = show ? 'block' : 'none';
        }
    },

    renderMenu: async function (role) {
        try {
            // Load XML
            const xmlResp = await fetch('data/users/menus.xml');
            if (!xmlResp.ok) throw new Error(translate("app.error.load.menus.xml", "Failed to load menus.xml"));
            const xmlText = await xmlResp.text();
            const xmlDoc = new DOMParser().parseFromString(xmlText, 'application/xml');

            // Load XSL
            const xslResp = await fetch('data/users/menus.xsl');
            if (!xslResp.ok) throw new Error(translate("app.error.load.menus.xsl", "Failed to load menus.xsl"));
            const xslText = await xslResp.text();
            const xslDoc = new DOMParser().parseFromString(xslText, 'application/xml');

            // Transform
            if (window.XSLTProcessor) {
                const xsltProcessor = new XSLTProcessor();
                xsltProcessor.importStylesheet(xslDoc);
                xsltProcessor.setParameter(null, 'userRole', role);

                const resultDocument = xsltProcessor.transformToFragment(xmlDoc, document);
                const menuContainer = document.getElementById('main-menu');
                if (menuContainer) {
                    menuContainer.innerHTML = '';
                    menuContainer.appendChild(resultDocument);

                    // IMPORTANT: Re-apply translations to the newly generated menu items
                    this.applyTranslations();
                }
            } else {
                console.error("XSLTProcessor not supported in this browser.");
            }

        } catch (e) {
            console.error("Menu rendering failed", e);
        }
    },

    logout: function () {
        Auth.logout();
    },

    showRegisterModal: function () {
        const modal = document.getElementById('register-modal');
        if (modal) {
            modal.style.display = 'flex';
            // Fermer le modal si on clique en dehors
            modal.onclick = function(e) {
                if (e.target === modal) {
                    App.closeRegisterModal();
    }
};
        }
    },

    closeRegisterModal: function () {
        const modal = document.getElementById('register-modal');
        if (modal) {
            modal.style.display = 'none';
            const form = document.getElementById('register-form');
            if (form) form.reset();
            const msgEl = document.getElementById('register-message');
            if (msgEl) msgEl.textContent = '';
        }
    },

    handleRegister: async function (e) {
        e.preventDefault();
        const username = document.getElementById('reg-username').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const password = document.getElementById('reg-password').value;
        const confirmPassword = document.getElementById('reg-confirm-password').value;
        const msgEl = document.getElementById('register-message');

        // Validation
        if (password !== confirmPassword) {
            msgEl.textContent = this.translations['register.password-mismatch'] || "Les mots de passe ne correspondent pas";
            msgEl.style.color = 'red';
            return;
        }

        if (password.length < 6) {
            msgEl.textContent = this.translations['register.password-short'] || "Le mot de passe doit contenir au moins 6 caractères";
            msgEl.style.color = 'red';
            return;
        }

        if (username.length < 3) {
            msgEl.textContent = this.translations['register.username-short'] || "Le nom d'utilisateur doit contenir au moins 3 caractères";
            msgEl.style.color = 'red';
            return;
        }

        try {
            // Vérifier que Auth.register existe
            if (!Auth || typeof Auth.register !== 'function') {
                console.error('Auth.register is not available. Make sure auth.js is loaded correctly.');
                msgEl.textContent = translate("register.error.unavailable", "Erreur: La fonction d'inscription n'est pas disponible. Veuillez recharger la page.");
                msgEl.style.color = 'red';
                return;
            }
            
            msgEl.textContent = '';
            const role = document.getElementById('reg-role').value;
            const user = await Auth.register(username, email, password, role);
            
            // Afficher un message de succès
            msgEl.textContent = this.translations['register.success'] || "Inscription réussie ! Redirection...";
            msgEl.style.color = 'green';
            
            // Fermer le modal et rediriger après un court délai
            setTimeout(() => {
                this.closeRegisterModal();
                // Optionnel : connecter automatiquement l'utilisateur
                // window.location.href = "dashboard.html";
                // Ou afficher un message pour se connecter
                const loginMsg = document.getElementById('login-message');
                if (loginMsg) {
                    loginMsg.textContent = this.translations['register.login-prompt'] || "Inscription réussie ! Veuillez vous connecter.";
                    loginMsg.style.color = 'green';
                }
            }, 1500);
            
        } catch (err) {
            msgEl.textContent = err.message || this.translations['register.error'] || "Erreur lors de l'inscription";
            msgEl.style.color = 'red';
        }
    }
};

// Exposer closeRegisterModal globalement
window.closeRegisterModal = () => App.closeRegisterModal();

// Start
window.addEventListener('DOMContentLoaded', () => {
    const isLoginPage = !!document.getElementById('login-section');
    const isDashboardPage = !!document.getElementById('dashboard-section');

    if (isLoginPage) {
        const user = Auth.checkSession();
        if (user) {
            window.location.href = "dashboard.html";
        } else {
            const loginForm = document.getElementById('login-form');
            if (loginForm) loginForm.addEventListener('submit', App.handleLogin.bind(App));
            
            const registerBtn = document.getElementById('register-btn');
            if (registerBtn) registerBtn.addEventListener('click', App.showRegisterModal);
            
            const registerForm = document.getElementById('register-form');
            if (registerForm) registerForm.addEventListener('submit', App.handleRegister.bind(App));
            
            App.loadLanguage(App.currentLang);
        }
    }
    
    if (isDashboardPage) {
        const user = Auth.checkSession();
        if (!user) {
            window.location.href = "login.html";
            return;
        }
        App.loadLanguage(App.currentLang);
        App.showDashboard(user);
        
        // Restaurer la page active depuis l'URL hash après actualisation
        const hash = window.location.hash;
        if (hash) {
            // Petit délai pour s'assurer que tout est chargé
            setTimeout(() => {
                window.navigate(hash);
            }, 100);
        } else {
            // Charger la page d'accueil si pas de hash
            setTimeout(() => {
                if (typeof loadHomePage === 'function') {
                    loadHomePage();
                }
            }, 100);
        }
    }
});

// Global helpers for HTML onclick
window.switchLang = (l) => App.switchLang(l);
window.logout = () => App.logout();
// Global translation helper
window.translate = (key, defaultValue) => App.translate(key, defaultValue);

// Fonction globale pour toggle le panel de notifications (appelée depuis onclick HTML)
window.toggleNotificationPanel = function(e) {
    if (e) {
        e.stopPropagation();
        e.preventDefault();
    }
    
    const panel = document.getElementById('notification-panel');
    if (!panel) {
        console.error('[toggleNotificationPanel] Panel non trouvé');
        return;
    }
    
    panel.classList.toggle('hidden');
    const isNowHidden = panel.classList.contains('hidden');
    
    if (!isNowHidden) {
        panel.style.display = 'block';
        panel.style.visibility = 'visible';
        
        if (typeof window.loadNotifications === 'function') {
            window.loadNotifications();
        }
    } else {
        panel.style.display = 'none';
        panel.style.visibility = 'hidden';
    }
};
window.toggleMenu = function() {
    const sidebar = document.getElementById('sidebar-menu');
    if (sidebar) {
        sidebar.classList.toggle('expanded');
    }
};
window.navigate = async (hash) => {
    // Mettre à jour l'URL avec le hash pour garder la page après actualisation
    if (hash) {
        window.location.hash = hash;
    }
    
    // Afficher le message de bienvenue uniquement sur la page d'accueil
    const isHomePage = !hash || hash === '' || hash === '#home';
    App.toggleWelcomeMessage(isHomePage);
    
    // Charger la page d'accueil si on revient à l'accueil
    if (isHomePage) {
        if (typeof loadHomePage === 'function') {
            await loadHomePage();
        } else {
            const workspace = document.getElementById('workspace');
            if (workspace) {
                workspace.innerHTML = '<p>Contenu du module...</p>';
            }
        }
        return;
    }
    
    if (hash === '#logout') {
        App.logout();
        return;
    }
    
    if (hash === '#authors') {
        if (typeof loadAuthors === 'function') {
            await loadAuthors();
        } else {
            console.error("loadAuthors function not found");
        }
        return;
    }
    
    if (hash === '#books') {
        if (typeof loadBooks === 'function') {
            await loadBooks();
        } else {
            console.error("loadBooks function not found");
        }
        return;
    }
    
    if (hash === '#consultation') {
        if (typeof loadConsultation === 'function') {
            await loadConsultation();
        } else {
            console.error("loadConsultation function not found");
        }
        return;
    }
    
    if (hash === '#users') {
        if (typeof loadUsers === 'function') {
            await loadUsers();
        } else {
            console.error("loadUsers function not found");
        }
        return;
    }
    
    if (hash === '#categories') {
        if (typeof loadCategories === 'function') {
            await loadCategories();
        } else {
            console.error("loadCategories function not found");
        }
        return;
    }
    
    if (hash === '#profile') {
        if (typeof loadProfile === 'function') {
            await loadProfile();
        } else {
            console.error("loadProfile function not found");
        }
        return;
    }
    
    // Autres actions de navigation (modules etc)
    console.log("Navigating to", hash);


// Fonction pour initialiser les notifications
function initNotifications() {
    const bell = document.getElementById('notif-bell');
    const panel = document.getElementById('notification-panel');

    if (bell && panel) {
        // Éviter d'ajouter plusieurs fois le même listener
        if (bell.dataset.listenerAttached === 'true') {
            return;
        }
        
        // Marquer comme attaché
        bell.dataset.listenerAttached = 'true';
        
        // Ajouter le nouvel event listener DIRECTEMENT sur la cloche existante
        const clickHandler = async (e) => {
            e.stopPropagation();
            e.preventDefault();
            
            const currentPanel = document.getElementById('notification-panel');
            if (!currentPanel) {
                console.error('[notif-bell] Panel non trouvé');
                return;
            }
            
            currentPanel.classList.toggle('hidden');
            const isNowHidden = currentPanel.classList.contains('hidden');
            
            if (!isNowHidden) {
                currentPanel.style.display = 'block';
                currentPanel.style.visibility = 'visible';
                
                // Recharger les notifications quand on ouvre le panel
                if (typeof window.loadNotifications === 'function') {
                    try {
                        await window.loadNotifications();
                    } catch (error) {
                        console.error('[notif-bell] Erreur lors du chargement des notifications:', error);
                    }
                }
            } else {
                currentPanel.style.display = 'none';
                currentPanel.style.visibility = 'hidden';
            }
        };
        
        // Attacher l'event listener DIRECTEMENT sur la cloche (sans cloner)
        bell.addEventListener('click', clickHandler, true);
        bell.addEventListener('click', clickHandler, false);
        bell.onclick = clickHandler;

        // Fermer le panel si on clique en dehors (une seule fois, pas à chaque appel)
        if (!window.notifClickOutsideListener) {
            let clickOnBell = false;
            
            document.addEventListener('click', (e) => {
                const bell = document.getElementById('notif-bell');
                if (bell && (bell.contains(e.target) || bell === e.target)) {
                    clickOnBell = true;
                    setTimeout(() => { clickOnBell = false; }, 200);
                }
            }, true);
            
            window.notifClickOutsideListener = (e) => {
                if (clickOnBell) return;
                
                const currentBell = document.getElementById('notif-bell');
                const currentPanel = document.getElementById('notification-panel');
                
                if (currentBell && currentPanel) {
                    const clickedBell = currentBell.contains(e.target) || currentBell === e.target;
                    const clickedPanel = currentPanel.contains(e.target) || currentPanel === e.target;
                    
                    if (!clickedBell && !clickedPanel && !currentPanel.classList.contains('hidden')) {
                        currentPanel.classList.add('hidden');
                        currentPanel.style.display = 'none';
                        currentPanel.style.visibility = 'hidden';
                    }
                }
            };
            document.addEventListener('click', window.notifClickOutsideListener);
        }
    }
    
    // Recharger les notifications toutes les 30 secondes
    if (typeof window.loadNotifications === 'function') {
        setInterval(() => {
            const currentPanel = document.getElementById('notification-panel');
            // Recharger seulement si le panel est visible
            if (currentPanel && !currentPanel.classList.contains('hidden')) {
                window.loadNotifications();
            }
        }, 30000); // 30 secondes
    }
}

// Initialiser les notifications au chargement du DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNotifications);
} else {
    // DOM déjà chargé
    initNotifications();
}

// La réinitialisation des notifications est déjà gérée dans App.showDashboard
// Pas besoin de réécrire la fonction ici

};