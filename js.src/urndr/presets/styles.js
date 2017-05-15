import BaseModule from './../BaseModule'

export const RandomStrokeColor = () => {
	const module = new BaseModule("Random Stroke Color",BaseModule.STYLE_MODULE,65);
	module.interval = 70;
	module.setFunction(function(style) {
		style.color[0] = Math.round( Math.random() * 255);
		style.color[1] = Math.round( Math.random() * 255);
		style.color[2] = Math.round( Math.random() * 255);
	})
	return module
}

export const ColorVariation = () => {
	var module = new BaseModule("Color Variation",BaseModule.STYLE_MODULE,9999,true);
	module.interval = 80;
	module.setConfiguration({
		amount : 25
	})
	const _f = (v,b = 8,bh = b * 0.5) => {
		return Math.round(v + Math.random() * b - bh)
	};
	module.setFunction(function(style) {
		const b = module.getConfiguration().amount;
		const bh = b * 0.5;
		style.color[0] = _f(style.color[0],b,bh);
		style.color[1] = _f(style.color[1],b,bh);
		style.color[2] = _f(style.color[2],b,bh);
	})
	return module
}
