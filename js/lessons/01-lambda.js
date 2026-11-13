window.LESSONS = window.LESSONS || [];
window.R = String.raw;
window.SLS = { type: 'graph', nodes: [
  { id: 'src', x: 100, y: 240, icon: 'globe', label: 'Event source', sub: 'API · S3 · SQS · schedule' },
  { id: 'svc', x: 330, y: 240, icon: 'gear', label: 'Lambda service', sub: 'routes, scales, retries' },
  { id: 'env', x: 560, y: 240, icon: 'box', label: 'Execution env', sub: 'micro-VM (Firecracker)', at: 1 },
  { id: 'fn', x: 560, y: 90, icon: 'lambda', label: 'handler(event, context)', sub: 'your code', at: 1 },
  { id: 'role', x: 330, y: 410, icon: 'key', label: 'Execution role', sub: 'what it may call', at: 2 },
  { id: 'ddb', x: 800, y: 160, icon: 'disk', label: 'DynamoDB / S3', sub: 'state lives here', at: 3 },
  { id: 'logs', x: 800, y: 380, icon: 'log', label: 'CloudWatch Logs', sub: 'print() goes here', at: 3 }
], edges: [{ a: 'src', b: 'svc' }, { a: 'svc', b: 'env' }, { a: 'env', b: 'fn' }, { a: 'svc', b: 'role' }, { a: 'fn', b: 'ddb' }, { a: 'env', b: 'logs' }] };

