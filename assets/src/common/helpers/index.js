/**
 * External dependencies
 */
import { get, includes, template } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { getColorObjectByAttributeValues, getColorObjectByColorValue } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { MINIMUM_FEATURED_IMAGE_WIDTH } from '../constants';

/**
 * Determines whether whether the image has the minimum required dimensions.
 *
 * The image should have a width of at least 1200 pixels to satisfy the requirements of Google Search for Schema.org metadata.
 *
 * For AMP Stories, the featured image will be used for the poster-portrait-src.
 * For this, it should have a width of at least 696px and a height of at least 928px.
 *
 * @param {Object} media             A media object with width and height values.
 * @param {number} media.width       Media width in pixels.
 * @param {number} media.height      Media height in pixels.
 * @param {Object} dimensions        An object with minimum required width and height values.
 * @param {number} dimensions.width  Required media width in pixels.
 * @param {number} dimensions.height Required media height in pixels.
 *
 * @return {boolean} Whether the media has the minimum dimensions.
 */
export const hasMinimumDimensions = ( media, dimensions ) => {
	if ( ! media || ! media.width || ! media.height ) {
		return false;
	}

	const { width, height } = dimensions;

	return ( media.width >= width && media.height >= height );
};

/**
 * Get minimum dimensions for a featured image.
 *
 * @link https://developers.google.com/search/docs/data-types/article#article_types
 *
 * "Images should be at least 1200 pixels wide.
 * For best results, provide multiple high-resolution images (minimum of 800,000 pixels when multiplying width and height)
 * with the following aspect ratios: 16x9, 4x3, and 1x1."
 *
 * Given this requirement, this function ensures the right aspect ratio.
 * The 16/9 aspect ratio is chosen because it has the smallest height for the given width.
 *
 * @return {Object} Minimum dimensions including width and height.
 */
export const getMinimumFeaturedImageDimensions = () => {
	const width = MINIMUM_FEATURED_IMAGE_WIDTH;

	const height = width * ( 9 / 16 );

	return { width, height };
};

/**
 * Get minimum dimensions for a portrait featured image, but not for an AMP Story.
 *
 * @return {Object} Minimum dimensions including width and height.
 */
export const getMinimumPortraitFeaturedImageDimensions = () => {
	const width = MINIMUM_FEATURED_IMAGE_WIDTH;

	const height = Math.floor( width * ( 16 / 9 ) );

	return { width, height };
};

/**
 * Validates the an image based on requirements.
 *
 * @param {Object}  media                      A media object.
 * @param {string}  media.mime_type            The media item's mime type.
 * @param {Object}  media.media_details        A media details object with width and height values.
 * @param {number}  media.media_details.width  Media width in pixels.
 * @param {number}  media.media_details.height Media height in pixels.
 * @param {Object}  dimensions                 An object with minimum required width and height values.
 * @param {boolean} required                   Whether the image is required or not.
 *
 * @return {string[]|null} Validation errors, or null if there were no errors.
 */
export const validateFeaturedImage = ( media, dimensions, required ) => {
	if ( ! media ) {
		if ( required ) {
			return [ __( 'Selecting a featured image is required.', 'amp' ) ];
		}

		return [ __( 'Selecting a featured image is recommended for an optimal user experience.', 'amp' ) ];
	}

	const errors = [];

	if ( ! [ 'image/png', 'image/gif', 'image/jpeg' ].includes( media.mime_type ) ) {
		errors.push(
			/* translators: 1: .jpg, 2: .png. 3: .gif */
			sprintf( __( 'The featured image must be in %1$s, %2$s, or %3$s format.', 'amp' ), '.jpg', '.png', '.gif' )
		);
	}

	if ( ! hasMinimumDimensions( media.media_details, dimensions ) ) {
		const { width, height } = dimensions;

		errors.push(
			/* translators: 1: minimum width, 2: minimum height. */
			sprintf( __( 'The featured image should have a size of at least %1$s by %2$s pixels.', 'amp' ), Math.ceil( width ), Math.ceil( height ) )
		);
	}

	return 0 === errors.length ? null : errors;
};

/**
 * Converts a hexadecimal color to its RGBA form.
 *
 * @param {string} hex     Hex value.
 * @param {number} opacity Opacity.
 *
 * @return {Object} Rgba value.
 */
export const getRgbaFromHex = ( hex, opacity = 100 ) => {
	if ( ! hex ) {
		return [];
	}

	hex = hex.replace( '#', '' );

	if ( hex.length === 3 ) {
		// If this is a 3 digit color, e.g. #f00, make it 6 digits by duplicating each one.
		hex = `${ hex.charAt( 0 ) }${ hex.charAt( 0 ) }${ hex.charAt( 1 ) }${ hex.charAt( 1 ) }${ hex.charAt( 2 ) }${ hex.charAt( 2 ) }`;
	}

	const r = parseInt( hex.substring( 0, 2 ), 16 );
	const g = parseInt( hex.substring( 2, 4 ), 16 );
	const b = parseInt( hex.substring( 4, 6 ), 16 );

	// Opacity needs to be in the range of 0-100.
	opacity = Math.min( 100, Math.max( 0, opacity ) );

	return [
		r,
		g,
		b,
		opacity / 100,
	];
};

