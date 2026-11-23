import { configureStore } from '@reduxjs/toolkit'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider, useSelector } from 'react-redux'
import { responsiveStateReducer, responsiveStoreEnhancer } from '../src/index.ts'
import { StyleSheet, useResponsiveStyles } from '../src/react/index.ts'
import type { CSSProperties } from 'react'

const store = configureStore({
    reducer: { browser: responsiveStateReducer },
    enhancers: (getDefaultEnhancers) => getDefaultEnhancers().concat(responsiveStoreEnhancer),
})

type RootState = ReturnType<typeof store.getState>

const stylesheet = {
    container: {
        padding: '2rem',
        color: 'white',
        background: 'steelblue',
        _lessThan_medium: { background: 'tomato' },
        _equal_infinity: { background: 'seagreen' },
    },
}

function App() {
    const browser = useSelector((state: RootState) => state.browser)
    const styles = useResponsiveStyles(stylesheet)

    return (
        <main style={styles.container}>
            <h1>
                {browser.mediaType} ({browser.orientation ?? 'unknown orientation'})
            </h1>
            <p>Resize the window to see the responsive state change.</p>
            <Legacy />
            <pre>{JSON.stringify(browser, null, 2)}</pre>
        </main>
    )
}

// the higher-order component API, kept for existing code
const Legacy = StyleSheet({
    note: { fontStyle: 'italic', _greaterThan_small: { fontWeight: 'bold' } },
})(({ styles }: { styles: { note: CSSProperties } }) => (
    <p style={styles.note}>This line is styled through the StyleSheet HOC.</p>
))

createRoot(document.getElementById('app')!).render(
    <StrictMode>
        <Provider store={store}>
            <App />
        </Provider>
    </StrictMode>
)
