#!/usr/bin/env python3
"""
Submit URLs to Google Indexing API for NewsXphere.

Usage:
  python3 submit_indexing.py https://www.newsxphere.com/tech/example/ https://www.newsxphere.com/jobs/example/

Environment:
  GOOGLE_SERVICE_ACCOUNT_JSON - the full service account JSON, or a path to it.
  The service account email must be added as Owner in Search Console for newsxphere.com,
  and the Indexing API must be enabled in the Google Cloud project.

Notes:
  - Officially eligible: JobPosting and BroadcastEvent pages. News articles are
    submitted by many publishers in practice, but Google does not guarantee
    indexing for them, and the news sitemap remains the backup.
  - Quota is 200 publish requests per project per day. This script stops at that limit.
  - No secret is stored in this file. Read it only from the environment / GitHub secret.
"""
import json
import os
import sys

API_URL = "https://indexing.googleapis.com/v3/urlNotifications:publish"
SCOPE = "https://www.googleapis.com/auth/indexing"
DAILY_LIMIT = 200


def load_credentials():
    raw = os.environ.get("GOOGLE_SERVICE_ACCOUNT_JSON", "")
    if not raw:
        raise SystemExit("GOOGLE_SERVICE_ACCOUNT_JSON is not set")
    info = json.loads(raw) if raw.strip().startswith("{") else json.load(open(raw))
    from google.oauth2 import service_account
    return service_account.Credentials.from_service_account_info(info, scopes=[SCOPE])


def main():
    urls = [u.strip() for u in sys.argv[1:] if u.strip()]
    if not urls:
        print("No URLs given")
        return
    urls = urls[:DAILY_LIMIT]
    creds = load_credentials()
    import requests
    from google.auth.transport.requests import AuthorizedSession
    session = AuthorizedSession(creds)
    for url in urls:
        resp = session.post(API_URL, json={"url": url, "type": "URL_UPDATED"}, timeout=30)
        print(url, resp.status_code, resp.text[:300])


if __name__ == "__main__":
    main()
