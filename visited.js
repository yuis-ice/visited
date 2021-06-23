#!/usr/bin/env node

const fs = require('fs');
const WebSocket = require("ws");
const sqlite3 = require('sqlite3').verbose();
const Database = require('better-sqlite3');
const commander = require('commander');
const program = new commander.Command();
const Confirm = require('prompt-confirm');
const Mustache = require('mustache');
const prompts = require('prompts');

program
  .option('-s, --server', 'set command type: server ' )
  .option('-p, --port <port>', '(server) specify port number', 5555 )
  .option('-t, --timezone <timezone>', '(server) specify timezone', "Asia/Tokyo" )
  .option('-q, --quiet', '(server) disable log' )
  .option('-s, --search', 'set command type: search ' )
  .option('-r, --regex', '(search) enable regex extension for search', true ) // enable by default
  .option('-u, --url <url>', '(search) search by url', "." )
  .option('--host <host>', '(search) search by host', "." )
  .option('--order <order>', '(search) set order for search [desc, asc]', "desc" )
  .option('--limit <number>', '(search) set limit for search', -1 )
  .option('-F, --format <format>', '(search) output format [json, url]' , "json" )
  .option('--pcre-path <file>', 'set sqlite3 pcre file path for search', "/usr/lib/sqlite3/pcre.so" )
  .option('-d, --database <file>', 'specify database file for index/search', "./visited.db" )
  .option('--generate', 'generates client side userScript file' )
  .option('--delete-database', 'delete database' )
  .option('-y, --yes', 'no confirmation prompt' )
  .parse(process.argv)
  ;

if (! process.argv.slice(2).length) program.help();

if (program.server) server();
if (program.search) search();
if (program.generate) generate();
if (program.deleteDatabase) deleteDatabase();

async function search(){

  const db = new Database( program.database , { verbose: null });
  if (program.regex) db.loadExtension( program.pcrePath );

  const stmt = db.prepare( Mustache.render(`SELECT history.id, history.url, history.host, history.date, history.timestamp from history
    WHERE LOWER(history.url) REGEXP ?
    AND LOWER(history.host) REGEXP ?
    order by timestamp {{order}}
    LIMIT ?`,
    // order by date {{order}}
    {
      order: program.order
    }))
    .all( program.url, program.host, program.limit ) ;

  if (program.format == "json") console.log( JSON.stringify( stmt , null, 4) ) ;
  if (program.format == "url") stmt.forEach(a => console.log( a.url )) ;

}

async function server(){

  const db = new sqlite3.Database( program.database );
  const wss       = new WebSocket.Server({ port: program.port });

  wss.on("connection", ws => {

    ws.on("message", message => {

      if ( ! program.quiet ) console.log("message:", message) ;

      db.serialize(function() {

        db.run(`CREATE TABLE IF NOT EXISTS history(
              id INTEGER PRIMARY KEY  ,
              url         TEXT ,
              host         TEXT ,
              date         TEXT ,
              timestamp         TIMESTAMP
        );`);

        db.run(` INSERT INTO HISTORY (url, host, date, timestamp) VALUES ( ?, ?, ?, ? ); `, [
          JSON.parse(message).url ,
            JSON.parse(message).host ,
            new Date().toLocaleString("en-US", {timeZone: program.timezone}) ,
            Math.round((new Date()).getTime() / 1000) , // date +"%s"
          ]
        );
      });

    });

    ws.on('close', function () {
      // if ( ! program.quiet ) console.log("client closed:", ws.id)
    })

  });

  if ( ! program.quiet ) console.log("server started...")

}

async function generate(){

  fs.writeFileSync(
    `./visited.user.js` ,
    Mustache.render(
      fs.readFileSync( "./visited.user.js.tmpl" , 'utf8') ,
      {
        port: (await prompts({
          type: 'number',
          name: 'value',
          message: `Port number? [default: ${program.port}]`,
        })).value || program.port
      }
    )
  );

  console.log("File generated:", "./visited.user.js")
}

async function deleteDatabase(){

  var db = new sqlite3.Database( program.database );

  if (! program.yes) {
    const prompt = new Confirm('Are you sure?');
    await prompt.run()
      .then(function(answer) {
        if (answer == false) process.exit() ;
      });
  }

  db.serialize(function() {
    db.run(`DROP TABLE IF EXISTS history;`)
  });
  process.on('exit', function(){ console.log("Completed.") ; } );
}
