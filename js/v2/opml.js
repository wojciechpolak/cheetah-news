/*
   Cheetah News JS/v2 OPML
   Copyright (C) 2005, 2006, 2008, 2009, 2010 Wojciech Polak.

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

Modules.OPML = new function () {

  var transformerOPML = null;

  this.init = function () {
    prepareLink ('feedDirectoryLink', _('Browse feed directory'), '', openFeedDirectory);
    prepareLink ('popularFeedsLink', _('Browse popular feeds (Cheetah)'), '', openPopularFeeds);
    prepareLink ('followFriends', _('Follow friends & family'), '', openFollowFriends);
    return true;
  };

  this.findFeeds = function (q) {
    if (typeof google != 'undefined') {
      var pf = GID ('popularFeeds');
      pf.innerHTML = '&nbsp;' + _('Loading...');
      google.feeds.findFeeds (q, function (res) {
	  if (!res.error) {
	    if (res.entries.length) {
	      pf.innerHTML = '';
	      for (var i = 0; i < res.entries.length; i++) {
		if (res.entries[i].url.indexOf ('wikipedia') != -1 ||
		    res.entries[i].url.indexOf ('youtube') != -1)
		  continue;
		var l = DCE ('span', {className: 'outlink',
				      url: res.entries[i].url,
				      title: sprintf (_('Open "%s", %s'),
						      res.entries[i].title.stripTags ().replace (/&#39;/g, "'"),
						      res.entries[i].url)},
		  [res.entries[i].title.stripTags ()]);
		l.onclick = validateIFeed;
		var t = DCE ('span', {},
			     [DCE ('img', {className: 'img-16-feed', width:16, height:16,
					   src:'images/t.gif', vAlign:'middle'}),
			       document.createTextNode (String.fromCharCode (160) +
							String.fromCharCode (160)),
			       l, DCE ('br')]);
		pf.appendChild (t);
	      }
	    }
	    else {
	      pf.innerHTML = _('No results found');
	    }
	  }
	  else {
	    pf.innerHTML = _('An error occurred, please try again');
	  }
	});
      $(pf).slideDown ();
    }
  };

  function openPopularFeeds () {
    if (!checkOnline ()) return false;
    initFeedArea ();
    initOPML (getPopularFeeds);
    return false;
  }

  function openFeedDirectory () {
    if (!checkOnline ()) return false;
    initFeedArea ();
    initOPML (getFeedDirectory);
    return false;
  }

  var followServices = {
    'blogspot': ['Blogspot', 'http://%s.blogspot.com/'],
    'delicious': ['Delicious', 'http://delicious.com/%s'],
    'flickr': ['Flickr', 'http://www.flickr.com/photos/%s/'],
    'friendfeed': ['FriendFeed', 'http://friendfeed.com/%s'],
    'livejournal': ['LiveJournal', 'http://%s.livejournal.com/'],
    'picasa': ['PicasaWeb', 'http://picasaweb.google.com/%s'],
    'smugmug': ['SmugMug', 'http://%s.smugmug.com/'],
    'twitter': ['Twitter', 'http://twitter.com/statuses/user_timeline/%s.atom'],
    'wordpress': ['WordPress.com', 'http://%s.wordpress.com/']
  };

  function openFollowFriends () {
    if (!checkOnline ()) return false;
    var pf = GID ('popularFeeds');

    var username = DCE ('input', {size:16});
    prepareInputWithDefault (username, _('username'));

    var service = document.createElement ('select');
    for (var n in followServices) {
      service.options[service.options.length] = new Option (followServices[n][0], n);
    }

    var sbutton = DCE ('input', {type:'submit', value:_('open')});
    sbutton.onclick = function () {
      if (username.value != '' && username.value != username._defaultvalue) {
	var s = followServices[service.options[service.selectedIndex].value];
	var url = sprintf (s[1], username.value);
	openFeedPreview (url, username.value + '@' + service.value);
      }
      return false;
    };

    var o = DCE ('form', {action:''}, [document.createTextNode (String.fromCharCode (160)),
				       username, document.createTextNode (' @ '),
				       service, document.createTextNode (' '),
				       sbutton]);
    pf.innerHTML = '<p>' + _('Follow news and updates from your friends & family. Enter their username and choose a popular service:') + '</p>';
    pf.appendChild (o);
    pf.style.display = 'block';
    return false;
  }

  function initFeedArea () {
    var pf = GID ('popularFeeds');
    pf.innerHTML = '&nbsp;' + _('Loading...');
    pf.style.display = 'block';
  }

  function initOPML (cb) {
    if (transformerOPML) {
      cb (); return;
    }
    var xh = initHouseholdCleanser ();
    if (!xh) return;
    try {
      xh.open ('GET', dsp ('op'), true);
      xh.onreadystatechange = function () {
	if (xh.readyState == 4) {
	  if (xh.status == 200) {
	    transformerOPML = new Transformer (xh);
	    cb ();
	  }
	  else {
	    stderr ('initOPML Error: ' + xh.status +': '+ xh.statusText);
	  }
	  xh = null;
	}
      };
      xh.send (null);
    } catch (e) {
      stderr ('initOPML Error:' + e.name +': '+ e.message);
    }
  }

  function getOPML (file, cb) {
    var xh = initHouseholdCleanser ();
    if (!xh) return;
    try {
      xh.open ('GET', file, true);
      xh.onreadystatechange = function() {
	if (xh.readyState == 4) {
	  if (xh.status == 200) {
	    transformOPML (xh.responseXML);
	  }
	  else {
	    stderr ('getOPML Error: ' + xh.status + ': ' + xh.statusText);
	  }
	  xh = null;
	}
      }
      xh.send (null);
    } catch (e) {
      stderr ('getOPML Error:' + e.name +': '+ e.message);
    }
  }

  function getFeedDirectory () {
    getOPML (dsp ('dir'));
  }

  function getPopularFeeds () {
    getOPML ('d?q=popular');
  }

  function transformOPML (xmlDocument) {
    try {
      var pf = GID ('popularFeeds');
      pf.innerHTML = decodeEntities (transformerOPML.transform (xmlDocument));
      traverseDOM (pf, prepareOutline, null);
    }
    catch (e) {
      stderr ('transformOPML Error: ' + e.name +': '+ e.message);
    }
  }

  function prepareOutline (n, args) {
    if (n.className == 'outline')
      n.onmousedown = toggleOutline;
    else if (n.className == 'outlink') {
      n.title = sprintf (_('Open "%s"'), n.innerHTML);
      n.onclick = validateIFeed;
    }
    else if (n.className == 'popularCount') {
      n.innerHTML = '';
      /*
      var count = parseInt (n.innerHTML);
      n.innerHTML = '&nbsp;('
	+ sprintf (ngettext ('%d subscriber', '%d subscribers', count), count) + ')';
      */
    }
    else if (n.tagName == 'IMG' &&
	     n.parentNode &&
	     n.parentNode.parentNode &&
	     n.parentNode.parentNode.id == 'popularFeeds') {
      var osrc = n.getAttribute ('osrc');
      if (osrc) n.src = osrc;
    }
  }

  function validateIFeed () {
    openFeedPreview (this.getAttribute ('url'), this.innerHTML);
  }

  function toggleOutline () {
    var attr = this.getAttribute ('id');
    var id = attr.split ('_')[1];
    var lv = parseInt (attr.split ('_')[2]) + 1;
    var ol = document.getElementById ('outline_' + id +'_'+ lv);
    if (ol) {
      if (ol.style.display == 'none') {
	$(ol).slideDown ();
	for (var i = 0; i < ol.childNodes.length; i++) {
	  var l1 = ol.childNodes[i];
	  if (l1 != null && l1 != '') {
	    for (var j = 0; j < l1.childNodes.length; j++) {
	      var l2 = l1.childNodes[j];
	      if (l2.tagName == 'IMG') {
		var osrc = l2.getAttribute ('osrc');
		if (osrc) l2.src = osrc;
	      }
	    }
	  }
	}
      }
      else
	ol.style.display = 'none';
    }
    return false;
  }
}
