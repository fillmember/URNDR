import {
  Point , PenTool , BaseModule
} from 'urndr.js'

const PanTool = ({strokes, modules, threeManager, style}) => {
  let timer = null
  return new PenTool({
    name: "Mover",
    onmousedown: function(pen, evt){
      clearInterval(timer)
      timer = setInterval( function(){
        threeManager.rig.target_theta += pen.ndc_x * 0.2
        threeManager.rig.pitch = ndc_y * -3
      },20)
    },
    onmouseup: function(pen, evt){
      clearInterval( timer )
    }
  })
}

const DrawTool = ({strokes, modules, threeManager, style}) => {
  return new PenTool({
    name: "Draw",
    onmousedown: function(pen, evt) { strokes.beginNewStroke(); },
    onmouseup: function(pen, evt) {
      const astk = strokes.getActiveStroke()
      if (astk) {astk.optimize();}
    },
    onmousemove: function(pen, evt) {
      if (pen.isDown !== 1) { return; }
      modules.runEnabledModulesInList(BaseModule.STYLE_MODULE, style)
      const pnt = new Point({
        X: pen.x,
        Y: pen.y,
        S: style.brush_size,
        R: style.color[0],
        G: style.color[1],
        B: style.color[2],
        A: style.color[3]
      });
      // WRITE POINT INTO STROKE
      const stk = strokes.getActiveStroke();
      if (stk !== 0) {
        stk.addPoint(pnt)
      }
      // Run modules that changes the pnt.
      modules.runEnabledModulesInList(BaseModule.POINT_MODULE, pnt)
      pnt.refreshBinding(threeManager)
    }
  })
}

const EraseTool = ({strokes, modules, threeManager, style}) => {
  return new PenTool({
    name: "Eraser",
    init: function() {},
    onmousedown: function(pen, evt) {},
    onmouseup: function(pen, evt) {},
    onmousemove: function(pen, evt) {

      if (pen.isDown !== 1) {
          return;
      }
      let s = pen.pressure;
      if (s < 0.1) {
          s = 0.1
      };

      const query = strokes.getFromQuadTree(pen.x, pen.y, s, s)
      const size_sq = s * style.brush_size * style.brush_size
      var pnt, dx, dy, dist_sq

      let _power = 1 - s
      _power = _power > 0.75 ? 0.75 : _power;

      for (let q in query) {
        pnt = query[q].reference.point;
        dx = pen.x - pnt.X;
        dy = pen.y - pnt.Y;
        dist_sq = dx * dx + dy * dy;
        if (dist_sq < size_sq) {
          pnt.A = pnt.A > 0.2 ? pnt.A * _power : 0;
        }
      }
    }
  })
}

const ModifyTool = ({strokes, modules, threeManager, style}) => {
  const nearest = (tool, p, arr, str) => {
      const len = arr.length
      let candidate = false
      let nearest_so_far = tool.data.limit
      let dist
      for (let i = 0; i < len; i++) {
        if (pick(arr[i], str)) {
          dist = sqr_dist(p, arr[i])
          if (dist < nearest_so_far) {
            candidate = i;
            nearest_so_far = dist;
          }
        }
      }
      return candidate
  }
  const sqr_dist = (p, q) => {
      var dX = p.x - q.x,
          dY = p.y - q.y;
      return dX * dX + dY * dY
  }
  const pick = (q, str) => {
      if (q.hasOwnProperty("reference")) {
          if (q.reference.hasOwnProperty(str)) {
              return true;
          }
      }
      return false;
  }
  return new PenTool({
    name: "Stroke Selector",
    data: {
      limit : 400,
      selectedPoint : 0
    },
    onmousemove: function(pen, evt) {

        strokes.eachStroke(function(stk) {
            stk.hovered = false;
        })

        const query = strokes.getFromQuadTree(pen.x, pen.y, 0, 0)
        let _result = nearest(this, pen, query, "point");
        if (_result !== false) {
            _result = query[_result].reference
            _result.stroke.hovered = true;
            if (pen.isDown) {
                if (this.data.selectedPoint === 0) {
                    this.data.selectedPoint = _result.point;
                }
            }
        }
        if (this.data.selectedPoint !== 0) {
            this.data.selectedPoint.X = pen.x;
            this.data.selectedPoint.Y = pen.y;
            this.data.selectedPoint.refreshBinding(U3)
        }

    },
    onmouseup: function(pen, evt) {

        if (this.data.selectedPoint !== 0) {}

        this.data.selectedPoint = 0;

        strokes.eachStroke(function(stk) {
            stk.selected = false;
        })

        const query = strokes.getFromQuadTree(pen.x, pen.y, 5, 5);
        var _result = nearest(this, pen, query, "point");
        if (_result !== false) {
            _result = query[_result].reference
            _result.stroke.selected = true;
            strokes.active_stroke = _result.stroke.id;
        }

    },
    disengage: function(pen, evt) {
        strokes.eachStroke(function(stk) {
            stk.selected = false;
        })
    }

})
}

export {PanTool,DrawTool,EraseTool,ModifyTool}
