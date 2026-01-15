<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
    <xsl:output method="html" encoding="UTF-8" indent="yes"/>
    
    <!-- Parameter passed from JavaScript: current user role -->
    <xsl:param name="userRole" />

    <xsl:template match="/">
        <nav class="sidebar">
            <div class="logo">Digital Library</div>
            <ul>
                <xsl:apply-templates select="menus/menu"/>
            </ul>
        </nav>
    </xsl:template>

    <xsl:template match="menu">
        <!-- Check if the userRole is present in the roles attribute -->
        <xsl:if test="contains(concat(' ', @roles, ' '), concat(' ', $userRole, ' '))">
            <li>
                <a href="{link}" onclick="navigate('{link}'); return false;">
                    <span class="icon"><xsl:value-of select="icon"/></span>
                    <!-- data-i18n attribute matches the key for JS translation -->
                    <span class="label" data-i18n="{label/@key}"><xsl:value-of select="label"/></span>
                </a>
            </li>
        </xsl:if>
    </xsl:template>

</xsl:stylesheet>
