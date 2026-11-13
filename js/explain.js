window.EXPLAIN = {
"what-is-serverless": [
 ["A single Lambda invocation can run for at most 15 minutes (900 seconds). Longer jobs belong on Fargate, ECS, AWS Batch, or broken into Step Functions steps.", ["5 minutes was the old limit before 2018.", null, "Anything over 15 minutes is stopped with a timeout.", "Lambda always has a hard maximum timeout."]],
 ["Lambda bills per request plus GB-seconds: memory allocated times execution time (per millisecond). Idle time costs nothing.", ["Instance-hours is EC2 pricing.", null, "vCPU-days isn't a Lambda billing unit.", "There's no flat fee; you pay per use."]],
 ["AWS patches the operating system and managed runtimes. You own your code, its dependencies, configuration and IAM permissions.", ["You never get access to the Lambda OS.", null, "Patching is part of AWS's side of the model.", "Your team owns the code, not the OS."]],
 ["A 3-hour render exceeds the 15-minute limit, so it's a job for Fargate, AWS Batch or EC2. The other examples are short and event-driven, which is ideal for Lambda.", ["Webhooks are short, event-driven requests, a perfect fit.", "A 5-minute scheduled job fits well within 15 minutes.", null, "Thumbnails are a classic S3-triggered Lambda use case."]]
],
"handler": [
 ["Code outside the handler runs once per execution environment (the init phase) and is reused by warm invocations, so create SDK clients and connections there.", ["Inside the handler it's recreated on every request, which is slower.", null, "The event is input data, not a place for code.", "CloudWatch stores logs; it doesn't run your setup code."]],
 ["With proxy integration, event[\"body\"] is a JSON string (possibly base64-encoded), so parse it with json.loads before use.", ["It's not parsed into a dict for you.", null, "It's bytes only when isBase64Encoded is true, and even then it's encoded text.", "API Gateway sends JSON, not XML."]],
 ["context.get_remaining_time_in_millis() tells you how long is left before the timeout, so you can stop cleanly and save progress.", [null, "The event doesn't include the timeout.", "Environment variables don't count down.", "Sleeping wastes time and money."]],
 ["A cold start happens when Lambda creates a new execution environment: it downloads code, starts the runtime and runs init code. Warm environments skip this.", ["Warm invocations reuse environments; not every request is cold.", null, "Errors don't necessarily trigger new environments.", "Memory settings affect speed, not whether a start is cold."]]
],
"config": [
 ["Lambda allocates CPU in proportion to memory (a full vCPU at about 1,769 MB), so more memory often makes functions faster and sometimes cheaper.", ["Timeout is set separately.", null, "Concurrency limits are separate settings.", "The free tier doesn't change."]],
 ["Reserved concurrency caps how many copies run at once, protecting a downstream database. It also guarantees that capacity for the function.", ["Provisioned concurrency pre-warms environments; it doesn't cap load.", null, "More memory increases per-invocation power, not limits.", "A longer timeout can make overload worse."]],
 ["Provisioned concurrency keeps a set number of environments initialized and ready, removing cold starts for those requests (at extra cost).", ["Reserved concurrency caps capacity but doesn't pre-warm.", null, "Layers share code; they don't affect cold starts.", "$LATEST is the unpublished version."]],
 ["A weighted alias splits traffic between two published versions (e.g. 90/10) for canary releases; CodeDeploy can shift the weights automatically.", [null, "Environment variables configure code, not traffic.", "Layers package dependencies.", "Tags are metadata."]]
],
"api-gateway": [
 ["API Gateway delivers the request body as a string; JSON payloads must be parsed with json.loads(event[\"body\"]).", ["The body isn't pre-parsed into a dict.", null, "It's None only when there's no body, as with most GETs.", "JSON APIs don't use XML."]],
 ["201 Created is the right status when a POST creates a new resource, ideally with the new ID in the response or a Location header.", ["200 OK is generic success; 201 is more precise for creation.", null, "204 means success with no response body.", "302 is a redirect."]],
 ["Invalid input is the client's fault, so return 400 Bad Request with a helpful message. 5xx codes mean the server failed.", ["500 tells clients your server broke.", null, "201 would accept bad data.", "404 means the resource wasn't found."]],
 ["CORS headers (Access-Control-Allow-Origin and friends) let browsers on another domain call your API. Configure them on the API or return them from the function.", ["Throttling limits request rates.", null, "Concurrency is a Lambda setting.", "Versions are for deployments."]]
],
"dynamodb": [
 ["query reads only items with one partition key value, efficient and cheap. scan reads the whole table and then filters.", ["scan reads every item, which is slow and costly at scale.", null, "get_item fetches exactly one item by its full key.", "Exports are for analytics, not app reads."]],
 ["put_item replaces any existing item with the same key. Add ConditionExpression=\"attribute_not_exists(pk)\" to make it fail instead.", ["It succeeds silently unless you add a condition.", null, "Keys are unique; there are no duplicates.", "It replaces the whole item; it doesn't merge attributes."]],
 ["update_item with ADD (or SET x = x + :n) changes the value atomically on the server, so concurrent requests never lose updates.", ["Get-then-put loses updates when two requests race.", null, "scan is a read operation.", "Delete-and-put loses data and isn't atomic."]],
 ["A Global Secondary Index has its own partition key (like status), so you can query by that attribute efficiently.", [null, "Size doesn't help find items by another attribute.", "Layers share code, not indexes.", "SQS is a queue."]]
],
"s3-events": [
 ["S3 notifications include the bucket name, object key, size and event type, not the file contents. Download it with get_object if needed.", ["Files can be huge; events stay small.", null, "The ETag is included but isn't all there is.", "The event carries useful metadata."]],
 ["Keys in S3 events are URL-encoded, and spaces arrive as +. Use urllib.parse.unquote_plus to get the real key, \"my file.csv\".", ["That's the encoded form.", null, "That would be the encoding of a real + sign.", "Spaces aren't removed."]],
 ["If the function writes its output into the bucket that triggers it, every write fires another invocation: an infinite loop and a surprise bill. Use a separate output bucket or prefix filter.", ["It doesn't make anything faster.", null, "Encryption is unrelated.", "It definitely causes something: recursion."]],
 ["S3 can deliver an event more than once. Using the object key as the item ID makes the write idempotent, because duplicates overwrite the same row.", ["Length isn't the reason.", null, "S3 doesn't require it.", "Idempotency isn't encryption."]]
],
"sqs": [
 ["If the handler raises, Lambda treats the whole batch as failed and every message becomes visible again, including the good ones, so they're processed twice.", ["Only with partial batch responses is just the failed one retried.", null, "Messages are deleted only after success.", "Retries do happen."]],
 ["With ReportBatchItemFailures enabled, return {\"batchItemFailures\": [{\"itemIdentifier\": messageId}]}; only those messages are retried.", ["Lambda ignores custom field names.", null, "Raising fails the whole batch.", "Status codes are for HTTP, not SQS."]],
 ["FIFO queues guarantee order within a MessageGroupId (e.g. the customer ID) and deduplicate messages. Standard queues are best-effort ordering.", ["Standard queues don't guarantee order.", null, "SNS is pub/sub without per-group ordering (unless SNS FIFO).", "S3 isn't a messaging service."]],
 ["The redrive policy moves a message to the dead-letter queue after it has been received maxReceiveCount times without being deleted.", ["It's based on receive count, not elapsed time.", null, "Visibility timeout decides when a retry happens, not when to give up.", "With a DLQ configured, failing messages do move."]]
],
"events": [
 ["EventBridge rules use event patterns that match on content: source, detail-type and any field inside detail.", ["EventBridge rules don't target queue names.", null, "Rules don't match on IP addresses.", "The Lambda is a target, not a match criterion."]],
 ["SNS fanning out to three SQS queues gives each consumer its own durable buffer: if one service is down, its messages wait in its queue.", ["Direct invokes have no buffer if a consumer fails.", null, "One shared queue gives each message to only one consumer.", "S3 isn't a messaging fan-out."]],
 ["Each PutEvents entry needs Source, DetailType and Detail, and Detail must be a JSON string, so use json.dumps(dict).", ["Passing a dict causes a validation error.", null, "XML isn't accepted.", "No base64 is needed."]],
 ["EventBridge Scheduler (or a scheduled rule) supports cron expressions like cron(0 8 ? * MON-FRI *), with time zones.", ["SQS delay is at most 15 minutes and isn't a scheduler.", null, "S3 triggers on object events.", "Step Functions runs workflows; it needs a scheduler to start them on a timetable."]]
],
"step-functions": [
 ["A Map state runs the same steps for each item in an array, optionally in parallel with a concurrency limit.", ["Parallel runs different branches at the same time.", null, "Choice picks a path based on data.", "Pass just passes data through."]],
 ["Catch handles errors that remain after Retry gives up and sends the execution to a recovery state such as Refund.", ["Retry tries again; it doesn't route elsewhere.", null, "Wait pauses for a time.", "End finishes the workflow."]],
 ["Standard workflows can run for up to one year with exactly-once execution, which suits human approvals using callback tokens.", ["Express workflows run at most 5 minutes.", null, "SQS isn't a workflow engine.", "Lambda alone stops at 15 minutes."]],
 ["Each retry waits IntervalSeconds times BackoffRate to the power of the attempt: 2, 4, 8 seconds (exponential backoff).", ["That would be BackoffRate 1.", null, "That's linear growth.", "That would be BackoffRate 3."]]
],
"idempotency": [
 ["For asynchronous invocations, Lambda retries failed events two more times by default, then sends them to an on-failure destination or DLQ if configured.", ["Async events are retried.", null, "Retries are limited.", "Retries happen within minutes, not hourly."]],
 ["Use an identifier that stays the same across retries, such as the messageId or the business orderId, so duplicates can be detected and skipped.", ["Time changes on every retry.", "A new UUID per run defeats the purpose.", null, "The function name is the same for every message."]],
 ["Retrying invalid data fails every time, wasting money. Send it to a DLQ or error store for humans and acknowledge the message.", ["Retrying bad input just repeats the failure.", null, "Sleeping doesn't fix data.", "Silent drops hide bugs."]],
 ["On-failure destinations receive the original event plus error details (type, message, stack trace), more context than a classic DLQ, which stores only the event.", ["Destinations can be SQS, SNS, Lambda, EventBridge or S3.", null, "They include the event, not just metrics.", "They deliver rich failure records."]]
],
"observability": [
 ["Structured JSON logs (one object per line with fields like order_id and duration) can be filtered and aggregated with CloudWatch Logs Insights.", ["Free text is hard to query.", null, "XML is verbose and rarely used for logs.", "CSV breaks when fields change."]],
 ["X-Ray traces show each downstream call (DynamoDB, HTTP, SQS) as a segment with its latency, so you can see exactly which one is slow.", ["Logs show events, not timing per call.", null, "Billing doesn't show latency.", "IAM is about permissions."]],
 ["Embedded Metric Format writes metrics as specially formatted log lines; CloudWatch extracts them asynchronously, with no PutMetricData API calls or latency.", ["Calling the API on each invocation adds latency and cost.", null, "S3 isn't a metrics system.", "SNS sends notifications."]],
 ["Logs are read by many people and tools and kept for a long time, so never log passwords, tokens, keys or personal data.", ["Request IDs are essential for correlation.", "Business IDs help debugging.", null, "Duration is a useful performance field."]]
],
"sls-security": [
 ["Secrets Manager stores secrets encrypted with KMS, controls access with IAM and supports automatic rotation; the function reads it at runtime.", ["Environment variables are visible to anyone with console or Lambda read access.", "Code ends up in Git.", null, "Function names are public metadata."]],
 ["Fetch the secret once per execution environment and cache it (refreshing on errors or rotation), which is faster and cheaper than a call per request.", ["Fetching on every invocation adds latency and API cost.", null, "You do need the secret.", "Every second is wasteful polling."]],
 ["Add SourceArn (your bucket) and SourceAccount conditions to the Lambda permission so only your resources can invoke it (confused-deputy protection).", ["Memory doesn't control who can invoke.", null, "X-Ray traces calls; it doesn't authorize them.", "Layers share code."]],
 ["AuthType NONE makes the function URL publicly callable by anyone who knows it. Use AWS_IAM, or validate auth inside the function.", ["NONE is the opposite of private.", null, "IAM auth is AuthType AWS_IAM.", "The URL is active."]]
],
"patterns": [
 ["Putting SQS between the API and Lambda absorbs spikes; the consumer drains the queue at a rate the database can handle (queue-based load leveling).", ["Bigger functions still hit the database all at once.", null, "Scanning adds load.", "A public URL doesn't control load."]],
 ["Step Functions orchestration gives explicit retries, error handling and compensating steps (the saga pattern) for multi-step transactions like payments.", ["Choreography can work, but compensation logic gets scattered and hard to see.", null, "S3 events don't coordinate multi-step flows.", "Cron schedules timing, not workflows."]],
 ["CloudWatch Logs keeps data forever by default, and ingestion plus storage add up. Set a retention period on every log group.", ["IAM roles are free.", null, "Environment variables are free.", "Aliases are free."]],
 ["An idempotent API stores the result for each Idempotency-Key and returns the same response for retries, without charging twice or creating a duplicate.", ["Duplicate orders are exactly what to prevent.", null, "A retry isn't an error.", "Deleting would be destructive."]]
]
};

/* merge into the lessons (loaded after lessons, before app.js) */
(function (E) { (window.LESSONS || []).forEach(l => { const x = E[l.id]; if (!x || !l.quiz) return; x.forEach((e, i) => { const q = l.quiz[i]; if (!q || !e) return; if (e[0]) q.why = e[0]; if (e[1]) q.w = e[1]; }); }); })(window.EXPLAIN || {});