/* ============ 01 WHAT IS SERVERLESS ============ */
LESSONS.push({
  id: 'what-is-serverless', num: 1, cat: 'core', layer: 1, mins: 11,
  title: 'What is Serverless?', short: 'Run code without managing servers',
  overview: `<p><b>Serverless</b> means you ship code or configuration and AWS runs, scales, patches and bills it <b>per use</b>. There are still servers, you just never see them. The core pieces: <b>Lambda</b> (functions), <b>API Gateway</b> (HTTP), <b>DynamoDB</b> (database), <b>S3</b> (files), <b>SQS/SNS/EventBridge</b> (messaging) and <b>Step Functions</b> (workflows).</p>`,
  hook: `<b>"No servers to babysit, pay for what runs."</b>`,
  why: `Serverless is how most new AWS backends and automations are built: perfect for AI automation (webhooks, scheduled jobs, LLM calls) and for cloud engineer interviews ("design a URL shortener").`,
  scene: SLS,
  steps: [
    { t: 'Servers you never see', sub: 'The responsibility shift',
      body: `<p>With EC2 you patch the OS, size the instance, scale it and pay while it idles. With Lambda you upload a function; AWS handles OS, runtime patching, scaling from 0 to thousands, and high availability across AZs.</p><p>You still own: <b>your code, its permissions, its data, its configuration</b>.</p>`,
      analogy: `EC2 is <b>owning a car</b>; Lambda is <b>calling a taxi</b>: you just say where to go and pay per ride.`,
      hook: `<b>You own the code; AWS owns the computer.</b>`,
      words: ['serverless', 'managed service', 'shared responsibility', 'no idle cost'],
      flow: { from: 'src', to: 'svc', label: 'EVENT', detail: ['POST /invoices'], color: 'blue' }, focus: ['src', 'svc'],
      cmds: [{ c: 'aws lambda list-functions --query "Functions[].[FunctionName,Runtime]" --output text', o: 'raul-create-invoice\tpython3.12\nraul-resize-image\tpython3.12', k: 'cli' }] },
    { t: 'Event-driven', sub: 'Something happens → code runs',
      body: `<p>Lambda functions don't run continuously. They run <b>in response to events</b>: an HTTP request, a file landing in S3, a message in a queue, a schedule ("every day at 8am"), a database change. Each event becomes one <b>invocation</b>.</p>`,
      analogy: `A <b>doorbell</b>: nothing happens until someone presses it.`,
      hook: `<b>No event, no run, no bill.</b>`,
      words: ['event-driven', 'invocation', 'trigger', 'event source'],
      flow: { from: 'svc', to: 'fn', label: 'INVOKE', detail: ['handler(event, context)'], color: 'purple' }, focus: ['svc', 'env', 'fn'],
      cmds: [{ c: 'aws lambda invoke --function-name raul-create-invoice --payload file://event.json --cli-binary-format raw-in-base64-out out.json && cat out.json', o: '{\n    "StatusCode": 200,\n    "ExecutedVersion": "$LATEST"\n}\n{"statusCode": 201, "body": "{\\"invoiceId\\": \\"inv-7f3a\\"}"}', k: 'cli' }] },
    { t: 'Pay per use', sub: 'Requests × GB-seconds',
      body: `<p>Lambda bills <b>requests</b> ($0.20 per million) and <b>compute</b> in GB-seconds (memory × duration). The free tier covers 1M requests and 400,000 GB-seconds a month, enough for most learning and small automations.</p><p>Example: 256 MB × 200 ms = 0.05 GB-s per call.</p>`,
      analogy: `A <b>taxi meter</b>: you pay for the distance you ride, not for the car sitting in the garage.`,
      hook: `<b>Memory × time × calls.</b>`,
      words: ['GB-second', 'free tier', 'request pricing', 'pay-per-use'],
      flow: { from: 'fn', to: 'logs', label: 'BILLED', detail: ['Billed Duration: 201 ms'], color: 'amber' },
      cmds: [{ c: 'aws logs tail /aws/lambda/raul-create-invoice --since 5m | grep REPORT', o: 'REPORT RequestId: 8a1f… Duration: 187.42 ms Billed Duration: 188 ms Memory Size: 256 MB Max Memory Used: 71 MB', k: 'logs' }] },
    { t: 'The serverless toolbox', sub: 'Services that snap together',
      body: `<p><b>Compute</b>: Lambda (and Fargate for containers). <b>Front door</b>: API Gateway, Lambda Function URLs. <b>Data</b>: DynamoDB, S3. <b>Messaging</b>: SQS (queues), SNS (pub/sub), EventBridge (event bus). <b>Orchestration</b>: Step Functions. <b>Auth</b>: Cognito, IAM.</p>`,
      analogy: `<b>LEGO bricks</b> for backends: each one does one job well.`,
      hook: `<b>Compute · Front door · Data · Messaging · Orchestration.</b>`,
      words: ['API Gateway', 'DynamoDB', 'SQS', 'SNS', 'EventBridge', 'Step Functions'],
      flow: { from: 'fn', to: 'ddb', label: 'STATE', detail: ['functions are stateless; data goes to DynamoDB/S3'], color: 'green' }, focus: ['fn', 'ddb'],
      cmds: [{ c: 'aws dynamodb list-tables', o: '{\n    "TableNames": [\n        "invoices"\n    ]\n}', k: 'cli' }] },
    { t: 'When NOT serverless', sub: 'Know the limits',
      body: `<p>Lambda limits: max <b>15 minutes</b> per invocation, up to 10 GB memory, 512 MB–10 GB <code>/tmp</code>, payload 6 MB (sync). Poor fits: long-running jobs, steady very high traffic (containers can be cheaper), stateful connections (game servers), GPU work.</p><p>In this course's lab you'll write real Python handlers and run them against a simulated AWS.</p>`,
      analogy: `Taxis are great for trips, not for <b>living in the car</b>.`,
      hook: `<b>15 minutes, stateless, bursty = Lambda sweet spot.</b>`,
      words: ['15-minute timeout', 'payload limit', 'stateless', 'Fargate', 'steady load'],
      flow: { from: 'svc', to: 'role', label: 'LIMITS', detail: ['timeout ≤ 900 s'], color: 'red' },
      cmds: [{ c: 'aws lambda get-account-settings --query "AccountLimit.ConcurrentExecutions"', o: '1000', k: 'cli' }],
      cloud: `<b>CCP tie-in</b>: Lambda = "serverless compute", "run code without provisioning servers", "pay only for compute time".` }
  ],
  summary: { title: 'You know what serverless is', sub: 'Managed · event-driven · pay-per-use', text: `<p>Serverless shifts servers, scaling and patching to AWS; you own code, permissions and data. Functions run per event and bill per request plus GB-seconds. Great for bursty, event-driven, short work; not for >15-minute or always-on stateful workloads.</p>` },
  quiz: [
    { q: 'Max duration of one Lambda invocation:', a: ['5 min', '15 min', '1 hour', 'Unlimited'], c: 1, why: '900 seconds.' },
    { q: 'Lambda compute is billed in…', a: ['Instance-hours', 'GB-seconds', 'vCPU-days', 'Flat monthly'], c: 1, why: 'Memory × duration.' },
    { q: 'Who patches the Lambda runtime OS?', a: ['You', 'AWS', 'Nobody', 'Your IT team'], c: 1, why: 'Managed by AWS.' },
    { q: 'Poor fit for Lambda:', a: ['Webhook handler', 'Nightly 5-minute report', '3-hour video render', 'Image thumbnailer'], c: 2, why: 'Exceeds 15 minutes.' }
  ],
  challenge: { task: 'Write your first handler: lambda_handler(event, context) must return {"statusCode": 200, "body": "Hello, Raul!"}. Then call invoke(lambda_handler, events["api"]) to run it like Lambda does.',
    hint: R`def lambda_handler(event, context):
    return {"statusCode": 200, "body": "Hello, Raul!"}

invoke(lambda_handler, events["api"])
`,
    starter: R`# Your first Lambda handler
def lambda_handler(event, context):
    # return a dict with statusCode and body
    pass

invoke(lambda_handler, events["api"])
`,
    check: '_t(lambda: lambda_handler(events["api"], context) == {"statusCode": 200, "body": "Hello, Raul!"})' },
  next: `You've run a handler. Next: what's really inside <b>event</b> and <b>context</b>, what a <b>cold start</b> is, and why code outside the handler runs only once.`,
  cheat: [['def lambda_handler(event, context):', 'entry point'], ['return {"statusCode": 200, "body": "…"}', 'API response'], ['aws lambda invoke --function-name f out.json', 'test invoke'], ['15 min · 10 GB · 6 MB', 'key limits'], ['$0.20/1M requests + GB-s', 'pricing']]
});

