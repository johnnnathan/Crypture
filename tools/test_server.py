import unittest
import time
from playwright.sync_api import sync_playwright

BASE_URL = "http://127.0.0.1:8000"

class TestEngineInitialization(unittest.TestCase):

    def test_engine_boot_sequence(self):
        """
        Loads the application and measures how long all WebAssembly / Pyodide engines 
        take to finish booting.
        """
        with sync_playwright() as p:
            # Launch headless Chromium browser
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()

            print("🚀 Navigating to app and monitoring engine startup...")
            start_time = time.time()
            page.goto(BASE_URL)

            # 1. Verify initial booting status text
            status_text = page.locator("#wasm-status-text")
            self.assertTrue(status_text.is_visible())

            # 2. Wait explicitly until status text changes to 'engines ready'
            # Timeout set to 30000ms (30s) to account for Pyodide initial WASM download/compile
            page.wait_for_selector("#wasm-status-text:has-text('engines ready')", timeout=30000)

            elapsed_time = time.time() - start_time
            print(f"⚡ Engines successfully booted in {elapsed_time:.2f} seconds!")

            # 3. Assert DOM readiness signals
            status_led = page.locator("#wasm-status-led")
            self.assertTrue(status_led.evaluate("el => el.classList.contains('ready')"))

            sandbox_btn = page.locator("#btn-open-sandbox")
            exercises_btn = page.locator("#btn-open-exercises")

            # Assert buttons are unlocked
            self.assertEqual(sandbox_btn.evaluate("el => getComputedStyle(el).opacity"), "1")
            self.assertEqual(sandbox_btn.evaluate("el => getComputedStyle(el).pointerEvents"), "auto")

            self.assertEqual(exercises_btn.evaluate("el => getComputedStyle(el).opacity"), "1")
            self.assertEqual(exercises_btn.evaluate("el => getComputedStyle(el).pointerEvents"), "auto")

            browser.close()

if __name__ == "__main__":
    unittest.main()

