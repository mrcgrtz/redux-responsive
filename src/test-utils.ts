/**
 * A minimal `matchMedia` fake supporting `screen`, `min-width`, `max-width` and `orientation`
 * queries. Call `resize` to change the viewport and fire `change` events.
 */
export function createFakeWindow({ width = 1024, height = 768 } = {}) {
    let viewport = { width, height }
    const lists = new Set<FakeMediaQueryList>()

    class FakeMediaQueryList extends EventTarget {
        readonly media: string
        matches: boolean

        constructor(media: string) {
            super()
            this.media = media
            this.matches = evaluate(media)
        }
    }

    const evaluate = (media: string) =>
        media.split(/\s+and\s+/).every((part) => {
            const feature = /\((min-width|max-width|orientation):\s*([\w.]+?)(?:px)?\)/.exec(part)
            if (!feature) return part.trim() === 'screen'

            const [, name, value] = feature
            if (name === 'min-width') return viewport.width >= Number(value)
            if (name === 'max-width') return viewport.width <= Number(value)
            return (viewport.height >= viewport.width ? 'portrait' : 'landscape') === value
        })

    const matchMedia = (media: string) => {
        const list = new FakeMediaQueryList(media)
        lists.add(list)
        return list as unknown as MediaQueryList
    }

    const resize = (next: { width?: number; height?: number }) => {
        viewport = { ...viewport, ...next }
        for (const list of lists) {
            const matches = evaluate(list.media)
            if (matches !== list.matches) {
                list.matches = matches
                list.dispatchEvent(
                    Object.assign(new Event('change'), { matches, media: list.media })
                )
            }
        }
    }

    return { matchMedia, resize }
}
