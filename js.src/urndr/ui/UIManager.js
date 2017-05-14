import UIBuilder from './UIBuilder'

class UIManager {

	constructor (containerElement) {

		containerElement.innerHTML = ''

		this.build = new UIBuilder( this , containerElement )


		this.watchList = []

	}

	//
	// watch
	//
	// update ui when target's property has changed
	//
	// watch ( ui , target , property ) {
	// 	this.watchList.push([ui,target,property])
	// }

	update () {

		// watchList.forEach((item)=>{
		// 	[ui,target,property] = item
		// 	const value = target[property]
		// })

	}

}

export {UIManager}
