<?xml version="1.0" encoding="UTF-8"?>

<!--
    Cheetah News XSLT v2/feed.xsl
    Copyright (C) 2005, 2006, 2007, 2008, 2009, 2010 Wojciech Polak.

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

<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
  xmlns:rdf09="http://my.netscape.com/rdf/simple/0.9/"
  xmlns:rss10="http://purl.org/rss/1.0/"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:atom="http://purl.org/atom/ns#"
  xmlns:atomW3="http://www.w3.org/2005/Atom"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
  xmlns:media="http://search.yahoo.com/mrss/"
  xmlns:geo="http://www.w3.org/2003/01/geo/wgs84_pos#"
  xmlns:georss="http://www.georss.org/georss"
  xmlns:feedburner="http://rssnamespace.org/feedburner/ext/1.0">
<xsl:output method="html" encoding="UTF-8" indent="no"/>
<xsl:param name="FEEDID">0</xsl:param>
<xsl:param name="LATEST">5</xsl:param>
<xsl:param name="EXPAND">1</xsl:param>
<xsl:param name="ORDERBY">ascending</xsl:param>

<xsl:template match="/">
  <xsl:apply-templates/>
</xsl:template>

<xsl:template match="error">
  <div class="feedError">
    <xsl:value-of select="code"/>:
    <xsl:value-of select="message"/>
  </div>
</xsl:template>

<xsl:template match="rss">
  <xsl:comment>RSS <xsl:value-of select="@version"/></xsl:comment>
  <xsl:apply-templates select="channel"/>
</xsl:template>

<xsl:template match="atom:feed|atomW3:feed">
  <xsl:comment>Atom</xsl:comment>
  <div class="channelOptions">
    <a id="cl_{$FEEDID}" class="channelLink">
      <xsl:attribute name="href">
	<xsl:choose>
	  <xsl:when test="atomW3:link[@rel = 'alternate']">
	    <xsl:value-of select="atomW3:link[@rel = 'alternate']/@href"/>
	  </xsl:when>
	  <xsl:when test="atom:link[@rel = 'alternate']">
	    <xsl:value-of select="atom:link[@rel = 'alternate']/@href"/>
	  </xsl:when>
	  <xsl:when test="atomW3:link[@rel = 'self']">
	    <xsl:value-of select="atomW3:link[@rel = 'self']/@href"/>
	  </xsl:when>
	  <xsl:when test="atom:link[@rel = 'self']">
	    <xsl:value-of select="atom:link[@rel = 'self']/@href"/>
	  </xsl:when>
	  <xsl:when test="atomW3:link|atom:link">
	    <xsl:value-of select="atomW3:link/@href|atom:link/@href"/>
	  </xsl:when>
	</xsl:choose>
      </xsl:attribute>
      <xsl:attribute name="target">
	<xsl:choose>
	  <xsl:when test="atomW3:link[@rel = 'alternate']">
	    <xsl:value-of select="atomW3:link[@rel = 'alternate']/@href"/>
	  </xsl:when>
	  <xsl:when test="atom:link[@rel = 'alternate']">
	    <xsl:value-of select="atom:link[@rel = 'alternate']/@href"/>
	  </xsl:when>
	  <xsl:when test="atomW3:link[@rel = 'self']">
	    <xsl:value-of select="atomW3:link[@rel = 'self']/@href"/>
	  </xsl:when>
	  <xsl:when test="atom:link[@rel = 'self']">
	    <xsl:value-of select="atom:link[@rel = 'self']/@href"/>
	  </xsl:when>
	  <xsl:when test="atomW3:link|atom:link">
	    <xsl:value-of select="atomW3:link/@href|atom:link/@href"/>
	  </xsl:when>
	</xsl:choose>
      </xsl:attribute>
      <xsl:choose>
	<xsl:when test="atomW3:icon">
	  <img src="{atomW3:icon}" onerror="this.src='images/t.gif';this.className='img-elink'"
	       style="vertical-align:top" />
	</xsl:when>
	<xsl:when test="atom:link[@rel = 'icon']">
	  <img src="{atom:link[@rel = 'icon']/@href}"
	       onerror="this.src='images/t.gif';this.className='img-elink'"
	       style="vertical-align:top" />
	</xsl:when>
	<xsl:when test="atomW3:logo">
	  <img src="{atomW3:logo}" onerror="this.src='images/t.gif';this.className='img-elink'"
	       style="vertical-align:top" />
	</xsl:when>
	<xsl:otherwise>
	  <img class="img-elink" src="images/t.gif" style="vertical-align:top" />
	</xsl:otherwise>
      </xsl:choose>
    </a>
    <xsl:text> </xsl:text>
    <span class="emax" style="display:none">
      <xsl:attribute name="count">
	<xsl:value-of select="count(atom:entry|atomW3:entry)"/>
      </xsl:attribute>
    </span>
  </div>
  <xsl:choose>
    <xsl:when test="atomW3:id = 'tag:twitter.com,2007:Status' or
		    substring(atomW3:id,0,28) = 'tag:search.twitter.com,2005'">
      <xsl:apply-templates
	  select="atomW3:entry[position() &lt;= $LATEST]"
	  mode="twitter">
	<xsl:sort order="{$ORDERBY}" data-type="number" select="position()"/>
      </xsl:apply-templates>
      <br />
      <a class="twitterMore">
	<xsl:attribute name="href">
	  <xsl:value-of select="atomW3:link[@rel='alternate']/@href"/>
	  <xsl:choose>
	    <xsl:when test="substring(atomW3:id,0,28) = 'tag:search.twitter.com,2005'">
	      <xsl:text>&amp;max_id=</xsl:text>
	    </xsl:when>
	    <xsl:otherwise>
	      <xsl:text>?max_id=</xsl:text>
	    </xsl:otherwise>
	  </xsl:choose>
	  <xsl:if test="count(atomW3:entry) &lt; $LATEST">
	    <xsl:value-of select="substring-after(atomW3:entry[last()]/atomW3:id, 'statuses/')"/>
	  </xsl:if>
	  <xsl:if test="count(atomW3:entry) &gt;= $LATEST">
	    <xsl:choose>
	      <xsl:when test="substring(atomW3:id,0,28) = 'tag:search.twitter.com,2005'">
		<xsl:value-of select="substring-after(atomW3:entry[position() = $LATEST]/atomW3:id, '2005:')"/>
	      </xsl:when>
	      <xsl:otherwise>
		<xsl:value-of select="substring-after(atomW3:entry[position() = $LATEST]/atomW3:id, 'statuses/')"/>
	      </xsl:otherwise>
	    </xsl:choose>
	  </xsl:if>
	</xsl:attribute>
      </a>
    </xsl:when>
    <xsl:otherwise>
      <xsl:apply-templates
	  select="atom:entry[position() &lt;= $LATEST]|
		  atomW3:entry[position() &lt;= $LATEST]">
	<xsl:sort order="{$ORDERBY}" data-type="number" select="position()"/>
      </xsl:apply-templates>
    </xsl:otherwise>
  </xsl:choose>
