var express = require('express');
var app = express();
var bodyParser = require('body-parser')
var fs = require("fs");
var file = "./gpsDatabase.db";
var exists = fs.existsSync(file);

var sqlite3 = require("sqlite3").verbose();
var db = new sqlite3.Database(file);

app.use(express.static('public'));
var jsonParser = bodyParser.json();


//this method runs on startup...we use it to create the database schema if the db didnt exist before
db.serialize(function() {
    if(!exists) {
        db.run("CREATE TABLE gpslogs (id INTEGER PRIMARY KEY, logdate NUMERIC, duration INTEGER, locationLon TEXT, locationLat TEXT, tagid INTEGER);");
        db.run("CREATE TABLE gpstags (id INTEGER PRIMARY KEY, locationLon TEXT, locationLat TEXT, tagname TEXT);");
        db.run("INSERT INTO gpstags (locationLon, locationLat, tagname) VALUES ('TRAVEL', 'TRAVEL', 'Traveling');");
    }
});


//heartbeat rest route
app.get('/status', function (req, res) {
    res.end();
})

//retrieve logs
app.get('/logs', function (req, res) {
    var mytagid = req.query.tagid;

    if(req.query.betweenStart!=undefined && req.query.betweenEnd!=undefined) {
        //if query params are sent in, narrow down query
        var d1 = new Date(req.query.betweenStart);
        var d1a = d1.getTime() / 1000;
        var d2 = new Date(req.query.betweenEnd);
        var d2a = d2.getTime() / 1000;

        if (mytagid!=undefined){
            //convert "user friendly date from query string" to EPOC date for querying between
            db.all('SELECT * FROM gpslogs where tagid=? AND logdate BETWEEN ? AND ?', mytagid, d1a, d2a, function (err, rows) {
                if (!err && rows != undefined) {
                    res.json(rows);
                }
            });
        }
        else {
            //convert "user friendly date from query string" to EPOC date for querying between
            db.all('SELECT * FROM gpslogs where logdate BETWEEN ? AND ?', d1a, d2a, function (err, rows) {
                if (!err && rows != undefined) {
                    res.json(rows);
                }
            });
        }
    }
    else {
        if (mytagid!=undefined){
            //get all tags for a tag id
            db.all('SELECT * FROM gpslogs where tagid=?', mytagid, function (err, rows) {
                if (!err && rows != undefined) {
                    res.json(rows);
                }
            });
        }
        else {
            //otherwise return all logs
            db.all('SELECT * FROM gpslogs ', function (err, rows) {
                if (!err && rows != undefined) {
                    res.json(rows);
                }
            });
        }
    }
})

//run report against logs/tags
app.get('/reports/1', function (req, res) {
    //only process report request if proper query params are sent in
    if(req.query.betweenStart!=undefined && req.query.betweenEnd!=undefined) {
        var d1 = new Date(req.query.betweenStart);
        var d1a = d1.getTime() / 1000;
        var d2 = new Date(req.query.betweenEnd);
        var d2a = d2.getTime() / 1000;

        //convert "user friendly date from query string" to EPOC date for querying between
        db.all('select t.tagname, SUM(g.duration) as duration from gpslogs g left join gpstags t on g.tagid=t.id WHERE g.logdate BETWEEN ? AND ? GROUP BY g.tagid ORDER BY duration DESC', d1a, d2a, function (err, rows) {
            if (!err && rows != undefined) {
                res.json(rows);
            }
        });
    }
    else
    {
        res.end();
    }
})

//get all tags
app.get('/tags', function (req, res) {
    db.all('SELECT * FROM gpstags ', function (err, rows) {
        if(!err && rows!=undefined) {
            res.json(rows);
        }
    });
})

//get spectific tag
app.get('/tags/:tag_id', function (req, res) {
    db.get('SELECT * FROM gpstags  WHERE id = ? ', req.params.tag_id, function (err, row) {
        if(!err && row!=undefined) {
            res.json(row);
        }
    });
})

//get specific log
app.get('/logs/:log_id', function (req, res) {
    db.get('SELECT * FROM gpslogs  WHERE id = ? ', req.params.log_id, function (err, row) {
        if(!err && row!=undefined) {
            res.json(row);
        }
    });
})

