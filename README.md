# grunt-tentacles

> Upload files to Amazon S3.

## Getting Started
This plugin requires Grunt `~0.4.5`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-tentacles --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-tentacles');
```

## The "tentacles" task

### Overview
In your project's Gruntfile, add a section named `tentacles` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  tentacles: {
    overview: {
      options: {
        bucketName: 'bucket.example.com'
      },
      src: ['app/index.html', 'app/styles/main.css']
    }
  },
});
```

### Options

#### options.bucketName
Type: `String`
Default value: `undefined`

#### options.accessKeyId
Type: `String`
Default value: `process.env.AWS_ACCESS_KEY_ID`

#### options.secretAccessKey
Type: `String`
Default value: `process.env.AWS_SECRET_ACCESS_KEY`

#### options.regions
Type: `String`
Default value: `process.env.AWS_REGIONS`

### Usage Examples

#### Default Options
Upload `app/index.html`, `app/styles/main.css` to `bucket.example.com` bucket.

- `app/index.html` -> `bucket.example.com/app/index.html`
- `app/styles/main.css` -> `bucket.example.com/app/styles/main.css`

```js
// Required:
// - process.env.AWS_ACCESS_KEY_ID
// - process.env.AWS_SECRET_ACCESS_KEY
// - process.env.AWS_REGIONS
grunt.initConfig({
  tentacles: {
    default: {
      options: {
        bucketName: 'bucket.example.com'
      },
      src: ['app/index.html', 'app/styles/main.css']
    }
  },
});
```

#### Custom Options
Upload `app/` directory to `bucket.example.com` bucket. ( files.*cwd* = `app` )

- `app/index.html` -> `bucket.example.com/index.html`
- `app/.dotfile` -> `bucket.example.com/.dotfile`

```js
grunt.initConfig({
  tentacles: {
    custom: {
      options: {
        bucketName:      'bucket.example.com',
        accessKeyId:     process.env.MY_ACCESS_KEY_ID,
        secretAccessKey: process.env.MY_SECRET_ACCESS_KEY,
        regions:         process.env.MY_REGIONS,
      },
      files: [
        { cwd: 'app', src: '**', dot: true, filter: 'isFile' }
      ]
    }
  }
});
```

## Release History
- 2014-12-21   v0.2.0   Support `AWS.S3` all options.
- 2014-06-30   v0.1.2   Fix README.
- 2014-06-12   v0.1.1   Add detecting ContentType.
- 2014-06-11   v0.1.0   First release.
