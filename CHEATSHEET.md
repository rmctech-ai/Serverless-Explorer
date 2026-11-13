# Serverless Cheat Sheet

_Auto-generated from the Serverless Explorer lessons. One master memory hook + the key commands per lesson._

## 01 · What is Serverless?

> ★ "No servers to babysit, pay for what runs."

| Command | What it does |
|---|---|
| `def lambda_handler(event, context):` | entry point |
| `return {"statusCode": 200, "body": "…"}` | API response |
| `aws lambda invoke --function-name f out.json` | test invoke |
| `15 min · 10 GB · 6 MB` | key limits |
| `$0.20/1M requests + GB-s` | pricing |

**Memory hooks:**

- **Servers you never see**: You own the code; AWS owns the computer.
- **Event-driven**: No event, no run, no bill.
- **Pay per use**: Memory × time × calls.
- **The serverless toolbox**: Compute · Front door · Data · Messaging · Orchestration.
- **When NOT serverless**: 15 minutes, stateless, bursty = Lambda sweet spot.

## 02 · Handler Anatomy & Cold Starts

> ★ "Init once, handle many."

| Command | What it does |
|---|---|
| `event["Records"][0]["s3"]["object"]["key"]` | S3 key |
| `json.loads(event["body"])` | API body |
| `context.aws_request_id` | request ID |
| `TOP-LEVEL client = boto3.client(...)` | init once |
| `os.environ["TABLE_NAME"]` | config |
| `aws logs tail /aws/lambda/fn --follow` | live logs |

**Memory hooks:**

- **The event**: Print the event first. Always.
- **The context**: request_id for logs, remaining_time for safety.
- **Init vs invoke**: Heavy setup at the top, light work in the handler.
- **Environment variables**: Names in env vars, secrets in Secrets Manager.
- **print() → CloudWatch**: START · your logs · END · REPORT.

## 03 · Memory, Timeout, Concurrency & Versions

> ★ "More memory = more CPU = often cheaper."

| Command | What it does |
|---|---|
| `--memory-size 1024` | more CPU |
| `--timeout 30` | seconds (max 900) |
| `put-function-concurrency` | reserved cap |
| `put-provisioned-concurrency-config` | pre-warm |
| `publish-version` | freeze |
| `update-alias --routing-config` | canary split |

**Memory hooks:**

- **Memory = CPU**: Tune memory by measurement, not by guess.
- **Timeout**: 3 s default. Realistic worst case + margin.
- **Concurrency**: Reserved caps & guarantees. Provisioned pre-warms.
- **Versions**: $LATEST = draft. Numbers = frozen.
- **Aliases & canaries**: Triggers call the alias; the alias picks the version.

## 04 · API Gateway + Lambda

> ★ "Parse in, validate, act, return JSON string out."

| Command | What it does |
|---|---|
| `json.loads(event.get("body") or "{}")` | parse body |
| `{"statusCode": 201, "headers": {...}, "body": json.dumps(d)}` | response |
| `400 / 401 / 403 / 404 / 409 / 500` | status codes |
| `event["pathParameters"]["id"]` | path param |
| `JWT authorizer` | auth |
| `Function URL` | simple endpoint |

**Memory hooks:**

- **Routes & integrations**: Route = method + path → integration.
- **Parse the body**: body is a string → json.loads → dict.
- **Return a response**: body = json.dumps(…). Status tells the story.
- **Validate input**: Validate first, act second.
- **Auth, throttling, CORS**: Auth · Throttle · CORS before go-live.

## 05 · DynamoDB for Serverless

> ★ "Know your questions before you design the table."

| Command | What it does |
|---|---|
| `table.get_item(Key={"id": x})` | one item |
| `table.query(KeyConditionExpression=Key("pk").eq(v))` | a partition |
| `ConditionExpression="attribute_not_exists(id)"` | create-only |
| `ConditionalCheckFailedException` | → 409 |
| `UpdateExpression="ADD n :one"` | atomic counter |
| `scan()` | avoid in request path |

**Memory hooks:**

- **Items & keys**: PK picks the drawer, SK sorts the folders.
- **get_item vs query vs scan**: Get one, query a drawer, never scan in prod.
- **Conditional writes**: attribute_not_exists = create-only.
- **Updates & counters**: SET to change, ADD to count.
- **Design for access patterns**: Access patterns → keys → GSIs.

## 06 · S3 Event Triggers

> ★ "The event is a pointer, not the package."

| Command | What it does |
|---|---|
| `for rec in event["Records"]:` | loop records |
| `unquote_plus(rec["s3"]["object"]["key"])` | decode key |
| `s3.get_object(Bucket=b, Key=k)["Body"].read()` | download |
| `prefix / suffix filters` | limit triggers |
| `output bucket ≠ trigger bucket` | avoid loops |

**Memory hooks:**

- **Configure the trigger**: Event type + prefix + suffix = only the files you want.
- **Read the record**: unquote_plus the key. Every time.
- **Fetch the object**: Metadata in the event; content via get_object.
- **Record the result**: Key as ID = duplicate-safe.
- **The infinite loop trap**: Output bucket ≠ input bucket.

## 07 · SQS + Lambda: Queues Done Right

> ★ "Queue it, batch it, retry it, dead-letter it."

| Command | What it does |
|---|---|
| `sqs.send_message(QueueUrl=u, MessageBody=json.dumps(m))` | produce |
| `for rec in event["Records"]: json.loads(rec["body"])` | consume |
| `{"batchItemFailures": [{"itemIdentifier": id}]}` | partial failure |
| `--function-response-types ReportBatchItemFailures` | enable it |
| `VisibilityTimeout ≥ 6 × fn timeout` | rule of thumb |
| `RedrivePolicy maxReceiveCount` | DLQ |

