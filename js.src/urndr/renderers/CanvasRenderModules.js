import {BaseModule,UIMessage} from 'urndr'

export const LegacyRenderer = ({strokes, threeManager, style}) => {
	var module = new BaseModule("Render",BaseModule.DRAW_MODULE,902,true);
	module.interval = 20;
	module.data = {
		encoder: null,
		exporting: false,
		renderedFrames: 0,
		totalFrames: 0
	}
	module.EVENT_EXPORTED = 'exported'
	module.setConfiguration( {
		// Mode
		gradient: false,
		outline: false,
		// Misc
		selectedColor : '#FF0',
		hoveredColor : '#FFF',
		// GIF Maker
		showModel: true,
		frameEvery: 2
	} )
	module.helpers = {
		rgba: (r,g,b,a) => {return 'rgba('+r+','+g+','+b+','+a+')'},
		gradient: (ctx,p1,p2,factor) => {
        const grad = ctx.createLinearGradient( p1.X , p1.Y , p2.X , p2.Y );
        grad.addColorStop(0, module.helpers.rgba(p1.R,p1.G,p1.B,p1.A * factor) )
        grad.addColorStop(1, module.helpers.rgba(p2.R,p2.G,p2.B,p2.A * factor) )
        return grad
    },
		stroke_basic: function( ctx , p0 , p1 , lineWidth , strokeStyle ) {
			ctx.beginPath()
			ctx.strokeStyle = strokeStyle
			ctx.lineWidth = lineWidth
			ctx.moveTo( p0.X , p0.Y )
			ctx.lineTo( p1.X , p1.Y )
			ctx.stroke()
		},
		getAlphaFactor: function( pnt, stk, i ){

			if (pnt.OBJECT && pnt.FACE) {

				return threeManager.camera.checkVisibility( pnt.OBJECT , pnt.FACE );

			} else {

				const nearests = stk.getNearestPointWith("FACE",i);

				if (nearests !== 0) {

					const before_present = nearests.before != 0
					const after_present = nearests.after != 0

					let vis_before = 1
					let vis_after = 1

					if (before_present) {
						vis_before = threeManager.camera.checkVisibility(
							nearests.before.OBJECT , nearests.before.FACE
						)
					}
					if (after_present) {
						vis_after = threeManager.camera.checkVisibility(
							nearests.after.OBJECT , nearests.after.FACE
						)
					}

					if (before_present && after_present) {

						return (
							(
								vis_before * nearests.after_distance +
								vis_after * nearests.before_distance
							) / (
								nearests.after_distance +
								nearests.before_distance
							)
						)

					} else if (before_present || after_present) {

						return before_present ? vis_before : vis_after;

					}

				}

			}

			// The rest of the cases: stroke is totally without any binding.

			return 1
		},
		stroke_outline: function( ctx, prv, pnt, factor ){
			if(module.settings.outline && pnt.A * factor > 0.1) {
				ctx.save();
				ctx.globalCompositeOperation = 'destination-over';
				module.helpers.stroke_basic(ctx, prv, pnt, pnt.S + 15, "#FFF");
				ctx.restore();
			}
		},
		// General Export Setups
		finishExport: function( module ){

			// Finish GIF stream;
			module.data.encoder.finish();
			module.emitter.emit(module.EVENT_EXPORTED,module.data.encoder)

			// Emit UI Message
			const uimessage = new UIMessage()
			uimessage.title = 'GIF Made'
			uimessage.body = '100%'
			module.emitter.emit(BaseModule.UI_MESSAGE,uimessage)

			// Reset
			module.data.encoder = null;
			module.data.exporting = false;
			module.data.renderedFrames = 0;
			module.data.totalFrames = 0;

		}
	}
	module.setFunction(function(params){

		const settings = this.settings
		const stroke_basic = this.helpers.stroke_basic
		const getAlphaFactor = this.helpers.getAlphaFactor
		const _outline = this.helpers.stroke_outline

		const strokes = params.strokes
		const canvases = params.canvasManager
		const ctx = canvases.get("draw").context
		const hudCtx = canvases.get("hud").context

		canvases.clear(1)

		var frame_this = (module.data.renderedFrames % module.data.frameEvery === 0)

		//
		// PRE-RENDER PROCESSES
		//
		// #1 : EXPORTER
		//
		if (module.data.exporting) {

			if ( frame_this ) {

				if (settings.showModel) {
					// RENDER : COPY 3D image
					ctx.drawImage( threeManager.renderer.domElement , 0 , 0 )
				} else {
					// RENDER : FILL CLEAR COLOR
					ctx.fillStyle = '#00F'
					ctx.fillRect( 0 , 0 , canvases.width , canvases.height )
				}
			}

		}

		// RENDER
		if ( ! module.data.exporting || module.data.exporting && frame_this ) {

			strokes.eachStroke( (stk) => {

				stk.eachPoint( ( pnt, stk, i ) => {
					const prv = stk.getPoint( i - 1 );
					if (prv !== 0) {
						const factor = getAlphaFactor(pnt,stk,i);
						if (factor > 0) {
							_outline( ctx, prv, pnt, factor )
							stroke_basic(ctx, prv, pnt, pnt.S,
								module.settings.gradient ?
									module.helpers.gradient(ctx,prv,pnt,factor) :
									module.helpers.rgba(pnt.R,pnt.G,pnt.B,pnt.A * factor)
							)
						}
					}
				} , stk)

				if (stk.selected) {
					const pnt = stk.getPoint(0);
					hudCtx.strokeStyle = module.settings.selectedColor
					hudCtx.beginPath()
					hudCtx.moveTo( pnt.X , pnt.Y )
					stk.eachPoint( (pnt) => {
						hudCtx.lineTo( pnt.X , pnt.Y )
						hudCtx.strokeRect( pnt.X - 4 , pnt.Y - 4 , 8, 8);
					} )
					hudCtx.stroke();

				} else if ( stk.hovered ) {

					hudCtx.strokeStyle = module.settings.hoveredColor
					stk.eachPoint( (pnt) => {
						hudCtx.strokeRect( pnt.X - 5 , pnt.Y - 5 , 10, 10);
					})

				}

				if (stk.closed) {

					const prv = stk.points[ 0 ]
					const pnt = stk.points[ stk.length - 1 ]
					const factor = getAlphaFactor(pnt,stk,0)

					_outline( ctx, prv, pnt, factor );
					stroke_basic(ctx, pnt, prv, pnt.S, rgba(pnt.R,pnt.G,pnt.B,pnt.A * factor) );

				}
			} )

		}

		// POST-RENDER PROCESSES
		// #1 : EXPORTER
		if (module.data.exporting) {

			// RENDER
			if (module.data.renderedFrames < module.data.totalFrames) {

				if ( frame_this ) { module.data.encoder.addFrame( ctx ) }

				const uimsg = new UIMessage()
				uimsg.title = 'Making GIF'
				uimsg.body = `${Math.round( 100 * module.data.renderedFrames / module.data.totalFrames )}%`
				this.emitter.emit(BaseModule.UI_MESSAGE,uimsg)

				module.data.renderedFrames += 1;

			} else {

				// ALL FRAMES EXPORTED
				this.helpers.finishExport( this );

			}

		}

	})
	return module
}