</xsl:template>

<xsl:template match="rdf:RDF">
  <xsl:comment>RDF/RSS</xsl:comment>
  <div class="channelOptions">
    <xsl:apply-templates select="rss10:channel|rdf09:channel"/>
    <xsl:text> </xsl:text>
    <span class="emax" style="display:none">
      <xsl:attribute name="count">
	<xsl:value-of select="count(rss10:item|rdf09:item)"/>
      </xsl:attribute>
    </span>
  </div>
  <xsl:apply-templates
      select="rss10:item[position() &lt;= $LATEST]|
	      rdf09:item[position() &lt;= $LATEST]">
    <xsl:sort order="{$ORDERBY}" data-type="number" select="position()"/>
  </xsl:apply-templates>
</xsl:template>


<xsl:template match="channel">
  <div class="channelOptions">
    <a id="cl_{$FEEDID}" class="channelLink">
      <xsl:attribute name="href"><xsl:value-of select="link"/></xsl:attribute>
      <xsl:attribute name="target"><xsl:value-of select="link"/></xsl:attribute>
      <xsl:choose>
	<xsl:when test="image">
	  <img src="{image/url}" onerror="this.src='images/t.gif';this.className='img-elink'"
	       style="vertical-align:top" />
	</xsl:when>
	<xsl:otherwise>
	  <img class="img-elink" src="images/t.gif" style="vertical-align:top" />
	</xsl:otherwise>
      </xsl:choose>
    </a>
    <xsl:text> </xsl:text>
    <span class="emax" style="display:none">
      <xsl:attribute name="count">
        <xsl:value-of select="count(item)"/>
      </xsl:attribute>
    </span>
  </div>
  <xsl:apply-templates select="item[position() &lt;= $LATEST]">
    <xsl:sort order="{$ORDERBY}" data-type="number" select="position()"/>
  </xsl:apply-templates>
</xsl:template>

<xsl:template match="rss10:channel">
  <a id="cl_{$FEEDID}" class="channelLink">
    <xsl:attribute name="href">
      <xsl:value-of select="rss10:link"/>
    </xsl:attribute>
    <xsl:attribute name="target">
      <xsl:value-of select="rss10:link"/>
    </xsl:attribute>
    <xsl:choose>
      <xsl:when test="rss10:image">
	<img src="{rss10:image/@rdf:resource}"
	     onerror="this.src='images/t.gif';this.className='img-elink'"
	     style="vertical-align:top" />
      </xsl:when>
      <xsl:otherwise>
	<img class="img-elink" src="images/t.gif" style="vertical-align:top" />
      </xsl:otherwise>
    </xsl:choose>
  </a>
</xsl:template>

<xsl:template match="rdf09:channel">
  <a id="cl_{$FEEDID}" class="channelLink">
    <xsl:attribute name="href">
      <xsl:value-of select="rdf09:link"/>
    </xsl:attribute>
    <xsl:attribute name="target">
      <xsl:value-of select="rdf09:link"/>
    </xsl:attribute>
    <xsl:choose>
      <xsl:when test="../rdf09:image">
	<img src="{../rdf09:image/rdf09:url}"
	     onerror="this.src='images/t.gif';this.className='img-elink'"
	     style="vertical-align:top" />
      </xsl:when>
      <xsl:otherwise>
	<img class="img-elink" src="images/t.gif" style="vertical-align:top" />
      </xsl:otherwise>
    </xsl:choose>
  </a>
</xsl:template>


