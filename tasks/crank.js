/*
 * grunt-tentacles
 * https://github.com/bouzuya/grunt-tentacles
 *
 * Copyright (c) 2014 bouzuya
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  var newS3Client = function(gruntOptions) {
    var S3 = require('aws-sdk').S3;

    return new S3({
      apiVersion: '2006-03-01',
      accessKeyId: gruntOptions.accessKeyId,
      secretAccessKey: gruntOptions.secretAccessKey,
      region: gruntOptions.region
    });
  };

  // [{ key: '', path: '', digest: '' }]
  var getLocalFiles = function(gruntFiles) {
    var Promise = require('q').Promise;
    var path = require('path');
    var crypto = require('crypto');
    var fs = require('fs');

    return Promise.resolve(gruntFiles.reduce(function(files, f) {
      return files.concat(f.src.map(function(key) {
        var filePath = f.cwd ? path.join(f.cwd, key) : key;
        return { key: key, path: filePath };
      }));
    }, [])
    .filter(function(file) {
      if (!grunt.file.isFile(file.path)) {
        grunt.log.warn('Path "' + file.path + '" is not file.');
        return false;
      } else {
        return true;
      }
    })
    .map(function(file) {
      var md5 = crypto.createHash('md5');
      md5.update(fs.readFileSync(file.path, {}));
      file.digest = md5.digest('hex');
      return file;
    }));
  };

  // [{ key: '', digest: '' }]
  var getRemoteFiles = function(gruntOptions) {
    var Promise = require('q').Promise;

    var s3 = newS3Client(gruntOptions);

    var listObjects = function(options) {
      return new Promise(function(resolve, reject) {
        s3.listObjects(options, function(err, data) {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        });
      });
    };

    var listAllObjects = function(options, result) {
      result = result || [];
      return listObjects(options).then(function(data) {
        var contents = data.Contents;
        result = result.concat(contents);
        if (data.IsTruncated) {
          var marker = data.NextMarker || contents[contents.length - 1].Key;
          options.Marker = marker;
          return listAllObjects(options, result);
        } else {
          return result;
        }
      });
    };

    return listAllObjects({
      Bucket: gruntOptions.bucketName
    }).then(function(result) {
      return result.map(function(r) {
        // bug ? remote.digest format : '"..."'
        var digest = JSON.parse(r.ETag);
        return { key: r.Key, digest: digest };
      });
    });
  };

  var getUploadFiles = function(localFiles, remoteFiles) {
    var Promise = require('q').Promise;
    return Promise.resolve(localFiles.filter(function(local) {
      return !remoteFiles.some(function(remote) {
        return local.key === remote.key && local.digest === remote.digest;
      });
    }));
  };

  var uploadLocalFiles = function(files, gruntOptions) {
    var Promise = require('q').Promise;
    var fs = require('fs');
    var mime = require('mime');

    var bucketName = gruntOptions.bucketName;
    var s3 = newS3Client(gruntOptions);
    var upload = function(file) {
      return new Promise(function(resolve, reject) {
        var params = {
          Bucket: bucketName,
          Key: file.key,
          Body: fs.readFileSync(file.path, {}),
          ContentType: mime.lookup(file.path)
        };
        grunt.log.writeln('Upload "' + file.path + '" to "' + file.key + '".');
        s3.putObject(params, function(err) {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    };

    grunt.log.writeln('Upload to bucket "' + bucketName + '"');
    return files.reduce(function(promise, file) {
      return promise.then(function() { return upload(file); });
    }, Promise.resolve());
  };

  grunt.registerMultiTask('tentacles', 'Upload files to Amazon S3.', function() {
    var Promise = require('q').Promise;

    var done = this.async();

    var options = this.options({
      bucketName: undefined,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'ap-northeast-1'
    });

    var localFiles;
    var remoteFiles;
    var uploadFiles;

    Promise.resolve()
    .then(function() { return getLocalFiles(this.files); }.bind(this))
    .then(function(files) { localFiles = files; })
    .then(function() { return getRemoteFiles(options); })
    .then(function(files) { remoteFiles = files; })
    .then(function() { return getUploadFiles(localFiles, remoteFiles); })
    .then(function(files) { uploadFiles = files })
    .then(function() {
      // logging
      localFiles.forEach(function(file) {
        var m = 'Local digest "' + file.digest + '" path "' + file.path + '"';
        grunt.verbose.writeln(m);
      });
      remoteFiles.forEach(function(file) {
        var m = 'Remote digest "' + file.digest + '" key "' + file.key + '"';
        grunt.verbose.writeln(m);
      });
      uploadFiles.forEach(function(file) {
        var m = 'Upload digest "' + file.digest + '" key "' + file.key + '"';
        grunt.verbose.writeln(m);
      });
    })
    .then(function() { return uploadLocalFiles(uploadFiles, options) })
    .then(done, done);
  });

};
