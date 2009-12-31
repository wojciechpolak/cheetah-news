<?xml version="1.0" encoding="UTF-8"?>

<!--
    Cheetah News XSLT v1/weather.xsl
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
  <p>
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
  </p>
</xsl:template>

<xsl:template match="channel">
  <table>
    <tr>
      <td class="weLinkEdit" colspan="2">
	<span class="weMsg">Location</span>:
	<span class="locationName"></span>
      </td>
      <td colspan="2"><span class="weMsg">Forecast</span></td>
    </tr>
    <tr valign="top">
      <td style="border:1px solid gray">
	<xsl:apply-templates select="item/yweather:condition"/>
      </td>
      <td width="140" style="padding-left:1em">
	<xsl:call-template name="formatRSSDate">
	  <xsl:with-param name="node" select="lastBuildDate"/>
	</xsl:call-template><br />
	<xsl:apply-templates select="yweather:wind"/>
	<xsl:apply-templates select="yweather:atmosphere"/>
	<xsl:apply-templates select="yweather:astronomy"/>
      </td>
      <xsl:apply-templates select="item/yweather:forecast"/>
    </tr>
    <tr>
      <td colspan="4" align="right">
	<a>
	  <xsl:attribute name="href"><xsl:value-of select="link"/></xsl:attribute>
	  <xsl:attribute name="target"><xsl:value-of select="link"/></xsl:attribute>
	  <span class="linkMore">more</span>
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
  <span class="weMsg">Feels like</span>: <xsl:value-of select="@chill"/>
  <xsl:text disable-output-escaping="yes">&amp;deg;</xsl:text>
  <xsl:value-of select="../yweather:units/@temperature"/><br />
  <span class="weMsg">Wind</span>: <xsl:value-of select="@speed"/><xsl:text> </xsl:text>
  <span class="weMsg"><xsl:value-of select="../yweather:units/@speed"/></span><br />
</xsl:template>

<xsl:template match="yweather:atmosphere">
  <span class="weMsg">Humidity</span>: <xsl:value-of select="@humidity"/> %<br />
  <xsl:if test="@pressure > 0">
    <span class="weMsg">Pressure</span>: <xsl:value-of select="@pressure"/><xsl:text> </xsl:text>
    <span class="weMsg"><xsl:value-of select="../yweather:units/@pressure"/></span><br />
  </xsl:if>
</xsl:template>

<xsl:template match="yweather:astronomy">
  <span class="weMsg">Sunrise</span>: <xsl:value-of select="@sunrise"/><br />
  <span class="weMsg">Sunset</span>: <xsl:value-of select="@sunset"/><br />
</xsl:template>

<xsl:template match="yweather:condition">
  <table cellspacing="0" width="100%">
    <tr><td width="85" align="center" style="background-color:#d3d3d3; border-bottom:1px solid gray">
	<span class="weMsg" style="font-weight:bold">Now</span></td></tr>
    <tr><td width="85" align="center">
      <img src="http://us.i1.yimg.com/us.yimg.com/i/us/we/52/{@code}.gif" width="52" height="52" />
      <br /><span class="weMsg"><xsl:value-of select="@text"/></span>
      <br /><span class="weMsg">Temp</span>: <xsl:value-of select="@temp"/>
      <xsl:text disable-output-escaping="yes">&amp;deg;</xsl:text>
      <xsl:value-of select="../../yweather:units/@temperature"/>
      <br />
    </td></tr>
  </table>
</xsl:template>

<xsl:template match="yweather:forecast">
<td style="border:1px solid gray">
  <table cellspacing="0">
    <tr>
      <td width="85" align="center" style="background-color:#d3d3d3; border-bottom:1px solid gray">
	<span class="weMsg" style="font-weight:bold"><xsl:value-of select="@day"/></span>
      </td>
    </tr>
    <tr><td width="85" align="center">
      <xsl:if test="position() = 2">
	<xsl:attribute name="class">
	  <xsl:text>weForecast</xsl:text>
	</xsl:attribute>
      </xsl:if>
      <img src="http://us.i1.yimg.com/us.yimg.com/i/us/we/52/{@code}.gif" width="52" height="52" />
      <br /><span class="weMsg"><xsl:value-of select="@text"/></span>
      <br /><span class="weMsg">High</span>: <xsl:value-of select="@high"/>
      <xsl:text disable-output-escaping="yes">&amp;deg;</xsl:text>
      <xsl:value-of select="../../yweather:units/@temperature"/>
      <br /><span class="weMsg">Low</span>: <xsl:value-of select="@low"/>
      <xsl:text disable-output-escaping="yes">&amp;deg;</xsl:text>
      <xsl:value-of select="../../yweather:units/@temperature"/>
    </td></tr>
  </table>
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