<xsl:template match="item">
  <xsl:variable name="eid" select="concat($FEEDID, generate-id())"/>
  <div id="entry_{$eid}">
    <xsl:if test="../language">
      <xsl:attribute name="entrylang">
	<xsl:value-of select="../language[text()]"/>
      </xsl:attribute>
    </xsl:if>
    <div class="entryTitle">
      <xsl:if test="../language[text()='ar' or text()='he-IL']">
	<xsl:attribute name="dir">rtl</xsl:attribute>
      </xsl:if>
      <span id="el_{$eid}" class="entryLink">
	<xsl:choose>
	  <xsl:when test="title and title != ''">
	    <xsl:value-of select="title"/>
	  </xsl:when>
	  <xsl:when test="pubDate[text()]">
	    <xsl:call-template name="formatRSSDate">
	      <xsl:with-param name="node" select="pubDate"/>
	    </xsl:call-template>
	  </xsl:when>
	  <xsl:otherwise>
	    <xsl:text>Nameless</xsl:text>
	  </xsl:otherwise>
	</xsl:choose>
      </span>
      <xsl:if test="pubDate[text()]">
	<xsl:text> </xsl:text>
	<span class="entryDate">
	  <xsl:text>(</xsl:text>
	  <xsl:call-template name="formatRSSDate">
	    <xsl:with-param name="node" select="pubDate"/>
	  </xsl:call-template>
	  <xsl:text>)</xsl:text>
	</span>
      </xsl:if>
    </div>
    <div id="eb_{$eid}" class="entryBody">
      <xsl:if test="position() &gt; $EXPAND">
	<xsl:attribute name="style">display:none</xsl:attribute>
      </xsl:if>
      <xsl:if test="../language[text()='ar' or text()='he-IL']">
	<xsl:attribute name="dir">rtl</xsl:attribute>
      </xsl:if>
      <span id="ebi_{$eid}">
	<xsl:choose>
	  <xsl:when test="content:encoded">
	    <xsl:value-of disable-output-escaping="yes"
			  select="content:encoded"/>
	  </xsl:when>
	  <xsl:when test="description">
	    <xsl:value-of disable-output-escaping="yes" select="description"/>
	  </xsl:when>
	</xsl:choose>
      </span>
      <xsl:comment>/span_ebi</xsl:comment>
      <xsl:choose>
	<xsl:when test="georss:point">
	  <xsl:call-template name="show-map">
	    <xsl:with-param name="lat"
			    select="substring-before(georss:point, ' ')"/>
	    <xsl:with-param name="long"
			    select="substring-after(georss:point, ' ')"/>
	  </xsl:call-template>
	</xsl:when>
	<xsl:when test="geo:lat and geo:long">
	  <xsl:call-template name="show-map">
	    <xsl:with-param name="lat" select="geo:lat"/>
	    <xsl:with-param name="long" select="geo:long"/>
	  </xsl:call-template>
	</xsl:when>
      </xsl:choose>
      <xsl:apply-templates select="enclosure|media:thumbnail|media:content"/>
      <div class="entryMeta">
	<xsl:if test="link">
	  <span class="entryMore">
	    <xsl:text> </xsl:text>
	    <a id="linkMore_{$eid}">
	      <xsl:attribute name="href">
		<xsl:choose>
		  <xsl:when test="feedburner:origLink">
		    <xsl:value-of select="feedburner:origLink"/>
		  </xsl:when>
		  <xsl:otherwise>
		    <xsl:value-of select="link"/>
		  </xsl:otherwise>
		</xsl:choose>
	      </xsl:attribute>
	      <xsl:attribute name="target">
		<xsl:value-of select="link"/>
	      </xsl:attribute>
	      <xsl:attribute name="class">linkMore</xsl:attribute>
	    </a>
	  </span>
	  <xsl:text disable-output-escaping="yes">&amp;nbsp;&amp;nbsp;&amp;nbsp;</xsl:text>
	  <span class="linkShare">
	    <xsl:attribute name="eid">
	      <xsl:value-of select="$eid"/>
	    </xsl:attribute>
	    <xsl:attribute name="href">
	      <xsl:choose>
		<xsl:when test="feedburner:origLink">
		  <xsl:value-of select="feedburner:origLink"/>
		</xsl:when>
		<xsl:otherwise>
		  <xsl:apply-templates select="link"/>
		</xsl:otherwise>
	      </xsl:choose>
	    </xsl:attribute>
	    <xsl:attribute name="desc">
	      <xsl:value-of select="title"/>
	    </xsl:attribute>
	  </span>
	  <xsl:text disable-output-escaping="yes">&amp;nbsp;&amp;nbsp;&amp;nbsp;</xsl:text>
	  <span class="linkSave">
	    <xsl:attribute name="eid">
	      <xsl:value-of select="$eid"/>
	    </xsl:attribute>
	    <xsl:attribute name="href">
	      <xsl:choose>
		<xsl:when test="feedburner:origLink">
		  <xsl:value-of select="feedburner:origLink"/>
		</xsl:when>
		<xsl:otherwise>
		  <xsl:value-of select="link"/>
		</xsl:otherwise>
	      </xsl:choose>
	    </xsl:attribute>
	    <xsl:attribute name="desc">
	      <xsl:value-of select="title"/>
	    </xsl:attribute>
	  </span>
	  <xsl:text disable-output-escaping="yes">&amp;nbsp;&amp;nbsp;&amp;nbsp;</xsl:text>
	</xsl:if>
	<span class="linkTranslate">
	  <xsl:attribute name="eid">
	    <xsl:value-of select="$eid"/>
	  </xsl:attribute>
	</span>
      </div>
    </div>
  </div>
</xsl:template>

