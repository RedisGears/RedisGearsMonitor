var express = require('express');
var app = express();
var Redis = require("ioredis");
var yargs = require("yargs");

var argv = yargs
    .usage('Usage: $0 --host [host (default localhost)] --port [port (default 6379)] --password [password (default no password)] --bind_port [bind_port (default 9001)]')
    .options({
        host: { demand: 'redis host', alias: 'h', default:'localhost'},
        port: { demand: 'redis port', alias: 'p', default:6379, type:'number'},
        password: { demand: 'redis password', alias: 'a', default:null},
        bind_port: { demand: 'redis password', alias: 'b', default:9001, type:'number'}
    })
    .parserConfiguration({'camel-case-expansion': false})
    .strict()
    .argv

if(argv._.length > 0){
	console.log('bad arguments: ' + argv._)
	return
}

if(!argv.port){
	console.log('bad port given: ' + argv.port)
	return
}

if(!argv.bind_port){
	console.log('bad bind_port given: ' + argv.bind_port)
	return
}

console.log('host:' + argv.host)
console.log('port:' + argv.port)
console.log('password:' + argv.password)
console.log('bind_port:' + argv.bind_port)

var redis = new Redis({
  port: argv.port, // Redis port
  host: argv.host, // Redis host
  password: argv.password,
});



app.get('/dumpregistrations',function(req,res){
	redis.call('RG.DUMPREGISTRATIONS', [], function(err, value) { 
		res.json(value);
	});
});

app.get('/unregister',function(req,res){
	redis.call('RG.UNREGISTER', [req.query.id], function(err, value) { 
		res.json({status:value});
	});
});

app.use(express.static(__dirname + '/public'));

app.listen(argv.bind_port);