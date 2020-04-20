# ABR Algorithm Exploration with Dash.js

## Introduction

The project is meant to help people understand the how ABR algorithms affect the streaming quality of a video. However, the demo can also be a reference to the inner workings of what makes ABR streaming work since the setup for this project is also included.

Currently, this project is a work-in-progress, but here is what's working:
* Conversion of .mp4 files to DASH
* Player page with
    * Basic information about stream
    * Selection of a custom ABR rule
* Ability to add more custom ABR algorithms (not streamlined, but working)

## Table of Contents

* [Introduction](https://github.com/ivanscode/abrlab#introduction)
* [Table of Contents](https://github.com/ivanscode/abrlab#table-of-contents)
* [Dependencies](https://github.com/ivanscode/abrlab#dependencies)
    * [Included](https://github.com/ivanscode/abrlab#included)
    * [Quirks](https://github.com/ivanscode/abrlab#quirks)
* [Web UI](https://github.com/ivanscode/abrlab#web-ui)
    * [Setup](https://github.com/ivanscode/abrlab#setup)
    * [Running](https://github.com/ivanscode/abrlab#running)
* [How to use](https://github.com/ivanscode/abrlab#how-to-use)

## Dependencies
To convert files to DASH format, I have included a converter script that uses:
* [ffmpeg](https://www.ffmpeg.org/download.html) used for converting videos into multiple bitrate formats
* [mp4box](https://github.com/gpac/gpac/wiki/MP4Box-Introduction) used for final DASH conversion

Python is used for the converter and hosting the demo webpage. However, any lightweight webserver should be able to host the demo page, but I have not tested that theory.

### Included
Dash.js' minified file is included

Additionally, the webiste uses Bootstrap for styling using its CDN

### Quirks
The converter is setup to be used on Windows, but if you are running Linux, the only necessary change in the converter script should be the file output format as Windows uses `dir\file` instead of `dir/file`

## Web UI
### Setup
As mentioned above, any web server should do the trick in hosting the demo page.

For my purposes, I used Python's own webserver, `http.server` (Python 3.6)

### Running
Run `python -m http.server` or `python -m http.server [port]` if you already have something running on the default port 8000.
The command should be run in the `server` directory.

## How to use
The demo page has a very simple layout. Any changeable parameters will be in the right function column.

Implementing addditional custom algorithms is not too difficult. Take a look at `LowestBitrateRule.js` in the server directory as an example. Its implementation required an additional if statement to select it once its button was pressed. A more streamlined
process is in the works