<xsl:template match="rss10:item">
  <xsl:variable name="eid" select="concat($FEEDID, generate-id())"/>
  <div id="entry_{$eid}">
    <xsl:if test="../rss10:channel/dc:language">
      <xsl:attribute name="entrylang">
	<xsl:value-of select="../rss10:channel/dc:language[text()]"/>
      </xsl:attribute>
    </xsl:if>
    <div class="entryTitle">
      <span id="el_{$eid}" class="entryLink">
	<xsl:value-of select="rss10:title"/>
      </span>
      <xsl:if test="dc:date">
	<xsl:text> </xsl:text>
	<span class="entryDate">
	  <xsl:text>(</xsl:text>
	  <xsl:call-template name="formatAtomDate">
	    <xsl:with-param name="node" select="dc:date"/>
	  </xsl:call-template>
	  <xsl:text>)</xsl:text>
	</span>
      </xsl:if>
    </div>
    <div id="eb_{$eid}" class="entryBody">
      <xsl:if test="position() &gt; $EXPAND">
	<xsl:attribute name="style">display:none</xsl:attribute>
      </xsl:if>
      <span id="ebi_{$eid}">
	<xsl:choose>
	  <xsl:when test="content:encoded">
	    <xsl:value-of disable-output-escaping="yes"
			  select="content:encoded"/>
	  </xsl:when>
	  <xsl:when test="rss10:description">
	    <xsl:value-of disable-output-escaping="yes"
			  select="rss10:description"/>
	  </xsl:when>
	</xsl:choose>
      </span>
      <xsl:comment>/span_ebi</xsl:comment>
      <xsl:choose>
	<xsl:when test="georss:point">
	  <xsl:call-template name="show-map">
	    <xsl:with-param name="lat"
			    select="substring-before(georss:point, ' ')"/>
	    <xsl:with-param name="long"
			    select="substring-after(georss:point, ' ')"/>
	  </xsl:call-template>
	</xsl:when>
	<xsl:when test="geo:lat and geo:long">
	  <xsl:call-template name="show-map">
	    <xsl:with-param name="lat" select="geo:lat"/>
	    <xsl:with-param name="long" select="geo:long"/>
	  </xsl:call-template>
	</xsl:when>
      </xsl:choose>
      <div class="entryMeta">
	<xsl:if test="rss10:link">
	  <span class="entryMore">
	    <xsl:text> </xsl:text>
	    <a id="linkMore_{$eid}">
	      <xsl:attribute name="href">
		<xsl:choose>
		  <xsl:when test="feedburner:origLink">
		    <xsl:value-of select="feedburner:origLink"/>
		  </xsl:when>
		  <xsl:otherwise>
		    <xsl:value-of select="rss10:link"/>
		  </xsl:otherwise>
		</xsl:choose>
	      </xsl:attribute>
	      <xsl:attribute name="target">
		<xsl:value-of select="rss10:link"/>
	      </xsl:attribute>
	      <xsl:attribute name="class">linkMore</xsl:attribute>
	    </a>
	  </span>
	  <xsl:text disable-output-escaping="yes">&amp;nbsp;&amp;nbsp;&amp;nbsp;</xsl:text>
	  <span class="linkShare">
	    <xsl:attribute name="eid">
	      <xsl:value-of select="$eid"/>
	    </xsl:attribute>
	    <xsl:attribute name="href">
	      <xsl:choose>
		<xsl:when test="feedburner:origLink">
		  <xsl:value-of select="feedburner:origLink"/>
		</xsl:when>
		<xsl:otherwise>
		  <xsl:value-of select="rss10:link"/>
		</xsl:otherwise>
	      </xsl:choose>
	    </xsl:attribute>
	    <xsl:attribute name="desc">
	      <xsl:value-of select="rss10:title"/>
	    </xsl:attribute>
	  </span>
	  <xsl:text disable-output-escaping="yes">&amp;nbsp;&amp;nbsp;&amp;nbsp;</xsl:text>
	  <span class="linkSave">
	    <xsl:attribute name="eid">
	      <xsl:value-of select="$eid"/>
	    </xsl:attribute>
	    <xsl:attribute name="href">
	      <xsl:choose>
		<xsl:when test="feedburner:origLink">
		  <xsl:value-of select="feedburner:origLink"/>
		</xsl:when>
		<xsl:otherwise>
		  <xsl:value-of select="rss10:link"/>
		</xsl:otherwise>
	      </xsl:choose>
	    </xsl:attribute>
	    <xsl:attribute name="desc">
	      <xsl:value-of select="rss10:title"/>
	    </xsl:attribute>
	  </span>
	  <xsl:text disable-output-escaping="yes">&amp;nbsp;&amp;nbsp;&amp;nbsp;</xsl:text>
	</xsl:if>
	<span class="linkTranslate">
	  <xsl:attribute name="eid">
	    <xsl:value-of select="$eid"/>
	  </xsl:attribute>
	</span>
      </div>
    </div>
  </div>
</xsl:template>

