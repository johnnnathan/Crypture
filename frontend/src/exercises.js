// exercises.js
import { initChapterSystem } from "./chapter-engine.js";

import chapter0 from "./chapters/info/index.js"
import xorPages from "./chapters/xor/index.js";
import caesarPages from "./chapters/caesar/index.js";

function showScreen(id) {
    document.querySelectorAll(".screen").forEach(screen => {
        screen.classList.remove("active");
    });

    const screen = document.getElementById(id);
    if (screen) {
        screen.classList.add("active");
    }
}

export function initExercises(CircuitWasm) {
    // Spread the exported arrays so 'chapters' is a single flat array of objects
    const chapters = [
        ...chapter0,
        ...xorPages,
        ...caesarPages
    ];

    const listContainer = document.getElementById("exercise-list");

    if (!listContainer) {
        console.error("Missing #exercise-list");
        return;
    }

    initChapterSystem({
        chapters,
        listContainer,
        screenRoot: document.body,
        showScreen,
        kit: { CircuitWasm }
    });
}
