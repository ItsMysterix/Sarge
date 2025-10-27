# Sarge Conformance: DynamoDB subset

Supported operations:
- CreateTable (HASH or HASH+RANGE keys)
- DescribeTable
- PutItem
- GetItem
- Query
  - KeyConditionExpression forms:
    - pk = :v
    - pk = :v AND begins_with(sk, :p)
  - ExpressionAttributeValues support string, number, or base64-encoded binary via Dynamo JSON ({S|N|B})
- Scan
  - Limit and ExclusiveStartKey supported for simple pagination

Storage model:
- Filesystem-backed by default under `data/sarge/workspaces/default/dynamo/<table>/data/<pk>/<sk>.json`
- Keys are sanitized filenames; sort keys use `_` placeholder when absent

Error shapes:
- ResourceNotFoundException when a table is missing
- ValidationException for missing keys or unsupported expressions
- AccessDeniedException when IAM strict mode is enabled and evaluation denies access

Notes:
- Secondary indexes are not supported in this MVP
- Conditional writes, UpdateItem, Batch operations are not yet implemented
- Query/Scan projections and filters are not supported
