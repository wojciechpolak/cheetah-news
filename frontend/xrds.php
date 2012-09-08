<?php

/*
   Cheetah News xrds.php
   Copyright (C) 2008, 2010, 2012 Wojciech Polak.

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
*/

header ('Content-Type: application/xrds+xml');
header ('X-Robots-Tag: noindex');
echo '<?xml version="1.0" encoding="UTF-8"?>'."\n";

?>
<xrds:XRDS
    xmlns:xrds="xri://$xrds"
    xmlns:openid="http://openid.net/xmlns/1.0"
    xmlns="xri://$xrd*($v*2.0)">
  <XRD>
    <Service priority="1">
      <Type>http://specs.openid.net/auth/2.0/return_to</Type>
      <URI priority="1">http://www.cheetah-news.com/login</URI>
      <URI priority="2">http://www.cheetah-news.com/linked-accounts</URI>
    </Service>
  </XRD>
</xrds:XRDS>
