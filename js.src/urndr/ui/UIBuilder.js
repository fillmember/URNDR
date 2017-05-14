import MathUtil from './../math/math.js'
import {TweenLite} from 'gsap'

export default class UIBuilder {

	constructor (_manager, _root) {

		this.manager = _manager
		this.root = _root
		//
		// Pointers for startSection / endSection
		//
		this.stack = [_root]

	}

	updateInnerHTML (t,p) { this.innerHTML = t[p] }
	updateChecked (t,p) { this.checked = t[p] }
	updateValue (t,p) { this.value = t[p] }

	get currentContainer () {
		return this.stack[this.stack.length - 1]
	}

	createElement(tagName,attributes) {
		const element = this.htmlGlobalAttributes(
			document.createElement(tagName) , attributes
		)
		this.manager.uiElements.push(element)
		return element
	}

	htmlGlobalAttributes (element,obj={}) {

		if (obj.id) {element.id = obj.id}
		if (obj.class) {element.className = obj.class}
		if (obj.style) {element.style = obj.style}
		if (obj.title) {element.title = obj.title}
		if (obj.role) {element.role = obj.role}

		return element

	}

	display ({target, property, title = property, icon}) {
		const display = this.createElement(`div`,{
			class:`display` + (arguments[0].class ? ` ${arguments[0].class}` : ``)
		})
		const label = this.createElement(`label`)
		label.innerHTML = title
		const output = this.createElement(`output`)
		output.innerHTML = target[property]
		display.append(label)
		display.append(output)
		this.currentContainer.append(display)
		display.update = this.updateInnerHTML.bind(output,target,property)
		return display
	}

	checkbox ({target, property, title = property, icon}) {

		const _id = MathUtil.uuid() + '-' + property

		const wrapper = this.createElement('div',{
			class : `checkbox-container` + (arguments[0].class ? ` ${arguments[0].class}` : ``)
		})
		const label = this.createElement('label')
		label.htmlFor = _id
		label.innerHTML = title
		if (icon) label.prepend(this.icon(icon))
		const input = this.createElement('input',{id:_id})
		input.type = 'checkbox'
		input.checked = target[property]

		input.addEventListener('change',()=>{
			target[property] = input.checked
		})

		wrapper.append(input)
		wrapper.append(label)
		this.currentContainer.append(wrapper)

		wrapper.update = this.updateChecked.bind(input,target,property)
		return wrapper

	}

	icon (icon_class) {
		const i = this.createElement('i')
		i.className = icon_class
		return i
	}

	header ({title}) {
		const header = this.createElement('h3')
		header.innerHTML = title
		this.currentContainer.append(header)
		return header
	}

	button ({
		title = '',
		icon,
		click
	}) {

		const btn = this.createElement('button',arguments[0])
		btn.innerHTML = title
		if (icon) btn.prepend(this.icon(icon))

		if (click) btn.addEventListener('click',click)

		this.currentContainer.append(btn)

		btn.update = () => {console.log('mi?')}

		return btn

	}

	slider ({
		target,
		property,
		title = property,
		icon,
		min,
		max,
		step,
		value = target[property]
	}) {

		const wrapper = this.createElement('div',{class:`slider-container`})

		const _id = `${MathUtil.uuid()}-${property}`

		const label = this.createElement(`label`)
		label.htmlFor = _id
		label.innerHTML = title
		if (icon) label.prepend(this.icon(icon))
		const output = this.createElement(`output`)
		output.htmlFor = _id
		output.innerHTML = target[property]
		const slider = this.createElement('input',{id:_id})
		slider.type = 'range'
		slider.value = value
		if (min) slider.min = min
		if (max) slider.max = max
		if (step) slider.step = step

		const toggleLabel = (bool,t=0.1) => {
			TweenLite.to( label, 0.1, {
				autoAlpha:bool?1:0,
				x:bool?0:-5,
				scale:bool?1:0.8,
				ease:Power2.easeInOut
			})
			TweenLite.to( output, 0.1, {
				autoAlpha:bool?0:1,
				x:bool?-5:0,
				scale:bool?0.8:1,
				ease:Power2.easeInOut
			})
		}
		slider.addEventListener('mouseup',()=>toggleLabel(true))
		slider.addEventListener('mousedown',()=>toggleLabel(false))
		toggleLabel(true)
		slider.addEventListener('input',() => {
			target[property] = parseFloat(slider.value)
		})
		slider.addEventListener('input',() => {
			output.innerHTML = parseFloat(slider.value)
		})

		wrapper.append(label)
		wrapper.append(slider)
		wrapper.append(output)
		this.currentContainer.append(wrapper)

		wrapper.update = this.updateValue.bind(slider,target,property)
		return wrapper

	}

	startSection (options={}) {

		const section = this.createElement('section',options)
		this.currentContainer.append(section)

		this.stack.push(section)

		return section

	}

	endSection () {

		this.stack.pop()

		return this.currentContainer

	}

	colorPicker () {

	}

}
