<?xml version="1.0" encoding="UTF-8"?>

<!--
    Cheetah News XSLT v2/weather.xsl
    Copyright (C) 2005, 2006, 2008 Wojciech Polak.

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
  xmlns:yweather="http://xml.weather.yahoo.com/ns/rss/1.0"
  xmlns:geo="http://www.w3.org/2003/01/geo/wgs84_pos#">
<xsl:output method="html" encoding="UTF-8" indent="no"/>

<xsl:template match="/">
  <xsl:apply-templates/>
</xsl:template>

<xsl:template match="rss">
  <xsl:choose>
    <xsl:when test="channel/yweather:location">
      <xsl:apply-templates select="channel"/>
    </xsl:when>
    <xsl:otherwise>
      <table>
	<tr>
	  <td class="weLinkEdit" colspan="2">
	    <span class="weMsg">Location</span>:
	    <span class="locationName"></span>
	  </td>
	</tr>
	<tr>
	  <td><span class="weError"></span></td>
	</tr>
      </table>
    </xsl:otherwise>
  </xsl:choose>
</xsl:template>

<xsl:template match="channel">
  <table class="weatherTable">
    <tr valign="top">
      <td class="weatherData">
	<h3 class="weatherTodayTitle">
	  <xsl:attribute name="title">
	    <xsl:call-template name="formatRSSDate">
	      <xsl:with-param name="node" select="lastBuildDate"/>
	    </xsl:call-template>
	  </xsl:attribute>
	  <span class="weMsg" style="cursor:help">
	    <xsl:text>Today</xsl:text>
	  </span>
	</h3>
	<div class="weatherImage"
	     style="background:transparent url(images/yweather/250x{item/yweather:forecast[1]/@code}.png) no-repeat 0 1px">
	  <div class="weather-current">
	    <h4 class="weMsg">
	      <xsl:value-of select="item/yweather:forecast[1]/@text"/>
	    </h4>
	    <h4 class="weatherTemp">
	      <xsl:value-of select="item/yweather:forecast[1]/@low"/>
	      <xsl:text> - </xsl:text>
	      <xsl:value-of select="item/yweather:forecast[1]/@high"/>
	      <xsl:text disable-output-escaping="yes">&amp;deg;</xsl:text>
	      <xsl:value-of select="yweather:units/@temperature"/>
	    </h4>
	    <table class="weatherDetails">
	      <xsl:apply-templates select="yweather:wind"/>
	      <xsl:apply-templates select="yweather:atmosphere"/>
	      <xsl:apply-templates select="yweather:astronomy"/>
	    </table>
	  </div>
	</div>
      </td>
      <xsl:apply-templates select="item/yweather:forecast[2]"/>
    </tr>
    <tr>
      <td colspan="4" align="right">
	<span class="weLinkEdit"></span>
	<xsl:text disable-output-escaping="yes">&amp;nbsp;&amp;nbsp;</xsl:text>
	<a class="linkMore">
	  <xsl:attribute name="href"><xsl:value-of select="link"/></xsl:attribute>
	  <xsl:attribute name="target"><xsl:value-of select="link"/></xsl:attribute>
	  <xsl:text>more</xsl:text>
	</a>
      </td>
    </tr>
  </table>
</xsl:template>

<xsl:template match="yweather:location">
  <xsl:value-of select="@city"/>
  <xsl:if test="string-length(@region) &gt; 0">
    <xsl:text>, </xsl:text>
    <xsl:value-of select="@region"/>
  </xsl:if>
  <xsl:if test="string-length(@country) &gt; 0">
    <xsl:text>, </xsl:text>
    <xsl:value-of select="@country"/>
  </xsl:if>
</xsl:template>

<xsl:template match="yweather:wind">
  <tr>
    <td>
      <span class="weMsg">Feels like</span>
      <xsl:text>:</xsl:text>
    </td>
    <td>
      <xsl:value-of select="@chill"/>
      <xsl:text disable-output-escaping="yes">&amp;deg;</xsl:text>
      <xsl:value-of select="../yweather:units/@temperature"/>
    </td>
  </tr>
  <tr>
    <td>
      <span class="weMsg">Wind</span>
      <xsl:text>:</xsl:text>
    </td>
    <td>
      <xsl:value-of select="@speed"/>
      <xsl:text> </xsl:text>
      <span class="weMsg">
	<xsl:value-of select="../yweather:units/@speed"/>
      </span>
    </td>
  </tr>
</xsl:template>

<xsl:template match="yweather:atmosphere">
  <tr>
    <td>
      <span class="weMsg">Humidity</span>
      <xsl:text>:</xsl:text>
    </td>
    <td>
      <xsl:value-of select="@humidity"/>
      <xsl:text>%</xsl:text>
    </td>
  </tr>
  <xsl:if test="@pressure > 0">
    <tr>
      <td>
	<span class="weMsg">Pressure</span>
	<xsl:text>:</xsl:text>
      </td>
      <td>
	<xsl:value-of select="@pressure"/>
	<xsl:text> </xsl:text>
	<span class="weMsg"><xsl:value-of select="../yweather:units/@pressure"/></span>
      </td>
    </tr>
  </xsl:if>
</xsl:template>

<xsl:template match="yweather:astronomy">
  <tr>
    <td>
      <span class="weMsg">Sunrise</span>
      <xsl:text>:</xsl:text>
    </td>
    <td>
      <xsl:value-of select="@sunrise"/>
    </td>
  </tr>
  <tr>
    <td>
      <span class="weMsg">Sunset</span>
      <xsl:text>:</xsl:text>
    </td>
    <td>
      <xsl:value-of select="@sunset"/>
    </td>
  </tr>
</xsl:template>

<xsl:template match="yweather:forecast">
  <td class="weatherData">
    <h3 class="weMsg">
      <xsl:text>Tomorrow</xsl:text>
    </h3>
    <div class="weatherImage"
	 style="background:transparent url(images/yweather/250x{@code}.png) no-repeat 0 1px">
      <div class="weather-current">
	<img id="weForecastImg"
	     src="images/yweather/52x{@code}.gif"
	     width="52" height="52" style="display:none" />
	<h4>
	  <span class="weMsg"><xsl:value-of select="@text"/></span>
	</h4>
	<h4 class="weatherTemp">
	  <xsl:value-of select="@low"/>
	  <xsl:text> - </xsl:text>
	  <xsl:value-of select="@high"/>
	  <xsl:text disable-output-escaping="yes">&amp;deg;</xsl:text>
	  <xsl:value-of select="../../yweather:units/@temperature"/>
	</h4>
      </div>
    </div>
  </td>
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
    <xsl:when test="string-length(string($node)) = 28 or string-length(string($node)) = 29">
      <xsl:call-template name="outputDate">
	<xsl:with-param name="day"
			select="format-number(number(substring(string($node), 6, 2)), '00')"/>
	<xsl:with-param name="month" select="substring(string ($node), 9, 3)"/>
	<xsl:with-param name="year" select="substring(string ($node), 13, 4)"/>
	<xsl:with-param name="time" select="substring(string ($node), 18, string-length($node))"/>
      </xsl:call-template>
    </xsl:when>
    <xsl:otherwise>
      <xsl:value-of select="string($node)"/>
    </xsl:otherwise>
  </xsl:choose>
</xsl:template>

</xsl:stylesheet>
