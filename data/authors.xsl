<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

    <xsl:output method="html" indent="yes"/>

    <xsl:template match="/">
        <div class="authors-container">
            <style>
                /* STYLES POUR LES AUTEURS */
                .authors-container {
                    text-align: left;
                }

                .authors-container h2 {
                    color: #131b48;
                    margin-bottom: 30px;
                    font-size: 2rem;
                    font-weight: 700;
                    text-align: center;
                }

                .auteur-card {
                    background: #ffffff;
                    margin-bottom: 20px;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                    border-left: 4px solid #4c95af;
                    transition: all 0.3s ease;
                }

                .auteur-card:hover {
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    transform: translateY(-2px);
                }

                .auteur-header {
                    margin-bottom: 15px;
                }

                .auteur-nom {
                    font-size: 1.3rem;
                    color: #131b48;
                    font-weight: 700;
                }

                .auteur-pays {
                    color: #6c757d;
                    font-size: 1rem;
                }

                .livres-section {
                    margin-top: 20px;
                    padding-top: 15px;
                    border-top: 1px solid #e1e5eb;
                }

                .livres-section-title {
                    font-size: 1rem;
                    font-weight: 600;
                    color: #131b48;
                    margin-bottom: 12px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

             

                .livres-list {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }

                .livre-item {
                    padding: 12px 15px;
                    margin-bottom: 10px;
                    background: #f8f9fa;
                    border-radius: 6px;
                    border-left: 4px solid #4c95af;
                    transition: all 0.2s ease;
                }

                .livre-item:hover {
                    background: #e9ecef;
                    transform: translateX(5px);
                }

                .livre-titre {
                    font-weight: 600;
                    color: #131b48;
                    display: block;
                    margin-bottom: 6px;
                    font-size: 1rem;
                }

                .livre-details {
                    color: #6c757d;
                    font-size: 0.9rem;
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
                }

                .livre-detail-item {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                }

                .no-books {
                    color: #6c757d;
                    font-style: italic;
                    padding: 10px;
                    text-align: center;
                    background: #f8f9fa;
                    border-radius: 5px;
                    margin-top: 10px;
                }

                .authors-actions {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 30px;
                }

                .btn-add {
                    background-color: #4c95af;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 6px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .btn-add:hover {
                    background-color: #3a7a8f;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
                }

                .auteur-actions {
                    display: flex;
                    gap: 10px;
                    margin-top: 15px;
                    justify-content: flex-start;
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

                .btn-edit {
                    color: #4c95af;
                }

                .btn-edit:hover {
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
            </style>
            <div class="authors-actions">
                <h2 data-i18n="authors.title">Liste des auteurs et leurs livres</h2>
                <button class="btn-add" onclick="showAddAuthorForm()" data-i18n="authors.add">+ Ajouter un auteur</button>
            </div>
            <xsl:for-each select="auteurs/auteur">
                <div class="auteur-card" data-author-id="{@id}">
                    <div class="auteur-header">
                        <strong class="auteur-nom"><xsl:value-of select="nom"/></strong>
                        <span class="auteur-pays"> - <xsl:value-of select="pays"/></span>
                    </div>
                    <div class="auteur-actions">
                        <button class="action-icon-btn btn-edit" 
                                title="Modifier l'auteur"
                                data-i18n-title="authors.edit.title"
                                onclick="editAuthor('{@id}')">
                            <svg viewBox="0 0 24 24">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                        <button class="action-icon-btn btn-delete" 
                                title="Supprimer l'auteur"
                                data-i18n-title="authors.delete.title"
                                onclick="deleteAuthor('{@id}')">
                            <svg viewBox="0 0 24 24">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                        </button>
                    </div>
                    <div class="livres-section">
                        <div class="livres-section-title" data-i18n="authors.books">Livres</div>
                        <xsl:choose>
                            <xsl:when test="livres/livreref">
                                <ul class="livres-list">
                                    <xsl:for-each select="livres/livreref">
                                        <li class="livre-item" data-book-id="{@idLivre}">
                                            <span class="livre-titre" data-i18n="common.loading">Chargement...</span>
                                            <div class="livre-details"></div>
                                        </li>
                                    </xsl:for-each>
                                </ul>
                            </xsl:when>
                            <xsl:otherwise>
                                <div class="no-books" data-i18n="authors.no.books">Aucun livre associé à cet auteur</div>
                            </xsl:otherwise>
                        </xsl:choose>
                    </div>
                </div>
            </xsl:for-each>
        </div>
    </xsl:template>

</xsl:stylesheet>
