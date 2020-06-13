/**
 * Author: Cole Schultz (cole#9640)
 * Software License: GNU GPLv3
 */

// Import JavaScript modules
import { Utils } from "./utils.js";
import Actor5e from "../../../../systems/dnd5e/module/actor/entity.js";

const EMPTY_VALUE = "-";
const MODULE_NAME = "skill-customization-5e";
const SKILL_BONUS_KEY = "skill-bonus";

Hooks.once("setup", () => {
	patchActor5ePrepareData();
	patchActor5eRollSkill();
});

Hooks.on("renderActorSheet", injectMsbTextBoxes);

function patchActor5ePrepareData() {
	Utils.log("Patching Actor5e.prepareData()");
	const oldPrepareData = Actor5e.prototype.prepareData;

	Actor5e.prototype.prepareData = function() {
		oldPrepareData.call(this);

		const skills = this.data.data.skills;
		for (let key in skills) {
			let skill = skills[key];
			let bonus = this.getFlag(MODULE_NAME, `${key}.${SKILL_BONUS_KEY}`) || 0;
			skill.total += bonus;
		}
	}
}

function patchActor5eRollSkill() {
	Utils.log("Patching Actor5e.rollSkill()");
	const oldRollSkill = Actor5e.prototype.rollSkill;

	Actor5e.prototype.rollSkill = function(skillId, options={}) {
		const extraOptions = {
			parts: ["@extra"],
			data: { extra: this.getFlag(MODULE_NAME, `${skillId}.${SKILL_BONUS_KEY}`) }
		};
		
		const finalResult = oldRollSkill.call(this, skillId, mergeObject(options, extraOptions))
			.then((result) => {
				console.log(result)
				return result;
			});

		return finalResult;
	}
}

function injectMsbTextBoxes(app, html, data) {
	Utils.log(`injecting skill modifier textboxes into sheet for Actor:${app.actor.name}`);
	const skillRowSelector = ".skills-list .skill";

	html.find(skillRowSelector).each(function() {
		const skillElem = $(this);
		const bonusKey = `${$(this).attr("data-skill")}.${SKILL_BONUS_KEY}`
		
		let textBoxElement = $('<input type="text" size=2>');
		textBoxElement.addClass("skill-cust-bonus");
		textBoxElement.val(app.actor.getFlag(MODULE_NAME, bonusKey) || EMPTY_VALUE);

		textBoxElement.change(function(event) {
			const parsedInt = parseInt(event.target.value);
			if (isNaN(parsedInt)) {
				textBoxElement.val(app.actor.getFlag(MODULE_NAME, bonusKey) || EMPTY_VALUE);
			} else {
				app.actor.setFlag(MODULE_NAME, bonusKey, parsedInt)
			}
		});

		skillElem.find(".skill-ability").after(textBoxElement);
	});
}