/**
 * Returns a CSS background-color property based on passed color and available colors.
 *
 * Either backgroundColor or customBackgroundColor should be passed, not both.
 *
 * @param {Object[]} colors                Array of color objects as set by the theme or by the editor defaults.
 * @param {?Object}  backgroundColor       Color object.
 * @param {?string}  backgroundColor.name  Color name.
 * @param {?string}  backgroundColor.slug  Color slug.
 * @param {?string}  backgroundColor.color Color value.
 * @param {?string}  customBackgroundColor A string containing the custom color value.
 * @param {?number}  opacity               Opacity.
 *
 * @return {?string} Background color string or undefined if no color has been set / found.
 */
export const getBackgroundColorWithOpacity = ( colors, backgroundColor, customBackgroundColor, opacity = undefined ) => {
	// Order: 1. Existing colors as set by the theme. 2. Custom color objects. 3. Custom background color.
	const colorObject = backgroundColor ?
		( getColorObjectByColorValue( colors, backgroundColor.color ) || getColorObjectByAttributeValues( colors, backgroundColor.slug, backgroundColor.color || customBackgroundColor ) ) :
		{ color: customBackgroundColor };

	if ( colorObject && colorObject.color ) {
		const [ r, g, b, a ] = getRgbaFromHex( colorObject.color, opacity );

		return `rgba(${ r }, ${ g }, ${ b }, ${ a })`;
	}

	return undefined;
};

/**
 * Gets The aspect ratio type, either 'landscape', 'portrait', or 'square'.
 *
 * @param {number} width  The image width.
 * @param {number} height The image height.
 * @return {string|null} The aspect ratio type: 'landscape', 'portrait', or 'square'.
 */
export const getAspectRatioType = ( width, height ) => {
	if ( ! width || ! height ) {
		return null;
	}

	if ( width > height ) {
		return 'landscape';
	} else if ( height > width ) {
		return 'portrait';
	} else if ( height === width ) {
		return 'square';
	}
};

/**
 * Gets the compiled template for a given notice message.
 *
 * @param {string} message The message to display in the template.
 * @return {Function} compiledTemplate A function accepting the data, which creates a compiled template.
 */
export const getNoticeTemplate = ( message ) => {
	const errorTemplate = template(
		`<p>${ message }</p>`,
		{
			evaluate: /<#([\s\S]+?)#>/g,
			interpolate: /\{\{\{([\s\S]+?)\}\}\}/g,
			escape: /\{\{([^\}]+?)\}\}(?!\})/g,
		}
	);

	return ( data ) => {
		return errorTemplate( data );
	};
};

/**
 * Gets whether the file type is allowed.
 *
 * For videos, only 'video/mp4' mime types should be allowed.
 * But the allowedTypes property only has 'video', and it can accidentally allow mime types like 'video/quicktime'.
 * So this returns false for videos with mime types other than 'video/mp4'.
 *
 * @param {Object} attachment   The file to evaluate.
 * @param {Array}  allowedTypes The allowed file types.
 * @return {boolean} Whether the file type is allowed.
 */
export const isFileTypeAllowed = ( attachment, allowedTypes ) => {
	const fileType = attachment.get( 'type' );
	const mimeType = attachment.get( 'mime' );

	if ( ! includes( allowedTypes, fileType ) && ! includes( allowedTypes, mimeType ) ) {
		return false;
	}

	if ( 'video' === fileType && 'video/mp4' !== mimeType ) {
		return false;
	}

	return true;
};

/**
 * If the attachment has the wrong file type, this displays a notice in the Media Library and disables the 'Select' button.
 *
 * This is not an arrow function so that it can be called with enforceFileType.call( this, foo, bar ).
 *
 * @param {Object} attachment The selected attachment.
 * @param {Object} SelectionError The error to display.
 */
export const enforceFileType = function( attachment, SelectionError ) {
	if ( ! attachment ) {
		return;
	}

	const fileTypeError = 'select-file-type-error';
	const allowedTypes = get( this, [ 'options', 'allowedTypes' ], null );
	const selectButton = this.get( 'select' );

	// If the file type isn't allowed, display a notice and disable the 'Select' button.
	if ( allowedTypes && attachment.get( 'type' ) && ! isFileTypeAllowed( attachment, allowedTypes ) ) {
		this.secondary.set(
			fileTypeError,
			new SelectionError( { mimeType: attachment.get( 'mime' ) } )
		);
		if ( selectButton && selectButton.model ) {
			selectButton.model.set( 'disabled', true ); // Disable the button to select the file.
		}
	} else {
		this.secondary.unset( fileTypeError );
		if ( selectButton && selectButton.model ) {
			selectButton.model.set( 'disabled', false ); // Enable the button to select the file.
		}
	}
};
