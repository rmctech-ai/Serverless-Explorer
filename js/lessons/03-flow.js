/* ============ 08 SNS & EVENTBRIDGE ============ */
LESSONS.push({
  id: 'events', num: 8, cat: 'msg', layer: 4, mins: 16,
  title: 'SNS & EventBridge: Fan-out and Event Buses', short: 'One event, many consumers',
  overview: `<p><b>SNS</b> is pub/sub: publish once, every subscriber (Lambda, SQS, email, HTTP) gets a copy. <b>EventBridge</b> is an event bus with <b>rules</b> that match events by content (source, detail-type, fields) and route them to targets, plus schedules and events from 200+ AWS services and SaaS apps.</p>`,
  hook: `<b>"Publish facts, let others subscribe."</b>`,
  why: `Event-driven architecture is how teams decouple microservices and how automations react to AWS itself (e.g. "GuardDuty finding → Slack"). It's core to both serverless and cloud security roles.`,
  scene: { type: 'graph', nodes: [
    { id: 'orders', x: 100, y: 240, icon: 'lambda', label: 'orders service', sub: 'put_events' },
    { id: 'bus', x: 340, y: 240, icon: 'pipe', label: 'EventBridge bus', sub: 'rules match events' },
    { id: 'bill', x: 620, y: 90, icon: 'lambda', label: 'billing', sub: 'OrderPlaced', at: 2 },
    { id: 'ship', x: 620, y: 240, icon: 'list', label: 'shipping queue', sub: 'SQS target', at: 2 },
    { id: 'mail', x: 620, y: 390, icon: 'bell', label: 'SNS → email', sub: 'total > 1000', at: 3 },
    { id: 'sched', x: 340, y: 420, icon: 'clock', label: 'Scheduler', sub: 'cron(0 0 * * ? *)', at: 4 }
  ], edges: [{ a: 'orders', b: 'bus' }, { a: 'bus', b: 'bill' }, { a: 'bus', b: 'ship' }, { a: 'bus', b: 'mail' }, { a: 'sched', b: 'bus' }] },
  steps: [
    { t: 'Commands vs events', sub: 'Tell vs announce',
      body: `<p>A <b>command</b> says "charge this card" to one specific service. An <b>event</b> announces a fact: "OrderPlaced". The producer doesn't know or care who listens. New consumers can be added without touching the producer: that's <b>loose coupling</b>.</p>`,
      analogy: `A command is a <b>phone call</b> to one person; an event is a <b>radio broadcast</b>.`,
      hook: `<b>Events are past-tense facts: OrderPlaced, InvoicePaid.</b>`,
      words: ['event', 'command', 'loose coupling', 'producer', 'consumer'],
      flow: { from: 'orders', to: 'bus', label: 'EVENT', detail: ['OrderPlaced {"orderId": "o-9"}'], color: 'blue' }, focus: ['orders', 'bus'],
      cmds: [{ c: 'aws events put-events --entries \'[{"Source":"raul.orders","DetailType":"OrderPlaced","Detail":"{\\"orderId\\":\\"o-9\\",\\"total\\":250}"}]\'', o: '{\n    "FailedEntryCount": 0,\n    "Entries": [{"EventId": "7f3a…"}]\n}', k: 'cli' }] },
    { t: 'SNS fan-out', sub: 'Topic → subscribers',
      body: `<p><code>sns.publish(TopicArn=…, Message=…)</code> delivers to every subscription. The <b>SNS → SQS fan-out</b> pattern gives each consumer its own queue (buffering + retries + DLQ). Subscription <b>filter policies</b> let a subscriber receive only some messages.</p>`,
      analogy: `A <b>group chat</b>: one message, everyone in the group gets it.`,
      hook: `<b>SNS → many SQS queues = durable fan-out.</b>`,
      words: ['SNS topic', 'subscription', 'fan-out', 'filter policy', 'SNS → SQS'],
      flow: { from: 'bus', to: 'mail', label: 'PUBLISH', detail: ['SNS topic alerts → email'], color: 'purple' }, focus: ['bus', 'mail'],
      cmds: [{ c: 'aws sns subscribe --topic-arn arn:aws:sns:ap-southeast-1:111122223333:alerts --protocol email --notification-endpoint raul@example.com', o: '{\n    "SubscriptionArn": "pending confirmation"\n}', k: 'cli' }] },
    { t: 'EventBridge events & rules', sub: 'Match by content',
      body: `<p>An event has <code>source</code>, <code>detail-type</code> and <code>detail</code>. A <b>rule</b> has an <b>event pattern</b>: <code>{"source": ["raul.orders"], "detail-type": ["OrderPlaced"]}</code>. Patterns can match fields inside detail, numeric ranges (<code>{"numeric": ["&gt;", 1000]}</code>), prefixes and more. Each rule routes to up to 5 targets.</p>`,
      analogy: `A <b>mail sorting room</b>: rules read the labels and drop letters into the right bins.`,
      hook: `<b>source + detail-type + detail = what rules match on.</b>`,
      words: ['event bus', 'rule', 'event pattern', 'target', 'detail-type', 'content filtering'],
      flow: { from: 'bus', to: 'bill', label: 'RULE', detail: ['source=raul.orders & detail-type=OrderPlaced'], color: 'green' }, focus: ['bus', 'bill', 'ship'],
      cmds: [{ c: 'aws events put-rule --name order-placed --event-pattern \'{"source":["raul.orders"],"detail-type":["OrderPlaced"]}\'', o: '{\n    "RuleArn": "arn:aws:events:ap-southeast-1:111122223333:rule/order-placed"\n}', k: 'cli' }] },
    { t: 'AWS & SaaS events, schedules', sub: 'React to the cloud itself',
      body: `<p>AWS services emit events to the default bus automatically: EC2 state changes, GuardDuty findings, CodePipeline failures, S3 (if enabled). <b>EventBridge Scheduler</b> runs targets on cron/rate schedules ("every weekday 8am Manila time"). Partner buses bring SaaS events (Zendesk, Shopify…).</p>`,
      analogy: `The building's <b>alarm panel</b>: doors, smoke and lifts all report to one place.`,
      hook: `<b>Schedules + AWS events + your events, one bus.</b>`,
      words: ['default bus', 'EventBridge Scheduler', 'cron expression', 'GuardDuty finding', 'partner event source'],
      flow: { from: 'sched', to: 'bus', label: 'SCHEDULE', detail: ['cron(0 0 * * ? *) Asia/Manila'], color: 'amber' }, focus: ['sched', 'bus'],
      cmds: [{ c: 'aws scheduler create-schedule --name daily-report --schedule-expression "cron(0 8 ? * MON-FRI *)" --schedule-expression-timezone Asia/Manila --flexible-time-window Mode=OFF --target Arn=arn:aws:lambda:ap-southeast-1:111122223333:function:raul-report,RoleArn=arn:aws:iam::111122223333:role/scheduler-invoke', o: '{\n    "ScheduleArn": "arn:aws:scheduler:ap-southeast-1:111122223333:schedule/default/daily-report"\n}', k: 'cli' }] },
    { t: 'Publishing from code', sub: 'put_events with Detail as a string',
      body: `<p><code>events.put_events(Entries=[{"Source": "raul.orders", "DetailType": "OrderPlaced", "Detail": json.dumps({...}), "EventBusName": "default"}])</code>. <b>Detail must be a JSON string</b>. Check <code>FailedEntryCount</code>. Keep events small and versioned; consumers fetch more data if needed.</p>`,
      analogy: `Fill in the <b>shipping label</b> (Source, DetailType) and seal the box (json.dumps).`,
      hook: `<b>Detail = json.dumps(dict). Check FailedEntryCount.</b>`,
      words: ['put_events', 'Detail', 'json.dumps', 'FailedEntryCount', 'event schema'],
      flow: { from: 'bus', to: 'ship', label: 'TARGET', detail: ['shipping queue gets OrderPlaced'], color: 'teal' }, focus: ['bus', 'ship'],
      cmds: [{ c: 'events = boto3.client("events")\nevents.put_events(Entries=[{"Source": "raul.orders", "DetailType": "OrderPlaced",\n    "Detail": json.dumps({"orderId": "o-9", "total": 250})}])', f: 'app.py', o: '', k: 'py' }] }
  ],
  summary: { title: 'You can build event-driven systems', sub: 'Events · SNS fan-out · EventBridge rules · schedules', text: `<p>Announce facts as events; consumers subscribe without coupling. SNS fans out to subscribers (pair with SQS for durability). EventBridge routes by content with rules, receives AWS/SaaS events and runs schedules. From code, <code>put_events</code> with Detail as a JSON string.</p>` },
  quiz: [
    { q: 'EventBridge rules match on…', a: ['Only the queue name', 'Event content (source, detail-type, detail)', 'IP address', 'Lambda name'], c: 1, why: 'Event patterns.' },
    { q: 'Durable fan-out to 3 services:', a: ['3 Lambda invokes', 'SNS topic → 3 SQS queues', 'One SQS queue', 'S3'], c: 1, why: 'Each consumer gets its own buffered queue.' },
    { q: 'put_events Detail must be…', a: ['A dict', 'A JSON string', 'XML', 'Base64'], c: 1, why: 'json.dumps it.' },
    { q: 'Run a function every weekday at 8am:', a: ['SQS delay', 'EventBridge Scheduler', 'S3 trigger', 'Step Functions only'], c: 1, why: 'cron schedules.' }
  ],
  challenge: { task: 'Write place_order(event, context): parse the API body ({"customer", "amount"}), create order_id = "o-" + 6 hex chars, then publish ONE EventBridge event with Source "raul.orders", DetailType "OrderPlaced", EventBusName os.environ["BUS_NAME"] and Detail = json.dumps({"orderId": order_id, "customer": ..., "total": amount}). Return 202 with body {"orderId": order_id}.',
    hint: R`import json, os, uuid, boto3

EVENTS = boto3.client("events")

def place_order(event, context):
    body = json.loads(event.get("body") or "{}")
    order_id = "o-" + uuid.uuid4().hex[:6]
    detail = {"orderId": order_id, "customer": body["customer"], "total": body["amount"]}
    r = EVENTS.put_events(Entries=[{
        "Source": "raul.orders",
        "DetailType": "OrderPlaced",
        "EventBusName": os.environ["BUS_NAME"],
        "Detail": json.dumps(detail),
    }])
    if r["FailedEntryCount"]:
        raise RuntimeError("event not published")
    return {"statusCode": 202, "body": json.dumps({"orderId": order_id})}

invoke(place_order, events["api"])
print(calls("events"))
`,
    starter: R`import json, os, uuid, boto3

EVENTS = boto3.client("events")

def place_order(event, context):
    body = json.loads(event.get("body") or "{}")
    order_id = "o-" + uuid.uuid4().hex[:6]
    # TODO: publish an OrderPlaced event
    return {"statusCode": 202, "body": json.dumps({"orderId": order_id})}

invoke(place_order, events["api"])
`,
    check: R`_t(lambda: (lambda r: r["statusCode"] == 202 and len(calls("events", "PutEvents")) == 1 and (lambda e: e["Source"] == "raul.orders" and e["DetailType"] == "OrderPlaced" and e.get("EventBusName") == "default" and json.loads(e["Detail"]) == {"orderId": json.loads(r["body"])["orderId"], "customer": "acme", "total": 120})(calls("events", "PutEvents")[0]["entries"][0]))(place_order(events["api"], context)))` },
  next: `Events are great for "tell everyone". For multi-step business processes with retries, waits and compensation, you want a conductor: <b>Step Functions</b>.`,
  cheat: [['sns.publish(TopicArn=t, Message=m)', 'pub/sub'], ['events.put_events(Entries=[{Source, DetailType, Detail}])', 'emit event'], ['{"source": ["x"], "detail-type": ["Y"]}', 'event pattern'], ['{"numeric": [">", 1000]}', 'numeric match'], ['cron(0 8 ? * MON-FRI *)', 'schedule'], ['SNS → SQS', 'durable fan-out']]
});

