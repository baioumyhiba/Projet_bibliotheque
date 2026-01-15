<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

    <xsl:output method="html" encoding="UTF-8" indent="yes"/>

    <!-- Template principal -->
    <xsl:template match="/categories">
        <html>
            <head>
                <title>Liste des catégories</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        background-color: #f4f4f4;
                        padding: 20px;
                    }
                    table {
                        border-collapse: collapse;
                        width: 50%;
                        background-color: #ffffff;
                    }
                    th, td {
                        border: 1px solid #333;
                        padding: 10px;
                        text-align: left;
                    }
                    th {
                        background-color: #ddd;
                    }
                </style>
            </head>

            <body>
                <h2>Liste des catégories</h2>

                <table>
                    <tr>
                        <th>ID</th>
                        <th>Libellé</th>
                    </tr>

                    <!-- Parcours des catégories -->
                    <xsl:for-each select="categorie">
                        <tr>
                            <td>
                                <xsl:value-of select="@id"/>
                            </td>
                            <td>
                                <xsl:value-of select="libelle"/>
                            </td>
                        </tr>
                    </xsl:for-each>

                </table>
            </body>
        </html>
    </xsl:template>

</xsl:stylesheet>
