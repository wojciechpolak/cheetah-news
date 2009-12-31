/*
   Cheetah News JS/v1 Bootstrapping
   Copyright (C) 2005, 2006, 2007, 2008 Wojciech Polak.

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

var nua = navigator.userAgent.toLowerCase ();
var opera = nua.indexOf ('opera') != -1;
var msie = nua.indexOf ('msie') != -1 && (document.all && !opera);
var safari = nua.indexOf ('safari') != -1;
if (!msie && !window.XSLTProcessor)
  document.location = 'html/unsupported';
else if (nua.indexOf ('khtml') != -1)
  document.location = 'html/unsupported';

function reader () {
  var xh = null;
  var pb = document.getElementById ('progressBar');
  if (pb) pb.innerHTML = _('initializing...');
  if (window.XMLHttpRequest)
    xh = new XMLHttpRequest ();
  else if (window.ActiveXObject) {
    try { xh = new ActiveXObject ("Msxml2.XMLHTTP"); }
    catch (e) {
      try { xh = new ActiveXObject ("Microsoft.XMLHTTP"); }
      catch (E) { xh = null; }
    }
  }
  if (!xh && msie)
    document.location = 'html/noactivex';
  if (!xh) return;
  try {
    xh.open ('GET', 'd?q=js/1', true);
    xh.setRequestHeader ('X-Referer', 'CNA');
    xh.onreadystatechange = function () {
      if (xh.readyState == 4) {
	if (xh.status == 200) {
	  eval (xh.responseText);
	  if (pb) pb.style.display = 'none';
          if (js_init) js_init ();
	}
	else {
 	  document.location = 'html/error?s='
	  + xh.status +'&st='+ xh.statusText;
	}
	xh = null;
      }
    };
    xh.send (null);
  } catch (e) {
    document.location = 'html/error?st=' + e.message;
  }
}

window.onload = reader;