/* ============ 02 HANDLER ANATOMY ============ */
LESSONS.push({
  id: 'handler', num: 2, cat: 'core', layer: 1, mins: 14,
  title: 'Handler Anatomy & Cold Starts', short: 'event, context, init code, env vars',
  overview: `<p>Every Lambda receives two things: <b>event</b> (a dict describing what happened; its shape depends on the source) and <b>context</b> (runtime info: request ID, remaining time). Code <b>outside</b> the handler runs once per execution environment (the <b>init</b> phase); the handler runs for every event.</p>`,
  hook: `<b>"Init once, handle many."</b>`,
  why: `Putting clients and config in the init phase is the #1 Lambda performance trick, and understanding event shapes is what makes debugging integrations fast.`,
  scene: SLS,
  steps: [
    { t: 'The event', sub: 'A dict whose shape depends on the source',
      body: `<p>API Gateway sends method, path, headers and a <b>JSON string</b> body. S3 sends <code>Records[].s3.bucket.name</code> and <code>object.key</code>. SQS sends <code>Records[].body</code>. EventBridge sends <code>source</code>, <code>detail-type</code>, <code>detail</code>.</p><p>In the lab, <code>events["api"]</code>, <code>events["s3"]</code>, <code>events["sqs"]</code>… are real-shaped samples. Print them!</p>`,
      analogy: `The event is the <b>envelope</b>; each sender uses a different envelope format.`,
      hook: `<b>Print the event first. Always.</b>`,
      words: ['event', 'Records', 'body', 'detail', 'test event'],
      flow: { from: 'src', to: 'fn', label: 'EVENT', detail: ['{"Records": [{"s3": {...}}]}'], color: 'blue' }, focus: ['src', 'fn'],
      cmds: [{ c: 'print(json.dumps(events["s3"], indent=2))', f: 'playground.py', o: '{\n  "Records": [\n    {\n      "eventSource": "aws:s3",\n      "s3": {"bucket": {"name": "raul-uploads"}, "object": {"key": "reports/2026/Nov+report+v2.csv"}}\n    }\n  ]\n}', k: 'py' }] },
    { t: 'The context', sub: 'Runtime info',
      body: `<p><code>context.aws_request_id</code> (unique per invocation, great for logs), <code>context.function_name</code>, <code>context.memory_limit_in_mb</code>, and <code>context.get_remaining_time_in_millis()</code> to stop cleanly before the timeout.</p>`,
      analogy: `The context is the <b>job ticket</b> stapled to the envelope: ticket number and how much time you have.`,
      hook: `<b>request_id for logs, remaining_time for safety.</b>`,
      words: ['context', 'aws_request_id', 'get_remaining_time_in_millis', 'function_name'],
      flow: { from: 'svc', to: 'fn', label: 'CONTEXT', detail: ['aws_request_id = c0ffee00-…'], color: 'purple' },
      cmds: [{ c: 'print(context.aws_request_id, context.get_remaining_time_in_millis())', f: 'playground.py', o: 'c0ffee00-3a9b-4b1d-9f00-1a2b3c4d5e6f 2998', k: 'py' }] },
    { t: 'Init vs invoke', sub: 'Cold starts and warm starts',
      body: `<p>First request: Lambda creates an execution environment, downloads your code, runs the <b>init</b> code (imports, top-level variables), then the handler. That's a <b>cold start</b> (tens of ms to seconds). Later requests reuse the warm environment and skip init.</p><p>So create <code>boto3</code> clients and load config <b>at the top level</b>, not inside the handler.</p>`,
      analogy: `Opening a restaurant (cold start: turn on ovens) vs serving the next customer (warm).`,
      hook: `<b>Heavy setup at the top, light work in the handler.</b>`,
      words: ['cold start', 'warm start', 'init phase', 'execution environment', 'Init Duration'],
      flow: { from: 'env', to: 'fn', label: 'INIT', detail: ['Init Duration: 312 ms (cold)'], color: 'amber' }, focus: ['env', 'fn'],
      cmds: [{ c: 'import boto3, os\ntable = boto3.resource("dynamodb").Table(os.environ["TABLE_NAME"])   # init: once\n\ndef lambda_handler(event, context):\n    return table.get_item(Key={"invoiceId": "inv-1"})             # per event', f: 'app.py', o: '', k: 'py' }] },
    { t: 'Environment variables', sub: 'Config without code changes',
      body: `<p>Pass table names, queue URLs and feature flags via <b>environment variables</b> (<code>os.environ["TABLE_NAME"]</code>), set in the template (IaC Explorer lesson 10). Never hard-code resource names, and never put secrets in plain env vars (lesson 12 covers Secrets Manager).</p>`,
      analogy: `Env vars are <b>sticky notes on the worker's desk</b>: change the note, not the worker.`,
      hook: `<b>Names in env vars, secrets in Secrets Manager.</b>`,
      words: ['os.environ', 'environment variables', 'configuration', 'KMS-encrypted env'],
      flow: { from: 'role', to: 'fn', label: 'CONFIG', detail: ['TABLE_NAME=invoices'], color: 'green' },
      cmds: [{ c: 'aws lambda update-function-configuration --function-name raul-create-invoice --environment "Variables={TABLE_NAME=invoices,LOG_LEVEL=INFO}"', o: '{\n    "FunctionName": "raul-create-invoice",\n    "Environment": {"Variables": {"TABLE_NAME": "invoices", "LOG_LEVEL": "INFO"}}\n}', k: 'cli' }] },
    { t: 'print() → CloudWatch', sub: 'Logs for free',
      body: `<p>Anything you <code>print()</code> (or log) goes to CloudWatch Logs, group <code>/aws/lambda/&lt;function&gt;</code>, along with <b>START</b>, <b>END</b> and <b>REPORT</b> lines (duration, memory used). <code>invoke()</code> in the lab prints those same lines.</p>`,
      analogy: `CloudWatch Logs is the function's <b>diary</b>: write in it, read it after.`,
      hook: `<b>START · your logs · END · REPORT.</b>`,
      words: ['CloudWatch Logs', 'log group', 'REPORT line', 'aws logs tail'],
      flow: { from: 'env', to: 'logs', label: 'LOGS', detail: ['START … END … REPORT'], color: 'teal' }, focus: ['env', 'logs'],
      cmds: [{ c: 'aws logs tail /aws/lambda/raul-create-invoice --follow', o: 'START RequestId: 8a1f… Version: $LATEST\nprocessing invoice for acme\nEND RequestId: 8a1f…\nREPORT RequestId: 8a1f… Duration: 41.20 ms Billed Duration: 42 ms Memory Size: 256 MB Max Memory Used: 70 MB Init Duration: 312.55 ms', k: 'logs' }] }
  ],
  summary: { title: 'You can read any handler', sub: 'event · context · init · env vars · logs', text: `<p>The event's shape depends on the source; print it first. Context gives request ID and remaining time. Top-level code runs once per environment (cold start); put clients there. Config comes from env vars; logs go to CloudWatch with START/END/REPORT lines.</p>` },
  quiz: [
    { q: 'Where should you create a boto3 client?', a: ['Inside the handler', 'At module top level (init)', 'In the event', 'In CloudWatch'], c: 1, why: 'Reused across warm invocations.' },
    { q: 'API Gateway’s body arrives as…', a: ['A dict', 'A JSON string', 'Bytes always', 'XML'], c: 1, why: 'json.loads(event["body"]).' },
    { q: 'Avoid timeouts by checking…', a: ['context.get_remaining_time_in_millis()', 'event["timeout"]', 'os.environ', 'time.sleep'], c: 0, why: 'Stop cleanly before the deadline.' },
    { q: 'A cold start happens when…', a: ['Every request', 'A new execution environment is created', 'The function errors', 'Memory is low'], c: 1, why: 'Warm environments skip init.' }
  ],
  challenge: { task: 'Move setup to the init phase: create TABLE = boto3.resource("dynamodb").Table(os.environ["TABLE_NAME"]) at the TOP level. The handler must return {"table": TABLE.name, "request_id": context.aws_request_id}.',
    hint: R`import os, boto3

TABLE = boto3.resource("dynamodb").Table(os.environ["TABLE_NAME"])

def lambda_handler(event, context):
    return {"table": TABLE.name, "request_id": context.aws_request_id}

invoke(lambda_handler, events["api"])
`,
    starter: R`import os, boto3

def lambda_handler(event, context):
    table = boto3.resource("dynamodb").Table("invoices")   # created on EVERY call, name hard-coded
    return {"table": table.name}

invoke(lambda_handler, events["api"])
`,
    check: '_t(lambda: "TABLE" in globals() and TABLE.name == os.environ["TABLE_NAME"] and lambda_handler(events["api"], context) == {"table": "invoices", "request_id": context.aws_request_id})' },
  next: `Your handler works. Now tune it: <b>memory, timeout, concurrency, versions and aliases</b>, the knobs that decide speed, cost and safe deployments.`,
  cheat: [['event["Records"][0]["s3"]["object"]["key"]', 'S3 key'], ['json.loads(event["body"])', 'API body'], ['context.aws_request_id', 'request ID'], ['TOP-LEVEL client = boto3.client(...)', 'init once'], ['os.environ["TABLE_NAME"]', 'config'], ['aws logs tail /aws/lambda/fn --follow', 'live logs']]
});