/* ============ 09 STEP FUNCTIONS ============ */
LESSONS.push({
  id: 'step-functions', num: 9, cat: 'flow', layer: 4, mins: 17,
  title: 'Step Functions: Workflows', short: 'States, retries, catch, parallel, map',
  overview: `<p><b>Step Functions</b> runs state machines written in the <b>Amazon States Language</b> (JSON). Each state does work (call Lambda or any AWS API directly), makes a choice, waits, runs branches in parallel or loops over items with Map. Retries and error handling are declared, not coded.</p>`,
  hook: `<b>"Lambdas do the steps; Step Functions remembers the plan."</b>`,
  why: `Order processing, document pipelines, AI agent workflows and human approvals all need state, retries and visibility. A visual workflow with execution history beats Lambdas calling Lambdas.`,
  scene: { type: 'graph', nodes: [
    { id: 'start', x: 90, y: 240, icon: 'globe', label: 'StartExecution', sub: '{"orderId": "o-9"}' },
    { id: 'val', x: 280, y: 240, icon: 'lambda', label: 'ValidateOrder', sub: 'Task' },
    { id: 'pay', x: 480, y: 240, icon: 'lambda', label: 'ChargePayment', sub: 'Retry ×3, backoff', at: 1 },
    { id: 'ship', x: 680, y: 140, icon: 'list', label: 'Parallel: ship + email', sub: 'branches', at: 3 },
    { id: 'fail', x: 680, y: 380, icon: 'bug', label: 'RefundAndNotify', sub: 'Catch → compensate', at: 2 },
    { id: 'done', x: 870, y: 240, icon: 'shield', label: 'Succeed', sub: 'execution history', at: 3 }
  ], edges: [{ a: 'start', b: 'val' }, { a: 'val', b: 'pay' }, { a: 'pay', b: 'ship' }, { a: 'pay', b: 'fail' }, { a: 'ship', b: 'done' }] },
  steps: [
    { t: 'State machines', sub: 'States and transitions',
      body: `<p>A definition has <code>StartAt</code> and <code>States</code>. Each state has a <code>Type</code> (<b>Task, Choice, Wait, Parallel, Map, Pass, Succeed, Fail</b>) and either <code>Next</code> or <code>End: true</code>. Every execution's input, output and each step are visible in the console.</p>`,
      analogy: `A <b>board game</b>: squares (states), arrows (Next), and a log of every move.`,
      hook: `<b>StartAt → States → Next … End.</b>`,
      words: ['state machine', 'Amazon States Language', 'StartAt', 'Task', 'Choice', 'End'],
      flow: { from: 'start', to: 'val', label: 'START', detail: ['input {"orderId": "o-9", "total": 250}'], color: 'blue' }, focus: ['start', 'val'],
      cmds: [{ c: 'aws stepfunctions start-execution --state-machine-arn arn:aws:states:ap-southeast-1:111122223333:stateMachine:orders --input \'{"orderId":"o-9","total":250}\'', o: '{\n    "executionArn": "arn:aws:states:ap-southeast-1:111122223333:execution:orders:5c1e…",\n    "startDate": "2026-11-13T21:30:00+08:00"\n}', k: 'cli' }] },
    { t: 'Retry', sub: 'Declarative backoff',
      body: `<p>On a Task: <code>"Retry": [{"ErrorEquals": ["States.TaskFailed"], "IntervalSeconds": 2, "MaxAttempts": 3, "BackoffRate": 2}]</code> retries after 2 s, 4 s, 8 s. Retry transient errors (throttling, timeouts), not validation errors.</p>`,
      analogy: `"If the line is busy, <b>call again in 2, then 4, then 8 minutes</b>."`,
      hook: `<b>ErrorEquals · IntervalSeconds · MaxAttempts · BackoffRate.</b>`,
      words: ['Retry', 'ErrorEquals', 'BackoffRate', 'MaxAttempts', 'States.TaskFailed', 'jitter'],
      flow: { from: 'val', to: 'pay', label: 'RETRY', detail: ['attempt 2 after 4 s'], color: 'amber' }, focus: ['pay'],
      cmds: [{ c: '"ChargePayment": {\n  "Type": "Task",\n  "Resource": "arn:aws:states:::lambda:invoke",\n  "Retry": [{"ErrorEquals": ["States.TaskFailed"], "IntervalSeconds": 2, "MaxAttempts": 3, "BackoffRate": 2}],\n  "Next": "ShipAndEmail"\n}', f: 'orders.asl.json', o: '', k: 'asl' }] },
    { t: 'Catch & compensate', sub: 'The saga pattern',
      body: `<p><code>"Catch": [{"ErrorEquals": ["States.ALL"], "Next": "RefundAndNotify"}]</code> routes failures to a recovery path after retries are exhausted. In a <b>saga</b>, each step has a compensating action (charge → refund, reserve → release), since distributed systems can't roll back like a database.</p>`,
      analogy: `If the hotel is full after the flight is booked, <b>cancel the flight</b>: undo in reverse.`,
      hook: `<b>Retry first, Catch second, compensate always.</b>`,
      words: ['Catch', 'States.ALL', 'saga', 'compensating transaction', 'ResultPath'],
      flow: { from: 'pay', to: 'fail', label: 'CATCH', detail: ['PaymentDeclined → RefundAndNotify'], color: 'red' }, focus: ['pay', 'fail'],
      cmds: [{ c: 'aws stepfunctions get-execution-history --execution-arn $EXEC --query "events[?type==\'TaskFailed\'].taskFailedEventDetails.error"', o: '[\n    "PaymentDeclined"\n]', k: 'cli' }] },
    { t: 'Parallel, Map, Choice, Wait', sub: 'Control flow',
      body: `<p><b>Parallel</b> runs branches at once (ship + email). <b>Map</b> runs a sub-workflow per item (each invoice line; Distributed Map handles millions of S3 objects). <b>Choice</b> branches on data (<code>$.total &gt; 1000</code> → manual review). <b>Wait</b> pauses up to a year at no compute cost. <code>.waitForTaskToken</code> pauses until a human or external system calls back.</p>`,
      analogy: `A <b>recipe</b>: "meanwhile boil the pasta" (Parallel), "for each guest plate a serving" (Map), "if vegan, skip cheese" (Choice).`,
      hook: `<b>Parallel = at once. Map = for each. Choice = if. Wait = later.</b>`,
      words: ['Parallel', 'Map', 'Distributed Map', 'Choice', 'Wait', 'waitForTaskToken'],
      flow: { from: 'pay', to: 'ship', label: 'PARALLEL', detail: ['ship ∥ send email'], color: 'green' }, focus: ['pay', 'ship', 'done'],
      cmds: [{ c: '"CheckTotal": {\n  "Type": "Choice",\n  "Choices": [{"Variable": "$.total", "NumericGreaterThan": 1000, "Next": "ManualReview"}],\n  "Default": "ChargePayment"\n}', f: 'orders.asl.json', o: '', k: 'asl' }] },
    { t: 'Standard vs Express', sub: 'Pick the workflow type',
      body: `<p><b>Standard</b>: up to 1 year, exactly-once steps, full history, billed per state transition. Good for business processes. <b>Express</b>: up to 5 minutes, at-least-once, very high volume, billed per duration. Good for streaming/IoT/API orchestration. Direct <b>SDK integrations</b> (DynamoDB, SQS, Bedrock…) skip glue Lambdas entirely.</p>`,
      analogy: `Standard is <b>registered mail</b> with tracking; Express is <b>bulk mail</b>, fast and cheap.`,
      hook: `<b>Long & audited → Standard. Short & massive → Express.</b>`,
      words: ['Standard workflow', 'Express workflow', 'state transitions', 'SDK integrations', 'Workflow Studio'],
      flow: { from: 'ship', to: 'done', label: 'SUCCEED', detail: ['status: SUCCEEDED · 6 transitions'], color: 'teal' }, focus: ['ship', 'done'],
      cmds: [{ c: 'aws stepfunctions describe-execution --execution-arn $EXEC --query "[status,stopDate]"', o: '[\n    "SUCCEEDED",\n    "2026-11-13T21:30:04+08:00"\n]', k: 'cli' }] }
  ],
  summary: { title: 'You can orchestrate workflows', sub: 'States · Retry · Catch/saga · Parallel/Map/Choice · types', text: `<p>Define states with StartAt, Type and Next/End. Declare Retry (with backoff) for transient errors and Catch to route failures to compensating steps (saga). Use Parallel, Map, Choice and Wait for control flow. Standard for long, audited processes; Express for short, high-volume ones.</p>` },
  quiz: [
    { q: 'Run the same steps for each item in a list:', a: ['Parallel', 'Map', 'Choice', 'Pass'], c: 1, why: 'Map iterates.' },
    { q: 'Route to a refund step when payment fails after retries:', a: ['Retry', 'Catch', 'Wait', 'End'], c: 1, why: 'Catch → Next.' },
    { q: 'Business workflow that may wait days for approval:', a: ['Express', 'Standard', 'SQS', 'Lambda alone'], c: 1, why: 'Standard runs up to a year.' },
    { q: 'BackoffRate 2 with IntervalSeconds 2 gives waits of…', a: ['2, 2, 2', '2, 4, 8', '1, 2, 3', '2, 6, 18'], c: 1, why: 'Interval × rate each time.' }
  ],
  challenge: { task: 'Build the state machine as a Python dict named definition: StartAt "ValidateOrder"; ValidateOrder (Task) → ChargePayment; ChargePayment (Task) needs a Retry on "States.TaskFailed" with MaxAttempts 3 and BackoffRate 2, and a Catch on "States.ALL" going to "RefundAndNotify"; ChargePayment → ShipOrder (Task, End). RefundAndNotify (Task) → Next "OrderFailed", which is a Fail state. Then start it with sfn.start_execution.',
    hint: R`import json, boto3

LAMBDA = "arn:aws:states:::lambda:invoke"
definition = {
    "StartAt": "ValidateOrder",
    "States": {
        "ValidateOrder": {"Type": "Task", "Resource": LAMBDA, "Next": "ChargePayment"},
        "ChargePayment": {
            "Type": "Task", "Resource": LAMBDA,
            "Retry": [{"ErrorEquals": ["States.TaskFailed"], "IntervalSeconds": 2, "MaxAttempts": 3, "BackoffRate": 2}],
            "Catch": [{"ErrorEquals": ["States.ALL"], "Next": "RefundAndNotify"}],
            "Next": "ShipOrder",
        },
        "ShipOrder": {"Type": "Task", "Resource": LAMBDA, "End": True},
        "RefundAndNotify": {"Type": "Task", "Resource": LAMBDA, "Next": "OrderFailed"},
        "OrderFailed": {"Type": "Fail", "Error": "PaymentFailed"},
    },
}

sfn = boto3.client("stepfunctions")
r = sfn.start_execution(stateMachineArn="arn:aws:states:ap-southeast-1:111122223333:stateMachine:orders",
                        input=json.dumps({"orderId": "o-9", "total": 250}))
print(json.dumps(definition, indent=2))
print(r["executionArn"])
`,
    starter: R`import json

definition = {
    "StartAt": "ValidateOrder",
    "States": {
        "ValidateOrder": {"Type": "Task", "Resource": "arn:aws:states:::lambda:invoke", "Next": "ChargePayment"},
        "ChargePayment": {"Type": "Task", "Resource": "arn:aws:states:::lambda:invoke", "Next": "ShipOrder"},
        "ShipOrder": {"Type": "Task", "Resource": "arn:aws:states:::lambda:invoke", "End": True},
    },
}
print(json.dumps(definition, indent=2))
`,
    check: R`(lambda d, S: d.get("StartAt") == "ValidateOrder" and S["ValidateOrder"].get("Next") == "ChargePayment" and any("States.TaskFailed" in r.get("ErrorEquals", []) and r.get("MaxAttempts") == 3 and r.get("BackoffRate") == 2 for r in S["ChargePayment"].get("Retry", [])) and any("States.ALL" in c.get("ErrorEquals", []) and c.get("Next") == "RefundAndNotify" for c in S["ChargePayment"].get("Catch", [])) and S["ChargePayment"].get("Next") == "ShipOrder" and S["ShipOrder"].get("End") is True and S.get("RefundAndNotify", {}).get("Next") == "OrderFailed" and S.get("OrderFailed", {}).get("Type") == "Fail" and len(calls("stepfunctions", "StartExecution")) >= 1)(globals().get("definition", {}), globals().get("definition", {}).get("States", {}))` },
  next: `Retries are great until they create duplicates: two charges, two emails. Next: <b>error handling and idempotency</b>, the most important reliability skill in serverless.`,
  cheat: [['"StartAt" / "States" / "Next" / "End"', 'structure'], ['"Retry": [{ErrorEquals, IntervalSeconds, MaxAttempts, BackoffRate}]', 'retry'], ['"Catch": [{ErrorEquals: ["States.ALL"], Next}]', 'error route'], ['Parallel · Map · Choice · Wait', 'control flow'], ['.waitForTaskToken', 'human approval'], ['Standard (1 yr) vs Express (5 min)', 'types']]
});

