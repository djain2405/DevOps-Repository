var redis = require('redis')
var multer  = require('multer')
var express = require('express')
var fs      = require('fs')
var app = express()
var http = require('http')
var proxyServer = require('http-proxy')
// REDIS
var client = redis.createClient(6379, '127.0.0.1', {})

///////////// WEB ROUTES

// Add hook to make it easier to get all visited URLS.
app.use(function(req, res, next)
{
	console.log(req.method, req.url);

	// ... INSERT HERE.
	//To push the websites in a queue
	client.lpush("recent", req.url);

	next(); // Passing the request to the next handler in the stack.
});


//Post requets to upload pictures
app.post('/upload',[ multer({ dest: './uploads/'}), function(req, res){
   console.log(req.body) // form fields
   console.log(req.files) // form files

   if( req.files.image )
   {
	   fs.readFile( req.files.image.path, function (err, data) {
	  		if (err) throw err;
	  		var img = new Buffer(data).toString('base64');
	  		console.log(img);
				client.lpush("upload", img);
		});
	}

   res.status(204).end()
}]);

//Get Request to get the recent image from the queue
app.get('/meow', function(req, res) {
	{
		client.lpop("upload", function(err, imagedata){
			if (err) throw err
			res.writeHead(200, {'content-type':'text/html'});
			// items.forEach(function (imagedata)
			// {
				res.write("<h1>\n<img src='data:my_pic.jpg;base64,"+imagedata+"'/>");
			// });
			res.end();
		});

	}
})

//Main Localhost page
app.get('/', function(req, res) {
  res.send('DevOps HW3')
})

//Get request to set the value of key
app.get('/set', function(req, res) {
  //res.send('hello world')
	client.set('key', 'This message will self-destruct in 10 seconds', function(err, reply) {
  console.log(reply);
	res.send("Key is set with value - This message will self destruct in 10 seconds");
	client.expire("key", 10);
});

})

app.get('/get', function(req, res) {
  //res.send('hello world')
	client.get('key', function(err,value){
		if(value == null)
		{
			console.log("key has expired");
			res.send("key has expired");
		}
		else
		{
			console.log(value);
			res.send(value);
		}
	});

})

//Get Request to get the 5 most recent visited URLS
app.get('/recent', function(req, res) {

	client.lrange("recent", 0, 4, function(err, value){

		res.send(value);

	});
});

// HTTP SERVER 1
var server1 = app.listen(3006, function () {

  var host = server1.address().address
  var port = server1.address().port
	client.lpush("server", "http://localhost:"+port);

  console.log('Example app listening at http://%s:%s', host, port)
})

//HTTP SERVER 2
var server2 = app.listen(3007, function () {

  var host = server2.address().address
  var port = server2.address().port
	client.lpush("server", "http://localhost:"+port);
  console.log('Example app listening at http://%s:%s', host, port)
})

//PROXY SERVER
var options = {};
var proxy   = httpproxy.createProxyServer(options);
var server  = http.createServer(function(req, res)
{
	client.rpoplpush("server", "server", function(err, value)
{
		console.log(value);
		proxy.web( req, res, {target: value } );
})
});
server.listen(3010);