<xsl:template match="rdf09:item">
  <xsl:variable name="eid" select="concat($FEEDID, generate-id())"/>
  <div id="entry_{$eid}">
    <div class="entryTitle">
      <span id="el_{$eid}" class="entryLink">
	<xsl:value-of select="rdf09:title"/>
      </span>
      <xsl:if test="rdf09:date">
	<xsl:text> </xsl:text>
	<span class="entryDate">
	  <xsl:text>(</xsl:text>
	  <xsl:call-template name="formatAtomDate">
	    <xsl:with-param name="node" select="rdf09:date"/>
	  </xsl:call-template>
	  <xsl:text>)</xsl:text>
	</span>
      </xsl:if>
    </div>
    <div id="eb_{$eid}" class="entryBody">
      <xsl:if test="position() &gt; $EXPAND">
	<xsl:attribute name="style">display:none</xsl:attribute>
      </xsl:if>
      <span id="ebi_{$eid}">
	<xsl:value-of disable-output-escaping="yes"
		      select="rdf09:description"/>
      </span>
      <xsl:comment>/span_ebi</xsl:comment>
      <div class="entryMeta">
	<xsl:if test="rdf09:link">
	  <span class="entryMore">
	    <xsl:text> </xsl:text>
	    <a id="linkMore_{$eid}">
	      <xsl:attribute name="href">
		<xsl:choose>
		  <xsl:when test="feedburner:origLink">
		    <xsl:value-of select="feedburner:origLink"/>
		  </xsl:when>
		  <xsl:otherwise>
		    <xsl:value-of select="rdf09:link"/>
		  </xsl:otherwise>
		</xsl:choose>
	      </xsl:attribute>
	      <xsl:attribute name="target">
		<xsl:value-of select="rdf09:link"/>
	      </xsl:attribute>
	      <xsl:attribute name="class">linkMore</xsl:attribute>
	    </a>
	  </span>
	  <xsl:text disable-output-escaping="yes">&amp;nbsp;&amp;nbsp;&amp;nbsp;</xsl:text>
	  <span class="linkShare">
	    <xsl:attribute name="eid">
	      <xsl:value-of select="$eid"/>
	    </xsl:attribute>
	    <xsl:attribute name="href">
	      <xsl:choose>
		<xsl:when test="feedburner:origLink">
		  <xsl:value-of select="feedburner:origLink"/>
		</xsl:when>
		<xsl:otherwise>
		  <xsl:apply-templates select="rdf09:link"/>
		</xsl:otherwise>
	      </xsl:choose>
	    </xsl:attribute>
	    <xsl:attribute name="desc">
	      <xsl:value-of select="rdf09:title"/>
	    </xsl:attribute>
	  </span>
	  <xsl:text disable-output-escaping="yes">&amp;nbsp;&amp;nbsp;&amp;nbsp;</xsl:text>
	  <span class="linkSave">
	    <xsl:attribute name="eid">
	      <xsl:value-of select="$eid"/>
	    </xsl:attribute>
	    <xsl:attribute name="href">
	      <xsl:choose>
		<xsl:when test="feedburner:origLink">
		  <xsl:value-of select="feedburner:origLink"/>
		</xsl:when>
		<xsl:otherwise>
		  <xsl:value-of select="rdf09:link"/>
		</xsl:otherwise>
	      </xsl:choose>
	    </xsl:attribute>
	    <xsl:attribute name="desc">
	      <xsl:value-of select="rdf09:title"/>
	    </xsl:attribute>
	  </span>
	  <xsl:text disable-output-escaping="yes">&amp;nbsp;&amp;nbsp;&amp;nbsp;</xsl:text>
	</xsl:if>
	<span class="linkTranslate">
	  <xsl:attribute name="eid">
	    <xsl:value-of select="$eid"/>
	  </xsl:attribute>
	</span>
      </div>
    </div>
  </div>
</xsl:template>

