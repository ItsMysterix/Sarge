# Dynamo Subset (MVP)

Supported operations:
- CreateTable (HASH or HASH+RANGE keys)
- DescribeTable
- PutItem
- GetItem
- Query
  - KeyConditionExpression forms:
    - pk = :v
    - pk = :v AND begins_with(sk, :p)
- Scan
  - Limit and ExclusiveStartKey supported (basic pagination)

Storage model:
- Filesystem-backed at `data/sarge/workspaces/default/dynamo/<table>/data/<pk>/<sk>.json`
- Keys are sanitized for filesystem safety; missing sort key stored as `_`

Error shapes:
- ResourceNotFoundException when a table is missing
- ValidationException for missing keys/unsupported expressions

Not yet supported:
- Secondary indexes, conditional writes, update/delete item, batch ops, projections/filters
