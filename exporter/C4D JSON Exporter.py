import c4d
from c4d import documents, gui

import math
import re

# A learning tool :D
def findAttr( find , op ):
    attributes = dir( op )
    matches = (x for x in attributes if x.find( find ) > -1 )
    result = '===\nsearch attributes in %s : \n' % op
    print result + '\n'.join( matches )

# courtesy to @jterrace : http://stackoverflow.com/questions/10097477/python-json-array-newlines
def to_json(o, level=0):
    INDENT = 0 # 2
    SPACE = ""
    NEWLINE = "" # \n
    ret = ""
    if isinstance(o, dict):
        ret += "{" + NEWLINE
        # Ignore first occurence of the placement of a comma
        comma = ""
        for k,v in o.iteritems():
            ret += comma
            comma = "," # ,\n
            ret += SPACE * INDENT * (level+1)
            ret += '"' + str(k) + '":' + SPACE
            ret += to_json(v, level + 1)

        ret += NEWLINE + SPACE * INDENT * level + "}"
    elif isinstance(o, basestring):
        ret += '"' + o + '"'
    elif isinstance(o, list):
        ret += "[" + ",".join([to_json(e, level+1) for e in o]) + "]"
    elif isinstance(o, bool):
        ret += "true" if o else "false"
    elif isinstance(o, int):
        ret += str(o)
    elif isinstance(o, float):
        ret += ('%.1f' % round(o,1)).rstrip('0').rstrip('.')
    elif isinstance(o, numpy.ndarray) and numpy.issubdtype(o.dtype, numpy.integer):
        ret += "[" + ','.join(map(str, o.flatten().tolist())) + "]"
    elif isinstance(o, numpy.ndarray) and numpy.issubdtype(o.dtype, numpy.inexact):
        ret += "[" + ','.join(map(lambda x: '%.1f' % x, o.flatten().tolist())) + "]"
    else:
        raise TypeError("Unknown type '%s' for json serialization" % str(type(o)))
    return ret

# Functions for getting vertices, face & morphtargets
def GetVertices():
    result = []
    vertices = op.GetAllPoints()
    for v in vertices:
        result.append( v.x )
        result.append( v.y )
        result.append( v.z )
    return result

def GetFaces():
    result = []
    faces = op.GetAllPolygons()
    for f in faces:
        if f.d:
            result.append( 1 )
            result.append( f.a )
            result.append( f.b )
            result.append( f.c )
            result.append( f.d )
        else:
            result.append( 0 )
            result.append( f.a )
            result.append( f.b )
            result.append( f.c )

    return result

def GetMorphTarget():
    # Only get PLA track. For now.
    track = 0
    tracks = op.GetCTracks()

    # find PLA track
    for t in tracks:
        if(t.GetName() == 'PLA'):
            track = t

    # If PLA track found
    if track != 0:

        curve = track.GetCurve()
        morphTargets = []

        keyCount = curve.GetKeyCount()
        for k in range(0,keyCount):
            key = curve.GetKey(k)
            
            # Interface & Draw Update : C4D API
            doc.SetTime( key.GetTime() )
            c4d.DrawViews( c4d.DA_ONLY_ACTIVE_VIEW|c4d.DA_NO_THREAD|c4d.DA_NO_REDUCTION|c4d.DA_STATICBREAK )
            
            # get all points into an array
            vertices = []
            points = op.GetAllPoints()
            for p in points:
                vertices.append( p.x )
                vertices.append( p.y )
                vertices.append( p.z )

            morphTargets.append({
                'name'    : 'f%04d' % k,
                'vertices': vertices
            })

            # end of inner loop

        return morphTargets

    else:
        return False

def exportJSON():
    if not op:
        gui.MessageDialog('Please select an editable mesh object. ')
        return
    if op.GetType() != 5100:
        gui.MessageDialog('The selected object must be an editable mesh object. ')
        return

    # get the data
    # point_count = op.GetPointCount()
    # face_count = op.GetPolygonCount()
    morphs = GetMorphTarget()
    model = {}
    # model['metadata'] = {
    #     'formatVersion' : 3,
    #     'generatedBy'   : "miGenerator",
    #     'vertices'      : point_count,
    #     'faces'         : face_count,
    # }
    
    if morphs != False:
        # model['metadata']['morphTargets'] = len( morphs )
        model['morphTargets'] = morphs

    model['vertices'] = GetVertices()
    model['faces'] = GetFaces()
    # model['scale'] = 1.000000

    # parse to JSON (Javascript Object Notation)
    return_json = to_json( model )
    file_path = doc.GetDocumentPath()
    file_name = op.GetName()

    # write to file
    path = file_path + "/" + file_name + ".js"
    file = open( path , 'w+')
    file.write( return_json )
    file.close()
    
    # let user know the file is created. 
    gui.MessageDialog('the json is written to %s' % path )

if __name__=='__main__':
    exportJSON()