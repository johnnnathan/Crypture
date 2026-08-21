// exercises.js
import { initChapterSystem } from "./chapter-engine.js";

import chapter0 from "./chapters/info/index.js"
import xorPages from "./chapters/xor/index.js";
import caesarPages from "./chapters/caesar/index.js";
import blockPages from "./chapters/blocks/index.js"
import aesPages from "./chapters/aes/index.js"
import hashPages from "./chapters/hash/index.js"
import schnorrPages from "./chapters/schnorr/index.js"
import testPages from "./chapters/test/index.js"

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
        ...caesarPages,
        ...blockPages,
        ...aesPages,
        ...hashPages,
        ...schnorrPages, 
        ...testPages,
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