<xsl:template match="atom:entry|atomW3:entry">
  <xsl:variable name="eid" select="concat($FEEDID, generate-id())"/>
  <div id="entry_{$eid}">
    <xsl:if test="atom:content/@xml:lang|
		  atomW3:content/@xml:lang|
		  atomW3:summary/@xml:lang|
		  /atom:feed/@xml:lang|
		  /atomW3:feed/@xml:lang">
      <xsl:attribute name="entrylang">
	<xsl:value-of select="atom:content/@xml:lang|
			      atomW3:content/@xml:lang|
			      atomW3:summary/@xml:lang|
			      /atom:feed/@xml:lang|
			      /atomW3:feed/@xml:lang"/>
      </xsl:attribute>
    </xsl:if>
    <div class="entryTitle">
      <xsl:if test="atomW3:title/@xml:lang='ar' or
		    atomW3:title/@xml:lang='he-IL'">
	<xsl:attribute name="dir">rtl</xsl:attribute>
      </xsl:if>
      <span id="el_{$eid}" class="entryLink">
	<xsl:value-of select="atom:title|atomW3:title"/>
      </span>
      <xsl:choose>
	<xsl:when test="atom:updated|atomW3:updated">
	  <xsl:text> </xsl:text>
	  <span class="entryDate">
	    <xsl:text>(</xsl:text>
	    <xsl:call-template name="formatAtomDate">
	      <xsl:with-param name="node" select="atom:updated|atomW3:updated"/>
	    </xsl:call-template>
	    <xsl:text>)</xsl:text>
	  </span>
	</xsl:when>
	<xsl:when test="atom:modified|atomW3:modified">
	  <xsl:text> </xsl:text>
	  <span class="entryDate">
	    <xsl:text>(</xsl:text>
	    <xsl:call-template name="formatAtomDate">
	      <xsl:with-param name="node"
			      select="atom:modified|atomW3:modified"/>
	    </xsl:call-template>
	    <xsl:text>)</xsl:text>
	  </span>
	</xsl:when>
	<xsl:when test="atom:created|atomW3:created">
	  <xsl:text> </xsl:text>
	  <span class="entryDate">
	    <xsl:text>(</xsl:text>
	    <xsl:call-template name="formatAtomDate">
	      <xsl:with-param name="node" select="atom:created|atomW3:created"/>
	    </xsl:call-template>
	    <xsl:text>)</xsl:text>
	  </span>
	</xsl:when>
      </xsl:choose>
    </div>
    <div id="eb_{$eid}" class="entryBody">
      <xsl:if test="position() &gt; $EXPAND">
	<xsl:attribute name="style">display:none</xsl:attribute>
      </xsl:if>
      <xsl:if test="atomW3:content/@xml:lang='ar' or
		    atomW3:content/@xml:lang='he-IL' or
		    atomW3:summary/@xml:lang='ar' or
		    atomW3:summary/@xml:lang='he-IL'">
	<xsl:attribute name="dir">rtl</xsl:attribute>
      </xsl:if>
      <span id="ebi_{$eid}">
	<xsl:choose>
	  <xsl:when test="atom:content|atomW3:content">
	    <xsl:apply-templates select="atom:content|atomW3:content"/>
	  </xsl:when>
	  <xsl:when test="atom:summary|atomW3:summary">
	    <xsl:apply-templates select="atom:summary|atomW3:summary"/>
	  </xsl:when>
	</xsl:choose>
      </span>
      <xsl:comment>/span_ebi</xsl:comment>
      <xsl:choose>
	<xsl:when test="georss:point">
	  <xsl:call-template name="show-map">
	    <xsl:with-param name="lat"
			    select="substring-before(georss:point, ' ')"/>
	    <xsl:with-param name="long"
			    select="substring-after(georss:point, ' ')"/>
	  </xsl:call-template>
	</xsl:when>
	<xsl:when test="geo:lat and geo:long">
	  <xsl:call-template name="show-map">
	    <xsl:with-param name="lat" select="geo:lat"/>
	    <xsl:with-param name="long" select="geo:long"/>
	  </xsl:call-template>
	</xsl:when>
      </xsl:choose>
      <xsl:apply-templates select="atom:link[@rel = 'enclosure']|
				   atomW3:link[@rel = 'enclosure']|
				   media:thumbnail|media:content"/>
      <div class="entryMeta">
	<xsl:if test="atom:link|atomW3:link">
	  <span class="entryMore">
	    <xsl:text> </xsl:text>
	    <a id="linkMore_{$eid}">
	      <xsl:attribute name="href">
		<xsl:choose>
		  <xsl:when test="feedburner:origLink">
		    <xsl:value-of select="feedburner:origLink"/>
		  </xsl:when>
		  <xsl:otherwise>
		    <xsl:apply-templates select="atom:link|atomW3:link"/>
		  </xsl:otherwise>
		</xsl:choose>
	      </xsl:attribute>
	      <xsl:attribute name="target">
		<xsl:apply-templates select="atom:link|atomW3:link"/>
	      </xsl:attribute>
	      <xsl:attribute name="class">linkMore</xsl:attribute>
	    </a>
	  </span>
	  <xsl:text disable-output-escaping="yes">&amp;nbsp;&amp;nbsp;&amp;nbsp;</xsl:text>
	  <span class="linkShare">
	    <xsl:attribute name="eid">
	      <xsl:value-of select="$eid"/>
	    </xsl:attribute>
	    <xsl:attribute name="href">
	      <xsl:choose>
		<xsl:when test="feedburner:origLink">
		  <xsl:value-of select="feedburner:origLink"/>
		</xsl:when>
		<xsl:otherwise>
		  <xsl:apply-templates select="atom:link|atomW3:link"/>
		</xsl:otherwise>
	      </xsl:choose>
	    </xsl:attribute>
	    <xsl:attribute name="desc">
	      <xsl:value-of select="atom:title|atomW3:title"/>
	    </xsl:attribute>
	  </span>
	  <xsl:text disable-output-escaping="yes">&amp;nbsp;&amp;nbsp;&amp;nbsp;</xsl:text>
	  <span class="linkSave">
	    <xsl:attribute name="eid">
	      <xsl:value-of select="$eid"/>
	    </xsl:attribute>
	    <xsl:attribute name="href">
	      <xsl:choose>
		<xsl:when test="feedburner:origLink">
		  <xsl:value-of select="feedburner:origLink"/>
		</xsl:when>
		<xsl:otherwise>
		  <xsl:apply-templates select="atom:link|atomW3:link"/>
		</xsl:otherwise>
	      </xsl:choose>
	    </xsl:attribute>
	    <xsl:attribute name="desc">
	      <xsl:value-of select="atom:title|atomW3:title"/>
	    </xsl:attribute>
	  </span>
	  <xsl:text disable-output-escaping="yes">&amp;nbsp;&amp;nbsp;&amp;nbsp;</xsl:text>
	</xsl:if>
	<span class="linkTranslate">
	  <xsl:attribute name="eid">
	    <xsl:value-of select="$eid"/>
	  </xsl:attribute>
	</span>
      </div>
    </div>
  </div>
</xsl:template>

