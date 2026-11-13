/* ============ 11 OBSERVABILITY ============ */
LESSONS.push({
  id: 'observability', num: 11, cat: 'prod', layer: 5, mins: 14,
  title: 'Observability: Logs, Metrics, Traces', short: 'Structured logs, EMF metrics, X-Ray, Powertools',
  overview: `<p>When something breaks at 2am you need to answer: <b>what happened, how often, and where?</b> That's <b>logs</b> (structured JSON, searchable with Logs Insights), <b>metrics</b> (counts and latencies, alarms) and <b>traces</b> (X-Ray: the path of one request across services).</p>`,
  hook: `<b>"Logs tell the story, metrics sound the alarm, traces show the path."</b>`,
  why: `Debugging distributed serverless systems without structured logs and traces is guesswork. Observability is also a key security control (audit and anomaly detection).`,
  scene: { type: 'graph', nodes: [
    { id: 'fn', x: 120, y: 240, icon: 'lambda', label: 'Function', sub: 'Powertools' },
    { id: 'logs', x: 400, y: 100, icon: 'log', label: 'CloudWatch Logs', sub: 'JSON lines', at: 1 },
    { id: 'ins', x: 700, y: 100, icon: 'search', label: 'Logs Insights', sub: 'query by field', at: 2 },
    { id: 'met', x: 400, y: 380, icon: 'cpu', label: 'Metrics (EMF)', sub: 'OrdersPlaced', at: 3 },
    { id: 'alarm', x: 700, y: 380, icon: 'bell', label: 'Alarm → SNS', sub: 'errors > 1/min', at: 3 },
    { id: 'xray', x: 700, y: 240, icon: 'eye', label: 'X-Ray trace', sub: 'API → λ → DynamoDB', at: 4 }
  ], edges: [{ a: 'fn', b: 'logs' }, { a: 'logs', b: 'ins' }, { a: 'fn', b: 'met' }, { a: 'met', b: 'alarm' }, { a: 'fn', b: 'xray' }] },
  steps: [
    { t: 'Structured logging', sub: 'JSON, not prose',
      body: `<p>Instead of <code>print("order failed")</code>, log one JSON object per line: <code>{"level": "ERROR", "message": "order failed", "orderId": "o-9", "request_id": "…"}</code>. Now you can filter by any field. Always include the <b>request ID</b> and business IDs; never log secrets or full card numbers.</p>`,
      analogy: `A <b>spreadsheet row</b> vs a scribbled sticky note: one can be sorted and filtered.`,
      hook: `<b>One JSON object per log line, with request_id.</b>`,
      words: ['structured logging', 'JSON logs', 'request_id', 'correlation ID', 'log level'],
      flow: { from: 'fn', to: 'logs', label: 'LOG', detail: ['{"level":"ERROR","orderId":"o-9",…}'], color: 'blue' }, focus: ['fn', 'logs'],
      cmds: [{ c: 'print(json.dumps({"level": "INFO", "message": "order placed", "orderId": "o-9", "request_id": context.aws_request_id}))', f: 'app.py', o: '{"level": "INFO", "message": "order placed", "orderId": "o-9", "request_id": "c0ffee00-…"}', k: 'py' }] },
    { t: 'Logs Insights', sub: 'Query your logs',
      body: `<p>CloudWatch Logs Insights queries JSON fields directly: <code>fields @timestamp, orderId | filter level = "ERROR" | stats count() by bin(5m)</code>. Set <b>log retention</b> (default is never-expire, which slowly costs money) and use Lambda's native JSON log format setting.</p>`,
      analogy: `A <b>search engine</b> for your function's diary.`,
      hook: `<b>fields · filter · stats · sort · limit.</b>`,
      words: ['Logs Insights', 'filter', 'stats', 'log retention', 'LogFormat JSON'],
      flow: { from: 'logs', to: 'ins', label: 'QUERY', detail: ['filter level="ERROR" | stats count()'], color: 'purple' }, focus: ['logs', 'ins'],
      cmds: [{ c: 'aws logs start-query --log-group-name /aws/lambda/raul-place-order --start-time $(date -d "-1 hour" +%s) --end-time $(date +%s) --query-string \'fields @timestamp, orderId | filter level = "ERROR" | sort @timestamp desc | limit 20\'', o: '{\n    "queryId": "b2f1c3…"\n}', k: 'cli' }] },
    { t: 'Metrics & alarms', sub: 'Built-in + custom (EMF)',
      body: `<p>Free built-in metrics: <b>Invocations, Errors, Throttles, Duration, ConcurrentExecutions, IteratorAge</b>. Business metrics (OrdersPlaced, RevenueUSD) can be emitted cheaply with the <b>Embedded Metric Format</b>: a special JSON log line CloudWatch turns into a metric. Alarm on errors, p99 duration and DLQ depth.</p>`,
      analogy: `Metrics are the <b>dashboard gauges</b>; alarms are the <b>warning lights</b>.`,
      hook: `<b>Errors · Throttles · Duration p99 · DLQ depth.</b>`,
      words: ['CloudWatch metrics', 'EMF', 'custom metric', 'p99', 'alarm', 'IteratorAge'],
      flow: { from: 'met', to: 'alarm', label: 'ALARM', detail: ['Errors ≥ 1 for 1 min → SNS'], color: 'red' }, focus: ['fn', 'met', 'alarm'],
      cmds: [{ c: 'print(json.dumps({"_aws": {"Timestamp": 1731500000000, "CloudWatchMetrics": [{"Namespace": "RaulShop", "Dimensions": [["Service"]], "Metrics": [{"Name": "OrdersPlaced", "Unit": "Count"}]}]}, "Service": "orders", "OrdersPlaced": 1}))', f: 'app.py', o: '', k: 'py' }] },
    { t: 'Tracing with X-Ray', sub: 'Follow one request',
      body: `<p>Enable <b>active tracing</b> and X-Ray shows each request as a timeline: API Gateway → Lambda (init + handler) → DynamoDB → SNS, with latency and errors per segment. The service map reveals the slow or failing dependency instantly.</p>`,
      analogy: `A <b>GPS track</b> of one parcel through every depot.`,
      hook: `<b>Logs say what, traces say where.</b>`,
      words: ['X-Ray', 'active tracing', 'segment', 'subsegment', 'service map', 'ADOT'],
      flow: { from: 'fn', to: 'xray', label: 'TRACE', detail: ['DynamoDB PutItem 38 ms of 52 ms'], color: 'amber' }, focus: ['fn', 'xray'],
      cmds: [{ c: 'aws lambda update-function-configuration --function-name raul-place-order --tracing-config Mode=Active', o: '{\n    "TracingConfig": {"Mode": "Active"}\n}', k: 'cli' }] },
    { t: 'Powertools for AWS Lambda', sub: 'Batteries included',
      body: `<p><b>Powertools</b> (Python, TS, Java, .NET) gives you <code>Logger</code> (structured JSON + request ID), <code>Metrics</code> (EMF), <code>Tracer</code> (X-Ray), plus idempotency, batch processing, parameters/secrets caching and event parsing. It's AWS-maintained and the fastest way to production-grade functions.</p>`,
      analogy: `A <b>pro tool belt</b> instead of carrying loose screwdrivers.`,
      hook: `<b>Logger · Metrics · Tracer · Idempotency · Batch.</b>`,
      words: ['Powertools', 'Logger', 'Metrics', 'Tracer', 'inject_lambda_context', 'BatchProcessor'],
      flow: { from: 'fn', to: 'ins', label: 'POWERTOOLS', detail: ['cold_start, function_name, xray_trace_id auto-added'], color: 'green' },
      cmds: [{ c: 'from aws_lambda_powertools import Logger, Metrics, Tracer\nlogger, metrics, tracer = Logger(), Metrics(namespace="RaulShop"), Tracer()\n\n@logger.inject_lambda_context\n@tracer.capture_lambda_handler\n@metrics.log_metrics\ndef lambda_handler(event, context):\n    logger.info("order placed", extra={"orderId": "o-9"})\n    metrics.add_metric(name="OrdersPlaced", unit="Count", value=1)', f: 'app.py', o: '', k: 'py' }] }
  ],
  summary: { title: 'You can see inside your system', sub: 'JSON logs · Insights · metrics/alarms · X-Ray · Powertools', text: `<p>Log one JSON object per line with request and business IDs (no secrets). Query with Logs Insights and set retention. Alarm on Errors, Throttles, p99 Duration and DLQ depth; emit business metrics with EMF. Trace requests with X-Ray. Powertools packages all of it.</p>` },
  quiz: [
    { q: 'Best log line format:', a: ['Free text', 'One JSON object with fields', 'XML', 'CSV header once'], c: 1, why: 'Queryable by field.' },
    { q: 'Find which downstream call is slow:', a: ['Logs only', 'X-Ray trace', 'Billing', 'IAM'], c: 1, why: 'Per-segment latency.' },
    { q: 'Cheap custom business metrics from Lambda:', a: ['PutMetricData per call', 'Embedded Metric Format log lines', 'S3', 'SNS'], c: 1, why: 'EMF is async and cheap.' },
    { q: 'Never log…', a: ['request_id', 'orderId', 'passwords and secrets', 'duration'], c: 2, why: 'Logs are widely readable.' }
  ],
  challenge: { task: 'Write log(level, message, context, **fields) that prints ONE JSON line with keys level, message, request_id (context.aws_request_id) plus any extra fields, and drops any field named password, secret or token. Then make handler(event, context) call log("INFO", "order placed", context, orderId="o-9", password="hunter2") and return {"ok": True}.',
    hint: R`import json

SENSITIVE = {"password", "secret", "token"}

def log(level, message, context, **fields):
    entry = {"level": level, "message": message, "request_id": context.aws_request_id}
    entry.update({k: v for k, v in fields.items() if k.lower() not in SENSITIVE})
    print(json.dumps(entry))

def handler(event, context):
    log("INFO", "order placed", context, orderId="o-9", password="hunter2")
    return {"ok": True}

invoke(handler, events["api"])
`,
    starter: R`def handler(event, context):
    print("order placed for o-9 with password hunter2")   # unsearchable AND leaks a secret
    return {"ok": True}

invoke(handler, events["api"])
`,
    check: R`(lambda lines: any(l.get("level") == "INFO" and l.get("message") == "order placed" and l.get("orderId") == "o-9" and l.get("request_id") and "password" not in l for l in lines) and "hunter2" not in __out__)([json.loads(x) for x in __out__.splitlines() if x.startswith("{")])` },
  next: `You can see everything. Now lock it down: <b>serverless security</b>: least-privilege roles, secrets, input validation and resource policies.`,
  cheat: [['print(json.dumps({...}))', 'structured log'], ['fields … | filter … | stats count()', 'Logs Insights'], ['Errors · Throttles · Duration · IteratorAge', 'key metrics'], ['--tracing-config Mode=Active', 'X-Ray'], ['Logger · Metrics · Tracer', 'Powertools'], ['retention-in-days', 'cap log cost']]
});

