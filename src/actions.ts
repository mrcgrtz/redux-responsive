import type { Orientation } from './types.ts'

export const CALCULATE_RESPONSIVE_STATE = 'redux-responsive/CALCULATE_RESPONSIVE_STATE'

export type CalculateResponsiveStatePayload = {
    mediaType: string
    orientation: Orientation
}

// a type alias (not an interface) so it is assignable to Redux's `UnknownAction`
export type CalculateResponsiveStateAction = {
    type: typeof CALCULATE_RESPONSIVE_STATE
    /**
     * Filled in by the store enhancer from the current window. Pass it explicitly to set the
     * responsive state without a window (e.g. in tests).
     */
    payload?: CalculateResponsiveStatePayload
}

/**
 * Requests a recalculation of the responsive state. The store enhancer measures the window
 * and attaches the result, so the action stays serializable.
 */
export function calculateResponsiveState(
    payload?: CalculateResponsiveStatePayload
): CalculateResponsiveStateAction {
    return payload
        ? { type: CALCULATE_RESPONSIVE_STATE, payload }
        : { type: CALCULATE_RESPONSIVE_STATE }
}

export function isCalculateResponsiveStateAction(
    action: unknown
): action is CalculateResponsiveStateAction {
    return (
        typeof action === 'object' &&
        action !== null &&
        (action as { type?: unknown }).type === CALCULATE_RESPONSIVE_STATE
    )
}
