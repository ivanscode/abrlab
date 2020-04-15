import subprocess as sp
import sys, os
import re

FFBIN = 'ffmpeg'
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
    AUDIOCOPY = ' -c:a copy -vn'
    CODECS = ' -an -c:v libx264 -x264opts'

    def __init__(self, video, action):
        self.action = action
        self.setResolution(video.resolution[0], video.resolution[1])
        self.setFramerate(video.framerate)
        self.input = ' -i {}'.format(video.fin)
        self.verbose = ''
        self.path = video.path
        self.name = video.name
        self.setOutput(None)

    def setResolution(self, w, h):
        self.resolution = ' -vf scale={}:{}'.format(w, h)

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
            
    def __str__(self):
        if self.action == Cmd.AUDIO:
            return FFBIN + self.verbose + self.input + Cmd.AUDIOCOPY + self.output
        if self.action == Cmd.ENCODE:
            return FFBIN + self.verbose + self.input + Cmd.CODECS + self.framerate + self.bitrate + self.buffSize + self.resolution + self.output



def extractAudio(video):
    cmd = Cmd(video, Cmd.AUDIO)
    cmd.setVerbose(False)
    sp.Popen(str(cmd), stdout=sp.PIPE, stderr=sp.PIPE, universal_newlines=True).communicate()
    print('Extracted audio...')

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
        
        