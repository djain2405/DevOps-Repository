var AWS = require('aws-sdk');
fs = require('fs');

AWS.config.update({accessKeyId:'', 
  secretAccessKey: ''});
AWS.config.update({region: 'us-west-2'});


var ec2 = new AWS.EC2();

var params = {
  ImageId: 'ami-5189a661',
  InstanceType: 't2.micro',
  KeyName: 'div-user',
  MinCount: 1, MaxCount: 1,
  SecurityGroupIds: ['']
};

// Create the instance
ec2.runInstances(params, function(err, data) {
  if (err) { console.log("Could not create instance", err); return; }

  var instanceId = data.Instances[0].InstanceId;
  console.log("Created instance", instanceId);

params = {
 InstanceIds: [
   instanceId
]};

	setTimeout(function()
	{

		ec2.describeInstances(params, function(err, data) {
		/* if (err)
		   {
		console.log(err, err.stack); // an error occurred
		   }
		else*/
		{
		    //ipAws = data.Reservations[0].Instances[0].PublicIpAddress;
		  // successful response
		    
		dataValue ='\nnode1 ansible_ssh_host='+data.Reservations[0].Instances[0].PublicIpAddress+' ansible_ssh_user=ubuntu ansible_ssh_private_key_file=./keys/div-user.pem';

		fs.appendFile('inventory', dataValue, function (err) {
		 if (err) return console.log(err);
		 console.log('Inventory file successfully created!!');
		});
		}
		});


	}, 30000);
});
