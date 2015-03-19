import c4d
from c4d import documents,UVWTag
from c4d.utils import Deg
from c4d import symbols as sy, plugins, utils, bitmaps, gui
import math


def BlenderExport():
    if not op: return
    if op.GetType() != 5100:
        print 'Selected Object is not an editable mesh'
        return
    unit = 0.001#for scale
    foffset = 1#for frames
    bd = doc.GetRenderBaseDraw()
    scr = bd.GetFrameScreen()
    rd = doc.GetActiveRenderData()
    sizeX = int(rd[sy.RDATA_XRES_VIRTUAL])
    sizeY = int(rd[sy.RDATA_YRES_VIRTUAL])
    name  = op.GetName()
    fps   = doc.GetFps()
    sFrame= doc.GetMinTime().GetFrame(fps)
    eFrame= doc.GetMaxTime().GetFrame(fps)
    code  = 'import Blender\nfrom Blender import *\nimport bpy\nfrom Blender.Mathutils import *\n\nscn = bpy.data.scenes.active\ncontext=scn.getRenderingContext()\ncontext.fps = '+str(fps)+'\ncontext.sFrame = '+str(sFrame)+'\ncontext.eFrame = '+str(eFrame)+'\ncontext.sizeX = '+str(sizeX)+'\ncontext.sizeY = ' + str(sizeY) + '\n'

    def GetMesh(code):
        # goto 0
        doc.SetTime(c4d.BaseTime(0, fps))
        c4d.DrawViews( c4d.DA_ONLY_ACTIVE_VIEW|c4d.DA_NO_THREAD|c4d.DA_NO_REDUCTION|c4d.DA_STATICBREAK )
        c4d.GeSyncMessage(c4d.EVMSG_TIMECHANGED)
        doc.SetTime(doc.GetTime())
        c4d.EventAdd(c4d.EVENT_ANIMATE)

        code      += 'editmode = Window.EditMode()\nif editmode:\tWindow.EditMode(0)\n'
        coords4D   = op.GetPointAll()
        coords     = 'coords = ['
        uvw        = 0
        uvs        = 'uvs = ['
        for tag in op.GetTags():
            if tag.GetName() == "UVW":
                uvw = tag
        for c in coords4D:
            coords += '['+str(c.x*unit)+','+str(c.z*unit)+','+str(c.y*unit)+'],'
        coords     = coords.rpartition(',')[0] + ']\n'
        faces4D    = op.GetAllPolygons()
        fcount     = 0
        faces      = 'faces = ['
        for f in faces4D:
            faces  += '['+str(f)+'],'
            uv = uvw.Get(fcount);
            uvs  += '[Vector('+str(uv[0].x)+','+str(1.0-uv[0].y)+'),Vector('+str(uv[1].x)+','+str(1.0-uv[1].y)+'),Vector('+str(uv[2].x)+','+str(1.0-uv[2].y)+')],'
            fcount += 1

        faces      = faces.rpartition(',')[0] + ']\n'
        uvs        = uvs.rpartition(',')[0] + ']\n'

        code       = code + coords + faces + uvs
        code      += "c4dmesh = bpy.data.meshes.new('"+name+"_mesh')\nc4dmesh.verts.extend(coords)\nc4dmesh.faces.extend(faces)\n\nob = scn.objects.new(c4dmesh,'"+name+"_obj')\nc4dmesh.flipNormals()\n\nif editmode:\tWindow.EditMode(1)\n\n"
        code      += "c4dmesh.quadToTriangle()\nc4dmesh.addUVLayer('c4duv')\n"
        code      += "for f in range(0,"+str(fcount)+"):\n\tc4dmesh.faces[f].uv = uvs[f]\n"

        return code

    def GetIPOKeys(code):
        # store properties for tracks
        tracks   = op.GetCTracks()
        # 0,1,2 = Position, 3,4,5 = Scale, 6,7,8 = Rotation, 9 = PLA
        # props = [[lx,f],[ly,f],[lz,f],[sx,f],[sy,f],[sz,f],[rx,f],[ry,f],[rz,f]]
        try:
            props = []
            trackIDs = [3,4,5,6,7,8,0,2,1]
            propVals = ['LocX','LocZ','LocY','SizeX','SizeY','SizeZ','RotZ','RotX','RotY']
            propIPOs = ['Ipo.OB_LOCX','Ipo.OB_LOCZ','Ipo.OB_LOCY','Ipo.OB_SCALEX','Ipo.OB_SCALEY','Ipo.OB_SCALEY','Ipo.OB_ROTZ','Ipo.OB_ROTX','Ipo.OB_ROTY']
            for t in range(0,9):
                props.append([[],[]])
                curve    = tracks[t].GetCurve()
                keyCount = curve.GetKeyCount()
                for k in range(0,keyCount):  
                        key   = curve.GetKey(k)
                        props[t][0].append(key.GetValue())
                        props[t][1].append(key.GetTime().GetFrame(fps))
            # find the max key
            maxProp = max(enumerate(props), key = lambda tup: len(tup[1]))[1][1]
            maxKeys = len(maxProp)
            # loop through tracks and keys
            for key in range(0,maxKeys):
                code += "Blender.Set('curframe',"+str(maxProp[key])+")\n"
                for track in trackIDs:
                    if(key < len(props[track][0])):
                        code += "ob."+propVals[track] + " = " + str(props[track][0][key]) + '\n'
                        code += 'key = ob.insertIpoKey(' + propIPOs[track] + ')\n'
        except:
            pass
        return code
    #     mesh/morph animation -> mesh always has the same number of verts
    def GetShapeKeys(code):
        track = 0;
        tracks = op.GetCTracks()
        for t in tracks:
            if(t.GetName() == 'PLA'):   track = t
        # track    = op.GetCTracks()[9]    
        if track != 0:
            curve    = track.GetCurve()
            keyCount = curve.GetKeyCount()
            verts    = []
            frames   = []
            vertsNum  = op.GetPointCount()
            ctime = doc.GetTime()

            for k in range(1,keyCount):
                key = curve.GetKey(k)
                frames.append(key.GetTime().GetFrame(fps))
                c4d.StatusSetBar(100*(k/keyCount))
                doc.SetTime(key.GetTime())
                c4d.DrawViews( c4d.DA_ONLY_ACTIVE_VIEW|c4d.DA_NO_THREAD|c4d.DA_NO_REDUCTION|c4d.DA_STATICBREAK )
                c4dvecs = op.GetPointAll();
                blendvecs = []
                for v in c4dvecs:
                    blendvecs.append([v.x*unit,v.z*unit,v.y*unit])
                verts.append(blendvecs)
                c4d.GeSyncMessage(c4d.EVMSG_TIMECHANGED)
            doc.SetTime(ctime)
            c4d.EventAdd(c4d.EVENT_ANIMATE)
            c4d.StatusClear()

            code += '\n\n# shape keys\nverts = ' + str(verts) + '\n'
            code += "if(ob.activeShape == 0):\n\tob.insertShapeKey()\n\n"
            for f in range(0,len(frames)):
                kNum = str(f+1)
                code += "if editmode:   Window.EditMode(0)\n"
                code += "for v in range(0,"+str(vertsNum)+"):\n\tc4dmesh.verts[v].co.x = verts["+str(f)+"][v][0]\n\tc4dmesh.verts[v].co.y = verts["+str(f)+"][v][1]\n\tc4dmesh.verts[v].co.z = verts["+str(f)+"][v][2]\n"
                code += "c4dmesh.calcNormals()\n"
                code += "ob.insertShapeKey()\n"
                code += "if editmode:   Window.EditMode(1)\n"
                code += "shapeKey = ob.getData().getKey()\n"
                code += "newIpo = Ipo.New('Key','newIpo')\n"
                code += "if(shapeKey.ipo == None):   shapeKey.ipo = newIpo\n"
                code += "if(shapeKey.ipo['Key "+kNum+"'] == None):   shapeKey.ipo.addCurve('Key "+kNum+"')\n"
                if(f == 0):  code += "shapeKey.ipo['Key "+kNum+"'].append(BezTriple.New(1.0,0.0,0.0))\n"
                if(f > 0):  code += "shapeKey.ipo['Key "+kNum+"'].append(BezTriple.New("+str(float(frames[f-1]))+",0.0,0.0))\n"
                code += "shapeKey.ipo['Key "+kNum+"'].append(BezTriple.New("+str(float(frames[f]))+",1.0,0.0))\n"
        else:
            #no PLA tracks, look for morph tag
            vertsNum  = op.GetPointCount()
            for tag in op.GetTags():
                if tag.GetType() == 1019633:
                    # print tag[sy.MORPHTAG_MORPHS]
                    '''
                    work around
                    1. store first key for each track curve
                    2. set the first key value to 1 for the 1st track and 0 for the others
                    3. store the mesh vertices -> track name verts = []
                    4. after all track verts are stored, restore the original values
                    5. write the the curve keys for blender shape keys
                    '''
                    code += "if(ob.activeShape == 0):\n\tob.insertShapeKey()\n\n"
                    tc = 0
                    tcs = str(tc+1)
                    for track in tag.GetCTracks():
                        curve = track.GetCurve()
                        value = curve.GetKey(0).GetValue()
                        curve.GetKey(0).SetValue(curve,1.0)
                        print track.GetName()
                        doc.SetTime(c4d.BaseTime(0, fps))
                        c4d.DrawViews( c4d.DA_ONLY_ACTIVE_VIEW|c4d.DA_NO_THREAD|c4d.DA_NO_REDUCTION|c4d.DA_STATICBREAK )
                        c4dvecs = op.GetPointAll();
                        blendverts = []
                        for v in c4dvecs:
                            blendverts.append([v.x*unit,v.z*unit,v.y*unit])
                        code += "Key"+tcs+"verts = " + str(blendverts)+"\n"
                        code += "if editmode:   Window.EditMode(0)\n"
                        code += "for v in range(0,"+str(vertsNum)+"):\n\tc4dmesh.verts[v].co.x = Key"+tcs+"verts[v][0]\n\tc4dmesh.verts[v].co.y = Key"+tcs+"verts[v][1]\n\tc4dmesh.verts[v].co.z = Key"+tcs+"verts[v][2]\n"
                        code += "c4dmesh.calcNormals()\n"
                        code += "ob.insertShapeKey()\n"
                        code += "if editmode:   Window.EditMode(1)\n"
                        code += "shapeKey = ob.getData().getKey()\n"
                        code += "newIpo = Ipo.New('Key','newIpo')\n"
                        code += "if(shapeKey.ipo == None):   shapeKey.ipo = newIpo\n"
                        code += "if(shapeKey.ipo['Key "+tcs+"'] == None):   shapeKey.ipo.addCurve('Key "+tcs+"')\n"
                        print op.GetPointAll()
                        c4d.GeSyncMessage(c4d.EVMSG_TIMECHANGED)
                        curve.GetKey(0).SetValue(curve,value)
                        keyCount = curve.GetKeyCount()
                        for k in range(0,keyCount):
                            key = curve.GetKey(k)
                            value = key.GetValue()
                            frame = key.GetTime().GetFrame(fps)
                            code += "shapeKey.ipo['Key "+tcs+"'].append(BezTriple.New("+str(float(frame))+","+str(value)+",0.0))\n"
                        tc += 1
                        tcs = str(tc+1)

                    c4d.EventAdd(c4d.EVENT_ANIMATE)
        return code

    code = GetMesh(code)
    code = GetIPOKeys(code)
    code = GetShapeKeys(code)

    file = open(doc.GetDocumentPath()+'/'+op.GetName()+'_export.py','w')
    file.write(code)
    file.close()


BlenderExport()