window.COURSE = {
 "short": "SLS",
 "key": "serverless-explorer-v1",
 "prompt": "$",
 "termTitle": "aws cli",
 "where": "CLI",
 "lab": "python",
 "handsOn": "Lambda Lab challenge",
 "errRe": "Traceback|Task timed out|ThrottlingException|error occurred|Error:|\\[ERROR\\]",
 "cats": [
  [
   "all",
   "ALL"
  ],
  [
   "core",
   "LAMBDA"
  ],
  [
   "data",
   "DATA"
  ],
  [
   "msg",
   "MESSAGING"
  ],
  [
   "flow",
   "WORKFLOWS"
  ],
  [
   "prod",
   "PRODUCTION"
  ]
 ],
 "catTitle": {
  "core": "LAMBDA & API",
  "data": "DATA & FILES",
  "msg": "QUEUES & EVENTS",
  "flow": "WORKFLOWS & RELIABILITY",
  "prod": "PRODUCTION READY"
 },
 "kinds": {
  "cli": [
   "AWS CLI",
   "#1d5bd8"
  ],
  "py": [
   "PYTHON",
   "#7c3aed"
  ],
  "logs": [
   "LOGS",
   "#0d9488"
  ],
  "http": [
   "HTTP",
   "#0891b2"
  ],
  "asl": [
   "STATES LANG",
   "#db2777"
  ],
  "err": [
   "FAILURE",
   "#e11d48"
  ]
 },
 "layers": [
  "FUNDAMENTALS",
  "CONFIG & API",
  "DATA & QUEUES",
  "EVENTS & FLOWS",
  "RELIABILITY",
  "PRODUCTION"
 ],
 "levels": [
  [
   0,
   "COLD START"
  ],
  [
   150,
   "WARM HANDLER"
  ],
  [
   400,
   "EVENT WRANGLER"
  ],
  [
   800,
   "QUEUE MASTER"
  ],
  [
   1300,
   "WORKFLOW BUILDER"
  ],
  [
   2000,
   "SERVERLESS ENGINEER"
  ],
  [
   2900,
   "SERVERLESS ARCHITECT"
  ]
 ],
 "defaultCode": "# Lambda Lab: real Python + a fake AWS. Try:\ndef lambda_handler(event, context):\n    return {\"statusCode\": 200, \"body\": \"hi\"}\n\ninvoke(lambda_handler, events[\"api\"])\nprint(list(events))\n"
};
COURSE.errRe = new RegExp(COURSE.errRe, "i");
