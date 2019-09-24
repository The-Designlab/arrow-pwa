import React from 'react';
import defaultClasses from './column.css';
import { mergeClasses } from '../../../../../classify';
import { arrayOf, oneOf, shape, string, bool } from 'prop-types';

/**
 * Page Builder Column component.
 *
 * This component is part of the Page Builder / PWA integration. It can be consumed without Page Builder.
 *
 * @typedef Column
 * @kind functional component
 *
 * @param {props} props React component props
 *
 * @returns {React.Element} A React component that displays a Column.
 */
const Column = props => {
    const classes = mergeClasses(defaultClasses, props.classes);
    const {
        appearance,
        backgroundAttachment,
        backgroundColor,
        backgroundPosition,
        backgroundRepeat,
        backgroundSize,
        border,
        borderColor,
        borderRadius,
        borderWidth,
        children,
        cssClasses = [],
        desktopImage,
        marginBottom,
        marginLeft,
        marginRight,
        marginTop,
        minHeight,
        mobileImage,
        paddingBottom,
        paddingLeft,
        paddingRight,
        paddingTop,
        textAlign,
        verticalAlignment,
        width
    } = props;

    let image = desktopImage;
    if (mobileImage && window.matchMedia('(max-width: 768px)').matches) {
        image = mobileImage;
    }

    const flexDirection = 'column',
        display = 'flex';

    let alignSelf;

    switch (appearance) {
        case 'align-top':
            alignSelf = 'flex-start';
            break;
        case 'align-center':
            alignSelf = 'center';
            break;
        case 'align-bottom':
            alignSelf = 'flex-end';
            break;
        case 'full-height':
        default:
            alignSelf = 'stretch';
            break;
    }

    let justifyContent;

    switch (verticalAlignment) {
        case 'top':
        default:
            justifyContent = 'flex-start';
            break;
        case 'middle':
            justifyContent = 'center';
            break;
        case 'bottom':
            justifyContent = 'flex-end';
            break;
    }

    const dynamicStyles = {
        alignSelf,
        backgroundAttachment,
        backgroundColor,
        backgroundImage: image ? `url(${image})` : null,
        backgroundPosition,
        backgroundRepeat: backgroundRepeat ? 'repeat' : 'no-repeat',
        backgroundSize,
        border,
        borderColor,
        borderRadius,
        borderWidth,
        display,
        flexDirection,
        justifyContent,
        marginBottom,
        marginLeft,
        marginRight,
        marginTop,
        minHeight,
        paddingBottom,
        paddingLeft,
        paddingRight,
        paddingTop,
        textAlign,
        verticalAlignment,
        width
    };

    return (
        <div
            style={dynamicStyles}
            className={[classes.root, ...cssClasses].join(' ')}
        >
            {children}
        </div>
    );
};

/**
 * Props for {@link Column}
 *
 * @typedef props
 *
 * @property {String} appearance Converts to CSS align-self sub-property of the flexbox item
 * @property {String} backgroundAttachment CSS background-attachment property
 * @property {String} backgroundColor CSS background-color property
 * @property {String} backgroundPosition CSS background-position property
 * @property {Boolean} backgroundRepeat CSS background-repeat property
 * @property {String} backgroundSize CSS background-size property
 * @property {String} border CSS border property
 * @property {String} borderColor CSS border color property
 * @property {String} borderRadius CSS border radius property
 * @property {String} borderWidth CSS border width property
 * @property {Object} classes An object containing the class names for the Column
 * @property {String} classes.root CSS classes for the root container element
 * @property {Array} cssClasses List of CSS classes to be applied to the component
 * @property {String} desktopImage Background image url to be used for desktop screen width
 * @property {String} marginBottom CSS margin bottom property
 * @property {String} marginLeft CSS margin left property
 * @property {String} marginRight CSS margin right property
 * @property {String} marginTop CSS margin top property
 * @property {String} maxWidth Maximum width of the video
 * @property {String} minHeight - CSS min-height property
 * @property {String} mobileImage Background image url to be used for mobile screen width
 * @property {String} paddingBottom CSS padding bottom property
 * @property {String} paddingLeft CSS padding left property
 * @property {String} paddingRight CSS padding right property
 * @property {String} paddingTop CSS padding top property
 * @property {String} textAlign Horisontal alignment of the contents within the parent container
 * @property {String} verticalAlignment Vertical alignment of the contents within the parent container
 * @property {String} width CSS width property
 */
Column.propTypes = {
    appearance: oneOf([
        'align-top',
        'align-center',
        'align-bottom',
        'full-height'
    ]),
    backgroundAttachment: string,
    backgroundColor: string,
    backgroundPosition: string,
    backgroundRepeat: bool,
    backgroundSize: string,
    border: string,
    borderColor: string,
    borderRadius: string,
    borderWidth: string,
    classes: shape({
        root: string
    }),
    cssClasses: arrayOf(string),
    desktopImage: string,
    marginBottom: string,
    marginLeft: string,
    marginRight: string,
    marginTop: string,
    minHeight: string,
    mobileImage: string,
    paddingBottom: string,
    paddingRight: string,
    paddingTop: string,
    textAlign: string,
    verticalAlignment: oneOf(['top', 'middle', 'bottom']),
    width: string
};

export default Column;