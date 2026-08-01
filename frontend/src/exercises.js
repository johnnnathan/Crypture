import { initChapterSystem } from "./chapter-engine.js";

import xor from "./chapters/xor/index.js";
import caesar from "./chapters/caesar/index.js";

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

    const chapters = [
        xor,
        caesar
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

        kit: {
            CircuitWasm
        }

    });

}
