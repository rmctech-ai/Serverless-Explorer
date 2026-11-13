/* ============ 05 DYNAMODB ============ */
LESSONS.push({
  id: 'dynamodb', num: 5, cat: 'data', layer: 3, mins: 16,
  title: 'DynamoDB for Serverless', short: 'Keys, get/put/query, conditional writes',
  overview: `<p><b>DynamoDB</b> is the default serverless database: no servers, single-digit-millisecond reads, pay per request, scales automatically. You design around <b>access patterns</b>: every item has a <b>partition key</b> (and optional <b>sort key</b>), and you fetch by key, not with arbitrary SQL.</p>`,
  hook: `<b>"Know your questions before you design the table."</b>`,
  why: `Lambda + DynamoDB is the most common serverless pair. Conditional writes and good keys prevent duplicate orders, hot partitions and expensive scans.`,
  scene: { type: 'graph', nodes: [
    { id: 'fn', x: 110, y: 240, icon: 'lambda', label: 'Function', sub: 'boto3 Table' },
    { id: 'tbl', x: 400, y: 240, icon: 'disk', label: 'invoices table', sub: 'PK customer · SK invoiceId' },
    { id: 'p1', x: 700, y: 100, icon: 'box', label: 'Partition: acme', sub: 'inv-1 · inv-2 · inv-7', at: 1 },
    { id: 'p2', x: 700, y: 380, icon: 'box', label: 'Partition: globex', sub: 'inv-3', at: 1 },
    { id: 'gsi', x: 400, y: 420, icon: 'search', label: 'GSI: by status', sub: 'alternate key', at: 4 }
  ], edges: [{ a: 'fn', b: 'tbl' }, { a: 'tbl', b: 'p1' }, { a: 'tbl', b: 'p2' }, { a: 'tbl', b: 'gsi' }] },
  steps: [
    { t: 'Items & keys', sub: 'Partition key (+ sort key)',
      body: `<p>An item is a JSON-like map. The <b>partition key</b> (e.g. <code>pk</code>) decides which partition stores it; a <b>sort key</b> (<code>sk</code>) orders items inside a partition. Together they form the primary key and must be unique. Other attributes are schemaless.</p>`,
      analogy: `A <b>filing cabinet</b>: partition key = drawer, sort key = folder order inside the drawer.`,
      hook: `<b>PK picks the drawer, SK sorts the folders.</b>`,
      words: ['partition key', 'sort key', 'primary key', 'item', 'attribute'],
      flow: { from: 'fn', to: 'tbl', label: 'PUT', detail: ['pk=CUSTOMER#acme sk=INV#inv-7'], color: 'blue' }, focus: ['fn', 'tbl'],
      cmds: [{ c: 'aws dynamodb put-item --table-name invoices --item \'{"pk":{"S":"CUSTOMER#acme"},"sk":{"S":"INV#inv-7"},"amount":{"N":"120"}}\'', o: '', k: 'cli' }] },
    { t: 'get_item vs query vs scan', sub: 'Fast, fast, expensive',
      body: `<p><code>get_item(Key=…)</code> fetches one item by full key. <code>query(KeyConditionExpression=Key("pk").eq("CUSTOMER#acme"))</code> fetches a partition, optionally filtered by sort key (<code>begins_with("INV#")</code>). <code>scan()</code> reads the <b>entire table</b>: slow and costly, so avoid it in request paths.</p>`,
      analogy: `get = <b>open one folder</b>; query = <b>pull one drawer</b>; scan = <b>empty every cabinet onto the floor</b>.`,
      hook: `<b>Get one, query a drawer, never scan in prod.</b>`,
      words: ['get_item', 'query', 'scan', 'KeyConditionExpression', 'begins_with'],
      flow: { from: 'tbl', to: 'p1', label: 'QUERY', detail: ['pk = CUSTOMER#acme AND begins_with(sk, "INV#")'], color: 'purple' }, focus: ['tbl', 'p1'],
      cmds: [{ c: 'from boto3.dynamodb.conditions import Key\nr = table.query(KeyConditionExpression=Key("pk").eq("CUSTOMER#acme") & Key("sk").begins_with("INV#"))\nprint(r["Count"])', f: 'app.py', o: '3', k: 'py' }] },
    { t: 'Conditional writes', sub: 'Prevent overwrites & duplicates',
      body: `<p>By default <code>put_item</code> <b>overwrites</b> an existing item with the same key. Add <code>ConditionExpression="attribute_not_exists(invoiceId)"</code> to only create new items; if it exists, DynamoDB raises <code>ConditionalCheckFailedException</code>, which you turn into a <b>409 Conflict</b>.</p>`,
      analogy: `"<b>Only write here if the box is empty</b>": no accidental overwrites.`,
      hook: `<b>attribute_not_exists = create-only.</b>`,
      words: ['ConditionExpression', 'attribute_not_exists', 'ConditionalCheckFailedException', '409', 'optimistic locking'],
      flow: { from: 'fn', to: 'tbl', label: 'CONDITION', detail: ['ConditionalCheckFailedException → 409'], color: 'red' }, focus: ['fn', 'tbl'],
      cmds: [{ c: 'try:\n    table.put_item(Item=item, ConditionExpression="attribute_not_exists(invoiceId)")\nexcept ClientError as e:\n    if e.response["Error"]["Code"] == "ConditionalCheckFailedException":\n        return resp(409, {"error": "already exists"})\n    raise', f: 'app.py', o: '', k: 'py' }] },
    { t: 'Updates & counters', sub: 'update_item, atomic ADD',
      body: `<p><code>update_item(Key=…, UpdateExpression="SET #s = :s", …)</code> changes attributes without rewriting the whole item. <code>ADD views :one</code> increments atomically, so it's safe even with 100 concurrent Lambdas. Use <code>ExpressionAttributeNames</code> for reserved words like <code>status</code>.</p>`,
      analogy: `Editing <b>one line on the form</b> instead of rewriting the whole form.`,
      hook: `<b>SET to change, ADD to count.</b>`,
      words: ['update_item', 'UpdateExpression', 'SET', 'ADD', 'ExpressionAttributeNames', 'atomic counter'],
      flow: { from: 'fn', to: 'p1', label: 'UPDATE', detail: ['SET #s = :paid'], color: 'amber' },
      cmds: [{ c: 'table.update_item(Key={"invoiceId": "inv-7"},\n    UpdateExpression="SET #s = :s",\n    ExpressionAttributeNames={"#s": "status"},\n    ExpressionAttributeValues={":s": "PAID"})', f: 'app.py', o: '', k: 'py' }] },
    { t: 'Design for access patterns', sub: 'GSIs, single-table, on-demand',
      body: `<p>List your queries first ("invoices by customer", "unpaid invoices"). Choose keys to serve them, and add a <b>Global Secondary Index</b> for alternate lookups (e.g. by status). Avoid hot partitions (one key getting all traffic). Start with <b>on-demand</b> billing; enable <b>point-in-time recovery</b> and TTL for expiring data.</p>`,
      analogy: `Design the <b>index of a book</b> based on what readers will look up.`,
      hook: `<b>Access patterns → keys → GSIs.</b>`,
      words: ['access patterns', 'GSI', 'single-table design', 'hot partition', 'TTL', 'PITR'],
      flow: { from: 'tbl', to: 'gsi', label: 'GSI', detail: ['status = UNPAID → 14 items'], color: 'teal' }, focus: ['tbl', 'gsi'],
      cmds: [{ c: 'aws dynamodb update-continuous-backups --table-name invoices --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true', o: '{\n    "ContinuousBackupsDescription": {"ContinuousBackupsStatus": "ENABLED"}\n}', k: 'cli' }] }
  ],
  summary: { title: 'You can use DynamoDB properly', sub: 'Keys · get/query · conditions · updates · design', text: `<p>Items are found by partition (+ sort) key. Use get_item for one, query for a partition, avoid scan. Conditional writes (<code>attribute_not_exists</code>) prevent overwrites; handle ConditionalCheckFailedException as 409. Update in place with SET/ADD. Design keys and GSIs from access patterns.</p>` },
  quiz: [
    { q: 'Fetch all invoices of one customer efficiently:', a: ['scan + filter', 'query on the partition key', 'get_item', 'export to S3'], c: 1, why: 'Query reads one partition.' },
    { q: 'put_item on an existing key without a condition…', a: ['Fails', 'Overwrites the item', 'Creates a duplicate', 'Merges'], c: 1, why: 'Use attribute_not_exists to prevent it.' },
    { q: 'Safe concurrent counter increment:', a: ['get then put', 'update_item with ADD', 'scan', 'delete+put'], c: 1, why: 'ADD is atomic.' },
    { q: 'Look up by a non-key attribute (status):', a: ['GSI', 'Bigger table', 'Lambda layer', 'SQS'], c: 0, why: 'Global secondary index.' }
  ],
  challenge: { task: 'Write create(event, context): read invoiceId and amount from the JSON body, put_item into TABLE with ConditionExpression="attribute_not_exists(invoiceId)", return 201. If the invoice already exists (ConditionalCheckFailedException) return 409. Calling it twice with the same invoiceId must give 201 then 409, with only ONE successful write.',
    hint: R`import json, os, boto3
from botocore.exceptions import ClientError

TABLE = boto3.resource("dynamodb").Table(os.environ["TABLE_NAME"])

def create(event, context):
    body = json.loads(event.get("body") or "{}")
    item = {"invoiceId": body["invoiceId"], "amount": body["amount"]}
    try:
        TABLE.put_item(Item=item, ConditionExpression="attribute_not_exists(invoiceId)")
    except ClientError as e:
        if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
            return {"statusCode": 409, "body": json.dumps({"error": "invoice already exists"})}
        raise
    return {"statusCode": 201, "body": json.dumps(item)}

ev = dict(events["api"], body=json.dumps({"invoiceId": "inv-42", "amount": 99}))
print(create(ev, context)["statusCode"], create(ev, context)["statusCode"])
`,
    starter: R`import json, os, boto3
from botocore.exceptions import ClientError

TABLE = boto3.resource("dynamodb").Table(os.environ["TABLE_NAME"])

def create(event, context):
    body = json.loads(event.get("body") or "{}")
    item = {"invoiceId": body["invoiceId"], "amount": body["amount"]}
    TABLE.put_item(Item=item)          # silently overwrites!
    return {"statusCode": 201, "body": json.dumps(item)}

ev = dict(events["api"], body=json.dumps({"invoiceId": "inv-42", "amount": 99}))
print(create(ev, context)["statusCode"], create(ev, context)["statusCode"])
`,
    check: R`_t(lambda: (lambda ev: [create(ev, context)["statusCode"], create(ev, context)["statusCode"]] == [201, 409] and len([c for c in calls("dynamodb", "PutItem") if not c.get("failed")]) == 1)(dict(events["api"], body=json.dumps({"invoiceId": "inv-9", "amount": 5}))))` },
  next: `Data can also arrive as files. Next: <b>S3 event triggers</b>: run a function every time an object lands in a bucket.`,
  cheat: [['table.get_item(Key={"id": x})', 'one item'], ['table.query(KeyConditionExpression=Key("pk").eq(v))', 'a partition'], ['ConditionExpression="attribute_not_exists(id)"', 'create-only'], ['ConditionalCheckFailedException', '→ 409'], ['UpdateExpression="ADD n :one"', 'atomic counter'], ['scan()', 'avoid in request path']]
});

