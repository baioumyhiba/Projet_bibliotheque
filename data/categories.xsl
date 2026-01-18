<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

    <xsl:output method="html" indent="yes"/>

    <xsl:template match="/">
        <div class="categories-container">
            <style>
                /* STYLES POUR LES CATÉGORIES */
                .categories-container {
                    text-align: left;
                }

                .categories-container h2 {
                    color: #131b48;
                    margin-bottom: 30px;
                    font-size: 2rem;
                    font-weight: 700;
                    text-align: center;
                }

                .categories-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 25px;
                    flex-wrap: wrap;
                    gap: 15px;
                }

                .add-category-btn {
                    background: #4c95af;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 1rem;
                    font-weight: 600;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .add-category-btn:hover {
                    background: #3a7a8f;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(76, 149, 175, 0.3);
                }

                .categories-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 20px;
                }

                .category-card {
                    background: #ffffff;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                    border-left: 4px solid #4c95af;
                    transition: all 0.3s ease;
                }

                .category-card:hover {
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    transform: translateY(-2px);
                }

                .category-header {
                    margin-bottom: 15px;
                }

                .category-id {
                    font-size: 0.85rem;
                    color: #6c757d;
                    margin-bottom: 5px;
                }

                .category-libelle {
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: #131b48;
                    margin: 0;
                }

                .category-actions {
                    display: flex;
                    gap: 10px;
                    margin-top: 15px;
                }

                .btn-edit, .btn-delete {
                    padding: 8px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 36px;
                    height: 36px;
                }
                
                .btn-edit svg, .btn-delete svg {
                    width: 18px;
                    height: 18px;
                }

                .btn-edit {
                    background: #4c95af;
                    color: white;
                }

                .btn-edit:hover {
                    background: #3a7a8f;
                }

                .btn-delete {
                    background: #dc3545;
                    color: white;
                }

                .btn-delete:hover {
                    background: #c82333;
                }

                /* Modal Styles */
                #category-modal {
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
                    max-width: 500px;
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
                    border-bottom: 2px solid #e9ecef;
                }

                .modal-header h2 {
                    margin: 0;
                    color: #131b48;
                    font-size: 1.5rem;
                }

                .modal-close {
                    background: none;
                    border: none;
                    font-size: 28px;
                    color: #6c757d;
                    cursor: pointer;
                    padding: 0;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: all 0.3s ease;
                }

                .modal-close:hover {
                    background: #f8f9fa;
                    color: #dc3545;
                }

                .form-group {
                    margin-bottom: 20px;
                }

                .form-group label {
                    display: block;
                    margin-bottom: 8px;
                    color: #131b48;
                    font-weight: 600;
                }

                .form-group input {
                    width: 100%;
                    padding: 12px;
                    border: 2px solid #e9ecef;
                    border-radius: 6px;
                    font-size: 1rem;
                    transition: border-color 0.3s ease;
                    box-sizing: border-box;
                }

                .form-group input:focus {
                    outline: none;
                    border-color: #4c95af;
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

                .btn-cancel {
                    background: #6c757d;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: 600;
                }

                .btn-cancel:hover {
                    background: #5a6268;
                }

                .btn-save {
                    background: linear-gradient(135deg, #4c95af 0%, #3a7a8f 100%);
                    color: white;
                }
                .btn-save {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 1rem;
                    font-weight: 600;
                }

                .btn-save:hover {
                    background: #3a7a8f;
                }
            </style>

            <h2>Gestion des Catégories</h2>

            <div class="categories-header">
                <div></div>
                <button class="add-category-btn" onclick="showAddCategoryForm()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    <span data-i18n="categories.add">Ajouter une catégorie</span>
                </button>
            </div>

            <div class="categories-grid">
                <xsl:for-each select="categories/categorie">
                    <div class="category-card">
                        <div class="category-header">
                            <div class="category-id" data-category-id="{@id}">ID: <xsl:value-of select="@id"/></div>
                            <div class="category-libelle" data-category-libelle="{libelle}"><xsl:value-of select="libelle"/></div>
                        </div>
                        <div class="category-actions">
                            <button class="btn-edit" onclick="editCategory('{@id}')" title="Modifier" data-i18n-title="categories.edit">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                            </button>
                            <button class="btn-delete" onclick="deleteCategoryConfirm('{@id}')" title="Supprimer" data-i18n-title="categories.delete">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                </xsl:for-each>
            </div>
        </div>

        <!-- Modal pour ajouter/modifier une catégorie -->
        <div id="category-modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2 id="category-modal-title" data-i18n="categories.add.title">Ajouter une catégorie</h2>
                    <button class="modal-close" onclick="closeCategoryModal()">&#215;</button>
                </div>
                <form id="category-form">
                    <div class="form-group">
                        <label for="category-libelle" data-i18n="categories.label">Libellé *</label>
                        <input type="text" id="category-libelle" required="required" placeholder="Entrez le libellé de la catégorie"/>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn-cancel" onclick="closeCategoryModal()" data-i18n="common.cancel">Annuler</button>
                        <button type="submit" class="btn-save" data-i18n="common.save">Enregistrer</button>
                    </div>
                </form>
            </div>
        </div>
    </xsl:template>

</xsl:stylesheet>
