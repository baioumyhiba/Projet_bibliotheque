<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

<xsl:variable name="isAdmin" select="'true'"/>

<xsl:template match="/">
<html>
<head>
<title>Catalogue des livres</title>
<style>
body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 20px; }
h1 { margin-bottom: 20px; }
.books-container { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px; }
.book-card { background: white; border: 1px solid #ddd; border-radius: 6px; padding: 10px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); }
.book-card img { width: 100%; height: 200px; object-fit: cover; border-radius: 4px; }
.book-title { font-size: 18px; font-weight: bold; margin: 10px 0 5px 0; }
.book-author { font-size: 14px; color: #555; margin-bottom: 5px; }
.book-desc { font-size: 13px; color: #666; margin-bottom: 8px; }
.book-info { font-size: 13px; margin-bottom: 10px; }
.available { color: green; font-weight: bold; }
.not-available { color: red; font-weight: bold; }
button { padding: 6px 10px; margin: 3px; border: none; cursor: pointer; border-radius: 3px; }
.details-btn { background-color: black; color: white; }
.admin-btn { background-color: #e0e0e0; }
</style>
</head>
<body>

<h1>All Books</h1>

<!-- Bouton Ajouter -->
<xsl:if test="$isAdmin='true'">
  <button class="admin-btn" onclick="openAddModal()">Ajouter un livre</button>
</xsl:if>

<!-- Popup Modifier / Ajouter -->
<div id="edit-modal" style="display:none; position:fixed; top:50%; left:50%; transform:translate(-50%,-50%);
background:white; padding:20px; border:2px solid #333; border-radius:10px; z-index:1000;">
  <h2 id="edit-modal-title"></h2>
  <form id="edit-form">
    <label>Titre:</label><br/>
    <input type="text" id="edit-titre" required="required"/><br/><br/>
    <label>Auteur:</label><br/>
    <input type="text" id="edit-auteur" required="required"/><br/><br/>
    <label>Description:</label><br/>
    <textarea id="edit-desc" required="required"></textarea><br/><br/>
    <label>Image:</label><br/>
    <input type="file" id="edit-img-file" accept="image/*"/><br/><br/>
    <button type="submit">Enregistrer</button>
    <button type="button" onclick="closeEditModal()">Annuler</button>
  </form>
</div>

<div class="books-container">
  <xsl:for-each select="livres/livre">
    <div class="book-card">
      <img src="{image}" alt="{titre}" />
      <div class="book-title"><xsl:value-of select="titre"/></div>
      <div class="book-author">Author: <xsl:value-of select="authors/auteurRef/@id"/></div>
      <div class="book-desc"><xsl:value-of select="description"/></div>
      <div class="book-info">
        Année: <xsl:value-of select="anneePublication"/><br/>
        Disponibilité:
        <xsl:choose>
          <xsl:when test="disponibilite='true'"><span class="available">Disponible</span></xsl:when>
          <xsl:otherwise><span class="not-available">Indisponible</span></xsl:otherwise>
        </xsl:choose>
      </div>

      <!-- Voir détails -->
      <button class="details-btn">
        <xsl:attribute name="onclick">
          <xsl:text>showDetails('</xsl:text>
          <xsl:value-of select="titre"/>
          <xsl:text>','</xsl:text>
          <xsl:value-of select="image"/>
          <xsl:text>','</xsl:text>
          <xsl:value-of select="description"/>
          <xsl:text>')</xsl:text>
        </xsl:attribute>
        Voir détails
      </button>

      <!-- Modifier / Supprimer -->
      <xsl:if test="$isAdmin='true'">
        <button class="admin-btn">
          <xsl:attribute name="onclick">
            <xsl:text>openEditModal('</xsl:text>
            <xsl:value-of select="titre"/>
            <xsl:text>','</xsl:text>
            <xsl:value-of select="authors/auteurRef/@id"/>
            <xsl:text>','</xsl:text>
            <xsl:value-of select="description"/>
            <xsl:text>','</xsl:text>
            <xsl:value-of select="image"/>
            <xsl:text>')</xsl:text>
          </xsl:attribute>
          Modifier
        </button>

        <button class="admin-btn">
          <xsl:attribute name="onclick">
            <xsl:text>deleteBookConfirm('</xsl:text>
            <xsl:value-of select="titre"/>
            <xsl:text>')</xsl:text>
          </xsl:attribute>
          Supprimer
        </button>
      </xsl:if>

    </div>
  </xsl:for-each>
</div>

</body>
</html>
</xsl:template>
</xsl:stylesheet>
