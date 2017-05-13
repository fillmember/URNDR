import {
  BaseModule , _Math
} from 'urndr.js'

export const RandomPointPosition = () => {
	const module = new BaseModule("Random Point Position",BaseModule.POINT_MODULE,68);
	module.interval = 30
	module.setConfiguration({amp:60})
	module.setFunction((point)=>{
		const amp = module.getConfiguration().amp
		const half = amp * 0.5
		point.X += half - _Math.random(amp);
    point.Y += half - _Math.random(amp);
    // also mess with barycentric coordinate.
    if (point.BU || point.BV || point.BW) {
      point.BU += 0.2 - 0.4 * _Math.random(1)
      point.BV += 0.2 - 0.4 * _Math.random(1)
      point.BW += 0.2 - 0.4 * _Math.random(1)
    }
	})
	return module
}

export const PointPressureSensitivity = ({pen}) => {
	const module = new BaseModule("Point Pressure Sensitivity",BaseModule.POINT_MODULE,9001,true)
	module.interval = 1;
  module.setConfiguration({
    min_size : 5,
    max_size : 80
  })
  module.setFunction(function(point) {
    const settings = this.getConfiguration()
    point.S *= pen.pressure;
    if (point.S < settings.min_size) point.S = settings.min_size;
    if (point.s > settings.max_size) point.S = settings.max_size;
  })
  return module
}
