/**
 * notifications.js
 * Implémentation du pattern Observer pour les notifications
 * - Subject: Sujet observé (lors des actions admin)
 * - NotificationObserver: Observer qui envoie les notifications au serveur
 * - NotificationCenter: Gestionnaire central des notifications (affichage, récupération)
 */

// ===============================
// PATTERN OBSERVER
// ===============================

/**
 * Subject - Sujet observé (pattern Observer)
 */
class Subject {
    constructor() {
        this.observers = [];
    }

    /**
     * Attache un observer
     * @param {Observer} observer 
     */
    attach(observer) {
        if (!this.observers.includes(observer)) {
            this.observers.push(observer);
        }
    }

    /**
     * Détache un observer
     * @param {Observer} observer 
     */
    detach(observer) {
        this.observers = this.observers.filter(obs => obs !== observer);
    }

    /**
     * Notifie tous les observers
     * @param {string} eventType - Type d'événement (BOOK_ADDED, AUTHOR_ADDED, etc.)
     * @param {Object} data - Données de l'événement
     */
    async notify(eventType, data) {
        for (const observer of this.observers) {
            try {
                await observer.update(eventType, data);
            } catch (error) {
                console.error(`Erreur lors de la notification de l'observer:`, error);
            }
        }
    }
}

/**
 * NotificationObserver - Observer qui envoie les notifications au serveur
 */
