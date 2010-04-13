;;;; This file is part of Cheetah News Aggregator
;;;; Copyright (C) 2006 The Cheetah News Team
;;;;
;;;; This program is free software; you can redistribute it and/or modify it
;;;; under the terms of the GNU General Public License as published by the
;;;; Free Software Foundation; either version 3 of the License, or (at your
;;;; option) any later version.
;;;;
;;;; This program is distributed in the hope that it will be useful,
;;;; but WITHOUT ANY WARRANTY; without even the implied warranty of
;;;; MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
;;;; GNU General Public License for more details.
;;;;
;;;; You should have received a copy of the GNU General Public License along
;;;; with this program.  If not, see <http://www.gnu.org/licenses/>.

(define-module (backend config)
  #:use-module (gamma sql)
  #:export (dry-run catch-sql-failure ignore-sql-failure))

(define-public cheetah-base-dir "/websites/cheetah")
(define-public cheetah-trs-expire-days 2)
  
(define-public cheetah-tmp-dir "/tmp")
(define-public cheetah-expire-days 60)
(define-public cheetah-notify-days 14)

(define-public cheetah-iface "mysql")
(define-public cheetah-port 0)
(define-public cheetah-host "localhost")
(define-public cheetah-database "test")
(define-public cheetah-user "nobody")
(define-public cheetah-password "")

(define-public cheetah-admin-email "devnull@gnu.org.ua")
(define-public cheetah-mail-from "bitbucket@gnu.org.ua")
(define-public cheetah-mail-help "")
(define-public cheetah-site "localhost")
(define-public cheetah-guest-account "guest@cheetah")
(define-public cheetah-sys-name "Cheetah News Service")
(define-public cheetah-secure-proto "http")
(define-public cheetah-site-content-dir #f)

(define-public cheetah-textdomain "cheetah")
(define-public cheetah-locale-path "/usr/share/locale:/usr/local/share/locale")
(define-public cheetah-misc-dir #f)

(define-public (diag . rest)
  (with-output-to-port
      (current-error-port)
    (lambda ()
      (display "ERROR: ")
      (for-each display rest)
      (newline))))

(define-public debug-level 0)

(define-public (debug level . rest)
  (if (>= debug-level level)
      (with-output-to-port
	  (current-error-port)
	(lambda ()
	  (display "DBG: ")
	  (display level)
	  (display ": ")
	  (for-each display rest)
	  (newline)))))

(define-public dry-run-mode #f)

(defmacro dry-run (. expr)
  `(cond ((not dry-run-mode)
	  ,@expr)))

(defmacro catch-sql-failure (expr)
  `(catch 'gsql-error
	  (lambda () ,expr)
	  (lambda (key err descr)
	    (diag err ": " descr))))

(defmacro ignore-sql-failure (expr)
  `(catch 'gsql-error
	  (lambda () ,expr)
	  (lambda (key err descr)
	    #f)))

(define-public (run-sql-query conn query)
  (catch #t
         (lambda ()
	   (debug 2 "SQL Query " query)
           (sql-query conn query))
         (lambda args
           '())))

(define-public (run-num-query conn q)
  (let ((v (run-sql-query conn q)))
    (if (not (null? (cdr v)))
	(diag "Query returned too many tuples (" q ")"))
    (string->number (caar v))))

(define-public (escape-string str ch-map)
  (apply
   string-append
   (map
    (lambda (x)
      (let ((ch (assoc x ch-map)))
	(if ch
	    (cdr ch)
	    (string x))))
    (string->list str))))

(define-public html-escapes
  '((#\< . "&lt;")
    (#\> . "&gt;")
    (#\& . "&amp;")
    (#\" . "\\\"")))

(define-public (html-escape-string str)
  (escape-string str html-escapes))

(define-public (run-prog prog . thunk)
  (debug 3 "Running " prog)
  (let ((rc (system prog)))
    (cond
     ((status:exit-val rc) =>
      (lambda (stat)
	(if (= stat 0)
	    (and (not (null? thunk)) (apply (car thunk) '()))
	    (diag prog " exited with status " stat))))
     ((status:stop-sig rc) =>
      (lambda (stat)
	(diag prog " terminated on signal " stat)))
     ((status:stop-sig rc) =>
      (lambda (stat)
	(diag prog " stopped on signal " stat)))
     (else
      (diag prog " terminated due to unknown reason")))))

(load-from-path "cheetah.conf.scm")

;;;; End of config.scm

