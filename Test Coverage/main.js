var esprima = require("esprima");
var options = {tokens:true, tolerant: true, loc: true, range: true };
var faker = require("faker");
var fs = require("fs");
faker.locale = "en";
var mock = require('mock-fs');
var _ = require('underscore');
var Random = require('random-js');

function main()
{
	var args = process.argv.slice(2);

	if( args.length == 0 )
	{
		args = ["subject.js"];
	}
	var filePath = args[0];

	constraints(filePath);

	generateTestCases()

}

var engine = Random.engines.mt19937().autoSeed();

function createConcreteIntegerValue( greaterThan, constraintValue )
{
	if( greaterThan )
		return Random.integer(constraintValue,constraintValue+10)(engine);
	else
		return Random.integer(constraintValue-10,constraintValue)(engine);
}

function Constraint(properties)
{
	this.ident = properties.ident;
	this.expression = properties.expression;
	this.operator = properties.operator;
	this.value = properties.value;
	this.funcName = properties.funcName;
	// Supported kinds: "fileWithContent","fileExists"
	// integer, string, phoneNumber
	this.kind = properties.kind;
}

function fakeDemo()
{
	console.log( faker.phone.phoneNumber() );
	console.log( faker.phone.phoneNumberFormat() );
	console.log( faker.phone.phoneFormats() );
}

var functionConstraints =
{
}
var mockFileLibrary =
{
	pathExists:
	{
		'path/fileExists': {}
	},
	pathWithFilesExists:
	{
		'path/fileExists': {"file1":"text content"}
	},
	fileWithContent:
	{
		pathContent:
		{
  			file1: 'text content',
		}
	},
	fileWithoutContent:
	{
		pathContent:
		{
  			file1: '',
		}
	},
	withoutFileWithoutContent:
	{
		'pathContent': {}
	}
};
//taken from stackoverflow for all possible combinations of array elements to get maximum constraints
function allPossibleCombinations(arr) {
  if (arr.length == 1) {
    return arr[0];
  } else {
    var result = [];
    var allRestCombos = allPossibleCombinations(arr.slice(1));  // recur with the rest of array
    for (var i = 0; i < allRestCombos.length; i++) {
      for (var j = 0; j < arr[0].length; j++) {
        result.push(arr[0][j] + '|' + allRestCombos[i]);
      }
    }
    return result;
  }
}
function generateTestCases()
{

	var content = "var subject = require('./subject.js')\nvar mock = require('mock-fs');\n";
	for ( var funcName in functionConstraints )
	{
		var constraints = functionConstraints[funcName].constraints;
		var params = {};

		// initialize params
		for (var i =0; i < functionConstraints[funcName].params.length; i++ )
		{
			var paramName = functionConstraints[funcName].params[i];
			params[paramName] = '\'' + faker.phone.phoneNumber()+'\'';
			params[paramName] = ['\'\''];
		}

		//console.log( params );

		// update parameter values based on known constraints.

		// Handle global constraints...

		var fileWithContent = _.some(constraints, {kind: 'fileWithContent' });
		var pathExists      = _.some(constraints, {kind: 'fileExists' });
		var pathWithFilesExists      = _.some(constraints, {kind: 'fileExists' });
		var fileWithoutContent      = _.some(constraints, {kind: 'fileExists' });
		var withoutFileWithoutContent      = _.some(constraints, {kind: 'fileExists' });



		// plug-in values for parameters
		// for( var c = 0; c < constraints.length; c++ )
		// {
		// 	var constraint = constraints[c];
		// 	if( params.hasOwnProperty( constraint.ident ) )
		// 	{
		// 		params[constraint.ident] = constraint.value;
		// 	}
		// }

		// Prepare function arguments.
	//	var args = Object.keys(params).map( function(k) {return params[k]; }).join(",");
		if( pathExists || fileWithContent )
		{
			for( var c = 0; c < constraints.length; c++ )
			{
				var constraint = constraints[c];
				if( params.hasOwnProperty( constraint.ident ) )
				{
					params[constraint.ident]=(constraint.value);
				}
			}
			var args = Object.keys(params).map( function(k) {return params[k]; }).join(",");
				//content += "subject.{0}({1});\n".format(funcName, args );

			content += generateMockFsTestCases(pathExists,!pathWithFilesExists,!fileWithContent,fileWithoutContent, !withoutFileWithoutContent,funcName, args);
			// Bonus...generate constraint variations test cases....

					content += generateMockFsTestCases(!pathExists,pathWithFilesExists,fileWithContent,!fileWithoutContent, !withoutFileWithoutContent,funcName, args);
					content += generateMockFsTestCases(!pathExists,!pathWithFilesExists,!fileWithContent,!fileWithoutContent, !withoutFileWithoutContent,funcName, args);
					content += generateMockFsTestCases(!pathExists,pathWithFilesExists,!fileWithContent,!fileWithoutContent, withoutFileWithoutContent,funcName, args);
					content += generateMockFsTestCases(!pathExists,pathWithFilesExists,!fileWithContent,fileWithoutContent, !withoutFileWithoutContent,funcName, args);
				}
		else
		{
			// Emit simple test case.
			//content += "subject.{0}({1});\n".format(funcName, args );
			for( var c = 0; c < constraints.length; c++ )
			{
				var constraint = constraints[c];
				if( params.hasOwnProperty( constraint.ident ) )
				{

					params[constraint.ident].push(constraint.value);
				}
				// var args = Object.keys(params).map( function(k) {return params[k]; }).join(",");
				// //console.log("Arguments are "+args);
				// 	content += "subject.{0}({1});\n".format(funcName, args );

			}
			var result = allPossibleCombinations(Object.keys(params).map(function(x) {return params[x]}));
			//console.log("result are "+result);
			for(var i = result.length - 1 ; i >= 0 ; i-- ){
				content += "subject.{0}({1});\n".format(funcName, result[i].split('|').join(',') )
			}
		}
		var x	= _.contains(functionConstraints[funcName].params, "phoneNumber");

		if(x)
		{
			content += generatePhoneTestCases("5555555555", "(NNN) NNN-NNNN", "", funcName, "" );
			content += generatePhoneTestCases("3333333333", "(NNN) NNN-NNNN", '{"normalize": true}', funcName, "" );
			content += generatePhoneTestCases(faker.phone.phoneNumber(), faker.phone.phoneFormats(), "", funcName, "");
		}


	}
	content += "subject.{0}({1});\n".format('blackListNumber', "'2121111111'");


	fs.writeFileSync('test.js', content, "utf8");

}


