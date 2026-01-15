<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

    <xsl:output method="html" indent="yes"/>

    <xsl:template match="/">
        <html>
        <head>
            <title>Auteurs et Livres</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .auteur { margin-bottom: 20px; padding: 10px; border: 1px solid #ccc; }
                .livre { margin-left: 20px; }
            </style>
        </head>
        <body>
            <h1>Liste des auteurs et leurs livres</h1>
            <xsl:for-each select="auteurs/auteur">
                <div class="auteur">
                    <strong><xsl:value-of select="nom"/></strong> - <xsl:value-of select="pays"/>
                    <ul>
                        <xsl:for-each select="livres/livreref">
                           <li class="livreref">
                                <xsl:variable name="book" select="document('books.xml')/livres/livre[@idLivre=current()/@idLivre]"/>
                                <xsl:value-of select="$book/titre"/>
                                (<xsl:value-of select="$book/anneePublication"/>)-<xsl:value-of select="$book/categorie"/>
                            </li>
                        </xsl:for-each>
                    </ul>
                </div>
            </xsl:for-each>
        </body>
        </html>
    </xsl:template>

</xsl:stylesheet>