/* ============ 06 S3 EVENTS ============ */
LESSONS.push({
  id: 's3-events', num: 6, cat: 'data', layer: 3, mins: 14,
  title: 'S3 Event Triggers', short: 'Object created → function runs',
  overview: `<p>S3 can invoke Lambda (directly or via EventBridge) when objects are created or deleted. The event carries <b>bucket name</b> and <b>object key</b>, not the file contents; your function downloads what it needs. Classic uses: thumbnails, CSV imports, virus scans, document AI pipelines.</p>`,
  hook: `<b>"The event is a pointer, not the package."</b>`,
  why: `File-driven automation (invoices, receipts, reports → extract → database) is one of the most requested AI automation projects.`,
  scene: { type: 'graph', nodes: [
    { id: 'up', x: 100, y: 240, icon: 'user', label: 'Upload', sub: 'reports/Nov report.csv' },
    { id: 's3', x: 320, y: 240, icon: 'bucket', label: 'raul-uploads', sub: 'ObjectCreated:*' },
    { id: 'fn', x: 560, y: 240, icon: 'lambda', label: 'process_upload', sub: 'parse & index', at: 1 },
    { id: 'ddb', x: 800, y: 120, icon: 'disk', label: 'files table', sub: 'metadata', at: 3 },
    { id: 'out', x: 800, y: 380, icon: 'bucket', label: 'raul-processed', sub: 'different bucket!', at: 4 }
  ], edges: [{ a: 'up', b: 's3' }, { a: 's3', b: 'fn' }, { a: 'fn', b: 'ddb' }, { a: 'fn', b: 'out' }] },
  steps: [
    { t: 'Configure the trigger', sub: 'Event types, prefix, suffix',
      body: `<p>A bucket notification picks event types (<code>s3:ObjectCreated:*</code>) and filters (prefix <code>reports/</code>, suffix <code>.csv</code>). S3 needs permission to invoke the function (a resource-based policy, added automatically by the console/SAM).</p>`,
      analogy: `A <b>motion sensor</b> on one shelf of the warehouse.`,
      hook: `<b>Event type + prefix + suffix = only the files you want.</b>`,
      words: ['bucket notification', 'ObjectCreated', 'prefix', 'suffix', 'resource-based policy'],
      flow: { from: 'up', to: 's3', label: 'PUT', detail: ['reports/2026/Nov report v2.csv'], color: 'blue' }, focus: ['up', 's3'],
      cmds: [{ c: 'aws s3 cp "Nov report v2.csv" "s3://raul-uploads/reports/2026/Nov report v2.csv"', o: 'upload: ./Nov report v2.csv to s3://raul-uploads/reports/2026/Nov report v2.csv', k: 'cli' }] },
    { t: 'Read the record', sub: 'bucket + key (URL-encoded!)',
      body: `<p>Loop over <code>event["Records"]</code> (there can be several). Get <code>rec["s3"]["bucket"]["name"]</code> and <code>rec["s3"]["object"]["key"]</code>. The key is <b>URL-encoded</b>: spaces become <code>+</code>, so decode with <code>urllib.parse.unquote_plus</code>, or you'll get NoSuchKey.</p>`,
      analogy: `The address on the parcel slip is written in <b>shorthand</b>; translate it before you go looking.`,
      hook: `<b>unquote_plus the key. Every time.</b>`,
      words: ['Records', 'bucket name', 'object key', 'unquote_plus', 'NoSuchKey'],
      flow: { from: 's3', to: 'fn', label: 'EVENT', detail: ['key = reports/2026/Nov+report+v2.csv'], color: 'purple' }, focus: ['s3', 'fn'],
      cmds: [{ c: 'from urllib.parse import unquote_plus\nprint(unquote_plus("reports/2026/Nov+report+v2.csv"))', f: 'playground.py', o: 'reports/2026/Nov report v2.csv', k: 'py' }] },
    { t: 'Fetch the object', sub: 'get_object only when needed',
      body: `<p><code>s3.get_object(Bucket=b, Key=k)["Body"].read()</code> downloads the content. For big files, stream or use <code>/tmp</code> (up to 10 GB). Often you only need metadata (size, key, type), which is already in the event.</p>`,
      analogy: `Only <b>open the parcel</b> if you need what's inside.`,
      hook: `<b>Metadata in the event; content via get_object.</b>`,
      words: ['get_object', 'Body.read()', '/tmp', 'streaming', 'object size'],
      flow: { from: 'fn', to: 's3', label: 'GET', detail: ['GetObject 2,048 bytes'], color: 'amber' },
      cmds: [{ c: 'aws s3api head-object --bucket raul-uploads --key "reports/2026/Nov report v2.csv" --query "[ContentLength,ContentType]"', o: '[\n    2048,\n    "text/csv"\n]', k: 'cli' }] },
    { t: 'Record the result', sub: 'Metadata into DynamoDB',
      body: `<p>Typical pattern: write a row per file (key, size, status, extracted fields) so other services can query it. Make it <b>idempotent</b>: S3 can deliver the same event more than once, so use the key as the item ID.</p>`,
      analogy: `Log every delivery in the <b>receiving ledger</b>, by parcel number, so duplicates are obvious.`,
      hook: `<b>Key as ID = duplicate-safe.</b>`,
      words: ['metadata', 'idempotent', 'at-least-once delivery', 'put_item'],
      flow: { from: 'fn', to: 'ddb', label: 'PUT', detail: ['{"id": "reports/2026/Nov report v2.csv", "size": 2048}'], color: 'green' }, focus: ['fn', 'ddb'],
      cmds: [{ c: 'TABLE.put_item(Item={"id": key, "bucket": bucket, "size": size, "status": "RECEIVED"})', f: 'app.py', o: '', k: 'py' }] },
    { t: 'The infinite loop trap', sub: 'Never write back to the trigger bucket',
      body: `<p>If your function writes its output to the <b>same bucket/prefix</b> that triggers it, each write triggers another invocation: an infinite loop and a surprise bill. Write to a <b>different bucket</b> or a prefix not covered by the trigger. Lambda now detects some recursive loops, but don't rely on it.</p>`,
      analogy: `A <b>microphone next to its own speaker</b>: feedback screech.`,
      hook: `<b>Output bucket ≠ input bucket.</b>`,
      words: ['recursive invocation', 'infinite loop', 'separate output bucket', 'recursive loop detection'],
      flow: { from: 'fn', to: 'out', label: 'WRITE', detail: ['s3://raul-processed/… (not the trigger bucket)'], color: 'red' }, focus: ['fn', 'out'],
      cmds: [{ c: 'aws lambda get-function-recursion-config --function-name raul-process-upload', o: '{\n    "RecursiveLoop": "Terminate"\n}', k: 'cli' }] }
  ],
  summary: { title: 'You can automate file pipelines', sub: 'Trigger · decode key · fetch · record · no loops', text: `<p>Filter S3 notifications by event type, prefix and suffix. Loop over Records, URL-decode keys with <code>unquote_plus</code>, fetch contents only if needed, store metadata idempotently by key, and never write outputs back into the triggering bucket/prefix.</p>` },
  quiz: [
    { q: 'An S3 event contains…', a: ['The full file', 'Bucket name and object key', 'Only the ETag', 'Nothing'], c: 1, why: 'Fetch content with get_object.' },
    { q: 'Key "my+file.csv" in the event means the real key is…', a: ['my+file.csv', 'my file.csv', 'my%2Bfile.csv', 'myfile.csv'], c: 1, why: 'unquote_plus decodes + to space.' },
    { q: 'Writing output to the trigger bucket causes…', a: ['Faster runs', 'An infinite loop', 'Encryption', 'Nothing'], c: 1, why: 'Each write triggers again.' },
    { q: 'Why use the object key as the DynamoDB ID?', a: ['Shorter', 'Idempotency on duplicate events', 'Required by S3', 'Encryption'], c: 1, why: 'Duplicate deliveries overwrite the same row.' }
  ],
  challenge: { task: 'Write process_upload(event, context): for EVERY record, decode the key with unquote_plus and put_item into TABLE {"id": <decoded key>, "bucket": <bucket>, "size": <size>}. Return {"processed": <number of records>}.',
    hint: R`import os, boto3
from urllib.parse import unquote_plus

TABLE = boto3.resource("dynamodb").Table(os.environ["TABLE_NAME"])

def process_upload(event, context):
    for rec in event["Records"]:
        bucket = rec["s3"]["bucket"]["name"]
        key = unquote_plus(rec["s3"]["object"]["key"])
        size = rec["s3"]["object"]["size"]
        TABLE.put_item(Item={"id": key, "bucket": bucket, "size": size})
    return {"processed": len(event["Records"])}

invoke(process_upload, events["s3"])
print(calls("dynamodb"))
`,
    starter: R`import os, boto3

TABLE = boto3.resource("dynamodb").Table(os.environ["TABLE_NAME"])

def process_upload(event, context):
    rec = event["Records"][0]                 # only the first record?
    key = rec["s3"]["object"]["key"]          # still URL-encoded!
    TABLE.put_item(Item={"id": key})
    return {"processed": 1}

invoke(process_upload, events["s3"])
`,
    check: R`_t(lambda: (lambda ev: process_upload(ev, context) == {"processed": 2} and sorted(c["item"]["id"] for c in calls("dynamodb", "PutItem")) == ["in/a b.csv", "reports/2026/Nov report v2.csv"] and all(c["item"].get("bucket") == "raul-uploads" and "size" in c["item"] for c in calls("dynamodb", "PutItem")))({"Records": events["s3"]["Records"] + [{"s3": {"bucket": {"name": "raul-uploads"}, "object": {"key": "in/a+b.csv", "size": 10}}}]}))` },
  next: `S3 triggers call Lambda directly. For reliable, buffered processing at scale you want a queue. Next: <b>SQS + Lambda</b>: batches, retries, partial failures and dead-letter queues.`,
  cheat: [['for rec in event["Records"]:', 'loop records'], ['unquote_plus(rec["s3"]["object"]["key"])', 'decode key'], ['s3.get_object(Bucket=b, Key=k)["Body"].read()', 'download'], ['prefix / suffix filters', 'limit triggers'], ['output bucket ≠ trigger bucket', 'avoid loops']]
});

