# OneRoom Active Tenant Extractor

This tool logs into OneRoom, allows users to choose one property from unique options, visits active tenant records for that property, extracts configured fields, and writes an Excel file for contract generation.

## 1) Setup

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m playwright install chromium
```

## 2) Credentials in UI

The local app now asks users for OneRoom credentials at runtime.

- Credentials are entered directly in the app screen
- Credentials are used only for the current run
- You do not need to store username/password in `.env`
- The installed app uses its bundled config internally; users do not edit the config path in the UI
- Users can enable a "Remember credentials on this computer" option, which stores them in the Windows credential store for reuse on that machine

## 3) Configure selectors

Copy `config/field_mapping.example.yaml` to `config/field_mapping.yaml` and update CSS selectors to match your OneRoom pages.

Important sections:
- `login`: selectors used for sign-in
- `active_tenants`: selectors used to discover active tenant links
- `fields`: what to extract from each tenant page

Field rule options:
- `selector`: CSS selector (required)
- `type`: `text`, `value`, or `attr` (default is `text`)
- `type: labeled_text`: extract a value from a `strong` label and its matching `span` on the tenant detail page
- `section_heading`: optional section title such as `Tenant Details` or `Agreement` when using `labeled_text`
- `label`: exact visible label text such as `Name`, `Email`, `Property/Room`, `Actual Balance`
- `index`: zero-based match index, useful for `tenant_1_*` and `tenant_2_*` fields
- `attr`: required when `type: attr`
- `regex`: optional regex; if present, first capture group is used

## 4) Run

```powershell
python src/main.py --config config/field_mapping.yaml --output output/active_tenants.xlsx
```

## 5) Local UI (recommended)

Run the local web app on the user's computer:

```powershell
python src/webapp.py
```

Then open: http://127.0.0.1:5000

UI flow:
- Enter OneRoom username and password
- Click "Run Tenant Report For New Contracts"
- The app logs in, opens `https://oneroom.managerooms.com/pages/tenants/index.php`, and loads unique property addresses from table rows
- Select one property from the dropdown
- Fill landlord details in the form: name, address, telephone number, and email address
- The app uses that property in search input `input[name='busca']` and extracts from filtered results

This creates an Excel file containing only active tenants for the selected property.

The default field map is now structured for a maximum of two tenants per tenancy:
- `tenant_1_name`, `tenant_1_email`, `tenant_1_phone`
- `tenant_2_name`, `tenant_2_email`, `tenant_2_phone`
- Additional values can be pulled from `Tenant Details` and `Agreement`, such as `property_address`, `room_name`, `holding_deposit`, `rent_expected`, `moving_in_date`, `actual_balance`, and `status`

If a second tenant does not exist on the page, the `tenant_2_*` columns remain blank.

## 6) Config keys for property options

In `config/field_mapping.yaml`, update:
- `site.active_tenants_url` (should be the notices/tenant list page)
- `property_discovery.row_property_selector` (table column containing property address)
- `active_tenants.row_property_selector` (if properties are shown in table rows)
- `property_search.search_input_selector` (`input[name='busca']`)

The app automatically deduplicates property names and removes generic entries (e.g. "All", "Select").

## 7) Output

The Excel file will contain one row per active tenant record and one column per configured field.

The output also includes computed and form-provided fields:
- `commencement_date`: date when the report is run
- `end_date`: commencement date + 3 months - 1 day
- `rent_payment_day`: weekday derived from the rent-week colour board when available
- `landlord_name`, `landlord_address`, `landlord_telephone_number`, `landlord_email_address`

## Notes

- If login requires MFA/CAPTCHA, run with `--headed` and complete steps manually.
