Hooks.on("renderActorSheet", function injectSkillInputs(app, html, _) {
    html.find(".skills-list").addClass("skill-customize");

    const actor = app.actor;

    html.find(".skills-list .skill").each(function () {
        const skillElem = $(this);
        const skillKey = skillElem.attr("data-skill");
        const abilityPropertyPath = `data.skills.${skillKey}.ability`
        const selectedAbility = foundry.utils.getProperty(actor.data, abilityPropertyPath);

        let selectElement = $(`<select name="${abilityPropertyPath}" class="skill-ability-select">`);
        for ( const abilityKey of Object.keys(actor.data.data.abilities) ) {
            const abilityString = game.i18n.localize(`DND5E.Ability${abilityKey.titleCase()}`).slice(0, 3);
            const selected = abilityKey === selectedAbility ? " selected" : "";
            const abilityOption = $(`<option value="${abilityKey}"${selected}>${abilityString}</option>`);

            selectElement.append(abilityOption);
        }

        const skillPropertyPath = `data.skills.${skillKey}.bonuses.check`;
        const textBoxElement = $(`<input name="${skillPropertyPath}" class="skill-check-bonus" type="text" placeholder="-" />`);
        textBoxElement.val(foundry.utils.getProperty(actor.data, skillPropertyPath));

        textBoxElement.click(function() { $(this).select(); });

        skillElem.find(".skill-ability").after(selectElement);
        skillElem.find(".skill-ability").remove();
        selectElement.after(textBoxElement);
    });
});

