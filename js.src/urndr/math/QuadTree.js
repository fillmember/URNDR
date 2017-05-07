// QuadTree
// source: http://gamedevelopment.tutsplus.com/tutorials/quick-tip-use-quadtrees-to-detect-likely-collisions-in-2d-space--gamedev-374

export default class QuadTree {

    constructor ( pLevel , pBounds) {

        // Statics
        this.MAX_OBJECTS = 20
        this.MAX_LEVELS = 5

        // Attributes
        this.level = pLevel
        this.objects = []
        this.bounds = pBounds
        this.nodes = [null,null,null,null]
    }
    clear () {

        this.objects = []
        for (var i = 0, max = this.nodes.length; i < max; i++) {
            if (this.nodes[i] !== null) {
                this.nodes[i].clear()
                this.nodes[i] = null
            }
        }

    }
    split () {

        var w,h,x,y,lvl;

        lvl = this.level + 1;
        w = this.bounds.width / 2;
        h = this.bounds.height / 2;
        x = this.bounds.x;
        y = this.bounds.y;

        var qt = URNDR.QuadTree, rect = URNDR.Rectangle;

        this.nodes[0] = new qt( lvl, new rect(x + w, y    , w, h) )
        this.nodes[1] = new qt( lvl, new rect(x    , y    , w, h) )
        this.nodes[2] = new qt( lvl, new rect(x    , y + h, w, h) )
        this.nodes[3] = new qt( lvl, new rect(x + w, y + h, w, h) )

    }
    getIndex (rect){

        var index,verticalMidPoint,horizontalMidPoint,topQuadrant,bottomQuadrant;

            index = -1;
            verticalMidPoint = this.bounds.x + this.bounds.width * 0.5;
            horizontalMidPoint = this.bounds.y + this.bounds.height * 0.5;

            // object can completely fit within the top quadrants
            topQuadrant = rect.y < horizontalMidPoint && rect.y + rect.height < horizontalMidPoint

            // object can completely fit within the bottom quadrants
            bottomQuadrant = rect.y > horizontalMidPoint

        // object can completely fit within the left quadrant
        if (rect.x < verticalMidPoint && rect.x + rect.width < verticalMidPoint) {

            if (topQuadrant) {
                index = 1
            } else if (bottomQuadrant) {
                index = 2
            }

        }
        // object can completely fit within the left quadrant
        else if (rect.x > verticalMidPoint) {

            if (topQuadrant) {
                index = 0
            } else if (bottomQuadrant) {
                index = 3
            }

        }

        return index

    }
    insert (rect) {

        if (this.nodes[0]) {

            var index = this.getIndex(rect)

            if (index !== -1) {

                return this.nodes[index].insert(rect)

            }

        }

        this.objects.push(rect)

        if (this.objects.length > this.MAX_OBJECTS && this.level < this.MAX_LEVELS) {

            if (!this.nodes[0]) {

                this.split()

            }

            var i = 0

            while (i < this.objects.length) {

                var index = this.getIndex(this.objects[i])

                if (index !== -1) {
                    this.nodes[index].insert( this.objects.splice(i,1)[0] )
                } else {
                    i++
                }

            }

        }

    }
    retrieve ( arr , rect ) {

        var index = this.getIndex(rect)
        if (index !== -1 && this.nodes[0]) {
            arr = arr.concat( this.nodes[index].retrieve( arr , rect ) )
        }

        arr = arr.concat( this.objects )

        return arr

    }
}