/* ============ 03 CONFIGURATION ============ */
LESSONS.push({
  id: 'config', num: 3, cat: 'core', layer: 2, mins: 14,
  title: 'Memory, Timeout, Concurrency & Versions', short: 'The knobs that set speed, cost and safety',
  overview: `<p>A function has a few critical settings: <b>memory</b> (which also sets CPU), <b>timeout</b>, <b>concurrency</b> (how many run at once), and <b>versions/aliases</b> for safe releases. Layers and container images package dependencies.</p>`,
  hook: `<b>"More memory = more CPU = often cheaper."</b>`,
  why: `Right-sizing memory can halve both latency and cost; concurrency limits protect databases; aliases enable canary deployments. These are classic interview and exam questions.`,
  scene: { type: 'graph', nodes: [
    { id: 'code', x: 110, y: 240, icon: 'code', label: 'Code + deps', sub: 'zip · layer · image' },
    { id: 'fn', x: 340, y: 240, icon: 'lambda', label: 'Function', sub: '256 MB · 10 s' },
    { id: 'v', x: 580, y: 110, icon: 'list', label: 'Versions', sub: '1 · 2 · 3 (immutable)', at: 3 },
    { id: 'alias', x: 820, y: 110, icon: 'blueprint', label: 'Alias: prod', sub: '90% v2 · 10% v3', at: 4 },
    { id: 'conc', x: 580, y: 380, icon: 'users', label: 'Concurrency', sub: 'reserved · provisioned', at: 2 },
    { id: 'db', x: 820, y: 380, icon: 'disk', label: 'Database', sub: 'protected from floods', at: 2 }
  ], edges: [{ a: 'code', b: 'fn' }, { a: 'fn', b: 'v' }, { a: 'v', b: 'alias' }, { a: 'fn', b: 'conc' }, { a: 'conc', b: 'db' }] },
  steps: [
    { t: 'Memory = CPU', sub: '128 MB to 10,240 MB',
      body: `<p>CPU scales with memory (1,769 MB ≈ 1 full vCPU). Doubling memory doubles the price per ms, but if the function finishes in half the time, cost stays the same and latency drops. Measure with <b>AWS Lambda Power Tuning</b>.</p>`,
      analogy: `A bigger engine burns more fuel per minute but <b>arrives sooner</b>.`,
      hook: `<b>Tune memory by measurement, not by guess.</b>`,
      words: ['MemorySize', 'vCPU scaling', 'Power Tuning', 'Max Memory Used'],
      flow: { from: 'code', to: 'fn', label: 'SIZE', detail: ['256 MB → 1024 MB: 800 ms → 190 ms'], color: 'blue' }, focus: ['code', 'fn'],
      cmds: [{ c: 'aws lambda update-function-configuration --function-name raul-resize-image --memory-size 1024 --timeout 30', o: '{\n    "MemorySize": 1024,\n    "Timeout": 30\n}', k: 'cli' }] },
    { t: 'Timeout', sub: 'Default 3 seconds',
      body: `<p>Default timeout is <b>3 s</b>, max 900 s. Set it a bit above your realistic worst case. With API Gateway, the integration timeout (~29–30 s) caps synchronous requests anyway. For SQS triggers, the queue's visibility timeout must be <b>≥ 6× the function timeout</b>.</p>`,
      analogy: `A <b>kitchen timer</b>: too short burns good dishes, too long hides stuck ones.`,
      hook: `<b>3 s default. Realistic worst case + margin.</b>`,
      words: ['Timeout', 'Task timed out', 'API Gateway 29s', 'visibility timeout'],
      flow: { from: 'code', to: 'fn', label: 'TIMEOUT', detail: ['Task timed out after 3.00 seconds'], color: 'red' },
      cmds: [{ c: 'aws logs filter-log-events --log-group-name /aws/lambda/raul-report --filter-pattern "Task timed out"', o: '"message": "2026-11-13T04:01:03Z 7b2c… Task timed out after 3.00 seconds"', k: 'err' }] },
    { t: 'Concurrency', sub: 'How many at once',
      body: `<p>Each in-flight request uses one execution environment. Account default: <b>1,000</b> concurrent per region (raisable). <b>Reserved concurrency</b> caps a function (and guarantees it capacity), so a flood can't overwhelm your database. <b>Provisioned concurrency</b> keeps environments warm to remove cold starts (costs money).</p><p>Over the limit → <code>429 TooManyRequestsException</code> (throttling).</p>`,
      analogy: `Concurrency is the number of <b>cashiers open</b>; reserved = "this line always has 5, never more".`,
      hook: `<b>Reserved caps & guarantees. Provisioned pre-warms.</b>`,
      words: ['concurrency', 'reserved concurrency', 'provisioned concurrency', 'throttling', '429'],
      flow: { from: 'conc', to: 'db', label: 'CAP', detail: ['reserved = 20 → DB never sees > 20 connections'], color: 'purple' }, focus: ['fn', 'conc', 'db'],
      cmds: [{ c: 'aws lambda put-function-concurrency --function-name raul-create-invoice --reserved-concurrent-executions 20', o: '{\n    "ReservedConcurrentExecutions": 20\n}', k: 'cli' }] },
    { t: 'Versions', sub: 'Immutable snapshots',
      body: `<p><code>publish-version</code> freezes code + config as version 1, 2, 3… <code>$LATEST</code> is the editable draft. Versions never change, so you can always roll back to a known-good one.</p>`,
      analogy: `Versions are <b>printed editions</b> of a book; $LATEST is the manuscript.`,
      hook: `<b>$LATEST = draft. Numbers = frozen.</b>`,
      words: ['publish-version', '$LATEST', 'immutable', 'qualified ARN'],
      flow: { from: 'fn', to: 'v', label: 'PUBLISH', detail: ['Version: 3'], color: 'amber' }, focus: ['fn', 'v'],
      cmds: [{ c: 'aws lambda publish-version --function-name raul-create-invoice --query Version', o: '"3"', k: 'cli' }] },
    { t: 'Aliases & canaries', sub: 'prod → v2 (90%) + v3 (10%)',
      body: `<p>An <b>alias</b> (prod, staging) points to a version, and triggers call the alias. Shift traffic gradually with weighted aliases: 10% to the new version, watch errors, then 100%. CodeDeploy (via SAM <code>DeploymentPreference: Canary10Percent5Minutes</code>) automates it with alarm-based rollback.</p>`,
      analogy: `A <b>taste test</b>: serve the new recipe to one table in ten before changing the menu.`,
      hook: `<b>Triggers call the alias; the alias picks the version.</b>`,
      words: ['alias', 'weighted alias', 'canary', 'linear', 'CodeDeploy', 'rollback'],
      flow: { from: 'v', to: 'alias', label: 'SHIFT', detail: ['prod: v2 90% · v3 10%'], color: 'green' }, focus: ['v', 'alias'],
      cmds: [{ c: 'aws lambda update-alias --function-name raul-create-invoice --name prod --function-version 2 --routing-config AdditionalVersionWeights={"3"=0.1}', o: '{\n    "Name": "prod",\n    "FunctionVersion": "2",\n    "RoutingConfig": {"AdditionalVersionWeights": {"3": 0.1}}\n}', k: 'cli' }] }
  ],
  summary: { title: 'You can tune and release safely', sub: 'Memory/CPU · timeout · concurrency · versions · aliases', text: `<p>Memory sets CPU; measure to find the cheapest fast setting. Default timeout is 3 s (max 900). Reserved concurrency caps and guarantees; provisioned removes cold starts. Publish immutable versions and route traffic with aliases for canary releases and instant rollback.</p>` },
  quiz: [
    { q: 'Increasing Lambda memory also increases…', a: ['Timeout', 'CPU', 'Concurrency', 'Free tier'], c: 1, why: 'CPU is proportional to memory.' },
    { q: 'Protect a database from a traffic flood:', a: ['Provisioned concurrency', 'Reserved concurrency (cap)', 'More memory', 'Longer timeout'], c: 1, why: 'Caps parallel invocations.' },
    { q: 'Remove cold starts for a latency-critical API:', a: ['Reserved concurrency', 'Provisioned concurrency', 'Layers', '$LATEST'], c: 1, why: 'Keeps environments initialized.' },
    { q: 'Canary deployments use…', a: ['Weighted aliases', 'Env vars', 'Layers', 'Tags'], c: 0, why: 'Split traffic across versions.' }
  ],
  challenge: { task: 'Write cost(memory_mb, duration_ms, requests) that returns the monthly USD cost: requests × 0.20 / 1,000,000 + GB-seconds × 0.0000166667, where GB-seconds = memory_mb/1024 × duration_ms/1000 × requests. Ignore the free tier and round to 2 decimals.',
    hint: R`def cost(memory_mb, duration_ms, requests):
    gb_seconds = memory_mb / 1024 * duration_ms / 1000 * requests
    return round(requests * 0.20 / 1_000_000 + gb_seconds * 0.0000166667, 2)

print(cost(256, 200, 3_000_000))   # 3M requests/month
print(cost(1024, 50, 3_000_000))   # more memory, faster
`,
    starter: R`def cost(memory_mb, duration_ms, requests):
    # requests part + compute (GB-seconds) part
    return 0

print(cost(256, 200, 3_000_000))
`,
    check: '_t(lambda: cost(256, 200, 3_000_000) == 3.1 and cost(1024, 50, 3_000_000) == 3.1 and cost(128, 100, 1_000_000) == 0.41)' },
  next: `Time to put a front door on your function: <b>API Gateway</b>, the request/response format, status codes, CORS and validation.`,
  cheat: [['--memory-size 1024', 'more CPU'], ['--timeout 30', 'seconds (max 900)'], ['put-function-concurrency', 'reserved cap'], ['put-provisioned-concurrency-config', 'pre-warm'], ['publish-version', 'freeze'], ['update-alias --routing-config', 'canary split']]
});

