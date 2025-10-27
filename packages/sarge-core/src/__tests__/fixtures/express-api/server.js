const { DynamoDBClient, ListTablesCommand } = require('@aws-sdk/client-dynamodb')

async function main() {
  const ddb = new DynamoDBClient({})
  await ddb.send(new ListTablesCommand({}))
}
main().catch(() => {})