**Memory hooks:**

- **Why a queue**: Standard = fast, maybe twice. FIFO = in order, once.
- **Batches**: One invocation, many messages.
- **Visibility & retries**: Exception = whole batch back in line.
- **Partial batch failures**: Catch per message, report only the failures.
- **Dead-letter queue**: Every queue gets a DLQ and an alarm.

## 08 · SNS & EventBridge: Fan-out and Event Buses

> ★ "Publish facts, let others subscribe."

| Command | What it does |
|---|---|
| `sns.publish(TopicArn=t, Message=m)` | pub/sub |
| `events.put_events(Entries=[{Source, DetailType, Detail}])` | emit event |
| `{"source": ["x"], "detail-type": ["Y"]}` | event pattern |
| `{"numeric": [">", 1000]}` | numeric match |
| `cron(0 8 ? * MON-FRI *)` | schedule |
| `SNS → SQS` | durable fan-out |

**Memory hooks:**

- **Commands vs events**: Events are past-tense facts: OrderPlaced, InvoicePaid.
- **SNS fan-out**: SNS → many SQS queues = durable fan-out.
- **EventBridge events & rules**: source + detail-type + detail = what rules match on.
- **AWS & SaaS events, schedules**: Schedules + AWS events + your events, one bus.
- **Publishing from code**: Detail = json.dumps(dict). Check FailedEntryCount.

## 09 · Step Functions: Workflows

> ★ "Lambdas do the steps; Step Functions remembers the plan."

| Command | What it does |
|---|---|
| `"StartAt" / "States" / "Next" / "End"` | structure |
| `"Retry": [{ErrorEquals, IntervalSeconds, MaxAttempts, BackoffRate}]` | retry |
| `"Catch": [{ErrorEquals: ["States.ALL"], Next}]` | error route |
| `Parallel · Map · Choice · Wait` | control flow |
| `.waitForTaskToken` | human approval |
| `Standard (1 yr) vs Express (5 min)` | types |

**Memory hooks:**

- **State machines**: StartAt → States → Next … End.
- **Retry**: ErrorEquals · IntervalSeconds · MaxAttempts · BackoffRate.
- **Catch & compensate**: Retry first, Catch second, compensate always.
- **Parallel, Map, Choice, Wait**: Parallel = at once. Map = for each. Choice = if. Wait = later.
- **Standard vs Express**: Long & audited → Standard. Short & massive → Express.

## 10 · Errors, Retries & Idempotency

> ★ "Assume every event arrives twice."

| Command | What it does |
|---|---|
| `sync / async / poll` | retry behavior |
| `attribute_not_exists(key)` | claim once |
| `@idempotent (Powertools)` | decorator |
| `transient → retry · permanent → park` | error policy |
| `OnFailure destination` | async failures |
| `Errors / Throttles alarms` | watch |

**Memory hooks:**

- **How Lambda retries**: Sync: caller retries. Async: 2 retries. Poll: until it works or expires.
- **Idempotency keys**: Same key → same result, no second side effect.
- **Side effects once**: Claim → act → mark done (or release on failure).
- **Error types**: Retry the busy signal, park the wrong number.
- **Destinations & alarms**: Every failure has an address and an alarm.

## 11 · Observability: Logs, Metrics, Traces

> ★ "Logs tell the story, metrics sound the alarm, traces show the path."

| Command | What it does |
|---|---|
| `print(json.dumps({...}))` | structured log |
| `fields … \| filter … \| stats count()` | Logs Insights |
| `Errors · Throttles · Duration · IteratorAge` | key metrics |
| `--tracing-config Mode=Active` | X-Ray |
| `Logger · Metrics · Tracer` | Powertools |
| `retention-in-days` | cap log cost |

**Memory hooks:**

- **Structured logging**: One JSON object per log line, with request_id.
- **Logs Insights**: fields · filter · stats · sort · limit.
- **Metrics & alarms**: Errors · Throttles · Duration p99 · DLQ depth.
- **Tracing with X-Ray**: Logs say what, traces say where.
- **Powertools for AWS Lambda**: Logger · Metrics · Tracer · Idempotency · Batch.

## 12 · Serverless Security

> ★ "Small functions, small roles, no secrets in code."

| Command | What it does |
|---|---|
| `one role per function` | least privilege |
| `SM.get_secret_value(SecretId=…) cached` | secrets |
| `never print(creds)` | no leaks |
| `validate type/length/allow-list` | input |
| `SourceArn condition` | invoke policy |
| `AuthType AWS_IAM` | safe Function URL |

**Memory hooks:**

- **One role per function**: One function, one role, named resources.
- **Secrets done right**: Fetch once, cache, never log, rotate.
- **Validate every input**: Type · length · allow-list · reject early.
- **Who can invoke?**: Principal + SourceArn. URLs default to IAM.
- **Supply chain & runtime hygiene**: Scan deps · current runtime · sign · least network.

## 13 · Patterns, Cost & Capstone

> ★ "Validate → persist once → announce → respond."

| Command | What it does |
|---|---|
| `API → SQS → Lambda` | load leveling |
| `SNS/EventBridge → queues` | fan-out |
| `events between domains, Step Functions within` | rule of thumb |
| `Budgets + log retention` | cost control |
| `validate → persist once → announce → respond` | recipe |
| `sam build && sam deploy --guided` | ship it |

**Memory hooks:**

- **Core patterns**: Sync · Queue · Fan-out · Storage-first · CQRS.
- **Choreography vs orchestration**: Between teams: events. Inside a process: Step Functions.
- **Cost traps**: Logs · NAT · loops · scans · budgets.
- **The capstone flow**: Validate → persist once → announce → respond.
- **Ship it with IaC**: Code it, pipeline it, alarm it, then show it off.

