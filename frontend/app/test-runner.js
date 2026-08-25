// test-runner.js
import { buildChapterScreen } from "./chapter-engine.js";
import testPages from "./chapters/test/index.js";

// Initialize test page when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    const root = document.body;

    // Pick a test theme or fallback
    const testTheme = { color: '#ff4757', glow: 'rgba(255, 71, 87, 0.15)' };

    testPages.forEach((testChapter, idx) => {
        const testData = {
            ...testChapter,
            theme: testTheme,
            displayNum: `TEST.${idx + 1}`
        };

        // Render the screen directly
        const screen = buildChapterScreen(testData, { /* Mock or real CircuitWasm if needed */ });
        
        // Ensure it's active and visible
        screen.classList.add("active");
        
        // Hide the back button if you don't need navigation back to main exercise list
        const backBtn = screen.querySelector(".tb-back");
        if (backBtn) backBtn.style.display = "none";

        root.appendChild(screen);
    });
});
