//import { combineReducers, configureStore, createStore } from '@reduxjs/toolkit';
import * as toolkitRaw from '@reduxjs/toolkit';
const { combineReducers, configureStore, createStore } = ((toolkitRaw as any).default ?? toolkitRaw) as typeof toolkitRaw;
import { auth } from './components/auth';
import { cubes } from '$lib/components/cubes';
import { nav } from '$lib/components/nav';

function svelteStoreEnhancer(createStoreApi: (arg0: any, arg1: any) => any) {
	return function (reducer: any, initialState: any) {
		const reduxStore = createStoreApi(
			reducer, initialState
		);
		return {
			...reduxStore,
			subscribe(fn: (arg0: any) => void) {
				fn(reduxStore.getState());

				return reduxStore.subscribe(() => {
					fn(reduxStore.getState());
				});
			}
		}
	}
}

const reducer = {
    auth,
    cubes,
    nav,
}
export const store = configureStore({ reducer, enhancers: [svelteStoreEnhancer] });
