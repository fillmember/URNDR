export default class UIBuilder {

	constructor (_manager, _root) {

		this.manager = _manager
		this.root = _root
		//
		// Pointers for startSection / endSection
		//
		this.previousContainer = _root
		this.currentContainer = _root

	}

	checkbox () {

	}

	label () {

	}

	icon (icon_class) {
		const i = document.createElement('i')
		i.className = icon_class
		return i
	}

	button ({
		className = '',
		text = '',
		icon,
		click = () => {}
	}) {

		const btn = document.createElement('button')
		btn.className = className
		btn.innerHTML = text
		if (icon) btn.prepend(this.icon(icon,text))

		btn.addEventListener('click',click)

		this.currentContainer.append(btn)

		return btn

	}

	slider ({
		target,
		property,
		min,
		max,
		value = target[property]
	}) {

		const slider = document.createElement('input')
		slider.type = 'range'
		slider.value = value
		slider.min = min
		slider.max = max
		slider.addEventListener('input',() => {
			target[property] = parseFloat(slider.value)
		})
		this.currentContainer.append(slider)

		return slider

	}

	startSection (options={}) {

		const section = document.createElement('div')
		if (options.class) section.className = options.class

		this.currentContainer.append(section)

		this.previousContainer = this.currentContainer
		this.currentContainer = section

		return section

	}

	endSection () {

		this.currentContainer = this.previousContainer

		return this.currentContainer

	}

	colorPicker () {

	}

}
