# Projet Bibliothèque Numérique

## 📋 Description du Projet

Application web de gestion de bibliothèque numérique utilisant **Python** pour le serveur backend, **XML/XSL/XSD** pour le stockage et la transformation des données, et **JavaScript** pour l'interactivité côté client.

## 🔧 Technologies Utilisées

- **Backend**: Python (`http.server`)
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Données**: XML, XSL, XSD
- **Bibliothèques**: jsPDF (génération de PDF), Chart.js (initialement, remplacé par des cartes)

## ✨ Fonctionnalités Implémentées

### 🔐 Authentification et Gestion des Utilisateurs

#### Système de Connexion
- Page de connexion avec validation
- Gestion des sessions avec `sessionStorage`
- Vérification des identifiants depuis `users.xml`
- Chargement des rôles depuis `roles.xml`
- Redirection automatique vers le tableau de bord après connexion

#### Système d'Inscription
- **Modal d'inscription** avec formulaire complet
- Champs du formulaire :
  - Nom d'utilisateur (minimum 3 caractères, unique)
  - Email (validation HTML5, unique)
  - Mot de passe (minimum 6 caractères)
  - Confirmation de mot de passe
  - **Sélection de rôle** (Utilisateur ou Auteur)
- **Validation côté client** :
  - Vérification de l'unicité du username et email
  - Validation du format email
  - Vérification de correspondance des mots de passe
- **Sauvegarde automatique** dans `users.xml` via le serveur Python
- Génération automatique d'ID unique
- Rôle par défaut : `user` (si non spécifié)
- **Internationalisation** : Support FR, EN, AR

### 📚 Gestion des Livres

#### Affichage des Livres
- **Grille de cartes** responsive avec images de couverture
- **Informations affichées** :
  - Titre
  - Auteur(s) (chargé dynamiquement depuis `authors.xml`)
  - **Année de publication** ✨
  - **Catégorie(s)** (chargée dynamiquement depuis `categories.xml`) ✨
  - Description (tronquée à 3 lignes)
  - Disponibilité (Disponible/Indisponible)
  - ISBN (si disponible)

#### Fonctions CRUD (pour admin/auteur)
- **Ajouter un livre** :
  - Formulaire avec validation
  - Upload d'image (conversion en Base64)
  - Sélection d'auteur (chargé depuis `authors.xml`)
  - Génération automatique d'ID unique (L1, L2, etc.)
  - Mise à jour automatique de `livreref` dans `authors.xml`
- **Modifier un livre** :
  - Pré-remplissage du formulaire avec les données existantes
  - Modification de l'auteur (mise à jour bidirectionnelle dans `authors.xml`)
  - Modification de l'image possible
- **Supprimer un livre** :
  - Suppression du livre dans `books.xml`
  - Retrait automatique du `livreref` dans `authors.xml`
- **Téléchargement PDF** :
  - Génération de PDF avec jsPDF
  - Contenu : titre, auteur, image, description
  - Footer avec numéro de page
  - **Enregistrement automatique dans l'historique de téléchargements**

#### Icônes Modernes
- Remplacement des boutons textuels par des **icônes SVG modernes**
- Icônes pour : Détails, Télécharger PDF, Modifier, Supprimer
- **Tooltips en haut** au survol avec animation
- Style cohérent et moderne

### 👥 Gestion des Auteurs

#### Affichage des Auteurs
- **Cartes d'auteurs** avec informations :
  - Nom de l'auteur
  - Pays
  - Liste des livres associés (chargée dynamiquement)
- Affichage du nombre de livres par auteur

#### Fonctions CRUD (pour admin)
- **Ajouter un auteur** :
  - Formulaire simple (nom, pays)
  - Génération automatique d'ID unique (A1, A2, etc.)
- **Modifier un auteur** :
  - Modification du nom et du pays
