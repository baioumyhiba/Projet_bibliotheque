const App = {
    currentLang: 'fr',
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
        // Update html lang attribute
        document.documentElement.setAttribute('lang', lang);
        // Manage direction for RTL languages
        document.documentElement.dir = (lang === 'ar') ? 'rtl' : 'ltr';

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
            alert("Erreur de chargement de la langue (vérifiez que vous utilisez un serveur local). \nError: " + e.message);
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
    },

    switchLang: async function (lang) {
        // Re-use loadLanguage to avoid duplication
        await this.loadLanguage(lang);
    },

    handleLogin: async function (e) {
        e.preventDefault();
        const userIn = document.getElementById('username').value;
        const passIn = document.getElementById('password').value;
        const msgEl = document.getElementById('login-message');

        try {
            const user = await Auth.login(userIn, passIn);
            msgEl.textContent = "";
            this.showDashboard(user);
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
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('dashboard-section').style.display = 'block';

        // Update Welcome Message
        const roleLabel = this.translations['role.label'] || "Role: ";
        document.getElementById('user-role-display').textContent = roleLabel + (user.roleName || user.role);

        // Render Menu via XSLT
        await this.renderMenu(user.role);
    },

    renderMenu: async function (role) {
        try {
            // Load XML
            const xmlResp = await fetch('data/users/menus.xml');
            if (!xmlResp.ok) throw new Error("Failed to load menus.xml");
            const xmlText = await xmlResp.text();
            const xmlDoc = new DOMParser().parseFromString(xmlText, 'application/xml');

            // Load XSL
            const xslResp = await fetch('data/users/menus.xsl');
            if (!xslResp.ok) throw new Error("Failed to load menus.xsl");
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
    }
};

// Start
window.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Global helpers for HTML onclick
window.switchLang = (l) => App.switchLang(l);
window.logout = () => App.logout();
window.navigate = (hash) => {
    // Determine access logic or simple show/hide
    console.log("Navigating to", hash);
};
