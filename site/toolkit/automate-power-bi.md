# Automate Power BI

Copy-ready samples for the jobs admins and BI engineers automate: list workspaces, reports and models, trigger and check refreshes, scan the tenant, find stale content, list gateways, export metadata and deploy, in PowerShell, Python, the Fabric CLI, TMSL and Tabular Editor scripts.

From the BI Developer Toolkit: https://sudhanshumukherjeexx.github.io/power-bi/toolkit/automate-power-bi.html

## Before you automate anything

- **Use a service principal for anything scheduled.** A script that runs as you breaks when you go on holiday or leave. Register an app in Microsoft Entra ID, put it in a security group, and allow that group in the Fabric admin portal's developer settings (**Service principals can call Fabric public APIs**; admin APIs have their own read-only admin API setting).
- **Give it the least access that works:** workspace Member or Contributor only where it deploys or refreshes; admin APIs only for an inventory principal.
- **Keep secrets out of code and out of Git.** Read them from environment variables, a pipeline secret or Azure Key Vault. The samples below use placeholders like `<tenant-id>` and environment variables; nothing in them is a real credential.
- **Respect limits.** Back off on HTTP 429 and honour `Retry-After`; the scanner API, for example, allows a limited number of requests per hour.

The [automation track](https://sudhanshumukherjeexx.github.io/power-bi/automation.html) has hands-on assignments with mock responses, so you can practise without a tenant.

## Authentication

| API | Base URL | Token scope |
|---|---|---|
| Power BI REST | `https://api.powerbi.com/v1.0/myorg` | `https://analysis.windows.net/powerbi/api/.default` |
| Fabric REST | `https://api.fabric.microsoft.com/v1` | `https://api.fabric.microsoft.com/.default` |

### Python (MSAL, client credentials)

```python
# pip install msal requests
import os, msal, requests

TENANT = os.environ["PBI_TENANT_ID"]          # never hard-code these
CLIENT = os.environ["PBI_CLIENT_ID"]
SECRET = os.environ["PBI_CLIENT_SECRET"]

app = msal.ConfidentialClientApplication(CLIENT, authority=f"https://login.microsoftonline.com/{TENANT}", client_credential=SECRET)

def token(scope="https://analysis.windows.net/powerbi/api/.default"):
    result = app.acquire_token_for_client(scopes=[scope])
    if "access_token" not in result:
        raise RuntimeError(result.get("error_description"))
    return result["access_token"]

def pbi(method, path, **kw):
    r = requests.request(method, "https://api.powerbi.com/v1.0/myorg" + path,
                         headers={"Authorization": f"Bearer {token()}"}, timeout=60, **kw)
    r.raise_for_status()
    return r.json() if r.content else None
```

### PowerShell (MicrosoftPowerBIMgmt)

```powershell
# Install-Module MicrosoftPowerBIMgmt -Scope CurrentUser
$cred = New-Object PSCredential($env:PBI_CLIENT_ID, (ConvertTo-SecureString $env:PBI_CLIENT_SECRET -AsPlainText -Force))
Connect-PowerBIServiceAccount -ServicePrincipal -Credential $cred -Tenant $env:PBI_TENANT_ID

# any REST call, with the module handling the token
Invoke-PowerBIRestMethod -Url "groups" -Method Get | ConvertFrom-Json
```

## List workspaces, reports and semantic models

```python
for ws in pbi("GET", "/groups")["value"]:
    reports = pbi("GET", f"/groups/{ws['id']}/reports")["value"]
    models  = pbi("GET", f"/groups/{ws['id']}/datasets")["value"]
    print(ws["name"], len(reports), "reports,", len(models), "semantic models")
```

`/groups` returns the workspaces the identity is a member of. For every workspace in the tenant, use the admin APIs (next sections).

## Trigger a refresh and check its status

```python
ws, model = "<workspace-id>", "<semantic-model-id>"

# service principals must use NoNotification
pbi("POST", f"/groups/{ws}/datasets/{model}/refreshes", json={"notifyOption": "NoNotification"})

last = pbi("GET", f"/groups/{ws}/datasets/{model}/refreshes?$top=1")["value"][0]
print(last["status"], last.get("startTime"), last.get("endTime"))
# status: Unknown (still running), Completed, Failed or Disabled; read serviceExceptionJson on failure
```

For large models, **enhanced refresh** (same endpoint, with a body like `{"type": "Full", "objects": [{"table": "FactSales"}], "commitMode": "transactional"}`) refreshes chosen tables or partitions and can be cancelled. Poll the refresh by its ID rather than in a tight loop: once a minute is plenty.

## Inventory the tenant and extract lineage

The admin scanner APIs return workspaces with their items, users, data sources, lineage and (if metadata scanning is enabled) tables, columns, measures and expressions.

```python
import time
modified = pbi("GET", "/admin/workspaces/modified?excludePersonalWorkspaces=True")
ids = [w["id"] for w in modified]

results = []
for i in range(0, len(ids), 100):                      # up to 100 workspaces per scan
    scan = pbi("POST", "/admin/workspaces/getInfo?lineage=True&datasourceDetails=True&datasetSchema=True&datasetExpressions=True",
               json={"workspaces": ids[i:i + 100]})
    while pbi("GET", f"/admin/workspaces/scanStatus/{scan['id']}")["status"] != "Succeeded":
        time.sleep(10)
    results.append(pbi("GET", f"/admin/workspaces/scanResult/{scan['id']}"))
```

Save the results as JSON or load them into a Lakehouse, and you have the raw material for the inventory in [Sprint 10's architecture review](https://sudhanshumukherjeexx.github.io/power-bi/experience/s10-bi-architecture-review.html): owners, endorsement, data sources, duplicated measures and refresh health.

## Find stale content

Combine the inventory with the activity log: reports nobody opened in 90 days are retirement candidates (not deletion candidates; see [report retirement](https://sudhanshumukherjeexx.github.io/power-bi/experience/d05-report-retirement.html)).

```python
from datetime import date, timedelta
viewed = set()
for d in range(30):                                     # one UTC day per call
    day = date.today() - timedelta(days=d + 1)
    url = f"/admin/activityevents?startDateTime='{day}T00:00:00Z'&endDateTime='{day}T23:59:59Z'&$filter=Activity eq 'viewreport'"
    page = pbi("GET", url)
    while True:
        viewed.update(e.get("ReportId") for e in page.get("activityEventEntities", []))
        if page.get("lastResultSet"):
            break
        page = requests.get(page["continuationUri"], headers={"Authorization": f"Bearer {token()}"}).json()
```

Keep your own history: the activity log only goes back a limited number of days, so export it daily if you want trends.

## List gateways and their data sources

```python
for gw in pbi("GET", "/gateways")["value"]:
    sources = pbi("GET", f"/gateways/{gw['id']}/datasources")["value"]
    print(gw["name"], [s["datasourceType"] for s in sources])
```

The identity sees only gateways it administers.

## Export model metadata

- **Fabric REST:** `POST /v1/workspaces/{workspaceId}/semanticModels/{modelId}/getDefinition` returns the model definition (TMDL parts) as a long-running operation.
- **XMLA:** in SSMS or with TOM, script the database as TMSL.
- **PBIP in Git:** if the model already lives in Git, the repository *is* the metadata. This is the best option.

## TMSL and TOM through the XMLA endpoint

Refresh one table's partitions with TMSL (run in SSMS against `powerbi://api.powerbi.com/v1.0/myorg/<workspace name>`):

```json
{
  "refresh": {
    "type": "full",
    "objects": [ { "database": "Sales Model", "table": "FactSales" } ]
  }
}
```

With TOM in PowerShell (the Analysis Services client libraries installed):

```powershell
Add-Type -Path "Microsoft.AnalysisServices.Tabular.dll"
$server = New-Object Microsoft.AnalysisServices.Tabular.Server
$server.Connect("Data Source=powerbi://api.powerbi.com/v1.0/myorg/Sales;User ID=app:$($env:PBI_CLIENT_ID)@$($env:PBI_TENANT_ID);Password=$($env:PBI_CLIENT_SECRET)")
$model = $server.Databases.GetByName("Sales Model").Model
$model.Tables | ForEach-Object { "{0}: {1} measures" -f $_.Name, $_.Measures.Count }
$server.Disconnect()
```

## Tabular Editor scripts

C# scripts in Tabular Editor automate model hygiene:

```csharp
// Give every measure without a description a TODO, so BPA and reviewers catch it
foreach (var m in Model.AllMeasures.Where(m => string.IsNullOrWhiteSpace(m.Description)))
    m.Description = "TODO: describe " + m.Name;

// Hide every key column used in a relationship
foreach (var c in Model.AllColumns.Where(c => c.Name.EndsWith("Key") && c.UsedInRelationships.Any()))
    c.IsHidden = true;
```

## Fabric CLI

The Fabric CLI (`fab`) navigates Fabric like a file system and wraps the REST APIs:

```bash
pip install ms-fabric-cli
fab auth login
fab ls                         # workspaces
fab ls "Sales.Workspace"       # items in a workspace
```

## Deploy PBIP

For deployment from Git to workspaces, use `fabric-cicd` (Python) and a GitHub Actions or Azure DevOps pipeline. The full walkthrough is in [Ship Power BI like software](https://sudhanshumukherjeexx.github.io/power-bi/toolkit/ship-like-software.html#ci-cd).