- **Supprimer un auteur** :
  - Remplacement de l'ID par `"INDISPO"` dans `books.xml` au lieu de supprimer définitivement
  - Affichage "Indisponible" en rouge et italique dans les livres

#### Icônes Modernes
- **Même style d'icônes** que pour les livres (Modifier, Supprimer)
- Tooltips en haut au survol

### 🏠 Page d'Accueil

#### Contenu de la Page d'Accueil
- **Message de bienvenue** et nom d'utilisateur (uniquement sur la page d'accueil)
- **Répartition par catégorie** :
  - **Cartes de statistiques** pour chaque catégorie
  - Affichage : nom de catégorie, nombre de livres, pourcentage
  - Barre de progression visuelle avec pourcentages
  - Icônes emoji pour chaque catégorie
  - Couleurs distinctes par catégorie
- **Derniers livres ajoutés** :
  - Affichage des 6 derniers livres (triés par ID)
  - Cartes avec image, titre, auteur, année, description
- **Suggestions de livres populaires** :
  - 6 livres disponibles avec auteur disponible
  - Mélange aléatoire pour varier les suggestions

### 🔍 Page de Consultation

#### Barre de Recherche
- Recherche dans :
  - **Titres de livres**
  - **Noms d'auteurs**
  - **Descriptions de livres**
- Recherche **insensible à la casse et aux accents**
- Recherche via bouton ou touche Entrée

#### Résultats de Recherche
- **Affichage en grille** avec cartes de livres
- Informations affichées : titre, auteur, année, description, image
- Boutons "Détails" et "Télécharger PDF" pour chaque résultat

#### Historique de Recherche
- **Sauvegarde automatique** des recherches dans `localStorage`
- Affichage des 10 dernières recherches
- Clic sur une recherche pour la relancer
- Bouton pour effacer l'historique

#### Historique de Téléchargements
- **Enregistrement automatique** des téléchargements PDF dans `localStorage`
- Affichage des 20 derniers téléchargements
- Affichage du titre et de la date relative (il y a X minutes/heures/jours)
- Bouton pour effacer l'historique

#### Section de Détails
- **Affichage détaillé** des livres avec :
  - Titre
  - Image de couverture
  - **Auteur(s)** ✨
  - **Année de publication** ✨
  - **Catégorie(s)** ✨
  - Description complète
- Modal avec animation d'apparition
- Bouton de fermeture

### 🎨 Interface Utilisateur