/* ============ 04 API GATEWAY ============ */
LESSONS.push({
  id: 'api-gateway', num: 4, cat: 'core', layer: 2, mins: 16,
  title: 'API Gateway + Lambda', short: 'HTTP requests in, JSON responses out',
  overview: `<p><b>API Gateway</b> turns HTTP requests into Lambda events and Lambda results into HTTP responses. <b>HTTP APIs</b> are cheaper and simpler; <b>REST APIs</b> add API keys, usage plans, request validation and caching. Your handler parses <code>event["body"]</code> and returns <code>statusCode</code>, <code>headers</code> and a <b>string</b> body.</p>`,
  hook: `<b>"Parse in, validate, act, return JSON string out."</b>`,
  why: `Every webhook, chatbot backend and AI tool endpoint you build is this pattern. Returning proper status codes and validating input is the difference between a demo and production.`,
  scene: { type: 'graph', nodes: [
    { id: 'client', x: 100, y: 240, icon: 'laptop', label: 'Client', sub: 'curl / browser / n8n' },
    { id: 'api', x: 330, y: 240, icon: 'api', label: 'API Gateway', sub: 'route · auth · throttle' },
    { id: 'fn', x: 570, y: 240, icon: 'lambda', label: 'create_invoice', sub: 'validate & save', at: 1 },
    { id: 'ddb', x: 810, y: 240, icon: 'disk', label: 'invoices', sub: 'DynamoDB', at: 2 },
    { id: 'auth', x: 330, y: 420, icon: 'lock', label: 'Authorizer', sub: 'JWT · IAM · Lambda', at: 4 }
  ], edges: [{ a: 'client', b: 'api' }, { a: 'api', b: 'fn' }, { a: 'fn', b: 'ddb' }, { a: 'api', b: 'auth' }] },
  steps: [
    { t: 'Routes & integrations', sub: 'METHOD /path → function',
      body: `<p>A route like <code>POST /invoices</code> maps to a Lambda integration. HTTP APIs use payload format <b>2.0</b>: <code>event["requestContext"]["http"]["method"]</code>, <code>rawPath</code>, <code>pathParameters</code>, <code>queryStringParameters</code>, <code>headers</code> (lower-case), <code>body</code>.</p>`,
      analogy: `API Gateway is a <b>receptionist</b> directing each visitor to the right office.`,
      hook: `<b>Route = method + path → integration.</b>`,
      words: ['HTTP API', 'REST API', 'route', 'integration', 'payload format 2.0', 'pathParameters'],
      flow: { from: 'client', to: 'api', label: 'POST /invoices', detail: ['{"customer": "acme", "amount": 120}'], color: 'blue' }, focus: ['client', 'api'],
      cmds: [{ c: 'curl -s -X POST https://a1b2c3d4e5.execute-api.ap-southeast-1.amazonaws.com/invoices -H "content-type: application/json" -d \'{"customer":"acme","amount":120}\'', o: '{"invoiceId": "inv-7f3a", "status": "created"}', k: 'http' }] },
    { t: 'Parse the body', sub: 'It’s a string!',
      body: `<p><code>event["body"]</code> is a JSON <b>string</b> (or None, or base64 when <code>isBase64Encoded</code>). Parse with <code>json.loads(event.get("body") or "{}")</code> inside try/except. Bad JSON should become a <b>400</b>, not a 500 crash.</p>`,
      analogy: `The letter arrives <b>folded in an envelope</b>; unfold (json.loads) before reading.`,
      hook: `<b>body is a string → json.loads → dict.</b>`,
      words: ['json.loads', 'event["body"]', 'isBase64Encoded', 'JSONDecodeError'],
      flow: { from: 'api', to: 'fn', label: 'EVENT', detail: ['"body": "{\\"customer\\": \\"acme\\"…}"'], color: 'purple' }, focus: ['api', 'fn'],
      cmds: [{ c: 'body = json.loads(event.get("body") or "{}")\nprint(body["customer"], body["amount"])', f: 'playground.py', o: 'acme 120', k: 'py' }] },
    { t: 'Return a response', sub: 'statusCode, headers, body string',
      body: `<p>Return <code>{"statusCode": 201, "headers": {"content-type": "application/json"}, "body": json.dumps(data)}</code>. Use the right codes: <b>200</b> OK, <b>201</b> created, <b>400</b> bad input, <b>401/403</b> auth, <b>404</b> not found, <b>409</b> conflict, <b>500</b> server bug. Never put a dict in <code>body</code>.</p>`,
      analogy: `Reply with a <b>stamped, sealed letter</b>: status on the envelope, JSON inside.`,
      hook: `<b>body = json.dumps(…). Status tells the story.</b>`,
      words: ['statusCode', 'headers', 'json.dumps', '201 Created', '400 Bad Request'],
      flow: { from: 'fn', to: 'ddb', label: 'SAVE', detail: ['PutItem invoiceId=inv-7f3a'], color: 'green' }, focus: ['fn', 'ddb'],
      cmds: [{ c: 'return {"statusCode": 201,\n        "headers": {"content-type": "application/json"},\n        "body": json.dumps({"invoiceId": inv_id})}', f: 'app.py', o: '', k: 'py' }] },
    { t: 'Validate input', sub: 'Never trust the client',
      body: `<p>Check required fields, types and ranges before touching the database: <code>customer</code> is a non-empty string, <code>amount</code> is a positive number. Return 400 with a helpful message. REST APIs can validate against a JSON schema before Lambda even runs (cheaper).</p>`,
      analogy: `A <b>bouncer</b> checks IDs at the door so trouble never reaches the bar.`,
      hook: `<b>Validate first, act second.</b>`,
      words: ['input validation', '400', 'JSON schema', 'request validator', 'Pydantic'],
      flow: { from: 'fn', to: 'api', label: '400', detail: ['{"error": "amount must be > 0"}'], color: 'red' },
      cmds: [{ c: 'curl -s -o /dev/null -w "%{http_code}\\n" -X POST $API/invoices -d \'{"customer":"acme","amount":-5}\'', o: '400', k: 'http' }] },
    { t: 'Auth, throttling, CORS', sub: 'Production front door',
      body: `<p><b>Authorizers</b>: JWT (Cognito, Auth0), IAM (SigV4) or a custom Lambda authorizer. <b>Throttling</b>: rate/burst limits per route or API key protect your backend. <b>CORS</b>: allow your web origin so browsers can call the API. Simpler alternative for one function: a <b>Lambda Function URL</b> (with IAM auth or none).</p>`,
      analogy: `Security guard (authorizer), <b>turnstile</b> (throttle), and a guest list for other websites (CORS).`,
      hook: `<b>Auth · Throttle · CORS before go-live.</b>`,
      words: ['JWT authorizer', 'Lambda authorizer', 'throttling', 'CORS', 'Function URL', 'usage plan'],
      flow: { from: 'api', to: 'auth', label: 'AUTH', detail: ['JWT valid · scope invoices:write'], color: 'teal' }, focus: ['api', 'auth'],
      cmds: [{ c: 'aws apigatewayv2 create-authorizer --api-id a1b2c3d4e5 --authorizer-type JWT --identity-source "$request.header.Authorization" --name cognito --jwt-configuration Audience=app-client-id,Issuer=https://cognito-idp.ap-southeast-1.amazonaws.com/ap-southeast-1_AbC123', o: '{\n    "AuthorizerId": "x7y8z9",\n    "AuthorizerType": "JWT"\n}', k: 'cli' }] }
  ],
  summary: { title: 'You can build real HTTP endpoints', sub: 'Routes · parse · validate · respond · protect', text: `<p>HTTP API routes map to Lambda; the body is a JSON string to <code>json.loads</code>. Validate input and return proper status codes with a <code>json.dumps</code> body and content-type header. Add authorizers, throttling and CORS before going live.</p>` },
  quiz: [
    { q: 'event["body"] from API Gateway is…', a: ['A dict', 'A string (JSON)', 'Always None', 'XML'], c: 1, why: 'Parse it with json.loads.' },
    { q: 'Correct status for a created resource:', a: ['200', '201', '204', '302'], c: 1, why: '201 Created.' },
    { q: 'Client sends amount = -5. Return…', a: ['500', '400', '201', '404'], c: 1, why: 'Bad input is the client’s error.' },
    { q: 'Allow a browser app on another domain to call the API:', a: ['Throttling', 'CORS', 'Reserved concurrency', 'Versions'], c: 1, why: 'Cross-origin resource sharing.' }
  ],
  challenge: { task: 'Build create_invoice(event, context) for POST /invoices: parse the JSON body; if it is invalid JSON, or customer is missing, or amount is not a number > 0, return statusCode 400 with a JSON body {"error": ...}. Otherwise save {"invoiceId": <new id>, "customer", "amount"} to the TABLE_NAME table and return 201 with body {"invoiceId": ...} and header content-type application/json.',
    hint: R`import json, os, uuid, boto3

TABLE = boto3.resource("dynamodb").Table(os.environ["TABLE_NAME"])

def resp(status, data):
    return {"statusCode": status, "headers": {"content-type": "application/json"}, "body": json.dumps(data)}

def create_invoice(event, context):
    try:
        body = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return resp(400, {"error": "body must be JSON"})
    customer, amount = body.get("customer"), body.get("amount")
    if not customer:
        return resp(400, {"error": "customer is required"})
    if not isinstance(amount, (int, float)) or amount <= 0:
        return resp(400, {"error": "amount must be a number > 0"})
    inv_id = "inv-" + uuid.uuid4().hex[:6]
    TABLE.put_item(Item={"invoiceId": inv_id, "customer": customer, "amount": amount})
    return resp(201, {"invoiceId": inv_id})

invoke(create_invoice, events["api"])
`,
    starter: R`import json, os, uuid, boto3

TABLE = boto3.resource("dynamodb").Table(os.environ["TABLE_NAME"])

def create_invoice(event, context):
    body = event["body"]                 # careful: this is a STRING
    TABLE.put_item(Item={"invoiceId": "inv-1", "customer": body["customer"], "amount": body["amount"]})
    return {"statusCode": 200, "body": {"ok": True}}

invoke(create_invoice, events["api"])
`,
    check: R`_t(lambda: (lambda ok, bad1, bad2, bad3: ok["statusCode"] == 201 and ok["headers"].get("content-type") == "application/json" and json.loads(ok["body"]).get("invoiceId") and len(calls("dynamodb", "PutItem")) == 1 and calls("dynamodb", "PutItem")[0]["item"]["customer"] == "acme" and bad1["statusCode"] == 400 and bad2["statusCode"] == 400 and bad3["statusCode"] == 400 and "error" in json.loads(bad1["body"]) and len(calls("dynamodb", "PutItem")) == 1)(create_invoice(events["api"], context), create_invoice(dict(events["api"], body="not json"), context), create_invoice(dict(events["api"], body=json.dumps({"customer": "acme", "amount": -5})), context), create_invoice(dict(events["api"], body=json.dumps({"amount": 10})), context)))` },
  next: `Your API saves to DynamoDB, but how should you design the table? Next: <b>DynamoDB for serverless</b>: keys, queries, conditional writes and single-table thinking.`,
  cheat: [['json.loads(event.get("body") or "{}")', 'parse body'], ['{"statusCode": 201, "headers": {...}, "body": json.dumps(d)}', 'response'], ['400 / 401 / 403 / 404 / 409 / 500', 'status codes'], ['event["pathParameters"]["id"]', 'path param'], ['JWT authorizer', 'auth'], ['Function URL', 'simple endpoint']]
});
