#! /usr/bin/env node

var s3 = require('s3');
var fs = require('fs');
var path = require('path');
var glob = require('glob');

var argv = require('optimist')
	.usage('Deploys shops folder to s3.\nUsage --src /PATH/TO/SRC --bucket BUCKET_NAME --key AWS_KEY --secret AWS_SECRET --acl ACL --prefix PREFIX')
	.demand('src')
	.demand('bucket')
	.demand('key')
	.demand('secret')
	.string('src')
	.string('bucket')
	.string('key')
	.string('secret')
	.string('prefix')
	.string('acl')
	.default('acl', 'public-read')
	.default('prefix', '')
	.describe('src', 'Folder to be synced')
	.describe('bucket', 'S3 bucket to deploy folder to.')
	.describe('key', 'AWS access key')
	.describe('secret', 'AWS access secret')
	.argv;

var source = argv.src;
var bucket = argv.bucket;

console.log("Deploying " + source + " to " + bucket);
console.log("Key " + argv.key);
console.log("Secret " + argv.secret);

var s3Client = s3.createClient({
	maxAsyncS3: 20,
	s3RetryCount: 3,
	s3RetryDelay: 1000,
	multipartUploadThreshold: 90971520,
	multipartUploadSize: 95728640,
	s3Options: {
		accessKeyId: argv.key,
		secretAccessKey: argv.secret
	}
});

function startDeployment() {
	var params = {
		localDir: source,
		deleteRemoved: true,
		s3Params: {
			Bucket: bucket,
			Prefix: argv.prefix,
			ACL: argv.acl
		}
	};
	var uploader = s3Client.uploadDir(params);
	uploader.on('error', function (err) {
		console.error("unable to sync:", err.stack);
	});
	uploader.on('progress', function () {
		process.stdout.write("progress " + uploader.progressAmount + "/" + uploader.progressTotal + "\r");
	});
	uploader.on('end', function () {
		console.log("done uploading");
	});
}

startDeployment();