//create a log.   Route called from GPS device
app.post('/logs', jsonParser, function (req, res) {
    if (!req.body) return res.sendStatus(400)

    //console.log(req.body);
    //the amount off (North, East, South, or West)
    // from a gps tag that will still allow a log to be tagged
    var directionalThreashold = 1001;

    //convert epoc date/time to an epoc date to save in DB
    var d = new Date(0);
    d.setUTCSeconds(req.body.startTime);
    var mylogdate =  (d.getMonth() + 1) + '/' + d.getDate() + '/' +  d.getFullYear();
    var mylogdate2 = new Date(mylogdate);
    var mylogdateseconds = mylogdate2.getTime() / 1000;
    //calculate duration
    var myduration = req.body.endTime - req.body.startTime;
    var mylocationLon = req.body.startLon;
    var mylocationLat = req.body.startLat
    var mytagid=0;


    //see if location exists as a tag in the DB, and create foreign key relationship
    db.get('SELECT * FROM gpstags  WHERE locationLon = ? AND locationLat = ? ', mylocationLon, mylocationLat , function (err, row) {
        if(!err && row!=undefined) {
            mytagid = row.id;
            //insert data into db
            var stmt = db.prepare("INSERT INTO gpslogs (logdate, duration, locationLon, locationLat, tagid) VALUES (?,?,?,?,?);");
            stmt.run(mylogdateseconds, myduration, mylocationLon, mylocationLat, mytagid);
            stmt.finalize();
        }
        else {
            //did not find an exact match....look for one "close".
            var location = parseGPSStringToObject(mylocationLon, mylocationLat);
            db.all('SELECT * FROM gpstags', function (err, rows) {
                if (!err && rows != undefined) {
                    for(var i=0;i<rows.length;i++)
                    {
                        if(rows[i].locationLon!='TRAVEL') {
                            var tag = parseGPSStringToObject(rows[i].locationLon, rows[i].locationLat);
                            if (location.lonB == tag.lonB && location.latB == tag.latB && location.lonD == tag.lonD && location.latD == tag.latD) {
                                var latFound = false;
                                var lonFound = false;
                                if (location.lonA < tag.lonA) {
                                    if (tag.lonA - location.lonA < directionalThreashold) {
                                        lonFound = true;
                                    }
                                }
                                else {
                                    if (location.lonA - tag.lonA < directionalThreashold) {
                                        lonFound = true;
                                    }
                                }
                                if (location.latA < tag.latA) {
                                    if (tag.latA - location.latA < directionalThreashold) {
                                        latFound = true;
                                    }
                                }
                                else {
                                    if (location.latA - tag.latA < directionalThreashold) {
                                        latFound = true;
                                    }
                                }

                                if (latFound == true && lonFound == true) {
                                    mytagid = rows[i].id;
                                    break;
                                }
                            }
                        }
                    }
                }
                //insert data into db
                var stmt = db.prepare("INSERT INTO gpslogs (logdate, duration, locationLon, locationLat, tagid) VALUES (?,?,?,?,?);");
                stmt.run(mylogdateseconds, myduration, mylocationLon, mylocationLat, mytagid);
                stmt.finalize();
            });
        }
    });
    console.log("data inserted");
    res.end();
})

//update a log with a new tag
app.put('/logs/:log_id', jsonParser, function (req, res) {
    if (!req.body) return res.sendStatus(400)

    var logid = req.params.log_id;
    var tagid = req.body.tagid;

    var stmt = db.prepare("UPDATE gpslogs set tagid=? WHERE id=?;");
    stmt.run(tagid, logid);
    stmt.finalize();
    console.log("log updated");
    res.end();
})

//create a new tag
app.post('/tags', jsonParser, function (req, res) {
    if (!req.body) return res.sendStatus(400)

    var myname = req.body.tagname;
    var mylocationLon = req.body.locationLon;
    var mylocationLat = req.body.locationLat


    var stmt = db.prepare("INSERT INTO gpstags (locationLon, locationLat, tagname) VALUES (?,?,?);");
    stmt.run(mylocationLon, mylocationLat, myname, function(mylocationLon, myLocationLat, myname){
        res.send('{"id":'+ this.lastID + '}');
        res.end;
    });
    stmt.finalize();
    console.log("tag inserted");
})

//method for parsing GPS data to compare location data
function parseGPSStringToObject(locationLon, locationLat)
{
    var lonD = '';
    var lonB = 0;
    var lonA = 0;
    var latD = '';
    var latB = 0;
    var latA = 0;

    if(locationLon.indexOf('W')>0)
    {
        lonB =  locationLon.substr(0, locationLon.indexOf('.'));
        lonA =  locationLon.substr(locationLon.indexOf('.')+1, locationLon.length-(locationLon.indexOf('.')+2));
        lonD = 'W';
    }
    else if(rows[i].locationLon.indexOf('E')>0)
    {
        lonB =  locationLon.substr(0, locationLon.indexOf('.'));
        lonA =  locationLon.substr(locationLon.indexOf('.')+1, locationLon.length-(locationLon.indexOf('.')+2));
        lonD = 'E';
    }

    if(locationLat.indexOf('N')>0)
    {
        latB =  locationLat.substr(0, locationLat.indexOf('.'));
        latA =  locationLat.substr(locationLat.indexOf('.')+1, locationLat.length-(locationLat.indexOf('.')+2));
        latD = 'N';
    }
    else if(locationLat.indexOf('S')>0)
    {
        latB = locationLat.substr(0, locationLat.indexOf('.'));
        latA =  locationLat.substr(locationLat.indexOf('.')+1, locationLat.length-(locationLat.indexOf('.')+2));
        latD = 'S';
    }

    var dataObj = {
        lonB: Number(lonB),
        lonA: Number(lonA),
        lonD: lonD,
        latB: Number(latB),
        latA: Number(latA),
        latD: latD
    };
    return dataObj;
}

//main application
var server = app.listen(9081, function () {

    var host = server.address().address
    var port = server.address().port

    console.log("Localhost instance app listening at http://%s:%s", host, port)

})

var server2 = app.listen(9082, 'YOUR_PUBLIC_IPADDRESS_HERE', function () {

    var host = server2.address().address
    var port = server2.address().port

    console.log("External instance app listening at http://%s:%s", host, port)

})
