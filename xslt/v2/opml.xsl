<?xml version="1.0" encoding="UTF-8"?>

<!--
    Cheetah News XSLT v2/opml.xsl
    Copyright (C) 2005, 2006 Wojciech Polak.

    This program is free software; you can redistribute it and/or modify it
    under the terms of the GNU General Public License as published by the
    Free Software Foundation; either version 3 of the License, or (at your
    option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program.  If not, see <http://www.gnu.org/licenses/>.
  -->

<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
<xsl:output method="html"/>

<xsl:template match="/opml">
  <xsl:apply-templates/>
</xsl:template>

<xsl:template match="/opml/head">
</xsl:template>

<xsl:template match="opml/body">
  <xsl:apply-templates select="outline"/>
</xsl:template>

<xsl:template match="outline">
  <xsl:variable name="id" select="generate-id()"/>
  <xsl:variable name="depth" select="count(ancestor::*) - 2"/>
  <xsl:choose>
    <xsl:when test="@type = 'link'">
      <span id="outlink_{$id}_{$depth}" style="margin-left:{$depth}.5em">
        <xsl:choose>
	  <xsl:when test="@icon">
	    <img src="images/feed.png" osrc="{@icon}" width="16" height="16"
		 onerror="this.src='images/feed.png'" valign="middle" />
	  </xsl:when>
	  <xsl:otherwise>
	    <img src="images/feed.png" width="16" height="16" valign="middle" />
	  </xsl:otherwise>
	</xsl:choose>
	<xsl:text disable-output-escaping="yes">&amp;nbsp;&amp;nbsp;</xsl:text>
	<span class="outlink">
	  <xsl:attribute name="url"><xsl:value-of select="@url"/></xsl:attribute>
	  <xsl:value-of select="@text"/>
	</span>
	<xsl:if test="@count">
	  <span class="popularCount">
	    <xsl:value-of select="@count"></xsl:value-of>
	  </span>
	</xsl:if>
	<br />
      </span>
    </xsl:when>
    <xsl:otherwise>
      <div style="margin-left:{$depth}.5em; padding-bottom: 2px">
        <xsl:choose>
	  <xsl:when test="@icon">
	    <img src="images/feed.png" osrc="{@icon}" width="16" height="16"
		 onerror="this.src='images/feed.png'" valign="middle" />
	    <xsl:text disable-output-escaping="yes">&amp;nbsp;&amp;nbsp;</xsl:text>
	  </xsl:when>
	  <xsl:otherwise>
	    <xsl:text disable-output-escaping="yes">&amp;#8226;&amp;nbsp;</xsl:text>
	  </xsl:otherwise>
	</xsl:choose>
	<span id="outline_{$id}_{$depth}" class="outline">
	  <xsl:value-of select="@text"/>
	  <xsl:text disable-output-escaping="yes"> &amp;raquo;</xsl:text><br />
	</span>
      </div>
    </xsl:otherwise>
  </xsl:choose>
  <xsl:if test="outline">
    <span id="outline_{$id}_{$depth+1}" class="outline" style="display:none">
      <xsl:apply-templates select="outline"/>
    </span>
  </xsl:if>
</xsl:template>

</xsl:stylesheet>
