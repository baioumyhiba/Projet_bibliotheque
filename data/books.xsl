<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

<xsl:variable name="isAdmin" select="'true'"/>

<xsl:template match="/">
<div class="books-wrapper">
<style>
    .books-wrapper {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        padding: 0;
        width: 100%;
        min-height: 400px;
    }

    .books-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 30px;
        padding-bottom: 20px;
        border-bottom: 2px solid #e1e5eb;
    }

    .books-header h1 {
        color: #131b48;
        font-size: 2.2rem;
        font-weight: 700;
        margin: 0;
    }

    .btn-add-book {
        background: linear-gradient(135deg, #4c95af 0%, #3a7a8f 100%);
        color: white;
        border: none;
        padding: 12px 0px;
        border-radius: 8px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(76, 149, 175, 0.3);
        width: 100%;
        max-width: 200px;
    }

    .btn-add-book:hover {
        box-shadow: 0 6px 16px rgba(76, 149, 175, 0.4);
    }

    .btn-add-book:active {
        transform: translateY(0);
    }

    .books-container {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 25px;
        margin-top: 20px;
        width: 100%;
        min-height: 200px;
    }

    .book-card {
        background: #ffffff;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        transition: all 0.3s ease;
        border: 1px solid #e1e5eb;
        display: flex;
        flex-direction: column;
    }

    .book-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    }

    .book-image-container {
        position: relative;
        width: 100%;
        height: 280px;
        overflow: hidden;
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    }

    .book-card img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.3s ease;
    }

    .book-card:hover img {
        transform: scale(1.05);
    }

    .book-content {
        padding: 20px;
        flex-grow: 1;
        display: flex;
        flex-direction: column;
    }

    .book-title {
        font-size: 1.2rem;
        font-weight: 700;
        color: #131b48;
        margin: 0 0 10px 0;
        line-height: 1.4;
        min-height: 50px;
    }

    .book-author {
        font-size: 0.95rem;
        color: #4c95af;
        margin-bottom: 12px;
        font-weight: 500;
    }

    .book-desc {
        font-size: 0.9rem;
        color: #6c757d;
        margin-bottom: 15px;
        line-height: 1.5;
        flex-grow: 1;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    .book-info {
        font-size: 0.85rem;
        margin-bottom: 15px;
        padding: 10px;
        background: #f8f9fa;
        border-radius: 6px;
        border-left: 3px solid #4c95af;
    }

    .book-info-item {
        margin-bottom: 5px;
    }

    .book-info-item:last-child {
        margin-bottom: 0;
    }

    .available {
        color: #28a745;
        font-weight: 600;
        display: inline-flex;
        align-items: center;
        gap: 5px;
    }

    .available::before {
        content: "✓";
        background: #28a745;
        color: white;
        border-radius: 50%;
        width: 18px;
        height: 18px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
    }

    .not-available {
        color: #dc3545;
        font-weight: 600;
        display: inline-flex;
        align-items: center;
        gap: 5px;
    }

    .not-available::before {
        content: "✗";
        background: #dc3545;
        color: white;
        border-radius: 50%;
        width: 18px;
        height: 18px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
    }

    .book-actions {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        margin-top: auto;
        justify-content: center;
        align-items: center;
    }

    .action-icon-btn {
        width: 44px;
        height: 44px;
        border: none;
        cursor: pointer;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        position: relative;
        background: #f8f9fa;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .action-icon-btn svg {
        width: 20px;
        height: 20px;
        stroke: currentColor;
        fill: none;
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
    }

    .action-icon-btn:hover {
        transform: translateY(-3px) scale(1.05);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .action-icon-btn:active {
        transform: translateY(-1px) scale(1);
    }

    .action-icon-btn[title]:hover::after {
        content: attr(title);
        position: absolute;
        top: -40px;
        left: 50%;
        transform: translateX(-50%);
        background: #131b48;
        color: white;
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 0.75rem;
        white-space: nowrap;
        z-index: 1000;
        pointer-events: none;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    .action-icon-btn[title]:hover::before {
        content: '';
        position: absolute;
        top: -8px;
        left: 50%;
        transform: translateX(-50%);
        border: 5px solid transparent;
        border-top-color: #131b48;
        z-index: 1000;
        pointer-events: none;
    }

    .details-btn {
        color: #131b48;
    }

    .details-btn:hover {
        background: #131b48;
        color: white;
    }

    .download-btn {
        color: #28a745;
    }

    .download-btn:hover {
        background: #28a745;
        color: white;
    }

    .admin-btn {
        color: #4c95af;
    }

    .admin-btn:hover {
        background: #4c95af;
        color: white;
    }

    .btn-delete {
        color: #dc3545;
    }

    .btn-delete:hover {
        background: #dc3545;
        color: white;
    }

    /* Modal Styles */
    #edit-modal {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 10000;
        animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    .modal-content {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 30px;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        max-width: 600px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
        animation: slideIn 0.3s ease;
    }

    @keyframes slideIn {
        from {
            transform: translate(-50%, -60%);
            opacity: 0;
        }
        to {
            transform: translate(-50%, -50%);
            opacity: 1;
        }
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 15px;
        border-bottom: 2px solid #e1e5eb;
    }

    .modal-header h2 {
        color: #131b48;
        margin: 0;
        font-size: 1.8rem;
    }

    .modal-close {
        background: none;
        border: none;
        font-size: 1.5rem;
        color: #6c757d;
        cursor: pointer;
        padding: 5px 10px;
        border-radius: 50%;
        transition: all 0.3s ease;
    }

    .modal-close:hover {
        background: #f8f9fa;
        color: #131b48;
    }

    .form-group {
        margin-bottom: 20px;
    }

    .form-group label {
        display: block;
        margin-bottom: 8px;
        color: #131b48;
        font-weight: 600;
        font-size: 0.95rem;
    }

    .form-group input,
    .form-group textarea,
    .form-group select {
        width: 100%;
        padding: 12px;
        border: 2px solid #e1e5eb;
        border-radius: 6px;
        font-size: 1rem;
        font-family: inherit;
        box-sizing: border-box;
        transition: border-color 0.3s ease;
        background-color: white;
    }

    .form-group input:focus,
    .form-group textarea:focus,
    .form-group select:focus {
        outline: none;
        border-color: #4c95af;
        box-shadow: 0 0 0 3px rgba(76, 149, 175, 0.1);
    }

    .form-group textarea {
        min-height: 120px;
        resize: vertical;
    }

    .form-actions {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
        margin-top: 25px;
    }

    .form-actions button {
        padding: 12px 24px;
        font-size: 1rem;
    }

    .btn-save {
        background: linear-gradient(135deg, #4c95af 0%, #3a7a8f 100%);
        color: white;
    }
    .btn-save:hover {
        background: #3a7a8f;
    }
    .btn-save {
    padding: 10px 20px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 1rem;
                    font-weight: 600;
    }
    .btn-cancel {
        background: #6c757d;
        color: white;
    }

    .btn-cancel:hover {
        background: #5a6268;
    }

    /* Book Details Section */
    #book-details {
        display: none;
        background: white;
        padding: 30px;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        margin-top: 30px;
        border-left: 4px solid #4c95af;
    }

    #book-details.show {
        display: block;
        animation: slideDown 0.3s ease;
    }

    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .detail-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 15px;
        border-bottom: 2px solid #e1e5eb;
    }

    .detail-header h3 {
        color: #131b48;
        margin: 0;
        font-size: 1.8rem;
    }

    .detail-close {
        background: #6c757d;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.3s ease;
        width: 100%;
        max-width: 200px;
    }

    .detail-close:hover {
        background: #5a6268;
    }

    .detail-content {
        display: grid;
        grid-template-columns: 250px 1fr;
        gap: 30px;
    }

    .detail-image {
        width: 100%;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .detail-text {
        color: #6c757d;
        line-height: 1.8;
        font-size: 1rem;
    }

    @media (max-width: 768px) {
        .books-container {
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 15px;
        }

        .books-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 15px;
        }

        .books-header h1 {
            font-size: 1.8rem;
        }

        .modal-content {
            width: 95%;
            padding: 20px;
        }

        .detail-content {
            grid-template-columns: 1fr;
        }

        .detail-image {
            max-width: 200px;
            margin: 0 auto;
        }
    }
</style>

<div class="books-header">
    <h1>Catalogue des Livres</h1>
</div>

<!-- Popup Modifier / Ajouter -->
<div id="edit-modal">
    <div class="modal-content">
        <div class="modal-header">
            <h2 id="edit-modal-title"></h2>
            <button class="modal-close" onclick="closeEditModal()">&#215;</button>
        </div>
        <form id="edit-form">
            <div class="form-group">
                <label for="edit-titre" data-i18n="books.title.label">Titre *</label>
                <input type="text" id="edit-titre" required="required" data-i18n-placeholder="books.title.placeholder"/>
            </div>
            <div class="form-group">
                <label for="edit-auteur" data-i18n="books.author">Auteur *</label>
                <select id="edit-auteur" required="required">
                    <option value="" data-i18n="books.author.select">Sélectionnez un auteur...</option>
                </select>
                <small id="auteur-loading" style="color: #6c757d; font-size: 0.85rem; display: block; margin-top: 5px;" data-i18n="books.author.loading">Chargement des auteurs...</small>
            </div>
            <div class="form-group">
                <label for="edit-desc" data-i18n="books.description">Description *</label>
                <textarea id="edit-desc" required="required" data-i18n-placeholder="books.description.placeholder"></textarea>
            </div>
            <div class="form-group">
                <label for="edit-annee" data-i18n="books.year">Année de publication *</label>
                <input type="number" id="edit-annee" required="required" min="1000" max="9999" data-i18n-placeholder="books.year.placeholder" value="2024"/>
            </div>
            <div class="form-group">
                <label for="edit-isbn" data-i18n="books.isbn">ISBN</label>
                <input type="text" id="edit-isbn" data-i18n-placeholder="books.isbn.placeholder"/>
            </div>
            <div class="form-group">
                <label for="edit-categories" data-i18n="books.categories">Catégories</label>
                <select id="edit-categories" multiple="multiple" style="min-height: 100px;">
                    <option value="" data-i18n="books.categories.loading">Chargement des catégories...</option>
                </select>
                <small style="color: #6c757d; font-size: 0.85rem; display: block; margin-top: 5px;" data-i18n="books.categories.hint">Maintenez Ctrl (Windows) ou Cmd (Mac) pour sélectionner plusieurs catégories</small>
            </div>
            <div class="form-group">
                <label for="edit-disponibilite" data-i18n="books.availability">Disponibilité *</label>
                <select id="edit-disponibilite" required="required">
                    <option value="true" selected="selected" data-i18n="books.available">Disponible</option>
                    <option value="false" data-i18n="books.unavailable">Indisponible</option>
                </select>
            </div>
            <div class="form-group">
                <label for="edit-img-file" data-i18n="books.image">Image</label>
                <input type="file" id="edit-img-file" accept="image/*"/>
            </div>
            <div class="form-actions">
                <button type="button" class="btn-cancel" onclick="closeEditModal()" data-i18n="common.cancel">Annuler</button>
                <button type="submit" class="btn-save" data-i18n="common.save">Enregistrer</button>
            </div>
        </form>
    </div>
</div>

<div class="books-container">
  <xsl:if test="count(livres/livre) = 0">
    <p style="text-align: center; padding: 40px; color: #6c757d; font-size: 1.1rem;">
      Aucun livre disponible pour le moment.
    </p>
  </xsl:if>
  <xsl:for-each select="livres/livre">
    <div class="book-card">
      <div class="book-image-container">
        <img>
          <xsl:attribute name="src"><xsl:value-of select="image"/></xsl:attribute>
          <xsl:attribute name="alt"><xsl:value-of select="titre"/></xsl:attribute>
          <xsl:attribute name="onerror">
            <xsl:text>this.onerror=null;this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%23e9ecef%22 width=%22200%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%236c757d%22 font-family=%22Arial%22 font-size=%2214%22%3ELivre%3C/text%3E%3C/svg%3E'</xsl:text>
          </xsl:attribute>
        </img>
      </div>
      <div class="book-content">
        <div class="book-title"><xsl:value-of select="titre"/></div>
        <div class="book-author" data-auteur-id="{authors/auteurRef/@id}"><span data-i18n="books.author.label">✍️ Auteur:</span> <span class="auteur-name" data-i18n="books.author.loading.label">Chargement...</span></div>
        <div class="book-desc"><xsl:value-of select="description"/></div>
        <div class="book-info">
          <div class="book-info-item">
            <strong>📅 Année:</strong> <xsl:value-of select="anneePublication"/>
          </div>
          <div class="book-info-item">
            <strong>🏷️ Catégorie:</strong> 
            <span class="categorie-names">
              <xsl:attribute name="data-categories">
                <xsl:for-each select="categories/categorieRef">
                  <xsl:value-of select="@id"/>
                  <xsl:if test="position() != last()">,</xsl:if>
                </xsl:for-each>
              </xsl:attribute>
              <span class="categorie-loading" data-i18n="categories.loading">Chargement...</span>
            </span>
          </div>
          <div class="book-info-item">
            <strong data-i18n="books.availability">Disponibilité:</strong>
            <xsl:choose>
              <xsl:when test="disponibilite='true'"><span class="available" data-i18n="books.availability.available">Disponible</span></xsl:when>
              <xsl:otherwise><span class="not-available" data-i18n="books.availability.unavailable">Indisponible</span></xsl:otherwise>
            </xsl:choose>
          </div>
          <xsl:if test="isbn">
            <div class="book-info-item">
              <strong>📖 ISBN:</strong> <xsl:value-of select="isbn"/>
            </div>
          </xsl:if>
        </div>
        <div class="book-actions">
          <button class="action-icon-btn details-btn" 
                  title="Voir les détails"
                  data-i18n-title="books.details.title"
                  data-title="{titre}" 
                  data-image="{image}" 
                  data-description="{description}">
            <xsl:attribute name="onclick">
              <xsl:text>showDetails(this.getAttribute(&quot;data-title&quot;), this.getAttribute(&quot;data-image&quot;), this.getAttribute(&quot;data-description&quot;))</xsl:text>
            </xsl:attribute>
            <svg viewBox="0 0 24 24">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </button>
          <button class="action-icon-btn download-btn"
                  title="Télécharger en PDF"
                  data-i18n-title="books.download.title"
                  data-title="{titre}"
                  data-image="{image}"
                  data-description="{description}"
                  data-auteur-id="{authors/auteurRef/@id}">
            <xsl:attribute name="onclick">
              <xsl:text>downloadBookPDF(this.getAttribute(&quot;data-title&quot;), this.getAttribute(&quot;data-image&quot;), this.getAttribute(&quot;data-description&quot;), this.getAttribute(&quot;data-auteur-id&quot;))</xsl:text>
            </xsl:attribute>
            <svg viewBox="0 0 24 24">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </button>
          <xsl:if test="$isAdmin='true'">
            <button class="action-icon-btn admin-btn"
                    title="Modifier le livre"
                    data-i18n-title="books.edit.title"
                    data-title="{titre}"
                    data-auteur="{authors/auteurRef/@id}"
                    data-description="{description}"
                    data-image="{image}">
              <xsl:attribute name="onclick">
                <xsl:text>openEditModal(this.getAttribute(&quot;data-title&quot;), this.getAttribute(&quot;data-auteur&quot;), this.getAttribute(&quot;data-description&quot;), this.getAttribute(&quot;data-image&quot;))</xsl:text>
              </xsl:attribute>
              <svg viewBox="0 0 24 24">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button class="action-icon-btn btn-delete"
                    title="Supprimer le livre"
                    data-i18n-title="books.delete.button"
                    data-title="{titre}">
              <xsl:attribute name="onclick">
                <xsl:text>deleteBookConfirm(this.getAttribute(&quot;data-title&quot;))</xsl:text>
              </xsl:attribute>
              <svg viewBox="0 0 24 24">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </button>
          </xsl:if>
        </div>
      </div>
    </div>
  </xsl:for-each>
</div>

<!-- Section Détails du Livre -->
<div id="book-details">
    <div class="detail-header">
        <h3 id="detail-title"></h3>
        <button class="detail-close" onclick="closeDetails()">Fermer</button>
    </div>
    <div class="detail-content">
        <img id="detail-img" class="detail-image" src="" alt=""/>
        <div class="detail-info">
            <div class="detail-meta">
                <div class="detail-meta-item">
                    <span class="detail-meta-label">Auteur :</span>
                    <span class="detail-meta-value" id="detail-author"></span>
                </div>
                <div class="detail-meta-item">
                    <span class="detail-meta-label">Année :</span>
                    <span class="detail-meta-value" id="detail-year"></span>
                </div>
                <div class="detail-meta-item">
                    <span class="detail-meta-label">Catégorie :</span>
                    <span class="detail-meta-value" id="detail-category"></span>
                </div>
            </div>
            <div class="detail-text" id="detail-desc"></div>
        </div>
    </div>
</div>

</div>
</xsl:template>
</xsl:stylesheet>
