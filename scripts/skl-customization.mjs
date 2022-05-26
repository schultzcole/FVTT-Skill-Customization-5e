import { createElement } from "./utils.mjs";

Hooks.on("renderActorSheet", injectSkillInputs);

/**
 * @param app {ActorSheet}
 * @param $html {jQuery}
 * @param _
 */
function injectSkillInputs(app, $html, _) {
    /** @type {HTMLElement} */
    const html = $html[0];
    html.querySelector(".skills-list").classList.add("skill-customize");

    const actor = app.actor;

    for (const skillElem of html.querySelectorAll(".skills-list .skill")) {
        const skillKey = skillElem.dataset.skill;
        const abilityPropertyPath = `data.skills.${skillKey}.ability`
        const selectedAbility = foundry.utils.getProperty(actor.data, abilityPropertyPath);

        const selectElement = createElement("select", {
            classes: ["skill-ability-select"],
            attrs: { name: abilityPropertyPath },
        });
        const options = [];
        for ( const abilityKey of Object.keys(actor.data.data.abilities) ) {
            const abilityString = game.i18n.localize(`DND5E.Ability${abilityKey.titleCase()}`).slice(0, 3);
            const selected = abilityKey === selectedAbility ? true : undefined;
            const option = createElement("option", {
                text: abilityString,
                attrs: { value: abilityKey, selected },
            });
            options.push(option);
        }
        selectElement.append(...options);

        const skillPropertyPath = `data.skills.${skillKey}.bonuses.check`;
        const textBoxElement = createElement("input", {
            classes: ["skill-check-bonus"],
            attrs: {
                name: skillPropertyPath,
                type: "text",
                placeholder: "-",
                value: foundry.utils.getProperty(actor.data, skillPropertyPath),
            },
            events: {
                click: (evt) => evt.currentTarget.select(),
            },
        });

        const skillAbilityElement = skillElem.querySelector(".skill-ability");
        skillAbilityElement.after(selectElement, textBoxElement);
        skillAbilityElement.remove();
    }
}
