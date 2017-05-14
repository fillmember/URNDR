import UIBuilder from './UIBuilder'

class UIManager {

	constructor (containerElement) {

		containerElement.innerHTML = ''

		this.build = new UIBuilder( this , containerElement )

		this.map = {}
		this.uiElements = []
		this.watchList = []

	}

	//
	// watch
	//
	// update ui when target's property has changed
	//
	watch ( ui ) { this.watchList.push(ui) }

	update () {

		this.watchList.forEach((item)=>{item.update()})

	}

}

export {UIManager}
