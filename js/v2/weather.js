/*
   Cheetah News JS/v2 Weather
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
    var module = GID ('menuOpenWeather');
    if (module) {
      module.innerHTML += '&nbsp;' + _('Weather Report') + '&nbsp;';
      setCmhLink (module, openWindow);
      if (!msie && !iphone)
	Nifty ('div#weatherContent');
      initWeather (fetchWeatherList);
      return true;
    }
    else {
      module.style.display = 'none';
      return false;
    }
  };

  this.shortcut = function () {
    openWindow ();
  };

  this.fastclose = function () {
    closeEdit ();
    $('#weatherContent').hide ();
  };

  this.isVisible = function () {
    return GID ('weatherContent').style.display == 'block';
  };

  function openWindow () {
    hideMenu ();
    if (GID ('weatherContent').style.display == 'block') {
      closeWindow ();
      return;
    }
    else {
      fastcloseCWindow ();
    }
    if (msie) clearSelection ();

    main.style.height = 'auto';
    $('#weatherContent').slideDown ();

    var list = $('#weLocations .weatherLocationContent');
    var maxHeight = 0;
    list.each (function () {
	maxHeight = Math.max (maxHeight, $(this).height ());
      }).height (maxHeight);

    if (!winInitiated && checkOnline ()) {

      var weClose2 = GID ('weClose2');
      weClose2.title = _('Close');
      weClose2.style.display = 'inline';
      weClose2.onmousedown = closeWindow;

      var weClose1 = GID ('weClose1');
      weClose1.innerHTML = _('&laquo; return to reader');
      prepareWindowClose (weClose1, closeWindow);

      var weAdd = GID ('weAdd');
      weAdd.style.display = 'inline';
      weAdd.innerHTML = _('Add');
      weAdd.title = _('Add location');
      weAdd.onmousedown = function () {
	if (msie) clearSelection ();
	edit ();
	return false;
      };

      var weRefresh = GID ('weRefresh');
      weRefresh.style.display = 'inline';
      weRefresh.innerHTML = _('Refresh');
      weRefresh.title = _('Refresh Weather News');
      weRefresh.onmousedown = refresh;

      GID ('weLocationD1').innerHTML = _('Location ID:');
      GID ('weLocationD2').innerHTML = _('Description:');
      GID ('weLocationD3').innerHTML = _('Unit:');

      GID ('weLocationSave').value = _('Save');
      GID ('weLocationForm').onsubmit = function () { validateCode (); return false; };
      var weLocationRem = GID ('weLocationRem');
      weLocationRem.value = _('Delete');
      weLocationRem.onclick = remLocation;
      weLocationRem.style.display = 'none';
      var weLocationCancel = GID ('weLocationCancel');
      weLocationCancel.value = _('Cancel');
      weLocationCancel.onclick = closeEdit;
      var weLocationCode = GID ('weLocationCode');
      var weLocationDesc = GID ('weLocationDesc')
      prepareInput (weLocationCode);
      prepareInput (weLocationDesc);
      weLocationCode.onchange = fnc_changed;
      weLocationDesc.onchange = fnc_changed;
      GID ('weLocationUnit').onchange = fnc_changed;
      winInitiated = true;
      if (typeof tracker != 'undefined')
	tracker._trackEvent ('Weather', 'Open');
    }

    if (lastRefresh) {
      var ct = new Date ().getTime ();
      if ((ct - lastRefresh) > 5400000)
	refresh ();
    }
    return false;
  }

  function closeWindow () {
    var cb = Modules.Notes.isVisible () ? function () {} : resizeChrome;
    closeEdit ();
    $('#weatherContent').slideUp ('normal', cb);
  }

  function initWeather (cb) {
    if (transformerWeather) {
      cb (); return;
    }
    var xh = initHouseholdCleanser ();
    if (!xh) return;
    try {
      xh.open ('GET', 'd?q=wt/2', true);
      xh.setRequestHeader ('X-Referer', 'CNA');
      xh.onreadystatechange = function () {
	if (xh.readyState == 4) {
	  if (xh.status == 200) {
	    transformerWeather = new Transformer (xh);
	    cb ();
	  }
	  else {
	    stderr ('initWeather Error: ' + xh.status +': '+ xh.statusText);
	  }
	  xh = null;
	}
      };
      xh.send (null);
    } catch (e) {
      stderr ('initWeather Error:' + e.name +': '+ e.message);
    }
  }

  function fetchWeatherList () {
    sendX ('weather', 'q=1', 0, getWeatherList, getWeatherRecover);
  }

  function getWeatherList (data) {
    try {
      eval (data);
    } catch (e) {
      stderr ('getWeatherList: ' + e.name +': '+ e.message);
      return;
    }

    GID ('weLocations').innerHTML = '';
    GID ('weLocationsNames').innerHTML = '<h2><em>' + _('Weather Report') + '</em></h2>';
    var ul = DCE ('ul');
    GID ('weLocationsNames').appendChild (ul);
    for (var id in cheetahWeather) {
      var d = DCE ('div', {id: 'weather_' + id,
			   className: 'weatherLocationContent'});
      d.style.display = 'none';
      var a = DCE ('a', {id: 'weName_' + id,
			 className: 'weatherLocationTitle pointer'},
	[cheetahWeather[id][0]]);
      ul.appendChild (DCE ('li', {}, [a]));
      GID ('weLocations').appendChild (d);
      if (!firstForecastId) {
	firstForecastId = id;
      }
    }

    $('#weLocations .weatherLocationContent').show().next().hide();
    $('#weLocationsNames .weatherLocationTitle').
      click (function () {
	  var id = this.id.split ('_')[1];
	  var toShow = $('#weather_' + id);
	  if (toShow.is (':visible'))
	    return;
	  var toHide = $('#weLocations .weatherLocationContent:visible');
	  var hideHeight = toHide.height (),
	    showHeight = toShow.height (),
	    difference = showHeight / hideHeight;
	  toShow.css ({height: 0, overflow: 'hidden'}).show ();
	  toHide.animate ({height: 'hide'},{
	    step: function (now) {
		var current = (hideHeight - now) * difference;
		if ($.browser.msie || $.browser.opera) {
		  current = Math.ceil (current);
		}
		toShow.height (current);
	    },
	    duration: 300,
	    easing: 'swing'
	  });
	});

    refresh ();
  }

  function refresh () {
    if (msie) clearSelection ();
    if (!checkOnline ()) return false;
    if (refreshCnt < 1) {
      refreshCnt = length (cheetahWeather);
      for (var id in cheetahWeather) {
	GID ('weather_' + id).innerHTML = '<p>' + _('Loading...') + '</p>';
	getWeather (id, transformWeather, getWeatherRecover);
      }
      lastRefresh = new Date ().getTime ();
    }
    return false;
  }

  function getWeatherRecover (status, statusText) {
    stderr ('getWeather Error: ' + status +': '+ statusText);
    refreshCnt--;
  }

  function getWeather (id, cb, fail) {
    return sendX ('weather?id=' + id, null, true,
		  function (xmlDocument) { cb (xmlDocument, id); }, fail);
  }

  function transformWeather (xmlDocument, id) {
    try {
      var d = GID ('weather_' + id);
      d.innerHTML = decodeEntities (transformerWeather.transform (xmlDocument));
      traverseDOM (d, prepareWeather, id);
      $('.weMsg', d).each (function () {
	  n = this;
	  var arr = n.innerHTML.split ('/');
	  var out = gettext (arr[0]);
	  if (arr[1]) out += '/' + gettext (arr[1]);
	  n.innerHTML = out;
	});
      var t = $('.weatherTodayTitle span:first-child', d);
      t.html (cheetahWeather[id][0] + ' ' + t.html ());
    }
    catch (e) {
      stderr ('transformWeather Error: ' + e.name +': '+ e.message);
    }
    refreshCnt--;
  }

  function prepareWeather (n, id) {
    if (n.tagName == 'SPAN') {
      if (n.className == 'locationName')
	n.innerHTML = cheetahWeather[id][0];
      else if (n.className == 'weError')
	n.innerHTML = _('Wrong location or data temporarily unavailable.');
      else if (n.tagName == 'SPAN' && n.className == 'weLinkEdit') {
	n.innerHTML = _('edit');
	n.title = _('Edit this location');
	n.onmousedown = function () {
	  if (msie) clearSelection ();
	  edit (id);
	  return false;
	};
      }
    }
    else if (n.tagName == 'IMG' && n.id == 'weForecastImg' && id == firstForecastId) {
      var wf = GID ('weForecast');
      if (wf) {
	var w = document.createElement ('IMG');
	w.src = n.src;
	w.width = w.height = 52;
	w.title = _("Tomorrow's weather forecast");
	w.onclick = openWindow;
	wf.innerHTML = '';
	wf.appendChild (w);
      }
    }
    else if (n.tagName == 'A') {
      if (n.className == 'linkMore') {
	n.innerHTML = _('more');
	n.title = '[' + _('External link') + ']';
      }
    }
  }

  function fnc_changed () {
    if (!changed) {
      changed = true;
      GID ('weLocationSave').disabled = false;
    }
  };

  function edit (id) {
    GID ('weLocationStatusBar').style.display = 'none';
    GID ('weLocationSave').disabled = true;
    changed = false;
    if (id) {
      GID ('weLocationRem').style.display = 'inline';
      GID ('weLocationD0').innerHTML = '<b>' + _('Editing location') + ' ' + cheetahWeather[id][0] + '</b>';
      GID ('weLocationId').value   = id;
      GID ('weLocationDesc').value = decodeEntities (cheetahWeather[id][0]);
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
    GID ('weLocationsNames').style.display = 'none';
    GID ('weLocations').style.display = 'none';
    GID ('weEditArea').style.display = 'block';
    if (!id)
      GID ('weLocationCode').focus ();
  }

  function closeEdit () {
    GID ('weLocationCancel').blur ();
    GID ('weRefresh').style.display = 'inline';
    GID ('weLocationsNames').style.display = 'block';
    GID ('weLocations').style.display = 'block';
    GID ('weEditArea').style.display = 'none';
  }

  function validateCode () {
    if (!checkOnline ()) return;
    var code = GID ('weLocationCode').value;
    var regex = /^[A-Z]{4}[0-9]{4}$/;
    if (!regex.test (code)) {
      updateLocationStatusBar ('red', _('Invalid location ID'));
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
      updateLocationStatusBar ('green', _('Saving location...'));
      sendX ('weather', snd, 1, changeLocation, validateLocationRecover);
    }
  }

  function updateLocationStatusBar (color, msg) {
    var statusBar = GID ('weLocationStatusBar');
    statusBar.style.backgroundColor = color;
    statusBar.innerHTML = '&nbsp;' + msg + '&nbsp;';
    statusBar.style.display = 'inline';
  }

  function changeLocation (xml) {
    var sts = xmlStatus (xml);
    if (sts) {
      updateLocationStatusBar ('red', sts);
    }
    else {
      updateLocationStatusBar ('green', _('OK'));
      fetchWeatherList ();
    }
    GID ('weLocationRem').disabled = false;
    if (!sts) {
      GID ('weLocationSave').disabled = true;
      changed = false;
      closeEdit ();
    }
    else
      GID ('weLocationSave').disabled = false;
  }

  function validateLocationRecover (status, statusText) {
    stderr ('weatherLocation Error: ' + status +': '+ statusText);
    GID ('weLocationSave').disabled = false;
    GID ('weLocationRem').disabled = false;
  }

  function remLocation () {
    if (!checkOnline ()) return;
    if (confirm (_('Are you sure you want to delete this location?'))) {
      GID ('weLocationSave').disabled = true;
      GID ('weLocationRem').disabled = true;
      var snd = 'rem=' + encodeURIComponent (GID ('weLocationId').value);
      updateLocationStatusBar ('green', _('Deleting...'));
      sendX ('weather', snd, 1, changeLocation, validateLocationRecover);
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
