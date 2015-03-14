URNDR.QuadTree = function( pLevel , pBounds) {
	
	this.MAX_OBJECTS = 10
	this.MAX_LEVELS = 5

	this.level = pLevel
	this.objects = new Array()
	this.bounds = pBounds
	this.nodes = new Array(4)

	this.clear = function() {
		
		this.objects = []
		for (var i = 0; i < this.nodes.length; i++) {
			this.nodes[i].clear()
			this.nodes[i] = null
		}

	}
	this.split = function() {

		var subWidth,subHeight,x,y
			subWidth = this.bounds.width / 2
			subWidth = this.bounds.height / 2
			x = this.bounds.x
			y = this.bounds.y

		nodes[0] = new Quadtree(this.level+1, new Rectangle(x + subWidth, y, subWidth, subHeight) )
		nodes[1] = new Quadtree(this.level+1, new Rectangle(x, y, subWidth, subHeight) )
		nodes[2] = new Quadtree(this.level+1, new Rectangle(x, y + subHeight, subWidth, subHeight) )
		nodes[3] = new Quadtree(this.level+1, new Rectangle(x + subWidth, y + subHeight, subWidth, subHeight) )

	}
	this.getIndex = function(rect){

		var index,verticalMidPoint,horizontalMidPoint,topQuadrant,bottomQuadrant
			index = -1
			verticalMidPoint = this.bounds.x + this.bounds.width / 2
			horizontalMidPoint = this.bounds.y + this.bounds.height / 2
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
	this.insert = function(rect) {
		if (this.nodes[0] !== undefined) {

			var index = this.getIndex(rect)

			if (index !== -1) {
			
				this.nodes[index].insert(rect)

				return

			}

		}

		this.objects.add(rect)

		if (this.objects.length > this.MAX_OBJECTS && this.level < this.MAX_LEVELS) {

			if (this.nodes[0] === undefined) {

				this.split()

			}

			var i = 0

			while (i < this.objects.length) {
				
				var index = this.getIndex(this.objects[i])
				
				if (index != -1) {
					this.nodes[index].insert(this.objects.splice(i,1))
				} else {
					i++
				}

			}

		}
	}
	this.retrieve = function( returnObjects , rect ) {
		var index = this.getIndex(rect)
		if (index !== -1 && this.nodes[0] !== null) {
			this.nodes[index].retrieve( returnObjects , rect )
		}

		returnObjects.concat(this.objects)

		return returnObjects
	}
}

URNDR.Rectangle = function(x,y,w,h) {
	this.x = x
	this.y = y
	this.width = w
	this.height = h
}