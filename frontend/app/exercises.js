// exercises.js
import { initChapterSystem } from "./chapter-engine.js";

import chapter0 from "./chapters/info/index.js";
import xorPages from "./chapters/xor/index.js";
import caesarPages from "./chapters/caesar/index.js";
import blockPages from "./chapters/blocks/index.js";
import aesPages from "./chapters/aes/index.js";
import hashPages from "./chapters/hash/index.js";
import schnorrPages from "./chapters/schnorr/index.js";
import eccPages from "./chapters/ecc/index.js";
import rsaPages from "./chapters/rsa/index.js";
import testPages from "./chapters/test/index.js";

const PALETTE = [
  { color: '#00e5aa', glow: 'rgba(0, 229, 170, 0.15)' },  // Mint Green
  { color: '#4db8ff', glow: 'rgba(77, 184, 255, 0.15)' },  // Cyan
  { color: '#ff8c42', glow: 'rgba(255, 140, 66, 0.15)' },  // Amber
  { color: '#c084fc', glow: 'rgba(192, 132, 252, 0.15)' }, // Purple
  { color: '#2ed573', glow: 'rgba(46, 213, 115, 0.15)' },  // Neon Green
  { color: '#ff4757', glow: 'rgba(255, 71, 87, 0.15)' },   // Coral Red
  { color: '#eccc68', glow: 'rgba(236, 204, 104, 0.15)' },  // Yellow/Gold
];


// Import generated debug config (or inline window fallback)
const IS_DEBUG = window.APP_CONFIG?.DEBUG ?? false;

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
    const folderGroups = [
        chapter0,
        xorPages,
        caesarPages,
        blockPages,
        aesPages,
        hashPages,
        schnorrPages, 
        eccPages,
        rsaPages,
    ];

    if (IS_DEBUG) {
        folderGroups.push(testPages);
    }

    const chapters = folderGroups.flatMap((group, folderIdx) => {
        const theme = PALETTE[folderIdx % PALETTE.length];
        const folderNum = String(folderIdx + 1).padStart(2, '0');

        return group.map((ch, pageIdx) => {
            const displayNum = pageIdx === 0 ? folderNum : `${folderNum}.${pageIdx}`;
            
            // Guarantee a unique fallback ID if ch.id is missing or duplicated
            const uniqueId = ch.id ? String(ch.id) : `ch-${folderNum}-${pageIdx}`;

            return {
                ...ch,
                id: uniqueId,
                theme,
                displayNum
            };
        });
    });

    // 🐛 DEBUG ONLY: Print chapter table & check for duplicate IDs
    if (IS_DEBUG) {
        console.group("🐛 Debug Info: Registered Chapters");
        
        console.table(chapters.map(c => ({
            "Num": c.displayNum,
            "ID": c.id,
            "Title": c.title,
            "Tag": c.tag || "N/A"
        })));

        // Warning check for duplicate IDs
        const idSet = new Set();
        chapters.forEach(c => {
            if (idSet.has(c.id)) {
                console.warn(`⚠️ DUPLICATE ID FOUND: "${c.id}" (Display Num: ${c.displayNum})`);
            }
            idSet.add(c.id);
        });

        console.groupEnd();
    }

    const listContainer = document.getElementById("exercise-list");
    if (!listContainer) return;

    initChapterSystem({
        chapters,
        listContainer,
        screenRoot: document.body,
        showScreen,
        kit: { CircuitWasm }
    });
}