/* ============ 07 SQS ============ */
LESSONS.push({
  id: 'sqs', num: 7, cat: 'msg', layer: 3, mins: 16,
  title: 'SQS + Lambda: Queues Done Right', short: 'Batches, retries, partial failures, DLQ',
  overview: `<p><b>SQS</b> is a durable queue between producers and consumers. Lambda polls it and invokes your function with <b>batches</b> of messages. If the function fails, messages become visible again and are retried; after <code>maxReceiveCount</code> failures they go to a <b>dead-letter queue (DLQ)</b>.</p>`,
  hook: `<b>"Queue it, batch it, retry it, dead-letter it."</b>`,
  why: `Queues absorb traffic spikes, decouple services and make failures recoverable. Partial batch responses are a frequent interview topic and a real money-saver.`,
  scene: { type: 'graph', nodes: [
    { id: 'prod', x: 100, y: 240, icon: 'api', label: 'Producer', sub: 'send_message' },
    { id: 'q', x: 330, y: 240, icon: 'list', label: 'orders queue', sub: 'SQS standard' },
    { id: 'fn', x: 580, y: 240, icon: 'lambda', label: 'process_orders', sub: 'batch of 10', at: 1 },
    { id: 'ddb', x: 820, y: 120, icon: 'disk', label: 'orders table', sub: 'processed', at: 2 },
    { id: 'dlq', x: 820, y: 380, icon: 'bug', label: 'orders-dlq', sub: 'poison messages', at: 4 }
  ], edges: [{ a: 'prod', b: 'q' }, { a: 'q', b: 'fn' }, { a: 'fn', b: 'ddb' }, { a: 'q', b: 'dlq' }] },
  steps: [
    { t: 'Why a queue', sub: 'Decouple and buffer',
      body: `<p>Producers (an API, a webhook) drop messages and move on. Consumers process at their own pace. A spike of 10,000 orders waits safely in the queue instead of crushing your database. <b>Standard</b> queues: near-unlimited throughput, at-least-once, best-effort order. <b>FIFO</b>: exactly-once processing and strict order per group, lower throughput.</p>`,
      analogy: `A <b>ticket line at the deli</b>: customers take a number, the cook serves one at a time.`,
      hook: `<b>Standard = fast, maybe twice. FIFO = in order, once.</b>`,
      words: ['SQS', 'decoupling', 'buffer', 'standard queue', 'FIFO', 'at-least-once'],
      flow: { from: 'prod', to: 'q', label: 'SEND', detail: ['{"orderId": "o-1", "qty": 2}'], color: 'blue' }, focus: ['prod', 'q'],
      cmds: [{ c: 'aws sqs send-message --queue-url $QUEUE_URL --message-body \'{"orderId":"o-1","qty":2}\'', o: '{\n    "MessageId": "5fea7756-0ea4-451a-a703-a558b933e274"\n}', k: 'cli' }] },
    { t: 'Batches', sub: 'Records[] up to 10 (or more)',
      body: `<p>The event source mapping polls SQS and invokes your function with <code>event["Records"]</code>, each with <code>messageId</code> and <code>body</code> (a string). Batch size up to 10 (or 10,000 with a batching window). Bigger batches = fewer invocations = cheaper.</p>`,
      analogy: `The cook takes <b>ten tickets at once</b> instead of walking to the counter ten times.`,
      hook: `<b>One invocation, many messages.</b>`,
      words: ['event source mapping', 'batch size', 'batching window', 'messageId', 'receiptHandle'],
      flow: { from: 'q', to: 'fn', label: 'BATCH', detail: ['Records: m-1, m-2, m-3'], color: 'purple' }, focus: ['q', 'fn'],
      cmds: [{ c: 'aws lambda create-event-source-mapping --function-name raul-process-orders --event-source-arn arn:aws:sqs:ap-southeast-1:111122223333:orders --batch-size 10 --function-response-types ReportBatchItemFailures', o: '{\n    "UUID": "a1b2…",\n    "BatchSize": 10,\n    "FunctionResponseTypes": ["ReportBatchItemFailures"],\n    "State": "Creating"\n}', k: 'cli' }] },
    { t: 'Visibility & retries', sub: 'Fail → message reappears',
      body: `<p>When Lambda receives a batch, the messages become invisible for the <b>visibility timeout</b>. Success → Lambda deletes them. An exception → the <b>whole batch</b> reappears and is retried, including messages that already succeeded (so processing must be idempotent). Set visibility timeout ≥ 6× function timeout.</p>`,
      analogy: `A ticket is <b>taken off the board</b> while being cooked; if the cook drops it, it goes back up.`,
      hook: `<b>Exception = whole batch back in line.</b>`,
      words: ['visibility timeout', 'retry', 'delete on success', 'idempotency'],
      flow: { from: 'fn', to: 'q', label: 'RETRY', detail: ['batch failed → visible again'], color: 'amber' },
      cmds: [{ c: 'aws sqs get-queue-attributes --queue-url $QUEUE_URL --attribute-names VisibilityTimeout ApproximateNumberOfMessages', o: '{\n    "Attributes": {\n        "VisibilityTimeout": "180",\n        "ApproximateNumberOfMessages": "42"\n    }\n}', k: 'cli' }] },
    { t: 'Partial batch failures', sub: 'Return batchItemFailures',
      body: `<p>Enable <code>ReportBatchItemFailures</code> and return <code>{"batchItemFailures": [{"itemIdentifier": messageId}, …]}</code> listing only the failed messages. Lambda deletes the successful ones and retries just the failures. Don't raise in that case: catch per-message errors.</p>`,
      analogy: `Tell the manager "<b>tickets 2 and 7 failed</b>" instead of "the whole batch failed".`,
      hook: `<b>Catch per message, report only the failures.</b>`,
      words: ['ReportBatchItemFailures', 'batchItemFailures', 'itemIdentifier', 'partial batch response'],
      flow: { from: 'fn', to: 'ddb', label: 'PARTIAL', detail: ['ok: m-1, m-3 · failed: m-2'], color: 'green' }, focus: ['fn', 'ddb'],
      cmds: [{ c: 'return {"batchItemFailures": [{"itemIdentifier": "m-2"}]}', f: 'app.py', o: '', k: 'py' }] },
    { t: 'Dead-letter queue', sub: 'Park poison messages',
      body: `<p>A <b>redrive policy</b> moves a message to the DLQ after <code>maxReceiveCount</code> receives (e.g. 5). Alarm on DLQ depth > 0, inspect, fix the bug, then <b>redrive</b> messages back to the source queue. Without a DLQ, a bad message retries until retention expires (default 4 days).</p>`,
      analogy: `The <b>"problem orders" tray</b>: set aside so the line keeps moving, reviewed by a human later.`,
      hook: `<b>Every queue gets a DLQ and an alarm.</b>`,
      words: ['DLQ', 'redrive policy', 'maxReceiveCount', 'poison message', 'start-message-move-task'],
      flow: { from: 'q', to: 'dlq', label: 'DLQ', detail: ['m-2 failed 5× → orders-dlq'], color: 'red' }, focus: ['q', 'dlq'],
      cmds: [{ c: 'aws sqs start-message-move-task --source-arn arn:aws:sqs:ap-southeast-1:111122223333:orders-dlq', o: '{\n    "TaskHandle": "eyJ0YXNrSWQiOi…"\n}', k: 'cli' }] }
  ],
  summary: { title: 'You can build reliable queues', sub: 'Decouple · batch · retry · partial failures · DLQ', text: `<p>SQS buffers and decouples. Lambda gets batches in <code>Records</code>; an exception retries the whole batch, so make processing idempotent and prefer partial batch responses (<code>batchItemFailures</code>). Always configure a DLQ with an alarm and redrive after fixing.</p>` },
  quiz: [
    { q: 'Without partial batch responses, one bad message causes…', a: ['Only it to retry', 'The whole batch to retry', 'Deletion', 'Nothing'], c: 1, why: 'Exception = batch failure.' },
    { q: 'Return format for partial failures:', a: ['{"failed": [...]}', '{"batchItemFailures": [{"itemIdentifier": id}]}', 'raise Exception', '{"statusCode": 500}'], c: 1, why: 'Requires ReportBatchItemFailures.' },
    { q: 'Strict ordering per customer:', a: ['Standard queue', 'FIFO queue with MessageGroupId', 'SNS', 'S3'], c: 1, why: 'FIFO orders within a group.' },
    { q: 'Messages move to the DLQ after…', a: ['1 hour', 'maxReceiveCount receives', 'Visibility timeout', 'Never'], c: 1, why: 'Redrive policy.' }
  ],
  challenge: { task: 'Write process_orders(event, context) for an SQS batch: for each record, json.loads the body and put_item {"orderId", "qty"} into TABLE. If a message is not valid JSON, do NOT raise: collect its messageId. Return {"batchItemFailures": [{"itemIdentifier": id} for each failed message]}. With events["sqs"], m-2 must be the only failure and two orders must be saved.',
    hint: R`import json, os, boto3

TABLE = boto3.resource("dynamodb").Table(os.environ["TABLE_NAME"])

def process_orders(event, context):
    failures = []
    for rec in event["Records"]:
        try:
            order = json.loads(rec["body"])
            TABLE.put_item(Item={"orderId": order["orderId"], "qty": order["qty"]})
        except Exception as e:
            print(f"failed {rec['messageId']}: {e}")
            failures.append({"itemIdentifier": rec["messageId"]})
    return {"batchItemFailures": failures}

invoke(process_orders, events["sqs"])
`,
    starter: R`import json, os, boto3

TABLE = boto3.resource("dynamodb").Table(os.environ["TABLE_NAME"])

def process_orders(event, context):
    for rec in event["Records"]:
        order = json.loads(rec["body"])        # m-2 is not JSON -> whole batch fails!
        TABLE.put_item(Item={"orderId": order["orderId"], "qty": order["qty"]})
    return {}

invoke(process_orders, events["sqs"])
`,
    check: R`_t(lambda: process_orders(events["sqs"], context) == {"batchItemFailures": [{"itemIdentifier": "m-2"}]} and sorted(c["item"]["orderId"] for c in calls("dynamodb", "PutItem")) == ["o-1", "o-3"])` },
  next: `Queues are one-to-one. For one-to-many ("an order was placed, tell billing, shipping and email") you need <b>SNS and EventBridge</b>.`,
  cheat: [['sqs.send_message(QueueUrl=u, MessageBody=json.dumps(m))', 'produce'], ['for rec in event["Records"]: json.loads(rec["body"])', 'consume'], ['{"batchItemFailures": [{"itemIdentifier": id}]}', 'partial failure'], ['--function-response-types ReportBatchItemFailures', 'enable it'], ['VisibilityTimeout ≥ 6 × fn timeout', 'rule of thumb'], ['RedrivePolicy maxReceiveCount', 'DLQ']]
});
