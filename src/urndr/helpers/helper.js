import ColorHelper from './ColorHelper'

export default {

    Color : ColorHelper,

    randomizeArray : function(arr , amp) {
        if (!amp) {amp = 10;}
        var half = amp * 0.5;
        for ( var i = 0, l = arr.length; i < l; i ++ ) {
            arr[i] += half - Math.random() * amp
        }
        return arr
    }


}