class NotificationObserver {
    /**
     * Met à jour l'observer avec un événement
     * @param {string} eventType - Type d'événement
     * @param {Object} data - Données de l'événement
     */
    async update(eventType, data) {
        try {
            console.log('NotificationObserver.update appelé avec:', eventType, data);
            
            // Récupérer l'utilisateur actuel
            const user = window.Auth && window.Auth.checkSession ? window.Auth.checkSession() : null;
            const adminUsername = user ? user.username : 'Admin';

            // Construire le message selon le type d'événement
            let message = '';
            let notifType = 'info';

            switch (eventType) {
                case 'BOOK_ADDED':
                    message = `📚 ${adminUsername} a ajouté le livre "${data.title}"`;
                    notifType = 'success';
                    break;
                case 'BOOK_MODIFIED':
                    message = `✏️ ${adminUsername} a modifié le livre "${data.title}"`;
                    notifType = 'info';
                    break;
                case 'BOOK_DELETED':
                    message = `🗑️ ${adminUsername} a supprimé le livre "${data.title}"`;
                    notifType = 'warning';
                    break;
                case 'AUTHOR_ADDED':
                    message = `✍️ ${adminUsername} a ajouté l'auteur "${data.name}"`;
                    notifType = 'success';
                    break;
                case 'AUTHOR_MODIFIED':
                    message = `✏️ ${adminUsername} a modifié l'auteur "${data.name}"`;
                    notifType = 'info';
                    break;
                case 'AUTHOR_DELETED':
                    message = `🗑️ ${adminUsername} a supprimé l'auteur "${data.name}"`;
                    notifType = 'warning';
                    break;
                default:
                    message = data.message || 'Nouvelle notification';
            }

            console.log('Envoi de la notification au serveur:', message);

            // Envoyer la notification à tous les utilisateurs (userId = "all")
            const response = await fetch('http://localhost:8000/add-notification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: 'all', // Notification pour tous les utilisateurs
                    message: message,
                    type: notifType
                })
            });

            if (!response.ok) {
                throw new Error(`Erreur serveur: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            console.log('Réponse du serveur:', result);

            // Rafraîchir les notifications affichées
            if (typeof window.loadNotifications === 'function') {
                setTimeout(() => {
                    window.loadNotifications();
                }, 500);
            }
        } catch (error) {
            console.error('Erreur lors de l\'envoi de la notification:', error);
            console.error('Stack trace:', error.stack);
        }
    }
}

// ===============================
// NOTIFICATION CENTER
// ===============================

/**
 * NotificationCenter - Gestionnaire central des notifications
 */
const NotificationCenter = {
    /**
     * Notifie via le pattern Observer
     * @param {Object} options - Options de notification
     */
    async notify(options) {
        // Si un Subject et un Observer sont déjà créés, les utiliser
        if (!window.notificationSubject) {
            window.notificationSubject = new Subject();
            window.notificationSubject.attach(new NotificationObserver());
        }
        
        // Extraire le type d'événement et les données
        const eventType = options.eventType || 'INFO';
        const data = options.data || { message: options.message };
        
        // Notifier via le Subject
        await window.notificationSubject.notify(eventType, data);
    },

    /**
     * Charge les notifications depuis le serveur
     */
    async loadNotifications() {
        try {
            const user = Auth.checkSession();
            if (!user) {
                return;
            }

            const response = await fetch(`http://localhost:8000/notifications?userId=all`);
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status} ${response.statusText}`);
            }

            const notifications = await response.json();
            
            // Filtrer les notifications pour cet utilisateur ou "all"
            const userNotifications = Array.isArray(notifications) ? notifications.filter(n => 
                n.userId === 'all' || n.userId === user.id || n.userId === user.id.toString()
            ).sort((a, b) => {
                const timestampA = a.timestamp || 0;
                const timestampB = b.timestamp || 0;
                return timestampB - timestampA;
            }) : [];

            this.displayNotifications(userNotifications);
            this.updateNotificationCount(userNotifications);
            
        } catch (error) {
            console.error('[loadNotifications] Erreur:', error);
            // Afficher un message d'erreur dans le panel seulement s'il est visible
            const panel = document.getElementById('notification-panel');
            if (panel && !panel.classList.contains('hidden')) {
                panel.innerHTML = '<p class="empty" style="color: #dc3545;">Erreur: ' + error.message + '</p>';
            }
        }
    },

    /**
     * Affiche les notifications dans le panel
     * @param {Array} notifications 
     */
    displayNotifications(notifications) {
        const panel = document.getElementById('notification-panel');
        if (!panel) {
            console.error('[displayNotifications] Panel de notifications non trouvé');
            return;
        }

        if (!notifications || notifications.length === 0) {
            panel.innerHTML = '<p class="empty">Aucune notification</p>';
            return;
        }

        const recentNotifications = notifications.slice(0, 10);

        const htmlContent = recentNotifications.map(notif => {
            const typeClass = `notif-type-${notif.type || 'info'}`;
            const readClass = notif.read ? 'notif-read' : '';
            const icon = this.getNotificationIcon(notif.type);
            
            return `
                <div class="notification-item ${typeClass} ${readClass}" data-id="${notif.id}">
                    <div class="notif-icon">${icon}</div>
                    <div class="notif-content">
                        <p class="notif-message">${this.escapeHtml(notif.message)}</p>
                        <span class="notif-time">${this.formatTime(notif.timestamp || Date.now())}</span>
                    </div>
                    ${!notif.read ? '<div class="notif-unread-dot"></div>' : ''}
                </div>
            `;
        }).join('');

        panel.innerHTML = htmlContent;

        // Ajouter les event listeners pour marquer comme lues
        panel.querySelectorAll('.notification-item').forEach((item) => {
            item.addEventListener('click', () => {
                const notifId = item.getAttribute('data-id');
                this.markAsRead(notifId);
            });
        });
    },

    /**
     * Met à jour le compteur de notifications non lues
     * @param {Array} notifications 
     */
    updateNotificationCount(notifications) {
        const countEl = document.getElementById('notif-count');
        if (!countEl) return;

        const unreadCount = notifications.filter(n => !n.read).length;
        
        if (unreadCount > 0) {
            countEl.textContent = unreadCount > 99 ? '99+' : unreadCount;
            countEl.style.display = 'block';
        } else {
            countEl.style.display = 'none';
        }
    },

    /**
     * Marque une notification comme lue
     * @param {string} notifId 
     */
    async markAsRead(notifId) {
        // Mettre à jour l'affichage local immédiatement
        const item = document.querySelector(`.notification-item[data-id="${notifId}"]`);
        if (item) {
            item.classList.add('notif-read');
            const dot = item.querySelector('.notif-unread-dot');
            if (dot) dot.remove();
        }
        
        // Envoyer la requête au serveur pour persister le changement
        try {
            const response = await fetch('/mark-notification-read', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id: notifId })
            });

            const result = await response.json();
            if (result.success) {
                console.log(`[markAsRead] Notification ${notifId} marquée comme lue`);
            } else {
                console.warn(`[markAsRead] Échec: ${result.message}`);
            }
        } catch (error) {
            console.error('[markAsRead] Erreur lors de la requête:', error);
        }
        
        // Recharger pour mettre à jour le compteur et l'affichage
        setTimeout(() => this.loadNotifications(), 300);
    },

    /**
     * Récupère l'icône selon le type de notification
     * @param {string} type 
     * @returns {string}
     */
    getNotificationIcon(type) {
        const icons = {
            'success': '✅',
            'info': 'ℹ️',
            'warning': '⚠️',
            'error': '❌'
        };
        return icons[type] || '🔔';
    },

    /**
     * Formate le temps relatif
     * @param {number} timestamp 
     * @returns {string}
     */
    formatTime(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (minutes < 1) return 'À l\'instant';
        if (minutes < 60) return `Il y a ${minutes} min`;
        if (hours < 24) return `Il y a ${hours} h`;
        if (days < 7) return `Il y a ${days} j`;
        return new Date(timestamp).toLocaleDateString('fr-FR');
    },

    /**
     * Échappe le HTML pour éviter les injections
     * @param {string} text 
     * @returns {string}
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Initialiser le Subject global
window.notificationSubject = new Subject();
window.notificationSubject.attach(new NotificationObserver());

// Fonction globale pour charger les notifications (utilisée dans app.js)
window.loadNotifications = () => NotificationCenter.loadNotifications();

// Exposer globalement
window.NotificationCenter = NotificationCenter;
window.Subject = Subject;
window.NotificationObserver = NotificationObserver;
