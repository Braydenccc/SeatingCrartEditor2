import { ref } from 'vue'

const MIN_SCALE = 0.2
const MAX_SCALE = 3.0
const STEP = 0.1

const scale = ref(1.0)
const panX = ref(0)
const panY = ref(0)

export function useZoom() {
    const zoomIn = () => {
        scale.value = Math.min(MAX_SCALE, Math.round((scale.value + STEP) * 10) / 10)
    }

    const zoomOut = () => {
        scale.value = Math.max(MIN_SCALE, Math.round((scale.value - STEP) * 10) / 10)
    }

    const resetZoom = () => {
        scale.value = 1.0
        panX.value = 0
        panY.value = 0
    }

    const setScale = (value) => {
        scale.value = Math.max(MIN_SCALE, Math.min(MAX_SCALE, Math.round(value * 100) / 100))
    }

    const setPan = (x, y) => {
        panX.value = x
        panY.value = y
    }

    return {
        scale,
        panX,
        panY,
        zoomIn,
        zoomOut,
        resetZoom,
        setScale,
        setPan,
        MIN_SCALE,
        MAX_SCALE
    }
}
