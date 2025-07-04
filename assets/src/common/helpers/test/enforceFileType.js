/**
 * Internal dependencies
 */
import { enforceFileType } from '../';
import { Mock, AlternateMock, MockSelectionError } from './fixtures/mockClasses';

const videoAllowedTypes = [ 'video' ];
const imageAllowedTypes = [ 'image' ];
const fileTypeError = 'select-file-type-error';

/**
 * Gets an instance of Mock to pass as the this argument to call().
 *
 * @param {Array} allowedTypes The allowed file types.
 * @return {Mock} An instance of Mock.
 */
const getMockThis = ( allowedTypes ) => {
	const mockThis = new Mock();
	mockThis.set( {
		secondary: new AlternateMock(),
		options: { allowedTypes },
	} );

	return mockThis;
};

describe( 'enforceFileType', () => {
	it( 'should have a new error and disable the button when the mimeType is video/quicktime', () => {
		const mockThis = getMockThis( videoAllowedTypes );
		const attachment = new Mock();
		const mimeType = 'video/quicktime';
		const selectButton = { model: new AlternateMock() };
		mockThis.set( { select: selectButton } );
		attachment.set( { type: 'video', mime: mimeType } );

		enforceFileType.call( mockThis, attachment, MockSelectionError );
		const actualSelectionError = mockThis.secondary.get( fileTypeError );

		expect( actualSelectionError.get( 'mimeType' ) ).toBe( mimeType );
		expect( selectButton.model.get( 'disabled' ) ).toBe( true );
	} );

	it( 'should have a new error and disable the button when the file type is text', () => {
		const mockThis = getMockThis( videoAllowedTypes );
		const attachment = new Mock();
		const mimeType = 'text/plain';
		const selectButton = { model: new AlternateMock() };
		mockThis.set( { select: selectButton } );
		attachment.set( { type: 'text', mime: mimeType } );

		enforceFileType.call( mockThis, attachment, MockSelectionError );
		const actualSelectionError = mockThis.secondary.get( fileTypeError );

		expect( actualSelectionError.get( 'mimeType' ) ).toBe( mimeType );
		expect( selectButton.model.get( 'disabled' ) ).toBe( true );
	} );

	it( 'should not have an error or disable the button when the mimeType is video/mp4', () => {
		const mockThis = getMockThis( videoAllowedTypes );
		const attachment = new Mock();
		const correctMimeType = 'video/mp4';
		const selectButton = { model: new AlternateMock() };
		mockThis.set( { select: selectButton } );
		attachment.set( { type: 'video', mime: correctMimeType } );

		enforceFileType.call( mockThis, attachment, MockSelectionError );

		expect( mockThis.secondary.get( fileTypeError ) ).toBe( undefined );
		expect( selectButton.model.get( 'disabled' ) ).toBe( false );
	} );

	it( 'should not have an error or disable the button when type is an image and that is allowed', () => {
		const mockThis = getMockThis( imageAllowedTypes );
		const attachment = new Mock();
		const selectButton = { model: new AlternateMock() };
		mockThis.set( { select: selectButton } );
		attachment.set( { type: 'image' } );

		enforceFileType.call( mockThis, attachment, MockSelectionError );

		expect( mockThis.secondary.get( fileTypeError ) ).toBe( undefined );
		expect( selectButton.model.get( 'disabled' ) ).toBe( false );
	} );
} );