/* ============ 12 SECURITY ============ */
LESSONS.push({
  id: 'sls-security', num: 12, cat: 'prod', layer: 6, mins: 16,
  title: 'Serverless Security', short: 'Least privilege, secrets, validation, resource policies',
  overview: `<p>Serverless removes OS patching from your plate but not security. Your attack surface is <b>code, permissions, configuration and data</b>: an over-permissive role, a secret in an env var, unvalidated input, or a public Function URL can each become a breach.</p>`,
  hook: `<b>"Small functions, small roles, no secrets in code."</b>`,
  why: `Cloud Security interviews always ask "how do you secure a Lambda?". These controls (one role per function, Secrets Manager, validation, resource policies) map directly to the OWASP Serverless Top 10.`,
  scene: { type: 'graph', nodes: [
    { id: 'atk', x: 100, y: 240, icon: 'bug', label: 'Attacker input', sub: 'injection · oversized' },
    { id: 'api', x: 320, y: 240, icon: 'api', label: 'API + authorizer', sub: 'auth · validation · WAF' },
    { id: 'fn', x: 560, y: 240, icon: 'lambda', label: 'Function', sub: 'validates again', at: 1 },
    { id: 'role', x: 560, y: 80, icon: 'key', label: 'Role: 1 table, 2 actions', sub: 'least privilege', at: 2 },
    { id: 'sec', x: 800, y: 160, icon: 'vault', label: 'Secrets Manager', sub: 'cached, rotated', at: 3 },
    { id: 'pol', x: 800, y: 380, icon: 'shield', label: 'Resource policy', sub: 'who may invoke', at: 4 }
  ], edges: [{ a: 'atk', b: 'api' }, { a: 'api', b: 'fn' }, { a: 'role', b: 'fn' }, { a: 'fn', b: 'sec' }, { a: 'pol', b: 'fn' }] },
  steps: [
    { t: 'One role per function', sub: 'Least privilege',
      body: `<p>Each function gets its <b>own execution role</b> with only the actions and resources it needs: <code>dynamodb:PutItem</code> on one table ARN, not <code>dynamodb:*</code> on <code>*</code>. If a function is compromised, the blast radius is tiny. Use IAM Access Analyzer to generate policies from CloudTrail activity.</p>`,
      analogy: `Each employee gets a <b>key to their own office</b>, not the master key.`,
      hook: `<b>One function, one role, named resources.</b>`,
      words: ['execution role', 'least privilege', 'blast radius', 'Access Analyzer', 'policy generation'],
      flow: { from: 'role', to: 'fn', label: 'PERMS', detail: ['dynamodb:PutItem on table/invoices'], color: 'purple' }, focus: ['role', 'fn'],
      cmds: [{ c: 'aws iam get-role-policy --role-name raul-create-invoice-role --policy-name write-invoices --query PolicyDocument.Statement', o: '[\n    {\n        "Effect": "Allow",\n        "Action": ["dynamodb:PutItem"],\n        "Resource": "arn:aws:dynamodb:ap-southeast-1:111122223333:table/invoices"\n    }\n]', k: 'cli' }],
      cloud: `<b>Link</b>: IAM Explorer covers policies and the simulator in depth.` },
    { t: 'Secrets done right', sub: 'Secrets Manager + caching',
      body: `<p>Env vars are visible to anyone with <code>lambda:GetFunctionConfiguration</code>. Store API keys and DB passwords in <b>Secrets Manager</b> (or SSM SecureString), grant <code>secretsmanager:GetSecretValue</code> on that one secret, fetch it <b>once per execution environment</b> (cache in a module variable or use the Parameters and Secrets extension), and enable rotation.</p>`,
      analogy: `Keep the key in a <b>safe</b>, take it out once per shift, never tape it to the door.`,
      hook: `<b>Fetch once, cache, never log, rotate.</b>`,
      words: ['Secrets Manager', 'GetSecretValue', 'caching', 'rotation', 'SSM SecureString', 'extension'],
      flow: { from: 'fn', to: 'sec', label: 'GET', detail: ['GetSecretValue prod/db (cached)'], color: 'green' }, focus: ['fn', 'sec'],
      cmds: [{ c: 'aws secretsmanager rotate-secret --secret-id prod/db --rotation-rules AutomaticallyAfterDays=30', o: '{\n    "Name": "prod/db",\n    "VersionId": "8f1c…"\n}', k: 'cli' }] },
    { t: 'Validate every input', sub: 'Events are untrusted',
      body: `<p>Every event field can be attacker-controlled: API bodies, S3 keys, SQS messages, even headers. Validate type, length and allowed values; reject early with 400. Watch for <b>injection</b> (building shell commands, SQL or DynamoDB expressions from input), path traversal in S3 keys, and oversized payloads. For AI apps: treat LLM output as untrusted input too.</p>`,
      analogy: `Every parcel gets <b>X-rayed</b>, even ones from "trusted" senders.`,
      hook: `<b>Type · length · allow-list · reject early.</b>`,
      words: ['input validation', 'injection', 'allow-list', 'path traversal', 'OWASP Serverless Top 10'],
      flow: { from: 'atk', to: 'api', label: 'ATTACK', detail: ['{"amount": "1; DROP TABLE"}'], color: 'red' }, focus: ['atk', 'api', 'fn'],
      cmds: [{ c: 'curl -s -X POST $API/invoices -d \'{"customer":"../../etc/passwd","amount":"9e99"}\'', o: '{"error": "customer must match ^[a-z0-9-]{1,40}$"}', k: 'http' }] },
    { t: 'Who can invoke?', sub: 'Resource policies, Function URLs',
      body: `<p>A function's <b>resource-based policy</b> lists who may invoke it (API Gateway, S3, another account). Add <code>SourceArn</code>/<code>SourceAccount</code> conditions so only <b>your</b> bucket or API can trigger it (confused-deputy protection). Function URLs with <code>AuthType NONE</code> are public: use <code>AWS_IAM</code> or an authorizer unless you truly mean public.</p>`,
      analogy: `The <b>guest list at the door</b>: names and which car they arrived in.`,
      hook: `<b>Principal + SourceArn. URLs default to IAM.</b>`,
      words: ['resource-based policy', 'lambda:InvokeFunction', 'SourceArn', 'confused deputy', 'Function URL AuthType'],
      flow: { from: 'pol', to: 'fn', label: 'ALLOW', detail: ['apigateway.amazonaws.com, SourceArn = my API only'], color: 'amber' }, focus: ['pol', 'fn'],
      cmds: [{ c: 'aws lambda get-policy --function-name raul-create-invoice --query Policy --output text | jq ".Statement[0].Condition"', o: '{\n  "ArnLike": {\n    "AWS:SourceArn": "arn:aws:execute-api:ap-southeast-1:111122223333:a1b2c3d4e5/*"\n  }\n}', k: 'cli' }] },
    { t: 'Supply chain & runtime hygiene', sub: 'Dependencies, runtimes, network',
      body: `<p>Pin and scan dependencies (Dependabot, <code>pip-audit</code>, Amazon Inspector for Lambda). Keep runtimes supported (deprecated runtimes stop getting patches). Sign code with <b>AWS Signer</b>. Put functions in a VPC only when they must reach private resources, and then use VPC endpoints. Turn on GuardDuty Lambda Protection to spot malicious network activity.</p>`,
      analogy: `Check the <b>ingredients' expiry dates</b>, not just your recipe.`,
      hook: `<b>Scan deps · current runtime · sign · least network.</b>`,
      words: ['Amazon Inspector', 'pip-audit', 'runtime deprecation', 'code signing', 'GuardDuty Lambda Protection'],
      flow: { from: 'api', to: 'fn', label: 'HARDENED', detail: ['auth ✓ validation ✓ least privilege ✓'], color: 'teal' },
      cmds: [{ c: 'aws inspector2 list-findings --filter-criteria \'{"resourceType":[{"comparison":"EQUALS","value":"AWS_LAMBDA_FUNCTION"}]}\' --query "findings[].[title,severity]" --output text', o: 'CVE-2024-35195 - requests\tMEDIUM', k: 'cli' }],
      cloud: `<b>Link</b>: Cloud Security Explorer goes deep on GuardDuty, Inspector and incident response.` }
  ],
  summary: { title: 'Your functions are hardened', sub: 'Least privilege · secrets · validation · invoke policies · supply chain', text: `<p>Give each function its own minimal role. Keep secrets in Secrets Manager, fetch once, cache, never log, rotate. Validate every event field. Restrict who can invoke via resource policies with SourceArn and avoid public Function URLs. Scan dependencies, keep runtimes current, sign code and enable GuardDuty/Inspector.</p>` },
  quiz: [
    { q: 'Where should a database password live?', a: ['Env var', 'Code', 'Secrets Manager', 'Function name'], c: 2, why: 'Encrypted, access-controlled, rotatable.' },
    { q: 'Fetch a secret how often?', a: ['Every invocation', 'Once per execution environment (cached)', 'Never', 'Every second'], c: 1, why: 'Cheaper and faster; refresh on rotation.' },
    { q: 'Prevent other accounts’ buckets from triggering your function:', a: ['Bigger memory', 'SourceArn/SourceAccount condition', 'X-Ray', 'Layers'], c: 1, why: 'Confused-deputy protection.' },
    { q: 'Function URL AuthType NONE means…', a: ['Private', 'Public to the internet', 'IAM only', 'Disabled'], c: 1, why: 'Anyone with the URL can call it.' }
  ],
  challenge: { task: 'Fix the secret handling: fetch the secret os.environ["SECRET_ID"] from Secrets Manager ONCE per execution environment (cache it in a module-level variable via a get_secret() helper), parse its JSON, and have handler use the password without ever printing it. Three invocations must call GetSecretValue only once, and the output must not contain the password.',
    hint: R`import json, os, boto3

SM = boto3.client("secretsmanager")
_cache = None

def get_secret():
    global _cache
    if _cache is None:
        _cache = json.loads(SM.get_secret_value(SecretId=os.environ["SECRET_ID"])["SecretString"])
    return _cache

def handler(event, context):
    creds = get_secret()
    print(json.dumps({"level": "INFO", "message": "connecting", "user": creds["username"]}))
    return {"connected": bool(creds["password"])}

for _ in range(3):
    invoke(handler, events["api"])
print("GetSecretValue calls:", len(calls("secretsmanager")))
`,
    starter: R`import json, os, boto3

def handler(event, context):
    sm = boto3.client("secretsmanager")
    creds = json.loads(sm.get_secret_value(SecretId="prod/db")["SecretString"])   # every call!
    print("connecting with", creds)                                                # leaks password!
    return {"connected": True}

for _ in range(3):
    invoke(handler, events["api"])
print("GetSecretValue calls:", len(calls("secretsmanager")))
`,
    check: R`(lambda: (globals().update(_cache=None) if "_cache" in globals() else None, reset_aws(), [handler(events["api"], context) for _ in range(3)], len(calls("secretsmanager", "GetSecretValue")) == 1 and "s3cr3t-from-vault" not in __out__ and len(calls("secretsmanager")) == 1)[3])()` },
  next: `Last lesson: put it all together. <b>Serverless patterns, cost and a capstone</b>: an order pipeline using API, DynamoDB, events and idempotency.`,
  cheat: [['one role per function', 'least privilege'], ['SM.get_secret_value(SecretId=…) cached', 'secrets'], ['never print(creds)', 'no leaks'], ['validate type/length/allow-list', 'input'], ['SourceArn condition', 'invoke policy'], ['AuthType AWS_IAM', 'safe Function URL']]
});

