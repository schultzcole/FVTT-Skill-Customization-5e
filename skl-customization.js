/**
 * Author: Cole Schultz (cole#9640)
 * Software License: GNU GPLv3
 */

// Import JavaScript modules
import { Utils } from "./utils.js";

const EMPTY_VALUE = "-";
const MODULE_NAME = "skill-customization-5e";
const SKILL_BONUS_KEY = "skill-bonus";

Hooks.once("setup", () => {
    patchActor5ePrepareData();
    patchActor5eRollSkill();
});

Hooks.on("renderActorSheet", injectActorSheet);

function patchActor5ePrepareData() {
    Utils.log("Patching Actor5e.prepareData()");
    const oldPrepareData = CONFIG.Actor.entityClass.prototype.prepareData;

    CONFIG.Actor.entityClass.prototype.prepareData = function () {
        oldPrepareData.call(this);

        const skills = this.data.data.skills;
        for (let key in skills) {
            let skill = skills[key];
            let bonus = this.getFlag(MODULE_NAME, `${key}.${SKILL_BONUS_KEY}`) || 0;
            let bonusAsInt = parseInt(Number(bonus));
            if (!isNaN(bonusAsInt)) {
                skill.total += bonusAsInt;

                // recalculate passive score, taking observant feat into account
                const observant = this.data.flags.dnd5e?.observantFeat;
                const passiveBonus =
                    observant && CONFIG.DND5E.characterFlags.observantFeat.skills.includes(key) ? 5 : 0;
                skill.passive = 10 + skill.total + passiveBonus;
            }
        }
    };
}

function patchActor5eRollSkill() {
    Utils.log("Patching Actor5e.rollSkill()");
    const oldRollSkill = CONFIG.Actor.entityClass.prototype.rollSkill;

    CONFIG.Actor.entityClass.prototype.rollSkill = function (skillId, options = {}) {
        const extraOptions = {
            parts: ["@extra"],
            data: {
                extra: this.getFlag(MODULE_NAME, `${skillId}.${SKILL_BONUS_KEY}`),
            },
        };
        oldRollSkill.call(this, skillId, mergeObject(options, extraOptions));
    };
}

function injectActorSheet(app, html, data) {
    html.find(".skills-list").addClass("skill-customize");

    const skillRowSelector = ".skills-list .skill";

    const actor = app.actor;

    html.find(skillRowSelector).each(function () {
        const skillElem = $(this);
        const skillKey = $(this).attr("data-skill");
        const bonusKey = `${skillKey}.${SKILL_BONUS_KEY}`;
        const selectedAbility = actor.data.data.skills[skillKey].ability;

        let selectElement = $("<select>");
        selectElement.addClass("skill-ability-select");
        Object.keys(actor.data.data.abilities).forEach((ability) => {
            let abilityOption = $("<option>");
            let abilityKey = ability.charAt(0).toUpperCase() + ability.slice(1);
            let abilityString = game.i18n.localize(`DND5E.Ability${abilityKey}`).slice(0, 3);

            abilityOption.attr("value", ability);

            if (ability === selectedAbility) {
                abilityOption.attr("selected", "true");
            }

            abilityOption.text(abilityString);
            selectElement.append(abilityOption);
        });

        selectElement.change(function (event) {
            let newData = { data: { skills: {} } };
            newData.data.skills[skillKey] = { ability: event.target.value };
            actor.update(newData);
        });

        let textBoxElement = $('<input type="text" size=2>');
        textBoxElement.addClass("skill-cust-bonus");
        textBoxElement.val(actor.getFlag(MODULE_NAME, bonusKey) || EMPTY_VALUE);

        textBoxElement.click(function () {
            $(this).select();
        });

        textBoxElement.change(async function (event) {
            const bonusValue = event.target.value;
            const rollResult = await new Roll(`1d20 + ${bonusValue}`).roll();
            const valid = !isNaN(rollResult._total);

            if (valid) {
                actor.setFlag(MODULE_NAME, bonusKey, bonusValue);
            } else {
                textBoxElement.val(actor.getFlag(MODULE_NAME, bonusKey) || EMPTY_VALUE);
            }
        });

        skillElem.find(".skill-ability").after(selectElement);
        skillElem.find(".skill-ability").detach();
        selectElement.after(textBoxElement);
    });
}
