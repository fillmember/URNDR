import Vue from 'vue'
import Vuex from 'vuex'
import createLogger from 'vuex/src/plugins/logger.js'

Vue.use(Vuex)

const state = {
	visibleUI : true
}

// update state obj
const mutations = {

}

// Side-effect & Async operations
const actions = {

}

const getters = {

}

export default new Vuex.Store({
	state,
	getters,
	actions,
	mutations,
	plugins: process.env.NODE_ENV !== 'production'
	  ? [createLogger()]
	  : []
})