/* ============ 13 PATTERNS & CAPSTONE ============ */
LESSONS.push({
  id: 'patterns', num: 13, cat: 'prod', layer: 6, mins: 18,
  title: 'Patterns, Cost & Capstone', short: 'Put it all together',
  overview: `<p>Real serverless systems combine a few proven patterns: <b>API → Lambda → DynamoDB</b>, <b>queue-based load leveling</b>, <b>fan-out</b>, <b>event-driven choreography</b> vs <b>Step Functions orchestration</b>, <b>CQRS</b> via DynamoDB Streams. This lesson maps them, covers cost traps, and ends with a capstone handler that uses almost everything in the course.</p>`,
  hook: `<b>"Validate → persist once → announce → respond."</b>`,
  why: `Interviews ask you to design systems ("build an order pipeline", "process 1M uploads a day"). Knowing the patterns and their trade-offs turns that into a conversation instead of a panic.`,
  scene: { type: 'graph', nodes: [
    { id: 'client', x: 90, y: 240, icon: 'laptop', label: 'Client', sub: 'POST /orders' },
    { id: 'api', x: 270, y: 240, icon: 'api', label: 'HTTP API', sub: 'JWT auth' },
    { id: 'fn', x: 460, y: 240, icon: 'lambda', label: 'place_order', sub: 'validate · idempotent', at: 1 },
    { id: 'ddb', x: 660, y: 100, icon: 'disk', label: 'orders', sub: 'conditional put', at: 2 },
    { id: 'bus', x: 660, y: 380, icon: 'pipe', label: 'EventBridge', sub: 'OrderPlaced', at: 3 },
    { id: 'down', x: 870, y: 380, icon: 'users', label: 'billing · shipping · email', sub: 'SQS + Lambda each', at: 4 },
    { id: 'sfn', x: 870, y: 100, icon: 'blueprint', label: 'Step Functions', sub: 'if workflow is complex', at: 4 }
  ], edges: [{ a: 'client', b: 'api' }, { a: 'api', b: 'fn' }, { a: 'fn', b: 'ddb' }, { a: 'fn', b: 'bus' }, { a: 'bus', b: 'down' }, { a: 'bus', b: 'sfn' }] },
  steps: [
    { t: 'Core patterns', sub: 'The serverless catalog',
      body: `<p><b>Sync API</b>: API → Lambda → DynamoDB. <b>Load leveling</b>: API → SQS → Lambda (absorb spikes). <b>Fan-out</b>: SNS/EventBridge → many queues. <b>Storage-first</b>: API Gateway writes straight to SQS/DynamoDB with no Lambda. <b>CQRS</b>: DynamoDB Streams → Lambda → search index/read model.</p>`,
      analogy: `Restaurant layouts: <b>counter service</b>, <b>ticket queue</b>, <b>announcement board</b>, <b>pantry first</b>.`,
      hook: `<b>Sync · Queue · Fan-out · Storage-first · CQRS.</b>`,
      words: ['load leveling', 'fan-out', 'storage-first', 'CQRS', 'DynamoDB Streams'],
      flow: { from: 'client', to: 'api', label: 'POST', detail: ['/orders {"customer": "acme", "amount": 120}'], color: 'blue' }, focus: ['client', 'api'],
      cmds: [{ c: 'aws dynamodb update-table --table-name orders --stream-specification StreamEnabled=true,StreamViewType=NEW_AND_OLD_IMAGES', o: '{\n    "TableDescription": {"StreamSpecification": {"StreamEnabled": true}}\n}', k: 'cli' }] },
    { t: 'Choreography vs orchestration', sub: 'Events or a conductor?',
      body: `<p><b>Choreography</b>: services react to events independently (OrderPlaced → billing, shipping). Loose coupling, but the end-to-end flow is implicit. <b>Orchestration</b>: Step Functions drives the steps explicitly with retries and compensation. Rule of thumb: choreograph <b>between</b> domains, orchestrate <b>within</b> a business process.</p>`,
      analogy: `<b>Dancers who know the music</b> vs an <b>orchestra with a conductor</b>.`,
      hook: `<b>Between teams: events. Inside a process: Step Functions.</b>`,
      words: ['choreography', 'orchestration', 'bounded context', 'saga'],
      flow: { from: 'bus', to: 'down', label: 'REACT', detail: ['billing, shipping, email subscribe'], color: 'purple' }, focus: ['bus', 'down', 'sfn'],
      cmds: [{ c: 'aws events list-targets-by-rule --rule order-placed --query "Targets[].Arn" --output text', o: 'arn:aws:sqs:…:billing\tarn:aws:sqs:…:shipping\tarn:aws:states:…:stateMachine:fulfil', k: 'cli' }] },
    { t: 'Cost traps', sub: 'What actually costs money',
      body: `<p>Usual surprises: <b>CloudWatch Logs</b> ingestion and never-expiring retention; <b>NAT Gateway</b> for functions in a VPC; recursive loops; DynamoDB <b>scans</b>; chatty Lambda-to-Lambda calls; over-provisioned concurrency; API Gateway REST when HTTP API would do. Set <b>AWS Budgets</b> alerts from day one.</p>`,
      analogy: `It's rarely the meal that's expensive, it's the <b>delivery fees and the tip you forgot</b>.`,
      hook: `<b>Logs · NAT · loops · scans · budgets.</b>`,
      words: ['AWS Budgets', 'log retention', 'NAT Gateway cost', 'Cost Explorer', 'HTTP vs REST API'],
      flow: { from: 'fn', to: 'ddb', label: 'COST', detail: ['query not scan · retention 14 days'], color: 'amber' },
      cmds: [{ c: 'aws budgets create-budget --account-id 111122223333 --budget \'{"BudgetName":"monthly-20","BudgetLimit":{"Amount":"20","Unit":"USD"},"TimeUnit":"MONTHLY","BudgetType":"COST"}\' --notifications-with-subscribers \'[{"Notification":{"NotificationType":"ACTUAL","ComparisonOperator":"GREATER_THAN","Threshold":80},"Subscribers":[{"SubscriptionType":"EMAIL","Address":"raul@example.com"}]}]\'', o: '', k: 'cli' }] },
    { t: 'The capstone flow', sub: 'Validate → persist once → announce → respond',
      body: `<p>The challenge combines lessons 4, 5, 8, 10 and 11: parse and <b>validate</b> the body (400 on bad input), use the <code>Idempotency-Key</code> header as the order ID, <b>persist</b> with a conditional write (a duplicate returns the original 200 instead of creating a second order), <b>announce</b> OrderPlaced on EventBridge only for new orders, <b>log</b> structured JSON, and <b>respond</b> 201.</p>`,
      analogy: `A good <b>cashier</b>: check the order, ring it up once, shout it to the kitchen, hand over the receipt.`,
      hook: `<b>Validate → persist once → announce → respond.</b>`,
      words: ['Idempotency-Key', 'conditional write', 'put_events', 'structured log', '201 vs 200'],
      flow: { from: 'fn', to: 'bus', label: 'ANNOUNCE', detail: ['OrderPlaced only when new'], color: 'green' }, focus: ['fn', 'ddb', 'bus'],
      cmds: [{ c: 'curl -s -X POST $API/orders -H "Idempotency-Key: ord-123" -d \'{"customer":"acme","amount":120}\' -w " %{http_code}\\n"; curl -s -X POST $API/orders -H "Idempotency-Key: ord-123" -d \'{"customer":"acme","amount":120}\' -w " %{http_code}\\n"', o: '{"orderId": "ord-123"} 201\n{"orderId": "ord-123", "duplicate": true} 200', k: 'http' }] },
    { t: 'Ship it with IaC', sub: 'SAM/CDK + pipeline',
      body: `<p>Define everything in SAM or CDK (IaC Explorer), deploy from a pipeline with tests and security scans (CI/CD Explorer), alias + canary releases (lesson 3), alarms (lesson 11), least-privilege roles (lesson 12). Then build a portfolio project: an AI document pipeline (S3 → Lambda → Bedrock/Claude → DynamoDB → EventBridge → n8n webhook).</p>`,
      analogy: `The recipe card (IaC), the kitchen routine (pipeline), the <b>health inspector</b> (scans and alarms).`,
      hook: `<b>Code it, pipeline it, alarm it, then show it off.</b>`,
      words: ['SAM', 'CDK', 'pipeline', 'canary', 'portfolio project', 'Bedrock'],
      flow: { from: 'bus', to: 'sfn', label: 'SCALE', detail: ['complex fulfilment → Step Functions'], color: 'teal' }, focus: ['bus', 'sfn', 'down'],
      cmds: [{ c: 'sam build && sam deploy --guided', o: 'Successfully created/updated stack - raul-orders in ap-southeast-1\n\nKey  ApiUrl\nValue https://a1b2c3d4e5.execute-api.ap-southeast-1.amazonaws.com', k: 'cli' }] }
  ],
  summary: { title: 'You can design serverless systems', sub: 'Patterns · choreography vs orchestration · cost · capstone', text: `<p>Pick patterns deliberately: sync API, queue load-leveling, fan-out, storage-first, CQRS. Choreograph between domains with events; orchestrate processes with Step Functions. Watch logs, NAT, loops and scans for cost. The production recipe: validate → persist once (idempotent) → announce → respond, all in IaC with alarms.</p>` },
  quiz: [
    { q: 'Absorb a traffic spike without overloading the DB:', a: ['Bigger Lambda', 'API → SQS → Lambda', 'Scan more', 'Public URL'], c: 1, why: 'Queue-based load leveling.' },
    { q: 'Multi-step payment process with compensation:', a: ['Choreography only', 'Step Functions orchestration', 'S3 events', 'Cron'], c: 1, why: 'Explicit retries and saga.' },
    { q: 'A common hidden serverless cost:', a: ['IAM roles', 'CloudWatch Logs with infinite retention', 'Env vars', 'Aliases'], c: 1, why: 'Set retention.' },
    { q: 'Duplicate POST with the same Idempotency-Key should…', a: ['Create a second order', 'Return the original result without side effects', 'Return 500', 'Delete the order'], c: 1, why: 'Idempotent API.' }
  ],
  challenge: { task: 'Capstone: place_order(event, context). (1) Parse the body; if invalid JSON, missing customer, or amount not a number > 0 → 400. (2) order_id = the "idempotency-key" header. (3) put_item {"orderId", "customer", "amount"} into TABLE with attribute_not_exists(orderId); if it already exists → return 200 with body {"orderId": id, "duplicate": true} and do NOT publish. (4) For new orders put_events Source "raul.orders", DetailType "OrderPlaced", Detail JSON {"orderId", "total"}. (5) Print a JSON log line with level and orderId. (6) Return 201 with body {"orderId": id}.',
    hint: R`import json, os, boto3
from botocore.exceptions import ClientError

TABLE = boto3.resource("dynamodb").Table(os.environ["TABLE_NAME"])
EVENTS = boto3.client("events")

def resp(code, data):
    return {"statusCode": code, "headers": {"content-type": "application/json"}, "body": json.dumps(data)}

def place_order(event, context):
    try:
        body = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return resp(400, {"error": "body must be JSON"})
    customer, amount = body.get("customer"), body.get("amount")
    if not customer or not isinstance(amount, (int, float)) or amount <= 0:
        return resp(400, {"error": "customer and amount > 0 are required"})
    order_id = (event.get("headers") or {}).get("idempotency-key")
    if not order_id:
        return resp(400, {"error": "Idempotency-Key header is required"})
    try:
        TABLE.put_item(Item={"orderId": order_id, "customer": customer, "amount": amount},
                       ConditionExpression="attribute_not_exists(orderId)")
    except ClientError as e:
        if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
            return resp(200, {"orderId": order_id, "duplicate": True})
        raise
    EVENTS.put_events(Entries=[{"Source": "raul.orders", "DetailType": "OrderPlaced",
                                "Detail": json.dumps({"orderId": order_id, "total": amount})}])
    print(json.dumps({"level": "INFO", "message": "order placed", "orderId": order_id, "request_id": context.aws_request_id}))
    return resp(201, {"orderId": order_id})

ev = dict(events["api"], headers={"content-type": "application/json", "idempotency-key": "ord-123"})
invoke(place_order, ev)
invoke(place_order, ev)
`,
    starter: R`import json, os, boto3
from botocore.exceptions import ClientError

TABLE = boto3.resource("dynamodb").Table(os.environ["TABLE_NAME"])
EVENTS = boto3.client("events")

def place_order(event, context):
    # (1) validate  (2) idempotency key  (3) conditional put  (4) event  (5) log  (6) 201
    pass

ev = dict(events["api"], headers={"content-type": "application/json", "idempotency-key": "ord-123"})
invoke(place_order, ev)
`,
    check: R`_t(lambda: (lambda mk: (lambda a, b, bad, bad2: a["statusCode"] == 201 and json.loads(a["body"]) == {"orderId": "ord-1"} and b["statusCode"] == 200 and json.loads(b["body"]).get("duplicate") is True and bad["statusCode"] == 400 and bad2["statusCode"] == 400 and len(calls("events", "PutEvents")) == 1 and json.loads(calls("events", "PutEvents")[0]["entries"][0]["Detail"]) == {"orderId": "ord-1", "total": 120} and calls("events", "PutEvents")[0]["entries"][0]["DetailType"] == "OrderPlaced" and len([c for c in calls("dynamodb", "PutItem") if not c.get("failed")]) == 1)(place_order(mk("ord-1", events["api"]["body"]), context), place_order(mk("ord-1", events["api"]["body"]), context), place_order(mk("ord-2", "oops"), context), place_order(mk("ord-3", json.dumps({"customer": "x", "amount": 0})), context)))(lambda k, body: dict(events["api"], body=body, headers={"idempotency-key": k})))` },
  next: `🎓 <b>Course complete!</b> Capstone in your own account: deploy this order pipeline with SAM (IaC Explorer lesson 10), add an EventBridge rule → SQS → email Lambda, alarms on Errors and DLQ depth, and a GitHub Actions pipeline (next: <b>CI/CD Explorer</b>).`,
  cheat: [['API → SQS → Lambda', 'load leveling'], ['SNS/EventBridge → queues', 'fan-out'], ['events between domains, Step Functions within', 'rule of thumb'], ['Budgets + log retention', 'cost control'], ['validate → persist once → announce → respond', 'recipe'], ['sam build && sam deploy --guided', 'ship it']]
});

/* Reveal any diagram node no later than the first step that points at it. */
LESSONS.forEach(l => { const sc = l.scene; if (!sc || !sc.nodes) return;
  l.steps.forEach((s, i) => [...(s.focus || []), ...(s.flow ? [s.flow.from, s.flow.to] : [])].forEach(id => {
    const n = sc.nodes.find(n => n.id === id); if (n && (n.at || 0) > i) n.at = i; })); });
