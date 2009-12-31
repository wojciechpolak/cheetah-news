/*
   Cheetah News JS/v1 Media
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
*/

Modules.Media = new function () {

  var twCounter = 0;
  var maxWidth  = 300;
  var maxHeight = 200;
  var swfWidth  = 440;
  var swfHeight = 350;

  this.init = function () {
    return true;
  };

  this.showThumbnail = function (src) {
    var tId = 't' + ++twCounter;
    var tWindow = js_createWindow (tId, 'tWindow', _('Thumbnail'), false);
    var tWindowContent = GID (tId + 'WindowContent');
    if (!opera)
      tWindow.removeChild (GID (tId + 'Resize'));
    js_prepareWindowClose (GID (tId + 'WindowClose'), function () {
	tWindow.style.display = 'none';
	document.body.removeChild (tWindow);
	tWindow = null;
      });
    js_popUp (tWindow);
    js_setupDrag (tWindow);
    js_registerWindow (tWindow);
    var img = new Image ();
    img.onload = function () {
      if (this.width > maxWidth) {
	var nscale = maxWidth / this.width;
	this.width = maxWidth;
	this.height = this.height * nscale;
      }
      else if (this.height > maxHeight) {
	var nscale = maxHeight / this.height;
	this.height = maxHeight;
	this.width = this.width * nscale;
      }
      if (this.width < maxWidth || this.height < maxHeight) {
	tWindow.style.width = (this.width + 15) + 'px';
	tWindow.style.height = (this.height + 40) + 'px';
      }
      var anchor = document.createElement ('A');
      anchor.href = src;
      anchor.target = src;
      anchor.appendChild (this);
      anchor.onmouseup = js_blur;
      tWindowContent.innerHTML = '';
      tWindowContent.appendChild (anchor);
      var tWindowHeight = parseInt (js_getStyle (tWindow, 'height'));
      var tWindowTitleBarHeight = parseInt (js_getStyle (GID (tId + 'WindowTitleBar'), 'height'));
      if (isNaN (tWindowTitleBarHeight)) tWindowTitleBarHeight = 0;
      tWindowContent.style.height = tWindowHeight - tWindowTitleBarHeight - 15;
    };
    img.onerror = function () {
      tWindowContent.innerHTML = _('error');
    };
    img.onabort = function () {
      tWindowContent.innerHTML = _('aborted');
    };
    tWindowContent.innerHTML = _('Loading...');
    img.src = src;
  };

  this.playShockwaveFlash = function (src) {
    var tId = 't' + ++twCounter;
    var tWindow = js_createWindow (tId, 'tWindow', _('Multimedia'), false);
    var tWindowContent = GID (tId + 'WindowContent');
    if (!opera)
      tWindow.removeChild (GID (tId + 'Resize'));
    js_prepareWindowClose (GID (tId + 'WindowClose'), function () {
	tWindow.style.display = 'none';
	document.body.removeChild (tWindow);
	tWindow = null;
      });
    js_popUp (tWindow);
    js_setupDrag (tWindow);
    js_registerWindow (tWindow);
    tWindow.style.width = (swfWidth + 15) + 'px';
    tWindow.style.height = (swfHeight + 40) + 'px';
    tWindowContent.innerHTML = '<object classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000"'
      + ' codebase="http://fpdownload.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=7,0,0,0"'
      + ' align="middle" width="'+ swfWidth +'" height="'+ swfHeight +'">'
      + '<param name="movie" value="'+ src +'">'
      + '<param name="quality" value="best">'
      + '<param name="allowScriptAccess" value="never">'
      + '<param name="scale" value="noScale">'
      + '<param name="wmode" value="window">'
      + '<param name="salign" value="tl">'
      + '<param name="bgcolor" value="#efebe7">'
      + '<embed type="application/x-shockwave-flash"'
      + ' src="'+ src +'" quality="best" allowscriptaccess="never"'
      + ' scale="noScale" wmode="window" salign="tl" bgcolor="#efebe7"'
      + ' flashvars="playerMode=embedded"'
      + ' pluginspage="http://www.macromedia.com/go/getflashplayer"'
      + ' width="'+ swfWidth +'" height="'+ swfHeight +'">'
      + '</embed></object>';
  };
};
