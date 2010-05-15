<?php

/*
   Cheetah News lib/d-files.php
   Copyright (C) 2010 Wojciech Polak.

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

$files = array ('bt'       => array ('js',  array ('js/v2/i18n.js',
						   'js/v2/boot.js',
						   'js/v2/jquery.js',
						   'js/v2/jquery-ui.js',
						   'js/v2/jquery-extra.js')),
		'js'       => array ('js',  array ('js/v2/core.js',
						   'js/v2/gui.js',
						   'js/v2/opml.js',
						   'js/v2/filter.js',
						   'js/v2/marker.js',
						   'js/v2/share.js',
						   'js/v2/translate.js',
						   'js/v2/social.js',
						   'js/v2/notes.js',
						   'js/v2/weather.js',
						   'js/v2/niftycube.js')),
		'login'    => array ('js',  array ('js/v2/jquery.js',
						   'js/v2/login.js')),
		'tr'       => array ('xml', array ('xslt/v2/feed.xsl')),
		'op'       => array ('xml', array ('xslt/v2/opml.xsl')),
		'wt'       => array ('xml', array ('xslt/v2/weather.xsl')),
		'css'      => array ('css', array ('css/v2/style1.css',
						   'css/v2/niftyCorners.css')),
		'css.login'  => array ('css', array ('css/v2/login.css')),
		'css.notice' => array ('css', array ('css/v2/notice.css')),
		'css.cswindow' => array ('css', array ('css/v2/cswindow.css')),
		'dir'        => array ('xml', array ('gen/directory.xml')),
		'popular'    => array ('xml', array ('gen/popular.xml'))
		);
?>
