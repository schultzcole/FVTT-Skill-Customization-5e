import { createElement } from "./utils.mjs";

Hooks.on("renderActorSheet", injectSkillInputs);

/**
 * @param actorSheet {ActorSheet} The ActorSheet instance being rendered
 * @param $html {jQuery} The inner HTML of the document that will be displayed and may be modified
 * @param _data {any} The object of data used when rendering the application
 */
function injectSkillInputs(actorSheet, $html, _data) {
  /** @type {HTMLElement} */
  // extract ActorSheet HTML and add our CSS class to the skills-list
  const html = $html[0];
  html.querySelector(".skills-list").classList.add("skill-customize");

  const isTidy5e = actorSheet.constructor.name === "Tidy5eSheet";

  const actor = actorSheet.actor;

  for (const skillElem of html.querySelectorAll(".skills-list .skill")) {
    // each skillElem is an HTMLElement with data-* attributes that define the skill in question
    // `data-key` defines the skill shortname (e.g. "ath" for athletics)
    const skillKey = isTidy5e ?
        skillElem.dataset.skill :
        skillElem.dataset.key;

    // find the _current_ ability associated with the skill
    const abilityPropertyPath = `system.skills.${skillKey}.ability`;
    const selectedAbility = foundry.utils.getProperty(
      actor,
      abilityPropertyPath
    );

    // find the _original_ ability associated with the skill
    const origAbility = foundry.utils.getProperty(
      CONFIG.DND5E,
      `skills.${skillKey}.ability`
    );

    // create the dropdown options for each ability and mark the current active one
    const abilSelectorElement = createElement("select", {
      classes: ["skill-ability-select"],
      attrs: { name: abilityPropertyPath },
    });
    const options = [];
    for (const abilityKey of Object.keys(actor.system.abilities)) {
      // get localized shorthand name for each ability (for label)
      const abilityString = game.i18n
        .localize(`DND5E.Ability${abilityKey.titleCase()}`)
        .slice(0, 3);

      const selected = abilityKey === selectedAbility ? true : undefined;
      const option = createElement("option", {
        text: abilityString,
        attrs: { value: abilityKey, selected },
      });

      // flag the _original_ option so it is rendered in a different colour
      if (abilityKey === origAbility) {
        option.classList.add("skill-ability-select-orig");
      }

      options.push(option);
    }
    abilSelectorElement.append(...options);

    // create text box for situational bonus
    const skillPropertyPath = `system.skills.${skillKey}.bonuses.check`;
    const textBoxElement = createElement("input", {
      classes: ["skill-check-bonus"],
      attrs: {
        name: skillPropertyPath,
        type: "text",
        placeholder: "-",
        value: foundry.utils.getProperty(actor, skillPropertyPath),
      },
      events: {
        click: (evt) => evt.currentTarget.select(),
      },
    });

    // add these new elements after the normal ability label
    const skillAbilityElement = skillElem.querySelector(".skill-ability");
    skillAbilityElement.after(abilSelectorElement, textBoxElement);

    // remove the normal ability label
    skillAbilityElement.remove();
    // remove the hidden input that normally defines the ability to use
    // this will make it use the select element instead
    skillElem.querySelector(`input[name='${abilityPropertyPath}']`).remove();
  }
}