function generateMockFsTestCases (pathExists,pathWithFilesExists,fileWithContent,fileWithoutContent,withoutFileWithoutContent,funcName,args)
{
	var tc = "";
	// Build mock file system based on constraints.
	var mergedFS = {};
	if( pathExists )
	{
		for (var attrname in mockFileLibrary.pathExists) { mergedFS[attrname] = mockFileLibrary.pathExists[attrname]; }
	}
	if( pathWithFilesExists )
	{
		for (var attrname in mockFileLibrary.pathWithFilesExists) { mergedFS[attrname] = mockFileLibrary.pathWithFilesExists[attrname]; }
	}
	if( fileWithContent )
	{
		for (var attrname in mockFileLibrary.fileWithContent) { mergedFS[attrname] = mockFileLibrary.fileWithContent[attrname]; }
	}
	if( fileWithoutContent )
	{
		for (var attrname in mockFileLibrary.fileWithoutContent) { mergedFS[attrname] = mockFileLibrary.fileWithoutContent[attrname]; }
	}
	if( withoutFileWithoutContent )
	{
		for (var attrname in mockFileLibrary.withoutFileWithoutContent) { mergedFS[attrname] = mockFileLibrary.withoutFileWithoutContent[attrname]; }
	}

	tc +=
	"mock(" +
		JSON.stringify(mergedFS)
		+
	");\n";

	tc += "\tsubject.{0}({1});\n".format(funcName, args );
	tc+="mock.restore();\n";
	return tc;
}

