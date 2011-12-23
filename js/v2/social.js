/*
   Cheetah News JS/v2 Social
   Copyright (C) 2010, 2012 Wojciech Polak.

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

Modules.Social = new function () {
  var self = this;
  var initiated = false;
  var lastRefresh = null;
  var fbSessionExpires = null;

  this.init = function () {
    setTimeout (function () {
	$.getScript ('http://connect.facebook.net/en_US/all.js', function () {
	    FB.init ({appId: CONF.fb_app_id, oauth: true, status: true});
	    setup ();
	  });
      }, 2000);
    return true;
  };

  function setup () {
    if (initiated) return;
    var s = GID ('sWindowSocial');
    if (s) {
      var img = DCE ('img', {id: 'sWindowStreamFB', src: 'images/t.gif', alt: '',
			     title: _('Facebook News Feed')});
      img.onclick = function () { self.openFBStream (); };
      s.appendChild (img);
    }
    var m = GID ('menuOpenFacebook');
    if (m) {
      m.className = 'linkCM';
      setCmhLink (m, function () { this.className = 'linkCM';
	  self.openFBStream (); });
    }
    initiated = true;
  }

  this.hideAll = function () {
    GID ('bWindow_fb').style.display = 'none';
  };

  this.openFBStream = function (args) {
    hideMenu ();
    if (!checkOnline ()) return;
    if (typeof FB == undefined) return;

    hideAll ();
    unhighlightSCursor (sWindowCursor);

    var bWindow = GID ('bWindow_fb');
    bWindow.style.display = 'block';
    fCursor = 0;
    highlightFCursor (bWindow);
    scrollToElement (bWindow);
    cursor = 1;

    FB.getLoginStatus (function (res1) {
	var expired = true;
	if (!fbSessionExpires && res1.authResponse && 'expires' in res1.authResponse) {
	  fbSessionExpires = res1.authResponse['expires'];
	  if (fbSessionExpires === 0)
	    expired = false;
	}
	if (fbSessionExpires) {
	  var now = new Date ().getTime () / 1000;
	  if (fbSessionExpires - now > 1)
	    expired = false;
	}
	if (res1.authResponse && !expired) {
	  fetchFBStream (args);
	  if ('expires' in res1.authResponse)
	    fbSessionExpires = res1.authResponse['expires'];
	}
	else {
	  FB.login (function (res2) {
	      if (res2.authResponse) {
		writeCookie ('cheetahFBL', 1);
		if ('expires' in res2.authResponse)
		  fbSessionExpires = res2.authResponse['expires'];
		fetchFBStream (args);
	      }
	    }, {scope: 'read_stream'});
	}
      });
  }

  function fetchFBStream (args) {
    var opts = $.extend ({}, {
      clear: true,
      limit: 25}, args);

    if (lastRefresh) {
      var ct = new Date ().getTime ();
      if ((ct - lastRefresh) < 500000)
	return;
    }
    var content = GID ('bWindowContent_fb');
    feedWaiting ('fb');

    FB.api ('/me/home', {limit: opts.limit}, function (res) {
	if (res.data) {
	  if (opts.clear) {
	    content.innerHTML = '<div class="channelOptions">'
	      + '<a id="cl_fb" class="channelLink" href="http://www.facebook.com/" target="_blank">'
	      + '<img src="images/t.gif" class="img-elink" style="vertical-align:top"/>'
	      + '</a></div>';
	  }
	  for (var i = 0; i < res.data.length; i++) {
	    appendFBEntry (content, res.data[i]);
	  }
	  convertMediaLinks (content);
	  $('a.morecomments', content).click (showMoreComments);
	}
	GID ('feedWaiting_fb').style.display = 'none';
	lastRefresh = new Date ().getTime ();
	if (typeof tracker != 'undefined')
	  tracker._trackEvent ('Facebook', 'ReadStream');
      });
  }

  function appendFBEntry (dst, e) {
    var body = '';
    var name = null;

    if ('message' in e)
      body += '<div>'+ e.message.createLinks () +'</div>';
    if ('name' in e) {
      name = e.name;
      body += '<p>'+ e.name +'</p>';
    }
    if ('picture' in e && 'link' in e) {
      body += '<p class="thumbnails">';
      body += '<a href="'+ e.link +'" rel="nofollow" target="_blank">'
	+ '<img src="'+ e.picture +'" alt="thumbnail"/></a> ';
      if ('description' in e)
	body += '<div class="fb-description">'+ e.description +'</div>';
      else if ('caption' in e && name != e.caption)
	body += '<div class="fb-caption">'+ e.caption +'</div>';
      body += '</p>';
    }
    else {
      if ('description' in e)
	body += '<div class="fb-description">'+ e.description +'</div>';
      else if ('caption' in e && name != e.caption)
	body += '<div class="fb-caption">'+ e.caption +'</div>';
    }

    var picture = '<a href="http://www.facebook.com/profile.php?id='
      + e.from.id + '" target="_blank"><img height="50" width="50" src="http://graph.facebook.com/'
      + e.from.id + '/picture" class="photo" alt="[img]" title="'
      + e.from.name +'"/></a>';


    var likes = '';
    if ('likes' in e) {
      likes = '<div class="likes">'
	+ sprintf (ngettext ('%d person like this', '%d people like this',
			     e.likes), e.likes) + '</div>';
    }

    var comments = '';
    if ('comments' in e && 'data' in e.comments) {
      comments += '<div class="comments">';
      var no = e.comments.data.length > 2 ? 2 : e.comments.data.length;
      for (var i = 0; i < e.comments.data.length; i++) {
	var c = e.comments.data[i];
	var v = i < no ? '' : ' style="display:none"';
	comments += '<div class="comment"'+ v +'><a href="http://www.facebook.com/profile.php?id='
	  + c.from.id +'" target="_blank"><img '+ (i < no ? '' : 'o') +'src="http://graph.facebook.com/'
	  + c.from.id +'/picture" title="'+ c.from.name +'" alt="[img]"/></a>'
	  + '<div class="content"><a href="http://www.facebook.com/profile.php?id='
	  + c.from.id +'" target="_blank">'+ c.from.name + '</a>: <div class="message">'
	  + c.message +'</div></div><div style="clear:both;"></div></div>';
      }
      if (e.comments.data.length > 2) {
	var id = e.id.split ('_');
	comments += '<div class="comment"><a href="http://www.facebook.com/profile.php?id='
	  + e.from.id +'&v=wall&story_fbid='+ id[1] +'" target="_blank" class="morecomments">'
	  + _('more') +'</a></div>';
      }
      comments += '</div>';
    }

    entry = '<div class="entryTop"><span class="entryLink">'
      + picture +'</span></div><div class="entryBody"><span>'
      + body +'</span><div class="entryDate">'
      + parseFBDate (e.updated_time) +'</div>'
      + likes + comments + '</div><div style="clear:both;"></div>';

    dst.appendChild (DCE ('div', {id: 'entry_fb' + e.id,
	    className: 'entry social'}, [entry]));
  }

  function showMoreComments () {
    $('div.comment', this.parentNode.parentNode)
      .each (function (i) {
	  var img = $('img', this);
	  if (img.length)
	    img.attr ('src', img.attr ('osrc'));
	  $(this).show ();
	});
    $(this.parentNode).remove ();
    return false;
  };

  function parseFBDate (d) {
    return d.substr (0, 10) +' '+ d.substr (11, 5);
  }
};
