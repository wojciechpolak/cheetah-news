<?php

/*
   Cheetah News index.php
   Copyright (C) 2005, 2006, 2007, 2008, 2009, 2010, 2011 Wojciech Polak.

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

require_once 'lib/include.php';

start_session (null);
$session->auth ('iflogged');

if ($session->status['afterlogged'] != 'yes') {
  $insideLogin = true;
  include 'login.php';
}
else {
  getvars ('signed_request');
  if ($signed_request)
    redirect ('http://'.$CONF['site'].'/reader?insideFB=1');

  header ("Content-Type: text/html; charset=UTF-8");
?>
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Frameset//EN" "http://www.w3.org/TR/html4/frameset.dtd"><html><head><title>Cheetah News</title><meta name="description" content="Web-based Personal News Aggregator. The Google Reader Alternative."><meta name="keywords" content="cheetah news, web-based personal news aggregator, feeds, feedreader, rss, atom, rdf, web 2.0"><meta name="robots" content="index,nofollow"><link rel="icon" href="images/favicon.png" type="image/png"><link rel="alternate" type="application/atom+xml" title="Atom" href="notes/<?php echo $session->email; ?>"></head><noscript>JavaScript is required.</noscript><frameset id="fs" rows='100%,*' border="0" onload="if (!(top==self)) top.location.href='./'; document.getElementById('fs').rows='0,100%'"><frame name="wait" src="html/loading" frameborder="0" noresize scrolling="no"><frame name="main" src="reader" frameborder="0" noresize></frameset></html>
<?php } ?>
