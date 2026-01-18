<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

    <xsl:output method="html" indent="yes"/>

    <xsl:template match="/">
        <div class="users-container">
            <style>
                /* STYLES POUR LES UTILISATEURS */
                .users-container {
                    text-align: left;
                }

                .users-container h2 {
                    color: #131b48;
                    margin-bottom: 30px;
                    font-size: 2rem;
                    font-weight: 700;
                    text-align: center;
                }

                .users-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 25px;
                    flex-wrap: wrap;
                    gap: 15px;
                }

                .add-user-btn {
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

                .add-user-btn:hover {
                    background: #3a7a8f;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(76, 149, 175, 0.3);
                }

                .users-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 20px;
                }

                .user-card {
                    background: #ffffff;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                    border-left: 4px solid #4c95af;
                    transition: all 0.3s ease;
                }

                .user-card:hover {
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    transform: translateY(-2px);
                }

                .user-header {
                    margin-bottom: 15px;
                }

                .user-id {
                    font-size: 0.85rem;
                    color: #6c757d;
                    margin-bottom: 5px;
                }

                .user-username {
                    font-size: 1.3rem;
                    color: #131b48;
                    font-weight: 700;
                    margin-bottom: 8px;
                }

                .user-email {
                    color: #6c757d;
                    font-size: 0.95rem;
                    margin-bottom: 10px;
                    word-break: break-word;
                }

                .user-role {
                    display: inline-block;
                    padding: 4px 12px;
                    border-radius: 12px;
                    font-size: 0.85rem;
                    font-weight: 600;
                    margin-top: 10px;
                }

                .role-admin {
                    background: #ff6b6b;
                    color: white;
                }

                .role-auteur {
                    background: #4ecdc4;
                    color: white;
                }

                .role-user {
                    background: #95a5a6;
                    color: white;
                }

                .user-actions {
                    margin-top: 15px;
                    padding-top: 15px;
                    border-top: 1px solid #e1e5eb;
                    display: flex;
                    gap: 10px;
                    justify-content: flex-end;
                }

                .icon-button {
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    padding: 8px;
                    border-radius: 4px;
                    transition: all 0.2s ease;
                    position: relative;
                }

                .icon-button:hover {
                    background: #f8f9fa;
                }

                .icon-button svg {
                    width: 20px;
                    height: 20px;
                    fill: #4c95af;
                }

                .icon-button-edit:hover svg {
                    fill: #28a745;
                }

                .icon-button-delete:hover svg {
                    fill: #dc3545;
                }

                /* Modal Styles */
                .user-modal {
                    display: none;
                    position: fixed;
                    z-index: 1000;
                    left: 0;
                    top: 0;
                    width: 100%;
                    height: 100%;
                    overflow: auto;
                    background-color: rgba(0, 0, 0, 0.5);
                }

                .modal-content-user {
                    background-color: #fefefe;
                    margin: 5% auto;
                    padding: 0;
                    border: none;
                    border-radius: 8px;
                    width: 90%;
                    max-width: 500px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                }

                .modal-header-user {
                    padding: 20px;
                    background: #4c95af;
                    color: white;
                    border-radius: 8px 8px 0 0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .modal-header-user h3 {
                    margin: 0;
                    font-size: 1.5rem;
                }

                .close-user-modal {
                    color: white;
                    font-size: 28px;
                    font-weight: bold;
                    cursor: pointer;
                    line-height: 1;
                }

                .close-user-modal:hover {
                    opacity: 0.7;
                }

                .user-edit-form {
                    padding: 20px;
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

                .form-group input,
                .form-group select {
                    width: 100%;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 1rem;
                    box-sizing: border-box;
                }

                .form-group input:focus,
                .form-group select:focus {
                    outline: none;
                    border-color: #4c95af;
                    box-shadow: 0 0 0 3px rgba(76, 149, 175, 0.1);
                }

                .form-group small {
                    display: block;
                    margin-top: 5px;
                    color: #6c757d;
                    font-size: 0.85rem;
                }

                .modal-buttons-user {
                    display: flex;
                    gap: 10px;
                    justify-content: flex-end;
                    margin-top: 25px;
                }

                .btn-submit-user,
                .btn-cancel-user {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 1rem;
                    font-weight: 600;
                    transition: all 0.2s ease;
                }

                .btn-submit-user {
                    background: #4c95af;
                    color: white;
                }

                .btn-submit-user:hover {
                    background: #3a7a8f;
                }

                .btn-cancel-user {
                    background: #6c757d;
                    color: white;
                }

                .btn-cancel-user:hover {
                    background: #5a6268;
                }
            </style>

            <h2 data-i18n="users.title">Gestion des Utilisateurs</h2>

            <div class="users-header">
                <div></div>
                <button id="add-user-btn" class="add-user-btn">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                    </svg>
                    <span data-i18n="users.add">Ajouter un utilisateur</span>
                </button>
            </div>

            <div class="users-grid">
                <xsl:apply-templates select="users/user[role != 'admin']"/>
            </div>
        </div>
    </xsl:template>

    <xsl:template match="user">
        <div class="user-card">
            <div class="user-header">
                <div class="user-id">ID: <xsl:value-of select="id"/></div>
                <div class="user-username"><xsl:value-of select="username"/></div>
                <div class="user-email"><xsl:value-of select="email"/></div>
                <span class="user-role role-{role}" data-role-id="{role}">
                    <xsl:value-of select="role"/>
                </span>
            </div>
            <div class="user-actions">
                <button class="icon-button icon-button-edit" 
                        onclick="editUser('{id}')"
                        title="Modifier"
                        data-i18n-title="users.edit">
                    <svg viewBox="0 0 24 24">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                    </svg>
                </button>
                <button class="icon-button icon-button-delete" 
                        onclick="deleteUser('{id}')"
                        title="Supprimer"
                        data-i18n-title="users.delete">
                    <svg viewBox="0 0 24 24">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                    </svg>
                </button>
            </div>
        </div>
    </xsl:template>

</xsl:stylesheet>

