import os, sys
import converter as c

path = './'

if __name__ == '__main__':
    video = c.Video(sys.argv[1])
    c.extractAudio(video)
    c.multiEncode(video)
    c.toDash(video)