/**
 * @param {string} tag
 * @param {string|null} text
 * @param {string[]} classes
 * @param {object} attrs
 * @param {object} events
 * @returns {HTMLElement}
 */
export function createElement(tag, { text = null, classes = null, attrs = {}, events = {} } = {}) {
    const element = document.createElement(tag);
    if ( text ) element.append(document.createTextNode(text));
    if ( classes?.length > 0 ) element.classList.add(...classes);

    for ( const [ attrKey, attrVal ] of Object.entries(attrs) ) {
        if (attrVal !== undefined) element[attrKey] = attrVal;
    }

    for ( const [ eventName, eventHandler ] of Object.entries(events) ) {
        if (typeof eventHandler === "function") element.addEventListener(eventName, eventHandler);
    }

    return element;
}
