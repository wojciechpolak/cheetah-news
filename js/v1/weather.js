/*
   Cheetah News JS/v1 Weather
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
*/

Modules.Weather = new function () {

  var cheetahWeather = null;
  var transformerWeather = null;
  var win = null;
  var winInitiated = false;
  var refreshCnt = 0;
  var lastRefresh = null;
  var changed = false;
  var firstForecastId = null;

  this.init = function () {
    var module = GID ('moduleWeather');
    if (module && module.className == 'module') {
      win = js_createWindow ('we', 'fWindow', _('Weather Report'), true);
      js_prepareLink ('Weather', _('Weather Report'), '', js_openWindow);
      js_prepareWindowClose (GID ('weWindowClose'), js_closeWindow);
      module.style.display = 'block';
      js_initWeather (js_fetchWeatherList);
      return true;
    }
    else {
      module.style.display = 'none';
      return false;
    }
  };

  function js_openWindow () {
    if (msie) js_clearSelection ();
    document.onkeypress = null;

    if (!winInitiated && js_checkOnline ()) {
      var weAdd = GID ('weAdd');
      weAdd.style.display = 'inline';
      weAdd.innerHTML = _('Add');
      weAdd.title = _('Add location');
      weAdd.onmouseover = js_styleLink;
      weAdd.onmouseout  = js_styleILink;
      weAdd.onmousedown = function () {
	if (msie) js_clearSelection ();
	js_edit ();
	return false;
      };

      var weRefresh = GID ('weRefresh');
      weRefresh.style.display = 'inline';
      weRefresh.innerHTML = _('Refresh');
      weRefresh.title = _('Refresh Weather News');
      weRefresh.onmouseover = js_styleLink;
      weRefresh.onmouseout  = js_styleILink;
      weRefresh.onmousedown = js_refresh;

      GID ('weLocationD1').innerHTML = _('Location ID:');
      GID ('weLocationD2').innerHTML = _('Description:');
      GID ('weLocationD3').innerHTML = _('Unit:');

      GID ('weLocationSave').value = _('Save');
      GID ('weLocationForm').onsubmit = function () { js_validateCode (); return false; };
      var weLocationRem = GID ('weLocationRem');
      weLocationRem.value = _('Delete');
      weLocationRem.onclick = js_remLocation;
      weLocationRem.style.display = 'none';
      var weLocationCancel = GID ('weLocationCancel');
      weLocationCancel.value = _('Cancel');
      weLocationCancel.onclick = js_closeEdit;
      var weLocationCode = GID ('weLocationCode');
      var weLocationDesc = GID ('weLocationDesc')
      js_prepareInput (weLocationCode);
      js_prepareInput (weLocationDesc);
      weLocationCode.onchange = js_changed;
      weLocationDesc.onchange = js_changed;
      GID ('weLocationUnit').onchange = js_changed;

      /* GID ('weLocations').innerHTML = '<p>' + _('Loading...') + '</p>';
         js_initWeather (js_fetchWeatherList); */
      win.style.width = '500px';
      win.style.height = '285px';
      GID ('weWindowContent').style.height = '240px';
      winInitiated = true;
    }

    if (win.style.display == 'none') {
      var y = js_findPosY (GID ('Weather'));
      if (y == 0)
	js_popUp (win);
      else {
	win.style.left = bwLeft + 'em';
	win.style.top = (y + 10) + 'px';
      }
      js_setupDrag (win);
    }
    js_registerWindow (win);

    if (lastRefresh) {
      var ct = new Date ().getTime ();
      if ((ct - lastRefresh) > 5400000)
	js_refresh ();
    }
    return false;
  }

  function js_closeWindow () {
    GID ('weWindowTitleBar').onmousedown = null;
    win.style.display = 'none';
    js_initAllKShortcuts ();
  }

  function js_initWeather (cb) {
    if (transformerWeather) {
      cb (); return;
    }
    var xh = js_initHouseholdCleanser ();
    if (!xh) return;
    try {
      xh.open ('GET', 'd?q=wt', true);
      xh.setRequestHeader ('X-Referer', 'CNA');
      xh.onreadystatechange = function () {
	if (xh.readyState == 4) {
	  if (xh.status == 200) {
	    transformerWeather = new Transformer (xh);
	    cb ();
	  }
	  else {
	    js_stderr ('initWeather Error: ' + xh.status +': '+ xh.statusText);
	  }
	  xh = null;
	}
      };
      xh.send (null);
    } catch (e) {
      js_stderr ('initWeather Error:' + e.name +': '+ e.message);
    }
  }

  function js_fetchWeatherList () {
    js_sendX ('weather', 'q=1', 0, js_getWeatherList, js_getWeatherRecover);
  }

  function js_getWeatherList (data) {
    try {
      eval (data);
    } catch (e) {
      js_stderr ('getWeatherList: ' + e.name +': '+ e.message);
      return;
    }

    GID ('weLocations').innerHTML = '';
    for (var id in cheetahWeather) {
      var d = document.createElement ('DIV');
      d.id = 'weather_' + id;
      GID ('weLocations').appendChild (d);
      if (!firstForecastId)
	firstForecastId = id;
    }

    js_refresh ();
  }

  function js_refresh () {
    if (msie) js_clearSelection ();
    if (!js_checkOnline ()) return false;
    if (refreshCnt < 1) {
      refreshCnt = js_length (cheetahWeather);
      for (var id in cheetahWeather) {
	GID ('weather_' + id).innerHTML = '<p>' + _('Loading...') + '</p>';
	js_getWeather (id, js_transformWeather, js_getWeatherRecover);
      }
      lastRefresh = new Date ().getTime ();
    }
    return false;
  }

  function js_getWeatherRecover (status, statusText) {
    js_stderr ('getWeather Error: ' + status +': '+ statusText);
    refreshCnt--;
  }

  function js_getWeather (id, cb, fail) {
    return js_sendX ('weather', 'id=' + id, true,
		     function (xmlDocument) { cb (xmlDocument, id); }, fail);
  }

  function js_transformWeather (xmlDocument, id) {
    try {
      var d = GID ('weather_' + id);
      d.innerHTML = js_decodeEntities (transformerWeather.transform (xmlDocument));
      js_traverseDOM (d, prepareWeather, id);
    }
    catch (e) {
      js_stderr ('transformWeather Error: ' + e.name +': '+ e.message);
    }
    refreshCnt--;
  }

  function prepareWeather (n, id) {
    if (n.tagName == 'SPAN') {
      if (n.className == 'weMsg') {
	var arr = n.innerHTML.split ('/');
	var out = gettext (arr[0]);
	if (arr[1]) out += '/' + gettext (arr[1]);
	n.innerHTML = out;
      }
      else if (n.className == 'locationName')
	n.innerHTML = cheetahWeather[id][0];
      else if (n.className == 'linkMore') {
	n.innerHTML = _('more');
	n.title = '[' + _('External link') + ']';
      }
      else if (n.className == 'weError')
	n.innerHTML = _('Wrong location or data temporarily unavailable.');
    }
    else if (n.tagName == 'TD' && n.className == 'weLinkEdit') {
      n.title = _('Edit this location');
      n.onmousedown = function () {
	if (msie) js_clearSelection ();
	js_edit (id);
	return false;
      };
    }
    else if (n.tagName == 'TD' && n.className == 'weForecast' && id == firstForecastId) {
      if (n.firstChild.tagName == 'IMG') {
	var wf = GID ('weForecast');
	if (wf) {
	  var w = document.createElement ('IMG');
	  w.src = n.firstChild.src;
	  w.width = w.height = 52;
	  w.title = _("Tomorrow's weather forecast");
	  w.onclick = js_openWindow;
	  wf.innerHTML = '';
	  wf.appendChild (w);
	}
      }
    }
  }

  function js_changed () {
    if (!changed) {
      changed = true;
      GID ('weLocationSave').disabled = false;
    }
  };

  function js_edit (id) {
    GID ('weLocationStatusBar').style.display = 'none';
    GID ('weLocationSave').disabled = true;
    changed = false;
    if (id) {
      GID ('weLocationRem').style.display = 'inline';
      GID ('weLocationD0').innerHTML = '<b>' + _('Editing location') + ' ' + cheetahWeather[id][0] + '</b>';
      GID ('weLocationId').value   = id;
      GID ('weLocationDesc').value = js_decodeEntities (cheetahWeather[id][0]);
      GID ('weLocationCode').value = cheetahWeather[id][1];
      GID ('weLocationUnit').value = cheetahWeather[id][2];
    }
    else {
      GID ('weLocationRem').style.display = 'none';
      GID ('weLocationD0').innerHTML = '<b>' + _('Add new location.') + '</b>';
      GID ('weLocationId').value   = '';
      GID ('weLocationDesc').value = '';
      GID ('weLocationCode').value = '';
      GID ('weLocationUnit').selectedIndex = 0;
    }
    GID ('weRefresh').style.display = 'none';
    GID ('weLocations').style.display = 'none';
    GID ('weEditArea').style.display = 'block';
    if (!id)
      GID ('weLocationCode').focus ();
  }

  function js_closeEdit () {
    GID ('weLocationCancel').blur ();
    GID ('weRefresh').style.display = 'inline';
    GID ('weEditArea').style.display = 'none';
    GID ('weLocations').style.display = 'block';
  }

  function js_validateCode () {
    if (!js_checkOnline ()) return;
    var code = GID ('weLocationCode').value;
    var regex = /^[A-Z]{4}[0-9]{4}$/;
    if (!regex.test (code)) {
      js_updateLocationStatusBar ('red', _('Invalid location ID'));
    }
    else {
      GID ('weLocationSave').disabled = true;
      GID ('weLocationRem').disabled = true;
      var weLocationId = GID ('weLocationId').value;
      var snd = 'save=1';
      if (weLocationId != '')
	snd += '&id=' + encodeURIComponent (weLocationId);
      snd += '&code=' + encodeURIComponent (code);
      snd += '&desc=' + encodeURIComponent (GID ('weLocationDesc').value);
      snd += '&unit=' + encodeURIComponent (GID ('weLocationUnit').value);
      js_updateLocationStatusBar ('green', _('Saving location...'));
      js_sendX ('weather', snd, 1, js_changeLocation, js_validateLocationRecover);
    }
  }

  function js_updateLocationStatusBar (color, msg) {
    var statusBar = GID ('weLocationStatusBar');
    statusBar.style.backgroundColor = color;
    statusBar.innerHTML = '&nbsp;' + msg + '&nbsp;';
    statusBar.style.display = 'inline';
  }

  function js_changeLocation (xml) {
    var sts = js_xmlStatus (xml);
    if (sts) {
      js_updateLocationStatusBar ('red', sts);
    }
    else {
      js_updateLocationStatusBar ('green', _('OK'));
      js_fetchWeatherList ();
    }
    GID ('weLocationRem').disabled = false;
    if (!sts) {
      GID ('weLocationSave').disabled = true;
      changed = false;
      js_closeEdit ();
    }
    else
      GID ('weLocationSave').disabled = false;
  }

  function js_validateLocationRecover (status, statusText) {
    js_stderr ('weatherLocation Error: ' + status +': '+ statusText);
    GID ('weLocationSave').disabled = false;
    GID ('weLocationRem').disabled = false;
  }

  function js_remLocation () {
    if (!js_checkOnline ()) return;
    if (confirm (_('Are you sure you want to delete this location?'))) {
      GID ('weLocationSave').disabled = true;
      GID ('weLocationRem').disabled = true;
      var snd = 'rem=' + encodeURIComponent (GID ('weLocationId').value);
      js_updateLocationStatusBar ('green', _('Deleting...'));
      js_sendX ('weather', snd, 1, js_changeLocation, js_validateLocationRecover);
    }
  }

  function dummyTranslation () {
    /* TRANSLATORS: BEGIN JS */
    N_('Location'); N_('Forecast'); N_('Now'); N_('Today'); N_('Tomorrow'); N_('Feels like');
    N_('Wind'); N_('Humidity'); N_('Pressure'); N_('Sunrise'); N_('Sunset');
    N_('Temp'); N_('High'); N_('Low'); N_('Sun'); N_('Mon'); N_('Tue'); N_('Wed');
    N_('Thu'); N_('Fri'); N_('Sat'); N_('kph'); N_('mb'); N_('Windy');
    N_('Mist'); N_('Fair'); N_('Clear'); N_('Mostly Clear'); N_('Mostly Cloudy');
    N_('Partly Cloudy'); N_('Cloudy'); N_('Mostly Sunny'); N_('Sunny');
    N_('Rain'); N_('Light Rain'); N_('Freezing Rain'); N_('Heavy Rain'); N_('Snow');
    N_('Light Snow'); N_('AM Light Snow'); N_('PM Light Snow'); N_('Snow Showers');
    N_('AM Snow'); N_('PM Snow'); N_('AM Snow Showers'); N_('PM Snow Showers');
    N_('Scattered Snow Showers'); N_('Flurries'); N_('Drizzle'); N_('Freezing Drizzle');
    N_('Haze'); N_('Showers'); N_('AM Showers'); N_('PM Showers');
    N_('Showers Early'); N_('Showers Late'); N_('Few Showers'); N_('Heavy Snow');
    N_('Fog'); N_('Fog Early'); N_('Fog Late'); N_('Foggy'); N_('AM Clouds'); N_('PM Sun');
    N_('Thunder'); N_('Thunderstorms'); N_('Isolated Thunderstorms'); N_('AM Fog');
    N_('AM Drizzle'); N_('AM Light Rain'); N_('PM Light Rain'); N_('PM Clouds');
    N_('Light Rain Early'); N_('Snow Showers Late'); N_('Few Snow Showers');
    N_('Snow to Wintry Mix'); N_('Wintry Mix'); N_('Thundershowers'); N_('Rain to Snow');
    N_('Clouds Early'); N_('Clouds Late'); N_('Clearing Late'); N_('AM Ice');
    N_('Sleet'); N_('Scattered Flurries'); N_('Snow Showers Early'); N_('Light Snow Late');
    N_('Snow Early'); N_('Snow Late'); N_('Wind Early'); N_('AM Rain'); N_('PM Rain');
    N_('PM Fog'); N_('Drizzle Early'); N_('Drizzle Late'); N_('PM Drizzle');
    N_('Light Rain Late'); N_('Wind Late'); N_('Scattered Strong Storms'); N_('Strong Storms');
    N_('AM Light Wintry Mix'); N_('PM Light Wintry Mix'); N_('Light Wintry Mix');
    N_('AM Thunderstorms'); N_('PM Thunderstorms'); N_('Thunderstorms Late'); N_('Rain Early');
    N_('Thunderstorms Early'); N_('AM Thundershowers'); N_('PM Thundershowers');
    N_('Thundershowers Early'); N_('Thundershowers Late'); N_('Rain Late'); N_('Ice to Rain');
    /* TRANSLATORS: END JS */
    N_('Scattered Thunderstorms');
  }
}
