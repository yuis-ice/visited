
# Visited-CLI

<!-- Securely collect browsing history over browsers with search capability and extras -->
Securely collect browsing history over browsers.

## Getting started  

Here is the getting started guide. 

Firstly, clone the git, and change to the directory.

```
$ git clone [repo url] && cd visited 
```

And install the node packages.

```
$ npm install 
```

Next, generate a client program for browser. Run the following.

```
$ node visited.js --generate
✔ Port number? [default: 5555] …
File generated: ./visited.user.js
```

Now you have `visited.user.js` file generated, copy and paste the file content as your new userscript on your favorite userscript manager e.g. [tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo?hl=en)

Also note that you can paste the same to your browsers, Chrome profiles, and virtually integrate browsing history at the one place. 

Next, start the server. Use `-s` or `--server`. Also note that `--quiet` for background run, `--port` for specifying the port number. 

```
$ node visited.js --server
```

Now you're ready. Try go to any website, let's say youtube.com, and reload page (or just visit from the omnibox). 

You can see the server detects your visiting and automatically saves the URL, host, date to the database `visited.db`.

```
$ node visited.js --server
server started...
message: {"url":"https://www.youtube.com/","host":"www.youtube.com"}
```

Now you can use a sqlite client such as [DB Browser for SQLite](https://sqlitebrowser.org/dl/), or built-in searching options, just like the following. 

```
$ node visited.js --search --host youtube.com
[
    {
        "id": 1,
        "url": "https://www.youtube.com/",
        "host": "www.youtube.com",
        "date": "6/23/2021, 3:52:02 PM",
        "timestamp": 1624431122
    }
]
```

The search term is regex compatible. This shows the same result as the above. 

```
$ node visited.js --search --url 'you.*be\.com'
```

## Requirements

```
git
build-essential
node
sqlite3-pcre (for searching)
```

## Help 

```
$ node visited.js
Usage: visited [options]

Options:
  -s, --server               set command type: server
  -p, --port <port>          (server) specify port number (default: 5555)
  -t, --timezone <timezone>  (server) specify timezone (default: "Asia/Tokyo")
  -q, --quiet                (server) disable log
  -s, --search               set command type: search
  -r, --regex                (search) enable regex extension for search (default: true)
  -u, --url <url>            (search) search by url (default: ".")
  --host <host>              (search) search by host (default: ".")
  --order <order>            (search) set order for search [desc, asc] (default: "desc")
  --limit <number>           (search) set limit for search (default: -1)
  -F, --format <format>      (search) output format [json, url] (default: "json")
  --pcre-path <file>         set sqlite3 pcre file path for search (default: "/usr/lib/sqlite3/pcre.so")
  -d, --database <file>      specify database file for index/search (default: "./visited.db")
  --generate                 generates client side userScript file
  --delete-database          delete database
  -y, --yes                  no confirmation prompt
  -h, --help                 display help for command
```