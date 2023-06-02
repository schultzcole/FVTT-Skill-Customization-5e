/**
 * Create an HTML element and set a number of options as a single function call.
 *
 * @param {string} tag element tag to create (e.g. div)
 * @param {string|null} text contained text of element
 * @param {string[]} classes CSS classes of element
 * @param {object} attrs HTML attributes on element
 * @param {object} events event handlers for element
 *
 * @returns {HTMLElement}
 */
export function createElement(
  tag,
  { text = null, classes = null, attrs = {}, events = {} } = {}
) {
  const element = document.createElement(tag);

  // add element text
  if (text) element.append(document.createTextNode(text));

  // add element css classes
  if (classes?.length > 0) element.classList.add(...classes);

  // add element attributes (name, id, etc)
  for (const [attrKey, attrVal] of Object.entries(attrs)) {
    if (attrVal !== undefined) element[attrKey] = attrVal;
  }

  // add element event handlers
  for (const [eventName, eventHandler] of Object.entries(events)) {
    if (typeof eventHandler === "function")
      element.addEventListener(eventName, eventHandler);
  }

  return element;
}
