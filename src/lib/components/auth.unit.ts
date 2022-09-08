const { expect: untypedExpect } = await import('@esm-bundle' + '/chai');
export const expect: typeof import('chai').expect = untypedExpect;

import { auth, error, signed_in, signed_out, unknown, waiting } from './auth';
import { describe, it } from 'vitest';

describe('auth', () => {
	it('waiting message is initialized correctly', () => {
		const nextState = auth({}, waiting());
		expect(nextState.authMessage).to.equal('Waiting...');
		expect(nextState.signedIn).to.equal(false);
	});

	it('has a good unknown message', () => {
		const nextState = auth({}, unknown());
		expect(nextState.authMessage).to.equal('Unknown sign in state');
		expect(nextState.signedIn).to.equal(false);
	});

	it('records error messages', () => {
		const hello = 'hello, world.';
		const nextState = auth({}, error(hello));
		expect(nextState.authMessage).to.equal(hello);
	});

	it('can set all fields on sign in', () => {
		const authMe: AuthState = {
			name: 'Alex Testerville',
			email: 'alextester@evil.com',
			photo: 'http://bit.ly/evilguy.jpg',
			signedIn: false,
			authMessage: ''
		};
		const nextState = auth({}, signed_in(authMe));
		expect(nextState.name).to.equal(authMe.name);
		expect(nextState.email).to.equal(authMe.email);
		expect(nextState.photo).to.equal(authMe.photo);
		expect(nextState.signedIn).to.be.true;
		expect(nextState.authMessage).to.equal('');
	});

	it('will reset all fields on sign out', () => {
		const authMe: AuthState = {
			name: 'Alex Testerville',
			email: 'alextester@evil.com',
			photo: 'http://bit.ly/evilguy.jpg',
			signedIn: false,
			authMessage: ''
		};
		let nextState = auth({}, signed_in(authMe));
		expect(nextState.name).to.equal(authMe.name);
		nextState = auth({}, signed_out());
		expect(nextState.name).to.be.undefined;
		expect(nextState.email).to.be.undefined;
		expect(nextState.photo).to.be.undefined;
		expect(nextState.signedIn).to.be.false;
		expect(nextState.authMessage).to.equal('Signed out.');
	});
});
