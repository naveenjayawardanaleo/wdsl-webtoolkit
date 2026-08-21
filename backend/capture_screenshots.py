"""Log in as each demo role in turn and screenshot every page from Task 5's
list, saving them with filenames matching the dissertation's Implementation
chapter figure captions. Requires the backend (port 5000) and frontend dev
server to already be running, and seed.py to have been run first.

Usage: python capture_screenshots.py [frontend_base_url]
(defaults to http://localhost:5173)
"""

import sys
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

BASE_URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:5173"
OUT_DIR = Path(__file__).resolve().parent.parent / "screenshots"
OUT_DIR.mkdir(exist_ok=True)

DEVELOPER = {"email": "developer@wdsl-demo.test", "password": "demopass123"}
CLIENT = {"email": "client@wdsl-demo.test", "password": "demopass123"}
ADMIN = {"email": "admin@wdsl-demo.test", "password": "demopass123"}


def shot(page, name):
    path = OUT_DIR / name
    page.screenshot(path=str(path), full_page=True)
    print(f"saved {path}")


def login(page, creds):
    page.goto(f"{BASE_URL}/login", wait_until="networkidle")
    page.fill('input[type="email"]', creds["email"])
    page.fill('input[type="password"]', creds["password"])
    page.click('button[type="submit"]')
    page.wait_for_selector("text=Log out", timeout=15000)
    time.sleep(0.3)


def logout(page):
    page.click("text=Log out")
    page.wait_for_selector('button[type="submit"]', timeout=15000)
    time.sleep(0.3)


def find_first_report_link(page):
    page.wait_for_selector("a[href^='/reports/']", timeout=10000)
    href = page.eval_on_selector("a[href^='/reports/']", "el => el.getAttribute('href')")
    return href


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 900})

        # Registration & login pages (unauthenticated)
        page.goto(f"{BASE_URL}/register", wait_until="networkidle")
        shot(page, "fig_6_1_registration_page.png")

        page.goto(f"{BASE_URL}/login", wait_until="networkidle")
        shot(page, "fig_6_2_login_page.png")

        # Developer flow
        login(page, DEVELOPER)
        page.wait_for_selector("text=Reports", timeout=15000)
        page.locator("a[href^='/reports/']").or_(page.get_by_text("No reports yet")).first.wait_for(timeout=15000)
        shot(page, "fig_6_3_developer_dashboard.png")
        shot(page, "fig_6_7_url_submission_form.png")

        report_href = find_first_report_link(page)
        page.goto(f"{BASE_URL}{report_href}", wait_until="networkidle")
        time.sleep(1)  # let the authed screenshot image finish loading
        shot(page, "fig_6_4_technical_report_view.png")
        shot(page, "fig_6_9_cv_model_output.png")
        shot(page, "fig_6_10_ai_suggestion_output.png")
        shot(page, "fig_6_11_comment_thread_open.png")

        logout(page)

        # Client flow
        login(page, CLIENT)
        page.locator("a[href^='/reports/']").or_(page.get_by_text("No reports yet")).first.wait_for(timeout=15000)
        shot(page, "fig_6_5_client_dashboard.png")

        report_href = find_first_report_link(page)
        page.goto(f"{BASE_URL}{report_href}", wait_until="networkidle")
        time.sleep(1)
        shot(page, "fig_6_6_plain_language_report_view.png")

        # Close the open thread as the client, then capture the closed state
        close_button = page.locator("text=Mark resolved & close thread")
        if close_button.count() > 0:
            close_button.first.click()
            page.wait_for_selector("text=Closed", timeout=10000)
            time.sleep(0.5)
        shot(page, "fig_6_12_comment_thread_closed.png")

        logout(page)

        # Admin flow
        login(page, ADMIN)
        page.wait_for_selector("table", timeout=15000)
        page.wait_for_selector("table tbody tr", timeout=15000)
        shot(page, "fig_6_13_admin_subscription_management.png")

        browser.close()
        print(f"\nAll screenshots saved to {OUT_DIR}")


if __name__ == "__main__":
    main()