#### Design Moderne
- **Header fixe** avec titre et sélecteur de langue
- **Sidebar fixe** avec menu de navigation
- **Cartes modernes** avec ombres et effets au survol
- **Couleurs cohérentes** : bleu (#131b48, #4c95af) pour le thème principal
- **Animations** : transitions fluides, hover effects
- **Responsive design** : mobile, tablette, desktop

#### Menu de Navigation
- Génération dynamique via XSLT depuis `menus.xml`
- Filtrage par rôle utilisateur
- Icônes SVG pour chaque item du menu
- Navigation via hash (`#authors`, `#books`, `#consultation`, `#home`)
- **Persistance de la page** après actualisation (via URL hash)

#### Affichage du Nom d'Utilisateur
- **Design moderne** sans bordure
- Dégradé de couleurs
- Icône utilisateur
- Effets au survol
- Affichage uniquement sur la page d'accueil

### 🌐 Internationalisation (i18n)

#### Langues Supportées
- **Français** (fr) - par défaut
- **Anglais** (en)
- **Arabe** (ar) - avec support RTL

#### Fonctionnalités
- Sélecteur de langue dans le header
- Sauvegarde de la langue dans `localStorage`
- Traduction de tous les textes de l'interface
- Support des attributs `data-i18n`, `data-i18n-placeholder`, `data-i18n-title`
- Rechargement automatique des traductions après changement de langue

### 💾 Gestion des Données

#### Sauvegarde des Modifications
- **Serveur Python** (`server.py`) pour sauvegarder les fichiers XML
- Endpoint `/save-xml` pour recevoir les modifications
- **Cache-busting** sur tous les fetch XML (`?v=Date.now()`)
- Support CORS pour les requêtes frontend-backend

#### Format des Données
- **books.xml** : Catalogue des livres
- **authors.xml** : Répertoire des auteurs
- **categories.xml** : Catégories de livres
- **users.xml** : Utilisateurs du système
- **roles.xml** : Rôles et permissions

#### Intégrité des Données
- Mise à jour bidirectionnelle entre `books.xml` et `authors.xml`
- Remplacement des références supprimées par "INDISPO" au lieu de suppression
- Validation des données avant sauvegarde

## 📁 Structure du Projet

```
Projet_bibliotheque/
├── css/
│   └── login.css              # Styles principaux
├── js/
│   ├── app.js                 # Application principale
│   ├── auth.js                # Authentification et inscription
│   ├── books.js               # Gestion des livres
│   ├── authors.js             # Gestion des auteurs
│   ├── consultation.js        # Recherche et historiques
│   ├── home.js                # Page d'accueil
│   └── permissions.js         # Gestion des permissions
├── data/
│   ├── books.xml              # Données des livres
│   ├── books.xsl              # Transformation des livres
│   ├── authors.xml            # Données des auteurs
│   ├── authors.xsl            # Transformation des auteurs
│   ├── categories.xml         # Catégories
│   └── users/
│       ├── users.xml          # Utilisateurs
│       ├── roles.xml          # Rôles
│       ├── menus.xml          # Structure du menu
│       └── menus.xsl          # Transformation du menu
├── lang/
│   ├── fr.json                # Traductions français
│   ├── en.json                # Traductions anglais
│   └── ar.json                # Traductions arabe
├── images/                    # Images des livres
├── login.html                 # Page de connexion
├── dashboard.html             # Tableau de bord
├── server.py                  # Serveur Python backend
└── README.md                  # Ce fichier
```

## 🚀 Démarrage

### Prérequis
- Python 3.x
- Navigateur web moderne (Chrome, Firefox, Edge, Safari)

### Installation

1. Démarrer le serveur Python :
```bash
python server.py
```

2. Ouvrir le navigateur et accéder à :
```
http://localhost:8000/login.html
```

### Comptes par Défaut

- **Admin** : `admin` / `admin123`
- **Utilisateur** : `user` / `user123`
- **Auteur** : `auteur` / `auteur123`

## 🔑 Rôles et Permissions

- **Admin** : Accès complet (livres, auteurs, utilisateurs)
- **Auteur** : Gestion des livres + consultation
- **Utilisateur** : Consultation uniquement

## 📝 Notes Techniques

- Les modifications XML sont sauvegardées via POST vers `/save-xml`
- Les fichiers XML sont validés avec leurs schémas XSD correspondants
- L'enrichissement des données (auteurs, catégories) est fait côté client avec JavaScript
- La persistance des données utilise `localStorage` pour les historiques
- La gestion de session utilise `sessionStorage` pour l'authentification

## 🎯 Fonctionnalités Clés Ajoutées

1. ✅ **Système d'inscription complet** avec sélection de rôle
2. ✅ **Page d'accueil** avec statistiques par catégorie et suggestions
3. ✅ **Page de consultation** avec recherche avancée et historiques
4. ✅ **Affichage de l'année et catégorie** dans les cartes de livres
5. ✅ **Icônes modernes** pour toutes les actions (remplacement des boutons textuels)
6. ✅ **Section de détails enrichie** avec auteur, année et catégorie
7. ✅ **Historique de recherche et téléchargements** avec localStorage
8. ✅ **Design moderne et responsive** pour toutes les pages
9. ✅ **Gestion bidirectionnelle** des données entre livres et auteurs
10. ✅ **Support multilingue** complet (FR, EN, AR)

---