var express = require('express');
var app = express();
var Redis = require("ioredis");
var yargs = require("yargs");

var script ="import json\n\
\n\
def RegistrationArrToDict(registration, depth=0):\n\
    if depth >= 3:\n\
        return registration\n\
    if type(registration) is not list:\n\
        return registration\n\
    d = {}\n\
    for i in range(0, len(registration), 2):\n\
        d[registration[i]] = RegistrationArrToDict(registration[i + 1], depth + 1)\n\
    return d\n\
\n\
\n\
def AggregateRes(k, a, r):\n\
	r = RegistrationArrToDict(r)\n\
	if a == {}:\n\
		lastError = r['RegistrationData']['lastError']\n\
		r['RegistrationData']['lastError'] = []\n\
		r['NumShards']=1\n\
		if lastError != [None] and lastError != None:\n\
			if isinstance(lastError, list):\n\
				r['RegistrationData']['lastError'] += lastError\n\
			else:\n\
				r['RegistrationData']['lastError'] += [lastError]\n\
		return r\n\
	a['NumShards']+=1\n\
	a['RegistrationData']['numTriggered'] += r['RegistrationData']['numTriggered']\n\
	a['RegistrationData']['numSuccess'] += r['RegistrationData']['numSuccess']\n\
	a['RegistrationData']['numFailures'] += r['RegistrationData']['numFailures']\n\
	a['RegistrationData']['numAborted'] += r['RegistrationData']['numAborted']\n\
	if r['RegistrationData']['lastError'] != [None] and r['RegistrationData']['lastError'] != None:\n\
		if isinstance(r['RegistrationData']['lastError'], list):\n\
			a['RegistrationData']['lastError'] += r['RegistrationData']['lastError']\n\
		else:\n\
			a['RegistrationData']['lastError'] += [r['RegistrationData']['lastError']]\n\
	return a\n\
\n\
\n\
def CheckNumShardSanity(r):\n\
	numShards = execute('RG.INFOCLUSTER')\n\
	if numShards == 'no cluster mode':\n\
		return\n\
	numShards = len(numShards[2])\n\
	if r['NumShards'] != numShards:\n\
		r['RegistrationData']['lastError'] += ['Warning: not all shards contains the registration.']\n\
\n\
\n\
\n\
GB('ShardsIDReader')\\\n\
.flatmap(lambda x: execute('RG.DUMPREGISTRATIONS'))\\\n\
.aggregateby(lambda x: x[1], {}, AggregateRes, AggregateRes)\\\n\
.map(lambda x: x['value'])\\\n\
.foreach(CheckNumShardSanity)\\\n\
.map(lambda x: json.dumps(x)).run()\n"

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
	redis.call('RG.PYEXECUTE', [script], function(err, value) {
		if(err){
			console.log(err);
			res.json({'error':err});
			return;	
		}
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