<xsl:template match="atomW3:entry" mode="twitter">
  <xsl:variable name="eid" select="concat($FEEDID, generate-id())"/>
  <div id="entry_{$eid}" class="entryTwitter">
    <xsl:if test="atomW3:content/@xml:lang|
		  /atomW3:feed/@xml:lang">
      <xsl:attribute name="entrylang">
	<xsl:value-of select="atomW3:content/@xml:lang|
			      /atomW3:feed/@xml:lang"/>
      </xsl:attribute>
    </xsl:if>
    <div class="entryTitle entryTitleTwitter">
      <a>
	<xsl:attribute name="href">
	  <xsl:value-of select="concat('http://twitter.com/', substring-before(atomW3:title, ':'))"/>
	</xsl:attribute>
	<img src="{atomW3:link[@rel = 'image']/@href}" class="twitterPhoto" width="48" height="48" />
      </a>
      <span id="el_{$eid}" class="entryLink">
	<xsl:choose>
	  <xsl:when test="../atomW3:id = 'tag:twitter.com,2007:Status'">
	    <xsl:value-of select="substring-after(atomW3:title, ':')"/>
	  </xsl:when>
	  <xsl:otherwise>
	    <xsl:value-of select="atomW3:title"/>
	  </xsl:otherwise>
	</xsl:choose>
      </span>
      <xsl:if test="atomW3:updated">
	<div class="entryDate entryDateTwitter">
	  <xsl:call-template name="formatAtomDate">
	    <xsl:with-param name="node" select="atomW3:updated"/>
	  </xsl:call-template>
	</div>
      </xsl:if>
    </div>
    <div id="eb_{$eid}" class="entryBody entryBodyTwitter">
      <xsl:if test="position() &gt; $EXPAND">
	<xsl:attribute name="style">display:none</xsl:attribute>
      </xsl:if>
      <span id="ebi_{$eid}"></span>
      <xsl:comment>/span_ebi</xsl:comment>
      <div class="entryMeta entryMetaTwitter">
	<xsl:if test="atomW3:link">
	  <span class="entryMore">
	    <xsl:text> </xsl:text>
	    <a id="linkMore_{$eid}">
	      <xsl:attribute name="href">
		<xsl:apply-templates select="atomW3:link"/>
	      </xsl:attribute>
	      <xsl:attribute name="target">
		<xsl:apply-templates select="atomW3:link"/>
	      </xsl:attribute>
	      <xsl:attribute name="class">linkMore</xsl:attribute>
	    </a>
	  </span>
	  <xsl:text disable-output-escaping="yes">&amp;nbsp;&amp;nbsp;&amp;nbsp;</xsl:text>
	  <span class="linkShare">
	    <xsl:attribute name="eid">
	      <xsl:value-of select="$eid"/>
	    </xsl:attribute>
	    <xsl:attribute name="href">
	      <xsl:apply-templates select="atomW3:link"/>
	    </xsl:attribute>
	    <xsl:attribute name="desc">
	      <xsl:apply-templates select="atomW3:link"/>
	    </xsl:attribute>
	  </span>
	  <xsl:text disable-output-escaping="yes">&amp;nbsp;&amp;nbsp;&amp;nbsp;</xsl:text>
	  <span class="linkSave">
	    <xsl:attribute name="eid">
	      <xsl:value-of select="$eid"/>
	    </xsl:attribute>
	    <xsl:attribute name="href">
	      <xsl:apply-templates select="atomW3:link"/>
	    </xsl:attribute>
	    <xsl:attribute name="desc">
	      <xsl:apply-templates select="atomW3:link"/>
	    </xsl:attribute>
	  </span>
	  <xsl:text disable-output-escaping="yes">&amp;nbsp;&amp;nbsp;&amp;nbsp;</xsl:text>
	</xsl:if>
	<span class="linkTranslate">
	  <xsl:attribute name="eid">
	    <xsl:value-of select="$eid"/>
	  </xsl:attribute>
	</span>
      </div>
    </div>
    <div style="clear:both"></div>
  </div>
</xsl:template>


<xsl:template match="atom:link[@rel = 'alternate']|
		     atomW3:link[@rel = 'alternate']|
		     atomW3:link[@rel != 'self']|
		     atomW3:link[@rel != 'related']|
		     atomW3:link">
  <xsl:choose>
    <xsl:when test="@rel">
      <xsl:if test="@rel != 'self' and @rel != 'edit' and @rel != 'related' and
		    @rel != 'service.edit' and @rel != 'license' and
		    @rel != 'replies' and @rel != 'image'">
	<xsl:value-of select="@href"/>
      </xsl:if>
    </xsl:when>
    <xsl:otherwise>
      <xsl:value-of select="@href"/>
    </xsl:otherwise>
  </xsl:choose>
</xsl:template>

<xsl:template match="xhtml:br">
  <br />
</xsl:template>

<xsl:template match="xhtml:a|xhtml:img|xhtml:pre|xhtml:table">
  <xsl:copy-of select="."/>
</xsl:template>

<xsl:template match="xhtml:h1|xhtml:h2|xhtml:h3|xhtml:h4">
  <xsl:copy-of select="."/>
</xsl:template>

<xsl:template match="xhtml:p">
  <xsl:choose>
    <xsl:when test="system-property('xsl:vendor') = 'Opera'">
      <p><xsl:apply-templates/></p>
    </xsl:when>
    <xsl:otherwise>
      <xsl:copy-of select="."/>
    </xsl:otherwise>
  </xsl:choose>
</xsl:template>

<xsl:template match="xhtml:div">
  <xsl:choose>
    <xsl:when test="system-property('xsl:vendor') = 'Opera'">
      <div><xsl:apply-templates/></div>
    </xsl:when>
    <xsl:otherwise>
      <xsl:copy-of select="."/>
    </xsl:otherwise>
  </xsl:choose>
</xsl:template>