function constraints(filePath)
{
   var buf = fs.readFileSync(filePath, "utf8");
	var result = esprima.parse(buf, options);

	traverse(result, function (node)
	{
		if (node.type === 'FunctionDeclaration')
		{
			var funcName = functionName(node);
			console.log("Line : {0} Function: {1}".format(node.loc.start.line, funcName ));

			var params = node.params.map(function(p) {return p.name});

			functionConstraints[funcName] = {constraints:[], params: params};

			// Check for expressions using argument.
			traverse(node, function(child)
			{
				if( child.type === 'BinaryExpression' && child.operator == "==")
				{
					if( child.left.type == 'Identifier' && params.indexOf( child.left.name ) > -1)
					{
						// get expression from original source code:
						var expression = buf.substring(child.range[0], child.range[1]);
						var rightHand = buf.substring(child.right.range[0], child.right.range[1])
						if(rightHand.length == 0)
						{
							rightHand = '""';
						}
						typeOfOperand = typeof child.right.value;
						switch(typeOfOperand)
						{
							case 'string':
							functionConstraints[funcName].constraints.push(
								new Constraint(
								{
									ident: child.left.name,
									value: rightHand,
									funcName: funcName,
									kind: "string",
									operator : child.operator,
									expression: expression
								}));
								functionConstraints[funcName].constraints.push(
									new Constraint(
									{
										ident: child.left.name,
										value: '"' + Random.string()(engine, rightHand.length) + '"',
										funcName: funcName,
										kind: "string",
										operator : child.operator,
										expression: expression
									}));
									break;
							case 'integer':
							functionConstraints[funcName].constraints.push(
								new Constraint(
								{
									ident: child.left.name,
									value: rightHand,
									funcName: funcName,
									kind: "integer",
									operator : child.operator,
									expression: expression
								}));

									functionConstraints[funcName].constraints.push(
										new Constraint(
										{
											ident: child.left.name,
											value: parseInt(rightHand)+1,
											funcName: funcName,
											kind: "integer",
											operator : child.operator,
											expression: expression
										}));
										functionConstraints[funcName].constraints.push(
											new Constraint(
											{
												ident: child.left.name,
												value: rightHand-1,
												funcName: funcName,
												kind: "integer",
												operator : child.operator,
												expression: expression
											}));
											break;
									default:
									functionConstraints[funcName].constraints.push(
										new Constraint(
										{
											ident: child.left.name,
											value: rightHand,
											funcName: funcName,
											kind: "undefined",
											operator : child.operator,
											expression: expression
										}));



						}

					}
				 }
				if( child.type === 'BinaryExpression' && child.operator == "!=")
				{
					if( child.left.type == 'Identifier' && params.indexOf( child.left.name ) > -1)
					{
						// get expression from original source code:
						var expression = buf.substring(child.range[0], child.range[1]);
						var rightHand = buf.substring(child.right.range[0], child.right.range[1])
						if(rightHand.length == 0)
						{
							rightHand = '""';
						}
						typeOfOperand = typeof child.right.value;
						switch(typeOfOperand)
						{
							case 'string':
							functionConstraints[funcName].constraints.push(
								new Constraint(
								{
									ident: child.left.name,
									value: rightHand,
									funcName: funcName,
									kind: "string",
									operator : child.operator,
									expression: expression
								}));
								functionConstraints[funcName].constraints.push(
									new Constraint(
									{
										ident: child.left.name,
										value: '"' + Random.string()(engine, rightHand.length) + '"',
										funcName: funcName,
										kind: "string",
										operator : child.operator,
										expression: expression
									}));
									break;
							case 'integer':
							functionConstraints[funcName].constraints.push(
								new Constraint(
								{
									ident: child.left.name,
									value: rightHand,
									funcName: funcName,
									kind: "integer",
									operator : child.operator,
									expression: expression
								}));

									functionConstraints[funcName].constraints.push(
										new Constraint(
										{
											ident: child.left.name,
											value: parseInt(rightHand)+1,
											funcName: funcName,
											kind: "integer",
											operator : child.operator,
											expression: expression
										}));
										functionConstraints[funcName].constraints.push(
											new Constraint(
											{
												ident: child.left.name,
												value: rightHand-1,
												funcName: funcName,
												kind: "integer",
												operator : child.operator,
												expression: expression
											}));
											break;
									default:
									functionConstraints[funcName].constraints.push(
										new Constraint(
										{
											ident: child.left.name,
											value: rightHand,
											funcName: funcName,
											kind: "undefined",
											operator : child.operator,
											expression: expression
										}));



						}

					}
				}
				if( child.type === 'BinaryExpression' && child.operator == "<")
				{
					if( child.left.type == 'Identifier' && params.indexOf( child.left.name ) > -1)
					{
						// get expression from original source code:
						var expression = buf.substring(child.range[0], child.range[1]);
						var rightHand = buf.substring(child.right.range[0], child.right.range[1])
						if(rightHand.length == 0)
						{
							rightHand = '""';
						}

						functionConstraints[funcName].constraints.push(
							new Constraint(
							{
								ident: child.left.name,
								value: rightHand,
								funcName: funcName,
								kind: "string",
								operator : child.operator,
								expression: expression
							}));
							functionConstraints[funcName].constraints.push(
								new Constraint(
								{
									ident: child.left.name,
									value: '"' + Random.string()(engine, rightHand.length) + '"',
									funcName: funcName,
									kind: "string",
									operator : child.operator,
									expression: expression
								}));

						functionConstraints[funcName].constraints.push(
							new Constraint(
							{
								ident: child.left.name,
								value: rightHand,
								funcName: funcName,
								kind: "integer",
								operator : child.operator,
								expression: expression
							}));
							functionConstraints[funcName].constraints.push(
								new Constraint(
								{
									ident: child.left.name,
									value: rightHand-2,
									funcName: funcName,
									kind: "integer",
									operator : child.operator,
									expression: expression
								}));
								functionConstraints[funcName].constraints.push(
									new Constraint(
									{
										ident: child.left.name,
										value: parseInt(rightHand)+1,
										funcName: funcName,
										kind: "integer",
										operator : child.operator,
										expression: expression
									}));

					}
				}
				if( child.type === 'BinaryExpression' && child.operator == ">")
				{
					if( child.left.type == 'Identifier' && params.indexOf( child.left.name ) > -1)
					{
						// get expression from original source code:
						var expression = buf.substring(child.range[0], child.range[1]);
						var rightHand = buf.substring(child.right.range[0], child.right.range[1])
						if(rightHand.length == 0)
						{
							rightHand = '""';
						}

						functionConstraints[funcName].constraints.push(
							new Constraint(
							{
								ident: child.left.name,
								value: rightHand,
								funcName: funcName,
								kind: "string",
								operator : child.operator,
								expression: expression
							}));
							functionConstraints[funcName].constraints.push(
								new Constraint(
								{
									ident: child.left.name,
									value: '"' + Random.string()(engine, rightHand.length) + '"',
									funcName: funcName,
									kind: "string",
									operator : child.operator,
									expression: expression
								}));


						functionConstraints[funcName].constraints.push(
							new Constraint(
							{
								ident: child.left.name,
								value: rightHand,
								funcName: funcName,
								kind: "integer",
								operator : child.operator,
								expression: expression
							}));
							functionConstraints[funcName].constraints.push(
								new Constraint(
								{
									ident: child.left.name,
									value: rightHand-2,
									funcName: funcName,
									kind: "integer",
									operator : child.operator,
									expression: expression
								}));
								functionConstraints[funcName].constraints.push(
									new Constraint(
									{
										ident: child.left.name,
										value: parseInt(rightHand)+1,
										funcName: funcName,
										kind: "integer",
										operator : child.operator,
										expression: expression
									}));

					}
				}

				if( child.type == "CallExpression" &&
					 child.callee.property &&
					 child.callee.property.name =="readFileSync" )
				{
					for( var p =0; p < params.length; p++ )
					{
						if( child.arguments[0].name == params[p] )
						{
							functionConstraints[funcName].constraints.push(
							new Constraint(
							{
								ident: params[p],
								value:  "'pathContent/file1'",
								funcName: funcName,
								kind: "fileWithContent",
								operator : child.operator,
								expression: expression
							}));
						}
					}
				}

				if( child.type == "CallExpression" &&
					 child.callee.property &&
					 child.callee.property.name =="existsSync")
				{
					for( var p =0; p < params.length; p++ )
					{
						if( child.arguments[0].name == params[p] )
						{
							functionConstraints[funcName].constraints.push(
							new Constraint(
							{
								ident: params[p],
								// A fake path to a file
								value:  "'path/fileExists'",
								funcName: funcName,
								kind: "fileExists",
								operator : child.operator,
								expression: expression
							}));
						}
					}
				}
				if(child.type == "CallExpression" && child.callee.property && child.callee.property.name === "indexOf" && child.arguments[0].type == 'Literal' )
				{
		for( var p =0; p < params.length; p++ ) {
			if( child.callee.object.name == params[p] ) {

				functionConstraints[funcName].constraints.push(
				new Constraint(
				{
					ident: params[p],
					// A fake path to a file
					value: '"' + child.arguments[0].value + '"',
					funcName: funcName,
					kind: "string",
					operator : child.operator,
					expression: expression
				}));

				functionConstraints[funcName].constraints.push(
				new Constraint(
				{
					ident: params[p],
					// A fake path to a file
					value: '"djain2' + child.arguments[0].value + '"',
					funcName: funcName,
					kind: "string",
					operator : child.operator,
					expression: expression
				}));
			}
		}
	}

			});

			console.log( functionConstraints[funcName]);

		}
	});
}
function generatePhoneTestCases(phoneNumber, phoneNumberFormat, options, funcName, args)
{
	if(options == '')
			args+="'"+phoneNumber+"','"+phoneNumberFormat+"','"+options+"'";
		else
			args+="'"+phoneNumber+"','"+phoneNumberFormat+"',"+options;
	var testCase = "subject.{0}({1});\n".format(funcName, args );
	return testCase;
}
function traverse(object, visitor)
{
    var key, child;

    visitor.call(null, object);
    for (key in object) {
        if (object.hasOwnProperty(key)) {
            child = object[key];
            if (typeof child === 'object' && child !== null) {
                traverse(child, visitor);
            }
        }
    }
}

function traverseWithCancel(object, visitor)
{
    var key, child;

    if( visitor.call(null, object) )
    {
	    for (key in object) {
	        if (object.hasOwnProperty(key)) {
	            child = object[key];
	            if (typeof child === 'object' && child !== null) {
	                traverseWithCancel(child, visitor);
	            }
	        }
	    }
 	 }
}

function functionName( node )
{
	if( node.id )
	{
		return node.id.name;
	}
	return "";
}


if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) {
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}

main();
