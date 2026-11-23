/**
 * A minimal `matchMedia` fake supporting `screen`, `min-width`, `max-width` and `orientation`
 * queries. Call `resize` to change the viewport and fire `change` events.
 */
export function createFakeWindow({width = 1024, height = 768} = {}) {
	let viewport = {width, height};
	const lists = new Set<FakeMediaQueryList>();

	class FakeMediaQueryList extends EventTarget {
		readonly media: string;
		matches: boolean;

		constructor(media: string) {
			super();
			this.media = media;
			this.matches = isMatching(media);
		}
	}

	const isMatching = (media: string) =>
		media.split(' and ').every(part => {
			const feature = /\((?<name>min-width|max-width|orientation):\s*(?<value>[\w.]+?)(?:px)?\)/v.exec(part);
			if (!feature?.groups) {
				return part.trim() === 'screen';
			}

			const {name, value} = feature.groups;
			if (name === 'min-width') {
				return viewport.width >= Number(value);
			}

			if (name === 'max-width') {
				return viewport.width <= Number(value);
			}

			const orientation = viewport.height >= viewport.width ? 'portrait' : 'landscape';
			return orientation === value;
		});

	const matchMedia = (media: string) => {
		const list = new FakeMediaQueryList(media);
		lists.add(list);
		return list as unknown as MediaQueryList;
	};

	const resize = (next: {width?: number; height?: number}) => {
		viewport = {...viewport, ...next};
		for (const list of lists) {
			const isNowMatching = isMatching(list.media);
			if (isNowMatching === list.matches) {
				continue;
			}

			list.matches = isNowMatching;
			list.dispatchEvent(
				Object.assign(new Event('change'), {matches: isNowMatching, media: list.media}),
			);
		}
	};

	return {matchMedia, resize};
}
