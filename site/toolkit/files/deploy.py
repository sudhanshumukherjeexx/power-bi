"""Deploy the PBIP items in this repository to a Fabric workspace with fabric-cicd.

Local:  python deploy.py --workspace_name "Sales [Dev]" --environment dev
CI:     python deploy.py --spn-auth --workspace_name "Sales [Prod]" --environment prod

Credentials are never stored here: locally you sign in in the browser; in CI the pipeline signs in
with a service principal (azure/login) and this script uses that session.
Based on Microsoft's tutorial "Deploy Power BI projects (PBIP) using fabric-cicd".
"""
import argparse
from azure.identity import InteractiveBrowserCredential, AzureCliCredential
from fabric_cicd import FabricWorkspace, publish_all_items

parser = argparse.ArgumentParser(description="Deploy PBIP to Fabric")
parser.add_argument("--workspace_name", required=True, help="Target workspace name")
parser.add_argument("--environment", default="dev", help="Key used in parameter.yml (dev, test, prod)")
parser.add_argument("--spn-auth", action="store_true", help="Use the Azure CLI session (service principal) instead of a browser sign-in")
args = parser.parse_args()

credential = AzureCliCredential() if args.spn_auth else InteractiveBrowserCredential()

workspace = FabricWorkspace(
    workspace_name=args.workspace_name,
    environment=args.environment,
    repository_directory=".",
    item_type_in_scope=["SemanticModel", "Report"],
    token_credential=credential,
)
publish_all_items(workspace)
