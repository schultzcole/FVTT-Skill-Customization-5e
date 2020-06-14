/**
 * Author: Cole Schultz (cole#9640)
 * Software License: GNU GPLv3
 */

// Import JavaScript modules
import { Utils } from "./utils.js";
import Actor5e from "../../../../systems/dnd5e/module/actor/entity.js";
import { d20Roll } from "../../../../systems/dnd5e/module/dice.js";


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
		// This is copied directly from dnd5e 0.92 entity.js:481
		// because I can't find a good way to pass in my own modifier.

		const skl = this.data.data.skills[skillId];

		// Compose roll parts and data
		const parts = ["@mod", "@extra"];
		const data = {mod: skl.mod + skl.prof, extra: this.getFlag(MODULE_NAME, `${skillId}.${SKILL_BONUS_KEY}`)};
		if ( skl.bonus ) {
		  data["skillBonus"] = skl.bonus;
		  parts.push("@skillBonus");
		}
	
		// Reliable Talent applies to any skill check we have full or better proficiency in
		const reliableTalent = (skl.value >= 1 && this.getFlag("dnd5e", "reliableTalent"));
	
		// Roll and return
		return d20Roll(mergeObject(options, {
		  parts: parts,
		  data: data,
		  title: game.i18n.format("DND5E.SkillPromptTitle", {skill: CONFIG.DND5E.skills[skillId]}),
		  speaker: ChatMessage.getSpeaker({actor: this}),
		  halflingLucky: this.getFlag("dnd5e", "halflingLucky"),
		  reliableTalent: reliableTalent
		}));
	}
}

function injectActorSheet(app, html, data) {
	Utils.log(`injecting skill modifier textboxes into sheet for Actor:${app.actor.name}`);
	const skillRowSelector = ".skills-list .skill";

	const actor = app.actor;

	html.find(skillRowSelector).each(function() {
		const skillElem = $(this);
		const skillKey = $(this).attr("data-skill");
		const bonusKey = `${skillKey}.${SKILL_BONUS_KEY}`
		const selectedAbility = actor.data.data.skills[skillKey].ability;

		let selectElement = $('<select>');
		selectElement.addClass("skill-ability-select");
		Object.keys(actor.data.data.abilities).forEach(ability => {
			let abilityOption = $('<option>');
			let abilityKey = ability.charAt(0).toUpperCase() + ability.slice(1);
			let abilityString = game.i18n.localize(`DND5E.Ability${abilityKey}`).slice(0,3);

			abilityOption.attr("value", ability);

			if (ability === selectedAbility) {
				abilityOption.attr("selected", "true");
			}

			abilityOption.text(abilityString);
			selectElement.append(abilityOption);
		});

		let textBoxElement = $('<input type="text" size=2>');
		textBoxElement.addClass("skill-cust-bonus");
		textBoxElement.val(actor.getFlag(MODULE_NAME, bonusKey) || EMPTY_VALUE);

		textBoxElement.change(function(event) {
			const parsedInt = parseInt(event.target.value);
			if (isNaN(parsedInt)) {
				textBoxElement.val(actor.getFlag(MODULE_NAME, bonusKey) || EMPTY_VALUE);
			} else {
				actor.setFlag(MODULE_NAME, bonusKey, parsedInt)
			}
		});

		skillElem.find(".skill-ability").after(selectElement);
		skillElem.find(".skill-ability").detach()
		selectElement.after(textBoxElement);
	});
}