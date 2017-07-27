# Moodle Assignment Feedback Packager

> Create a offline assignment feedback zip fro moodle from csv and pdfs matched by groups.

## Demo

https://bfritscher.github.io/moodle-assignment-feedback-packager/

## Usage

0. Files can be provided on startup with ?url=http://linktofiletodonwload (pdf, zip, or json array with further links to pre provision the feedback).

1. Upload CSV from moodle assignments

2.
    - Set Grades by group or inidividualy
    - If required, upload files with group names

3. Export csv and zip with feedback file for each participant.


## FAQ

<dl>
  <dt>Are my files send to a server?</dt>
  <dd>No all is done locally in
your browser.</dd>
  <dt>Limitations?</dt>
  <dd>Browser's max size of files is arround 200MB</dd>
</dl>



## Build Setup

``` bash
# install dependencies
npm install

# serve with hot reload at localhost:8080
npm run dev

# build for production with minification
npm run build

# build for production and view the bundle analyzer report
npm run build --report
```

For detailed explanation on how things work, checkout the [guide](http://vuejs-templates.github.io/webpack/) and [docs for vue-loader](http://vuejs.github.io/vue-loader).
