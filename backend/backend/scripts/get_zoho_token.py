import os
import requests


def build_accounts_base(domain: str) -> str:
    domain = (domain or "com").strip().lower()
    if domain == "com":
        return "https://accounts.zoho.com"
    return f"https://accounts.zoho.{domain}"


def get_env(key: str, default: str = "") -> str:
    return os.getenv(key, default).strip()


def main() -> int:
    print("Zoho Desk OAuth Helper (SELF CLIENT) -> Refresh Token + Org ID\n")

    accounts_domain = get_env("ZOHO_ACCOUNTS_DOMAIN", "com")
    desk_api_endpoint = get_env("ZOHO_DESK_API_ENDPOINT", "https://desk.zoho.com/api/v1")

    client_id = get_env("ZOHO_CLIENT_ID")
    client_secret = get_env("ZOHO_CLIENT_SECRET")

    if not client_id:
        client_id = input("Enter ZOHO_CLIENT_ID: ").strip()
    if not client_secret:
        client_secret = input("Enter ZOHO_CLIENT_SECRET: ").strip()

    print("\nGenerate a GRANT TOKEN from Zoho API Console -> Self Client using Desk scopes.")
    grant_token = input("Paste the GRANT TOKEN here: ").strip()
    if not grant_token:
        print("ERROR: No grant token provided.")
        return 1

    accounts_base = build_accounts_base(accounts_domain)
    token_url = f"{accounts_base}/oauth/v2/token"

    # Self Client exchange uses grant_type=authorization_code and DOES NOT need redirect_uri
    token_payload = {
        "grant_type": "authorization_code",
        "client_id": client_id,
        "client_secret": client_secret,
        "code": grant_token,
    }

    print("\nExchanging grant token for tokens...")
    token_res = requests.post(token_url, data=token_payload, timeout=20)
    try:
        token_json = token_res.json()
    except Exception:
        print("ERROR: Token response is not JSON:")
        print(token_res.text)
        return 1

    if token_res.status_code >= 400 or "error" in token_json:
        print("ERROR: Failed to get tokens:")
        print(token_json)
        return 1

    access_token = token_json.get("access_token")
    refresh_token = token_json.get("refresh_token")

    if not access_token:
        print("ERROR: access_token missing:")
        print(token_json)
        return 1

    print("\nSUCCESS: access_token received.")
    if refresh_token:
        print("SUCCESS: refresh_token received.")
    else:
        print("WARNING: refresh_token not returned (check scopes and consent).")

    print("\nFetching organizations to get orgId...")
    orgs_url = f"{desk_api_endpoint.rstrip('/')}/organizations"
    headers = {"Authorization": f"Zoho-oauthtoken {access_token}"}

    orgs_res = requests.get(orgs_url, headers=headers, timeout=20)
    try:
        orgs_json = orgs_res.json()
    except Exception:
        print("ERROR: Organizations response is not JSON:")
        print(orgs_res.text)
        return 1

    if orgs_res.status_code >= 400:
        print("ERROR: Failed to fetch organizations:")
        print(orgs_json)
        return 1

    org_id = None
    if isinstance(orgs_json, list) and orgs_json:
        org_id = orgs_json[0].get("id")
    elif isinstance(orgs_json, dict):
        data = orgs_json.get("data")
        if isinstance(data, list) and data:
            org_id = data[0].get("id")

    print("\n========== OUTPUT ==========")
    print(f"ZOHO_ACCOUNTS_DOMAIN={accounts_domain}")
    print(f"ZOHO_DESK_API_ENDPOINT={desk_api_endpoint}")
    if refresh_token:
        print(f"ZOHO_REFRESH_TOKEN={refresh_token}")
    else:
        print("ZOHO_REFRESH_TOKEN=<NOT_RETURNED>")
    if org_id:
        print(f"ZOHO_ORG_ID={org_id}")
    else:
        print("ZOHO_ORG_ID=<NOT_FOUND>")
    print("============================\n")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
