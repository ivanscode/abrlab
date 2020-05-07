import subprocess as sp
import sys, os
import re

FFBIN = 'ffmpeg'
MP4BIN = 'mp4box'
resolutions = ['426x240', '640x360', '854x480', '1280x720', '1920x1080']
bitrates = ['400k', '700k', '1250k', '2500k', '4500k']
buffSizes = ['200k', '350k', '625k', '1250k', '2250k']

class Video:
    def __init__(self, fin):
        self.fin = fin
        self.path, self.name = os.path.split(fin)
        self.extractMetadata()

    def extractMetadata(self):
        cmd = '{} -i {}'.format(FFBIN, self.fin)
        pipe = sp.Popen(cmd, stdout=sp.PIPE, stderr=sp.PIPE, universal_newlines=True)
        _, output = pipe.communicate()
        vdata = re.findall('Video:.*', output)[0]
        print(vdata)
        self.resolution = re.findall('([0-9]{2,})x([0-9]{2,})', vdata)[0]
        self.framerate = re.findall('\\d*(?=\\sfps)', vdata)[0]

class Cmd:
    AUDIO = 'audio'
    ENCODE = 'encode'
    DASH = 'dash'
    AUDIOCOPY = ' -c:a copy -vn'
    CODECS = ' -an -c:v libx264 -x264opts'
    DASHENC = ' -dash 1000 -rap -frag-rap -profile "dashavc264:live" -out'

    def __init__(self, video, action):
        self.action = action
        self.path = video.path
        self.name = video.name
        self.setResolution(video.resolution[0], video.resolution[1])
        self.setFramerate(video.framerate)
        self.input = ' -i {}'.format(video.fin)
        self.verbose = ''

    def setResolution(self, w, h):
        self.resolution = ' -vf scale={}:{}'.format(w, h)
        self.setOutput(None)

    def setFramerate(self, fr):
        self.framerate = ' keyint={}:min-keyint={}:no-scenecut'.format(fr, fr)

    def setBitrate(self, br):
        self.bitrate = ' -b:v {} -maxrate {}'.format(br, br)

    def setBuffSize(self, bs):
        self.buffSize = ' -bufsize {}'.format(bs)

    def setVerbose(self, v):
        if v:
            self.verbose = ''
        else:
            self.verbose = ' -loglevel error'

    def setInputs(self, fin):
        self.inputs = fin
    
    def setOutput(self, path):
        if self.action == Cmd.AUDIO:
            if path == None:
                self.output = ' -y {}\\audio-{}'.format(self.path, self.name)
            else:
                if path == '':
                    self.output = ' -y audio-{}'.format(self.name)
                else:
                    self.output = ' -y {}\\audio-{}'.format(path, self.name)
        if self.action == Cmd.ENCODE:
            if path == None:
                self.output = ' -y {}\\{}-{}'.format(self.path, self.resolution.split(':')[1], self.name)
            else:
                if path == '':
                    self.output = ' -y {}-{}'.format(self.resolution.split(':')[1], self.name)
                else:
                    self.output = ' -y {}\\{}-{}'.format(path, self.resolution.split(':')[1], self.name)
        if self.action == Cmd.DASH:
            if path == None:
                self.output = ' {}\\{}.mpd'.format(self.path, self.name.split('.')[0])
            else:
                if path == '':
                    self.output = ' {}.mpd'.format(self.name.split('.')[0])
                else:
                    self.output = ' {}\\{}.mpd'.format(path, self.name.split('.')[0])
            
    def __str__(self):
        if self.action == Cmd.AUDIO:
            return FFBIN + self.verbose + self.input + Cmd.AUDIOCOPY + self.output
        if self.action == Cmd.ENCODE:
            return FFBIN + self.verbose + self.input + Cmd.CODECS + self.framerate + self.bitrate + self.buffSize + self.resolution + self.output
        if self.action == Cmd.DASH:
            return MP4BIN + Cmd.DASHENC + self.output + self.inputs


'''
Extract audio from video and save as a separate file
'''
def extractAudio(video):
    cmd = Cmd(video, Cmd.AUDIO)
    cmd.setVerbose(False)
    sp.Popen(str(cmd), stdout=sp.PIPE, stderr=sp.PIPE, universal_newlines=True).communicate()
    print('Extracted audio...')


'''
Encode into most common resolutions

Encoding is done from 240p up to the resolution of the video

NOTE: This method asssumes the video is in a standard resolution for 16:9 videos
    meaning if the video is YYYYx721, the method should still work but the video will
    be encoded up to 1080p
'''
def multiEncode(video):
    for i, r in enumerate(resolutions):
        if int(r.split('x')[1]) > int(video.resolution[1]):
            return
        cmd = Cmd(video, Cmd.ENCODE)
        cmd.setVerbose(False)
        cmd.setBitrate(bitrates[i])
        cmd.setBuffSize(buffSizes[i])
        cmd.setResolution(r.split('x')[0], r.split('x')[1])
        print('Formatting with {}'.format(str(cmd)))
        print('===================================================')
        p = sp.Popen(str(cmd), stdout=sp.PIPE, stderr=sp.PIPE, universal_newlines=True)
        p.communicate()
        print('Encoded for {}'.format(r))


'''
Convert series of bitrates to DASH
'''
def toDash(video):
    cmd = Cmd(video, Cmd.DASH)
    inputs = ''
    for r in resolutions:
        if int(r.split('x')[1]) > int(video.resolution[1]):
            break
        inputs += ' {}\\{}-{}'.format(video.path, r.split('x')[1], video.name)
    inputs += ' {}\\audio-{}'.format(video.path, video.name)
    cmd.setInputs(inputs)
    p = sp.Popen(str(cmd), stdout=sp.PIPE, stderr=sp.PIPE, universal_newlines=True)
    p.communicate()
    print('MPD generated')
        