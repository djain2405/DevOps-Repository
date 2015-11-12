var needle = require("needle");
var os   = require("os");
fs = require("fs");

var config = {};
config.token = "";

var headers =
{
	'Content-Type':'application/json',
	Authorization: 'Bearer ' + config.token
};


var client =
{
	//Function to create Droplet	
	createDroplet: function (dropletName, region, imageName, onResponse)
	{
		var data = 
		{
			"name": dropletName,
			"region":region,
			"size":"512mb",
			"image":imageName,
			// Id to ssh_key associated with account.
			"ssh_keys":[000000],
			//"ssh_keys":null,
			"backups":false,
			"ipv6":false,
			"user_data":null,
			"private_networking":null
		};

		console.log("Attempting to create: "+ JSON.stringify(data) );

		needle.post("https://api.digitalocean.com/v2/droplets", data, {headers:headers,json:true}, onResponse );
	},

	fetchDroplet: function( dropletId, onResponse )
	{
		needle.get("https://api.digitalocean.com/v2/droplets/"+dropletId, {headers:headers}, onResponse)
	},
};

 var name = "NewDroplet"+os.hostname();
 var region = "nyc1"; //NYC region
 var image = "ubuntu-12-04-x64"; // Ubuntu image droplet
 client.createDroplet(name, region, image, function(err, resp, body)
 {
 	//console.log(body);
 	// StatusCode 202 - Means no error & server accepted request.
 	if(!err && resp.statusCode == 202)
 	{
		var dropletId = body.droplet.id;
 		setTimeout(function(){
			client.fetchDroplet (dropletId, function(err, resp)
			{
				var data = resp.body;
				console.log(data.droplet.networks.v4[0].ip_address);
 				dataValue = '[servers]\nnode0 ansible_ssh_host='+data.droplet.networks.v4[0].ip_address+' ansible_ssh_user=root ansible_ssh_private_key_file=./keys/node0.key';

				fs.writeFile('inventory', dataValue, function (err) {
				 	if (err) return console.log(err);
				 	console.log('Inventory file successfully created!!');
				});
				
			});

		},15000);
 	}
 });



