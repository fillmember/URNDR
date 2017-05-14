import {
  BaseModule , _Math , Helpers
} from 'urndr.js'

export const SetRandomColorScheme = ({strokes,style,threeManager}) => {
	var module = new BaseModule("Color Change",BaseModule.COMMAND_MODULE,191)
	const _rgb = ( input ) => { return "rgb("+input.join(',')+")" }
	const _subtleVariation = (v) => {
		const b = 30
		const bh = b * 0.5
		return Math.round(v + Math.random() * b - bh)
	};
	module.setFunction(function( evt ){

		let _hue = Math.random();
		let _sat = Math.random();
		if (_sat < 0.2) { _sat = 0; }

		const primary = Helpers.Color.hslToRgb( _hue , _sat , 0.5 );
		const contrast = Helpers.Color.hslToRgb( (_hue + 0.5) % 1 , (_sat + 0.5) % 1 , 0.5 );
		const dark = Helpers.Color.hslToRgb( _hue , _sat * 0.80 , 0.2 );
		const pale = Helpers.Color.hslToRgb( _hue - 0.075 , _sat * 0.80 , 0.6 );

		strokes.eachStroke( ( stk ) => {
			stk.eachPoint( ( pnt ) => {
				pnt.R = _subtleVariation(contrast[0])
				pnt.G = _subtleVariation(contrast[1])
				pnt.B = _subtleVariation(contrast[2])
			}, stk)
			stk.tags = {};
		})

		style.color[0] = contrast[0]
		style.color[1] = contrast[1]
		style.color[2] = contrast[2]
		const primaryRGB = _rgb(primary)
		const contrastRGB = _rgb(contrast)

		threeManager.setColor({
			material : _rgb(pale),
			renderer : primaryRGB,
			fog : primaryRGB
		})

	})
	return module;
}
