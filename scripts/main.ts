import { system, world } from '@minecraft/server';
import { ActionFormData } from '@minecraft/server-ui';

import * as menu from './menu.json';

world.beforeEvents.itemUse.subscribe((event) => {
	if (event.source.typeId !== 'minecraft:player' || event.itemStack.typeId !== 'starter:menu') {
		return;
	}

	const player = event.source;
	system.run(() => {
		const form = new ActionFormData();
		form.title(menu.title);
		form.body(menu.description);

		for (const button of menu.buttons) {
			form.button(button.text, button.icon);
		}

		form
			// @ts-expect-error The types inside of the external dependanies don't match..
			.show(player)
			.then(() => {
				player.sendMessage({
					rawtext: [{ translate: 'starter.line_1' }],
				});
				player.sendMessage({
					rawtext: [{ translate: 'starter.line_2' }],
				});
			})
			.catch(() => null);
	});

	event.cancel = true;
});
