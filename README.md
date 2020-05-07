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
    * [Graphing](https://github.com/ivanscode/abrlab#graphing)
* [Issues](https://github.com/ivanscode/abrlab#issues)
* [Implementing Custom Rules](https://github.com/ivanscode/abrlab#implementing-custom-rules)
    * [Creating](https://github.com/ivanscode/abrlab#creating)
    * [Adding to Demo](https://github.com/ivanscode/abrlab#adding-to-demo)

## Dependencies
To convert files to DASH format, I have included a converter script that uses:
* [ffmpeg](https://www.ffmpeg.org/download.html) used for converting videos into multiple bitrate formats
* [mp4box](https://github.com/gpac/gpac/wiki/MP4Box-Introduction) used for final DASH conversion

Python is used for the converter and hosting the demo webpage. However, any lightweight webserver should be able to host the demo page, but I have not tested that theory.

### Included
Dash.js' minified file is included

Additionally, the webiste uses Bootstrap for styling using its CDN
The js portion is included since Popper.js was needed

### Quirks
The converter is setup to be used on Windows, but if you are running Linux, the only necessary change in the converter script should be the file output format as Windows uses `dir\file` instead of `dir/file`.

If you want to wait for the fixed script for Linux, please use the following commands to encode mp4 files to DASH using ffmpeg and mp4box:

Some metadata must be extracted from the video by simply using:
```console
ffmpeg -i [input].mp4
```

Knowing the above info, execute:
```console
ffmpeg -i [input].mp4 -c:a copy -vn -y [output].mp4
ffmpeg -i [input].mp4 -an -c:v libx264 -x264opts keyint=[FPS]:min-keyint=[FPS]:no-scenecut -b:v [bitrate] -maxrate [bitrate] -bufsize [bitrate/2] -vf scale=[width]:[height] -y [output].mp4
```
**Note**: You will have to run that last line for every bitrate and resolution that you need for DASH


Finally, use mp4box to encode to dash:
```console
mp4box -dash 1000 -rap -frag-rap -profile "dashavc264:live" -out [output].mpd [input1].mp4 [input2].mp4 [inputn].mp4 [input-AUDIO].mp4
```

Additionally, the converter can only convert "standard" formats of videos correctly. It looks for 16:9 standard resultions defined in the `resolutions` array, so if the video's original resolution
does not match any in that array, the video will be encoded up to 1080p even if its base resolution is 240p.

## Web UI
### Setup
As mentioned above, any web server should do the trick in hosting the demo page.

For my purposes, I used Python's own webserver, `http.server` (Python 3.6)

### Running
Run `python -m http.server` or `python -m http.server [port]` if you already have something running on the default port 8000.
The command should be run in the `server` directory.

### Graphing
[Chart.js](https://www.chartjs.org/) is used to visualize whatever data collected. 

Currently, these are the metrics that are available to be graphed:
* Quality
* Seconds Stored in Buffer

They are all tracked over time in seconds with some quirks in-between.

Quality is tracked on every `SwitchRequest` instead of over some interval and is represented by the integer range 0-n where n depends on the available bitrate streams (n+1) for a given video.
For example, a video converted using the included converter that was originally 1080p, would be converted into 5 different bitrate videos, so n=4

Seconds Stored in Buffer are tracked by having a `setInterval()` set for .5 seconds update the graph. Note however, that the update does not stop on video pause as that would have complicated the code unnecessarily for the short dev period.
If the video needs to be paused or for some other other reason you would like a clean graph, `Clear Graph` button was made as a stop-gap solution and simply clears the graph of all data points

In addition to the graphing functionality, you can save the accumulated data displayed on the graph to a CSV file.

## Issues
For some reason, the player refuses to limit the buffer size in certain cases. For one of the videos tested, the bitrate needed to be lowered below a certain threshold to force the buffer size below its limit.
Additionally, the buffer and quality can be instantly changed by seeking to a different part of a video even if that part has been buffered.

In the lmited time of this project's development, I was unable to find a workaround for either of these issues.

## Implementing Custom Rules
The process could be considered a little difficult because the documentation for Dash.js has some discrepancies, but generally the flow is easy to understand.
At the end of a segment/fragment, the player calls `getMaxIndex` of a given rule it's using. Following whatever implemented rule logic, the function returns a `SwitchRequest` if the rule logic deems it necessary.
The rule class is built independently and can be easily added to the player logic.

### Creating
The demo includes a couple of pre-made rules provided by Dash.js. The simplest rule is the `LowestBitrateRule` which works exactly how it sounds, so I would recommend taking a look at that file to familiarize yourself with the rule class.
In general, the process is simple:
* Define rule class with `setup()` and `getMaxIndex()` functions defined the latter being the more important decision function.
* Pull whatever metrics from the player using its various "Models"
* Implement custom logic using above data
    * The logic should spit out an index of the "bitrate level" with 0 being the lowest bitrate up to n depending on how many different bitrate videos were provided
* Create a switch request and return it

**Note:** The priority flag in the SwitchRequest didn't seem to do much, so for faster bitrate switching, turn on fastABR in the demo (WIP)

### Adding to Demo
I tried to use as little external libraries as possible (within reason) to simplify the project, but it's always a double-edged sword.
That being said, adding the new rule to the demo is fairly simple:
1. Add GUI elements
    * Add buttons to ABR block - copy-paste existing ones and change their ID
    * Add rule script source to index
2. Add GUI listening logic
    * In main.js, there is already examples provided - copy-paste and change IDs
3. Add condition to player's init method
    * A parameter gets passed into `init()` where additional logic is required to switch between different rules
    * The function for rule switching already exists, so it's a matter of adding the new option

Obviously, if you do not want to bother with the buttons, simply force the player to switch to your rule by skipping straight to step 3