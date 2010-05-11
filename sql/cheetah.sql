--
--  Cheetah News SQL
--  Copyright (C) 2005, 2006, 2007, 2008, 2010 Wojciech Polak.
--
--  This program is free software; you can redistribute it and/or modify it
--  under the terms of the GNU General Public License as published by the
--  Free Software Foundation; either version 3 of the License, or (at your
--  option) any later version.
--
--  This program is distributed in the hope that it will be useful,
--  but WITHOUT ANY WARRANTY; without even the implied warranty of
--  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
--  GNU General Public License for more details.
--
--  You should have received a copy of the GNU General Public License along
--  with this program.  If not, see <http://www.gnu.org/licenses/>.
--

-- DROP TABLE IF EXISTS user;
CREATE TABLE user (
  id int(11) NOT NULL auto_increment,
  email varchar(128) NOT NULL default '',
  pass varchar(255) NOT NULL default '',
  active enum('yes','no','suspended') NOT NULL default 'yes',
  lastLog datetime default NULL,
  lastAccess datetime default NULL,
  lastUC datetime default NULL,
  logCount int(11) NOT NULL default '0',
  failogCount tinyint(2) unsigned NOT NULL default '0',
  lang varchar(7) default NULL,
  showActive tinyint(1) NOT NULL default '1',
  oldestFirst tinyint(1) NOT NULL default '0',
  refresh int(4) NOT NULL default '0',
  fbUID bigint unsigned NOT NULL default '0',
  PRIMARY KEY  (id),
  UNIQUE KEY email (email),
  KEY active (active),
  KEY lastAccess (lastAccess)
) ENGINE=InnoDB CHARSET=utf8;

-- DROP TABLE IF EXISTS openid;
CREATE TABLE openid (
  id int(11) NOT NULL auto_increment,
  userid int(11) NOT NULL REFERENCES user.id,
  identity varchar(255) NOT NULL default '',
  PRIMARY KEY (id),
  KEY userid (userid),
  UNIQUE KEY identity (identity)
) ENGINE=InnoDB CHARSET=utf8;

-- DROP TABLE IF EXISTS feed;
CREATE TABLE feed (
  id int(11) NOT NULL auto_increment,
  url varchar(255) NOT NULL default '',
  description varchar(255) NOT NULL default '',
  PRIMARY KEY (id)
) ENGINE=InnoDB CHARSET=utf8;

-- DROP TABLE IF EXISTS folder;
CREATE TABLE folder (
  id int(11) NOT NULL auto_increment,
  userid int(11) NOT NULL REFERENCES user.id,
  fname varchar(64) NOT NULL default '',
  pri int(11) NOT NULL default '1',
  PRIMARY KEY (id),
  KEY userid (userid)
) ENGINE=InnoDB CHARSET=utf8;

-- DROP TABLE IF EXISTS subscription;
CREATE TABLE subscription (
  id int(11) NOT NULL auto_increment,
  userid int(11) NOT NULL REFERENCES user.id,
  feedid int(11) NOT NULL REFERENCES feed.id,
  pri int(11) NOT NULL default '1',
  latest tinyint NOT NULL default '10',
  expand tinyint NOT NULL default '0',
  folder int(11) NOT NULL default '0',
  active tinyint(1) NOT NULL default '0',
  description varchar(255) NOT NULL default '',
  PRIMARY KEY (id),
  KEY userid (userid),
  KEY feedid (feedid)
) ENGINE=InnoDB CHARSET=utf8;

-- DROP TABLE IF EXISTS cache;
CREATE TABLE cache (
  feedid int(11) NOT NULL REFERENCES feed.id,
  eTag varchar(255),
  lastModified varchar(64),
  lastAccessed datetime,
  xml mediumblob,
  PRIMARY KEY (feedid)
) ENGINE=InnoDB CHARSET=utf8;

-- DROP TABLE IF EXISTS forgotpassword;
CREATE TABLE forgotpassword (
  id int(11) NOT NULL auto_increment,
  email varchar(255) NOT NULL default '',
  hash varchar(255) NOT NULL,
  date datetime NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY (hash)
) ENGINE=InnoDB CHARSET=utf8;

-- DROP TABLE IF EXISTS registration;
CREATE TABLE registration (
  id int(11) NOT NULL auto_increment,
  email varchar(255) NOT NULL default '',
  pass varchar(255) NOT NULL default '',
  hash varchar(255) NOT NULL,
  openid_identity varchar(255),
  rdate datetime NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY (hash)
) ENGINE=InnoDB CHARSET=utf8;

-- DROP TABLE IF EXISTS ntag;
CREATE TABLE ntag (
  id int(11) NOT NULL auto_increment,
  tag varchar(255) NOT NULL default '',
  PRIMARY KEY (id),
  UNIQUE KEY (tag)
) ENGINE=InnoDB CHARSET=utf8;

-- DROP TABLE IF EXISTS note;
CREATE TABLE note (
  id int(11) NOT NULL auto_increment,
  userid int(11) NOT NULL REFERENCES user.id,
  public enum('yes','no') NOT NULL default 'no',
  color varchar(32) NOT NULL default '',
  date datetime NOT NULL,
  mstamp timestamp,
  title varchar(64),
  note text not null default '',
  PRIMARY KEY (id),
  KEY userid (userid)
) ENGINE=InnoDB CHARSET=utf8;

-- DROP TABLE IF EXISTS jntag;
CREATE TABLE jntag (
  id int(11) NOT NULL auto_increment,
  userid int(11) NOT NULL REFERENCES user.id,
  noteid int(11) NOT NULL REFERENCES note.id,
  tagid int(11) NOT NULL REFERENCES ntag.id,
  PRIMARY KEY (id)
) ENGINE=InnoDB CHARSET=utf8;

-- DROP TABLE IF EXISTS weather;
CREATE TABLE weather (
  id int(11) NOT NULL auto_increment,
  userid int(11) NOT NULL REFERENCES user.id,
  service enum('yweather') NOT NULL DEFAULT 'yweather',
  code varchar(64) NOT NULL DEFAULT '',
  unit enum('C', 'F') NOT NULL DEFAULT 'C',
  description varchar(64) NOT NULL DEFAULT '',
  PRIMARY KEY (id),
  KEY userid (userid)
) ENGINE=InnoDB CHARSET=utf8;

-- DROP TABLE IF EXISTS weathercache;
CREATE TABLE weathercache (
  code varchar(64) NOT NULL REFERENCES weather.code,
  lastModified varchar(64),
  lastAccessed datetime,
  xml mediumblob,
  PRIMARY KEY (code)
) ENGINE=InnoDB CHARSET=utf8;

-- DROP TABLE IF EXISTS marker;
CREATE TABLE marker (
  id int(11) NOT NULL auto_increment,
  userid int(11) NOT NULL REFERENCES user.id,
  mstamp timestamp,
  markers text not null default '',
  PRIMARY KEY (id),
  KEY userid (userid)
) ENGINE=InnoDB CHARSET=utf8;