<xsl:template match="enclosure|atom:link[@rel = 'enclosure']|
		     atomW3:link[@rel = 'enclosure']|
		     media:thumbnail|media:content">
  <div style="margin-top:5px; margin-bottom:5px">
    <xsl:choose>
      <xsl:when test="@type = 'image/jpeg' or @type = 'jpg' or
		      name() = 'media:thumbnail'">
	<a class="linkThumbnail">
	  <xsl:attribute name="href">
	    <xsl:value-of select="@url|@href"/>
	  </xsl:attribute>
	  <img class="img-image" src="images/t.gif" alt="media" />
	</a>
      </xsl:when>
      <xsl:when test="@type = 'application/x-shockwave-flash'">
	<a class="linkThumbnail" flash="true">
	  <xsl:attribute name="href">
	    <xsl:value-of select="@url|@href"/>
	  </xsl:attribute>
	  <img class="img-video" src="images/t.gif" alt="media" />
	</a>
      </xsl:when>
      <xsl:when test="@type = 'audio/mpeg'">
	<a>
	  <xsl:attribute name="href">
	    <xsl:value-of select="@url|@href"/>
	  </xsl:attribute>
	  <img class="img-audio" src="images/t.gif" alt="media" />
	</a>
	<xsl:if test="@length and @length &gt; 0">
	  <xsl:text> (</xsl:text>
	  <xsl:value-of select="round(@length div 1024)"/>
	  <xsl:text> kB)</xsl:text>
	</xsl:if>
      </xsl:when>
      <xsl:when test="@type='video/quicktime' or @type='video/mpeg' or
		      @type='video/x-msvideo' or @type='video/mp4v-es' or
		      @type='video/mp4'">
	<a>
	  <xsl:attribute name="href">
	    <xsl:value-of select="@url|@href"/>
	  </xsl:attribute>
	  <img class="img-video" src="images/t.gif" alt="media" />
	</a>
	<xsl:if test="@length and @length &gt; 0">
	  <xsl:text> (</xsl:text>
	  <xsl:value-of select="round(@length div 1024)"/>
	  <xsl:text> kB)</xsl:text>
	</xsl:if>
      </xsl:when>
    </xsl:choose>
  </div>
</xsl:template>

<xsl:template name="show-map">
  <xsl:param name="lat"/>
  <xsl:param name="long"/>
  <xsl:variable name="mapkey" select="'ABQIAAAAvLLQCnhTw46NwnzLhmeTWxTKCotwoHIH9XR8xmEaA1ptUXasrBR183bAB_OU-il8VLNhl9DX6kkXYA'"/>
  <div class="mapembedded">
    <a href="http://maps.google.com/maps?q={normalize-space($lat)},{normalize-space($long)}">
      <img osrc="http://maps.google.com/staticmap?zoom=12&amp;size=175x120&amp;maptype=mobile&amp;markers={normalize-space($lat)},{normalize-space($long)}&amp;key={$mapkey}"
	   width="175" height="120" alt="Google Maps" title="Google Maps" />
    </a>
  </div>
</xsl:template>

<xsl:template name="outputDate">
  <xsl:param name="day"/>
  <xsl:param name="month"/>
  <xsl:param name="year"/>
  <xsl:param name="time"/>
  <xsl:value-of select="concat($day, '-')"/>
  <xsl:choose>
    <xsl:when test="$month = 'Jan'">01</xsl:when>
    <xsl:when test="$month = 'Feb'">02</xsl:when>
    <xsl:when test="$month = 'Mar'">03</xsl:when>
    <xsl:when test="$month = 'Apr'">04</xsl:when>
    <xsl:when test="$month = 'May'">05</xsl:when>
    <xsl:when test="$month = 'Jun'">06</xsl:when>
    <xsl:when test="$month = 'Jul'">07</xsl:when>
    <xsl:when test="$month = 'Aug'">08</xsl:when>
    <xsl:when test="$month = 'Sep'">09</xsl:when>
    <xsl:when test="$month = 'Oct'">10</xsl:when>
    <xsl:when test="$month = 'Nov'">11</xsl:when>
    <xsl:when test="$month = 'Dec'">12</xsl:when>
    <xsl:otherwise>
      <xsl:value-of select="$month"/>
    </xsl:otherwise>
  </xsl:choose>
  <xsl:value-of select="concat('-', $year, ' ', $time)"/>
</xsl:template>

<xsl:template name="formatRSSDate">
  <xsl:param name="node"/>
  <xsl:choose>
    <xsl:when test="string-length(string($node)) = 31 or
		    string-length(string($node)) = 29">
      <xsl:call-template name="outputDate">
	<xsl:with-param name="day"
			select="format-number(number(substring(string($node), 6, 2)), '00')"/>
	<xsl:with-param name="month" select="substring(string ($node), 9, 3)"/>
	<xsl:with-param name="year" select="substring(string ($node), 13, 4)"/>
	<xsl:with-param name="time" select="substring(string ($node), 18, 5)"/>
      </xsl:call-template>
    </xsl:when>
    <xsl:when test="string-length(string($node)) = 30">
      <xsl:call-template name="outputDate">
	<xsl:with-param name="day"
			select="format-number(number(substring(string($node), 6, 1)), '00')"/>
	<xsl:with-param name="month" select="substring(string ($node), 8, 3)"/>
	<xsl:with-param name="year" select="substring(string ($node), 12, 4)"/>
	<xsl:with-param name="time" select="substring(string ($node), 17, 5)"/>
      </xsl:call-template>
    </xsl:when>
    <xsl:otherwise>
      <xsl:value-of select="string($node)"/>
    </xsl:otherwise>
  </xsl:choose>
</xsl:template>

<xsl:template name="formatAtomDate">
  <xsl:param name="node"/>
  <xsl:call-template name="outputDate">
    <xsl:with-param name="day" select="substring(string($node), 9, 2)"/>
    <xsl:with-param name="month" select="substring(string ($node), 6, 2)"/>
    <xsl:with-param name="year" select="substring(string ($node), 1, 4)"/>
    <xsl:with-param name="time" select="substring(string ($node), 12, 5)"/>
  </xsl:call-template>
</xsl:template>

</xsl:stylesheet>