/* ============ 10 ERRORS & IDEMPOTENCY ============ */
LESSONS.push({
  id: 'idempotency', num: 10, cat: 'flow', layer: 5, mins: 15,
  title: 'Errors, Retries & Idempotency', short: 'Safe to run twice',
  overview: `<p>In serverless, events are delivered <b>at least once</b> and failures are retried automatically, so your code <b>will</b> sometimes run twice for the same event. <b>Idempotency</b> means running it twice has the same effect as once. Combine it with smart retries, DLQs / on-failure destinations, and clear error types.</p>`,
  hook: `<b>"Assume every event arrives twice."</b>`,
  why: `Double-charging a customer or sending an email five times is how serverless systems lose trust. Interviewers love "how do you make this idempotent?"`,
  scene: { type: 'graph', nodes: [
    { id: 'src', x: 100, y: 240, icon: 'list', label: 'Event (again!)', sub: 'orderId o-9 · retry' },
    { id: 'fn', x: 340, y: 240, icon: 'lambda', label: 'charge()', sub: 'idempotent' },
    { id: 'idem', x: 580, y: 100, icon: 'lock', label: 'idempotency table', sub: 'key = orderId', at: 2 },
    { id: 'pay', x: 820, y: 240, icon: 'key', label: 'Payment API', sub: 'charged ONCE', at: 3 },
    { id: 'dest', x: 580, y: 400, icon: 'bug', label: 'On-failure destination', sub: 'SQS / EventBridge', at: 4 }
  ], edges: [{ a: 'src', b: 'fn' }, { a: 'fn', b: 'idem' }, { a: 'fn', b: 'pay' }, { a: 'fn', b: 'dest' }] },
  steps: [
    { t: 'How Lambda retries', sub: 'Depends on the invocation type',
      body: `<p><b>Synchronous</b> (API Gateway): no automatic retry; the caller sees the error. <b>Asynchronous</b> (S3, SNS, EventBridge): Lambda retries <b>twice</b> more, then sends to an on-failure destination/DLQ. <b>Polling</b> (SQS, Kinesis, DynamoDB Streams): retries until success, expiry or maxReceiveCount.</p>`,
      analogy: `Phone call (sync: you hear the failure), <b>letter</b> (async: post office tries again), <b>conveyor belt</b> (poll: item keeps coming round).`,
      hook: `<b>Sync: caller retries. Async: 2 retries. Poll: until it works or expires.</b>`,
      words: ['synchronous', 'asynchronous', 'event source mapping', 'retry attempts', 'MaximumRetryAttempts'],
      flow: { from: 'src', to: 'fn', label: 'RETRY', detail: ['same event, second delivery'], color: 'amber' }, focus: ['src', 'fn'],
      cmds: [{ c: 'aws lambda put-function-event-invoke-config --function-name raul-charge --maximum-retry-attempts 1 --destination-config \'{"OnFailure":{"Destination":"arn:aws:sqs:ap-southeast-1:111122223333:charge-failures"}}\'', o: '{\n    "MaximumRetryAttempts": 1,\n    "DestinationConfig": {"OnFailure": {"Destination": "arn:aws:sqs:…:charge-failures"}}\n}', k: 'cli' }] },
    { t: 'Idempotency keys', sub: 'Remember what you did',
      body: `<p>Pick a key that's identical across retries: <code>orderId</code>, the SQS <code>messageId</code>, an <code>Idempotency-Key</code> header. Before doing the side effect, <b>record the key</b> with a conditional write (<code>attribute_not_exists</code>). If the record already exists, skip the work and return the previous result.</p>`,
      analogy: `A <b>"PAID" stamp</b> on the invoice: if it's stamped, don't pay it again.`,
      hook: `<b>Same key → same result, no second side effect.</b>`,
      words: ['idempotency key', 'conditional write', 'Idempotency-Key header', 'deduplication'],
      flow: { from: 'fn', to: 'idem', label: 'CLAIM', detail: ['put_item attribute_not_exists(orderId)'], color: 'purple' }, focus: ['fn', 'idem'],
      cmds: [{ c: 'try:\n    IDEM.put_item(Item={"orderId": oid, "status": "DONE"}, ConditionExpression="attribute_not_exists(orderId)")\nexcept ClientError as e:\n    if e.response["Error"]["Code"] == "ConditionalCheckFailedException":\n        return {"status": "duplicate-skipped"}\n    raise', f: 'app.py', o: '', k: 'py' }] },
    { t: 'Side effects once', sub: 'Order of operations',
      body: `<p>Claim the key <b>before</b> the irreversible action (charging, emailing). If the action then fails, delete or mark the claim so a retry can try again. Powertools for AWS Lambda has an <code>@idempotent</code> decorator that does this with a DynamoDB table and expiry.</p>`,
      analogy: `<b>Reserve the seat</b> before printing the ticket.`,
      hook: `<b>Claim → act → mark done (or release on failure).</b>`,
      words: ['side effect', 'Powertools idempotency', '@idempotent', 'expiry', 'in-progress'],
      flow: { from: 'fn', to: 'pay', label: 'CHARGE', detail: ['charged once: $250'], color: 'green' }, focus: ['fn', 'pay'],
      cmds: [{ c: 'from aws_lambda_powertools.utilities.idempotency import idempotent, DynamoDBPersistenceLayer\n\n@idempotent(persistence_store=DynamoDBPersistenceLayer(table_name="idempotency"))\ndef lambda_handler(event, context):\n    return charge(event["orderId"])', f: 'app.py', o: '', k: 'py' }] },
    { t: 'Error types', sub: 'Retryable vs not',
      body: `<p><b>Transient</b> (throttling, timeouts, 5xx from a dependency): retry with backoff. <b>Permanent</b> (bad input, validation, 4xx): don't retry, send to a DLQ or return an error. Raising for a permanent error just burns retries; catching a transient error and returning success loses data.</p>`,
      analogy: `A <b>busy signal</b> is worth redialing; a <b>disconnected number</b> is not.`,
      hook: `<b>Retry the busy signal, park the wrong number.</b>`,
      words: ['transient error', 'permanent error', 'backoff', 'ThrottlingException', 'validation error'],
      flow: { from: 'fn', to: 'dest', label: 'PARK', detail: ['InvalidCard → failure destination'], color: 'red' }, focus: ['fn', 'dest'],
      cmds: [{ c: 'aws logs filter-log-events --log-group-name /aws/lambda/raul-charge --filter-pattern "ThrottlingException"', o: '"message": "[ERROR] ClientError: An error occurred (ThrottlingException) … Rate exceeded"', k: 'err' }] },
    { t: 'Destinations & alarms', sub: 'Never lose a failure',
      body: `<p>For async invocations, <b>on-failure destinations</b> (SQS, SNS, EventBridge, Lambda) receive the event <b>plus</b> error details, which is better than a classic DLQ. Alarm on <code>Errors</code>, <code>Throttles</code>, DLQ depth and <code>AsyncEventsDropped</code>. Every failure should land somewhere a human will see it.</p>`,
      analogy: `A <b>lost-and-found desk</b> with a note saying why each item was lost.`,
      hook: `<b>Every failure has an address and an alarm.</b>`,
      words: ['on-failure destination', 'DLQ', 'CloudWatch alarm', 'Errors metric', 'Throttles'],
      flow: { from: 'dest', to: 'fn', label: 'REPLAY', detail: ['fix bug → redrive failures'], color: 'teal' },
      cmds: [{ c: 'aws cloudwatch put-metric-alarm --alarm-name charge-errors --namespace AWS/Lambda --metric-name Errors --dimensions Name=FunctionName,Value=raul-charge --statistic Sum --period 60 --evaluation-periods 1 --threshold 1 --comparison-operator GreaterThanOrEqualToThreshold --alarm-actions arn:aws:sns:ap-southeast-1:111122223333:alerts', o: '', k: 'cli' }] }
  ],
  summary: { title: 'Your functions are safe to retry', sub: 'Retry behavior · idempotency keys · error types · destinations', text: `<p>Know how each invocation type retries. Make side effects idempotent: claim a stable key with a conditional write before acting and skip duplicates. Retry transient errors, park permanent ones. Use on-failure destinations/DLQs and alarms so no failure is silent.</p>` },
  quiz: [
    { q: 'Async invocations (S3, SNS) are retried by Lambda…', a: ['Never', 'Twice more by default', 'Forever', 'Once per hour'], c: 1, why: 'Then sent to a destination/DLQ.' },
    { q: 'A good idempotency key for an SQS message:', a: ['Current time', 'Random UUID per run', 'messageId or orderId', 'Function name'], c: 2, why: 'Stable across retries.' },
    { q: 'Validation error (bad input). You should…', a: ['Raise to retry', 'Not retry; report/park it', 'Sleep and retry', 'Ignore silently'], c: 1, why: 'Retrying won\u2019t fix bad data.' },
    { q: 'On-failure destinations include…', a: ['Only S3', 'The event plus error details', 'Only metrics', 'Nothing'], c: 1, why: 'Richer than a classic DLQ.' }
  ],
  challenge: { task: 'Make charge(event, context) idempotent: event is {"orderId": ..., "amount": ...}. Claim the orderId in IDEM (table "idempotency") with ConditionExpression attribute_not_exists(orderId) BEFORE calling pay(). If it already exists, return {"status": "duplicate"} without paying. Otherwise call pay(order_id, amount) and return {"status": "charged"}. Calling it twice must charge only once.',
    hint: R`import boto3
from botocore.exceptions import ClientError

IDEM = boto3.resource("dynamodb").Table("idempotency")
PAYMENTS = []

def pay(order_id, amount):
    PAYMENTS.append((order_id, amount))      # pretend payment API

def charge(event, context):
    oid = event["orderId"]
    try:
        IDEM.put_item(Item={"orderId": oid, "status": "IN_PROGRESS"},
                      ConditionExpression="attribute_not_exists(orderId)")
    except ClientError as e:
        if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
            return {"status": "duplicate"}
        raise
    pay(oid, event["amount"])
    return {"status": "charged"}

ev = {"orderId": "o-9", "amount": 250}
print(charge(ev, context), charge(ev, context), PAYMENTS)
`,
    starter: R`import boto3
from botocore.exceptions import ClientError

IDEM = boto3.resource("dynamodb").Table("idempotency")
PAYMENTS = []

def pay(order_id, amount):
    PAYMENTS.append((order_id, amount))      # pretend payment API

def charge(event, context):
    pay(event["orderId"], event["amount"])   # retries = double charges!
    return {"status": "charged"}

ev = {"orderId": "o-9", "amount": 250}
print(charge(ev, context), charge(ev, context), PAYMENTS)
`,
    check: R`_t(lambda: (PAYMENTS.clear(), [charge({"orderId": "o-77", "amount": 5}, context)["status"], charge({"orderId": "o-77", "amount": 5}, context)["status"], charge({"orderId": "o-78", "amount": 1}, context)["status"]] == ["charged", "duplicate", "charged"] and PAYMENTS == [("o-77", 5), ("o-78", 1)])[1])` },
  next: `Your functions are reliable. Can you <b>see</b> what they're doing? Next: <b>observability</b>: structured logs, metrics, traces and Powertools.`,
  cheat: [['sync / async / poll', 'retry behavior'], ['attribute_not_exists(key)', 'claim once'], ['@idempotent (Powertools)', 'decorator'], ['transient → retry · permanent → park', 'error policy'], ['OnFailure destination', 'async failures'], ['Errors / Throttles alarms', 'watch']]
});
